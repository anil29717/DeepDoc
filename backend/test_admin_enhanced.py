import requests

BASE_URL = "http://127.0.0.1:8000"

def test_enhanced_admin():
    # 1. Admin Login
    print("Testing Admin Login...")
    res = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": "admin@deepdoc.ai",
        "password": "admin123"
    })
    assert res.status_code == 200
    token = res.json()["access_token"]

    # 2. Toggle Status (Test with a regular user)
    # First find a regular user (not admin)
    res = requests.get(f"{BASE_URL}/api/admin/users", headers={"Authorization": f"Bearer {token}"})
    users = res.json()
    print(f"Users found: {users}")
    reg_user = next((u for u in users if u["email"] != "admin@deepdoc.ai"), None)
    
    if reg_user:
        print(f"Testing Status Toggle for {reg_user['email']}...")
        user_id = reg_user["id"]
        # Toggle
        res = requests.patch(f"{BASE_URL}/api/admin/users/{user_id}/status", headers={"Authorization": f"Bearer {token}"})
        print(f"Toggle 1: {res.json()['message']}")
        assert res.status_code == 200
        
        # Toggle back
        res = requests.patch(f"{BASE_URL}/api/admin/users/{user_id}/status", headers={"Authorization": f"Bearer {token}"})
        print(f"Toggle 2: {res.json()['message']}")
        assert res.status_code == 200

    # 3. List Global Documents
    print("Testing Global Document Listing...")
    res = requests.get(f"{BASE_URL}/api/admin/documents", headers={"Authorization": f"Bearer {token}"})
    print(f"Global Docs Response: {res.status_code}")
    assert res.status_code == 200
    docs = res.json()
    print(f"Found {len(docs)} documents in total.")
    for d in docs:
        print(f"- {d['filename']} | Owner: {d['owner']['name']} | Status: {d['status']}")

    print("\n✅ Enhanced Admin Verification Passed!")

if __name__ == "__main__":
    test_enhanced_admin()
