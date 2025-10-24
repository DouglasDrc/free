#!/usr/bin/env python3
"""
Admin tool to check and fix user balances
Usage: python admin_balance_tool.py <email> <new_balance>
"""

import sys
import os
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

# Get MongoDB URL from environment or use default
MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
client = AsyncIOMotorClient(MONGO_URL)
db = client.mindconnect

async def check_user_balance(email):
    """Check user's current balance and recent transactions"""
    user = await db.users.find_one({"email": email}, {"_id": 0})
    if not user:
        print(f"User with email '{email}' not found")
        return None
    
    print(f"\n=== User Info ===")
    print(f"Name: {user.get('name')}")
    print(f"Email: {user.get('email')}")
    print(f"Role: {user.get('role')}")
    print(f"Current Balance: {user.get('coins', 0)} coins")
    
    # Get recent transactions
    transactions = await db.transactions.find(
        {"user_id": user["id"]}
    ).sort("timestamp", -1).limit(10).to_list(10)
    
    print(f"\n=== Last 10 Transactions ===")
    for tx in transactions:
        print(f"{tx.get('timestamp')}: {tx.get('type')} - {tx.get('amount')} coins - {tx.get('description')}")
    
    # Get sessions
    sessions = await db.sessions.find(
        {"client_id": user["id"]}
    ).sort("start_time", -1).limit(5).to_list(5)
    
    print(f"\n=== Last 5 Sessions (as client) ===")
    for session in sessions:
        print(f"{session.get('start_time')}: Status={session.get('status')} Duration={session.get('duration_minutes')}min Spent={session.get('coins_spent')} coins")
    
    return user

async def set_user_balance(email, new_balance):
    """Set user's balance to a specific value"""
    user = await db.users.find_one({"email": email})
    if not user:
        print(f"User with email '{email}' not found")
        return
    
    result = await db.users.update_one(
        {"email": email},
        {"$set": {"coins": int(new_balance)}}
    )
    
    if result.modified_count > 0:
        print(f"✅ Successfully set balance for {email} to {new_balance} coins")
    else:
        print(f"❌ Failed to update balance")

async def main():
    if len(sys.argv) < 2:
        print("Usage: python admin_balance_tool.py <email> [new_balance]")
        print("  - To check balance: python admin_balance_tool.py user@example.com")
        print("  - To set balance: python admin_balance_tool.py user@example.com 3000")
        sys.exit(1)
    
    email = sys.argv[1]
    
    if len(sys.argv) == 2:
        # Check balance only
        await check_user_balance(email)
    else:
        # Set new balance
        new_balance = sys.argv[2]
        await check_user_balance(email)
        print(f"\n=== Setting New Balance ===")
        await set_user_balance(email, new_balance)
        print(f"\n=== After Update ===")
        await check_user_balance(email)

if __name__ == "__main__":
    asyncio.run(main())
