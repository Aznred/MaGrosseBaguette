import type { NextAuthOptions } from "next-auth";

/**
 * Provider OIDC Forge EPITA (cri.epita.fr).
 * Pour la prod, demander un client à la Forge avec les redirect URIs :
 * - https://votre-domaine.com/api/auth/callback/forge-epita
 * - http://localhost:3000/api/auth/callback/forge-epita (dev)
 * @see https://docs.forge.epita.fr/services/forge-id/oidc/
 */
const ForgeEpitaProvider = {
  id: "forge-epita",
  name: "Forge EPITA",
  type: "oauth" as const,
  wellKnown: "https://cri.epita.fr/.well-known/openid-configuration",
  authorization: { params: { scope: "openid profile email" } },
  clientId: process.env.FORGE_EPITA_CLIENT_ID ?? "",
  clientSecret: process.env.FORGE_EPITA_CLIENT_SECRET ?? "",
  profile(profile: { sub?: string; name?: string; email?: string; preferred_username?: string }) {
    return {
      id: profile.sub ?? "",
      name: profile.name ?? profile.preferred_username ?? "Utilisateur",
      email: profile.email ?? undefined,
    };
  },
};

export const authOptions: NextAuthOptions = {
  providers: [ForgeEpitaProvider],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.forgeSub = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id?: string }).id = token.id as string;
        (session.user as { forgeSub?: string }).forgeSub = token.forgeSub as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  secret: process.env.NEXTAUTH_SECRET,
};

declare module "next-auth" {
  interface User {
    id?: string;
  }
  interface Session {
    user: User & { id?: string; forgeSub?: string };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    forgeSub?: string;
  }
}
