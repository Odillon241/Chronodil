import { createSupabaseServerClient } from "@/lib/supabase-server";
import { prisma } from "@/lib/db";
import type { Role } from "@prisma/client";
import type { User as SupabaseUser } from "@supabase/supabase-js";

// Type pour la session utilisateur
export interface Session {
  user: {
    id: string;
    email: string;
    name: string;
    role: Role;
    image?: string | null;
    departmentId?: string | null;
    managerId?: string | null;
  };
}

/**
 * Récupère la session utilisateur depuis Supabase Auth
 * et enrichit avec les données Prisma
 */
export async function getSession(headers?: Headers): Promise<Session | null> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return null;
    }

    // Récupérer les informations supplémentaires depuis Prisma
    const prismaUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        image: true,
        departmentId: true,
        managerId: true,
      },
    });

    if (!prismaUser) {
      // L'utilisateur existe dans Supabase Auth mais pas dans Prisma
      // Créer l'utilisateur dans Prisma
      const newUser = await prisma.user.create({
        data: {
          id: user.id,
          email: user.email!,
          name: user.user_metadata?.name || user.email!.split("@")[0],
          role: "EMPLOYEE",
          emailVerified: user.email_confirmed_at !== null,
          updatedAt: new Date(),
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          image: true,
          departmentId: true,
          managerId: true,
        },
      });

      return {
        user: newUser,
      };
    }

    return {
      user: prismaUser,
    };
  } catch (error) {
    console.error("Erreur lors de la récupération de la session:", error);
    return null;
  }
}

/**
 * Récupère le rôle de l'utilisateur depuis la session
 */
export function getUserRole(session: Session | null): Role | undefined {
  return session?.user?.role;
}

/**
 * Vérifie si l'utilisateur est authentifié
 */
export async function isAuthenticated(): Promise<boolean> {
  const session = await getSession();
  return session !== null;
}

/**
 * Récupère l'utilisateur Supabase brut (sans enrichissement Prisma)
 */
export async function getSupabaseUser(): Promise<SupabaseUser | null> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return null;
    return user;
  } catch {
    return null;
  }
}

/**
 * Déconnexion de l'utilisateur
 */
export async function signOut(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
}
