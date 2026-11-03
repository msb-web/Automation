"""Phase 4 smoke test — starts the FastAPI server itself, exercises the full
backend end-to-end, then tears the server down. Single foreground process.

    python /home/z/my-project/scripts/smoke_test.py
"""
import io
import os
import subprocess
import sys
import time
import requests

BACKEND = "/home/z/my-project/download/backend"
BASE = "http://127.0.0.1:8000"
ADMIN = ("admin@aivideo.io", "demo1234")
passed = failed = 0


def check(name, cond, detail=""):
    global passed, failed
    if cond:
        passed += 1
        print(f"  PASS  {name}")
    else:
        failed += 1
        print(f"  FAIL  {name}  {detail}")


def auth_header(token):
    return {"Authorization": f"Bearer {token}"}


def spawn_server():
    """Start uvicorn as a child process; return the Popen object."""
    log = open("/tmp/uvicorn-smoke.log", "w")
    proc = subprocess.Popen(
        ["uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", "8000"],
        cwd=BACKEND, stdout=log, stderr=subprocess.STDOUT,
    )
    # Poll for readiness
    for _ in range(40):
        try:
            if requests.get(f"{BASE}/health", timeout=1).status_code == 200:
                return proc
        except requests.RequestException:
            pass
        time.sleep(0.5)
    proc.terminate()
    raise RuntimeError("server did not become ready in time")


def run_all():
    print("AI Video Automation backend — smoke test\n" + "=" * 52)

    # 1. Health
    r = requests.get(f"{BASE}/")
    check("GET / health", r.status_code == 200 and r.json()["status"] == "ok", r.text)

    # 2. Login as admin
    r = requests.post(f"{BASE}/auth/login", data={"username": ADMIN[0], "password": ADMIN[1]})
    check("POST /auth/login admin", r.status_code == 200, r.text)
    admin_token = r.json()["access_token"]

    # 3. /auth/me
    r = requests.get(f"{BASE}/auth/me", headers=auth_header(admin_token))
    check("GET /auth/me", r.status_code == 200 and r.json()["email"] == ADMIN[0], r.text)

    # 4. Auth failure without token
    r = requests.get(f"{BASE}/auth/me")
    check("GET /auth/me no-token -> 401", r.status_code == 401, r.text)

    # 5. Register a new user
    r = requests.post(f"{BASE}/auth/register", json={
        "email": "smoke@test.io", "password": "smoke12345", "name": "Smoke Tester", "role": "producer"})
    check("POST /auth/register", r.status_code == 201, r.text)
    smoke_token = r.json()["access_token"] if r.status_code == 201 else ""

    # 6. Duplicate register -> 409
    r = requests.post(f"{BASE}/auth/register", json={
        "email": "smoke@test.io", "password": "smoke12345", "name": "Smoke Tester", "role": "producer"})
    check("POST /auth/register duplicate -> 409", r.status_code == 409, r.text)

    # 7. Create a project
    r = requests.post(f"{BASE}/projects", headers=auth_header(admin_token), json={
        "title": "Smoke Test Video", "topic": "Testing the backend end-to-end",
        "niche": "Technology", "format": "16-9", "voice": "en-us-female"})
    check("POST /projects create", r.status_code == 201, r.text)
    proj_id = r.json()["id"]
    check("new project status=draft", r.json()["status"] == "draft", r.json())

    # 8. List projects
    r = requests.get(f"{BASE}/projects", headers=auth_header(admin_token))
    check("GET /projects list", r.status_code == 200 and len(r.json()) >= 1, r.text)

    # 9. Get one project
    r = requests.get(f"{BASE}/projects/{proj_id}", headers=auth_header(admin_token))
    check("GET /projects/{id}", r.status_code == 200 and r.json()["id"] == proj_id, r.text)

    # 10. Patch project
    r = requests.patch(f"{BASE}/projects/{proj_id}", headers=auth_header(admin_token),
                       json={"tone": "Casual", "keywords": "#smoke #test"})
    check("PATCH /projects/{id}", r.status_code == 200 and r.json()["tone"] == "Casual", r.text)

    # 11. Save script
    script = ("[HOOK]\nThis is a smoke test narration.\n\n[BODY]\nIt has about "
              "twenty words in total across two blocks here.\n\n[CTA]\nSubscribe for more.")
    r = requests.put(f"{BASE}/projects/{proj_id}/script", headers=auth_header(admin_token),
                     json={"content": script})
    check("PUT /projects/{id}/script", r.status_code == 200, r.text)
    check("script word_count > 0", r.json()["word_count"] > 0, r.json())
    check("script estimated_duration_sec > 0", r.json()["estimated_duration_sec"] > 0, r.json())

    # 12. Read script back
    r = requests.get(f"{BASE}/projects/{proj_id}/script", headers=auth_header(admin_token))
    check("GET /projects/{id}/script", r.status_code == 200 and r.json()["content"] == script, "mismatch")

    # 13. Generate (kick off workflow)
    r = requests.post(f"{BASE}/projects/{proj_id}/generate", headers=auth_header(admin_token))
    check("POST /projects/{id}/generate", r.status_code == 200, r.text)
    r = requests.get(f"{BASE}/projects/{proj_id}", headers=auth_header(admin_token))
    check("project status -> generating", r.json()["status"] == "generating", r.json())

    # 14. List workflow runs — 6 stages, first running
    r = requests.get(f"{BASE}/projects/{proj_id}/workflow", headers=auth_header(admin_token))
    runs = r.json()
    check("GET workflow runs count=6", r.status_code == 200 and len(runs) == 6, f"got {len(runs)}")
    check("first stage=script running", runs[0]["stage"] == "script" and runs[0]["status"] == "running", runs[0])

    # 15. Lock the script (advances script->voice)
    r = requests.post(f"{BASE}/projects/{proj_id}/script/lock", headers=auth_header(admin_token))
    check("POST script/lock", r.status_code == 200, r.text)
    r = requests.get(f"{BASE}/projects/{proj_id}/workflow", headers=auth_header(admin_token))
    runs = {run["stage"]: run for run in r.json()}
    check("script stage done after lock", runs["script"]["status"] == "done", runs["script"])
    check("voice stage running after lock", runs["voice"]["status"] == "running", runs["voice"])

    # 16. Advance the pipeline
    for _ in range(3):
        requests.post(f"{BASE}/projects/{proj_id}/workflow/advance", headers=auth_header(admin_token))
    r = requests.get(f"{BASE}/projects/{proj_id}/workflow", headers=auth_header(admin_token))
    runs = {run["stage"]: run for run in r.json()}
    check("advanced: storyboard done", runs["storyboard"]["status"] == "done", runs["storyboard"])

    # 17. Global queue
    r = requests.get(f"{BASE}/workflow/queue", headers=auth_header(admin_token))
    check("GET /workflow/queue", r.status_code == 200 and isinstance(r.json(), list), r.text)

    # 18. Upload a media file
    fake_audio = b"ID3\x04\x00fake-audio-bytes-for-smoke-test" * 100
    r = requests.post(f"{BASE}/projects/{proj_id}/media", headers=auth_header(admin_token),
                      data={"kind": "audio"},
                      files={"file": ("narration.mp3", io.BytesIO(fake_audio), "audio/mpeg")})
    check("POST media upload", r.status_code == 201, r.text)
    media_id = r.json()["id"]
    check("media size_bytes > 0", r.json()["size_bytes"] > 0, r.json())

    # 19. List media
    r = requests.get(f"{BASE}/projects/{proj_id}/media", headers=auth_header(admin_token))
    check("GET media list", r.status_code == 200 and len(r.json()) >= 1, r.text)

    # 20. Download media
    r = requests.get(f"{BASE}/media/{media_id}", headers=auth_header(admin_token))
    check("GET /media/{id} download", r.status_code == 200 and len(r.content) > 0, f"status {r.status_code}")

    # 21. Delete media
    r = requests.delete(f"{BASE}/media/{media_id}", headers=auth_header(admin_token))
    check("DELETE /media/{id}", r.status_code == 200, r.text)

    # 22. Approve + publish
    requests.patch(f"{BASE}/projects/{proj_id}", headers=auth_header(admin_token), json={"status": "approved"})
    r = requests.post(f"{BASE}/projects/{proj_id}/publish", headers=auth_header(admin_token))
    check("POST publish", r.status_code == 200, r.text)
    r = requests.get(f"{BASE}/projects/{proj_id}", headers=auth_header(admin_token))
    check("project status -> published", r.json()["status"] == "published", r.json())

    # 23. Logs (admin)
    r = requests.get(f"{BASE}/logs/activity", headers=auth_header(admin_token))
    check("GET /logs/activity (admin)", r.status_code == 200 and len(r.json()) > 0, f"{len(r.json())} entries")
    r = requests.get(f"{BASE}/logs/errors", headers=auth_header(admin_token))
    check("GET /logs/errors (admin)", r.status_code == 200 and len(r.json()) >= 1, r.text)

    # 24. Authorization: producer cannot read admin's project (403)
    r = requests.get(f"{BASE}/projects/{proj_id}", headers=auth_header(smoke_token))
    check("producer reads admin's project -> 403", r.status_code == 403, f"got {r.status_code}")

    # 25. Authorization: producer cannot hit logs (403)
    r = requests.get(f"{BASE}/logs/activity", headers=auth_header(smoke_token))
    check("producer reads logs -> 403", r.status_code == 403, f"got {r.status_code}")

    # 26. Validation: bad format -> 422
    r = requests.post(f"{BASE}/projects", headers=auth_header(admin_token), json={
        "title": "Bad", "topic": "x", "niche": "Tech", "format": "4-3"})
    check("bad format -> 422", r.status_code == 422, r.text)

    # 27. Not found
    r = requests.get(f"{BASE}/projects/999999", headers=auth_header(admin_token))
    check("missing project -> 404", r.status_code == 404, r.text)

    # 28. Seed data integrity: the 6 seeded projects exist for admin
    r = requests.get(f"{BASE}/projects?status=published", headers=auth_header(admin_token))
    check("seeded published projects exist", r.status_code == 200 and len(r.json()) >= 2,
          f"got {len(r.json())}")


def main():
    proc = None
    try:
        print("Starting uvicorn…")
        proc = spawn_server()
        print("Server ready.\n")
        run_all()
    finally:
        if proc is not None:
            proc.terminate()
            try:
                proc.wait(timeout=5)
            except subprocess.TimeoutExpired:
                proc.kill()
            print("\n(server stopped)")
    print("\n" + "=" * 52)
    print(f"Results: {passed} passed, {failed} failed")
    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    main()
