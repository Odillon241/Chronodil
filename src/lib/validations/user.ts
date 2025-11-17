import { z } from "zod";

export const updateProfileSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères").max(100),
  email: z.string().email("Email invalide"),
  avatar: z.string().url("URL invalide").optional().or(z.literal("")),
  position: z.string().max(100, "Le poste ne doit pas dépasser 100 caractères").optional().or(z.literal("")),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
