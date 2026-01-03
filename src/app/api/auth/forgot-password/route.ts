import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: { message: "Email requis" } },
        { status: 400 }
      );
    }

    // Vérifier que l'utilisateur existe dans Prisma
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          error: {
            message: "Aucun compte n'est associé à cet email. Veuillez vérifier votre adresse email.",
          },
        },
        { status: 404 }
      );
    }

    // Utiliser Supabase Auth pour envoyer le lien de réinitialisation
    const supabase = await createSupabaseServerClient();
    
    const redirectUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/auth/reset-password`;
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    });

    if (error) {
      console.error("Erreur Supabase Auth:", error);
      return NextResponse.json(
        { error: { message: "Erreur lors de l'envoi de l'email de réinitialisation" } },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Un lien de réinitialisation a été envoyé à votre adresse email.",
    });
  } catch (error: any) {
    console.error("Erreur lors de la demande de réinitialisation:", error);
    return NextResponse.json(
      { error: { message: "Une erreur s'est produite" } },
      { status: 500 }
    );
  }
}

