import requests
import time

BASE_URL = "http://localhost:8000"

def test_auth():
    email = f"test_{int(time.time())}@example.com"
    password = "password123"
    name = "Test User"

    # 1. Signup
    print(f"Testing Signup for {email}...")
    res = requests.post(f"{BASE_URL}/api/auth/signup", json={
        "email": email,
        "password": password,
        "name": name
    })
    print(f"Signup Response: {res.status_code} - {res.json()}")
    assert res.status_code == 200

    # 2. Login
    print("Testing Login...")
    res = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": email,
        "password": password
    })
    print(f"Login Response: {res.status_code}")
    assert res.status_code == 200
    token = res.json()["access_token"]
    print(f"Token received: {token[:10]}...")

    # 3. Test Secured Endpoint
    print("Testing secured /api/folders...")
    res = requests.get(f"{BASE_URL}/api/folders", headers={
        "Authorization": f"Bearer {token}"
    })
    print(f"Folders Response: {res.status_code} - {res.json()}")
    assert res.status_code == 200

    # 4. Test unauthorized
    print("Testing unauthorized access...")
    res = requests.get(f"{BASE_URL}/api/folders")
    print(f"Unauthorized Response: {res.status_code}")
    assert res.status_code == 401

    print("\n✅ Auth Verification Passed!")

if __name__ == "__main__":
    try:
        test_auth()
    except Exception as e:
        print(f"\n❌ Verification Failed: {e}")
