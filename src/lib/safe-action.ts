import { createSafeActionClient } from "next-safe-action";
import { auth } from "./auth";
import { headers } from "next/headers";

export const actionClient = createSafeActionClient({
  handleServerError: (error) => {
    // Retourner le message d'erreur original pour qu'il soit visible par l'utilisateur
    if (error instanceof Error) {
      return error.message;
    }
    return "Une erreur est survenue";
  },
});

export const authActionClient = actionClient.use(async ({ next }) => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Unauthorized");
  }

  return next({
    ctx: {
      userId: session.user.id,
      userRole: session.user.role as string,
      user: session.user,
    },
  });
});
