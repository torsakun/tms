import { NextResponse } from "next/server";

export function requireDevRouteSecret(req: Request) {
  if (
    process.env.NODE_ENV === "production" &&
    process.env.ALLOW_DEV_ROUTES !== "true"
  ) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const configuredSecret = process.env.DEV_ROUTE_SECRET;
  if (!configuredSecret) {
    return NextResponse.json(
      { error: "DEV_ROUTE_SECRET is not configured" },
      { status: 503 },
    );
  }

  const { searchParams } = new URL(req.url);
  const providedSecret =
    searchParams.get("secret") ||
    searchParams.get("key") ||
    req.headers.get("x-dev-route-secret");

  if (providedSecret !== configuredSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return null;
}

export function getDevAdminCredentials() {
  const email = process.env.DEV_ADMIN_EMAIL;
  const password = process.env.DEV_ADMIN_PASSWORD;

  if (!email || !password) {
    return null;
  }

  return { email, password };
}
