import asyncio
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from email_service import run_smtp_diagnostics


class FakeSMTP:
    def __init__(self, *args, **kwargs):
        self.started_tls = False
        self.helo_calls = 0
        self.auth = None

    def ehlo(self):
        self.helo_calls += 1

    def starttls(self):
        self.started_tls = True

    def login(self, username, password):
        self.auth = (username, password)

    def sendmail(self, from_addr, to_addrs, msg):
        return {}

    def quit(self):
        return None

    def close(self):
        return None


def test_run_smtp_diagnostics_respects_starttls_flag(monkeypatch):
    fake_client = FakeSMTP()

    monkeypatch.setattr("email_service.socket.gethostbyname", lambda host: "127.0.0.1")
    monkeypatch.setattr("email_service._create_smtp_socket", lambda host, port: None)
    monkeypatch.setattr("email_service._create_smtp_client", lambda host, port, starttls: fake_client)

    async def fake_to_thread(func, *args, **kwargs):
        return func(*args, **kwargs)

    monkeypatch.setattr("email_service.asyncio.to_thread", fake_to_thread)

    loop = asyncio.new_event_loop()
    try:
        asyncio.set_event_loop(loop)
        result = loop.run_until_complete(
            run_smtp_diagnostics(
                "smtp.example.com",
                587,
                "user@example.com",
                "secret",
                "recipient@example.com",
                starttls=False,
            )
        )
    finally:
        loop.close()
        asyncio.set_event_loop(None)

    assert result["success"] is True
    assert fake_client.started_tls is False
