import { db, ensureSchema } from "@/lib/db";
import { hashPassword } from "@/lib/auth";

/* Mirror of app/seed.py — demo data for the live dashboard.
   Idempotent: skips seeding if any user already exists. */

export const WORKFLOW_STAGES = [
  "script",
  "voice",
  "storyboard",
  "render",
  "review",
  "publish",
] as const;

const ADMIN_EMAIL = "admin@aivideo.io";
const ADMIN_PASSWORD = "demo1234";
const PRODUCER_EMAIL = "producer@aivideo.io";
const PRODUCER_PASSWORD = "producer1234";

type SampleProject = {
  title: string;
  topic: string;
  niche: string;
  format: string;
  voice: string;
  language?: string;
  status: string;
  keywords: string;
  platforms: string;
  script: string;
};

const SAMPLE_PROJECTS: SampleProject[] = [
  {
    title: "5 AI Tools That Replace a Marketing Team",
    topic: "AI tools that automate copywriting, design, and ads",
    niche: "Technology", format: "16-9", voice: "en-us-female", status: "published",
    keywords: "#ai #automation #marketing", platforms: "youtube,facebook",
    script: "[HOOK]\nRunning a marketing team used to take five people. These five AI tools do it for one.\n\n[BODY]\nCopywriting, design, ad buying, analytics, and scheduling — each now has an AI that handles 80% of the work in minutes. The trick is knowing which tool fits which job.\n\n[CTA]\nFollow for the full stack breakdown tomorrow.",
  },
  {
    title: "Why Compound Interest Will Make You Rich by 40",
    topic: "Compound interest and starting early",
    niche: "Finance", format: "9-16", voice: "en-us-male", status: "pending_review",
    keywords: "#finance #investing", platforms: "facebook",
    script: "[HOOK]\nA 22-year-old who saves $200 a month beats a 35-year-old who saves $1,000. Here's why.\n\n[BODY]\nCompound interest earns interest on your interest. Start early and the math snowballs — your money doubles, then doubles again, without you adding skill.\n\n[CTA]\nSave this before you scroll.",
  },
  {
    title: "The 10-Minute Morning Routine for Deep Focus",
    topic: "A short morning routine for focus",
    niche: "Health", format: "1-1", voice: "en-us-female", status: "approved",
    keywords: "#health #productivity", platforms: "youtube",
    script: "[HOOK]\nTen minutes each morning can buy you four hours of deep focus.\n\n[BODY]\nLight, water, movement, and one written intention. That sequence resets your nervous system and primes attention better than any app.\n\n[CTA]\nTry it tomorrow and tell me how it felt.",
  },
  {
    title: "How Transformer Models Actually Work (ELI12)",
    topic: "Transformers, attention, explained simply",
    niche: "Education", format: "16-9", voice: "en-us-male", status: "generating",
    keywords: "#ai #education #ml", platforms: "youtube",
    script: "[HOOK]\nMost people use AI every single day without realizing there's one breakthrough that made all of it possible.\n\n[BODY]\nIt's called the Transformer. Before 2017, AI struggled to understand even a short paragraph. Transformers changed that by letting the model look at every word at once and figure out which ones matter most.\nThat single idea powers chatbots, search, translation, and the video you're watching right now.\nThe trick is something called attention — the model pays attention to the relationships between words, not just the words themselves.\n\n[CTA]\nIf this made transformers click, hit subscribe — next week we break down how they're trained.",
  },
  {
    title: "3 Underrated CSS Tricks for 2026",
    topic: "Modern CSS features worth using",
    niche: "Technology", format: "9-16", voice: "en-us-female", status: "published",
    keywords: "#css #webdev", platforms: "youtube",
    script: "[HOOK]\nThree CSS features that feel illegal to use for free.\n\n[BODY]\nContainer queries, :has(), and color-mix(). Each one replaces a chunk of JavaScript you used to need. Your CSS gets shorter and your layouts get smarter.\n\n[CTA]\nWhich one surprised you?",
  },
  {
    title: "Budgeting on an Irregular Income — Full Guide",
    topic: "Budgeting with freelance/variable income",
    niche: "Finance", format: "16-9", voice: "bn-female", language: "bn-BD", status: "rejected",
    keywords: "#finance #budgeting", platforms: "",
    script: "[HOOK]\nFreelance income is unpredictable — your budget shouldn't be.\n\n[BODY]\nBuild a baseline budget on your worst month. Everything above that baseline gets split: taxes, buffer, then reward. This way slow months don't break you and good months compound.\n\n[CTA]\nSave this for your next payout.",
  },
];

const STAGE_INDEX: Record<string, number> = {
  draft: 0,
  generating: 3,
  pending_review: 5,
  approved: 5,
  published: 6,
  rejected: 3,
};

const WORDS_PER_MINUTE = 150;
export function computeMetrics(content: string, narrationSpeed: number) {
  const body = content.replace(/\[[^\]]+\]/g, "");
  const wc = body.split(/\s+/).filter(Boolean).length;
  const minutes = wc / WORDS_PER_MINUTE / Math.max(narrationSpeed, 0.1);
  return { wordCount: wc, estimatedDurationSec: Math.round(minutes * 60) };
}

async function buildWorkflow(projectId: number, status: string) {
  const cutoff = STAGE_INDEX[status] ?? 0;
  const now = new Date();
  const twoHoursAgo = new Date(now.getTime() - 2 * 3600_000);
  const tenMinAgo = new Date(now.getTime() - 10 * 60_000);
  const doneFinished = new Date(twoHoursAgo.getTime() + 8 * 60_000);
  // Matches FastAPI seed: only generating/pending_review have a running stage
  // at the cutoff; approved leaves publish pending; published => all done.
  const runningStatus = status === "generating" || status === "pending_review";
  for (let i = 0; i < WORKFLOW_STAGES.length; i++) {
    const stage = WORKFLOW_STAGES[i];
    const data =
      i < cutoff
        ? { projectId, stage, status: "done", progress: 100, startedAt: twoHoursAgo, finishedAt: doneFinished }
        : i === cutoff && runningStatus
          ? { projectId, stage, status: "running", progress: 45, startedAt: tenMinAgo, finishedAt: null }
          : { projectId, stage, status: "pending", progress: 0, startedAt: null, finishedAt: null };
    await db.workflowRun.create({ data });
  }
}

/** Seed the database if empty. Returns true if it just seeded. */
export async function ensureSeed(): Promise<boolean> {
  // Ensure the schema exists first — a fresh local checkout (or a deploy that
  // bypassed `prisma db push`) has no tables, so the count below would throw.
  await ensureSchema();
  if ((await db.user.count()) > 0) return false;

  const admin = await db.user.create({
    data: {
      email: ADMIN_EMAIL,
      hashedPassword: hashPassword(ADMIN_PASSWORD),
      name: "Alex Rivera",
      role: "admin",
      defaultLanguage: "en-US",
    },
  });
  await db.user.create({
    data: {
      email: PRODUCER_EMAIL,
      hashedPassword: hashPassword(PRODUCER_PASSWORD),
      name: "Sam Carter",
      role: "producer",
      defaultLanguage: "en-US",
    },
  });

  for (const p of SAMPLE_PROJECTS) {
    const proj = await db.videoProject.create({
      data: {
        userId: admin.id,
        title: p.title,
        topic: p.topic,
        niche: p.niche,
        format: p.format,
        language: p.language ?? "en-US",
        voice: p.voice,
        status: p.status,
        keywords: p.keywords,
        platforms: p.platforms,
        approvalPolicy: "manual",
      },
    });
    const m = computeMetrics(p.script, 1.0);
    await db.script.create({
      data: { projectId: proj.id, content: p.script, ...m },
    });
    await buildWorkflow(proj.id, p.status);
  }
  return true;
}
