from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
from passlib.context import CryptContext
from jose import JWTError, jwt
from agora_token_builder import RtcTokenBuilder
import time

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Security
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()
SECRET_KEY = os.getenv("JWT_SECRET", "mindconnect_secret_key_change_in_production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

# Agora credentials
AGORA_APP_ID = os.getenv("AGORA_APP_ID", "01673ba6d1184a439847d2952c973b42")
AGORA_APP_CERTIFICATE = os.getenv("AGORA_APP_CERTIFICATE", "ffe5317d96354867b8975dbe78d15b42")

app = FastAPI()
api_router = APIRouter(prefix="/api")

# ============= Models =============
class UserBase(BaseModel):
    email: EmailStr
    name: str
    role: str  # client, therapist, admin

class UserCreate(UserBase):
    password: str

class User(UserBase):
    model_config = ConfigDict(extra="ignore")
    id: str
    coins: int = 0
    created_at: datetime

class TherapistProfile(BaseModel):
    model_config = ConfigDict(extra="ignore")
    user_id: str
    specialization: List[str]
    experience: int  # years
    languages: List[str]
    bio: str
    photo: str
    hourly_rate: int  # coins per minute (typically 100)
    is_online: bool = False
    rating: float = 0.0
    total_sessions: int = 0

class TherapistCreate(BaseModel):
    specialization: List[str]
    experience: int
    languages: List[str]
    bio: str
    photo: str
    hourly_rate: int = 100

class Session(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    client_id: str
    therapist_id: str
    channel_name: str
    start_time: datetime
    end_time: Optional[datetime] = None
    duration_minutes: int = 0
    coins_spent: int = 0
    status: str  # active, completed, cancelled

class SessionStart(BaseModel):
    therapist_id: str

class SessionEnd(BaseModel):
    session_id: str
    duration_minutes: int

class Transaction(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    user_id: str
    type: str  # recharge, earning, deduction
    amount: int
    description: str
    timestamp: datetime

class Review(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    session_id: str
    client_id: str
    therapist_id: str
    rating: int  # 1-5
    comment: str
    created_at: datetime

class ReviewCreate(BaseModel):
    session_id: str
    therapist_id: str
    rating: int
    comment: str

class TherapistCreateByAdmin(BaseModel):
    email: EmailStr
    name: str
    password: str
    specialization: List[str]
    experience: int
    languages: List[str]
    bio: str
    photo: str
    hourly_rate: int

class Token(BaseModel):
    access_token: str
    token_type: str

# ============= Auth Utilities =============
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid authentication")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid authentication")
    
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    return user

# ============= Auth Routes =============
@api_router.post("/auth/register", response_model=Token)
async def register(user: UserCreate):
    existing = await db.users.find_one({"email": user.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_id = str(uuid.uuid4())
    hashed_password = get_password_hash(user.password)
    
    user_doc = {
        "id": user_id,
        "email": user.email,
        "name": user.name,
        "role": user.role,
        "password_hash": hashed_password,
        "coins": 0,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.users.insert_one(user_doc)
    
    access_token = create_access_token(data={"sub": user_id, "role": user.role})
    return {"access_token": access_token, "token_type": "bearer"}

@api_router.post("/auth/login", response_model=Token)
async def login(email: EmailStr, password: str):
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    
    access_token = create_access_token(data={"sub": user["id"], "role": user["role"]})
    return {"access_token": access_token, "token_type": "bearer"}

# ============= User Routes =============
@api_router.get("/users/me", response_model=User)
async def get_profile(current_user: dict = Depends(get_current_user)):
    if isinstance(current_user['created_at'], str):
        current_user['created_at'] = datetime.fromisoformat(current_user['created_at'])
    return current_user

@api_router.get("/users/balance")
async def get_balance(current_user: dict = Depends(get_current_user)):
    return {"coins": current_user.get("coins", 0)}

# ============= Therapist Routes =============
@api_router.get("/therapists/profile/me")
async def get_my_therapist_profile(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "therapist":
        raise HTTPException(status_code=403, detail="Only therapists can access this")
    
    profile = await db.therapists.find_one({"user_id": current_user["id"]}, {"_id": 0})
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found. Contact admin to create your profile.")
    
    return profile

@api_router.get("/therapists")
async def list_therapists(specialization: Optional[str] = None, min_price: Optional[int] = None, max_price: Optional[int] = None):
    query = {}
    if specialization:
        query["specialization"] = specialization
    if min_price is not None:
        query["hourly_rate"] = {"$gte": min_price}
    if max_price is not None:
        query.setdefault("hourly_rate", {})["$lte"] = max_price
    
    therapists = await db.therapists.find(query, {"_id": 0}).to_list(1000)
    
    # Get user details for each therapist
    for therapist in therapists:
        user = await db.users.find_one({"id": therapist["user_id"]}, {"_id": 0, "name": 1, "email": 1})
        if user:
            therapist["name"] = user.get("name")
            therapist["email"] = user.get("email")
    
    return therapists

@api_router.get("/therapists/{therapist_id}")
async def get_therapist(therapist_id: str):
    therapist = await db.therapists.find_one({"user_id": therapist_id}, {"_id": 0})
    if not therapist:
        raise HTTPException(status_code=404, detail="Therapist not found")
    
    user = await db.users.find_one({"id": therapist_id}, {"_id": 0, "name": 1, "email": 1})
    if user:
        therapist["name"] = user.get("name")
        therapist["email"] = user.get("email")
    
    return therapist

@api_router.patch("/therapists/status")
async def update_online_status(is_online: bool, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "therapist":
        raise HTTPException(status_code=403, detail="Only therapists can update status")
    
    await db.therapists.update_one(
        {"user_id": current_user["id"]},
        {"$set": {"is_online": is_online}}
    )
    return {"message": "Status updated"}

# ============= Session Routes =============
@api_router.post("/sessions/start")
async def start_session(session_data: SessionStart, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "client":
        raise HTTPException(status_code=403, detail="Only clients can start sessions")
    
    # Check if client has enough coins (at least 100 for 1 minute)
    if current_user.get("coins", 0) < 100:
        raise HTTPException(status_code=400, detail="Insufficient coins")
    
    session_id = str(uuid.uuid4())
    channel_name = f"session_{session_id}"
    
    session_doc = {
        "id": session_id,
        "client_id": current_user["id"],
        "therapist_id": session_data.therapist_id,
        "channel_name": channel_name,
        "start_time": datetime.now(timezone.utc).isoformat(),
        "end_time": None,
        "duration_minutes": 0,
        "coins_spent": 0,
        "status": "active"
    }
    
    await db.sessions.insert_one(session_doc)
    
    return {
        "session_id": session_id,
        "channel_name": channel_name,
        "message": "Session started"
    }

@api_router.post("/sessions/end")
async def end_session(session_data: SessionEnd, current_user: dict = Depends(get_current_user)):
    session = await db.sessions.find_one({"id": session_data.session_id}, {"_id": 0})
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    if session["client_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    duration = session_data.duration_minutes
    coins_spent = duration * 100  # 100 coins per minute
    therapist_earnings = duration * 30  # 30 coins per minute for therapist
    
    # Update session
    await db.sessions.update_one(
        {"id": session_data.session_id},
        {"$set": {
            "end_time": datetime.now(timezone.utc).isoformat(),
            "duration_minutes": duration,
            "coins_spent": coins_spent,
            "status": "completed"
        }}
    )
    
    # Deduct coins from client
    await db.users.update_one(
        {"id": current_user["id"]},
        {"$inc": {"coins": -coins_spent}}
    )
    
    # Add coins to therapist
    await db.users.update_one(
        {"id": session["therapist_id"]},
        {"$inc": {"coins": therapist_earnings}}
    )
    
    # Record transactions
    await db.transactions.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": current_user["id"],
        "type": "deduction",
        "amount": coins_spent,
        "description": f"Session with therapist",
        "timestamp": datetime.now(timezone.utc).isoformat()
    })
    
    await db.transactions.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": session["therapist_id"],
        "type": "earning",
        "amount": therapist_earnings,
        "description": f"Session with client",
        "timestamp": datetime.now(timezone.utc).isoformat()
    })
    
    # Update therapist stats
    await db.therapists.update_one(
        {"user_id": session["therapist_id"]},
        {"$inc": {"total_sessions": 1}}
    )
    
    return {"message": "Session ended", "coins_spent": coins_spent}

@api_router.get("/sessions/history")
async def get_session_history(current_user: dict = Depends(get_current_user)):
    query = {}
    if current_user["role"] == "client":
        query["client_id"] = current_user["id"]
    elif current_user["role"] == "therapist":
        query["therapist_id"] = current_user["id"]
    
    sessions = await db.sessions.find(query, {"_id": 0}).sort("start_time", -1).to_list(100)
    return sessions

# ============= Coins Routes =============
@api_router.post("/coins/recharge")
async def recharge_coins(amount: int, current_user: dict = Depends(get_current_user)):
    if amount < 100:
        raise HTTPException(status_code=400, detail="Minimum recharge is 100 coins")
    
    # Mock payment - just add coins
    await db.users.update_one(
        {"id": current_user["id"]},
        {"$inc": {"coins": amount}}
    )
    
    # Record transaction
    await db.transactions.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": current_user["id"],
        "type": "recharge",
        "amount": amount,
        "description": f"Recharged {amount} coins",
        "timestamp": datetime.now(timezone.utc).isoformat()
    })
    
    return {"message": "Coins recharged", "new_balance": current_user.get("coins", 0) + amount}

@api_router.get("/coins/transactions")
async def get_transactions(current_user: dict = Depends(get_current_user)):
    transactions = await db.transactions.find(
        {"user_id": current_user["id"]},
        {"_id": 0}
    ).sort("timestamp", -1).to_list(100)
    return transactions

# ============= Review Routes =============
@api_router.post("/reviews")
async def create_review(review: ReviewCreate, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "client":
        raise HTTPException(status_code=403, detail="Only clients can leave reviews")
    
    # Check if session exists and belongs to user
    session = await db.sessions.find_one({"id": review.session_id})
    if not session or session["client_id"] != current_user["id"]:
        raise HTTPException(status_code=404, detail="Session not found")
    
    review_doc = {
        "id": str(uuid.uuid4()),
        "session_id": review.session_id,
        "client_id": current_user["id"],
        "therapist_id": review.therapist_id,
        "rating": review.rating,
        "comment": review.comment,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.reviews.insert_one(review_doc)
    
    # Update therapist rating
    reviews = await db.reviews.find({"therapist_id": review.therapist_id}).to_list(1000)
    avg_rating = sum(r["rating"] for r in reviews) / len(reviews)
    await db.therapists.update_one(
        {"user_id": review.therapist_id},
        {"$set": {"rating": round(avg_rating, 1)}}
    )
    
    return {"message": "Review submitted"}

@api_router.get("/reviews/{therapist_id}")
async def get_reviews(therapist_id: str):
    reviews = await db.reviews.find({"therapist_id": therapist_id}, {"_id": 0}).to_list(100)
    return reviews

# ============= Agora Token Route =============
@api_router.get("/agora/token")
async def generate_agora_token(channel_name: str, user_id: int, current_user: dict = Depends(get_current_user)):
    if not AGORA_APP_ID or not AGORA_APP_CERTIFICATE:
        raise HTTPException(status_code=500, detail="Agora credentials not configured")
    
    expiration_time_in_seconds = 3600  # 1 hour
    current_timestamp = int(time.time())
    privilege_expired_ts = current_timestamp + expiration_time_in_seconds
    
    # Role: 1 = Publisher (can send/receive), 2 = Subscriber (receive only)
    role = 1
    
    token = RtcTokenBuilder.buildTokenWithUid(
        AGORA_APP_ID,
        AGORA_APP_CERTIFICATE,
        channel_name,
        user_id,
        role,
        privilege_expired_ts
    )
    
    return {
        "token": token,
        "channel_name": channel_name,
        "uid": user_id,
        "app_id": AGORA_APP_ID
    }

# ============= Admin Routes =============
@api_router.get("/admin/analytics")
async def get_analytics(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    total_users = await db.users.count_documents({})
    total_therapists = await db.therapists.count_documents({})
    total_sessions = await db.sessions.count_documents({})
    total_revenue = await db.transactions.aggregate([
        {"$match": {"type": "recharge"}},
        {"$group": {"_id": None, "total": {"$sum": "$amount"}}}
    ]).to_list(1)
    
    revenue = total_revenue[0]["total"] if total_revenue else 0
    
    return {
        "total_users": total_users,
        "total_therapists": total_therapists,
        "total_sessions": total_sessions,
        "total_revenue": revenue
    }

@api_router.get("/admin/users")
async def get_all_users(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    users = await db.users.find({}, {"_id": 0, "password_hash": 0}).to_list(1000)
    return users

@api_router.get("/admin/therapists")
async def get_all_therapists(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    therapists = await db.therapists.find({}, {"_id": 0}).to_list(1000)
    
    # Get user details for each therapist
    for therapist in therapists:
        user = await db.users.find_one({"id": therapist["user_id"]}, {"_id": 0, "name": 1, "email": 1, "coins": 1})
        if user:
            therapist["name"] = user.get("name")
            therapist["email"] = user.get("email")
            therapist["coins"] = user.get("coins", 0)
    
    return therapists

@api_router.post("/admin/therapists/create")
async def admin_create_therapist(
    therapist_data: TherapistCreateByAdmin,
    current_user: dict = Depends(get_current_user)
):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Check if user exists
    existing = await db.users.find_one({"email": therapist_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="User with this email already exists")
    
    # Create user account
    user_id = str(uuid.uuid4())
    hashed_password = get_password_hash(therapist_data.password)
    
    user_doc = {
        "id": user_id,
        "email": therapist_data.email,
        "name": therapist_data.name,
        "role": "therapist",
        "password_hash": hashed_password,
        "coins": 0,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.users.insert_one(user_doc)
    
    # Create therapist profile
    profile_doc = {
        "user_id": user_id,
        "specialization": therapist_data.specialization,
        "experience": therapist_data.experience,
        "languages": therapist_data.languages,
        "bio": therapist_data.bio,
        "photo": therapist_data.photo,
        "hourly_rate": therapist_data.hourly_rate,
        "is_online": False,
        "rating": 0.0,
        "total_sessions": 0
    }
    
    await db.therapists.insert_one(profile_doc)
    
    return {"message": "Therapist created successfully", "user_id": user_id}

@api_router.delete("/admin/users/{user_id}")
async def admin_delete_user(user_id: str, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Delete user
    result = await db.users.delete_one({"id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Delete therapist profile if exists
    await db.therapists.delete_one({"user_id": user_id})
    
    return {"message": "User deleted successfully"}

# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()