import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "@/lib/db";
import { compare, hash } from "@node-rs/bcrypt";
import type { Role } from "@prisma/client";
import { sendEmail, getResetPasswordEmailTemplate } from "@/lib/email";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    sendResetPassword: async ({ user, url, token }, request) => {
      console.log(`📧 Envoi d'email de réinitialisation à ${user.email}`);

      await sendEmail({
        to: user.email,
        subject: "Réinitialisation de votre mot de passe Chronodil",
        html: getResetPasswordEmailTemplate(url, user.name),
      });

      console.log(`✅ Email de réinitialisation envoyé à ${user.email}`);
    },
    resetPasswordTokenExpiresIn: 3600, // 1 heure
    password: {
      hash: async (password: string) => hash(password, 10),
      verify: async (data: { hash: string; password: string }) => compare(data.password, data.hash),
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "EMPLOYEE",
      },
    },
  },
  trustedOrigins: [
    process.env.BETTER_AUTH_URL || "http://localhost:3000",
  ],
});

export type Session = typeof auth.$Infer.Session & {
  user: typeof auth.$Infer.Session['user'] & {
    role?: Role;
  };
};

export async function getSession(headers: Headers): Promise<Session | null> {
  const session = await auth.api.getSession({ headers });
  return session as Session | null;
}

export function getUserRole(session: any): Role | undefined {
  return session?.user?.role as Role | undefined;
}
