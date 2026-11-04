/* In-process video production job registry. A render runs as a background
   promise (not awaited by the route) and updates its state here; the UI polls
   GET /produce/status. Single-user dev demo — a Map is sufficient. */

export type JobStage =
  | "prereq" | "images" | "music" | "clips" | "concat"
  | "audio" | "mux" | "short" | "done" | "failed";

export type Job = {
  id: string;
  projectId: number;
  stage: JobStage;
  progress: number; // 0-100
  status: "running" | "done" | "failed";
  log: string[];
  error?: string;
  longUrl?: string;
  shortUrl?: string;
  durationSec?: number;
  scenes?: number;
  startedAt: number;
  finishedAt?: number;
};

const jobs = new Map<string, Job>();

export function createJob(projectId: number): Job {
  const id = `vj_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const job: Job = {
    id, projectId, stage: "prereq", progress: 0, status: "running",
    log: [], startedAt: Date.now(),
  };
  jobs.set(id, job);
  return job;
}

export function getJob(id: string): Job | undefined {
  return jobs.get(id);
}

/** Latest job (any status) for a project, or undefined. */
export function latestJobFor(projectId: number): Job | undefined {
  let latest: Job | undefined;
  for (const j of jobs.values()) {
    if (j.projectId === projectId && (!latest || j.startedAt > latest.startedAt)) latest = j;
  }
  return latest;
}

export function updateJob(id: string, patch: Partial<Job>): void {
  const j = jobs.get(id);
  if (j) Object.assign(j, patch);
}

export function appendJobLog(id: string, msg: string): void {
  const j = jobs.get(id);
  if (j) j.log.push(msg);
}
