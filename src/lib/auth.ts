import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "@/lib/db";
import { compare, hash } from "@node-rs/bcrypt";
import type { Role } from "@prisma/client";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    // Configure bcrypt for Supabase compatibility
    async password(password: string) {
      return {
        hash: await hash(password, 10),
        async verify(hash: string, password: string) {
          return await compare(password, hash);
        },
      };
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

// Extend the inferred session type to include the role field from Prisma
export type Session = typeof auth.$Infer.Session & {
  user: typeof auth.$Infer.Session['user'] & {
    role?: Role;
  };
};

// Helper function to get session with correct typing including role field
export async function getSession(headers: Headers): Promise<Session | null> {
  const session = await auth.api.getSession({ headers });
  return session as Session | null;
}
