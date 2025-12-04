import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest/client";
import {
  sendEmailNotification,
  sendTimesheetReminders,
} from "@/lib/inngest/functions";
// TODO: Implémenter les fonctions chat (module functions-chat manquant)
// import {
//   sendScheduledMessages,
//   sendMessageReminders,
// } from "@/lib/inngest/functions-chat";

// Créer le handler Inngest avec toutes les fonctions
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    sendEmailNotification,
    sendTimesheetReminders,
    // TODO: Ajouter les fonctions chat quand elles seront implémentées
    // sendScheduledMessages,
    // sendMessageReminders,
  ],
});
