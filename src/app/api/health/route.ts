import { NextResponse } from "next/server";

// Deploy liveness probe. This route intentionally imports NOTHING from the app
// (no database, no publish config) so that it cannot be crashed by a Prisma
// engine load failure, a missing DATABASE_URL, or any other module-init error.
// The platform's healthcheck tears down the container on any non-200 response,
// so this handler must return 200 whenever Next.js can execute it — which is
// exactly the condition that means "the server is up."
//
// Database health is diagnosed separately at /api/db-check after the deploy is
// live; it must not gate the deploy itself.
export const GET = async () => {
  return NextResponse.json(
    { status: "ok", time: new Date().toISOString() },
    { status: 200 }
  );
};
