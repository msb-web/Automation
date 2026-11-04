import { handle, parseBody } from "@/lib/route";
import { db } from "@/lib/db";
import { hashPassword, signToken, setSessionCookie, toUserOut } from "@/lib/auth";

export const POST = (req: Request) =>
  handle(async () => {
    const body = await parseBody<{
      email: string;
      password: string;
      name: string;
      role?: string;
      defaultLanguage?: string;
    }>(req);

    if (!body.email || !body.password || !body.name)
      return Response.json({ detail: "email, password and name are required" }, { status: 422 });
    if (body.password.length < 8)
      return Response.json({ detail: "Password must be at least 8 characters" }, { status: 422 });

    const existing = await db.user.findUnique({ where: { email: body.email } });
    if (existing)
      return Response.json({ detail: "Email already registered" }, { status: 409 });

    const role = ["admin", "producer", "editor"].includes(body.role || "")
      ? body.role!
      : "producer";
    const user = await db.user.create({
      data: {
        email: body.email,
        hashedPassword: hashPassword(body.password),
        name: body.name,
        role,
        defaultLanguage: body.defaultLanguage || "en-US",
      },
    });
    const token = await signToken(user);
    await setSessionCookie(token);
    return Response.json(
      { access_token: token, token_type: "bearer", user: toUserOut(user) },
      { status: 201 }
    );
  });
