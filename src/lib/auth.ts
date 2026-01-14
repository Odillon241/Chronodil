import { createSupabaseServerClient } from "@/lib/supabase-server";
import { prisma } from "@/lib/db";
import type { Role } from "../generated/prisma/enums";

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
export async function getSession(): Promise<Session | null> {
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
      // Créer l'utilisateur dans Prisma avec les données de Supabase Auth
      try {
        const newUser = await prisma.user.create({
          data: {
            id: user.id,
            email: user.email!,
            name: user.user_metadata?.name || user.email!.split("@")[0],
            role: (user.user_metadata?.role as Role) || "EMPLOYEE",
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

        console.log("[Auth] User created in Prisma from Supabase Auth:", user.email);

        return {
          user: newUser,
        };
      } catch (createError) {
        console.error("[Auth] Error creating user in Prisma:", createError);
        // Retourner une session minimale avec les données Supabase
        return {
          user: {
            id: user.id,
            email: user.email!,
            name: user.user_metadata?.name || user.email!.split("@")[0],
            role: "EMPLOYEE" as Role,
            image: null,
            departmentId: null,
            managerId: null,
          },
        };
      }
    }

    return {
      user: prismaUser,
    };
  } catch (error) {
    console.error("[Auth] Error getting session:", error);
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
export async function getSupabaseUser() {
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

/**
 * Vérifie si l'utilisateur a un rôle spécifique
 */
export function hasRole(session: Session | null, roles: Role[]): boolean {
  if (!session?.user?.role) return false;
  return roles.includes(session.user.role);
}

/**
 * Vérifie si l'utilisateur est admin
 */
export function isAdmin(session: Session | null): boolean {
  return hasRole(session, ["ADMIN"]);
}

/**
 * Vérifie si l'utilisateur est manager ou admin
 */
export function isManagerOrAdmin(session: Session | null): boolean {
  return hasRole(session, ["ADMIN", "MANAGER"]);
}
