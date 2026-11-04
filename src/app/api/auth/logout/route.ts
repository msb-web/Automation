import { handle } from "@/lib/route";
import { clearSessionCookie } from "@/lib/auth";

export const POST = () =>
  handle(async () => {
    await clearSessionCookie();
    return { message: "Logged out" };
  });
