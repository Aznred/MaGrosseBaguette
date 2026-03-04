import { withAuth } from "next-auth/middleware";
import { authOptions } from "@/lib/auth";

export default withAuth(authOptions);

export const config = {
  matcher: [
    "/",
    "/ingredients/:path*",
    "/generateur/:path*",
    "/planificateur/:path*",
    "/compta/:path*",
    "/access-denied",
  ],
};
