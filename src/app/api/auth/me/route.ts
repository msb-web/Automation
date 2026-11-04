import { handle } from "@/lib/route";
import { requireUser, toUserOut } from "@/lib/auth";

export const GET = () =>
  handle(async () => {
    const user = await requireUser();
    return toUserOut(user);
  });
