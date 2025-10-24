import requests
import sys
import json
import time
from datetime import datetime

class EndCallFunctionalityTester:
    def __init__(self, base_url="https://mindcare-video.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.admin_token = None
        self.client_token = None
        self.therapist_token = None
        self.tests_run = 0
        self.tests_passed = 0

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

    def setup_authentication(self):
        """Setup authentication tokens"""
        print("🔐 Setting up authentication...")
        
        # Admin login
        success, response = self.run_test(
            "Admin Login",
            "POST", 
            "auth/login?email=admin@mindconnect.com&password=admin123",
            200
        )
        if success and 'access_token' in response:
            self.admin_token = response['access_token']
            print("✅ Admin authenticated")
        else:
            print("❌ Admin authentication failed")
            return False

        # Client login
        success, response = self.run_test(
            "Client Login",
            "POST",
            "auth/login?email=client@test.com&password=client123", 
            200
        )
        if success and 'access_token' in response:
            self.client_token = response['access_token']
            print("✅ Client authenticated")
        else:
            print("❌ Client authentication failed")
            return False

        # Therapist login
        success, response = self.run_test(
            "Therapist Login",
            "POST",
            "auth/login?email=therapist@test.com&password=therapist123",
            200
        )
        if success and 'access_token' in response:
            self.therapist_token = response['access_token']
            print("✅ Therapist authenticated")
        else:
            print("❌ Therapist authentication failed")
            return False

        return True

    def get_user_id_from_token(self, token):
        """Helper method to extract user ID from JWT token"""
        import jwt
        try:
            payload = jwt.decode(token, options={"verify_signature": False})
            return payload.get("sub")
        except:
            return None

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

    def test_scenario_1_end_call_after_therapist_joins(self):
        """Test Scenario 1: End Call After Therapist Joins (Normal Flow)"""
        print("\n" + "="*80)
        print("🧪 TEST SCENARIO 1: End Call After Therapist Joins (Normal Flow)")
        print("="*80)
        
        if not self.client_token or not self.therapist_token:
            print("❌ Missing required tokens")
            return False

        # Get user IDs
        client_id = self.get_user_id_from_token(self.client_token)
        therapist_id = self.get_user_id_from_token(self.therapist_token)
        
        if not client_id or not therapist_id:
            print("❌ Failed to extract user IDs from tokens")
            return False

        # Ensure client has enough coins
        if not self.add_coins_to_client(client_id, 2000):
            print("❌ Failed to add coins to client")
            return False

        # Get initial balances
        client_initial = self.get_user_balance(self.client_token)
        therapist_initial = self.get_user_balance(self.therapist_token)
        
        if client_initial is None or therapist_initial is None:
            print("❌ Failed to get initial balances")
            return False

        print(f"📊 Initial balances - Client: {client_initial} coins, Therapist: {therapist_initial} coins")

        # Step 1: Client creates session
        success, response = self.run_test(
            "Client Creates Session",
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
            print("❌ Failed to start session")
            return False

        session_id = response['session_id']
        print(f"✅ Session created: {session_id}")

        # Step 2: Therapist accepts session
        success, accept_response = self.run_test(
            "Therapist Accepts Session",
            "POST",
            "sessions/accept",
            200,
            data={"session_id": session_id},
            headers={'Authorization': f'Bearer {self.therapist_token}'}
        )

        if not success:
            print("❌ Failed to accept session")
            return False

        print("✅ Therapist accepted session - billing starts now")

        # Step 3: Wait a few seconds
        print("⏳ Waiting 3 seconds to simulate call duration...")
        time.sleep(3)

        # Step 4: Client ends call (WITHOUT duration_minutes field - this is the key test)
        success, end_response = self.run_test(
            "Client Ends Call (No duration_minutes field)",
            "POST",
            "sessions/end",
            200,
            data={"session_id": session_id},  # Only session_id, no duration_minutes!
            headers={'Authorization': f'Bearer {self.client_token}'}
        )

        if not success:
            print("❌ Failed to end session")
            return False

        print("✅ Call ended successfully without duration_minutes field")

        # Step 5: Verify session status and billing
        success, session_history = self.run_test(
            "Get Session History",
            "GET",
            "sessions/history",
            200,
            headers={'Authorization': f'Bearer {self.client_token}'}
        )
        
        if not success:
            print("❌ Failed to get session history")
            return False

        # Find our session
        current_session = None
        for session in session_history:
            if session['id'] == session_id:
                current_session = session
                break
        
        if not current_session:
            print("❌ Session not found in history")
            return False

        # Verify session completed
        if current_session['status'] != 'completed':
            print(f"❌ Expected status 'completed', got '{current_session['status']}'")
            return False

        print("✅ Session status changed to 'completed'")

        # Verify duration was auto-calculated (should be at least 1 minute)
        duration = current_session.get('duration_minutes', 0)
        if duration < 1:
            print(f"❌ Expected duration >= 1 minute, got {duration}")
            return False

        print(f"✅ Duration auto-calculated: {duration} minutes")

        # Verify coins were deducted and earned
        final_client_balance = self.get_user_balance(self.client_token)
        final_therapist_balance = self.get_user_balance(self.therapist_token)

        client_change = client_initial - final_client_balance
        therapist_change = final_therapist_balance - therapist_initial

        if client_change <= 0:
            print(f"❌ No coins deducted from client (change: {client_change})")
            return False

        if therapist_change <= 0:
            print(f"❌ No coins earned by therapist (change: {therapist_change})")
            return False

        print(f"✅ Coins deducted from client: {client_change}")
        print(f"✅ Coins earned by therapist: {therapist_change}")

        return True

    def test_scenario_2_end_call_before_therapist_joins(self):
        """Test Scenario 2: End Call Before Therapist Joins"""
        print("\n" + "="*80)
        print("🧪 TEST SCENARIO 2: End Call Before Therapist Joins")
        print("="*80)
        
        if not self.client_token or not self.therapist_token:
            print("❌ Missing required tokens")
            return False

        # Get user IDs
        client_id = self.get_user_id_from_token(self.client_token)
        therapist_id = self.get_user_id_from_token(self.therapist_token)
        
        if not client_id or not therapist_id:
            print("❌ Failed to extract user IDs from tokens")
            return False

        # Ensure client has enough coins
        if not self.add_coins_to_client(client_id, 2000):
            print("❌ Failed to add coins to client")
            return False

        # Get initial balances
        client_initial = self.get_user_balance(self.client_token)
        therapist_initial = self.get_user_balance(self.therapist_token)

        print(f"📊 Initial balances - Client: {client_initial} coins, Therapist: {therapist_initial} coins")

        # Step 1: Client creates session (status: pending)
        success, response = self.run_test(
            "Client Creates Session",
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
            print("❌ Failed to start session")
            return False

        session_id = response['session_id']
        print(f"✅ Session created: {session_id}")

        # Step 2: WITHOUT therapist accepting, try to end session
        success, end_response = self.run_test(
            "End Session Before Therapist Joins",
            "POST",
            "sessions/end",
            200,
            data={"session_id": session_id},  # Only session_id, no duration_minutes!
            headers={'Authorization': f'Bearer {self.client_token}'}
        )

        if not success:
            print("❌ Failed to end session")
            return False

        print("✅ Session ended gracefully before therapist joined")

        # Step 3: Verify session status and billing
        success, session_history = self.run_test(
            "Get Session History",
            "GET",
            "sessions/history",
            200,
            headers={'Authorization': f'Bearer {self.client_token}'}
        )
        
        if not success:
            print("❌ Failed to get session history")
            return False

        # Find our session
        current_session = None
        for session in session_history:
            if session['id'] == session_id:
                current_session = session
                break
        
        if not current_session:
            print("❌ Session not found in history")
            return False

        # Verify session cancelled
        if current_session['status'] != 'cancelled':
            print(f"❌ Expected status 'cancelled', got '{current_session['status']}'")
            return False

        print("✅ Session status changed to 'cancelled'")

        # Verify coins_spent = 0
        coins_spent = current_session.get('coins_spent', 0)
        if coins_spent != 0:
            print(f"❌ Expected coins_spent=0, got {coins_spent}")
            return False

        print("✅ coins_spent = 0 (no billing)")

        # Verify no balance changes
        final_client_balance = self.get_user_balance(self.client_token)
        final_therapist_balance = self.get_user_balance(self.therapist_token)

        client_change = client_initial - final_client_balance
        therapist_change = final_therapist_balance - therapist_initial

        if client_change != 0:
            print(f"❌ Unexpected client balance change: {client_change}")
            return False

        if therapist_change != 0:
            print(f"❌ Unexpected therapist balance change: {therapist_change}")
            return False

        print("✅ No coins deducted or earned (correct behavior)")

        return True

    def test_scenario_3_both_client_and_therapist_can_end(self):
        """Test Scenario 3: Both Client and Therapist Can End"""
        print("\n" + "="*80)
        print("🧪 TEST SCENARIO 3: Both Client and Therapist Can End")
        print("="*80)
        
        if not self.client_token or not self.therapist_token:
            print("❌ Missing required tokens")
            return False

        # Get user IDs
        client_id = self.get_user_id_from_token(self.client_token)
        therapist_id = self.get_user_id_from_token(self.therapist_token)
        
        if not client_id or not therapist_id:
            print("❌ Failed to extract user IDs from tokens")
            return False

        # Ensure client has enough coins
        if not self.add_coins_to_client(client_id, 3000):
            print("❌ Failed to add coins to client")
            return False

        # Test 3A: Client ends call
        print("\n📋 Test 3A: Client Ends Call")
        
        # Create and accept session
        success, response = self.run_test(
            "Client Creates Session (Test 3A)",
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
            print("❌ Failed to start session for test 3A")
            return False

        session_id_3a = response['session_id']

        # Therapist accepts
        success, accept_response = self.run_test(
            "Therapist Accepts Session (Test 3A)",
            "POST",
            "sessions/accept",
            200,
            data={"session_id": session_id_3a},
            headers={'Authorization': f'Bearer {self.therapist_token}'}
        )

        if not success:
            print("❌ Failed to accept session for test 3A")
            return False

        time.sleep(2)  # Wait 2 seconds

        # Client ends session
        success, end_response = self.run_test(
            "Client Ends Session (Test 3A)",
            "POST",
            "sessions/end",
            200,
            data={"session_id": session_id_3a},
            headers={'Authorization': f'Bearer {self.client_token}'}
        )

        if not success:
            print("❌ Client failed to end session")
            return False

        print("✅ Client successfully ended call")

        # Test 3B: Therapist ends call
        print("\n📋 Test 3B: Therapist Ends Call")
        
        # Create and accept another session
        success, response = self.run_test(
            "Client Creates Session (Test 3B)",
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
            print("❌ Failed to start session for test 3B")
            return False

        session_id_3b = response['session_id']

        # Therapist accepts
        success, accept_response = self.run_test(
            "Therapist Accepts Session (Test 3B)",
            "POST",
            "sessions/accept",
            200,
            data={"session_id": session_id_3b},
            headers={'Authorization': f'Bearer {self.therapist_token}'}
        )

        if not success:
            print("❌ Failed to accept session for test 3B")
            return False

        time.sleep(2)  # Wait 2 seconds

        # Therapist ends session
        success, end_response = self.run_test(
            "Therapist Ends Session (Test 3B)",
            "POST",
            "sessions/end",
            200,
            data={"session_id": session_id_3b},
            headers={'Authorization': f'Bearer {self.therapist_token}'}  # Therapist token!
        )

        if not success:
            print("❌ Therapist failed to end session")
            return False

        print("✅ Therapist successfully ended call")

        # Verify both sessions completed properly
        success, session_history = self.run_test(
            "Get Session History (Test 3)",
            "GET",
            "sessions/history",
            200,
            headers={'Authorization': f'Bearer {self.client_token}'}
        )
        
        if not success:
            print("❌ Failed to get session history")
            return False

        # Check both sessions
        session_3a = None
        session_3b = None
        for session in session_history:
            if session['id'] == session_id_3a:
                session_3a = session
            elif session['id'] == session_id_3b:
                session_3b = session

        if not session_3a or session_3a['status'] != 'completed':
            print("❌ Session 3A not completed properly")
            return False

        if not session_3b or session_3b['status'] != 'completed':
            print("❌ Session 3B not completed properly")
            return False

        print("✅ Both sessions completed successfully")
        print(f"✅ Session 3A (client ended): {session_3a['coins_spent']} coins spent")
        print(f"✅ Session 3B (therapist ended): {session_3b['coins_spent']} coins spent")

        return True

    def test_scenario_4_duration_calculation(self):
        """Test Scenario 4: Duration Calculation"""
        print("\n" + "="*80)
        print("🧪 TEST SCENARIO 4: Duration Calculation")
        print("="*80)
        
        if not self.client_token or not self.therapist_token:
            print("❌ Missing required tokens")
            return False

        # Get user IDs
        client_id = self.get_user_id_from_token(self.client_token)
        therapist_id = self.get_user_id_from_token(self.therapist_token)
        
        if not client_id or not therapist_id:
            print("❌ Failed to extract user IDs from tokens")
            return False

        # Ensure client has enough coins
        if not self.add_coins_to_client(client_id, 2000):
            print("❌ Failed to add coins to client")
            return False

        # Create session
        success, response = self.run_test(
            "Client Creates Session (Duration Test)",
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
            print("❌ Failed to start session")
            return False

        session_id = response['session_id']

        # Therapist accepts (note the time)
        accept_start_time = time.time()
        
        success, accept_response = self.run_test(
            "Therapist Accepts Session (Duration Test)",
            "POST",
            "sessions/accept",
            200,
            data={"session_id": session_id},
            headers={'Authorization': f'Bearer {self.therapist_token}'}
        )

        if not success:
            print("❌ Failed to accept session")
            return False

        print(f"⏰ Therapist accepted at: {datetime.fromtimestamp(accept_start_time).strftime('%H:%M:%S')}")

        # Wait 4+ seconds
        print("⏳ Waiting 4 seconds...")
        time.sleep(4)

        # End session
        end_time = time.time()
        actual_duration_seconds = end_time - accept_start_time
        
        success, end_response = self.run_test(
            "End Session (Duration Test)",
            "POST",
            "sessions/end",
            200,
            data={"session_id": session_id},  # No duration_minutes - backend calculates
            headers={'Authorization': f'Bearer {self.client_token}'}
        )

        if not success:
            print("❌ Failed to end session")
            return False

        print(f"⏰ Session ended at: {datetime.fromtimestamp(end_time).strftime('%H:%M:%S')}")
        print(f"📏 Actual duration: {actual_duration_seconds:.1f} seconds")

        # Verify duration calculation
        success, session_history = self.run_test(
            "Get Session History (Duration Check)",
            "GET",
            "sessions/history",
            200,
            headers={'Authorization': f'Bearer {self.client_token}'}
        )
        
        if not success:
            print("❌ Failed to get session history")
            return False

        # Find our session
        current_session = None
        for session in session_history:
            if session['id'] == session_id:
                current_session = session
                break
        
        if not current_session:
            print("❌ Session not found in history")
            return False

        billed_duration = current_session.get('duration_minutes', 0)
        coins_spent = current_session.get('coins_spent', 0)

        print(f"📊 Billed duration: {billed_duration} minutes")
        print(f"💰 Coins spent: {coins_spent}")

        # Verify minimum 1 minute billing
        if billed_duration < 1:
            print(f"❌ Expected minimum 1 minute billing, got {billed_duration}")
            return False

        print("✅ Minimum 1 minute billing enforced")

        # Verify duration matches actual time (rounded up)
        expected_duration = int(actual_duration_seconds / 60) + (1 if actual_duration_seconds % 60 > 0 else 0)
        if expected_duration < 1:
            expected_duration = 1

        if billed_duration != expected_duration:
            print(f"❌ Duration mismatch - Expected: {expected_duration}, Got: {billed_duration}")
            return False

        print(f"✅ Duration calculated accurately: {billed_duration} minutes")

        # Get therapist rate and verify calculation
        try:
            response = requests.get(
                f"{self.base_url}/therapists/profile/me",
                headers={'Authorization': f'Bearer {self.therapist_token}', 'Content-Type': 'application/json'}
            )
            if response.status_code == 200:
                therapist_rate = response.json().get('call_rate', 150)
            else:
                therapist_rate = 150  # Default
        except:
            therapist_rate = 150

        expected_coins = billed_duration * therapist_rate
        if coins_spent != expected_coins:
            print(f"❌ Coin calculation mismatch - Expected: {expected_coins}, Got: {coins_spent}")
            return False

        print(f"✅ Coin calculation accurate: {coins_spent} coins ({therapist_rate}/min × {billed_duration}min)")

        return True

    def run_all_tests(self):
        """Run all end call functionality tests"""
        print("🚀 Starting End Call Functionality Tests")
        print("="*80)
        
        # Setup authentication
        if not self.setup_authentication():
            print("❌ Authentication setup failed")
            return False

        # Run all test scenarios
        test_results = []
        
        test_results.append(("Scenario 1: End Call After Therapist Joins", 
                           self.test_scenario_1_end_call_after_therapist_joins()))
        
        test_results.append(("Scenario 2: End Call Before Therapist Joins", 
                           self.test_scenario_2_end_call_before_therapist_joins()))
        
        test_results.append(("Scenario 3: Both Client and Therapist Can End", 
                           self.test_scenario_3_both_client_and_therapist_can_end()))
        
        test_results.append(("Scenario 4: Duration Calculation", 
                           self.test_scenario_4_duration_calculation()))

        # Print summary
        print("\n" + "="*80)
        print("📊 END CALL FUNCTIONALITY TEST SUMMARY")
        print("="*80)
        
        passed_count = 0
        for test_name, result in test_results:
            status = "✅ PASSED" if result else "❌ FAILED"
            print(f"{status} - {test_name}")
            if result:
                passed_count += 1

        success_rate = (passed_count / len(test_results)) * 100
        print(f"\n🎯 Overall Success Rate: {success_rate:.1f}% ({passed_count}/{len(test_results)} tests passed)")
        
        if success_rate == 100:
            print("🎉 ALL END CALL FUNCTIONALITY TESTS PASSED!")
            return True
        else:
            print("⚠️  Some tests failed - end call functionality needs attention")
            return False

if __name__ == "__main__":
    tester = EndCallFunctionalityTester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)