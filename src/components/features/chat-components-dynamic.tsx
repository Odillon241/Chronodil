/**
 * Dynamic imports pour les composants Chat lourds
 * Réduit le bundle initial de ~100KB
 * Phase 1 - Optimisations Chat
 */

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * ChatAttachmentViewer (~50KB)
 * Utilisé uniquement quand on clique sur une pièce jointe
 */
export const ChatAttachmentViewerDynamic = dynamic(
  () =>
    import("@/components/features/chat-attachment-viewer").then(
      (mod) => mod.ChatAttachmentViewer
    ),
  {
    loading: () => (
      <div className="flex items-center justify-center h-64">
        <Skeleton className="h-full w-full" />
        <span className="ml-3 text-sm text-muted-foreground">
          Chargement de la visionneuse...
        </span>
      </div>
    ),
    ssr: false,
  }
);

/**
 * ChatThreadView (~30KB)
 * Utilisé uniquement quand on affiche un thread de réponses
 */
export const ChatThreadViewDynamic = dynamic(
  () =>
    import("@/components/features/chat-thread-view").then(
      (mod) => mod.ChatThreadView
    ),
  {
    loading: () => (
      <div className="flex items-center justify-center p-4">
        <Skeleton className="h-96 w-full" />
        <span className="ml-3 text-sm text-muted-foreground">
          Chargement du fil de discussion...
        </span>
      </div>
    ),
    ssr: false,
  }
);

/**
 * ChatCreateChannelDialog (~20KB)
 * Utilisé uniquement quand on clique sur "Créer un canal"
 */
export const ChatCreateChannelDialogDynamic = dynamic(
  () =>
    import("@/components/features/chat-create-channel-dialog").then(
      (mod) => mod.ChatCreateChannelDialog
    ),
  {
    loading: () => (
      <div className="flex items-center justify-center p-8">
        <Skeleton className="h-64 w-full" />
      </div>
    ),
    ssr: false,
  }
);

/**
 * ChatManageMembersDialog (~15KB)
 * Utilisé uniquement quand on gère les membres d'un canal
 */
export const ChatManageMembersDialogDynamic = dynamic(
  () =>
    import("@/components/features/chat-manage-members-dialog").then(
      (mod) => mod.ChatManageMembersDialog
    ),
  {
    loading: () => (
      <div className="flex items-center justify-center p-8">
        <Skeleton className="h-64 w-full" />
      </div>
    ),
    ssr: false,
  }
);
