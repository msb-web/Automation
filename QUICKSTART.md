# Quickstart — Run Locally

## What this app is

A **Next.js** app (Node.js/Bun runtime) with a **SQLite** file database. It is
**not** a PHP/MySQL app, so **XAMPP is not used and not needed** — no Apache,
no MariaDB, no PHP. The database is a single file that the app creates itself
on first run.

## Prerequisites

- **Node.js 20 LTS or newer** — download from <https://nodejs.org> (this also
  gives you `npm`). The `LTS` (Long Term Support) version is recommended.
  - On Windows: run the installer and tick "Add to PATH".
  - Verify in a terminal: `node -v` should print `v20.x` or higher.

That's the only prerequisite. (You can alternatively use **Bun** from
<https://bun.sh>; commands are given for npm below, with `bun` equivalents.)

## Steps

1. **Unzip** `ai-video-platform-local.zip` into a folder, e.g.
   `ai-video-platform`.

2. **Open a terminal** in that folder.
   - Windows: in File Explorer, shift+right-click the folder → "Open PowerShell
     window here" (or "Open in Terminal").
   - macOS/Linux: `cd /path/to/ai-video-platform`

3. **Install dependencies** (first run only; downloads ~400MB, takes a few
   minutes):
   ```
   npm install
   ```
   (Bun alternative: `bun install`)

4. **Start the dev server**:
   ```
   npm run dev
   ```
   (Bun: `bun run dev`)
   You should see something like `✓ Ready on http://localhost:3000`.

5. **Create the database + demo users** — in your browser, open:
   ```
   http://localhost:3000/api/seed
   ```
   You should see: `{"message":"Database seeded","seeded":true}`.
   This single visit creates the SQLite file, all tables, the admin/producer
   accounts, and demo projects. (If you see `"Already seeded"`, it's already
   set up — that's fine.)

6. **Open the app**:
   ```
   http://localhost:3000
   ```
   The login screen appears.

7. **Log in** with either account:
   | Role     | Email                  | Password       |
   | -------- | ---------------------- | -------------- |
   | Admin    | `admin@aivideo.io`     | `demo1234`     |
   | Producer | `producer@aivideo.io`  | `producer1234` |

That's it — explore the dashboard, create a project, view the queue and
approvals.

## What works locally without extra setup

Login, dashboard, project creation, the script editor, the production queue,
approvals, analytics, and settings — all work with no configuration beyond the
steps above.

## AI generation features (optional)

Script writing, image generation, text-to-speech, and video generation use the
`z-ai-web-dev-sdk`. Inside the z.ai sandbox this works automatically; on your
local machine these features may require a **ZAI API key** (set as
`ZAI_API_KEY` in a `.env` file in the project root) or a local
[Ollama](https://ollama.com) instance (`OLLAMA_URL=http://localhost:11434`).
If neither is present, AI generation calls return an error, but the rest of the
app is unaffected.

Publishing to YouTube/Facebook (optional) needs `YOUTUBE_REFRESH_TOKEN` /
`FACEBOOK_PAGE_ACCESS_TOKEN` — leave these unset to use the mock publish mode.

## Resetting the database

Delete the database file and re-seed:
```
rm db/custom.db        # Windows: del db\custom.db
```
Then visit `http://localhost:3000/api/seed` again.

## Troubleshooting

- **"Port 3000 is in use"** — another server (maybe XAMPP) is using port 3000.
  Use a different port: `npm run dev -- -p 3001`, then open
  `http://localhost:3001/api/seed`.
- **Login fails / "no users"** — you skipped step 5. Visit `/api/seed` first.
- **Prisma / database errors** — run `npm run db:push` to recreate the schema,
  then retry.
- **Blank page / console errors** — make sure `npm install` finished
  completely before `npm run dev`.
