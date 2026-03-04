import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSupabaseServer, hasSupabaseConfig } from "@/lib/supabase-server";

export type AppUserRow = {
  id: string;
  forge_sub: string;
  email: string | null;
  name: string | null;
  role: "admin" | "user";
  created_at: string;
};

/**
 * Récupère la session NextAuth et l'utilisateur autorisé (app_users) si configuré.
 * Si Supabase n'est pas configuré ou que la table app_users n'existe pas encore,
 * tout utilisateur connecté est accepté (fallback pour dev).
 */
export async function getSessionAndUser(): Promise<{
  session: { user: { id?: string; name?: string | null; email?: string | null }; forgeSub?: string } | null;
  appUser: AppUserRow | null;
  allowed: boolean;
}> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { session: null, appUser: null, allowed: false };
  }
  const forgeSub = (session.user as { forgeSub?: string }).forgeSub ?? session.user.id;
  if (!hasSupabaseConfig()) {
    return { session: session as { user: { id?: string; name?: string | null; email?: string | null }; forgeSub?: string }, appUser: null, allowed: true };
  }
  try {
    const supabase = getSupabaseServer();
    const { data: appUser, error } = await supabase
      .from("app_users")
      .select("id, forge_sub, email, name, role, created_at")
      .eq("forge_sub", forgeSub)
      .single();
    if (error || !appUser) {
      return { session: session as { user: { id?: string; name?: string | null; email?: string | null }; forgeSub?: string }, appUser: null, allowed: false };
    }
    return {
      session: session as { user: { id?: string; name?: string | null; email?: string | null }; forgeSub?: string },
      appUser: appUser as AppUserRow,
      allowed: true,
    };
  } catch {
    return { session: session as { user: { id?: string; name?: string | null; email?: string | null }; forgeSub?: string }, appUser: null, allowed: false };
  }
}
