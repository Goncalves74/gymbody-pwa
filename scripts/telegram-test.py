#!/usr/bin/env python3
"""Primeiro teste isolado do bot Telegram; não acede aos dados GymBody."""
import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request

token = os.environ.get("TELEGRAM_BOT_TOKEN", "").strip()
if not token:
    sys.exit("Falta configurar o secret TELEGRAM_BOT_TOKEN.")
base = "https://api.telegram.org/bot" + token + "/"

def api(method, params=None):
    body = urllib.parse.urlencode(params or {}).encode()
    req = urllib.request.Request(base + method, data=body, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=20) as response:
            payload = json.load(response)
    except (urllib.error.URLError, ValueError):
        sys.exit("Falha na comunicação com o Telegram. Verificar o bot e o token.")
    if not payload.get("ok"):
        sys.exit("O Telegram recusou o pedido; verificar token e permissões.")
    return payload["result"]

updates = api("getUpdates", {"timeout": 0, "limit": 100})
eligible = [
    update["message"]
    for update in updates
    if isinstance(update.get("message"), dict)
    and update["message"].get("text", "").strip().lower() == "teste gymbody"
    and update["message"].get("chat", {}).get("type") == "private"
]
if not eligible:
    sys.exit("Não encontrei 'Teste GymBody' numa conversa privada. Enviar novamente ao bot e repetir o teste.")
message = eligible[-1]
api("sendMessage", {
    "chat_id": message["chat"]["id"],
    "text": "GymBody: teste de lembrete automático concluído! Esta é uma mensagem de teste, não corresponde a um treino marcado.",
})
print("Mensagem de teste enviada ao Telegram com sucesso (sem expor token ou chat ID).")
