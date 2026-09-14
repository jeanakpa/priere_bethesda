import os
import psycopg2
import requests

BASE_URL = "http://localhost:5050"
DB_URL = "postgresql://postgres:postgres@localhost:5432/priere_bethesda"

def get_db_otp(username):
    conn = psycopg2.connect(DB_URL)
    cur = conn.cursor()
    cur.execute("SELECT otp_code FROM users WHERE username = %s;", (username,))
    row = cur.fetchone()
    conn.close()
    return row[0] if row else None

def test_auth_and_roles():
    print("=== TEST AUTH & ROLES ===")
    
    # 1. Test Login Conducteur (yedohjosephine / 123456)
    print("\n1. Test Login Conducteur (yedohjosephine)...")
    res = requests.post(f"{BASE_URL}/api/auth/login", json={
        "username": "yedohjosephine",
        "password": "123456"
    })
    print(f"Login Status: {res.status_code}, Response: {res.json()}")
    assert res.status_code == 200

    otp_code = get_db_otp("yedohjosephine")
    print(f"Retrieved OTP code from DB: {otp_code}")
    assert otp_code is not None

    # 2. Test Verify OTP
    print("\n2. Test Verify OTP Conducteur...")
    res_otp = requests.post(f"{BASE_URL}/api/auth/verify-otp", json={
        "username": "yedohjosephine",
        "otp_code": otp_code
    })
    print(f"Verify OTP Status: {res_otp.status_code}, Response: {res_otp.json()}")
    assert res_otp.status_code == 200
    user_data = res_otp.json().get('user')
    token = res_otp.json().get('token')
    print(f"Conducteur User Role: {user_data.get('role')}, Class: {user_data.get('methode_classe')}")

    # 3. Test Conducteur Requests endpoint (should show only their class)
    print("\n3. Fetching Requests for Conducteur...")
    headers = {"Authorization": f"Bearer {token}"}
    res_reqs = requests.get(f"{BASE_URL}/api/admin/requests", headers=headers)
    print(f"Requests Status: {res_reqs.status_code}, Total: {res_reqs.json().get('total')}")
    assert res_reqs.status_code == 200

    # 4. Test Conducteur update status (should fail HTTP 403)
    print("\n4. Test Conducteur updating status (Expected: 403 Forbidden)...")
    res_update = requests.put(f"{BASE_URL}/api/admin/requests/1/status", json={"status": "Validé"}, headers=headers)
    print(f"Update Status Response: {res_update.status_code}, Body: {res_update.json()}")
    assert res_update.status_code == 403

    # 5. Test Login Secretariat (leonceaka / 123456)
    print("\n5. Test Login Secretariat (leonceaka)...")
    res_sec = requests.post(f"{BASE_URL}/api/auth/login", json={
        "username": "leonceaka",
        "password": "123456"
    })
    assert res_sec.status_code == 200
    sec_otp = get_db_otp("leonceaka")
    
    res_sec_verify = requests.post(f"{BASE_URL}/api/auth/verify-otp", json={
        "username": "leonceaka",
        "otp_code": sec_otp
    })
    assert res_sec_verify.status_code == 200
    sec_token = res_sec_verify.json().get('token')
    sec_user = res_sec_verify.json().get('user')
    print(f"Secrétariat User Role: {sec_user.get('role')}")

    # 6. Test Secretariat Updating Status (should succeed)
    print("\n6. Test Secretariat updating status (Expected: 200 OK)...")
    sec_headers = {"Authorization": f"Bearer {sec_token}"}
    reqs_sec = requests.get(f"{BASE_URL}/api/admin/requests", headers=sec_headers).json()
    if reqs_sec.get('total', 0) > 0:
        req_id = reqs_sec['requests'][0]['id']
        res_sec_update = requests.put(f"{BASE_URL}/api/admin/requests/{req_id}/status", json={"status": "Validé", "is_validated": True}, headers=sec_headers)
        print(f"Secrétariat Update Status: {res_sec_update.status_code}, Body: {res_sec_update.json()}")
        assert res_sec_update.status_code == 200

    # 7. Test Lockout (5 wrong OTP attempts)
    print("\n7. Test OTP Lockout (5 wrong attempts)...")
    res_bad = requests.post(f"{BASE_URL}/api/auth/login", json={
        "username": "assekemarc",
        "password": "123456"
    })
    for attempt in range(1, 6):
        res_try = requests.post(f"{BASE_URL}/api/auth/verify-otp", json={
            "username": "assekemarc",
            "otp_code": "0000"  # wrong OTP
        })
        print(f"Attempt {attempt}: Status {res_try.status_code}, Msg: {res_try.json().get('message')}")
        if attempt == 5:
            assert res_try.status_code == 429 or "Bloqué" in res_try.json().get('message', '')

    print("\n=== ALL E2E BACKEND TESTS PASSED SUCCESSFULLY! ===")

if __name__ == '__main__':
    test_auth_and_roles()
