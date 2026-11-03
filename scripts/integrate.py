#!/usr/bin/env python3
"""Integrate the frontend dashboard with the FastAPI backend.

Replaces the two mock-data <script> blocks in the dashboard HTML with the
API-driven versions (integ_block1.js + integ_block2.js), and patches the
auth-screen body so the register form has element IDs + the API base is shown.
"""
import re
import sys
import shutil
from pathlib import Path

DASH = Path("/home/z/my-project/download/ai-video-automation-dashboard.html")
B1 = Path("/home/z/my-project/scripts/integ_block1.js")
B2 = Path("/home/z/my-project/scripts/integ_block2.js")
BACKUP = Path("/home/z/my-project/scripts/dashboard_pre_integration.html")

PATCHES = [
    # register form input IDs
    ('<input type="text" placeholder="Jane Doe" required />',
     '<input type="text" id="regName" placeholder="Jane Doe" required />'),
    ('<input type="email" placeholder="you@company.com" required />',
     '<input type="email" id="regEmail" placeholder="you@company.com" required />'),
    ('<input type="password" placeholder="Min 8 chars" required />',
     '<input type="password" id="regPass" placeholder="Min 8 chars" required />'),
    # default language select -> id + value codes
    ('''        <select>
          <option>English (US)</option><option>Bengali</option><option>Spanish</option><option>Hindi</option><option>Arabic</option>
        </select>''',
     '''        <select id="regLang">
          <option value="en-US">English (US)</option><option value="bn-BD">Bengali</option><option value="es-ES">Spanish</option><option value="hi-IN">Hindi</option><option value="ar-SA">Arabic</option>
        </select>'''),
    # demo note -> live backend hint + api base line
    ('<div class="demo-note">Demo mode — credentials are pre-filled. Click <b>Sign in</b> to explore the full dashboard.</div>',
     '<div class="demo-note">Live backend — credentials pre-filled: <b>admin@aivideo.io / demo1234</b>. Click <b>Sign in</b>.<br>API: <span id="apiBaseLine" style="font-family:var(--mono)">…</span></div>'),
]


def main():
    html = DASH.read_text(encoding="utf-8")
    if not BACKUP.exists():
        shutil.copy2(DASH, BACKUP)

    # 1) body patches
    for old, new in PATCHES:
        if old not in html:
            sys.exit(f"PATCH MISS — could not find:\n{old[:80]}")
        if html.count(old) > 1:
            sys.exit(f"PATCH AMBIGUOUS — matched {html.count(old)}x:\n{old[:80]}")
        html = html.replace(old, new)

    # 2) splice the two <script> blocks (in order) with the new JS
    block1, block2 = B1.read_text(encoding="utf-8"), B2.read_text(encoding="utf-8")
    if "</script>" in block1 or "</script>" in block2:
        sys.exit("Refusing: a replacement block contains the literal </script>.")

    matches = list(re.finditer(r"<script>(.*?)</script>", html, re.S))
    if len(matches) != 2:
        sys.exit(f"Expected exactly 2 <script> blocks, found {len(matches)}.")

    # Replace from the last match to the first so spans stay valid.
    out = html
    out = out[:matches[1].start()] + "<script>\n" + block2 + "\n</script>" + out[matches[1].end():]
    out = out[:matches[0].start()] + "<script>\n" + block1 + "\n</script>" + out[matches[0].end():]

    DASH.write_text(out, encoding="utf-8")
    print(f"Integrated. {DASH} now {len(out)} bytes "
          f"({len(re.findall(r'<script>', out))} script blocks).")
    print(f"Backup kept at {BACKUP}")


if __name__ == "__main__":
    main()
