import requests

BASE_URL = "http://localhost:8000"

def test_admin():
    # 1. Admin Login
    print("Testing Admin Login...")
    res = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": "admin@deepdoc.ai",
        "password": "admin123"
    })
    print(f"Login Response: {res.status_code}")
    assert res.status_code == 200
    login_data = res.json()
    token = login_data["access_token"]
    user = login_data["user"]
    print(f"User data: {user}")
    assert user["is_admin"] is True

    # 2. List Users
    print("Testing Admin List Users...")
    res = requests.get(f"{BASE_URL}/api/admin/users", headers={
        "Authorization": f"Bearer {token}"
    })
    print(f"List Users Response: {res.status_code}")
    assert res.status_code == 200
    users = res.json()
    print(f"Found {len(users)} users.")
    for u in users:
        print(f"- {u['name']} ({u['email']}) Admin: {u['is_admin']}")

    # 3. Test Unauthorized Access (using a regular user token if possible)
    # We'll just test without token first
    print("Testing unauthorized admin access...")
    res = requests.get(f"{BASE_URL}/api/admin/users")
    assert res.status_code == 401
    print("Unauthorized access blocked correctly.")

    print("\n✅ Admin Backend Verification Passed!")

if __name__ == "__main__":
    try:
        test_admin()
    except Exception as e:
        print(f"\n❌ Admin Verification Failed: {e}")
