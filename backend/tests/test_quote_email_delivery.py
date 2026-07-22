import asyncio
import os
import smtplib
import sys
import uuid
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from email_service import build_and_send_quote_email, email_delivery_ok


class FakeCollection:
    def __init__(self, name):
        self.name = name
        self.docs = []

    async def find_one(self, query=None):
        if self.name == "system_settings":
            return {
                "key": "smtp",
                "value": {
                    "host": "127.0.0.1",
                    "port": 1025,
                    "username": "",
                    "password": "",
                    "from_email": "info@plattenlegerallerart.ch",
                    "from_name": "Swiss Platten GmbH",
                    "reply_to": "info@plattenlegerallerart.ch",
                    "active": True,
                },
            }
        return None

    async def insert_one(self, doc):
        self.docs.append(doc)
        return type("Result", (), {"inserted_id": str(uuid.uuid4())})()


class FakeDB:
    def __init__(self):
        self.system_settings = FakeCollection("system_settings")
        self.email_logs = FakeCollection("email_logs")
        self.email_queue = FakeCollection("email_queue")


class CaptureSMTPClient:
    def __init__(self, host, port):
        self.host = host
        self.port = port
        self.messages = []

    def ehlo(self, *args, **kwargs):
        return "250 ok"

    def starttls(self):
        return None

    def login(self, *args, **kwargs):
        return None

    def quit(self):
        return None

    def sendmail(self, from_addr, to_addrs, msg):
        self.messages.append({"mailfrom": from_addr, "rcpttos": to_addrs, "data": msg})
        return {}


def test_build_and_send_quote_email_dispatches_to_customer(monkeypatch):
    fake_db = FakeDB()
    quote_doc = {
        "reference_number": "OFF-999",
        "first_name": "Mina",
        "last_name": "Test",
        "email": "customer@example.com",
        "company": "Test GmbH",
    }

    captured = CaptureSMTPClient("127.0.0.1", 1025)
    monkeypatch.setattr("email_service.smtplib.SMTP", lambda *args, **kwargs: captured)

    result = asyncio.run(
        build_and_send_quote_email(
            fake_db,
            quote_doc,
            html_body="<p>Ihre Offerte ist hier.</p>",
            subject="Ihre Offerte",
        )
    )

    assert result["success"] is True
    assert fake_db.email_logs.docs[0]["status"] == "Erfolgreich versendet"
    assert len(captured.messages) == 1


def test_email_delivery_ok_rejects_queued_results():
    assert email_delivery_ok({"success": True, "status": "sent"}) is True
    assert email_delivery_ok({"success": True, "status": "queued"}) is False
    assert email_delivery_ok({"success": False, "status": "failed"}) is False
