"use server";

import { authActionClient } from "@/lib/safe-action";
import { z } from "zod";

// Action de test pour vérifier l'authentification
export const testAuth = authActionClient
  .schema(z.object({}))
  .action(async ({ ctx }) => {
    console.log("🧪 Action testAuth appelée");
    console.log("Context reçu:", {
      userId: ctx.userId,
      userRole: ctx.userRole,
      hasUser: !!ctx.user,
    });

    return {
      success: true,
      userId: ctx.userId,
      userRole: ctx.userRole,
      hasUser: !!ctx.user,
      message: "Authentification OK",
    };
  });
