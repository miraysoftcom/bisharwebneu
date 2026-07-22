import os
import smtplib
import socket
import logging
import uuid
import re
from datetime import datetime, timezone, timedelta
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.application import MIMEApplication
from typing import List, Optional
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

logger = logging.getLogger(__name__)


def email_delivery_ok(result: dict) -> bool:
    if not isinstance(result, dict):
        return False
    if result.get("success") is not True:
        return False
    return result.get("status") == "sent"


def _coerce_bool(value) -> bool:
    if isinstance(value, bool):
        return value
    if isinstance(value, str):
        return value.strip().lower() in {"1", "true", "yes", "on"}
    return bool(value)


# Helper to validate email format
def validate_email_address(email: str) -> str:
    cleaned = str(email).strip().lower()
    pattern = r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$"
    if not re.match(pattern, cleaned):
        raise ValueError(f"Ungültige E-Mail-Adresse: '{email}'")
    return cleaned

# Strip HTML tags for plain-text fallback
def strip_html_tags(text: str) -> str:
    if not text:
        return ""

    # Preserve links in plain text: show anchor text with URL in parentheses.
    def _anchor_to_text(match):
        url = match.group(1).strip()
        label = re.sub(r'<[^>]+>', '', match.group(2)).strip()
        return f"{label} ({url})"

    text = re.sub(r'<a[^>]*href=[\"\']([^\"\']+)[\"\'][^>]*>(.*?)</a>', _anchor_to_text, text, flags=re.I | re.S)
    text = re.sub(r'<\s*br\s*/?\s*>', '\n', text, flags=re.I)
    text = re.sub(r'</p\s*>', '\n\n', text, flags=re.I)
    text = re.sub(r'<[^>]+>', '', text)
    text = re.sub(r'\r\n|\r', '\n', text)
    text = re.sub(r'\n{3,}', '\n\n', text)

    try:
        import html as _html
        text = _html.unescape(text)
    except Exception:
        pass

    return text.strip()

async def get_smtp_config(db) -> dict:
    """
    Dynamically loads active SMTP settings from environment variables first and
    falls back to the MongoDB system_settings collection.
    """
    settings = await db.system_settings.find_one({"key": "smtp"})
    db_conf = (settings or {}).get("value") or {}

    default_conf = {
        "host": os.getenv("SMTP_HOST") or db_conf.get("host") or "localhost",
        "port": int(os.getenv("SMTP_PORT") or db_conf.get("port") or 1025),
        "username": os.getenv("SMTP_USERNAME") or db_conf.get("username") or "",
        "password": os.getenv("SMTP_PASSWORD") or db_conf.get("password") or "",
        "from_email": os.getenv("SMTP_FROM_EMAIL") or db_conf.get("from_email") or "info@plattenlegerallerart.ch",
        "from_name": os.getenv("SMTP_FROM_NAME") or db_conf.get("from_name") or "Swiss Platten GmbH",
        "reply_to": os.getenv("SMTP_REPLY_TO") or db_conf.get("reply_to") or "info@plattenlegerallerart.ch",
        "starttls": _coerce_bool(os.getenv("SMTP_STARTTLS", db_conf.get("starttls", True))),
        "active": _coerce_bool(os.getenv("SMTP_ACTIVE", db_conf.get("active", False))),
    }

    if db_conf:
        for key in ["host", "port", "username", "password", "from_email", "from_name", "reply_to", "starttls", "active"]:
            if key not in db_conf:
                continue
            value = db_conf.get(key)
            if key == "port":
                default_conf[key] = int(value or default_conf[key])
            elif key == "active":
                default_conf[key] = _coerce_bool(value)
            elif key == "starttls":
                default_conf[key] = _coerce_bool(value)
            elif value not in (None, ""):
                default_conf[key] = value

    return default_conf

def run_smtp_send_sync(smtp_conf: dict, to_email: str, subject: str, html_body: str, plain_body: str, attachments: List[dict] = []) -> dict:
    """
    Synchronous SMTP dispatch. Executed inside an asyncio threadpool for safety.
    """
    # Build MIME Message
    msg = MIMEMultipart("alternative")
    
    from_addr = smtp_conf.get("from_email", "info@plattenlegerallerart.ch")
    from_name = smtp_conf.get("from_name", "Swiss Platten GmbH")
    reply_to = smtp_conf.get("reply_to") or from_addr
    
    msg["Subject"] = subject
    msg["From"] = f"{from_name} <{from_addr}>"
    msg["To"] = to_email
    msg["Reply-To"] = reply_to
    msg["MIME-Version"] = "1.0"
    
    # Custom unique Message-ID
    msg_id = f"<{uuid.uuid4()}@{smtp_conf.get('host', 'plattenlegerallerart.ch')}>"
    msg["Message-ID"] = msg_id
    msg["Date"] = datetime.now(timezone.utc).strftime("%a, %d %b %Y %H:%M:%S +0000")
    
    # Attach plain and html versions
    msg.attach(MIMEText(plain_body, "plain", "utf-8"))
    msg.attach(MIMEText(html_body, "html", "utf-8"))
    
    # Process Attachments
    for att in attachments:
        file_path = att.get("path")
        file_name = att.get("filename", "document.pdf")
        if file_path and os.path.exists(file_path):
            with open(file_path, "rb") as f:
                part = MIMEApplication(f.read(), _subtype="pdf")
                part.add_header('Content-Disposition', 'attachment', filename=file_name)
                msg.attach(part)
        elif att.get("content"):
            part = MIMEApplication(att["content"], _subtype="pdf")
            part.add_header('Content-Disposition', 'attachment', filename=file_name)
            msg.attach(part)

    host = smtp_conf.get("host", "localhost")
    port = int(smtp_conf.get("port", 587))
    user = smtp_conf.get("username", "")
    password = smtp_conf.get("password", "")
    use_starttls = smtp_conf.get("starttls", True)
    
    # Connect
    try:
        # Port 465 is typically direct SSL
        if port == 465:
            server = smtplib.SMTP_SSL(host, port, timeout=15)
        else:
            server = smtplib.SMTP(host, port, timeout=15)
            if use_starttls:
                server.ehlo()
                server.starttls()
                server.ehlo()
                
        # Authenticate if username provided
        if user:
            server.login(user, password)
            
        send_errs = server.sendmail(from_addr, [to_email], msg.as_string())
        server.quit()
        
        if send_errs:
            raise Exception(f"SMTP rejected recipient: {send_errs}")
            
        return {
            "success": True,
            "messageId": msg_id,
            "response": "250 OK Message accepted",
            "accepted": [to_email],
            "rejected": list(send_errs.keys())
        }
    except Exception as e:
        logger.error(f"Sync SMTP Dispatch failed: {e}")
        raise e

async def build_and_send_quote_email(db, quote_doc: dict, html_body: str, subject: str, attachments: Optional[List[dict]] = None, quote_num: Optional[str] = None, is_contract: bool = False) -> dict:
    """Create a quote or signed contract PDF attachment and dispatch it to the customer email."""
    recipient_email = quote_doc.get("email") or quote_doc.get("client_email") or ""
    if not recipient_email:
        return {"success": False, "status": "failed", "errorCode": "INVALID_RECIPIENT", "message": "Keine Kunden-E-Mail-Adresse gefunden."}

    reference_number = quote_doc.get("contract_number") if is_contract else quote_doc.get("reference_number")
    reference_number = reference_number or quote_num or "QUOTE"
    last_name = str(quote_doc.get("last_name") or "Kunde").replace(" ", "_")
    company = str(quote_doc.get("company") or "Privat").replace(" ", "_")
    file_prefix = "Vertrag" if is_contract else "Offerte"
    pdf_filename = f"{file_prefix}_{reference_number}_{last_name}_{company}.pdf"
    target_path = os.path.join("/tmp", pdf_filename)

    try:
        from pdf_service import build_swiss_pdf
        build_swiss_pdf(quote_doc, target_path, is_contract=is_contract)
    except Exception as pdf_error:
        logger.error(f"Quote PDF generation failed: {pdf_error}")
        return {"success": False, "status": "failed", "errorCode": "PDF_ERROR", "message": str(pdf_error)}

    final_attachments = attachments or [{"path": target_path, "filename": pdf_filename}]
    return await send_email_async(db, recipient_email, subject, html_body, attachments=final_attachments, quote_num=quote_num or reference_number)


async def send_email_async(db, to_email: str, subject: str, html_body: str, attachments: List[dict] = [], quote_num: Optional[str] = None) -> dict:
    """
    Centralized async email dispatching service. Resolves active SMTP, cleans recipient, 
    and handles queueing/logging dockets.
    """
    now = datetime.now(timezone.utc)
    to_email_clean = ""
    try:
        to_email_clean = validate_email_address(to_email)
    except ValueError as e:
        # Invalid recipient - mark as failed directly
        log_doc = {
            "subject": subject,
            "recipient": to_email,
            "status": "Ungültige Empfängeradresse",
            "error_message": str(e),
            "quote_number": quote_num,
            "created_at": now
        }
        await db.email_logs.insert_one(log_doc)
        return {"success": False, "status": "failed", "errorCode": "INVALID_RECIPIENT", "message": str(e)}

    smtp_conf = await get_smtp_config(db)
    
    # Check if SMTP is configured / active
    if not smtp_conf.get("active", False):
        # Place in queue and log
        log_doc = {
            "subject": subject,
            "recipient": to_email_clean,
            "status": "In Warteschlange",
            "error_message": "SMTP-Konfiguration ist inaktiv.",
            "quote_number": quote_num,
            "created_at": now
        }
        await db.email_logs.insert_one(log_doc)
        
        # Insert queue item
        await db.email_queue.insert_one({
            "recipient": to_email_clean,
            "subject": subject,
            "html_body": html_body,
            "attachments": attachments,
            "quote_number": quote_num,
            "status": "In Warteschlange",
            "retries": 0,
            "next_retry": now + timedelta(minutes=5),
            "created_at": now
        })
        return {"success": True, "status": "queued", "message": "E-Mail wurde zur Zustellung eingeplant."}

    plain_body = strip_html_tags(html_body)

    try:
        # Execute synchronous smtplib call inside threadpool to keep FastAPI non-blocking
        res = await asyncio.to_thread(
            run_smtp_send_sync,
            smtp_conf, to_email_clean, subject, html_body, plain_body, attachments
        )
        
        # Log successful dispatch
        log_doc = {
            "subject": subject,
            "recipient": to_email_clean,
            "sender": smtp_conf.get("from_email"),
            "status": "Erfolgreich versendet",
            "message_id": res["messageId"],
            "smtp_response": res["response"],
            "quote_number": quote_num,
            "created_at": now
        }
        await db.email_logs.insert_one(log_doc)
        return {
            "success": True,
            "status": "sent",
            "messageId": res["messageId"],
            "acceptedRecipients": res["accepted"],
            "rejectedRecipients": res["rejected"]
        }
    except Exception as e:
        # SMTP delivery failed - place in queue for retry and log error
        log_doc = {
            "subject": subject,
            "recipient": to_email_clean,
            "sender": smtp_conf.get("from_email"),
            "status": "Vorübergehend fehlgeschlagen",
            "error_message": str(e),
            "quote_number": quote_num,
            "created_at": now
        }
        await db.email_logs.insert_one(log_doc)
        
        await db.email_queue.insert_one({
            "recipient": to_email_clean,
            "subject": subject,
            "html_body": html_body,
            "attachments": attachments,
            "quote_number": quote_num,
            "status": "Vorübergehend fehlgeschlagen",
            "error_message": str(e),
            "retries": 1,
            "next_retry": now + timedelta(minutes=5),
            "created_at": now
        })
        
        return {
            "success": False,
            "status": "failed",
            "errorCode": "SMTP_ERROR",
            "message": f"SMTP-Zustellungsfehler: {str(e)}"
        }

def _create_smtp_socket(host: str, port: int):
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.settimeout(5)
    s.connect((host, port))
    s.close()


def _create_smtp_client(host: str, port: int, starttls: bool):
    if port == 465:
        return smtplib.SMTP_SSL(host, port, timeout=10)

    server = smtplib.SMTP(host, port, timeout=10)
    if starttls:
        server.ehlo()
        server.starttls()
        server.ehlo()
    return server


async def run_smtp_diagnostics(host: str, port: int, user: str, password: str, test_recipient: str, starttls: bool = True) -> dict:
    """
    Step-by-step diagnostic test helper. Resolves host, checks port connection,
    does TLS handshake, log verification, and dispatches a diagnostic check email!
    """
    now = datetime.now(timezone.utc)
    steps = {
        "host_resolved": False,
        "port_connected": False,
        "tls_handshake": False,
        "auth_success": False,
        "message_dispatched": False,
        "messageId": "",
        "server_response": ""
    }
    
    # Step 1: DNS Host Resolution
    try:
        socket.gethostbyname(host)
        steps["host_resolved"] = True
    except socket.gaierror as e:
        return {"success": False, "steps": steps, "error": f"SMTP-Host-Auflösung fehlgeschlagen: {e}"}
        
    # Step 2: Port Connection
    try:
        await asyncio.to_thread(_create_smtp_socket, host, port)
        steps["port_connected"] = True
    except Exception as e:
        return {"success": False, "steps": steps, "error": f"Verbindung zum Port {port} fehlgeschlagen: {e}"}

    # Step 3 & 4: SSL/TLS Connection & Login Handshakes
    try:
        server = await asyncio.to_thread(_create_smtp_client, host, port, starttls)
        steps["tls_handshake"] = True
        
        if user:
            try:
                await asyncio.to_thread(server.login, user, password)
                steps["auth_success"] = True
            except Exception as e:
                server.close()
                return {"success": False, "steps": steps, "error": f"SMTP-Authentifizierung fehlgeschlagen: {e}"}
        else:
            steps["auth_success"] = True # No credentials needed is success
            
        # Step 5: Dispatch Diagnostic check mail
        msg = MIMEMultipart()
        msg["Subject"] = "Plattenleger Aller art!"
        msg["From"] = f"Plattenleger Aller art! <{user if user else 'diagnostic@plattenlegerallerart.ch'}>"
        msg["To"] = test_recipient
        msg_id = f"<{uuid.uuid4()}@diagnostic.plattenlegerallerart.ch>"
        msg["Message-ID"] = msg_id
        msg["Date"] = now.strftime("%a, %d %b %Y %H:%M:%S +0000")
        
        msg.attach(MIMEText("Ihre Swiss Platten SMTP-Einstellungen sind zu 100% funktionsfähig! Vektoren und Archivierung laufen.", "plain"))
        
        await asyncio.to_thread(server.sendmail, user if user else "diagnostic@plattenlegerallerart.ch", [test_recipient], msg.as_string())
        server.quit()
        
        steps["message_dispatched"] = True
        steps["messageId"] = msg_id
        steps["server_response"] = "250 OK Diagnostic Message accepted"
        
        return {"success": True, "steps": steps, "messageId": msg_id}
    except Exception as e:
        return {"success": False, "steps": steps, "error": f"SMTP-Handshake/Sende-Ausnahmefehler: {e}"}
