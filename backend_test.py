import requests
import sys
import json
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

def main():
    print("🚀 Starting MindConnect Coin Deduction Fix Tests...")
    tester = MindConnectAPITester()
    
    # Test sequence - Focus on coin deduction fix
    tests = [
        ("Admin Login", tester.test_admin_login_for_coin_tests),
        ("Client Registration and Login", tester.test_client_registration_and_login),
        ("Therapist Registration and Login", tester.test_therapist_registration_and_login),
        ("Coin Deduction - Client Ends Session", tester.test_coin_deduction_client_ends_session),
        ("Coin Deduction - Therapist Ends Session (CRITICAL)", tester.test_coin_deduction_therapist_ends_session),
        ("Transaction Records Verification", tester.test_transaction_records),
    ]
    
    failed_tests = []
    critical_failed = False
    
    for test_name, test_func in tests:
        try:
            if not test_func():
                failed_tests.append(test_name)
                if "CRITICAL" in test_name:
                    critical_failed = True
        except Exception as e:
            print(f"❌ {test_name} failed with exception: {str(e)}")
            failed_tests.append(test_name)
            if "CRITICAL" in test_name:
                critical_failed = True
    
    # Print results
    print(f"\n📊 Test Results:")
    print(f"Tests passed: {tester.tests_passed}/{tester.tests_run}")
    print(f"Success rate: {(tester.tests_passed/tester.tests_run)*100:.1f}%")
    
    if critical_failed:
        print(f"\n🚨 CRITICAL TEST FAILED: Coin deduction bug still exists!")
        print(f"❌ Failed tests: {', '.join(failed_tests)}")
        return 1
    elif failed_tests:
        print(f"\n⚠️  Some tests failed: {', '.join(failed_tests)}")
        return 1
    else:
        print(f"\n✅ All coin deduction tests passed!")
        return 0

if __name__ == "__main__":
    sys.exit(main())