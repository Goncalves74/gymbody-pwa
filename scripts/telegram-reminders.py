#!/usr/bin/env python3
"""GymBody reminder scheduler v67. Private JSON input; dry-run by default.
Input JSON array of {id,chat_id,at,lead_minutes,text,status}.
'at' is ISO8601 with timezone offset. No patient data in logs.
"""
import datetime as dt
import json
import os
import sys
import urllib.parse
import urllib.request

def due_items(items, now, sent):
    due=[]
    for item in items:
        if not isinstance(item,dict) or item.get("status")!="marcado" or not item.get("enabled",True):
            continue
        try:
            at=dt.datetime.fromisoformat(item["at"])
            lead=int(item["lead_minutes"])
            key=str(item["id"])+":"+at.isoformat()+":"+str(lead)
            if at.tzinfo is None or not 0<=lead<=10080 or not item.get("chat_id") or not item.get("text"):
                continue
            notify_at=at-dt.timedelta(minutes=lead)
            if notify_at<=now<at and key not in sent:
                due.append((key,item))
        except (ValueError,TypeError,KeyError,OverflowError):
            continue
    return due

def main():
    raw=os.environ.get("GYMBODY_REMINDERS_JSON","[]")
    try:
        items=json.loads(raw)
        if not isinstance(items,list):
            raise ValueError("expected list")
    except (ValueError,TypeError):
        sys.exit("Invalid reminders input")
    now=dt.datetime.now(dt.timezone.utc)
    sent=set(json.loads(os.environ.get("GYMBODY_SENT_KEYS_JSON","[]")))
    pending=due_items(items,now,sent)
    if os.environ.get("GYMBODY_SEND_ENABLED")!="true":
        print("Dry run: %d reminders eligible; no messages sent."%len(pending))
        return
    # Production send is deliberately disabled until durable deduplication and
    # private state storage are connected. Do not enable without both.
    sys.exit("Production delivery locked: persistent idempotency store required")

if __name__=="__main__":
    main()
