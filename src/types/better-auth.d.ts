import "better-auth/types";
import { Role } from "@prisma/client";

declare module "better-auth/types" {
  interface User {
    role: Role;
  }

  interface Session {
    user: User & {
      role: Role;
    };
  }
}
