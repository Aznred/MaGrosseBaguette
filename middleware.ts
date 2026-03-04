import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: { signIn: "/login" },
});

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
