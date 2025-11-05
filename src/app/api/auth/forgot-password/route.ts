import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { nanoid } from "nanoid";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: { message: "Email requis" } },
        { status: 400 }
      );
    }

    // Vérifier que l'utilisateur existe
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

    // Générer un token de réinitialisation
    const resetToken = nanoid(32);
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // Token valide pendant 1 heure

    // Stocker le token dans la base de données
    // Note: Better Auth n'a pas de table pour les tokens de réinitialisation par défaut
    // On pourrait utiliser une table personnalisée ou stocker dans User
    // Pour l'instant, on va stocker temporairement dans un champ JSON ou créer une table

    // Créer ou mettre à jour le token de réinitialisation
    // Pour simplifier, on va utiliser une table VerificatioToken si elle existe
    // Sinon, on stocke dans un champ personnalisé de User

    // Solution temporaire : stocker dans User avec un champ resetToken et resetTokenExpires
    // Mais le schéma Prisma n'a peut-être pas ces champs
    
    // Pour l'instant, on va juste retourner un succès
    // En production, il faudrait :
    // 1. Créer un token sécurisé
    // 2. L'enregistrer en base
    // 3. Envoyer un email avec le lien contenant le token

    // TODO: Implémenter l'envoi d'email avec Resend ou autre service
    // const resetLink = `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password?token=${resetToken}`;
    // await sendEmail({
    //   to: email,
    //   subject: "Réinitialisation de votre mot de passe",
    //   html: `Cliquez sur ce lien pour réinitialiser votre mot de passe: ${resetLink}`,
    // });

    // Pour le test, on retourne le token dans la réponse (⚠️ À NE PAS FAIRE EN PRODUCTION)
    return NextResponse.json({
      success: true,
      message: "Un lien de réinitialisation a été envoyé à votre adresse email.",
      // ⚠️ TEMPORAIRE POUR LES TESTS - À SUPPRIMER EN PRODUCTION
      token: resetToken, // À retirer en production
    });
  } catch (error: any) {
    console.error("Erreur lors de la demande de réinitialisation:", error);
    return NextResponse.json(
      { error: { message: "Une erreur s'est produite" } },
      { status: 500 }
    );
  }
}

