import requests
import sys
import json
import time
from datetime import datetime

class MindConnectAPITester:
    def __init__(self, base_url="https://mindcare-video.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.admin_token = None
        self.client_token = None
        self.therapist_token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.created_therapist_id = None
        self.created_session_id = None

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        default_headers = {'Content-Type': 'application/json'}
        if headers:
            default_headers.update(headers)

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=default_headers, params=data)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=default_headers)
            elif method == 'PATCH':
                response = requests.patch(url, json=data, headers=default_headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=default_headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return success, response.json() if response.text else {}
                except:
                    return success, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    print(f"Response: {response.text}")
                except:
                    pass
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_admin_login(self):
        """Test admin login"""
        success, response = self.run_test(
            "Admin Login",
            "POST",
            "auth/login?email=admin@mindconnect.com&password=admin123",
            200
        )
        if success and 'access_token' in response:
            self.admin_token = response['access_token']
            return True
        return False

    def test_client_registration(self):
        """Test client registration"""
        timestamp = datetime.now().strftime('%H%M%S')
        success, response = self.run_test(
            "Client Registration",
            "POST",
            "auth/register",
            200,
            data={
                "email": f"testclient{timestamp}@test.com",
                "name": f"Test Client {timestamp}",
                "password": "testpass123",
                "role": "client"
            }
        )
        if success and 'access_token' in response:
            self.client_token = response['access_token']
            return True
        return False

    def test_client_registration_and_login(self):
        """Test client registration and login with test credentials"""
        # Try to register first (might fail if user exists)
        self.run_test(
            "Client Registration (if needed)",
            "POST",
            "auth/register",
            200,
            data={
                "email": "client@test.com",
                "name": "Test Client",
                "password": "client123",
                "role": "client"
            }
        )
        
        # Now try to login
        success, response = self.run_test(
            "Client Login",
            "POST",
            "auth/login?email=client@test.com&password=client123",
            200
        )
        if success and 'access_token' in response:
            self.client_token = response['access_token']
            return True
        return False

    def test_therapist_registration_and_login(self):
        """Test therapist registration and login with test credentials"""
        # Try to register first (might fail if user exists)
        self.run_test(
            "Therapist Registration (if needed)",
            "POST",
            "auth/register",
            200,
            data={
                "email": "therapist@test.com",
                "name": "Test Therapist",
                "password": "therapist123",
                "role": "therapist"
            }
        )
        
        # Now try to login
        success, response = self.run_test(
            "Therapist Login",
            "POST",
            "auth/login?email=therapist@test.com&password=therapist123",
            200
        )
        if success and 'access_token' in response:
            self.therapist_token = response['access_token']
            return True
        return False

    def test_get_coin_packages(self):
        """Test getting coin packages"""
        success, response = self.run_test(
            "Get Coin Packages",
            "GET",
            "coins/packages",
            200
        )
        return success and len(response) > 0

    def test_recharge_coins(self):
        """Test coin recharge"""
        if not self.client_token:
            return False
        
        success, response = self.run_test(
            "Recharge Coins",
            "POST",
            "coins/recharge?amount=1000",
            200,
            headers={'Authorization': f'Bearer {self.client_token}'}
        )
        return success

    def test_recharge_package(self):
        """Test coin recharge with package"""
        if not self.client_token:
            return False
        
        success, response = self.run_test(
            "Recharge Package",
            "POST",
            "coins/recharge/package?package_id=starter",
            200,
            headers={'Authorization': f'Bearer {self.client_token}'}
        )
        return success

    def test_list_therapists(self):
        """Test listing therapists"""
        success, response = self.run_test(
            "List Therapists",
            "GET",
            "therapists",
            200
        )
        return success

    def test_admin_create_therapist(self):
        """Test admin creating therapist"""
        if not self.admin_token:
            return False
        
        timestamp = datetime.now().strftime('%H%M%S')
        success, response = self.run_test(
            "Admin Create Therapist",
            "POST",
            "admin/therapists/create",
            200,
            data={
                "email": f"testtherapist{timestamp}@test.com",
                "name": f"Test Therapist {timestamp}",
                "password": "therapist123",
                "specialization": ["Anxiety", "Depression"],
                "experience": 5,
                "languages": ["English", "Hindi"],
                "bio": "Experienced therapist specializing in anxiety and depression",
                "photo": "https://example.com/photo.jpg",
                "chat_rate": 100,
                "call_rate": 150,
                "hobbies": ["Reading", "Yoga"],
                "age": 35,
                "location": "Mumbai, India"
            },
            headers={'Authorization': f'Bearer {self.admin_token}'}
        )
        if success and 'user_id' in response:
            self.created_therapist_id = response['user_id']
        return success

    def test_start_session(self):
        """Test starting a session"""
        if not self.client_token or not self.therapist_token:
            return False
        
        # Get therapist user ID from token
        import jwt
        try:
            therapist_payload = jwt.decode(self.therapist_token, options={"verify_signature": False})
            therapist_id = therapist_payload.get("sub")
        except:
            print("   Failed to decode therapist token")
            return False
        
        success, response = self.run_test(
            "Start Session",
            "POST",
            "sessions/start",
            200,
            data={
                "therapist_id": therapist_id,
                "session_type": "call"
            },
            headers={'Authorization': f'Bearer {self.client_token}'}
        )
        if success and 'session_id' in response:
            self.created_session_id = response['session_id']
        return success

    def test_twilio_token_generation_client(self):
        """Test Twilio token generation for client"""
        if not self.client_token:
            return False
        
        success, response = self.run_test(
            "Generate Twilio Token (Client)",
            "GET",
            "twilio/token?room_name=test-room-client",
            200,
            headers={'Authorization': f'Bearer {self.client_token}'}
        )
        if success:
            print(f"   Token response: {response}")
            return 'token' in response and 'room_name' in response and 'identity' in response
        return False

    def test_twilio_token_generation_therapist(self):
        """Test Twilio token generation for therapist"""
        if not self.therapist_token:
            return False
        
        success, response = self.run_test(
            "Generate Twilio Token (Therapist)",
            "GET",
            "twilio/token?room_name=test-room-therapist",
            200,
            headers={'Authorization': f'Bearer {self.therapist_token}'}
        )
        if success:
            print(f"   Token response: {response}")
            return 'token' in response and 'room_name' in response and 'identity' in response
        return False

    def test_twilio_token_with_session_room(self):
        """Test Twilio token generation with session room name"""
        if not self.client_token or not self.created_session_id:
            return False
        
        room_name = f"session_{self.created_session_id}"
        success, response = self.run_test(
            "Generate Twilio Token (Session Room)",
            "GET",
            f"twilio/token?room_name={room_name}",
            200,
            headers={'Authorization': f'Bearer {self.client_token}'}
        )
        if success:
            print(f"   Token response: {response}")
            return 'token' in response and response.get('room_name') == room_name and 'identity' in response
        return False

    def test_end_session(self):
        """Test ending a session"""
        if not self.client_token or not self.created_session_id:
            return False
        
        success, response = self.run_test(
            "End Session",
            "POST",
            "sessions/end",
            200,
            data={
                "session_id": self.created_session_id,
                "duration_minutes": 5
            },
            headers={'Authorization': f'Bearer {self.client_token}'}
        )
        return success

    def test_admin_analytics(self):
        """Test admin analytics"""
        if not self.admin_token:
            return False
        
        success, response = self.run_test(
            "Admin Analytics",
            "GET",
            "admin/analytics",
            200,
            headers={'Authorization': f'Bearer {self.admin_token}'}
        )
        return success and 'total_users' in response

    def test_get_user_balance(self):
        """Test getting user balance"""
        if not self.client_token:
            return False
        
        success, response = self.run_test(
            "Get User Balance",
            "GET",
            "users/balance",
            200,
            headers={'Authorization': f'Bearer {self.client_token}'}
        )
        return success and 'coins' in response

    def get_user_balance(self, token):
        """Helper method to get user balance"""
        try:
            response = requests.get(
                f"{self.base_url}/users/balance",
                headers={'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}
            )
            if response.status_code == 200:
                return response.json().get('coins', 0)
        except:
            pass
        return None

    def get_therapist_call_rate(self, therapist_token):
        """Helper method to get therapist call rate"""
        try:
            response = requests.get(
                f"{self.base_url}/therapists/profile/me",
                headers={'Authorization': f'Bearer {therapist_token}', 'Content-Type': 'application/json'}
            )
            if response.status_code == 200:
                return response.json().get('call_rate', 150)
        except:
            pass
        return 150  # Default rate

    def add_coins_to_client(self, client_user_id, amount=2000):
        """Helper method to add coins to client via admin"""
        if not self.admin_token:
            return False
        
        success, response = self.run_test(
            f"Admin Add {amount} Coins to Client",
            "PATCH",
            f"admin/users/{client_user_id}/balance?coins={amount}",
            200,
            headers={'Authorization': f'Bearer {self.admin_token}'}
        )
        return success

    def get_user_id_from_token(self, token):
        """Helper method to extract user ID from JWT token"""
        import jwt
        try:
            payload = jwt.decode(token, options={"verify_signature": False})
            return payload.get("sub")
        except:
            return None

    def test_coin_deduction_client_ends_session(self):
        """Test coin deduction when CLIENT ends the session"""
        if not self.client_token or not self.therapist_token:
            print("   Missing required tokens")
            return False

        print("\n🔍 Testing Coin Deduction - Client Ends Session...")
        
        # Get user IDs
        client_id = self.get_user_id_from_token(self.client_token)
        therapist_id = self.get_user_id_from_token(self.therapist_token)
        
        if not client_id or not therapist_id:
            print("   Failed to extract user IDs from tokens")
            return False

        # Ensure client has enough coins
        if not self.add_coins_to_client(client_id, 2000):
            print("   Failed to add coins to client")
            return False

        # Get initial balances
        client_initial = self.get_user_balance(self.client_token)
        therapist_initial = self.get_user_balance(self.therapist_token)
        therapist_rate = self.get_therapist_call_rate(self.therapist_token)
        
        if client_initial is None or therapist_initial is None:
            print("   Failed to get initial balances")
            return False

        print(f"   Initial - Client: {client_initial} coins, Therapist: {therapist_initial} coins")
        print(f"   Therapist call rate: {therapist_rate} coins/minute")

        # Start session
        success, response = self.run_test(
            "Start Session (Client Ends Test)",
            "POST",
            "sessions/start",
            200,
            data={
                "therapist_id": therapist_id,
                "session_type": "call"
            },
            headers={'Authorization': f'Bearer {self.client_token}'}
        )
        
        if not success or 'session_id' not in response:
            print("   Failed to start session")
            return False

        session_id = response['session_id']
        duration_minutes = 5

        # Client ends session
        success, response = self.run_test(
            "End Session (by Client)",
            "POST",
            "sessions/end",
            200,
            data={
                "session_id": session_id,
                "duration_minutes": duration_minutes
            },
            headers={'Authorization': f'Bearer {self.client_token}'}
        )

        if not success:
            print("   Failed to end session")
            return False

        # Get final balances
        client_final = self.get_user_balance(self.client_token)
        therapist_final = self.get_user_balance(self.therapist_token)

        if client_final is None or therapist_final is None:
            print("   Failed to get final balances")
            return False

        print(f"   Final - Client: {client_final} coins, Therapist: {therapist_final} coins")

        # Calculate expected changes
        expected_client_deduction = duration_minutes * therapist_rate
        expected_therapist_earning = duration_minutes * 30

        client_change = client_initial - client_final
        therapist_change = therapist_final - therapist_initial

        print(f"   Expected - Client deduction: {expected_client_deduction}, Therapist earning: {expected_therapist_earning}")
        print(f"   Actual - Client change: {client_change}, Therapist change: {therapist_change}")

        # Verify correct deductions
        if client_change == expected_client_deduction and therapist_change == expected_therapist_earning:
            print("✅ Coin deduction working correctly when client ends session")
            return True
        else:
            print("❌ Incorrect coin deduction amounts")
            return False

    def test_coin_deduction_therapist_ends_session(self):
        """Test coin deduction when THERAPIST ends the session (CRITICAL TEST)"""
        if not self.client_token or not self.therapist_token:
            print("   Missing required tokens")
            return False

        print("\n🔍 Testing Coin Deduction - Therapist Ends Session (CRITICAL)...")
        
        # Get user IDs
        client_id = self.get_user_id_from_token(self.client_token)
        therapist_id = self.get_user_id_from_token(self.therapist_token)
        
        if not client_id or not therapist_id:
            print("   Failed to extract user IDs from tokens")
            return False

        # Ensure client has enough coins
        if not self.add_coins_to_client(client_id, 2000):
            print("   Failed to add coins to client")
            return False

        # Get initial balances
        client_initial = self.get_user_balance(self.client_token)
        therapist_initial = self.get_user_balance(self.therapist_token)
        therapist_rate = self.get_therapist_call_rate(self.therapist_token)
        
        if client_initial is None or therapist_initial is None:
            print("   Failed to get initial balances")
            return False

        print(f"   Initial - Client: {client_initial} coins, Therapist: {therapist_initial} coins")
        print(f"   Therapist call rate: {therapist_rate} coins/minute")

        # Start session
        success, response = self.run_test(
            "Start Session (Therapist Ends Test)",
            "POST",
            "sessions/start",
            200,
            data={
                "therapist_id": therapist_id,
                "session_type": "call"
            },
            headers={'Authorization': f'Bearer {self.client_token}'}
        )
        
        if not success or 'session_id' not in response:
            print("   Failed to start session")
            return False

        session_id = response['session_id']
        duration_minutes = 3

        # THERAPIST ends session (this is the critical test)
        success, response = self.run_test(
            "End Session (by Therapist - CRITICAL)",
            "POST",
            "sessions/end",
            200,
            data={
                "session_id": session_id,
                "duration_minutes": duration_minutes
            },
            headers={'Authorization': f'Bearer {self.therapist_token}'}  # Using therapist token!
        )

        if not success:
            print("   Failed to end session")
            return False

        # Get final balances
        client_final = self.get_user_balance(self.client_token)
        therapist_final = self.get_user_balance(self.therapist_token)

        if client_final is None or therapist_final is None:
            print("   Failed to get final balances")
            return False

        print(f"   Final - Client: {client_final} coins, Therapist: {therapist_final} coins")

        # Calculate expected changes
        expected_client_deduction = duration_minutes * therapist_rate
        expected_therapist_earning = duration_minutes * 30

        client_change = client_initial - client_final
        therapist_change = therapist_final - therapist_initial

        print(f"   Expected - Client deduction: {expected_client_deduction}, Therapist earning: {expected_therapist_earning}")
        print(f"   Actual - Client change: {client_change}, Therapist change: {therapist_change}")

        # CRITICAL: Verify that client lost coins and therapist gained coins (not the other way around)
        if client_change == expected_client_deduction and therapist_change == expected_therapist_earning:
            print("✅ CRITICAL TEST PASSED: Coins correctly deducted from CLIENT even when therapist ends session")
            return True
        elif client_change < 0:  # Client gained coins (wrong!)
            print("❌ CRITICAL BUG: Client gained coins when therapist ended session!")
            return False
        elif therapist_change < 0:  # Therapist lost coins (wrong!)
            print("❌ CRITICAL BUG: Therapist lost coins when ending session!")
            return False
        else:
            print("❌ Incorrect coin deduction amounts")
            return False

    def test_admin_login_for_coin_tests(self):
        """Test admin login for coin testing"""
        success, response = self.run_test(
            "Admin Login",
            "POST",
            "auth/login?email=admin@mindconnect.com&password=admin123",
            200
        )
        if success and 'access_token' in response:
            self.admin_token = response['access_token']
            return True
        return False

    def test_transaction_records(self):
        """Test that transaction records are created correctly"""
        if not self.client_token or not self.therapist_token:
            print("   Missing required tokens")
            return False

        print("\n🔍 Testing Transaction Records...")
        
        # Get client transactions before session
        success, client_transactions_before = self.run_test(
            "Get Client Transactions (Before)",
            "GET",
            "coins/transactions",
            200,
            headers={'Authorization': f'Bearer {self.client_token}'}
        )
        
        # Get therapist transactions before session
        success, therapist_transactions_before = self.run_test(
            "Get Therapist Transactions (Before)",
            "GET",
            "coins/transactions",
            200,
            headers={'Authorization': f'Bearer {self.therapist_token}'}
        )

        if not success:
            print("   Failed to get initial transaction records")
            return False

        client_tx_count_before = len(client_transactions_before)
        therapist_tx_count_before = len(therapist_transactions_before)

        # Get user IDs
        client_id = self.get_user_id_from_token(self.client_token)
        therapist_id = self.get_user_id_from_token(self.therapist_token)

        # Start and end a session
        success, response = self.run_test(
            "Start Session (Transaction Test)",
            "POST",
            "sessions/start",
            200,
            data={
                "therapist_id": therapist_id,
                "session_type": "call"
            },
            headers={'Authorization': f'Bearer {self.client_token}'}
        )
        
        if not success or 'session_id' not in response:
            print("   Failed to start session")
            return False

        session_id = response['session_id']

        # Therapist must accept session first for billing to occur
        success, accept_response = self.run_test(
            "Therapist Accepts Session (Transaction Test)",
            "POST",
            "sessions/accept",
            200,
            data={"session_id": session_id},
            headers={'Authorization': f'Bearer {self.therapist_token}'}
        )

        if not success:
            print("   Failed to accept session")
            return False

        # End session
        success, response = self.run_test(
            "End Session (Transaction Test)",
            "POST",
            "sessions/end",
            200,
            data={
                "session_id": session_id,
                "duration_minutes": 2
            },
            headers={'Authorization': f'Bearer {self.client_token}'}
        )

        if not success:
            print("   Failed to end session")
            return False

        # Get client transactions after session
        success, client_transactions_after = self.run_test(
            "Get Client Transactions (After)",
            "GET",
            "coins/transactions",
            200,
            headers={'Authorization': f'Bearer {self.client_token}'}
        )
        
        # Get therapist transactions after session
        success, therapist_transactions_after = self.run_test(
            "Get Therapist Transactions (After)",
            "GET",
            "coins/transactions",
            200,
            headers={'Authorization': f'Bearer {self.therapist_token}'}
        )

        if not success:
            print("   Failed to get final transaction records")
            return False

        client_tx_count_after = len(client_transactions_after)
        therapist_tx_count_after = len(therapist_transactions_after)

        # Verify new transactions were created
        client_new_tx = client_tx_count_after - client_tx_count_before
        therapist_new_tx = therapist_tx_count_after - therapist_tx_count_before

        print(f"   Client transactions: {client_tx_count_before} -> {client_tx_count_after} (+{client_new_tx})")
        print(f"   Therapist transactions: {therapist_tx_count_before} -> {therapist_tx_count_after} (+{therapist_new_tx})")

        # Check if transactions were created (should be at least 1 for each)
        if client_new_tx >= 1 and therapist_new_tx >= 1:
            # Check the latest transactions
            latest_client_tx = client_transactions_after[0] if client_transactions_after else None
            latest_therapist_tx = therapist_transactions_after[0] if therapist_transactions_after else None

            if latest_client_tx and latest_therapist_tx:
                print(f"   Latest client transaction: {latest_client_tx['type']} - {latest_client_tx['amount']} coins")
                print(f"   Latest therapist transaction: {latest_therapist_tx['type']} - {latest_therapist_tx['amount']} coins")
                
                # Verify transaction types
                if latest_client_tx['type'] == 'deduction' and latest_therapist_tx['type'] == 'earning':
                    print("✅ Transaction records created correctly")
                    return True
                else:
                    print("❌ Incorrect transaction types")
                    return False
            else:
                print("❌ Failed to get latest transactions")
                return False
        else:
            print("❌ No new transactions created")
            return False

    # ============= NEW BILLING FEATURE TESTS =============
    
    def test_billing_normal_flow_therapist_joins(self):
        """Test Scenario 1: Normal Flow - Therapist Joins"""
        if not self.client_token or not self.therapist_token:
            print("   Missing required tokens")
            return False

        print("\n🔍 Testing NEW BILLING FEATURE - Normal Flow (Therapist Joins)...")
        
        # Get user IDs
        client_id = self.get_user_id_from_token(self.client_token)
        therapist_id = self.get_user_id_from_token(self.therapist_token)
        
        if not client_id or not therapist_id:
            print("   Failed to extract user IDs from tokens")
            return False

        # Ensure client has enough coins
        if not self.add_coins_to_client(client_id, 2000):
            print("   Failed to add coins to client")
            return False

        # Get initial balances
        client_initial = self.get_user_balance(self.client_token)
        therapist_initial = self.get_user_balance(self.therapist_token)
        
        if client_initial is None or therapist_initial is None:
            print("   Failed to get initial balances")
            return False

        print(f"   Initial - Client: {client_initial} coins, Therapist: {therapist_initial} coins")

        # Step 1: Client creates session
        success, response = self.run_test(
            "Start Session (Pending Status)",
            "POST",
            "sessions/start",
            200,
            data={
                "therapist_id": therapist_id,
                "session_type": "call"
            },
            headers={'Authorization': f'Bearer {self.client_token}'}
        )
        
        if not success or 'session_id' not in response:
            print("   Failed to start session")
            return False

        session_id = response['session_id']
        print(f"   Session created: {session_id}")

        # Step 2: Verify session is in 'pending' status with therapist_joined_time=null
        success, session_history = self.run_test(
            "Get Session History (Check Pending)",
            "GET",
            "sessions/history",
            200,
            headers={'Authorization': f'Bearer {self.client_token}'}
        )
        
        if not success:
            print("   Failed to get session history")
            return False

        # Find our session
        current_session = None
        for session in session_history:
            if session['id'] == session_id:
                current_session = session
                break
        
        if not current_session:
            print("   Session not found in history")
            return False

        if current_session['status'] != 'pending':
            print(f"   ❌ Expected status 'pending', got '{current_session['status']}'")
            return False

        if current_session.get('therapist_joined_time') is not None:
            print(f"   ❌ Expected therapist_joined_time=null, got '{current_session.get('therapist_joined_time')}'")
            return False

        print("   ✅ Session created with status='pending', therapist_joined_time=null")

        # Step 3: Therapist accepts session
        import time
        accept_time_before = time.time()
        
        success, accept_response = self.run_test(
            "Therapist Accepts Session",
            "POST",
            "sessions/accept",
            200,
            data={"session_id": session_id},
            headers={'Authorization': f'Bearer {self.therapist_token}'}
        )

        accept_time_after = time.time()
        
        if not success:
            print("   Failed to accept session")
            return False

        print(f"   ✅ Therapist accepted session: {accept_response}")

        # Step 4: Verify session status changed to 'active' and therapist_joined_time is set
        success, session_history = self.run_test(
            "Get Session History (Check Active)",
            "GET",
            "sessions/history",
            200,
            headers={'Authorization': f'Bearer {self.client_token}'}
        )
        
        if not success:
            print("   Failed to get session history after accept")
            return False

        # Find our session again
        current_session = None
        for session in session_history:
            if session['id'] == session_id:
                current_session = session
                break
        
        if not current_session:
            print("   Session not found in history after accept")
            return False

        if current_session['status'] != 'active':
            print(f"   ❌ Expected status 'active', got '{current_session['status']}'")
            return False

        if current_session.get('therapist_joined_time') is None:
            print(f"   ❌ Expected therapist_joined_time to be set, got null")
            return False

        print("   ✅ Session status changed to 'active', therapist_joined_time is set")

        # Step 5: Wait a few seconds to simulate session duration
        print("   Waiting 3 seconds to simulate session duration...")
        time.sleep(3)

        # Step 6: End session
        success, end_response = self.run_test(
            "End Session (After Therapist Joined)",
            "POST",
            "sessions/end",
            200,
            data={"session_id": session_id, "duration_minutes": 1},  # This should be ignored, backend calculates
            headers={'Authorization': f'Bearer {self.client_token}'}
        )

        if not success:
            print("   Failed to end session")
            return False

        print(f"   ✅ Session ended: {end_response}")

        # Step 7: Verify duration calculated from therapist_joined_time and billing applied
        final_client_balance = self.get_user_balance(self.client_token)
        final_therapist_balance = self.get_user_balance(self.therapist_token)

        if final_client_balance is None or final_therapist_balance is None:
            print("   Failed to get final balances")
            return False

        client_change = client_initial - final_client_balance
        therapist_change = final_therapist_balance - therapist_initial

        print(f"   Final - Client: {final_client_balance} coins (change: -{client_change})")
        print(f"   Final - Therapist: {final_therapist_balance} coins (change: +{therapist_change})")

        # Verify billing occurred (minimum 1 minute charge)
        if client_change > 0 and therapist_change > 0:
            print("   ✅ Billing applied correctly after therapist joined")
            return True
        else:
            print("   ❌ No billing applied or incorrect amounts")
            return False

    def test_billing_therapist_never_joins(self):
        """Test Scenario 2: Therapist Never Joins"""
        if not self.client_token or not self.therapist_token:
            print("   Missing required tokens")
            return False

        print("\n🔍 Testing NEW BILLING FEATURE - Therapist Never Joins...")
        
        # Get user IDs
        client_id = self.get_user_id_from_token(self.client_token)
        therapist_id = self.get_user_id_from_token(self.therapist_token)
        
        if not client_id or not therapist_id:
            print("   Failed to extract user IDs from tokens")
            return False

        # Ensure client has enough coins
        if not self.add_coins_to_client(client_id, 2000):
            print("   Failed to add coins to client")
            return False

        # Get initial balances
        client_initial = self.get_user_balance(self.client_token)
        therapist_initial = self.get_user_balance(self.therapist_token)
        
        if client_initial is None or therapist_initial is None:
            print("   Failed to get initial balances")
            return False

        print(f"   Initial - Client: {client_initial} coins, Therapist: {therapist_initial} coins")

        # Step 1: Client creates session
        success, response = self.run_test(
            "Start Session (No Therapist Join)",
            "POST",
            "sessions/start",
            200,
            data={
                "therapist_id": therapist_id,
                "session_type": "call"
            },
            headers={'Authorization': f'Bearer {self.client_token}'}
        )
        
        if not success or 'session_id' not in response:
            print("   Failed to start session")
            return False

        session_id = response['session_id']
        print(f"   Session created: {session_id}")

        # Step 2: Verify session status='pending'
        success, session_history = self.run_test(
            "Get Session History (Check Pending)",
            "GET",
            "sessions/history",
            200,
            headers={'Authorization': f'Bearer {self.client_token}'}
        )
        
        if not success:
            print("   Failed to get session history")
            return False

        # Find our session
        current_session = None
        for session in session_history:
            if session['id'] == session_id:
                current_session = session
                break
        
        if not current_session or current_session['status'] != 'pending':
            print("   ❌ Session not in pending status")
            return False

        print("   ✅ Session status='pending'")

        # Step 3: WITHOUT calling /api/sessions/accept, end the session
        success, end_response = self.run_test(
            "End Session (Therapist Never Joined)",
            "POST",
            "sessions/end",
            200,
            data={"session_id": session_id, "duration_minutes": 5},  # This should be ignored
            headers={'Authorization': f'Bearer {self.client_token}'}
        )

        if not success:
            print("   Failed to end session")
            return False

        print(f"   ✅ Session ended: {end_response}")

        # Step 4: Verify session status='cancelled', coins_spent=0
        success, session_history = self.run_test(
            "Get Session History (Check Cancelled)",
            "GET",
            "sessions/history",
            200,
            headers={'Authorization': f'Bearer {self.client_token}'}
        )
        
        if not success:
            print("   Failed to get session history after end")
            return False

        # Find our session again
        current_session = None
        for session in session_history:
            if session['id'] == session_id:
                current_session = session
                break
        
        if not current_session:
            print("   Session not found in history after end")
            return False

        if current_session['status'] != 'cancelled':
            print(f"   ❌ Expected status 'cancelled', got '{current_session['status']}'")
            return False

        if current_session.get('coins_spent', 0) != 0:
            print(f"   ❌ Expected coins_spent=0, got '{current_session.get('coins_spent')}'")
            return False

        print("   ✅ Session status='cancelled', coins_spent=0")

        # Step 5: Verify no coins deducted from client, no coins earned by therapist
        final_client_balance = self.get_user_balance(self.client_token)
        final_therapist_balance = self.get_user_balance(self.therapist_token)

        if final_client_balance is None or final_therapist_balance is None:
            print("   Failed to get final balances")
            return False

        client_change = client_initial - final_client_balance
        therapist_change = final_therapist_balance - therapist_initial

        print(f"   Final - Client: {final_client_balance} coins (change: {client_change})")
        print(f"   Final - Therapist: {final_therapist_balance} coins (change: {therapist_change})")

        # Verify no billing occurred
        if client_change == 0 and therapist_change == 0:
            print("   ✅ No coins deducted from client, no coins earned by therapist")
            return True
        else:
            print("   ❌ Unexpected coin changes when therapist never joined")
            return False

    def test_billing_duration_calculation(self):
        """Test Scenario 3: Duration Calculation"""
        if not self.client_token or not self.therapist_token:
            print("   Missing required tokens")
            return False

        print("\n🔍 Testing NEW BILLING FEATURE - Duration Calculation...")
        
        # Get user IDs
        client_id = self.get_user_id_from_token(self.client_token)
        therapist_id = self.get_user_id_from_token(self.therapist_token)
        
        if not client_id or not therapist_id:
            print("   Failed to extract user IDs from tokens")
            return False

        # Ensure client has enough coins
        if not self.add_coins_to_client(client_id, 2000):
            print("   Failed to add coins to client")
            return False

        # Get therapist call rate
        therapist_rate = self.get_therapist_call_rate(self.therapist_token)
        print(f"   Therapist call rate: {therapist_rate} coins/minute")

        # Step 1: Create session
        success, response = self.run_test(
            "Start Session (Duration Test)",
            "POST",
            "sessions/start",
            200,
            data={
                "therapist_id": therapist_id,
                "session_type": "call"
            },
            headers={'Authorization': f'Bearer {self.client_token}'}
        )
        
        if not success or 'session_id' not in response:
            print("   Failed to start session")
            return False

        session_id = response['session_id']

        # Step 2: Therapist accepts (note the time)
        import time
        accept_start_time = time.time()
        
        success, accept_response = self.run_test(
            "Therapist Accepts (Duration Test)",
            "POST",
            "sessions/accept",
            200,
            data={"session_id": session_id},
            headers={'Authorization': f'Bearer {self.therapist_token}'}
        )

        if not success:
            print("   Failed to accept session")
            return False

        print(f"   Therapist accepted at: {accept_start_time}")

        # Step 3: Wait 4+ seconds
        print("   Waiting 4 seconds...")
        time.sleep(4)

        # Step 4: End session
        end_time = time.time()
        actual_duration_seconds = end_time - accept_start_time
        expected_duration_minutes = int(actual_duration_seconds / 60) + (1 if actual_duration_seconds % 60 > 0 else 0)
        
        # Minimum 1 minute billing
        if expected_duration_minutes < 1:
            expected_duration_minutes = 1

        print(f"   Actual duration: {actual_duration_seconds:.1f} seconds")
        print(f"   Expected billing duration: {expected_duration_minutes} minutes")

        success, end_response = self.run_test(
            "End Session (Duration Test)",
            "POST",
            "sessions/end",
            200,
            data={"session_id": session_id, "duration_minutes": 999},  # This should be ignored
            headers={'Authorization': f'Bearer {self.client_token}'}
        )

        if not success:
            print("   Failed to end session")
            return False

        # Step 5: Verify duration calculated matches actual time between accept and end
        success, session_history = self.run_test(
            "Get Session History (Check Duration)",
            "GET",
            "sessions/history",
            200,
            headers={'Authorization': f'Bearer {self.client_token}'}
        )
        
        if not success:
            print("   Failed to get session history")
            return False

        # Find our session
        current_session = None
        for session in session_history:
            if session['id'] == session_id:
                current_session = session
                break
        
        if not current_session:
            print("   Session not found in history")
            return False

        actual_billed_duration = current_session.get('duration_minutes', 0)
        actual_coins_spent = current_session.get('coins_spent', 0)
        expected_coins_spent = expected_duration_minutes * therapist_rate

        print(f"   Billed duration: {actual_billed_duration} minutes")
        print(f"   Coins spent: {actual_coins_spent}")
        print(f"   Expected coins: {expected_coins_spent}")

        # Verify minimum 1 minute billing even for short calls
        if actual_billed_duration >= 1 and actual_coins_spent == expected_coins_spent:
            print("   ✅ Duration calculated correctly with minimum 1 minute billing")
            return True
        else:
            print("   ❌ Incorrect duration calculation or billing")
            return False

    def test_billing_edge_cases(self):
        """Test Scenario 4: Edge Cases"""
        if not self.client_token or not self.therapist_token:
            print("   Missing required tokens")
            return False

        print("\n🔍 Testing NEW BILLING FEATURE - Edge Cases...")
        
        # Get user IDs
        client_id = self.get_user_id_from_token(self.client_token)
        therapist_id = self.get_user_id_from_token(self.therapist_token)
        
        if not client_id or not therapist_id:
            print("   Failed to extract user IDs from tokens")
            return False

        # Test Case 1: Try to accept already active session (should fail)
        print("\n   Test Case 1: Try to accept already active session...")
        
        # Create and accept a session first
        success, response = self.run_test(
            "Start Session (Edge Case 1)",
            "POST",
            "sessions/start",
            200,
            data={
                "therapist_id": therapist_id,
                "session_type": "call"
            },
            headers={'Authorization': f'Bearer {self.client_token}'}
        )
        
        if not success or 'session_id' not in response:
            print("   Failed to start session for edge case 1")
            return False

        session_id = response['session_id']

        # Accept the session
        success, accept_response = self.run_test(
            "Therapist Accepts Session (Edge Case 1)",
            "POST",
            "sessions/accept",
            200,
            data={"session_id": session_id},
            headers={'Authorization': f'Bearer {self.therapist_token}'}
        )

        if not success:
            print("   Failed to accept session for edge case 1")
            return False

        # Try to accept again (should fail)
        success, fail_response = self.run_test(
            "Try to Accept Already Active Session (Should Fail)",
            "POST",
            "sessions/accept",
            400,  # Expecting 400 error
            data={"session_id": session_id},
            headers={'Authorization': f'Bearer {self.therapist_token}'}
        )

        if success:
            print("   ✅ Correctly rejected attempt to accept already active session")
        else:
            print("   ❌ Should have rejected attempt to accept already active session")
            return False

        # Clean up - end the session
        self.run_test(
            "End Session (Edge Case 1 Cleanup)",
            "POST",
            "sessions/end",
            200,
            data={"session_id": session_id, "duration_minutes": 1},
            headers={'Authorization': f'Bearer {self.client_token}'}
        )

        # Test Case 2: Try to accept as client (should fail)
        print("\n   Test Case 2: Try to accept as client...")
        
        # Create a new session
        success, response = self.run_test(
            "Start Session (Edge Case 2)",
            "POST",
            "sessions/start",
            200,
            data={
                "therapist_id": therapist_id,
                "session_type": "call"
            },
            headers={'Authorization': f'Bearer {self.client_token}'}
        )
        
        if not success or 'session_id' not in response:
            print("   Failed to start session for edge case 2")
            return False

        session_id2 = response['session_id']

        # Try to accept as client (should fail)
        success, fail_response = self.run_test(
            "Try to Accept as Client (Should Fail)",
            "POST",
            "sessions/accept",
            403,  # Expecting 403 error
            data={"session_id": session_id2},
            headers={'Authorization': f'Bearer {self.client_token}'}  # Using client token!
        )

        if success:
            print("   ✅ Correctly rejected client attempt to accept session")
        else:
            print("   ❌ Should have rejected client attempt to accept session")
            return False

        # Test Case 3: Check if session can be ended before therapist joins
        print("\n   Test Case 3: End session before therapist joins...")
        
        # End the session without therapist accepting
        success, end_response = self.run_test(
            "End Session Before Therapist Joins",
            "POST",
            "sessions/end",
            200,
            data={"session_id": session_id2, "duration_minutes": 5},
            headers={'Authorization': f'Bearer {self.client_token}'}
        )

        if success:
            print("   ✅ Successfully ended session before therapist joined")
            
            # Verify it was cancelled with no charge
            success, session_history = self.run_test(
                "Get Session History (Edge Case 3)",
                "GET",
                "sessions/history",
                200,
                headers={'Authorization': f'Bearer {self.client_token}'}
            )
            
            if success:
                # Find our session
                current_session = None
                for session in session_history:
                    if session['id'] == session_id2:
                        current_session = session
                        break
                
                if current_session and current_session['status'] == 'cancelled' and current_session.get('coins_spent', 0) == 0:
                    print("   ✅ Session correctly cancelled with no charge")
                    return True
                else:
                    print("   ❌ Session not properly cancelled or charged incorrectly")
                    return False
            else:
                print("   ❌ Failed to get session history for verification")
                return False
        else:
            print("   ❌ Failed to end session before therapist joined")
            return False

    # ============= PENDING SESSIONS VISIBILITY TESTS =============
    
    def test_pending_sessions_visibility_scenario_1(self):
        """Test Scenario 1: Client Starts Call - Therapist Sees It"""
        if not self.client_token or not self.therapist_token:
            print("   Missing required tokens")
            return False

        print("\n🔍 Testing PENDING SESSIONS - Scenario 1: Client Starts Call, Therapist Sees It...")
        
        # Get user IDs
        client_id = self.get_user_id_from_token(self.client_token)
        therapist_id = self.get_user_id_from_token(self.therapist_token)
        
        if not client_id or not therapist_id:
            print("   Failed to extract user IDs from tokens")
            return False

        # Ensure client has enough coins
        if not self.add_coins_to_client(client_id, 2000):
            print("   Failed to add coins to client")
            return False

        # Step 1: Client creates session
        success, response = self.run_test(
            "Client Starts Session",
            "POST",
            "sessions/start",
            200,
            data={
                "therapist_id": therapist_id,
                "session_type": "call"
            },
            headers={'Authorization': f'Bearer {self.client_token}'}
        )
        
        if not success or 'session_id' not in response:
            print("   Failed to start session")
            return False

        session_id = response['session_id']
        print(f"   ✅ Session created: {session_id}")

        # Step 2: Verify session created with status='pending'
        success, session_history = self.run_test(
            "Get Session History (Verify Pending)",
            "GET",
            "sessions/history",
            200,
            headers={'Authorization': f'Bearer {self.client_token}'}
        )
        
        if not success:
            print("   Failed to get session history")
            return False

        # Find our session
        current_session = None
        for session in session_history:
            if session['id'] == session_id:
                current_session = session
                break
        
        if not current_session or current_session['status'] != 'pending':
            print(f"   ❌ Expected session status 'pending', got '{current_session['status'] if current_session else 'not found'}'")
            return False

        print("   ✅ Session created with status='pending'")

        # Step 3: Therapist checks active sessions - should see the pending session
        success, therapist_active_sessions = self.run_test(
            "Therapist Gets Active Sessions (Should See Pending)",
            "GET",
            "sessions/active",
            200,
            headers={'Authorization': f'Bearer {self.therapist_token}'}
        )
        
        if not success:
            print("   Failed to get therapist active sessions")
            return False

        # Verify therapist can see the pending session with client name
        pending_session_found = False
        for session in therapist_active_sessions:
            if session['id'] == session_id and session['status'] == 'pending':
                pending_session_found = True
                if 'client_name' in session:
                    print(f"   ✅ Therapist can see pending session with client name: {session['client_name']}")
                else:
                    print("   ✅ Therapist can see pending session (client name not populated)")
                break
        
        if not pending_session_found:
            print("   ❌ Therapist cannot see the pending session in active sessions")
            return False

        # Step 4: Client also checks active sessions - should see their pending session
        success, client_active_sessions = self.run_test(
            "Client Gets Active Sessions (Should See Own Pending)",
            "GET",
            "sessions/active",
            200,
            headers={'Authorization': f'Bearer {self.client_token}'}
        )
        
        if not success:
            print("   Failed to get client active sessions")
            return False

        # Verify client can see their own pending session
        client_pending_found = False
        for session in client_active_sessions:
            if session['id'] == session_id and session['status'] == 'pending':
                client_pending_found = True
                print("   ✅ Client can see their own pending session")
                break
        
        if not client_pending_found:
            print("   ❌ Client cannot see their own pending session in active sessions")
            return False

        # Clean up - end the session
        self.run_test(
            "End Session (Cleanup)",
            "POST",
            "sessions/end",
            200,
            data={"session_id": session_id, "duration_minutes": 1},
            headers={'Authorization': f'Bearer {self.client_token}'}
        )

        return True

    def test_pending_sessions_visibility_scenario_2(self):
        """Test Scenario 2: Therapist Accepts Call"""
        if not self.client_token or not self.therapist_token:
            print("   Missing required tokens")
            return False

        print("\n🔍 Testing PENDING SESSIONS - Scenario 2: Therapist Accepts Call...")
        
        # Get user IDs
        client_id = self.get_user_id_from_token(self.client_token)
        therapist_id = self.get_user_id_from_token(self.therapist_token)
        
        if not client_id or not therapist_id:
            print("   Failed to extract user IDs from tokens")
            return False

        # Ensure client has enough coins
        if not self.add_coins_to_client(client_id, 2000):
            print("   Failed to add coins to client")
            return False

        # Step 1: Client creates session
        success, response = self.run_test(
            "Client Starts Session (Accept Test)",
            "POST",
            "sessions/start",
            200,
            data={
                "therapist_id": therapist_id,
                "session_type": "call"
            },
            headers={'Authorization': f'Bearer {self.client_token}'}
        )
        
        if not success or 'session_id' not in response:
            print("   Failed to start session")
            return False

        session_id = response['session_id']

        # Step 2: Verify both see pending session
        success, therapist_sessions_before = self.run_test(
            "Therapist Active Sessions (Before Accept)",
            "GET",
            "sessions/active",
            200,
            headers={'Authorization': f'Bearer {self.therapist_token}'}
        )

        pending_found_before = any(s['id'] == session_id and s['status'] == 'pending' for s in therapist_sessions_before)
        if not pending_found_before:
            print("   ❌ Therapist doesn't see pending session before accept")
            return False

        print("   ✅ Therapist sees pending session before accept")

        # Step 3: Therapist accepts call
        success, accept_response = self.run_test(
            "Therapist Accepts Session",
            "POST",
            "sessions/accept",
            200,
            data={"session_id": session_id},
            headers={'Authorization': f'Bearer {self.therapist_token}'}
        )

        if not success:
            print("   Failed to accept session")
            return False

        print("   ✅ Therapist accepted session")

        # Step 4: Verify session status changed to 'active'
        success, therapist_sessions_after = self.run_test(
            "Therapist Active Sessions (After Accept)",
            "GET",
            "sessions/active",
            200,
            headers={'Authorization': f'Bearer {self.therapist_token}'}
        )

        active_found_after = any(s['id'] == session_id and s['status'] == 'active' for s in therapist_sessions_after)
        if not active_found_after:
            print("   ❌ Session not showing as active after accept")
            return False

        print("   ✅ Session status changed to 'active' after accept")

        # Step 5: Both check active sessions again - should still see the session (now active)
        success, client_sessions_after = self.run_test(
            "Client Active Sessions (After Accept)",
            "GET",
            "sessions/active",
            200,
            headers={'Authorization': f'Bearer {self.client_token}'}
        )

        client_active_found = any(s['id'] == session_id and s['status'] == 'active' for s in client_sessions_after)
        if not client_active_found:
            print("   ❌ Client doesn't see active session after accept")
            return False

        print("   ✅ Both client and therapist see the session as active")

        # Clean up
        self.run_test(
            "End Session (Cleanup)",
            "POST",
            "sessions/end",
            200,
            data={"session_id": session_id, "duration_minutes": 1},
            headers={'Authorization': f'Bearer {self.client_token}'}
        )

        return True

    def test_pending_sessions_visibility_scenario_3(self):
        """Test Scenario 3: Therapist Declines Pending Call"""
        if not self.client_token or not self.therapist_token:
            print("   Missing required tokens")
            return False

        print("\n🔍 Testing PENDING SESSIONS - Scenario 3: Therapist Declines Pending Call...")
        
        # Get user IDs
        client_id = self.get_user_id_from_token(self.client_token)
        therapist_id = self.get_user_id_from_token(self.therapist_token)
        
        if not client_id or not therapist_id:
            print("   Failed to extract user IDs from tokens")
            return False

        # Ensure client has enough coins
        if not self.add_coins_to_client(client_id, 2000):
            print("   Failed to add coins to client")
            return False

        # Step 1: Client creates session
        success, response = self.run_test(
            "Client Starts Session (Decline Test)",
            "POST",
            "sessions/start",
            200,
            data={
                "therapist_id": therapist_id,
                "session_type": "call"
            },
            headers={'Authorization': f'Bearer {self.client_token}'}
        )
        
        if not success or 'session_id' not in response:
            print("   Failed to start session")
            return False

        session_id = response['session_id']

        # Step 2: Therapist declines immediately
        success, decline_response = self.run_test(
            "Therapist Declines Session",
            "POST",
            "sessions/decline",
            200,
            data={
                "session_id": session_id,
                "reason": "Not available"
            },
            headers={'Authorization': f'Bearer {self.therapist_token}'}
        )

        if not success:
            print("   Failed to decline session")
            return False

        print("   ✅ Therapist declined session")

        # Step 3: Verify session status='declined'
        success, session_history = self.run_test(
            "Get Session History (Check Declined)",
            "GET",
            "sessions/history",
            200,
            headers={'Authorization': f'Bearer {self.client_token}'}
        )
        
        if not success:
            print("   Failed to get session history")
            return False

        # Find our session
        current_session = None
        for session in session_history:
            if session['id'] == session_id:
                current_session = session
                break
        
        if not current_session or current_session['status'] != 'declined':
            print(f"   ❌ Expected session status 'declined', got '{current_session['status'] if current_session else 'not found'}'")
            return False

        print("   ✅ Session status changed to 'declined'")

        # Step 4: Verify session no longer appears in active sessions
        success, therapist_active_sessions = self.run_test(
            "Therapist Active Sessions (After Decline)",
            "GET",
            "sessions/active",
            200,
            headers={'Authorization': f'Bearer {self.therapist_token}'}
        )

        declined_session_found = any(s['id'] == session_id for s in therapist_active_sessions)
        if declined_session_found:
            print("   ❌ Declined session still appears in active sessions")
            return False

        print("   ✅ Declined session no longer appears in active sessions")

        # Step 5: Verify no coins charged (coins_spent should be 0)
        if current_session.get('coins_spent', 0) != 0:
            print(f"   ❌ Expected coins_spent=0 for declined session, got {current_session.get('coins_spent')}")
            return False

        print("   ✅ No coins charged for declined session")

        return True

    def test_pending_sessions_visibility_scenario_4(self):
        """Test Scenario 4: Multiple Pending Sessions"""
        if not self.client_token or not self.therapist_token:
            print("   Missing required tokens")
            return False

        print("\n🔍 Testing PENDING SESSIONS - Scenario 4: Multiple Pending Sessions...")
        
        # Get user IDs
        client_id = self.get_user_id_from_token(self.client_token)
        therapist_id = self.get_user_id_from_token(self.therapist_token)
        
        if not client_id or not therapist_id:
            print("   Failed to extract user IDs from tokens")
            return False

        # Ensure client has enough coins
        if not self.add_coins_to_client(client_id, 2000):
            print("   Failed to add coins to client")
            return False

        session_ids = []

        # Step 1: Create 3 sessions from different scenarios
        for i in range(3):
            success, response = self.run_test(
                f"Create Session {i+1}",
                "POST",
                "sessions/start",
                200,
                data={
                    "therapist_id": therapist_id,
                    "session_type": "call"
                },
                headers={'Authorization': f'Bearer {self.client_token}'}
            )
            
            if success and 'session_id' in response:
                session_ids.append(response['session_id'])
            else:
                print(f"   Failed to create session {i+1}")
                return False

        print(f"   ✅ Created {len(session_ids)} sessions")

        # Step 2: Verify therapist sees all pending sessions
        success, therapist_active_sessions = self.run_test(
            "Therapist Active Sessions (Multiple Pending)",
            "GET",
            "sessions/active",
            200,
            headers={'Authorization': f'Bearer {self.therapist_token}'}
        )

        if not success:
            print("   Failed to get therapist active sessions")
            return False

        pending_sessions_found = []
        for session in therapist_active_sessions:
            if session['id'] in session_ids and session['status'] == 'pending':
                pending_sessions_found.append(session['id'])

        if len(pending_sessions_found) != len(session_ids):
            print(f"   ❌ Expected {len(session_ids)} pending sessions, found {len(pending_sessions_found)}")
            return False

        print(f"   ✅ Therapist sees all {len(session_ids)} pending sessions")

        # Step 3: Accept one session
        success, accept_response = self.run_test(
            "Accept First Session",
            "POST",
            "sessions/accept",
            200,
            data={"session_id": session_ids[0]},
            headers={'Authorization': f'Bearer {self.therapist_token}'}
        )

        if not success:
            print("   Failed to accept first session")
            return False

        # Step 4: Decline another session
        success, decline_response = self.run_test(
            "Decline Second Session",
            "POST",
            "sessions/decline",
            200,
            data={
                "session_id": session_ids[1],
                "reason": "Busy with another client"
            },
            headers={'Authorization': f'Bearer {self.therapist_token}'}
        )

        if not success:
            print("   Failed to decline second session")
            return False

        # Step 5: Verify correct status updates
        success, therapist_active_sessions_after = self.run_test(
            "Therapist Active Sessions (After Actions)",
            "GET",
            "sessions/active",
            200,
            headers={'Authorization': f'Bearer {self.therapist_token}'}
        )

        if not success:
            print("   Failed to get therapist active sessions after actions")
            return False

        # Check session statuses
        session_statuses = {}
        for session in therapist_active_sessions_after:
            if session['id'] in session_ids:
                session_statuses[session['id']] = session['status']

        # Session 0 should be active, session 1 should not appear (declined), session 2 should be pending
        expected_active_sessions = 2  # session 0 (active) + session 2 (pending)
        actual_active_sessions = len(session_statuses)

        if actual_active_sessions != expected_active_sessions:
            print(f"   ❌ Expected {expected_active_sessions} active sessions, found {actual_active_sessions}")
            return False

        # Verify specific statuses
        if session_statuses.get(session_ids[0]) != 'active':
            print(f"   ❌ First session should be active, got {session_statuses.get(session_ids[0])}")
            return False

        if session_ids[1] in session_statuses:
            print("   ❌ Declined session should not appear in active sessions")
            return False

        if session_statuses.get(session_ids[2]) != 'pending':
            print(f"   ❌ Third session should be pending, got {session_statuses.get(session_ids[2])}")
            return False

        print("   ✅ Correct status updates: accepted→active, declined→removed, pending→pending")

        # Clean up - end remaining sessions
        for session_id in [session_ids[0], session_ids[2]]:
            self.run_test(
                f"End Session {session_id} (Cleanup)",
                "POST",
                "sessions/end",
                200,
                data={"session_id": session_id, "duration_minutes": 1},
                headers={'Authorization': f'Bearer {self.client_token}'}
            )

        return True

    # ============= CRITICAL BALANCE INVESTIGATION TESTS =============
    
    def test_critical_balance_investigation(self):
        """CRITICAL: Investigate -160 balance issue after 3000 coin recharge"""
        print("\n🚨 CRITICAL BALANCE INVESTIGATION - User reports -160 balance after recharging 3000 coins")
        
        # Create fresh user for clean test
        timestamp = datetime.now().strftime('%H%M%S')
        fresh_email = f"balancetest{timestamp}@test.com"
        
        # Step 1: Register fresh user
        success, response = self.run_test(
            "Register Fresh User for Balance Test",
            "POST",
            "auth/register",
            200,
            data={
                "email": fresh_email,
                "name": f"Balance Test User {timestamp}",
                "password": "testpass123",
                "role": "client"
            }
        )
        
        if not success or 'access_token' not in response:
            print("❌ Failed to create fresh user")
            return False
        
        fresh_token = response['access_token']
        fresh_user_id = self.get_user_id_from_token(fresh_token)
        
        # Step 2: Check initial balance (should be 0)
        initial_balance = self.get_user_balance(fresh_token)
        print(f"   Initial balance: {initial_balance} coins")
        
        if initial_balance != 0:
            print(f"   ❌ Expected initial balance 0, got {initial_balance}")
            return False
        
        # Step 3: Recharge 600 coins (starter package)
        success, response = self.run_test(
            "Recharge Starter Package (600 coins)",
            "POST",
            "coins/recharge/package?package_id=starter",
            200,
            headers={'Authorization': f'Bearer {fresh_token}'}
        )
        
        if not success:
            print("   ❌ Failed to recharge starter package")
            return False
        
        # Step 4: Verify balance = 600
        balance_after_recharge = self.get_user_balance(fresh_token)
        print(f"   Balance after starter recharge: {balance_after_recharge} coins")
        
        if balance_after_recharge != 600:
            print(f"   ❌ Expected balance 600, got {balance_after_recharge}")
            return False
        
        # Step 5: Recharge Gold package (3300 coins) to simulate user's 3000 coin recharge
        success, response = self.run_test(
            "Recharge Gold Package (3300 coins)",
            "POST",
            "coins/recharge/package?package_id=gold",
            200,
            headers={'Authorization': f'Bearer {fresh_token}'}
        )
        
        if not success:
            print("   ❌ Failed to recharge gold package")
            return False
        
        # Step 6: Verify cumulative balance = 600 + 3300 = 3900
        balance_after_gold = self.get_user_balance(fresh_token)
        print(f"   Balance after gold recharge: {balance_after_gold} coins")
        expected_balance = 600 + 3300
        
        if balance_after_gold != expected_balance:
            print(f"   ❌ Expected balance {expected_balance}, got {balance_after_gold}")
            return False
        
        # Step 7: Get therapist for session test
        if not self.therapist_token:
            print("   ❌ No therapist token available for session test")
            return False
        
        therapist_id = self.get_user_id_from_token(self.therapist_token)
        therapist_rate = self.get_therapist_call_rate(self.therapist_token)
        
        # Step 8: Start and complete a short session (1 min)
        success, response = self.run_test(
            "Start Session for Balance Test",
            "POST",
            "sessions/start",
            200,
            data={
                "therapist_id": therapist_id,
                "session_type": "call"
            },
            headers={'Authorization': f'Bearer {fresh_token}'}
        )
        
        if not success or 'session_id' not in response:
            print("   ❌ Failed to start session")
            return False
        
        session_id = response['session_id']
        
        # Step 9: Therapist accepts session
        success, accept_response = self.run_test(
            "Therapist Accepts Session (Balance Test)",
            "POST",
            "sessions/accept",
            200,
            data={"session_id": session_id},
            headers={'Authorization': f'Bearer {self.therapist_token}'}
        )
        
        if not success:
            print("   ❌ Failed to accept session")
            return False
        
        # Step 10: Wait 1 minute and end session
        print("   Waiting 3 seconds for session duration...")
        time.sleep(3)
        
        success, end_response = self.run_test(
            "End Session (Balance Test)",
            "POST",
            "sessions/end",
            200,
            data={"session_id": session_id},
            headers={'Authorization': f'Bearer {fresh_token}'}
        )
        
        if not success:
            print("   ❌ Failed to end session")
            return False
        
        # Step 11: Calculate expected balance and check actual
        expected_deduction = 1 * therapist_rate  # Minimum 1 minute billing
        expected_remaining = expected_balance - expected_deduction
        
        final_balance = self.get_user_balance(fresh_token)
        print(f"   Expected deduction: {expected_deduction} coins (1 min × {therapist_rate}/min)")
        print(f"   Expected remaining: {expected_remaining} coins")
        print(f"   Actual final balance: {final_balance} coins")
        
        # Step 12: Check transaction history for unexpected entries
        success, transactions = self.run_test(
            "Get Transaction History (Balance Test)",
            "GET",
            "transactions/history",
            200,
            headers={'Authorization': f'Bearer {fresh_token}'}
        )
        
        if success:
            print(f"   Transaction count: {len(transactions)}")
            for i, tx in enumerate(transactions[:5]):  # Show last 5 transactions
                print(f"   Transaction {i+1}: {tx['type']} - {tx['amount']} coins - {tx['description']}")
        
        # Step 13: Verify balance matches expected
        if final_balance == expected_remaining:
            print("   ✅ Balance calculation is CORRECT - no duplicate deductions found")
            return True
        elif final_balance < 0:
            print(f"   🚨 CRITICAL BUG FOUND: Balance went negative ({final_balance}) - this matches user report!")
            return False
        else:
            print(f"   ❌ Balance mismatch: expected {expected_remaining}, got {final_balance}")
            return False
    
    def test_multiple_session_balance_tracking(self):
        """Test multiple sessions to check for cumulative balance issues"""
        print("\n🔍 Testing Multiple Sessions for Balance Tracking...")
        
        if not self.client_token or not self.therapist_token:
            print("   Missing required tokens")
            return False
        
        # Get initial setup
        client_id = self.get_user_id_from_token(self.client_token)
        therapist_id = self.get_user_id_from_token(self.therapist_token)
        therapist_rate = self.get_therapist_call_rate(self.therapist_token)
        
        # Ensure client has enough coins
        if not self.add_coins_to_client(client_id, 5000):
            print("   Failed to add coins to client")
            return False
        
        initial_balance = self.get_user_balance(self.client_token)
        print(f"   Starting balance: {initial_balance} coins")
        
        total_expected_deduction = 0
        
        # Run 3 short sessions
        for session_num in range(1, 4):
            print(f"\n   Session {session_num}:")
            
            # Start session
            success, response = self.run_test(
                f"Start Session {session_num}",
                "POST",
                "sessions/start",
                200,
                data={
                    "therapist_id": therapist_id,
                    "session_type": "call"
                },
                headers={'Authorization': f'Bearer {self.client_token}'}
            )
            
            if not success or 'session_id' not in response:
                print(f"   ❌ Failed to start session {session_num}")
                return False
            
            session_id = response['session_id']
            
            # Therapist accepts
            success, accept_response = self.run_test(
                f"Therapist Accepts Session {session_num}",
                "POST",
                "sessions/accept",
                200,
                data={"session_id": session_id},
                headers={'Authorization': f'Bearer {self.therapist_token}'}
            )
            
            if not success:
                print(f"   ❌ Failed to accept session {session_num}")
                return False
            
            # Wait and end
            time.sleep(2)
            
            success, end_response = self.run_test(
                f"End Session {session_num}",
                "POST",
                "sessions/end",
                200,
                data={"session_id": session_id},
                headers={'Authorization': f'Bearer {self.client_token}'}
            )
            
            if not success:
                print(f"   ❌ Failed to end session {session_num}")
                return False
            
            # Check balance after each session
            current_balance = self.get_user_balance(self.client_token)
            session_deduction = 1 * therapist_rate  # Minimum 1 minute
            total_expected_deduction += session_deduction
            expected_balance = initial_balance - total_expected_deduction
            
            print(f"   After session {session_num}: Balance = {current_balance}, Expected = {expected_balance}")
            
            if current_balance != expected_balance:
                print(f"   ❌ Balance mismatch after session {session_num}")
                return False
        
        print("   ✅ Multiple sessions processed correctly - no cumulative balance errors")
        return True
    
    def test_back_button_duplicate_deduction(self):
        """Test for duplicate deductions when using back button"""
        print("\n🔍 Testing Back Button Duplicate Deduction Issue...")
        
        if not self.client_token or not self.therapist_token:
            print("   Missing required tokens")
            return False
        
        # Get setup
        client_id = self.get_user_id_from_token(self.client_token)
        therapist_id = self.get_user_id_from_token(self.therapist_token)
        therapist_rate = self.get_therapist_call_rate(self.therapist_token)
        
        # Ensure client has enough coins
        if not self.add_coins_to_client(client_id, 2000):
            print("   Failed to add coins to client")
            return False
        
        initial_balance = self.get_user_balance(self.client_token)
        
        # Start session
        success, response = self.run_test(
            "Start Session (Back Button Test)",
            "POST",
            "sessions/start",
            200,
            data={
                "therapist_id": therapist_id,
                "session_type": "call"
            },
            headers={'Authorization': f'Bearer {self.client_token}'}
        )
        
        if not success or 'session_id' not in response:
            print("   ❌ Failed to start session")
            return False
        
        session_id = response['session_id']
        
        # Therapist accepts
        success, accept_response = self.run_test(
            "Therapist Accepts Session (Back Button Test)",
            "POST",
            "sessions/accept",
            200,
            data={"session_id": session_id},
            headers={'Authorization': f'Bearer {self.therapist_token}'}
        )
        
        if not success:
            print("   ❌ Failed to accept session")
            return False
        
        time.sleep(2)
        
        # End session first time
        success, end_response1 = self.run_test(
            "End Session (First Call)",
            "POST",
            "sessions/end",
            200,
            data={"session_id": session_id},
            headers={'Authorization': f'Bearer {self.client_token}'}
        )
        
        if not success:
            print("   ❌ Failed to end session first time")
            return False
        
        balance_after_first_end = self.get_user_balance(self.client_token)
        expected_deduction = 1 * therapist_rate
        expected_balance = initial_balance - expected_deduction
        
        print(f"   After first end: Balance = {balance_after_first_end}, Expected = {expected_balance}")
        
        # Try to end session again (simulating back button issue)
        success, end_response2 = self.run_test(
            "End Session (Second Call - Should Not Deduct Again)",
            "POST",
            "sessions/end",
            200,
            data={"session_id": session_id},
            headers={'Authorization': f'Bearer {self.client_token}'}
        )
        
        if not success:
            print("   ❌ Failed on second end call")
            return False
        
        balance_after_second_end = self.get_user_balance(self.client_token)
        
        print(f"   After second end: Balance = {balance_after_second_end}")
        
        # Balance should be the same (no duplicate deduction)
        if balance_after_second_end == balance_after_first_end:
            print("   ✅ No duplicate deduction on second end call")
            return True
        else:
            print("   ❌ DUPLICATE DEDUCTION DETECTED!")
            return False
    
    def test_comprehensive_coin_package_recharge(self):
        """Test all coin packages for correct balance updates"""
        print("\n🔍 Testing All Coin Package Recharges...")
        
        # Create fresh user for each package test
        packages = [
            {"id": "starter", "coins": 600, "name": "Starter"},
            {"id": "silver", "coins": 1500, "name": "Silver"},
            {"id": "gold", "coins": 3300, "name": "Gold"}
        ]
        
        for package in packages:
            timestamp = datetime.now().strftime('%H%M%S%f')
            fresh_email = f"pkg{package['id']}{timestamp}@test.com"
            
            # Register fresh user
            success, response = self.run_test(
                f"Register User for {package['name']} Package Test",
                "POST",
                "auth/register",
                200,
                data={
                    "email": fresh_email,
                    "name": f"{package['name']} Test User",
                    "password": "testpass123",
                    "role": "client"
                }
            )
            
            if not success or 'access_token' not in response:
                print(f"   ❌ Failed to create user for {package['name']} test")
                continue
            
            fresh_token = response['access_token']
            
            # Check initial balance
            initial_balance = self.get_user_balance(fresh_token)
            if initial_balance != 0:
                print(f"   ❌ {package['name']}: Initial balance not 0")
                continue
            
            # Recharge package
            success, response = self.run_test(
                f"Recharge {package['name']} Package",
                "POST",
                f"coins/recharge/package?package_id={package['id']}",
                200,
                headers={'Authorization': f'Bearer {fresh_token}'}
            )
            
            if not success:
                print(f"   ❌ Failed to recharge {package['name']} package")
                continue
            
            # Verify balance
            final_balance = self.get_user_balance(fresh_token)
            if final_balance == package['coins']:
                print(f"   ✅ {package['name']} package: {package['coins']} coins added correctly")
            else:
                print(f"   ❌ {package['name']} package: Expected {package['coins']}, got {final_balance}")
                return False
        
        return True

def main():
    print("🚀 Starting MindConnect COMPREHENSIVE API Tests...")
    print("🚨 CRITICAL FOCUS: Investigating -160 balance issue after 3000 coin recharge")
    tester = MindConnectAPITester()
    
    # Test sequence - Focus on CRITICAL BALANCE INVESTIGATION
    tests = [
        ("Admin Login", tester.test_admin_login_for_coin_tests),
        ("Client Registration and Login", tester.test_client_registration_and_login),
        ("Therapist Registration and Login", tester.test_therapist_registration_and_login),
        
        # CRITICAL BALANCE INVESTIGATION TESTS
        ("🚨 CRITICAL: Balance Investigation", tester.test_critical_balance_investigation),
        ("Multiple Session Balance Tracking", tester.test_multiple_session_balance_tracking),
        ("Back Button Duplicate Deduction Test", tester.test_back_button_duplicate_deduction),
        ("Comprehensive Coin Package Recharge", tester.test_comprehensive_coin_package_recharge),
        
        # Core functionality tests
        ("Get Coin Packages", tester.test_get_coin_packages),
        ("Get User Balance", tester.test_get_user_balance),
        ("List Therapists", tester.test_list_therapists),
        ("Admin Analytics", tester.test_admin_analytics),
        
        # Session flow tests
        ("Start Session", tester.test_start_session),
        ("Coin Deduction - Client Ends", tester.test_coin_deduction_client_ends_session),
        ("Coin Deduction - Therapist Ends", tester.test_coin_deduction_therapist_ends_session),
        ("Transaction Records", tester.test_transaction_records),
        
        # Billing feature tests
        ("Billing - Normal Flow", tester.test_billing_normal_flow_therapist_joins),
        ("Billing - Therapist Never Joins", tester.test_billing_therapist_never_joins),
        ("Billing - Duration Calculation", tester.test_billing_duration_calculation),
        ("Billing - Edge Cases", tester.test_billing_edge_cases),
        
        # Twilio tests
        ("Twilio Token - Client", tester.test_twilio_token_generation_client),
        ("Twilio Token - Therapist", tester.test_twilio_token_generation_therapist),
    ]
    
    failed_tests = []
    critical_failed = False
    
    for test_name, test_func in tests:
        try:
            if not test_func():
                failed_tests.append(test_name)
                if "🚨 CRITICAL" in test_name or "Balance" in test_name:
                    critical_failed = True
        except Exception as e:
            print(f"❌ {test_name} failed with exception: {str(e)}")
            failed_tests.append(test_name)
            if "🚨 CRITICAL" in test_name or "Balance" in test_name:
                critical_failed = True
    
    # Print results
    print(f"\n📊 Test Results:")
    print(f"Tests passed: {tester.tests_passed}/{tester.tests_run}")
    print(f"Success rate: {(tester.tests_passed/tester.tests_run)*100:.1f}%")
    
    if critical_failed:
        print(f"\n🚨 CRITICAL BALANCE TESTS FAILED!")
        print(f"❌ Failed tests: {', '.join(failed_tests)}")
        return 1
    elif failed_tests:
        print(f"\n⚠️  Some tests failed: {', '.join(failed_tests)}")
        return 1
    else:
        print(f"\n✅ All tests passed!")
        return 0

if __name__ == "__main__":
    sys.exit(main())