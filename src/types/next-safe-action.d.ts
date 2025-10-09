import "next-safe-action";

declare module "next-safe-action" {
  interface ActionContext {
    userId: string;
    userRole: string;
  }
}
