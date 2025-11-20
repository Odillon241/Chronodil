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
    "http://localhost:3000", // Développement local
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
