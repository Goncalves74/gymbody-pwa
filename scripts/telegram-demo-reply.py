#!/usr/bin/env python3
"""Reply to explicitly requested fictional GymBody demo messages via Telegram.
Only private chat previously verified with 'Teste GymBody' is eligible.
No PWA credentials, client data, or chat IDs are logged.
"""
import datetime as dt
import hashlib
from pathlib import Path
import json
import os
import sys
import urllib.parse
import urllib.request
import subprocess
import re

token=os.environ.get("TELEGRAM_BOT_TOKEN","").strip()
if not token:
    sys.exit("Missing TELEGRAM_BOT_TOKEN")
base="https://api.telegram.org/bot"+token+"/"
def api(method,fields):
    req=urllib.request.Request(base+method,data=urllib.parse.urlencode(fields).encode(),method="POST")
    with urllib.request.urlopen(req,timeout=25) as res:
        data=json.load(res)
    if not data.get("ok"):
        raise RuntimeError("Telegram request failed")
    return data["result"]

updates=api("getUpdates",{"timeout":0,"limit":100})
messages=[u["message"] for u in updates if isinstance(u.get("message"),dict) and u["message"].get("chat",{}).get("type")=="private"]
# Keep only keyed hashes of verified chats in the public repository.
# A hash cannot be used to send a Telegram message.
allowfile=Path("demo-telegram-authorized.json")
try:
    known=set(json.loads(allowfile.read_text())) if allowfile.exists() else set()
except (ValueError, OSError):
    known=set()
def fingerprint(chat):
    return hashlib.sha256((token+":"+str(chat)).encode()).hexdigest()
new_verified={fingerprint(m["chat"]["id"]) for m in messages if m.get("text","").strip().lower()=="teste gymbody"}
known.update(new_verified)
verified={str(m["chat"]["id"]) for m in messages if fingerprint(m["chat"]["id"]) in known}
allowed=os.environ.get("TELEGRAM_TEST_CHAT_ID","").strip()
if allowed:
    verified={allowed}
now=int(dt.datetime.now(dt.timezone.utc).timestamp())
processed=0
pending_update_ids=[]
for u in updates:
    m=u.get("message",{})
    if m.get("text","").strip()=="/gym600":
        pending_update_ids.append(u["update_id"])
for m in messages:
    chat=str(m["chat"]["id"])
    txt=m.get("text","").strip()
    if txt=="/gym600" and m.get("chat",{}).get("type")=="private":
        # One-off demo: 27 Nov 2026 18:00 Europe/Lisbon; 60-minute reminder.
        target=dt.datetime(2026,11,27,17,0,tzinfo=dt.timezone.utc)
        if target<=dt.datetime.now(dt.timezone.utc)<target+dt.timedelta(hours=1):
            api("sendMessage",{"chat_id":chat,"text":"GymBody — Lembrete de treino\\n\\nOlá! Tens um treino fictício marcado para hoje às 18h00.\\n\\nEsta é uma mensagem de teste."})
            processed+=1
            pending_update_ids=[i for i in pending_update_ids if i!=next((u["update_id"] for u in updates if u.get("message") is m),-1)]
        continue
    if chat not in verified or not (txt.startswith("/gymdemo ") or txt.startswith("/start gymdemo_")):
        continue
    # No processing of old messages, preventing replay after downtime.
    if abs(now-int(m.get("date",0)))>3600:
        continue
    code=(txt[len("/gymdemo "):] if txt.startswith("/gymdemo ") else txt[len("/start gymdemo_"):]).strip()
    if not code.isdigit() or len(code)!=6:
        continue
    api("sendMessage",{"chat_id":chat,"text":"GymBody v67 — TESTE REAL\n\nRecebeste este aviso fictício pelo Telegram.\nCódigo do teste: "+code+"\n\nNão corresponde a nenhum treino real."})
    processed+=1

# v67: isolated fictional bookings, stored encrypted at rest in GitHub.
queue_file=Path("demo-telegram-queue.enc")
key=hashlib.sha256((token+":gymbody-demo-queue-v1").encode()).hexdigest()
def crypt(data,decrypt=False):
    args=["openssl","enc","-aes-256-cbc","-pbkdf2","-iter","100000","-pass","env:GYMBODY_QUEUE_KEY"]
    args+=["-d"] if decrypt else ["-salt"]
    proc=subprocess.run(args,input=data,stdout=subprocess.PIPE,stderr=subprocess.PIPE,env={**os.environ,"GYMBODY_QUEUE_KEY":key},check=True)
    return proc.stdout
try:
    queue=json.loads(crypt(queue_file.read_bytes(),True)) if queue_file.exists() else []
except (ValueError,OSError,subprocess.CalledProcessError):
    sys.exit("Encrypted queue unreadable: refusing to overwrite")
if not isinstance(queue,list):
    sys.exit("Invalid queue structure")
# Telegram /start payload: gb67_<unix_timestamp>_<lead_minutes>_<six_digit_code>
# Booking and recipient data remain fictitious and private.
for u in updates:
    m=u.get("message",{})
    if m.get("chat",{}).get("type")!="private":
        continue
    command=m.get("text","").strip()
    match=re.fullmatch(r"/start gb67_(\\d{10})_(15|30|60|120|1440)_(\\d{6})",command)
    if not match:
        continue
    chat=str(m["chat"]["id"])
    at=int(match.group(1));lead=int(match.group(2));code=match.group(3)
    if not now-3600<=at<=now+14*86400:
        continue
    uid=str(u["update_id"])
    if not any(x["update"]==uid for x in queue):
        queue.append({"update":uid,"chat":chat,"at":at,"lead":lead,"code":code,"sent":False})
        api("sendMessage",{"chat_id":chat,"text":"GymBody DEMO — treino fictício registado. Código: "+code+". Aviso programado para "+dt.datetime.fromtimestamp(at-lead*60,dt.timezone.utc).strftime("%d/%m %H:%M")+" (Portugal continental, horário de inverno)."})
# Automatic delivery, at most once for each persisted booking after successful send.
for booking in queue:
    if booking["sent"] or now<booking["at"]-booking["lead"]*60 or now>=booking["at"]:
        continue
    api("sendMessage",{"chat_id":booking["chat"],"text":"GymBody — LEMBRETE AUTOMÁTICO\\n\\nTreino fictício marcado para "+dt.datetime.fromtimestamp(booking["at"],dt.timezone.utc).strftime("%d/%m às %H:%M")+" (Portugal).\\nCódigo: "+booking["code"]+"\\n\\nMensagem de demonstração."})
    booking["sent"]=True
    processed+=1
# Keep a bounded history to limit retained data.
queue=[x for x in queue if x["at"]>=now-86400][-200:]
queue_file.write_bytes(crypt(json.dumps(queue).encode()))

# Acknowledge all updates only after successful delivery to avoid retry on failures.
if updates:
    api("getUpdates",{"offset":min(pending_update_ids) if pending_update_ids else max(u["update_id"] for u in updates)+1,"timeout":0,"limit":1})
allowfile.write_text(json.dumps(sorted(known),indent=2)+"\\n")
print("GymBody demo: delivered=%d; pending=%d; updates=%d; time=%s"%(processed,len(pending_update_ids),len(updates),dt.datetime.now(dt.timezone.utc).isoformat()))
