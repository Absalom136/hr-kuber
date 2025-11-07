# test_patch_auth.py
# Logs into Django admin (HTML form) and performs an authenticated PATCH to the API.
# Usage: edit USERNAME/PASSWORD, then run `python test_patch_auth.py`

import sys
import requests
from bs4 import BeautifulSoup

BASE = "http://localhost:8000"
LOGIN_URL = f"{BASE}/admin/login/"
PATCH_URL = f"{BASE}/api/admin/users/3/"

USERNAME = "admin"
PASSWORD = "Arsenal2025"

s = requests.Session()

# 1) GET admin login page to obtain csrf token
r = s.get(LOGIN_URL)
r.raise_for_status()
soup = BeautifulSoup(r.text, "html.parser")
csrf_input = soup.find("input", {"name": "csrfmiddlewaretoken"})
if not csrf_input:
    print("Could not find csrf token on admin login page")
    sys.exit(1)
csrf = csrf_input["value"]

# 2) POST credentials to admin login form
payload = {"username": USERNAME, "password": PASSWORD, "csrfmiddlewaretoken": csrf, "next": "/admin/"}
headers = {"Referer": LOGIN_URL}
r = s.post(LOGIN_URL, data=payload, headers=headers)
# If login failed, admin returns the login page again (status 200) with login form.
if "logout" not in r.text.lower() and r.status_code == 200:
    print("Login failed. Check username/password or view runserver console for details")
    sys.exit(2)

# 3) Confirm session cookies exist
if not any(c.name == "sessionid" for c in s.cookies):
    print("No sessionid cookie found after login")
    sys.exit(3)

# 4) Build patch body and send PATCH with CSRF header
body = {
  "physical_address": "P.O.Box 24163",
  "department": 3,
  "gender": "Male",
  "role": "Admin",
  "updated_on": "2025-11-02T22:13:20Z"
}
csrf_cookie = s.cookies.get("csrftoken") or s.cookies.get("csrfmiddlewaretoken") or ""
headers = {"X-CSRFToken": csrf_cookie, "Accept": "application/json", "X-Requested-With": "XMLHttpRequest", "Content-Type": "application/json"}
r = s.patch(PATCH_URL, json=body, headers=headers)

print("status", r.status_code)
try:
    print(r.json())
except Exception:
    print(r.text)