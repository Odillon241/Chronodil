import { createSafeActionClient } from "next-safe-action";
import { getSession, getUserRole } from "./auth";

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
  const session = await getSession();
  const userRole = getUserRole(session);

  if (!session) {
    throw new Error("Unauthorized");
  }

  return next({
    ctx: {
      userId: session.user.id,
      userRole: userRole as string,
      user: session.user,
    },
  });
});
