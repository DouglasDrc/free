#!/usr/bin/env python3
"""
CRITICAL BALANCE INVESTIGATION TEST
Focus on the user-reported issue: -160 balance after recharging 3000 coins
"""

import requests
import time
import jwt
from datetime import datetime

class CriticalBalanceTest:
    def __init__(self):
        self.base_url = "https://mindcare-video.preview.emergentagent.com/api"
        self.admin_token = None
        self.fresh_client_token = None
        self.therapist_token = None
        
    def login_admin(self):
        """Login as admin"""
        response = requests.post(f"{self.base_url}/auth/login?email=admin@mindconnect.com&password=admin123")
        if response.status_code == 200:
            self.admin_token = response.json()['access_token']
            print("✅ Admin login successful")
            return True
        print(f"❌ Admin login failed: {response.text}")
        return False
    
    def login_therapist(self):
        """Login as the new therapist with profile"""
        response = requests.post(f"{self.base_url}/auth/login?email=newtherapist@test.com&password=therapist123")
        if response.status_code == 200:
            self.therapist_token = response.json()['access_token']
            print("✅ Therapist login successful")
            return True
        print(f"❌ Therapist login failed: {response.text}")
        return False
    
    def get_user_id_from_token(self, token):
        """Extract user ID from JWT token"""
        try:
            payload = jwt.decode(token, options={"verify_signature": False})
            return payload.get("sub")
        except:
            return None
    
    def get_user_balance(self, token):
        """Get user balance"""
        try:
            response = requests.get(
                f"{self.base_url}/users/balance",
                headers={'Authorization': f'Bearer {token}'}
            )
            if response.status_code == 200:
                return response.json().get('coins', 0)
        except:
            pass
        return None
    
    def get_therapist_rate(self, token):
        """Get therapist call rate"""
        try:
            response = requests.get(
                f"{self.base_url}/therapists/profile/me",
                headers={'Authorization': f'Bearer {token}'}
            )
            if response.status_code == 200:
                return response.json().get('call_rate', 150)
        except:
            pass
        return 150  # Default rate
    
    def run_critical_balance_investigation(self):
        """
        CRITICAL TEST: Reproduce the user's issue
        User reports: -160 balance after recharging 3000 coins
        """
        print("\n" + "="*80)
        print("🚨 CRITICAL BALANCE INVESTIGATION")
        print("User Report: -160 balance after recharging 3000 coins")
        print("="*80)
        
        # Step 1: Create fresh user
        timestamp = datetime.now().strftime('%H%M%S%f')
        fresh_email = f"criticaltest{timestamp}@test.com"
        
        print(f"\n1️⃣ Creating fresh user: {fresh_email}")
        response = requests.post(f"{self.base_url}/auth/register", json={
            "email": fresh_email,
            "name": f"Critical Test User {timestamp}",
            "password": "testpass123",
            "role": "client"
        })
        
        if response.status_code != 200:
            print(f"❌ Failed to create user: {response.text}")
            return False
        
        self.fresh_client_token = response.json()['access_token']
        fresh_user_id = self.get_user_id_from_token(self.fresh_client_token)
        print(f"✅ Fresh user created with ID: {fresh_user_id}")
        
        # Step 2: Check initial balance (should be 0)
        initial_balance = self.get_user_balance(self.fresh_client_token)
        print(f"\n2️⃣ Initial balance: {initial_balance} coins")
        
        if initial_balance != 0:
            print(f"❌ Expected initial balance 0, got {initial_balance}")
            return False
        
        # Step 3: Simulate user's recharge pattern - multiple recharges totaling ~3000 coins
        print(f"\n3️⃣ Simulating user's recharge pattern...")
        
        # First recharge: Starter package (600 coins)
        response = requests.post(
            f"{self.base_url}/coins/recharge/package?package_id=starter",
            headers={'Authorization': f'Bearer {self.fresh_client_token}'}
        )
        if response.status_code != 200:
            print(f"❌ Starter recharge failed: {response.text}")
            return False
        
        balance_after_starter = self.get_user_balance(self.fresh_client_token)
        print(f"   After starter package: {balance_after_starter} coins")
        
        # Second recharge: Silver package (1500 coins)
        response = requests.post(
            f"{self.base_url}/coins/recharge/package?package_id=silver",
            headers={'Authorization': f'Bearer {self.fresh_client_token}'}
        )
        if response.status_code != 200:
            print(f"❌ Silver recharge failed: {response.text}")
            return False
        
        balance_after_silver = self.get_user_balance(self.fresh_client_token)
        print(f"   After silver package: {balance_after_silver} coins")
        
        # Third recharge: Another silver package (1500 coins) - Total: 3600 coins
        response = requests.post(
            f"{self.base_url}/coins/recharge/package?package_id=silver",
            headers={'Authorization': f'Bearer {self.fresh_client_token}'}
        )
        if response.status_code != 200:
            print(f"❌ Second silver recharge failed: {response.text}")
            return False
        
        balance_after_recharges = self.get_user_balance(self.fresh_client_token)
        expected_total = 600 + 1500 + 1500  # 3600 coins
        print(f"   Final balance after recharges: {balance_after_recharges} coins")
        print(f"   Expected total: {expected_total} coins")
        
        if balance_after_recharges != expected_total:
            print(f"❌ Balance mismatch after recharges!")
            return False
        
        # Step 4: Get therapist info
        therapist_id = self.get_user_id_from_token(self.therapist_token)
        therapist_rate = self.get_therapist_rate(self.therapist_token)
        print(f"\n4️⃣ Therapist info - ID: {therapist_id}, Rate: {therapist_rate} coins/min")
        
        # Step 5: Simulate multiple sessions (like user might have done)
        print(f"\n5️⃣ Simulating multiple therapy sessions...")
        
        session_count = 0
        total_expected_deduction = 0
        
        # Session 1: 2 minutes
        session_count += 1
        print(f"\n   Session {session_count} (2 minutes):")
        
        # Start session
        response = requests.post(f"{self.base_url}/sessions/start", 
            json={"therapist_id": therapist_id, "session_type": "call"},
            headers={'Authorization': f'Bearer {self.fresh_client_token}'}
        )
        if response.status_code != 200:
            print(f"   ❌ Failed to start session: {response.text}")
            return False
        
        session_id = response.json()['session_id']
        print(f"   Session started: {session_id}")
        
        # Therapist accepts
        response = requests.post(f"{self.base_url}/sessions/accept",
            json={"session_id": session_id},
            headers={'Authorization': f'Bearer {self.therapist_token}'}
        )
        if response.status_code != 200:
            print(f"   ❌ Failed to accept session: {response.text}")
            return False
        
        print(f"   Therapist accepted session")
        
        # Wait 2 seconds (simulate 2 minute session)
        time.sleep(2)
        
        # End session
        response = requests.post(f"{self.base_url}/sessions/end",
            json={"session_id": session_id},
            headers={'Authorization': f'Bearer {self.fresh_client_token}'}
        )
        if response.status_code != 200:
            print(f"   ❌ Failed to end session: {response.text}")
            return False
        
        # Check balance after session 1
        balance_after_session1 = self.get_user_balance(self.fresh_client_token)
        session1_deduction = 1 * therapist_rate  # Minimum 1 minute billing
        total_expected_deduction += session1_deduction
        expected_balance = expected_total - total_expected_deduction
        
        print(f"   Balance after session 1: {balance_after_session1} coins")
        print(f"   Expected deduction: {session1_deduction} coins")
        print(f"   Expected balance: {expected_balance} coins")
        
        if balance_after_session1 != expected_balance:
            print(f"   ❌ Balance mismatch after session 1!")
            return False
        
        # Session 2: 5 minutes
        session_count += 1
        print(f"\n   Session {session_count} (5 minutes):")
        
        # Start session
        response = requests.post(f"{self.base_url}/sessions/start", 
            json={"therapist_id": therapist_id, "session_type": "call"},
            headers={'Authorization': f'Bearer {self.fresh_client_token}'}
        )
        if response.status_code != 200:
            print(f"   ❌ Failed to start session: {response.text}")
            return False
        
        session_id = response.json()['session_id']
        
        # Therapist accepts
        response = requests.post(f"{self.base_url}/sessions/accept",
            json={"session_id": session_id},
            headers={'Authorization': f'Bearer {self.therapist_token}'}
        )
        if response.status_code != 200:
            print(f"   ❌ Failed to accept session: {response.text}")
            return False
        
        # Wait 5 seconds (simulate 5 minute session)
        time.sleep(5)
        
        # End session
        response = requests.post(f"{self.base_url}/sessions/end",
            json={"session_id": session_id},
            headers={'Authorization': f'Bearer {self.fresh_client_token}'}
        )
        if response.status_code != 200:
            print(f"   ❌ Failed to end session: {response.text}")
            return False
        
        # Check balance after session 2
        balance_after_session2 = self.get_user_balance(self.fresh_client_token)
        session2_deduction = 1 * therapist_rate  # Still minimum 1 minute billing for short test
        total_expected_deduction += session2_deduction
        expected_balance = expected_total - total_expected_deduction
        
        print(f"   Balance after session 2: {balance_after_session2} coins")
        print(f"   Expected deduction: {session2_deduction} coins")
        print(f"   Expected balance: {expected_balance} coins")
        
        if balance_after_session2 != expected_balance:
            print(f"   ❌ Balance mismatch after session 2!")
            return False
        
        # Step 6: Check transaction history
        print(f"\n6️⃣ Checking transaction history...")
        response = requests.get(f"{self.base_url}/transactions/history",
            headers={'Authorization': f'Bearer {self.fresh_client_token}'}
        )
        
        if response.status_code == 200:
            transactions = response.json()
            print(f"   Total transactions: {len(transactions)}")
            
            recharge_total = 0
            deduction_total = 0
            
            for i, tx in enumerate(transactions):
                print(f"   Transaction {i+1}: {tx['type']} - {tx['amount']} coins - {tx['description']}")
                if tx['type'] == 'recharge':
                    recharge_total += tx['amount']
                elif tx['type'] == 'deduction':
                    deduction_total += tx['amount']
            
            print(f"\n   Summary:")
            print(f"   Total recharged: {recharge_total} coins")
            print(f"   Total deducted: {deduction_total} coins")
            print(f"   Expected balance: {recharge_total - deduction_total} coins")
            print(f"   Actual balance: {balance_after_session2} coins")
            
            if (recharge_total - deduction_total) == balance_after_session2:
                print(f"   ✅ Transaction history matches balance!")
            else:
                print(f"   ❌ Transaction history doesn't match balance!")
                return False
        
        # Step 7: Test for negative balance scenario
        print(f"\n7️⃣ Testing potential negative balance scenario...")
        
        # Try to spend more than available (simulate user's issue)
        current_balance = self.get_user_balance(self.fresh_client_token)
        print(f"   Current balance: {current_balance} coins")
        
        # Calculate how many sessions would drain the balance
        sessions_to_drain = (current_balance // therapist_rate) + 5  # Extra sessions to go negative
        print(f"   Would need {sessions_to_drain} sessions to potentially go negative")
        
        # Run a few more sessions to see if balance can go negative
        for i in range(3):  # Run 3 more sessions
            session_count += 1
            print(f"\n   Additional Session {session_count}:")
            
            # Start session
            response = requests.post(f"{self.base_url}/sessions/start", 
                json={"therapist_id": therapist_id, "session_type": "call"},
                headers={'Authorization': f'Bearer {self.fresh_client_token}'}
            )
            if response.status_code != 200:
                print(f"   ❌ Failed to start session: {response.text}")
                break
            
            session_id = response.json()['session_id']
            
            # Therapist accepts
            response = requests.post(f"{self.base_url}/sessions/accept",
                json={"session_id": session_id},
                headers={'Authorization': f'Bearer {self.therapist_token}'}
            )
            if response.status_code != 200:
                print(f"   ❌ Failed to accept session: {response.text}")
                break
            
            time.sleep(1)
            
            # End session
            response = requests.post(f"{self.base_url}/sessions/end",
                json={"session_id": session_id},
                headers={'Authorization': f'Bearer {self.fresh_client_token}'}
            )
            if response.status_code != 200:
                print(f"   ❌ Failed to end session: {response.text}")
                break
            
            # Check balance
            new_balance = self.get_user_balance(self.fresh_client_token)
            print(f"   Balance after additional session {session_count}: {new_balance} coins")
            
            if new_balance < 0:
                print(f"   🚨 CRITICAL: Balance went NEGATIVE! This matches user report!")
                return False
        
        final_balance = self.get_user_balance(self.fresh_client_token)
        print(f"\n8️⃣ Final Results:")
        print(f"   Final balance: {final_balance} coins")
        print(f"   Total sessions completed: {session_count}")
        print(f"   Total expected deduction: {total_expected_deduction + (3 * therapist_rate)} coins")
        
        if final_balance >= 0:
            print(f"   ✅ Balance remained positive - no critical bug found in this test")
            return True
        else:
            print(f"   🚨 CRITICAL BUG: Balance went negative ({final_balance}) - matches user report!")
            return False

def main():
    tester = CriticalBalanceTest()
    
    if not tester.login_admin():
        return 1
    
    if not tester.login_therapist():
        return 1
    
    if tester.run_critical_balance_investigation():
        print(f"\n✅ CRITICAL BALANCE INVESTIGATION COMPLETED - No issues found")
        return 0
    else:
        print(f"\n❌ CRITICAL BALANCE INVESTIGATION FAILED - Issues detected!")
        return 1

if __name__ == "__main__":
    exit(main())