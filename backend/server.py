import os
from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, UploadFile, File, Form, status, WebSocket, WebSocketDisconnect
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
import logging
import uuid
import jwt
import bcrypt
import shutil
import hashlib
import csv
import io
import re
import json
from datetime import datetime, timezone, timedelta
from typing import List, Optional
from pydantic import BaseModel, Field, ConfigDict, EmailStr

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Create the main app
app = FastAPI(title="Plattenleger CMS Enterprise API")

# Ensure uploads directory exists
UPLOAD_DIR = ROOT_DIR / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# Mount uploads static files
app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")

# MongoDB connection
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
db_name = os.environ.get('DB_NAME', 'test_database')
client = AsyncIOMotorClient(mongo_url)
db = client[db_name]

# JWT Configuration
JWT_SECRET = os.environ.get("JWT_SECRET", "9a4e05b9b6e8a04b1979b9a67e41ad9c3eeeaef618e0ab85db5dbfa7e8d2e8b0")
JWT_SECRET = os.environ.get("JWT_SECRET")
if not JWT_SECRET:
    logger.critical("FATAL: JWT_SECRET environment variable is not set!")
    raise ValueError("JWT_SECRET environment variable must be set for security.")

JWT_ALGORITHM = "HS256"

# Password Hashing
def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode("utf-8"), salt)
    return hashed.decode("utf-8")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))
    except Exception as e:
        logger.error(f"Password verification failed: {e}")
        return False

# JWT Token Creation
def create_access_token(user_id: str, email: str, role: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(minutes=120),
        "type": "access"
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def create_refresh_token(user_id: str) -> str:
    payload = {
        "sub": user_id,
        "exp": datetime.now(timezone.utc) + timedelta(days=7),
        "type": "refresh"
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

# MongoDB Serialization Helpers
def serialize_doc(doc):
    if doc is None:
        return None
    doc = dict(doc)
    if "_id" in doc:
        doc["id"] = str(doc["_id"])
        doc.pop("_id")
    for k, v in doc.items():
        if isinstance(v, datetime):
            doc[k] = v.isoformat()
        elif isinstance(v, ObjectId):
            doc[k] = str(v)
        elif isinstance(v, dict):
            doc[k] = serialize_doc(v)
        elif isinstance(v, list):
            doc[k] = [serialize_doc(x) if isinstance(x, dict) else x for x in v]
    return doc


# WebSocket manager for live quote message updates
quote_message_connections = {}

async def broadcast_quote_message(quote_id: str, message: dict):
    connections = quote_message_connections.get(quote_id, [])
    if not connections:
        return
    payload = json.dumps({"type": "new_message", "message": serialize_doc(message)})
    for ws in connections.copy():
        try:
            await ws.send_text(payload)
        except Exception:
            connections.remove(ws)

REVIEW_MIN_SUBMIT_SECONDS = 3
REVIEW_MIN_GAP_PER_IP_SECONDS = 45
REVIEW_MAX_PER_HOUR_PER_IP = 4
REVIEW_MAX_PER_DAY_PER_FINGERPRINT = 5

SPAM_PATTERNS = [
    re.compile(r"https?://", re.IGNORECASE),
    re.compile(r"www\\.", re.IGNORECASE),
    re.compile(r"t\\.me/|telegram", re.IGNORECASE),
    re.compile(r"whatsapp|wa\\.me", re.IGNORECASE),
    re.compile(r"@[A-Za-z0-9._%+-]+\\.[A-Za-z]{2,}"),
    re.compile(r"\\+?\\d[\\d\\s().-]{7,}\\d"),
    re.compile(r"(.)\\1{7,}"),
]


def get_client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for", "")
    if forwarded:
        return forwarded.split(",")[0].strip()
    if request.client and request.client.host:
        return request.client.host
    return "unknown"


def normalize_review_text(text: str) -> str:
    lowered = re.sub(r"\\s+", " ", (text or "").strip().lower())
    return lowered


def contains_spam_content(text: str) -> bool:
    if not text:
        return False
    for pattern in SPAM_PATTERNS:
        if pattern.search(text):
            return True
    return False


def expand_postal_code_ranges(ranges):
    postal_codes = []
    for start, end in ranges:
        postal_codes.extend(str(code) for code in range(start, end + 1))
    return postal_codes


SERVICE_AREA_POSTAL_CODE_RANGES = {
    "zuerich": [
        (8000, 8006),
        (8008, 8008),
        (8017, 8018),
        (8021, 8022),
        (8024, 8024),
        (8027, 8027),
        (8031, 8032),
        (8034, 8034),
        (8036, 8038),
        (8040, 8042),
        (8044, 8053),
        (8055, 8055),
        (8057, 8057),
        (8063, 8064),
        (8070, 8071),
        (8074, 8075),
        (8080, 8081),
        (8085, 8088),
        (8090, 8093),
        (8096, 8096),
        (8098, 8099),
    ],
    "aarau": [
        (5000, 5001),
        (5004, 5004),
        (5017, 5018),
        (5022, 5026),
        (5032, 5037),
        (5042, 5042),
        (5722, 5722),
    ],
    "kanton-aargau": [
        (4303, 4303),
        (4305, 4305),
        (4310, 4310),
        (4312, 4317),
        (4322, 4325),
        (4332, 4334),
        (4663, 4663),
        (4665, 4665),
        (4800, 4803),
        (4805, 4805),
        (4807, 4810),
        (4812, 4814),
        (4852, 4853),
        (4856, 4856),
        (5000, 5001),
        (5004, 5004),
        (5017, 5018),
        (5022, 5028),
        (5032, 5037),
        (5040, 5040),
        (5042, 5044),
        (5046, 5046),
        (5053, 5054),
        (5056, 5058),
        (5062, 5064),
        (5070, 5070),
        (5072, 5080),
        (5082, 5085),
        (5102, 5103),
        (5105, 5108),
        (5112, 5113),
        (5116, 5116),
        (5200, 5201),
        (5210, 5210),
        (5212, 5213),
        (5222, 5223),
        (5225, 5225),
        (5232, 5237),
        (5242, 5246),
        (5272, 5277),
        (5300, 5301),
        (5303, 5306),
        (5312, 5318),
        (5322, 5326),
        (5330, 5330),
        (5332, 5334),
        (5400, 5402),
        (5404, 5406),
        (5408, 5408),
        (5412, 5413),
        (5415, 5417),
        (5420, 5420),
        (5423, 5423),
        (5425, 5426),
        (5430, 5430),
        (5432, 5432),
        (5436, 5436),
        (5442, 5445),
        (5452, 5454),
        (5462, 5467),
        (5502, 5507),
        (5512, 5512),
        (5522, 5522),
        (5524, 5525),
        (5600, 5600),
        (5603, 5608),
        (5610, 5628),
        (5630, 5630),
        (5632, 5632),
        (5634, 5634),
        (5636, 5637),
        (5642, 5647),
        (5702, 5708),
        (5712, 5712),
        (5722, 5728),
        (5732, 5734),
        (5736, 5737),
        (5742, 5742),
        (5745, 5745),
        (6042, 6042),
        (8109, 8109),
        (8905, 8905),
        (8916, 8919),
        (8956, 8957),
        (8962, 8962),
        (8964, 8967),
    ],
    "olten": [
        (4600, 4601),
        (4605, 4605),
        (4609, 4609),
        (4612, 4618),
        (4629, 4629),
        (4656, 4658),
        (5012, 5012),
        (5014, 5014),
        (5746, 5746),
    ],
}

SERVICE_AREA_POSTAL_CODES = {
    slug: expand_postal_code_ranges(ranges)
    for slug, ranges in SERVICE_AREA_POSTAL_CODE_RANGES.items()
}

# Dependency: Get Current User
async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token type")
        
        user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
        if not user:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
        
        return serialize_doc(user)
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

# Dependency: Require Admin Access
async def require_admin(current_user: dict = Depends(get_current_user)) -> dict:
    allowed_admin_roles = [
        "admin", "Super Admin", "Administrator", "Offerten Manager",
        "Content Manager", "SEO Manager", "Support Mitarbeiter", "Buchhaltung"
    ]
    if current_user.get("role") not in allowed_admin_roles:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Zugriff verweigert. Nur Administratoren erlaubt.")
    return current_user

# Audit Logger helper
async def log_activity(user_email: str, role: str, action: str, old_val: Optional[str] = None, new_val: Optional[str] = None, ip: str = "127.0.0.1"):
    await db.audit_logs.insert_one({
        "user_email": user_email,
        "role": role,
        "action": action,
        "old_value": old_val,
        "new_value": new_val,
        "ip_address": ip,
        "timestamp": datetime.now(timezone.utc)
    })

# Pydantic Schemas
class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class ResetPasswordFirstRequest(BaseModel):
    current_password: str
    new_password: str

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    role: str
    created_at: str
    needs_password_reset: bool

# Postcode Validator
async def check_postcode_service_area(postcode: str) -> dict:
    try:
        pc_val = int(postcode.strip())
    except ValueError:
        return {"allowed": False, "region": None, "message": "Ungültige Postleitzahl."}

    areas = await db.service_areas.find({"is_active": True}).sort("sort_order", 1).to_list(100)
    for area in areas:
        postal_codes = area.get("postal_codes", []) or []
        if any(str(pc).strip() == str(pc_val) for pc in postal_codes):
            return {
                "allowed": True,
                "region": area.get("name"),
                "city": area.get("city"),
                "KANTON": area.get("KANTON"),
                "message": f"Gute Nachrichten – wir sind in Ihrer Region ({area.get('name')}) im Einsatz. Sie können direkt eine Offerte anfragen."
            }

    return {
        "allowed": False,
        "region": None,
        "message": "Ihre Region ist derzeit nicht eindeutig hinterlegt. Senden Sie uns trotzdem Ihre Anfrage – wir prüfen Ihren Standort gerne persönlich."
    }

# AI Summary Generator using Emergent LLM Key
async def generate_ai_quote_summary(quote_data: dict) -> str:
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage, TextDelta, StreamDone
        api_key = os.environ.get("EMERGENT_LLM_KEY", "sk-emergent-fE7FfEcAcA9E493221")
        
        chat = LlmChat(
            api_key=api_key,
            session_id=f"quote-summary-{uuid.uuid4()}",
            system_message=(
                "You are a professional Swiss construction and tiling project estimator. "
                "Analyze the user's detailed quote request (Offertenanfrage) and provide a clean, "
                "highly-structured professional summary in German. "
                "Break down the requested services, estimate the workload complexity, "
                "suggest typical Swiss materials or standards (SIA norms), and outline potential project "
                "risks or key suggestions. Be thorough, clear, and neat."
            )
        ).with_model("openai", "gpt-5.4")
        
        prompt = f"""
Offertenanfrage-Details:
- Referenznummer: {quote_data.get('reference_number', 'NEU')}
- Dienstleistungen: {', '.join(quote_data.get('services', []))}
- Projektart: {quote_data.get('project_type', '')}
- Objektbereich: {', '.join(quote_data.get('object_areas', []))}
- Fläche: {quote_data.get('surface_area', '')} m²
- Anzahl Räume: {quote_data.get('rooms_count', '')}
- Gewünschter Start: {quote_data.get('desired_start', '')}
- Gewünschte Fertigstellung: {quote_data.get('desired_completion', '')}
- Untergrundzustand: {quote_data.get('underground_condition', '')}
- Bestehende Platten vorhanden: {quote_data.get('existing_tiles_present', '')} (Alte entfernen: {quote_data.get('existing_tiles_remove', '')})
- Material: {quote_data.get('material_status', '')}
- Zusatzbeschreibung: {quote_data.get('additional_notes', '')}
- Projektstandort: {quote_data.get('street', '')} {quote_data.get('house_number', '')}, {quote_data.get('postal_code', '')} {quote_data.get('city', '')} ({quote_data.get('region', '')})
- Kundendaten: {quote_data.get('first_name', '')} {quote_data.get('last_name', '')} ({quote_data.get('company', '')}), Telefon: {quote_data.get('phone', '')}, E-Mail: {quote_data.get('email', '')}
"""
        user_msg = UserMessage(text=prompt)
        summary_text = ""
        async for event in chat.stream_message(user_msg):
            if isinstance(event, TextDelta):
                summary_text += event.content
            elif isinstance(event, StreamDone):
                break
        return summary_text.strip()
    except Exception as e:
        logger.error(f"Error generating AI quote summary: {e}")
        return f"Automatische AI-Zusammenfassung konnte nicht erstellt werden: {str(e)}"

# APIRouter Setup
api_router = APIRouter(prefix="/api")

# --- AUTH ENDPOINTS ---

@api_router.post("/auth/register", response_model=UserResponse)
async def register(req: LoginRequest, name: str = Form("Admin User")):
    email_norm = req.email.lower().strip()
    existing = await db.users.find_one({"email": email_norm})
    if existing:
        raise HTTPException(status_code=400, detail="E-Mail wird bereits verwendet.")
    
    hashed = hash_password(req.password)
    user_doc = {
        "email": email_norm,
        "password_hash": hashed,
        "name": name,
        "role": "admin",
        "needs_password_reset": False,
        "created_at": datetime.now(timezone.utc)
    }
    res = await db.users.insert_one(user_doc)
    user_doc["_id"] = res.inserted_id
    
    return serialize_doc(user_doc)

@api_router.post("/auth/login")
async def login(req: LoginRequest, request: Request):
    email_norm = req.email.lower().strip()
    
    # Brute Force Check
    identifier = f"login_attempt:{email_norm}"
    attempts = await db.login_attempts.find_one({"identifier": identifier})
    if attempts and attempts.get("count", 0) >= 5:
        lockout_time = attempts.get("locked_until")
        if lockout_time:
            if isinstance(lockout_time, str):
                lockout_time = datetime.fromisoformat(lockout_time)
            if datetime.now(timezone.utc) < lockout_time:
                raise HTTPException(status_code=403, detail="Konto vorübergehend gesperrt. Bitte versuchen Sie es in 15 Minuten erneut.")
    
    user = await db.users.find_one({"email": email_norm})
    if not user or not verify_password(req.password, user["password_hash"]):
        now = datetime.now(timezone.utc)
        if not attempts:
            await db.login_attempts.insert_one({
                "identifier": identifier,
                "count": 1,
                "last_attempt": now,
                "locked_until": None
            })
        else:
            new_count = attempts.get("count", 0) + 1
            locked_until = now + timedelta(minutes=15) if new_count >= 5 else None
            await db.login_attempts.update_one(
                {"identifier": identifier},
                {"$set": {"count": new_count, "last_attempt": now, "locked_until": locked_until}}
            )
        raise HTTPException(status_code=401, detail="Ungültige E-Mail-Adresse oder Passwort.")
    
    # Success: clear login attempts
    await db.login_attempts.delete_many({"identifier": identifier})
    
    user_id = str(user["_id"])
    role = user.get("role", "client")
    access_token = create_access_token(user_id, email_norm, role)
    refresh_token = create_refresh_token(user_id)
    
    user_serialized = serialize_doc(user)
    user_serialized.pop("password_hash", None)
    
    fastapi_resp = JSONResponse(content={
        "user": user_serialized,
        "token": access_token
    })
    
    fastapi_resp.set_cookie(key="access_token", value=access_token, httponly=True, secure=False, samesite="lax", max_age=3600, path="/")
    fastapi_resp.set_cookie(key="refresh_token", value=refresh_token, httponly=True, secure=False, samesite="lax", max_age=604800, path="/")
    
    # Log Audit Log
    await log_activity(email_norm, role, "Logged in successfully", ip=request.client.host)
    
    return fastapi_resp

@api_router.post("/auth/logout")
async def logout():
    resp = JSONResponse(content={"message": "Abgemeldet"})
    resp.delete_cookie("access_token", path="/")
    resp.delete_cookie("refresh_token", path="/")
    return resp

@api_router.get("/auth/me")
async def me(current_user: dict = Depends(get_current_user)):
    return current_user

@api_router.post("/auth/reset-password-first")
async def reset_password_first(req: ResetPasswordFirstRequest, current_user: dict = Depends(get_current_user)):
    user = await db.users.find_one({"email": current_user["email"]})
    if not user or not verify_password(req.current_password, user["password_hash"]):
        raise HTTPException(status_code=400, detail="Das aktuelle Passwort ist nicht korrekt.")
    
    new_hashed = hash_password(req.new_password)
    await db.users.update_one(
        {"_id": ObjectId(current_user["id"])},
        {"$set": {"password_hash": new_hashed, "needs_password_reset": False}}
    )
    
    await log_activity(current_user["email"], current_user["role"], "Admin password reset successfully on first login")
    return {"success": True, "message": "Passwort erfolgreich aktualisiert."}

# --- GLOBAL BANNER MANAGEMENT SYSTEM ---

@api_router.get("/banners")
async def get_active_banners():
    banners = await db.banners.find({"active": True}).to_list(100)
    return [serialize_doc(b) for b in banners]

@api_router.get("/admin/banners", dependencies=[Depends(require_admin)])
async def get_admin_banners():
    banners = await db.banners.find({}).to_list(100)
    return [serialize_doc(b) for b in banners]

@api_router.post("/admin/banners", dependencies=[Depends(require_admin)])
async def create_banner(req: dict, current_user: dict = Depends(get_current_user)):
    banner_doc = {
        "name": req.get("name", ""),
        "type": req.get("type", "image"),
        "location": req.get("location", "header_top"),
        "title": req.get("title", ""),
        "desc": req.get("desc", ""),
        "btn_text": req.get("btn_text", ""),
        "btn_link": req.get("btn_link", ""),
        "image_desktop": req.get("image_desktop", ""),
        "bg_color": req.get("bg_color", ""),
        "active": req.get("active", True),
        "created_at": datetime.now(timezone.utc)
    }
    res = await db.banners.insert_one(banner_doc)
    banner_doc["_id"] = res.inserted_id
    await log_activity(current_user["email"], current_user["role"], "Created banner", new_val=banner_doc["name"])
    return serialize_doc(banner_doc)

@api_router.put("/admin/banners/{id}", dependencies=[Depends(require_admin)])
async def update_banner(id: str, req: dict, current_user: dict = Depends(get_current_user)):
    banner_doc = {
        "name": req.get("name"),
        "type": req.get("type"),
        "location": req.get("location"),
        "title": req.get("title"),
        "desc": req.get("desc"),
        "btn_text": req.get("btn_text"),
        "btn_link": req.get("btn_link"),
        "image_desktop": req.get("image_desktop"),
        "bg_color": req.get("bg_color"),
        "active": req.get("active")
    }
    banner_doc = {k: v for k, v in banner_doc.items() if v is not None}
    await db.banners.update_one({"_id": ObjectId(id)}, {"$set": banner_doc})
    await log_activity(current_user["email"], current_user["role"], f"Updated banner {id}")
    return {"success": True}

@api_router.delete("/admin/banners/{id}", dependencies=[Depends(require_admin)])
async def delete_banner(id: str, current_user: dict = Depends(get_current_user)):
    await db.banners.delete_one({"_id": ObjectId(id)})
    await log_activity(current_user["email"], current_user["role"], f"Deleted banner {id}")
    return {"success": True}

# --- TEAM MANAGEMENT ---

@api_router.get("/team")
async def get_public_team():
    team = await db.team.find({"is_active": True}).sort([("order", 1), ("is_owner", -1), ("name", 1)]).to_list(100)
    return [serialize_doc(member) for member in team]

@api_router.get("/admin/team", dependencies=[Depends(require_admin)])
async def get_admin_team():
    members = await db.team.find({}).sort([("order", 1), ("is_owner", -1), ("name", 1)]).to_list(200)
    return [serialize_doc(member) for member in members]

@api_router.post("/admin/team", dependencies=[Depends(require_admin)])
async def create_team_member(req: dict, current_user: dict = Depends(get_current_user)):
    member_doc = {
        "name": req.get("name", ""),
        "role": req.get("role", ""),
        "title": req.get("title", ""),
        "bio": req.get("bio", ""),
        "photo_url": req.get("photo_url", ""),
        "email": req.get("email", ""),
        "phone": req.get("phone", ""),
        "social_links": [link.strip() for link in str(req.get("social_links", "")).split(",") if link.strip()],
        "is_owner": bool(req.get("is_owner", False)),
        "is_active": bool(req.get("is_active", True)),
        "is_featured": bool(req.get("is_featured", False)),
        "order": int(req.get("order", 0)),
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc)
    }
    res = await db.team.insert_one(member_doc)
    member_doc["_id"] = res.inserted_id
    await log_activity(current_user["email"], current_user["role"], f"Created team member {member_doc['name']}")
    return serialize_doc(member_doc)

@api_router.put("/admin/team/{id}", dependencies=[Depends(require_admin)])
async def update_team_member(id: str, req: dict, current_user: dict = Depends(get_current_user)):
    member_doc = {
        "name": req.get("name"),
        "role": req.get("role"),
        "title": req.get("title"),
        "bio": req.get("bio"),
        "photo_url": req.get("photo_url"),
        "email": req.get("email"),
        "phone": req.get("phone"),
        "social_links": [link.strip() for link in str(req.get("social_links", "")).split(",") if link.strip()],
        "is_owner": bool(req.get("is_owner", False)),
        "is_active": bool(req.get("is_active", True)),
        "is_featured": bool(req.get("is_featured", False)),
        "order": int(req.get("order", 0)),
        "updated_at": datetime.now(timezone.utc)
    }
    await db.team.update_one({"_id": ObjectId(id)}, {"$set": member_doc})
    await log_activity(current_user["email"], current_user["role"], f"Updated team member {id}")
    return {"success": True}

@api_router.delete("/admin/team/{id}", dependencies=[Depends(require_admin)])
async def delete_team_member(id: str, current_user: dict = Depends(get_current_user)):
    await db.team.delete_one({"_id": ObjectId(id)})
    await log_activity(current_user["email"], current_user["role"], f"Deleted team member {id}")
    return {"success": True}

# --- SERVICE AREAS (EINSATZGEBIETE) ---

@api_router.get("/service-areas")
async def get_active_service_areas():
    areas = await db.service_areas.find({"is_active": True}).sort("sort_order", 1).to_list(100)
    return [serialize_doc(a) for a in areas]

@api_router.get("/service-areas/slug/{slug}")
async def get_service_area_by_slug(slug: str):
    area = await db.service_areas.find_one({"slug": slug, "is_active": True})
    if not area:
        raise HTTPException(status_code=404, detail="Einsatzgebiet nicht gefunden.")
    return serialize_doc(area)

@api_router.get("/admin/service-areas", dependencies=[Depends(require_admin)])
async def get_admin_service_areas():
    areas = await db.service_areas.find({}).sort("sort_order", 1).to_list(100)
    return [serialize_doc(a) for a in areas]

@api_router.post("/admin/service-areas", dependencies=[Depends(require_admin)])
async def create_service_area(req: dict, current_user: dict = Depends(get_current_user)):
    postal_codes = req.get("postal_codes", [])
    if isinstance(postal_codes, str):
        postal_codes = [item.strip() for item in postal_codes.split(",") if item.strip()]

    canton = req.get("canton", req.get("KANTON", ""))

    slug_norm = req.get("slug", "").lower().strip().replace(" ", "-")
    existing_area = await db.service_areas.find_one({"slug": slug_norm})
    if existing_area:
        raise HTTPException(status_code=400, detail="Slug already exists for another service area.")

    area_doc = {
        "name": req.get("name", ""),
        "slug": slug_norm,
        "canton": canton,
        "city": req.get("city", ""),
        "postal_codes": postal_codes,
        "short_description": req.get("short_description", ""),
        "description": req.get("description", ""),
        "image_url": req.get("image_url", ""),
        "mobile_image_url": req.get("mobile_image_url", ""),
        "icon": req.get("icon", "MapPin"),
        "latitude": float(req.get("latitude", 47.3)),
        "longitude": float(req.get("longitude", 8.5)),
        "radius": float(req.get("radius", 25.0)),
        "is_active": req.get("is_active", True),
        "is_featured": req.get("is_featured", False),
        "show_on_homepage": req.get("show_on_homepage", True),
        "sort_order": int(req.get("sort_order", 0)),
        "cta_text": req.get("cta_text", "Offerte anfragen"),
        "cta_link": req.get("cta_link", "/quote-request"),
        "service_ids": req.get("service_ids", []),
        "created_at": datetime.now(timezone.utc)
    }
    res = await db.service_areas.insert_one(area_doc)
    area_doc["_id"] = res.inserted_id
    await log_activity(current_user["email"], current_user["role"], "Created service area", new_val=area_doc["name"])
    return serialize_doc(area_doc)

@api_router.put("/admin/service-areas/{id}", dependencies=[Depends(require_admin)])
async def update_service_area(id: str, req: dict, current_user: dict = Depends(get_current_user)):
    postal_codes = req.get("postal_codes")
    if isinstance(postal_codes, str):
        postal_codes = [item.strip() for item in postal_codes.split(",") if item.strip()]

    canton = req.get("canton", req.get("KANTON"))

    requested_slug = req.get("slug")
    if requested_slug is not None:
        slug_norm = requested_slug.lower().strip().replace(" ", "-")
        conflict_area = await db.service_areas.find_one({"slug": slug_norm, "_id": {"$ne": ObjectId(id)}})
        if conflict_area:
            raise HTTPException(status_code=400, detail="Slug already exists for another service area.")

    area_doc = {
        "name": req.get("name"),
        "slug": slug_norm if requested_slug is not None else None,
        "canton": canton,
        "city": req.get("city"),
        "postal_codes": postal_codes,
        "short_description": req.get("short_description"),
        "description": req.get("description"),
        "image_url": req.get("image_url"),
        "mobile_image_url": req.get("mobile_image_url"),
        "icon": req.get("icon"),
        "latitude": req.get("latitude"),
        "longitude": req.get("longitude"),
        "radius": req.get("radius"),
        "is_active": req.get("is_active"),
        "is_featured": req.get("is_featured"),
        "show_on_homepage": req.get("show_on_homepage"),
        "sort_order": req.get("sort_order"),
        "cta_text": req.get("cta_text"),
        "cta_link": req.get("cta_link"),
        "service_ids": req.get("service_ids")
    }
    area_doc = {k: v for k, v in area_doc.items() if v is not None}
    if "latitude" in area_doc: area_doc["latitude"] = float(area_doc["latitude"])
    if "longitude" in area_doc: area_doc["longitude"] = float(area_doc["longitude"])
    if "radius" in area_doc: area_doc["radius"] = float(area_doc["radius"])
    if "sort_order" in area_doc: area_doc["sort_order"] = int(area_doc["sort_order"])

    await db.service_areas.update_one({"_id": ObjectId(id)}, {"$set": area_doc})
    await log_activity(current_user["email"], current_user["role"], f"Updated service area {id}")
    return {"success": True}

@api_router.delete("/admin/service-areas/{id}", dependencies=[Depends(require_admin)])
async def delete_service_area(id: str, current_user: dict = Depends(get_current_user)):
    await db.service_areas.delete_one({"_id": ObjectId(id)})
    await log_activity(current_user["email"], current_user["role"], f"Deleted service area {id}")
    return {"success": True}

# --- HOMEPAGE SECTION CONFIG ---

@api_router.get("/homepage-sections/service-areas")
async def get_service_area_homepage_section():
    section = await db.homepage_sections.find_one({"key": "service_areas"})
    if not section:
        return {
            "key": "service_areas",
            "title": "Unsere Einsatzgebiete",
            "subtitle": "Wir sind für unsere Kunden in Zürich, Aarau, Aargau und Olten im Einsatz.",
            "description": "Senden Sie uns Ihre Projektanfrage – wir prüfen gerne, ob Ihr Standort in unserem Einsatzgebiet liegt.",
            "cta_text": "Offerte anfragen",
            "cta_link": "/quote-request",
            "show_on_homepage": True,
            "show_map": True,
            "show_featured_only": False,
            "limit": 6,
            "background_color": "#FAF9F6",
            "text_color": "#0F172A",
            "accent_color": "#C5A880"
        }
    return serialize_doc(section)

@api_router.get("/admin/homepage-sections/service-areas", dependencies=[Depends(require_admin)])
async def get_admin_service_area_homepage_section():
    section = await db.homepage_sections.find_one({"key": "service_areas"})
    if not section:
        return {
            "key": "service_areas",
            "title": "Unsere Einsatzgebiete",
            "subtitle": "Wir sind für unsere Kunden in Zürich, Aarau, Aargau und Olten im Einsatz.",
            "description": "Senden Sie uns Ihre Projektanfrage – wir prüfen gerne, ob Ihr Standort in unserem Einsatzgebiet liegt.",
            "cta_text": "Offerte anfragen",
            "cta_link": "/quote-request",
            "show_on_homepage": True,
            "show_map": True,
            "show_featured_only": False,
            "limit": 6,
            "background_color": "#FAF9F6",
            "text_color": "#0F172A",
            "accent_color": "#C5A880"
        }
    return serialize_doc(section)

@api_router.put("/admin/homepage-sections/service-areas", dependencies=[Depends(require_admin)])
async def update_service_area_homepage_section(req: dict, current_user: dict = Depends(get_current_user)):
    payload = {
        "key": "service_areas",
        "title": req.get("title", "Unsere Einsatzgebiete"),
        "subtitle": req.get("subtitle", "Wir sind für unsere Kunden in Zürich, Aarau, Aargau und Olten im Einsatz."),
        "description": req.get("description", "Senden Sie uns Ihre Projektanfrage – wir prüfen gerne, ob Ihr Standort in unserem Einsatzgebiet liegt."),
        "cta_text": req.get("cta_text", "Offerte anfragen"),
        "cta_link": req.get("cta_link", "/quote-request"),
        "show_on_homepage": req.get("show_on_homepage", True),
        "show_map": req.get("show_map", True),
        "show_featured_only": req.get("show_featured_only", False),
        "limit": int(req.get("limit", 6)),
        "background_color": req.get("background_color", "#FAF9F6"),
        "text_color": req.get("text_color", "#0F172A"),
        "accent_color": req.get("accent_color", "#C5A880")
    }
    await db.homepage_sections.update_one({"key": "service_areas"}, {"$set": payload}, upsert=True)
    await log_activity(current_user["email"], current_user["role"], "Updated service area homepage section")
    return {"success": True}

# --- DYNAMIC PAGES CMS (PAGE BUILDER) ---

@api_router.get("/pages")
async def get_published_pages():
    pages = await db.pages.find({"published": True}).to_list(100)
    return [serialize_doc(p) for p in pages]

@api_router.get("/pages/slug/{slug}")
async def get_page_by_slug(slug: str):
    page = await db.pages.find_one({"slug": slug, "published": True})
    if not page:
        raise HTTPException(status_code=404, detail="Seite nicht gefunden.")
    return serialize_doc(page)

@api_router.get("/admin/pages", dependencies=[Depends(require_admin)])
async def get_admin_pages():
    pages = await db.pages.find({}).to_list(100)
    return [serialize_doc(p) for p in pages]

@api_router.post("/admin/pages", dependencies=[Depends(require_admin)])
async def create_page(req: dict, current_user: dict = Depends(get_current_user)):
    slug_norm = req.get("slug", "").lower().strip().replace(" ", "-")
    existing_page = await db.pages.find_one({"slug": slug_norm})
    if existing_page:
        raise HTTPException(status_code=400, detail="Slug already exists for another page.")
    page_doc = {
        "title": req.get("title", ""),
        "slug": slug_norm,
        "content": req.get("content", ""),
        "published": req.get("published", True),
        "on_startpage": req.get("on_startpage", False),
        "menu_position": req.get("menu_position", "none"), # header, footer, none
        "seo_title": req.get("seo_title", ""),
        "seo_description": req.get("seo_description", ""),
        "seo_keywords": req.get("seo_keywords", ""),
        "password_protected": req.get("password_protected", False),
        "password": req.get("password", ""),
        "created_at": datetime.now(timezone.utc)
    }
    
    # Store page revision history
    res = await db.pages.insert_one(page_doc)
    page_doc["_id"] = res.inserted_id
    
    await db.page_revisions.insert_one({
        "page_id": str(res.inserted_id),
        "version": 1,
        "title": page_doc["title"],
        "content": page_doc["content"],
        "updated_by": current_user["email"],
        "updated_at": datetime.now(timezone.utc)
    })
    
    await log_activity(current_user["email"], current_user["role"], "Created CMS page", new_val=page_doc["title"])
    return serialize_doc(page_doc)

@api_router.put("/admin/pages/{page_id}", dependencies=[Depends(require_admin)])
async def update_page(page_id: str, req: dict, current_user: dict = Depends(get_current_user)):
    existing = await db.pages.find_one({"_id": ObjectId(page_id)})
    if not existing:
        raise HTTPException(status_code=404, detail="Seite nicht gefunden.")
        
    slug_norm = req.get("slug", "").lower().strip().replace(" ", "-")
    if "slug" in req:
        conflict_page = await db.pages.find_one({"slug": slug_norm, "_id": {"$ne": ObjectId(page_id)}})
        if conflict_page:
            raise HTTPException(status_code=400, detail="Slug already exists for another page.")
    page_doc = {
        "title": req.get("title", existing["title"]),
        "slug": slug_norm if "slug" in req else existing["slug"],
        "content": req.get("content", existing["content"]),
        "published": req.get("published", existing.get("published", True)),
        "on_startpage": req.get("on_startpage", existing.get("on_startpage", False)),
        "menu_position": req.get("menu_position", existing.get("menu_position", "none")),
        "seo_title": req.get("seo_title", existing.get("seo_title", "")),
        "seo_description": req.get("seo_description", existing.get("seo_description", "")),
        "seo_keywords": req.get("seo_keywords", existing.get("seo_keywords", "")),
        "password_protected": req.get("password_protected", existing.get("password_protected", False)),
        "password": req.get("password", existing.get("password", ""))
    }
    
    await db.pages.update_one({"_id": ObjectId(page_id)}, {"$set": page_doc})
    
    # Create new revision
    revisions_count = await db.page_revisions.count_documents({"page_id": page_id})
    await db.page_revisions.insert_one({
        "page_id": page_id,
        "version": revisions_count + 1,
        "title": page_doc["title"],
        "content": page_doc["content"],
        "updated_by": current_user["email"],
        "updated_at": datetime.now(timezone.utc)
    })
    
    await log_activity(current_user["email"], current_user["role"], f"Updated CMS page {page_id}", old_val=existing["title"], new_val=page_doc["title"])
    return {"success": True}

@api_router.delete("/admin/pages/{page_id}", dependencies=[Depends(require_admin)])
async def delete_page(page_id: str, current_user: dict = Depends(get_current_user)):
    await db.pages.delete_one({"_id": ObjectId(page_id)})
    await db.page_revisions.delete_many({"page_id": page_id})
    await log_activity(current_user["email"], current_user["role"], f"Deleted CMS page {page_id}")
    return {"success": True}

# --- ADMIN PROJECTS MANAGEMENT ---

@api_router.get("/admin/projects", dependencies=[Depends(require_admin)])
async def get_admin_projects():
    projects = await db.projects.find({}).sort("order", 1).to_list(200)
    return [serialize_doc(p) for p in projects]

@api_router.post("/admin/projects", dependencies=[Depends(require_admin)])
async def create_project(req: dict, current_user: dict = Depends(get_current_user)):
    slug_norm = req.get("slug", "").lower().strip().replace(" ", "-")
    existing = await db.projects.find_one({"slug": slug_norm})
    if existing:
        raise HTTPException(status_code=400, detail="Slug already exists for another project.")
    project_doc = {
        "title": req.get("title", ""),
        "slug": slug_norm,
        "category": req.get("category", "commercial"),
        "image_url": req.get("image_url", ""),
        "location": req.get("location", ""),
        "duration": req.get("duration", ""),
        "materials": req.get("materials", ""),
        "works": req.get("works", ""),
        "desc": req.get("desc", ""),
        "active": req.get("active", True),
        "featured": req.get("featured", False),
        "order": int(req.get("order", 0)),
        "created_at": datetime.now(timezone.utc)
    }
    res = await db.projects.insert_one(project_doc)
    project_doc["_id"] = res.inserted_id
    await log_activity(current_user["email"], current_user["role"], "Created project", new_val=project_doc["title"])
    return serialize_doc(project_doc)

@api_router.put("/admin/projects/{project_id}", dependencies=[Depends(require_admin)])
async def update_project(project_id: str, req: dict, current_user: dict = Depends(get_current_user)):
    existing = await db.projects.find_one({"_id": ObjectId(project_id)})
    if not existing:
        raise HTTPException(status_code=404, detail="Project not found.")
    slug_norm = req.get("slug", "").lower().strip().replace(" ", "-")
    if slug_norm and slug_norm != existing.get("slug"):
        conflict = await db.projects.find_one({"slug": slug_norm, "_id": {"$ne": ObjectId(project_id)}})
        if conflict:
            raise HTTPException(status_code=400, detail="Slug already exists for another project.")
    project_doc = {
        "title": req.get("title", existing.get("title", "")),
        "slug": slug_norm or existing.get("slug", ""),
        "category": req.get("category", existing.get("category", "commercial")),
        "image_url": req.get("image_url", existing.get("image_url", "")),
        "location": req.get("location", existing.get("location", "")),
        "duration": req.get("duration", existing.get("duration", "")),
        "materials": req.get("materials", existing.get("materials", "")),
        "works": req.get("works", existing.get("works", "")),
        "desc": req.get("desc", existing.get("desc", "")),
        "active": req.get("active", existing.get("active", True)),
        "featured": req.get("featured", existing.get("featured", False)),
        "order": int(req.get("order", existing.get("order", 0)))
    }
    await db.projects.update_one({"_id": ObjectId(project_id)}, {"$set": project_doc})
    await log_activity(current_user["email"], current_user["role"], f"Updated project {project_id}", old_val=existing.get("title"), new_val=project_doc["title"])
    return {"success": True}

@api_router.delete("/admin/projects/{project_id}", dependencies=[Depends(require_admin)])
async def delete_project(project_id: str, current_user: dict = Depends(get_current_user)):
    await db.projects.delete_one({"_id": ObjectId(project_id)})
    await log_activity(current_user["email"], current_user["role"], f"Deleted project {project_id}")
    return {"success": True}

@api_router.get("/projects")
async def get_projects():
    projects = await db.projects.find({"active": True}).sort("order", 1).to_list(200)
    return [serialize_doc(p) for p in projects]

# --- HERO SLIDER MANAGEMENT ---

@api_router.get("/sliders")
async def get_active_sliders():
    sliders = await db.hero_sliders.find({"active": True}).sort("order", 1).to_list(100)
    return [serialize_doc(s) for s in sliders]

@api_router.get("/admin/sliders", dependencies=[Depends(require_admin)])
async def get_admin_sliders():
    sliders = await db.hero_sliders.find({}).sort("order", 1).to_list(100)
    return [serialize_doc(s) for s in sliders]

@api_router.post("/admin/sliders", dependencies=[Depends(require_admin)])
async def create_slider(req: dict, current_user: dict = Depends(get_current_user)):
    slider_doc = {
        "title": req.get("title", ""),
        "subtitle": req.get("subtitle", ""),
        "desc": req.get("desc", ""),
        "image_desktop": req.get("image_desktop", "https://images.pexels.com/photos/10298352/pexels-photo-10298352.jpeg"),
        "image_mobile": req.get("image_mobile", "https://images.pexels.com/photos/10298352/pexels-photo-10298352.jpeg"),
        "btn1_text": req.get("btn1_text", ""),
        "btn1_link": req.get("btn1_link", ""),
        "btn2_text": req.get("btn2_text", ""),
        "btn2_link": req.get("btn2_link", ""),
        "active": req.get("active", True),
        "order": int(req.get("order", 0)),
        "overlay_opacity": float(req.get("overlay_opacity", 0.4)),
        "transition_speed": int(req.get("transition_speed", 5000)),
        "created_at": datetime.now(timezone.utc)
    }
    res = await db.hero_sliders.insert_one(slider_doc)
    slider_doc["_id"] = res.inserted_id
    await log_activity(current_user["email"], current_user["role"], "Created hero slider", new_val=req.get("title"))
    return serialize_doc(slider_doc)

@api_router.put("/admin/sliders/{slider_id}", dependencies=[Depends(require_admin)])
async def update_slider(slider_id: str, req: dict, current_user: dict = Depends(get_current_user)):
    slider_doc = {
        "title": req.get("title", ""),
        "subtitle": req.get("subtitle", ""),
        "desc": req.get("desc", ""),
        "image_desktop": req.get("image_desktop"),
        "image_mobile": req.get("image_mobile"),
        "btn1_text": req.get("btn1_text", ""),
        "btn1_link": req.get("btn1_link", ""),
        "btn2_text": req.get("btn2_text", ""),
        "btn2_link": req.get("btn2_link", ""),
        "active": req.get("active", True),
        "order": int(req.get("order", 0)),
        "overlay_opacity": float(req.get("overlay_opacity", 0.4)),
        "transition_speed": int(req.get("transition_speed", 5000))
    }
    await db.hero_sliders.update_one({"_id": ObjectId(slider_id)}, {"$set": slider_doc})
    await log_activity(current_user["email"], current_user["role"], f"Updated hero slider {slider_id}", new_val=req.get("title"))
    return {"success": True}

@api_router.delete("/admin/sliders/{slider_id}", dependencies=[Depends(require_admin)])
async def delete_slider(slider_id: str, current_user: dict = Depends(get_current_user)):
    await db.hero_sliders.delete_one({"_id": ObjectId(slider_id)})
    await log_activity(current_user["email"], current_user["role"], f"Deleted hero slider {slider_id}")
    return {"success": True}

# --- SERVICE AREA CHECK ---

@api_router.get("/postcode/check/{postcode}")
async def check_postcode(postcode: str):
    return await check_postcode_service_area(postcode)

# --- PUBLIC REVIEWS ENDPOINTS ---

@api_router.get("/reviews")
async def get_approved_reviews():
    reviews = await db.reviews.find(
        {"approved": True},
        {
            "name": 1,
            "location": 1,
            "rating": 1,
            "comment": 1,
            "service": 1,
            "date": 1,
            "created_at": 1,
        },
    ).sort("created_at", -1).to_list(100)
    return [serialize_doc(r) for r in reviews]

@api_router.post("/reviews")
async def create_review(req: dict, request: Request):
    now = datetime.now(timezone.utc)
    ip = get_client_ip(request)
    user_agent = request.headers.get("user-agent", "")

    # Honeypot: bots often fill hidden fields; return success silently.
    if str(req.get("website", "")).strip():
        return {"success": True, "queued": True}

    submitted_at_raw = req.get("submitted_at")
    if submitted_at_raw:
        try:
            submitted_at = datetime.fromisoformat(str(submitted_at_raw).replace("Z", "+00:00"))
            if (now - submitted_at).total_seconds() < REVIEW_MIN_SUBMIT_SECONDS:
                raise HTTPException(status_code=429, detail="Zu schnelle Übermittlung erkannt. Bitte erneut versuchen.")
        except ValueError:
            raise HTTPException(status_code=400, detail="Ungültige Formularzeit.")

    name = str(req.get("name", "Anonym")).strip()[:80]
    location = str(req.get("location", "")).strip()[:80]
    service = str(req.get("service", "")).strip()[:80]
    comment = str(req.get("comment", "")).strip()
    rating_raw = req.get("rating", 5)

    if len(comment) < 20:
        raise HTTPException(status_code=400, detail="Bitte schreiben Sie mindestens 20 Zeichen.")
    if len(comment) > 1200:
        raise HTTPException(status_code=400, detail="Bewertung ist zu lang.")

    if contains_spam_content(comment) or contains_spam_content(name):
        raise HTTPException(status_code=400, detail="Bewertung enthält nicht erlaubte Inhalte.")

    try:
        rating = min(5, max(1, int(rating_raw)))
    except (TypeError, ValueError):
        raise HTTPException(status_code=400, detail="Ungültige Bewertung.")

    comment_norm = normalize_review_text(comment)
    fingerprint_src = f"{ip}|{user_agent}|{name.lower()}|{location.lower()}"
    fingerprint = hashlib.sha256(fingerprint_src.encode("utf-8")).hexdigest()

    one_hour_ago = now - timedelta(hours=1)
    one_day_ago = now - timedelta(days=1)

    ip_hourly = await db.reviews.count_documents({
        "ip_address": ip,
        "created_at": {"$gte": one_hour_ago}
    })
    if ip_hourly >= REVIEW_MAX_PER_HOUR_PER_IP:
        raise HTTPException(status_code=429, detail="Zu viele Bewertungen in kurzer Zeit. Bitte später erneut versuchen.")

    recent_same_ip = await db.reviews.find_one({
        "ip_address": ip,
        "created_at": {"$gte": now - timedelta(seconds=REVIEW_MIN_GAP_PER_IP_SECONDS)}
    })
    if recent_same_ip:
        raise HTTPException(status_code=429, detail="Bitte kurz warten, bevor Sie erneut senden.")

    fp_daily = await db.reviews.count_documents({
        "fingerprint": fingerprint,
        "created_at": {"$gte": one_day_ago}
    })
    if fp_daily >= REVIEW_MAX_PER_DAY_PER_FINGERPRINT:
        raise HTTPException(status_code=429, detail="Tageslimit erreicht. Vielen Dank für Ihr Verständnis.")

    duplicate = await db.reviews.find_one({
        "fingerprint": fingerprint,
        "comment_norm": comment_norm,
        "created_at": {"$gte": now - timedelta(days=30)}
    })
    if duplicate:
        raise HTTPException(status_code=409, detail="Diese Bewertung wurde bereits übermittelt.")

    review_doc = {
        "name": name,
        "location": location,
        "rating": rating,
        "comment": comment,
        "comment_norm": comment_norm,
        "service": service,
        "date": req.get("date", now.strftime("%d.%m.%Y")),
        "approved": False,
        "ip_address": ip,
        "user_agent": user_agent[:300],
        "fingerprint": fingerprint,
        "created_at": now
    }
    res = await db.reviews.insert_one(review_doc)
    review_doc["_id"] = res.inserted_id
    return {"success": True, "queued": True, "review": serialize_doc(review_doc)}

# --- FAQS ENDPOINTS ---

@api_router.get("/faqs")
async def get_faqs(category: Optional[str] = None):
    query = {}
    if category:
        query["category"] = category
    faqs = await db.faqs.find(query).to_list(200)
    return [serialize_doc(f) for f in faqs]

@api_router.get("/admin/faqs", dependencies=[Depends(require_admin)])
async def get_admin_faqs():
    faqs = await db.faqs.find({}).to_list(200)
    return [serialize_doc(f) for f in faqs]

# --- CONTACT & CALLBACK ENDPOINTS ---

@api_router.post("/contact")
async def submit_contact(req: dict):
    contacts_count = await db.contacts.count_documents({})
    ticket_num = f"KON-2026-{str(contacts_count + 1).zfill(6)}"
    
    contact_doc = {
        "ticket_number": ticket_num,
        "name": req.get("name", ""),
        "email": req.get("email", ""),
        "phone": req.get("phone", ""),
        "message": req.get("message", ""),
        "status": "Neu",
        "replies": [],
        "created_at": datetime.now(timezone.utc)
    }
    await db.contacts.insert_one(contact_doc)
    
    await db.notifications.insert_one({
        "message": f"Neue Kontaktanfrage ({ticket_num}) von {contact_doc['name']}",
        "read": False,
        "priority": "Wichtig",
        "created_at": datetime.now(timezone.utc)
    })
    return {"success": True, "ticket_number": ticket_num, "message": "Kontaktformular erfolgreich übermittelt."}

@api_router.post("/callback")
async def submit_callback(req: dict):
    now = datetime.now(timezone.utc)
    callback_name = str(req.get("name", "")).strip()
    callback_phone = str(req.get("phone", "")).strip()
    callback_time = str(req.get("preferred_time", "")).strip()
    callback_service = str(req.get("service", "")).strip()

    if not callback_name or not callback_phone:
        raise HTTPException(status_code=400, detail="Name und Telefonnummer sind erforderlich.")

    callback_doc = {
        "name": callback_name,
        "phone": callback_phone,
        "preferred_time": callback_time,
        "service": callback_service,
        "status": "Neu",
        "created_at": now
    }
    await db.callbacks.insert_one(callback_doc)

    notif_message = (
        f"Neue Rückrufanfrage von {callback_name} | Tel: {callback_phone}"
        f" | Zeit: {callback_time or '-'} | Service: {callback_service or '-'}"
    )
    await db.notifications.insert_one({
        "message": notif_message,
        "read": False,
        "priority": "Wichtig",
        "created_at": now
    })

    general_settings = await db.system_settings.find_one({"key": "general"})
    admin_email = (
        (general_settings or {}).get("value", {}).get("email")
        or "info@plattenlegerallerart.ch"
    )
    callback_mail_html = f"""
        <h2>Neue Rückrufanfrage</h2>
        <p>Eine neue Anfrage wurde über die Website eingereicht.</p>
        <ul>
          <li><b>Name:</b> {callback_name}</li>
          <li><b>Telefon:</b> {callback_phone}</li>
          <li><b>Bevorzugte Zeit:</b> {callback_time or '-'}</li>
          <li><b>Service:</b> {callback_service or '-'}</li>
        </ul>
        <p>Bitte im Admin-Bereich unter <b>Nachrichten & Calls</b> prüfen.</p>
    """
    from email_service import send_email_async
    await send_email_async(
        db,
        admin_email,
        f"Neue Rückrufanfrage - {callback_name}",
        callback_mail_html,
        quote_num="CALLBACK"
    )

    return {"success": True, "message": "Rückrufanfrage erfolgreich eingereicht."}

# --- FILE UPLOADS ---

@api_router.post("/quotes/upload")
async def upload_quote_file(request: Request, file: UploadFile = File(...)):
    ext = os.path.splitext(file.filename)[1].lower()
    allowed_exts = [".jpg", ".jpeg", ".png", ".webp", ".pdf", ".dwg", ".zip"]
    if ext not in allowed_exts:
        raise HTTPException(status_code=400, detail="Dateityp nicht erlaubt.")
    
    unique_name = f"{uuid.uuid4()}{ext}"
    target_path = UPLOAD_DIR / unique_name
    
    with open(target_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    # Build absolute URL for uploaded file depending on deployment
    frontend_url = os.environ.get("FRONTEND_URL")
    if frontend_url:
        host = frontend_url.rstrip('/')
    else:
        host = str(request.base_url).rstrip('/')

    return {
        "filename": file.filename,
        "stored_name": unique_name,
        "url": f"{host}/uploads/{unique_name}",
        "size": os.path.getsize(target_path)
    }

# --- QUOTE SUBMISSION & MESSAGES (CLIENT & ADMIN) ---

@api_router.post("/quotes")
async def submit_quote(req: dict):
    postcode = req.get("postal_code", "")
    pc_check = await check_postcode_service_area(postcode)
    
    quotes_count = await db.quotes.count_documents({})
    ref_num = f"OFF-2026-{str(quotes_count + 1).zfill(6)}"
    
    quote_doc = {
        "reference_number": ref_num,
        "services": req.get("services", []),
        "project_type": req.get("project_type", ""),
        "object_areas": req.get("object_areas", []),
        "surface_area": req.get("surface_area", ""),
        "rooms_count": req.get("rooms_count", ""),
        "desired_start": req.get("desired_start", ""),
        "desired_completion": req.get("desired_completion", ""),
        "underground_condition": req.get("underground_condition", ""),
        "existing_tiles_present": req.get("existing_tiles_present", False),
        "existing_tiles_remove": req.get("existing_tiles_remove", False),
        "material_status": req.get("material_status", ""),
        "additional_notes": req.get("additional_notes", ""),
        "files": req.get("files", []),
        
        # Location
        "street": req.get("street", ""),
        "house_number": req.get("house_number", ""),
        "postal_code": postcode,
        "city": req.get("city", ""),
        "region": pc_check.get("region") or req.get("region", "Unbekannt"),
        "outside_area": not pc_check.get("allowed", False),
        "floor": req.get("floor", ""),
        "lift_available": req.get("lift_available", False),
        "parking_available": req.get("parking_available", False),
        
        # Client info
        "first_name": req.get("first_name", ""),
        "last_name": req.get("last_name", ""),
        "company": req.get("company", ""),
        "phone": req.get("phone", ""),
        "email": req.get("email", ""),
        "preferred_contact": req.get("preferred_contact", "E-Mail"),
        "preferred_time": req.get("preferred_time", ""),
        "language": req.get("language", "de"),
        
        # Detailed Quote Items (Admin Preparations)
        "items": req.get("items", []),
        "discount_pct": float(req.get("discount_pct", 0.0)),
        "mwst_active": req.get("mwst_active", True),
        "mwst_rate": float(req.get("mwst_rate", 8.1)),
        "validity_days": int(req.get("validity_days", 30)),
        "payment_terms": req.get("payment_terms", "30 Tage netto"),
        
        # Client viewing tokens
        "secure_token": str(uuid.uuid4().hex),
        
        # Admin controls
        "status": "Neu", 
        "internal_notes": [],
        "created_at": datetime.now(timezone.utc),
    }
    
    res = await db.quotes.insert_one(quote_doc)
    quote_doc["_id"] = res.inserted_id
    
    # Generate AI summary in background/asynchronously using the LLM Key
    ai_summary = await generate_ai_quote_summary(quote_doc)
    await db.quotes.update_one({"_id": res.inserted_id}, {"$set": {"ai_summary": ai_summary}})
    quote_doc["ai_summary"] = ai_summary
    
    # Create notification for admin
    await db.notifications.insert_one({
        "message": f"Neue Offertenanfrage {ref_num} von {quote_doc['first_name']} {quote_doc['last_name']}",
        "read": False,
        "priority": "Wichtig",
        "created_at": datetime.now(timezone.utc)
    })
    
    # Dynamically generate ReportLab A4 PDF and attach to confirmation email
    try:
        from email_service import build_and_send_quote_email
        subject = f"Bestätigung Ihrer Offertenanfrage - {ref_num}"
        html_body = f"""
        <h2>Sehr geehrte/r {quote_doc['first_name']} {quote_doc['last_name']},</h2>
        <p>vielen Dank für Ihre Offertenanfrage bei <b>Plattenleger Aller Art</b>.</p>
        <p>Wir haben Ihre Anfrage erhalten und prüfen diese umgehend. Ihre Referenznummer lautet: <b>{ref_num}</b>.</p>
        <p>Im Anhang finden Sie die Zusammenfassung Ihrer Anfrage als professionelles, rechtssicheres PDF-Dokument.</p>
        <br/>
        <p>Mit freundlichen Grüssen,<br/><b>Plattenleger Aller Art Team</b></p>
        """
        await build_and_send_quote_email(db, quote_doc, html_body, subject, quote_num=ref_num)
    except Exception as pdf_err:
        logger.error(f"Confirmation email/PDF dispatch failed on submit: {pdf_err}")
    
    return {
        "success": True,
        "reference_number": ref_num,
        "quote": serialize_doc(quote_doc)
    }

# --- SECURE CLIENT VIEW & ACTION VIA TOKEN ---

@api_router.get("/quotes/token/{token}")
async def get_quote_by_token(token: str):
    quote = await db.quotes.find_one({"secure_token": token})
    if not quote:
        raise HTTPException(status_code=404, detail="Offerte nicht gefunden.")
    
    if quote.get("status") == "An Kunden gesendet":
        await db.quotes.update_one(
            {"secure_token": token},
            {"$set": {"status": "Vom Kunden geöffnet", "opened_at": datetime.now(timezone.utc)}}
        )
        await db.notifications.insert_one({
            "message": f"Kunde hat die Offerte {quote['reference_number']} geöffnet",
            "read": False,
            "priority": "Information",
            "created_at": datetime.now(timezone.utc)
        })
        quote["status"] = "Vom Kunden geöffnet"
        
    return serialize_doc(quote)

# --- CONTRACT ACCEPTANCE & SIGNATURE ---

@api_router.post("/quotes/token/{token}/accept")
async def accept_and_sign_quote(token: str, req: dict):
    quote = await db.quotes.find_one({"secure_token": token})
    if not quote:
        raise HTTPException(status_code=404, detail="Offerte nicht gefunden.")

    signer_name = str(req.get("signer_name", "")).strip()
    signature_svg = str(req.get("signature_svg", "")).strip()
    if not signer_name:
        raise HTTPException(status_code=400, detail="Der Name des Unterzeichners ist erforderlich.")
    if not signature_svg or signature_svg == "[DIGITAL_SIGNATURE_PLACEHOLDER]":
        raise HTTPException(status_code=400, detail="Die digitale Unterschrift muss ausgefüllt sein.")
    
    contracts_count = await db.contracts.count_documents({})
    vtr_num = f"VTR-2026-{str(contracts_count + 1).zfill(6)}"
    
    raw_hash_data = f"{quote['reference_number']}-{vtr_num}-{signer_name}-{datetime.now(timezone.utc)}"
    verification_hash = hashlib.sha256(raw_hash_data.encode()).hexdigest()[:16].upper()
    
    contract_doc = {
        "contract_number": vtr_num,
        "quote_number": quote["reference_number"],
        "quote_id": str(quote["_id"]),
        "signer_name": signer_name,
        "signer_company": req.get("signer_company", ""),
        "ip_address": req.get("ip_address", "127.0.0.1"),
        "user_agent": req.get("user_agent", "Browser"),
        "signature_svg": signature_svg,
        "verification_hash": verification_hash,
        "status": "Unterschrieben",
        "created_at": datetime.now(timezone.utc)
    }
    
    res = await db.contracts.insert_one(contract_doc)
    
    # Update Quote Status
    await db.quotes.update_one(
        {"_id": quote["_id"]},
        {"$set": {"status": "Akzeptiert", "contract_number": vtr_num, "accepted_at": datetime.now(timezone.utc), "signature_svg": signature_svg}}
    )

    updated_quote = quote.copy()
    updated_quote["status"] = "Akzeptiert"
    updated_quote["contract_number"] = vtr_num
    updated_quote["accepted_at"] = datetime.now(timezone.utc)
    updated_quote["signature_svg"] = signature_svg

    from email_service import build_and_send_quote_email, email_delivery_ok
    subject = f"Ihre unterschriebene Offerte {quote.get('reference_number')}"
    html_body = f"""
        <h2>Sehr geehrte/r {quote.get('first_name', '')} {quote.get('last_name', '')},</h2>
        <p>Ihre Offerte wurde erfolgreich akzeptiert und digital unterschrieben.</p>
        <p>Im Anhang finden Sie den unterschriebenen Vertrag als PDF-Dokument.</p>
        <p>Vielen Dank für Ihr Vertrauen in Swiss Platten GmbH.</p>
    """
    email_result = await build_and_send_quote_email(
        db,
        updated_quote,
        html_body,
        subject,
        quote_num=vtr_num,
        is_contract=True
    )
    if not email_delivery_ok(email_result):
        raise HTTPException(status_code=500, detail=email_result.get("message", "Unterschriebener Vertrag konnte nicht gesendet werden."))

    await db.notifications.insert_one({
        "message": f"Vertrag {vtr_num} für Offerte {quote['reference_number']} wurde unterschrieben und per E-Mail versendet!",
        "read": False,
        "priority": "Dringend",
        "created_at": datetime.now(timezone.utc)
    })
    
    return {
        "success": True,
        "contract_number": vtr_num,
        "verification_hash": verification_hash,
        "contract": serialize_doc(contract_doc),
        "email_status": email_result
    }

# --- MESSAGING CHAT SYSTEMS ---

@api_router.get("/quotes/{quote_id}/messages")
async def get_quote_messages(quote_id: str):
    messages = await db.offerte_messages.find({"quote_id": quote_id}).sort("created_at", 1).to_list(100)
    return [serialize_doc(m) for m in messages]

@api_router.websocket("/quotes/{quote_id}/messages/ws")
async def quote_messages_ws(websocket: WebSocket, quote_id: str):
    await websocket.accept()
    quote_message_connections.setdefault(quote_id, []).append(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        quote_message_connections.get(quote_id, []).remove(websocket)
    except Exception:
        quote_message_connections.get(quote_id, []).remove(websocket)

@api_router.post("/quotes/{quote_id}/messages")
async def send_quote_message(quote_id: str, req: dict):
    msg_doc = {
        "quote_id": quote_id,
        "sender": req.get("sender", "Client"),
        "message": req.get("message", ""),
        "files": req.get("files", []),
        "created_at": datetime.now(timezone.utc)
    }
    result = await db.offerte_messages.insert_one(msg_doc)
    msg_doc["_id"] = result.inserted_id
    sent_message = serialize_doc(msg_doc)
    await broadcast_quote_message(quote_id, sent_message)
    
    if req.get("sender") == "Client":
        await db.notifications.insert_one({
            "message": f"Neue Nachricht für Offerte von Kunde",
            "read": False,
            "priority": "Information",
            "created_at": datetime.now(timezone.utc)
        })
        
    return sent_message

# --- PDF GENERATION & STREAMING ---

@api_router.get("/quotes/{quote_id}/pdf")
async def download_quote_pdf(quote_id: str):
    from pdf_service import build_swiss_pdf
    try:
        quote = await db.quotes.find_one({"_id": ObjectId(quote_id)})
        if not quote:
            raise HTTPException(status_code=404, detail="Offerte nicht gefunden.")
        
        last_name = quote.get("last_name", "Kunde").replace(" ", "_")
        company = quote.get("company", "Privat").replace(" ", "_")
        filename = f"Offerte_{quote.get('reference_number', 'OFF')}_{last_name}_{company}.pdf"
        
        pdf_filename = f"{uuid.uuid4()}.pdf"
        target_path = UPLOAD_DIR / pdf_filename
        
        build_swiss_pdf(quote, str(target_path), is_contract=False)
        
        def iterfile():
            with open(target_path, mode="rb") as f:
                yield from f
                
        headers = {"Content-Disposition": f"attachment; filename={filename}"}
        return StreamingResponse(iterfile(), media_type="application/pdf", headers=headers)
    except Exception as e:
        logger.error(f"Error generating Quote PDF: {e}")
        raise HTTPException(status_code=500, detail=f"Fehler bei der PDF-Generierung: {e}")

@api_router.get("/quotes/{quote_id}/contract-pdf")
async def download_contract_pdf(quote_id: str):
    from pdf_service import build_swiss_pdf
    try:
        quote = await db.quotes.find_one({"_id": ObjectId(quote_id)})
        if not quote:
            raise HTTPException(status_code=404, detail="Offerte nicht gefunden.")
        
        contract = await db.contracts.find_one({"quote_id": quote_id})
        if contract:
            quote["contract_number"] = contract.get("contract_number")
            quote["signer_name"] = contract.get("signer_name")
            quote["signer_company"] = contract.get("signer_company")
            quote["ip_address"] = contract.get("ip_address")
            quote["verification_hash"] = contract.get("verification_hash")
            quote["signature_svg"] = contract.get("signature_svg")
            
        last_name = quote.get("last_name", "Kunde").replace(" ", "_")
        company = quote.get("company", "Privat").replace(" ", "_")
        filename = f"Vertrag_{quote.get('contract_number', 'VTR')}_{last_name}_{company}.pdf"
        
        pdf_filename = f"{uuid.uuid4()}.pdf"
        target_path = UPLOAD_DIR / pdf_filename
        
        build_swiss_pdf(quote, str(target_path), is_contract=True)
        
        def iterfile():
            with open(target_path, mode="rb") as f:
                yield from f
                
        headers = {"Content-Disposition": f"attachment; filename={filename}"}
        return StreamingResponse(iterfile(), media_type="application/pdf", headers=headers)
    except Exception as e:
        logger.error(f"Error generating Contract PDF: {e}")
        raise HTTPException(status_code=500, detail=f"Fehler bei der PDF-Generierung: {e}")

# --- ADMIN ENDPOINTS (PROTECTED BY JWT) ---

@api_router.get("/admin/stats", dependencies=[Depends(require_admin)])
async def get_admin_stats(current_user: dict = Depends(get_current_user)):
    total_quotes = await db.quotes.count_documents({})
    new_quotes = await db.quotes.count_documents({"status": "Neu"})
    pending_quotes = await db.quotes.count_documents({"status": "In Prüfung"})
    approved_quotes = await db.quotes.count_documents({"status": "Akzeptiert"})
    
    total_reviews = await db.reviews.count_documents({})
    pending_reviews = await db.reviews.count_documents({"approved": False})
    
    total_contacts = await db.contacts.count_documents({"status": "Neu"})
    total_callbacks = await db.callbacks.count_documents({"status": "Neu"})
    
    # Calculate sum totals of accepted quotes
    accepted_pipeline = await db.quotes.aggregate([
        {"$match": {"status": "Akzeptiert"}},
        {"$unwind": "$items"},
        {"$group": {"_id": None, "sum": {"$sum": {"$multiply": ["$items.qty", "$items.unit_price"]}}}}
    ]).to_list(1)
    
    accepted_total = accepted_pipeline[0]["sum"] if accepted_pipeline else 0.0
    
    areas_agg = await db.quotes.aggregate([
        {"$group": {"_id": "$region", "count": {"$sum": 1}}}
    ]).to_list(100)
    
    status_agg = await db.quotes.aggregate([
        {"$group": {"_id": "$status", "count": {"$sum": 1}}}
    ]).to_list(100)
    
    return {
        "totals": {
            "quotes": total_quotes,
            "new_quotes": new_quotes,
            "pending_quotes": pending_quotes,
            "completed_quotes": approved_quotes,
            "reviews": total_reviews,
            "pending_reviews": pending_reviews,
            "unread_contacts": total_contacts,
            "unread_callbacks": total_callbacks,
            "accepted_total_ciro": accepted_total
        },
        "regions": {item["_id"] or "Unbekannt": item["count"] for item in areas_agg},
        "statuses": {item["_id"]: item["count"] for item in status_agg}
    }

# --- ADMIN ACCEPETED CONTRACTS / EXPORT & REMINDER SCHEDULERS ---

@api_router.get("/admin/quotes/export-csv", dependencies=[Depends(require_admin)])
async def export_quotes_csv():
    quotes = await db.quotes.find({}).sort("created_at", -1).to_list(1000)
    
    output = io.StringIO()
    writer = csv.writer(output, delimiter=";", quoting=csv.QUOTE_MINIMAL)
    
    writer.writerow([
        "DocumentNumber", "ClientName", "CompanyName", "Email", "Phone", 
        "Street", "City", "ZIP", "Country", "NetTotal", "VATRate", "VATAmount", 
        "GrandTotal", "Status", "Date"
    ])
    
    for q in quotes:
        items = q.get("items", [])
        net_total = sum(float(i.get("qty", 1)) * float(i.get("unit_price", 0)) for i in items)
        discount = net_total * (float(q.get("discount_pct", 0)) / 100)
        net_after_discount = net_total - discount
        vat_rate = float(q.get("mwst_rate", 8.1)) if q.get("mwst_active", True) else 0.0
        vat_amount = net_after_discount * (vat_rate / 100)
        grand_total = net_after_discount + vat_amount
        
        writer.writerow([
            q.get("reference_number", ""),
            f"{q.get('first_name', '')} {q.get('last_name', '')}",
            q.get("company", ""),
            q.get("email", ""),
            q.get("phone", ""),
            f"{q.get('street', '')} {q.get('house_number', '')}",
            q.get("city", ""),
            q.get("postal_code", ""),
            "CH",
            f"{net_after_discount:.2f}",
            f"{vat_rate:.1f}%",
            f"{vat_amount:.2f}",
            f"{grand_total:.2f}",
            q.get("status", ""),
            q.get("created_at").strftime("%Y-%m-%d") if isinstance(q.get("created_at"), datetime) else ""
        ])
        
    output.seek(0)
    headers = {"Content-Disposition": "attachment; filename=bexio_quotes_export.csv"}
    return StreamingResponse(io.BytesIO(output.getvalue().encode("utf-8")), media_type="text/csv", headers=headers)

@api_router.post("/admin/quotes/run-reminders", dependencies=[Depends(require_admin)])
async def run_quote_reminders(current_user: dict = Depends(get_current_user)):
    quotes_to_remind = await db.quotes.find({
        "status": {"$in": ["An Kunden gesendet", "Vom Kunden geöffnet"]}
    }).to_list(1000)
    
    reminded_count = 0
    now = datetime.now(timezone.utc)
    
    for q in quotes_to_remind:
        if not q.get("reminder_sent"):
            ref_num = q.get("reference_number")
            client_email = q.get("email")
            
            await db.quotes.update_one(
                {"_id": q["_id"]},
                {"$set": {
                    "reminder_sent": True, 
                    "reminder_sent_at": now,
                    "status": "Rückfrage erforderlich"
                }}
            )
            
            await log_activity(current_user["email"], current_user["role"], f"Automated follow-up reminder sent to {client_email} for quote {ref_num}")
            
            note_obj = {
                "id": str(uuid.uuid4()),
                "author": "System Scheduler",
                "note": f"Automatisches Follow-Up E-Mail (Erinnerung) erfolgreich gesendet an {client_email}.",
                "created_at": now.isoformat()
            }
            await db.quotes.update_one(
                {"_id": q["_id"]},
                {"$push": {"internal_notes": note_obj}}
            )
            
            await db.notifications.insert_one({
                "message": f"Automatisches Erinnerungs-E-Mail gesendet an {q['first_name']} {q['last_name']} ({ref_num})",
                "read": False,
                "priority": "Wichtig",
                "created_at": now
            })
            
            reminded_count += 1
            logger.info(f"[SCHEDULER REMINDER] Dispatched automated reminder email to {client_email} for {ref_num}")
            
    return {"success": True, "reminded_count": reminded_count}

@api_router.get("/admin/quotes", dependencies=[Depends(require_admin)])
async def get_admin_quotes(
    status: Optional[str] = None,
    region: Optional[str] = None,
    service: Optional[str] = None
):
    query = {}
    if status:
        query["status"] = status
    if region:
        query["region"] = region
    if service:
        query["services"] = service
        
    quotes = await db.quotes.find(query).sort("created_at", -1).to_list(500)
    return [serialize_doc(q) for q in quotes]

@api_router.put("/admin/quotes/{quote_id}", dependencies=[Depends(require_admin)])
async def update_quote_full(quote_id: str, req: dict, current_user: dict = Depends(get_current_user)):
    update_data = {}
    for field in [
        "status", "items", "discount_pct", "mwst_active", "mwst_rate", 
        "validity_days", "payment_terms", "desired_start", "desired_completion"
    ]:
        if field in req:
            update_data[field] = req[field]
            
    update_data["updated_at"] = datetime.now(timezone.utc)

    if update_data.get("status") == "An Kunden gesendet":
        quote = await db.quotes.find_one({"_id": ObjectId(quote_id)})
        if not quote:
            raise HTTPException(status_code=404, detail="Anfrage nicht gefunden.")
        if not quote.get("email"):
            raise HTTPException(status_code=400, detail="Kunde hat keine E-Mail-Adresse.")

        from email_service import build_and_send_quote_email, email_delivery_ok
        frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000").rstrip("/")
        accept_link = f"{frontend_url}/quotes/token/{quote.get('secure_token')}"
        subject = f"Ihre Offerte - {quote.get('reference_number', 'OFF')}"
        html_body = f"""
        <h2>Sehr geehrte/r {quote.get('first_name', '')} {quote.get('last_name', '')},</h2>
        <p>anbei erhalten Sie Ihre Offerte von <b>Plattenleger Aller Art</b>.</p>
        <p>Bitte prüfen Sie die Offerte und akzeptieren Sie diese online über den folgenden Button:</p>
        <p style=\"margin:24px 0;\"><a href=\"{accept_link}\" style=\"display:inline-block;padding:14px 24px;background-color:#1d4ed8;color:#ffffff;text-decoration:none;font-weight:bold;border-radius:8px;\">Offerte akzeptieren &amp; signieren</a></p>
        <p>Alternativ können Sie diesen direkten Link verwenden:</p>
        <p><a href=\"{accept_link}\" style=\"color:#1d4ed8;text-decoration:underline;\">{accept_link}</a></p>
        <p>Auf der Seite können Sie die Offerte einsehen, digital unterschreiben und direkt absenden.</p>
        <p>Mit freundlichen Grüssen,<br/><b>Plattenleger Aller Art Team</b></p>
        """
        email_result = await build_and_send_quote_email(
            db,
            quote,
            html_body,
            subject,
            quote_num=quote.get("reference_number"),
        )
        if not email_delivery_ok(email_result):
            raise HTTPException(status_code=500, detail=email_result.get("message", "E-Mail konnte nicht versendet werden."))

        update_data["sent_at"] = datetime.now(timezone.utc)
        await db.notifications.insert_one({
            "message": f"Offerte {quote.get('reference_number')} an {quote.get('email')} gesendet",
            "read": False,
            "priority": "Information",
            "created_at": datetime.now(timezone.utc)
        })

    await db.quotes.update_one({"_id": ObjectId(quote_id)}, {"$set": update_data})
    await log_activity(current_user["email"], current_user["role"], f"Updated quote data for {quote_id}")
    return {"success": True, "message": "Offerte erfolgreich an den Kunden versendet."}

@api_router.get("/admin/quotes/{quote_id}", dependencies=[Depends(require_admin)])
async def get_admin_quote_detail(quote_id: str):
    quote = await db.quotes.find_one({"_id": ObjectId(quote_id)})
    if not quote:
        raise HTTPException(status_code=404, detail="Anfrage nicht gefunden.")
    return serialize_doc(quote)

@api_router.put("/admin/quotes/{quote_id}/status", dependencies=[Depends(require_admin)])
async def update_quote_status(quote_id: str, req: dict, current_user: dict = Depends(get_current_user)):
    new_status = req.get("status")
    res = await db.quotes.update_one(
        {"_id": ObjectId(quote_id)},
        {"$set": {"status": new_status, "updated_at": datetime.now(timezone.utc)}}
    )
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Anfrage nicht gefunden.")
    await log_activity(current_user["email"], current_user["role"], f"Status updated to {new_status} for quote {quote_id}")
    return {"success": True}

@api_router.post("/admin/quotes/{quote_id}/notes", dependencies=[Depends(require_admin)])
async def add_quote_note(quote_id: str, req: dict, current_user: dict = Depends(get_current_user)):
    note_text = req.get("note", "").strip()
    note_obj = {
        "id": str(uuid.uuid4()),
        "author": current_user["name"],
        "note": note_text,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.quotes.update_one(
        {"_id": ObjectId(quote_id)},
        {"$push": {"internal_notes": note_obj}}
    )
    return {"success": True, "note": note_obj}

@api_router.delete("/admin/quotes/{quote_id}", dependencies=[Depends(require_admin)])
async def delete_quote(quote_id: str):
    await db.quotes.delete_one({"_id": ObjectId(quote_id)})
    return {"success": True}

@api_router.post("/admin/quotes/{quote_id}/regenerate-summary", dependencies=[Depends(require_admin)])
async def regenerate_quote_summary(quote_id: str, current_user: dict = Depends(get_current_user)):
    quote = await db.quotes.find_one({"_id": ObjectId(quote_id)})
    if not quote:
        raise HTTPException(status_code=404, detail="Anfrage nicht gefunden.")
    ai_summary = await generate_ai_quote_summary(quote)
    await db.quotes.update_one({"_id": ObjectId(quote_id)}, {"$set": {"ai_summary": ai_summary}})
    return {"success": True, "ai_summary": ai_summary}

# --- ADMIN ACCEPTED CONTRACTS ("Akzeptierte Verträge") ---

@api_router.get("/admin/contracts", dependencies=[Depends(require_admin)])
async def get_admin_contracts():
    contracts = await db.contracts.find({}).sort("created_at", -1).to_list(100)
    return [serialize_doc(c) for c in contracts]

# --- ADMIN NOTIFICATIONS CENTER ---

@api_router.get("/admin/notifications", dependencies=[Depends(require_admin)])
async def get_admin_notifications():
    notifs = await db.notifications.find({}).sort("created_at", -1).to_list(100)
    return [serialize_doc(n) for n in notifs]

@api_router.put("/admin/notifications/{id}/read", dependencies=[Depends(require_admin)])
async def read_admin_notification(id: str):
    await db.notifications.update_one({"_id": ObjectId(id)}, {"$set": {"read": True}})
    return {"success": True}

# --- ADMIN REVIEWS ---

@api_router.get("/admin/reviews", dependencies=[Depends(require_admin)])
async def get_admin_reviews():
    reviews = await db.reviews.find({}).sort("created_at", -1).to_list(200)
    return [serialize_doc(r) for r in reviews]

@api_router.put("/admin/reviews/{review_id}/approve", dependencies=[Depends(require_admin)])
async def approve_review(review_id: str, req: dict):
    approve_status = req.get("approved", False)
    await db.reviews.update_one(
        {"_id": ObjectId(review_id)},
        {"$set": {"approved": approve_status}}
    )
    return {"success": True}

@api_router.delete("/admin/reviews/{review_id}", dependencies=[Depends(require_admin)])
async def delete_review(review_id: str):
    await db.reviews.delete_one({"_id": ObjectId(review_id)})
    return {"success": True}

# --- ADMIN FAQS ---

@api_router.post("/admin/faqs", dependencies=[Depends(require_admin)])
async def create_or_update_faq(req: dict, current_user: dict = Depends(get_current_user)):
    faq_id = req.get("id")
    faq_doc = {
        "question_de": req.get("question_de", ""),
        "answer_de": req.get("answer_de", ""),
        "question_en": req.get("question_en", ""),
        "answer_en": req.get("answer_en", ""),
        "question_it": req.get("question_it", ""),
        "answer_it": req.get("answer_it", ""),
        "question_fr": req.get("question_fr", ""),
        "answer_fr": req.get("answer_fr", ""),
        "category": req.get("category", "General"),
        "updated_at": datetime.now(timezone.utc)
    }
    if faq_id:
        await db.faqs.update_one({"_id": ObjectId(faq_id)}, {"$set": faq_doc})
        faq_doc["id"] = faq_id
    else:
        faq_doc["created_at"] = datetime.now(timezone.utc)
        res = await db.faqs.insert_one(faq_doc)
        faq_doc["id"] = str(res.inserted_id)
    return serialize_doc(faq_doc)

@api_router.delete("/admin/faqs/{faq_id}", dependencies=[Depends(require_admin)])
async def delete_faq(faq_id: str):
    await db.faqs.delete_one({"_id": ObjectId(faq_id)})
    return {"success": True}

# --- ADMIN CONTACT / CALLBACKS ---

@api_router.get("/admin/contacts", dependencies=[Depends(require_admin)])
async def get_admin_contacts():
    contacts = await db.contacts.find({}).sort("created_at", -1).to_list(200)
    return [serialize_doc(c) for c in contacts]

@api_router.get("/admin/contacts/{contact_id}", dependencies=[Depends(require_admin)])
async def get_admin_contact_detail(contact_id: str):
    contact = await db.contacts.find_one({"_id": ObjectId(contact_id)})
    if not contact:
        raise HTTPException(status_code=404, detail="Nachricht nicht gefunden.")
    return serialize_doc(contact)

@api_router.put("/admin/contacts/{contact_id}/status", dependencies=[Depends(require_admin)])
async def update_contact_status(contact_id: str, req: dict):
    new_status = req.get("status", "Gelesen")
    await db.contacts.update_one({"_id": ObjectId(contact_id)}, {"$set": {"status": new_status}})
    return {"success": True}

@api_router.post("/admin/contacts/{contact_id}/reply", dependencies=[Depends(require_admin)])
async def reply_contact_message(contact_id: str, req: dict, current_user: dict = Depends(get_current_user)):
    reply_text = req.get("reply", "").strip()
    if not reply_text:
        raise HTTPException(status_code=400, detail="Antwort darf nicht leer sein.")
        
    reply_obj = {
        "id": str(uuid.uuid4()),
        "author": current_user["name"],
        "message": reply_text,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.contacts.update_one(
        {"_id": ObjectId(contact_id)},
        {
            "$push": {"replies": reply_obj},
            "$set": {"status": "Beantwortet"}
        }
    )
    
    # Send actual SMTP email copy
    contact = await db.contacts.find_one({"_id": ObjectId(contact_id)})
    if contact:
        subject = f"Re: Ihre Anfrage bei Swiss Platten - [{contact.get('ticket_number')}]"
        from email_service import send_email_async
        await send_email_async(db, contact["email"], subject, reply_text, quote_num=contact.get("ticket_number"))
        
    return {"success": True, "reply": reply_obj}

@api_router.get("/admin/callbacks", dependencies=[Depends(require_admin)])
async def get_admin_callbacks():
    callbacks = await db.callbacks.find({}).sort("created_at", -1).to_list(200)
    return [serialize_doc(c) for c in callbacks]

@api_router.put("/admin/callbacks/{callback_id}/status", dependencies=[Depends(require_admin)])
async def update_callback_status(callback_id: str, req: dict):
    new_status = req.get("status", "Erledigt")
    await db.callbacks.update_one({"_id": ObjectId(callback_id)}, {"$set": {"status": new_status}})
    return {"success": True}

# --- ADMIN SYSTEM AUDIT LOGS ---

@api_router.get("/admin/audit-logs", dependencies=[Depends(require_admin)])
async def get_admin_audit_logs():
    logs = await db.audit_logs.find({}).sort("timestamp", -1).to_list(500)
    return [serialize_doc(l) for l in logs]

# --- PUBLIC CENTRALIZED SYSTEM SETTINGS (SECURE) ---

@api_router.get("/settings")
async def get_public_system_settings():
    settings = await db.system_settings.find({}).to_list(100)
    res = {}
    for s in settings:
        if s["key"] == "smtp":
            smtp_val = dict(s["value"])
            smtp_val.pop("password", None)
            smtp_val.pop("username", None)
            res[s["key"]] = smtp_val
        else:
            res[s["key"]] = s["value"]
    return res

# --- ADMIN CENTRALIZED SYSTEM SETTINGS ---

@api_router.get("/admin/settings", dependencies=[Depends(require_admin)])
async def get_system_settings():
    settings = await db.system_settings.find({}).to_list(100)
    return {s["key"]: s["value"] for s in settings}

@api_router.put("/admin/settings", dependencies=[Depends(require_admin)])
async def update_system_settings(req: dict, current_user: dict = Depends(get_current_user)):
    for key, value in req.items():
        await db.system_settings.update_one(
            {"key": key},
            {"$set": {"value": value}},
            upsert=True
        )
    await log_activity(current_user["email"], current_user["role"], "System settings updated")
    return {"success": True}

@api_router.post("/admin/settings/test-smtp", dependencies=[Depends(require_admin)])
async def test_smtp_connection_endpoint(req: dict):
    host = req.get("host", "")
    port = int(req.get("port", 587))
    user = req.get("username", "")
    password = req.get("password", "")
    test_recipient = req.get("test_recipient", "info@plattenlegerallerart.ch")
    starttls = req.get("starttls", True)
    
    from email_service import run_smtp_diagnostics
    res = await run_smtp_diagnostics(host, port, user, password, test_recipient, starttls=starttls)
    return res

@api_router.get("/admin/email-logs", dependencies=[Depends(require_admin)])
async def get_admin_email_logs():
    logs = await db.email_logs.find({}).sort("created_at", -1).to_list(200)
    return [serialize_doc(l) for l in logs]

# Add router to main app
app.include_router(api_router)

# CORS Middleware (reject wildcard * when credentials=True is needed)
FRONTEND_URL = os.environ.get("FRONTEND_URL", "https://fassadenmeister-dev.preview.emergentagent.com")
allowed_origins = [FRONTEND_URL, "http://localhost:3000"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Startup Seeding Event
@app.on_event("startup")
async def startup_db_seeding():
    logger.info("Initializing database indexes and seeding...")
    
    # Create Indexes
    await db.users.create_index("email", unique=True)
    await db.login_attempts.create_index("identifier")
    
    # 1. Seed Professional Admin User with First-login reset requirement
    admin_email = "admin@plattenlegerallerart.ch"
    admin_password = "Blevh4np1@@"
    existing_admin = await db.users.find_one({"email": admin_email})
    if not existing_admin:
        hashed = hash_password(admin_password)
        await db.users.insert_one({
            "email": admin_email,
            "password_hash": hashed,
            "name": "Super Admin Executive",
            "role": "Super Admin",
            "needs_password_reset": True,
            "created_at": datetime.now(timezone.utc)
        })
        logger.info(f"Seed: Admin successfully created with email {admin_email} (Reset required)")
    else:
        if existing_admin.get("needs_password_reset") is True and not verify_password(admin_password, existing_admin["password_hash"]):
            await db.users.update_one(
                {"email": admin_email},
                {"$set": {"password_hash": hash_password(admin_password)}}
            )

    # Write credentials to the repo memory folder when running locally.
    mem_dir = Path(os.environ.get("APP_MEMORY_DIR", ROOT_DIR.parent / "memory"))
    mem_dir.mkdir(parents=True, exist_ok=True)
    with open(mem_dir / "test_credentials.md", "w", encoding="utf-8") as f:
        f.write(f"""# Auth Test Credentials

- Admin Email: {admin_email}
- Admin Password: {admin_password}
- Admin Role: Super Admin
- Needs Password Reset First: true

## Protected Auth Endpoints:
- Login: `/api/auth/login` (POST)
- Reset First Password: `/api/auth/reset-password-first` (POST)
- Logout: `/api/auth/logout` (POST)
- Me: `/api/auth/me` (GET)
- Admin Stats: `/api/admin/stats` (GET)
- Admin Quotes: `/api/admin/quotes` (GET)
""")
    logger.info("Seed: Written /app/memory/test_credentials.md")

    # 2. Seed Default Sliders
    slider_count = await db.hero_sliders.count_documents({})
    if slider_count == 0:
        default_sliders = [
            {
                "title": "Schweizer Platten- und Natursteinkunst",
                "subtitle": "Exklusivität in Vollendung",
                "desc": "Zürich, Aarau, Kanton Aargau und Olten. Fachgerechte Verlegung grossformatiger Platten und langlebige Spezialabdichtungen.",
                "image_desktop": "https://images.pexels.com/photos/10298352/pexels-photo-10298352.jpeg",
                "image_mobile": "https://images.pexels.com/photos/10298352/pexels-photo-10298352.jpeg",
                "btn1_text": "Kostenlose Offerte",
                "btn1_link": "/quote-request",
                "btn2_text": "Unsere Galerie",
                "btn2_link": "/portfolio",
                "active": True,
                "order": 0,
                "overlay_opacity": 0.45,
                "transition_speed": 5000,
                "created_at": datetime.now(timezone.utc)
            }
        ]
        await db.hero_sliders.insert_many(default_sliders)
        logger.info("Seed: Populated default hero sliders")

    # 3. Seed Default 100 Swiss FAQs
    try:
        from backend.seed_faqs import seed_100_faqs
    except ImportError:
        from seed_faqs import seed_100_faqs
    await seed_100_faqs(db)

    # 4. Seed Default Reviews
    review_count = await db.reviews.count_documents({})
    if review_count == 0:
        default_reviews = [
            {
                "name": "Hans Müller",
                "location": "Zürich",
                "rating": 5,
                "comment": "Hervorragende Arbeit bei der Badrenovierung! Die Fugen sind absolut präzise.",
                "service": "Duschen und Nassbereiche",
                "date": "14.01.2026",
                "approved": True,
                "created_at": datetime.now(timezone.utc)
            }
        ]
        await db.reviews.insert_many(default_reviews)

    # 5. Seed default CMS Pages
    pages_count = await db.pages.count_documents({})
    if pages_count == 0:
        default_pages = [
            {
                "title": "Allgemeine Geschäftsbedingungen",
                "slug": "agb",
                "content": "<h2>Allgemeine Geschäftsbedingungen (AGB)</h2><p>Unsere Allgemeinen Geschäftsbedingungen regeln alle Vertragsbeziehungen...</p>",
                "published": True,
                "menu_position": "footer",
                "seo_title": "AGB - Swiss Platten GmbH",
                "seo_description": "Allgemeine Geschäftsbedingungen der Swiss Platten GmbH Zürich Aargau."
            },
            {
                "title": "Impressum",
                "slug": "impressum",
                "content": "<h2>Impressum</h2><p>Verantwortlich für den Inhalt: Swiss Platten GmbH, Bahnhofstrasse 12, 8000 Zürich...</p>",
                "published": True,
                "menu_position": "footer",
                "seo_title": "Impressum - Swiss Platten GmbH",
                "seo_description": "Impressum der Swiss Platten GmbH."
            },
            {
                "title": "Datenschutz",
                "slug": "datenschutz",
                "content": "<h2>Datenschutzerklärung</h2><p>Datenschutzerklärung gemäss Schweizer Bundesgesetz über den Datenschutz...</p>",
                "published": True,
                "menu_position": "footer",
                "seo_title": "Datenschutzerklärung - Swiss Platten GmbH",
                "seo_description": "Datenschutzerklärung der Swiss Platten GmbH."
            },
            {
                "title": "Cookie-Einstellungen",
                "slug": "cookie-einstellungen",
                "content": "<h2>Cookie-Einstellungen</h2><p>Hier können Sie Ihre Cookie-Einstellungen verwalten. In der lokalen Entwicklung steht diese Seite als CMS-Seite zur Verfügung.</p>",
                "published": True,
                "menu_position": "footer",
                "seo_title": "Cookie-Einstellungen - Swiss Platten GmbH",
                "seo_description": "Cookie-Einstellungen der Swiss Platten GmbH."
            },
            {
                "title": "Über uns",
                "slug": "ueber-uns",
                "content": "<h2>Über uns</h2><p>Swiss Platten steht für präzise Ausführung, hochwertige Materialien und zuverlässigen Service.</p>",
                "published": True,
                "menu_position": "header",
                "seo_title": "Über uns - Swiss Platten GmbH",
                "seo_description": "Erfahren Sie mehr über Swiss Platten und unsere Arbeitsweise."
            }
        ]
        await db.pages.insert_many(default_pages)
        logger.info("Seed: Seeded default legal CMS pages")

    # 6. Seed default system settings
    settings_count = await db.system_settings.count_documents({})
    if settings_count == 0:
        await db.system_settings.insert_many([
            {
                "key": "general",
                "value": {
                    "site_name": "Swiss Platten",
                    "company_name": "Swiss Platten GmbH",
                    "phone": "+41 79 123 45 67",
                    "email": "info@plattenlegerallerart.ch",
                    "address": "Bahnhofstrasse 30, 5430 Wettingen",
                    "uid": "CHE-123.456.789 MWST",
                    "logo_mode": "text",
                    "logo_text": "SWISS PLATTEN",
                    "logo_subtitle": "Atelier d'Architecture",
                    "logo_image_url": "",
                    "logo_image_alt": "Swiss Platten Logo"
                }
            },
            {
                "key": "smtp",
                "value": {
                    "host": "smtp.plattenlegerallerart.ch",
                    "port": 587,
                    "username": "smtp_user",
                    "password": "encrypted_password_placeholder",
                    "active": False
                }
            },
            {
                "key": "cookies",
                "value": {
                    "enabled": True,
                    "banner_title": "Wir verwenden Cookies mit Stil",
                    "banner_text": "Für ein schnelleres, sichereres und besseres Nutzererlebnis verwenden wir nur die notwendigsten Cookies sowie optionale Analyse-Cookies nach Ihrer Zustimmung.",
                    "accept_text": "Alle akzeptieren",
                    "reject_text": "Nur notwendige",
                    "settings_text": "Cookie-Einstellungen",
                    "save_text": "Auswahl speichern",
                    "policy_link_text": "Cookie-Richtlinie",
                    "policy_link_url": "/cookie-einstellungen",
                    "necessary_label": "Notwendige Cookies",
                    "analytics_label": "Analyse Cookies",
                    "marketing_label": "Marketing Cookies",
                    "necessary_desc": "Diese Cookies sind technisch erforderlich und immer aktiv.",
                    "analytics_desc": "Hilft uns, die Website qualitativ zu verbessern.",
                    "marketing_desc": "Wird für personalisierte Inhalte und Kampagnen genutzt.",
                    "show_preferences_link": True,
                    "show_banner_on_load": True,
                    "default_necessary": True,
                    "default_analytics": False,
                    "default_marketing": False
                }
            }
        ])
        logger.info("Seed: Seeded default system settings")

    # 7. Seed default Service Areas (Zürich, Aarau, Kanton Aargau, Olten)
    areas_count = await db.service_areas.count_documents({})
    if areas_count == 0:
        default_areas = [
            {
                "name": "Zürich",
                "slug": "zuerich",
                "canton": "ZH",
                "city": "Zürich",
                "postal_codes": SERVICE_AREA_POSTAL_CODES["zuerich"],
                "short_description": "Exklusive Naturstein- & Verlegearbeiten in Zürich.",
                "description": "Als Premium-Plattenleger saniere ich stilvolle Badezimmer und verlege Grossformatplatten im gesamten kanton Zürich und Umgebung nach SIA-Richtlinien.",
                "latitude": 47.3769,
                "longitude": 8.5417,
                "radius": 30.0,
                "is_active": True,
                "is_featured": True,
                "sort_order": 1,
                "created_at": datetime.now(timezone.utc)
            },
            {
                "name": "Aarau",
                "slug": "aarau",
                "canton": "AG",
                "city": "Aarau",
                "postal_codes": SERVICE_AREA_POSTAL_CODES["aarau"],
                "short_description": "Präzises Bodenschleifen & Badrenovierung in Aarau.",
                "description": "Wir stehen für absolute Termintreue, staubfreies Schleifen und meisterhafte Plattenarbeiten im Herzen von Aarau.",
                "latitude": 47.3925,
                "longitude": 8.0444,
                "radius": 20.0,
                "is_active": True,
                "is_featured": True,
                "sort_order": 2,
                "created_at": datetime.now(timezone.utc)
            },
            {
                "name": "Kanton Aargau",
                "slug": "kanton-aargau",
                "canton": "AG",
                "city": "Baden / Wettingen",
                "postal_codes": SERVICE_AREA_POSTAL_CODES["kanton-aargau"],
                "short_description": "Spezialabdichtung & Fugenarbeiten im ganzen Aargau.",
                "description": "Umfassende Betreuung für Verwaltungen und anspruchsvolle Privatkunden im gesamten Kanton Aargau. Riss- und schimmelfreie Lösungen.",
                "latitude": 47.4124,
                "longitude": 8.1633,
                "radius": 40.0,
                "is_active": True,
                "is_featured": False,
                "sort_order": 3,
                "created_at": datetime.now(timezone.utc)
            },
            {
                "name": "Olten",
                "slug": "olten",
                "canton": "SO",
                "city": "Olten",
                "postal_codes": SERVICE_AREA_POSTAL_CODES["olten"],
                "short_description": "Fachmännische Sanierung & Keramikverlegung in Olten.",
                "description": "Ausbesserung gerissener Fugen, Terrassensanierung und schnelle Reparaturen bei Plattenabplatzungen im Raum Olten.",
                "latitude": 47.3522,
                "longitude": 7.9080,
                "radius": 25.0,
                "is_active": True,
                "is_featured": True,
                "sort_order": 4,
                "created_at": datetime.now(timezone.utc)
            }
        ]
        await db.service_areas.insert_many(default_areas)
        logger.info("Seed: Seeded default service areas successfully")

    for slug, postal_codes in SERVICE_AREA_POSTAL_CODES.items():
        await db.service_areas.update_one({"slug": slug}, {"$set": {"postal_codes": postal_codes}})

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
