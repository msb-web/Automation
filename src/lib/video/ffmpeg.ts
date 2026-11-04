import { execFile } from "child_process";
import { promisify } from "util";

const execFileP = promisify(execFile);

/** Run ffmpeg with -y (overwrite) and quiet logging. Throws with the tail of stderr on failure. */
export async function runFF(args: string[], label?: string): Promise<void> {
  try {
    await execFileP("ffmpeg", ["-y", "-hide_banner", "-loglevel", "error", ...args], {
      maxBuffer: 20 * 1024 * 1024,
    });
  } catch (e) {
    const err = e as { stderr?: string; message?: string };
    throw new Error(
      `ffmpeg ${label || "step"} failed: ${(err.stderr || err.message || "").slice(-600)}`
    );
  }
}

export async function runFFprobe(args: string[]): Promise<string> {
  try {
    const r = await execFileP("ffprobe", args, { maxBuffer: 5 * 1024 * 1024 });
    return r.stdout.trim();
  } catch {
    return "";
  }
}

/** Duration of a media file in seconds (0 if unreadable). */
export async function durationSec(file: string): Promise<number> {
  const s = await runFFprobe([
    "-v", "error", "-show_entries", "format=duration",
    "-of", "default=noprint_wrappers=1:nokey=1", file,
  ]);
  return parseFloat(s) || 0;
}
