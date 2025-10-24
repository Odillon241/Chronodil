import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

// Note: runtime et dynamic ont été supprimés pour compatibilité avec cacheComponents (PPR)
// Better Auth gère la dynamique en interne

export const { GET, POST } = toNextJsHandler(auth);
