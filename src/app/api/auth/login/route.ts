import { handle, parseBody } from "@/lib/route";
import { db } from "@/lib/db";
import { verifyPassword, signToken, setSessionCookie, toUserOut } from "@/lib/auth";

export const POST = (req: Request) =>
  handle(async () => {
    const body = await parseBody<{ email: string; password: string }>(req);
    const user = await db.user.findUnique({ where: { email: body.email } });
    if (!user || !verifyPassword(body.password, user.hashedPassword))
      return Response.json({ detail: "Incorrect email or password" }, { status: 401 });
    if (!user.isActive)
      return Response.json({ detail: "Inactive user" }, { status: 400 });

    const token = await signToken(user);
    await setSessionCookie(token);
    return Response.json({ access_token: token, token_type: "bearer", user: toUserOut(user) });
  });
