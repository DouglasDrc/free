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

    def test_therapist_login(self):
        """Test therapist login with test credentials"""
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
        if not self.client_token or not self.created_therapist_id:
            return False
        
        success, response = self.run_test(
            "Start Session",
            "POST",
            "sessions/start",
            200,
            data={
                "therapist_id": self.created_therapist_id,
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

def main():
    print("🚀 Starting MindConnect API Tests...")
    tester = MindConnectAPITester()
    
    # Test sequence - Focus on Twilio integration
    tests = [
        ("Client Login", tester.test_client_login),
        ("Therapist Login", tester.test_therapist_login),
        ("Generate Twilio Token (Client)", tester.test_twilio_token_generation_client),
        ("Generate Twilio Token (Therapist)", tester.test_twilio_token_generation_therapist),
        ("Start Session", tester.test_start_session),
        ("Generate Twilio Token (Session Room)", tester.test_twilio_token_with_session_room),
        ("End Session", tester.test_end_session),
    ]
    
    failed_tests = []
    
    for test_name, test_func in tests:
        try:
            if not test_func():
                failed_tests.append(test_name)
        except Exception as e:
            print(f"❌ {test_name} failed with exception: {str(e)}")
            failed_tests.append(test_name)
    
    # Print results
    print(f"\n📊 Test Results:")
    print(f"Tests passed: {tester.tests_passed}/{tester.tests_run}")
    print(f"Success rate: {(tester.tests_passed/tester.tests_run)*100:.1f}%")
    
    if failed_tests:
        print(f"\n❌ Failed tests: {', '.join(failed_tests)}")
        return 1
    else:
        print(f"\n✅ All tests passed!")
        return 0

if __name__ == "__main__":
    sys.exit(main())