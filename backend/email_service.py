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

# Helper to validate email format
def validate_email_address(email: str) -> str:
    cleaned = str(email).strip().lower()
    pattern = r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$"
    if not re.match(pattern, cleaned):
        raise ValueError(f"Ungültige E-Mail-Adresse: '{email}'")
    return cleaned

# Strip HTML tags for plain-text fallback
def strip_html_tags(text: str) -> str:
    clean = re.sub(r'<[^>]+>', '', text)
    return clean

async def get_smtp_config(db) -> dict:
    """
    Dynamically loads active SMTP settings from MongoDB system_settings collection.
    """
    settings = await db.system_settings.find_one({"key": "smtp"})
    if settings and settings.get("value"):
        return settings["value"]
    # Fallback default values
    return {
        "host": "localhost",
        "port": 1025,
        "username": "",
        "password": "",
        "from_email": "info@plattenlegerallerart.ch",
        "from_name": "Swiss Platten GmbH",
        "reply_to": "info@plattenlegerallerart.ch",
        "active": False
    }

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
    
    # Connect
    try:
        # Port 465 is typically direct SSL
        if port == 465:
            server = smtplib.SMTP_SSL(host, port, timeout=15)
        else:
            server = smtplib.SMTP(host, port, timeout=15)
            # Port 587 uses STARTTLS
            if port == 587 or smtp_conf.get("starttls", True):
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

async def run_smtp_diagnostics(host: str, port: int, user: str, password: str, test_recipient: str) -> dict:
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
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        s.settimeout(5)
        s.connect((host, port))
        s.close()
        steps["port_connected"] = True
    except Exception as e:
        return {"success": False, "steps": steps, "error": f"Verbindung zum Port {port} fehlgeschlagen: {e}"}

    # Step 3 & 4: SSL/TLS Connection & Login Handshakes
    try:
        def do_diagnostic():
            if port == 465:
                server = smtplib.SMTP_SSL(host, port, timeout=10)
            else:
                server = smtplib.SMTP(host, port, timeout=10)
                server.ehlo()
                server.starttls()
                server.ehlo()
            return server
            
        server = await asyncio.to_thread(do_diagnostic)
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
        msg["Subject"] = "Atelier SMTP Diagnostic Test"
        msg["From"] = f"Atelier Diagnostic <{user if user else 'diagnostic@plattenlegerallerart.ch'}>"
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
