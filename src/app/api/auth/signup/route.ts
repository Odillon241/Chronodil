import { NextResponse } from "next/server";
import { createSupabaseServerAdminClient } from "@/lib/supabase-admin";
import { prisma } from "@/lib/db";
import { z } from "zod";

const signupSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères"),
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validation des données
    const validation = signupSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: { message: validation.error.issues[0].message } },
        { status: 400 }
      );
    }

    const { email, password, name } = validation.data;

    // Vérifier si l'utilisateur existe déjà dans Prisma
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: { message: "Un compte existe déjà avec cet email" } },
        { status: 400 }
      );
    }

    // Créer l'utilisateur via Supabase Admin API (pré-confirmé, sans email)
    const supabaseAdmin = createSupabaseServerAdminClient();
    
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Pré-confirmer l'email (pas besoin de confirmation)
      user_metadata: {
        name,
        role: "EMPLOYEE",
      },
    });

    if (authError) {
      console.error("Erreur création utilisateur Supabase:", authError);
      
      // Gestion des erreurs spécifiques
      if (authError.message?.includes("already been registered")) {
        return NextResponse.json(
          { error: { message: "Un compte existe déjà avec cet email" } },
          { status: 400 }
        );
      }
      
      return NextResponse.json(
        { error: { message: authError.message || "Erreur lors de l'inscription" } },
        { status: 500 }
      );
    }

    if (!authUser.user) {
      return NextResponse.json(
        { error: { message: "Erreur lors de la création de l'utilisateur" } },
        { status: 500 }
      );
    }

    // Créer l'utilisateur dans la table public.User (Prisma)
    try {
      await prisma.user.create({
        data: {
          id: authUser.user.id,
          email: authUser.user.email!,
          name,
          role: "EMPLOYEE",
          emailVerified: true,
          updatedAt: new Date(),
        },
      });
      console.log("✅ Utilisateur créé dans public.User:", authUser.user.email);
    } catch (prismaError) {
      console.error("Erreur création utilisateur Prisma:", prismaError);
      // Ne pas échouer si l'utilisateur Prisma existe déjà (sera créé à la prochaine connexion)
    }

    console.log("✅ Inscription réussie:", email);

    return NextResponse.json({
      success: true,
      user: {
        id: authUser.user.id,
        email: authUser.user.email,
        name,
      },
      message: "Inscription réussie ! Vous pouvez maintenant vous connecter.",
    });

  } catch (error: any) {
    console.error("Erreur inscription:", error);
    return NextResponse.json(
      { error: { message: "Une erreur s'est produite lors de l'inscription" } },
      { status: 500 }
    );
  }
}
