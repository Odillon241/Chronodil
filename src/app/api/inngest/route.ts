import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest/client";
import { inngestFunctions } from "@/lib/inngest/functions";

// Create an API that serves zero or more Inngest functions
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: inngestFunctions,
});
