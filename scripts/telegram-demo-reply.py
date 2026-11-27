#!/usr/bin/env python3
"""Reply to explicitly requested fictional GymBody demo messages via Telegram.
Only private chat previously verified with 'Teste GymBody' is eligible.
No PWA credentials, client data, or chat IDs are logged.
"""
import datetime as dt
import json
import os
import sys
import urllib.parse
import urllib.request

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
verified={str(m["chat"]["id"]) for m in messages if m.get("text","").strip().lower()=="teste gymbody"}
allowed=os.environ.get("TELEGRAM_TEST_CHAT_ID","").strip()
if allowed:
    verified={allowed}
now=int(dt.datetime.now(dt.timezone.utc).timestamp())
processed=0
for m in messages:
    chat=str(m["chat"]["id"])
    txt=m.get("text","").strip()
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
# Acknowledge all updates only after successful delivery to avoid retry on failures.
if updates:
    api("getUpdates",{"offset":max(u["update_id"] for u in updates)+1,"timeout":0,"limit":1})
print("GymBody demo: processed %d verified requests."%processed)
