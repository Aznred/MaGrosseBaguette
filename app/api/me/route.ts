import { NextResponse } from "next/server";
import { getSessionAndUser } from "@/lib/auth-server";

export async function GET() {
  const { session, appUser, allowed } = await getSessionAndUser();
  if (!session) {
    return NextResponse.json({ allowed: false, user: null, forgeSub: null }, { status: 401 });
  }
  const forgeSub = (session.user as { forgeSub?: string }).forgeSub ?? (session.user as { id?: string }).id;
  return NextResponse.json({
    allowed,
    user: appUser ?? { role: "user" },
    session: { user: session.user },
    forgeSub: forgeSub ?? null,
  });
}
