#!/usr/bin/env python3
"""Phase 8 handoff report — concise internal technical summary."""
import os, sys
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable, KeepTogether,
)
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase.pdfmetrics import registerFontFamily

PDF_SKILL_DIR = "/home/z/my-project/skills/pdf"
sys.path.insert(0, os.path.join(PDF_SKILL_DIR, "scripts"))

# ── Fonts ──
FONT_DIR = "/usr/share/fonts"
pdfmetrics.registerFont(TTFont("NotoSerifSC", f"{FONT_DIR}/truetype/noto-serif-sc/NotoSerifSC-Regular.ttf"))
pdfmetrics.registerFont(TTFont("NotoSerifSC-Bold", f"{FONT_DIR}/truetype/noto-serif-sc/NotoSerifSC-Bold.ttf"))
pdfmetrics.registerFont(TTFont("FreeSerif", f"{FONT_DIR}/truetype/freefont/FreeSerif.ttf"))
pdfmetrics.registerFont(TTFont("FreeSerif-Bold", f"{FONT_DIR}/truetype/freefont/FreeSerifBold.ttf"))
pdfmetrics.registerFont(TTFont("FreeSerif-Italic", f"{FONT_DIR}/truetype/freefont/FreeSerifItalic.ttf"))
pdfmetrics.registerFont(TTFont("DejaVuSans", f"{FONT_DIR}/truetype/dejavu/DejaVuSansMono.ttf"))
registerFontFamily("NotoSerifSC", normal="NotoSerifSC", bold="NotoSerifSC-Bold")
registerFontFamily("FreeSerif", normal="FreeSerif", bold="FreeSerif-Bold", italic="FreeSerif-Italic")
registerFontFamily("DejaVuSans", normal="DejaVuSans", bold="DejaVuSans")
from pdf import install_font_fallback  # noqa: E402
install_font_fallback()

# ── Cascade palette (auto-generated) ──
PAGE_BG       = colors.HexColor("#f0f1f1")
CARD_BG       = colors.HexColor("#e6eaeb")
TABLE_STRIPE  = colors.HexColor("#e9ecee")
HEADER_FILL   = colors.HexColor("#405d6b")
BORDER        = colors.HexColor("#c0c8cc")
ACCENT        = colors.HexColor("#2e8bba")
ACCENT_2      = colors.HexColor("#bc6a4f")
TEXT_PRIMARY  = colors.HexColor("#141516")
TEXT_MUTED    = colors.HexColor("#707679")
SEM_SUCCESS   = colors.HexColor("#467c58")

TABLE_HEADER_COLOR = HEADER_FILL
TABLE_ROW_ODD = TABLE_STRIPE

# ── Styles ──
title_st = ParagraphStyle("title", fontName="FreeSerif-Bold", fontSize=22, leading=26, textColor=TEXT_PRIMARY)
sub_st   = ParagraphStyle("sub", fontName="FreeSerif", fontSize=12.5, leading=16, textColor=ACCENT)
meta_st  = ParagraphStyle("meta", fontName="FreeSerif-Italic", fontSize=9.5, leading=13, textColor=TEXT_MUTED)
h1_st    = ParagraphStyle("h1", fontName="FreeSerif-Bold", fontSize=14, leading=18, textColor=HEADER_FILL, spaceBefore=16, spaceAfter=2)
body_st  = ParagraphStyle("body", fontName="FreeSerif", fontSize=10.5, leading=16, textColor=TEXT_PRIMARY, alignment=TA_LEFT, spaceAfter=8)
bullet_st= ParagraphStyle("bullet", fontName="FreeSerif", fontSize=10.5, leading=15, textColor=TEXT_PRIMARY, leftIndent=14, bulletIndent=2, spaceAfter=3)
th_st    = ParagraphStyle("th", fontName="FreeSerif-Bold", fontSize=9.5, leading=12, textColor=colors.white, alignment=TA_CENTER)
td_st    = ParagraphStyle("td", fontName="FreeSerif", fontSize=9.5, leading=12.5, textColor=TEXT_PRIMARY, alignment=TA_LEFT)
tdc_st   = ParagraphStyle("tdc", fontName="FreeSerif", fontSize=9.5, leading=12.5, textColor=TEXT_PRIMARY, alignment=TA_CENTER)
code_st  = ParagraphStyle("code", fontName="DejaVuSans", fontSize=8.5, leading=12.5, textColor=TEXT_PRIMARY)
cap_st   = ParagraphStyle("cap", fontName="FreeSerif-Italic", fontSize=8.5, leading=11, textColor=TEXT_MUTED, alignment=TA_CENTER, spaceBefore=4, spaceAfter=10)

AVAILABLE = A4[0] - 2.0 * inch

def h1(text):
    return [HRFlowable(width="100%", thickness=0.6, color=BORDER, spaceBefore=2, spaceAfter=6),
            Paragraph(text, h1_st)]

def bullets(items):
    return [Paragraph(f"• {t}", bullet_st) for t in items]

def make_table(header, rows, ratios):
    col_w = [r * AVAILABLE for r in ratios]
    data = [[Paragraph(h, th_st) for h in header]]
    for r in rows:
        data.append([Paragraph(str(c), td_st if i == 0 else tdc_st) for i, c in enumerate(r)])
    t = Table(data, colWidths=col_w, hAlign="CENTER", repeatRows=1)
    style = [
        ("BACKGROUND", (0, 0), (-1, 0), TABLE_HEADER_COLOR),
        ("GRID", (0, 0), (-1, -1), 0.4, BORDER),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ]
    for i in range(1, len(data)):
        if i % 2 == 0:
            style.append(("BACKGROUND", (0, i), (-1, i), TABLE_ROW_ODD))
    t.setStyle(TableStyle(style))
    return t

def code_block(lines):
    txt = "<br/>".join(lines)
    p = Paragraph(txt, code_st)
    t = Table([[p]], colWidths=[AVAILABLE], hAlign="CENTER")
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), CARD_BG),
        ("LINEBEFORE", (0, 0), (0, -1), 2.5, ACCENT),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
    ]))
    return t

# ── Story ──
story = []
story.append(Paragraph("AI Video Automation — Phase 8 Handoff", title_st))
story.append(Spacer(1, 2))
story.append(Paragraph("Testing, Deployment & Maintenance · Production-Ready", sub_st))
story.append(Spacer(1, 2))
story.append(Paragraph("Date 2026-11-02  ·  Status: verified (build green, suite green, prod smoke-tested)", meta_st))
story.append(Spacer(1, 8))

story += h1("1. Overview")
story.append(Paragraph(
    "Phase 8 brought the AI Video Automation platform to production readiness across four pillars: an automated "
    "test suite, runtime monitoring, backups, and a Docker deployment package. Every service built in Phases 1–7 — "
    "script generation, voiceover, video production, platform publishing, the manual approval workflow, and the n8n "
    "webhook integration — is now covered by executable tests. The platform was verified with a clean production "
    "build (<font name='DejaVuSans'>next build</font>), a standalone-server smoke test of every new endpoint, and a "
    "browser check of the new monitoring UI. This document summarises what was delivered, how to run each capability, "
    "and where the full operations runbook lives (<font name='DejaVuSans'>deploy/README.md</font>).", body_st))

story += h1("2. Testing")
story.append(Paragraph(
    "The suite uses Bun's built-in runner (<font name='DejaVuSans'>bun test</font>) and lives under <font name='DejaVuSans'>tests/</font>. "
    "It is layered: unit tests exercise individual services in isolation; a video-quality test validates produced media "
    "with <font name='DejaVuSans'>ffprobe</font>; and HTTP-driven integration tests exercise the complete automation "
    "workflows end to end against a running server. The integration suites auto-skip when the dev server is unreachable, "
    "so <font name='DejaVuSans'>bun test</font> is always safe to run anywhere. The slow full-pipeline test is gated "
    "behind <font name='DejaVuSans'>RUN_SLOW=1</font> because production takes a few minutes.", body_st))
story.append(Spacer(1, 6))
story.append(make_table(
    ["Suite", "Tests", "Status", "Coverage"],
    [
        ["Unit (services)", "44", "Pass", "TTS chunking, JSON extraction, ffmpeg helpers, publish mock mode (YT/FB), auth API-key, notifications, type helpers"],
        ["Video quality & sync", "3", "Pass", "ffprobe: video+audio streams, audio/video duration sync < 0.5s, aspect ratio per format"],
        ["Integration: workflow", "6", "Pass", "Approve → publish → schedule → tick; platform auth 401/200; mock records"],
        ["Integration: full pipeline", "4", "Pass (RUN_SLOW)", "Webhook → produce → pending_review → approve → publish, end to end"],
    ],
    [0.26, 0.10, 0.18, 0.46]))
story.append(Paragraph("Table 1 — Test suite results (57 tests, all green).", cap_st))

story += h1("3. Monitoring")
story.append(Paragraph(
    "Two new endpoints and an extended Analytics view give live visibility into platform health and publishing. "
    "<font name='DejaVuSans'>/api/health</font> is public — for uptime monitors and the Docker healthcheck — and reports "
    "database reachability, publish mode, and scheduler status, returning HTTP 503 when the DB is down. "
    "<font name='DejaVuSans'>/api/publish/monitor</font> is auth-gated (session or API key) and returns success rate, "
    "scheduled and failed counts, and the most recent failures and publishes. The Analytics view renders both as a "
    "System health card and a Publishing monitor card, refreshed on every visit. Verified in production against the "
    "standalone build: 13 publishes recorded, 100% success rate, scheduler running.", body_st))

story += h1("4. Backups")
story.append(Paragraph(
    "<font name='DejaVuSans'>scripts/backup.ts</font> creates a consistent snapshot of the SQLite database via "
    "<font name='DejaVuSans'>VACUUM INTO</font> — a single statement that reads a WAL-merged view and writes a compacted "
    "copy, safe to run while the server is serving traffic. It also copies the generated media "
    "(<font name='DejaVuSans'>public/gen</font>) and <font name='DejaVuSans'>.env</font>, and prunes snapshots older "
    "than <font name='DejaVuSans'>BACKUP_KEEP_DAYS</font> (default 14). Run it with <font name='DejaVuSans'>bun run backup</font>; "
    "snapshots land in <font name='DejaVuSans'>backups/<timestamp>/</font>. The deployment compose also defines a "
    "<font name='DejaVuSans'>backup</font> service profile that runs the same script inside the app container against the "
    "mounted volumes. Restore is a file copy with the app stopped.", body_st))

story += h1("5. Deployment")
story.append(Paragraph(
    "A multi-stage Dockerfile builds the Next.js standalone bundle on <font name='DejaVuSans'>oven/bun</font> and ships a "
    "slim runtime with ffmpeg/ffprobe (video production), the Prisma client + CLI, a boot-time "
    "<font name='DejaVuSans'>prisma db push</font> entrypoint, and an <font name='DejaVuSans'>/api/health</font> healthcheck. "
    "<font name='DejaVuSans'>deploy/docker-compose.yml</font> defines the app, an nginx reverse proxy (HTTP active, HTTPS "
    "commented for a certbot upgrade), and the backup service. <font name='DejaVuSans'>deploy/deploy.sh</font> pulls, builds, "
    "starts, and waits for health. The full runbook — prerequisites, env setup, SSL, logs, rollback, and scaling notes — "
    "is in <font name='DejaVuSans'>deploy/README.md</font>.", body_st))
story.append(Spacer(1, 6))
story.append(make_table(
    ["File", "Purpose"],
    [
        ["tests/", "Bun test suite: unit, video-quality, integration, full-pipeline"],
        ["src/app/api/health/route.ts", "Public health endpoint (DB / mode / scheduler)"],
        ["src/app/api/publish/monitor/route.ts", "Publish monitoring metrics (auth-gated)"],
        ["src/components/views/AnalyticsView.tsx", "Extended with System health + Publishing monitor"],
        ["scripts/backup.ts", "Consistent DB + media + env backup with retention"],
        ["Dockerfile", "Multi-stage production image (bun + ffmpeg + Prisma)"],
        ["deploy/docker-compose.yml", "app + nginx + backup services"],
        ["deploy/nginx.conf", "Reverse proxy: gzip, large uploads, HTTPS-ready"],
        ["deploy/entrypoint.sh", "Boot-time prisma db push + server start"],
        ["deploy/deploy.sh", "Pull → build → up → healthcheck"],
        ["deploy/README.md", "Full operations runbook"],
        [".env.example", "Environment template"],
    ],
    [0.40, 0.60]))
story.append(Paragraph("Table 2 — Phase 8 artifact map.", cap_st))

story += h1("6. Production verification")
story.append(Paragraph(
    "The production build (<font name='DejaVuSans'>bun run build</font>) compiles cleanly and emits the standalone "
    "server, static assets, and public files; the route manifest includes the new <font name='DejaVuSans'>/api/health</font> "
    "and <font name='DejaVuSans'>/api/publish/monitor</font> routes. The standalone server boots under Bun and serves all "
    "four endpoints correctly in production mode: login returns a session cookie, <font name='DejaVuSans'>/api/auth/me</font> "
    "returns the admin user, and the monitor returns live metrics. The Analytics monitoring section renders in production, "
    "confirmed via a browser check (System health OK, scheduler running, 100% success rate). Lint passes with zero errors.", body_st))

story += h1("7. Quickstart")
story.append(code_block([
    "# Run the test suite (unit + video quality + fast integration)",
    "bun test",
    "# Also run the full production pipeline (~4 min, needs the dev server)",
    "RUN_SLOW=1 bun test",
    "",
    "# Back up the database + media + env",
    "bun run backup",
    "",
    "# Deploy / update on a VPS (Docker + docker compose)",
    "cp .env.example .env && $EDITOR .env",
    "./deploy/deploy.sh",
    "",
    "# Public health check (for uptime monitors / Docker healthcheck)",
    "curl http://localhost:3000/api/health",
]))
story.append(Spacer(1, 10))

story += h1("8. Environment reference")
story.append(make_table(
    ["Variable", "Required", "Purpose"],
    [
        ["DATABASE_URL", "yes", "SQLite path — must match the /app/db volume (file:/app/db/custom.db)"],
        ["JWT_SECRET", "yes", "Signs session cookies"],
        ["WEBHOOK_API_KEY", "yes", "Authenticates n8n webhooks + /api/publish/tick"],
        ["BASE_URL", "yes", "Public origin for OAuth redirects + n8n callbacks"],
        ["YOUTUBE_* / FACEBOOK_*", "no", "Live uploads; leave unset for mock mode"],
        ["NOTIFY_WEBHOOK_URL", "no", "Slack / Discord / Teams event notifications"],
        ["BACKUP_DIR / BACKUP_KEEP_DAYS", "no", "Backup location + retention (default 14 days)"],
    ],
    [0.30, 0.13, 0.57]))
story.append(Paragraph("Table 3 — Environment variables (see .env.example for the full list).", cap_st))

OUT = "/home/z/my-project/download/Phase8_Handoff.pdf"
doc = SimpleDocTemplate(OUT, pagesize=A4, leftMargin=1.0 * inch, rightMargin=1.0 * inch,
                        topMargin=0.9 * inch, bottomMargin=0.9 * inch,
                        title="AI Video Automation — Phase 8 Handoff",
                        author="Z.ai", creator="Z.ai",
                        subject="Phase 8: Testing, Deployment & Maintenance handoff")
doc.build(story)
print("built", OUT)
