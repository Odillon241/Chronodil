"use client";

import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MinimalTiptap } from "@/components/ui/minimal-tiptap-dynamic";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Edit2, Trash2, Send } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import {
  createTaskComment,
  getTaskComments,
  updateTaskComment,
  deleteTaskComment,
} from "@/actions/task-comment.actions";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface TaskCommentsProps {
  taskId: string;
  currentUserId: string;
}

export function TaskComments({ taskId, currentUserId }: TaskCommentsProps) {
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    loadComments();
  }, [taskId]);

  const loadComments = async () => {
    try {
      const result = await getTaskComments({ taskId });
      if (result?.data) {
        setComments(result.data);
      }
    } catch (error) {
      console.error("Erreur chargement commentaires:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setIsLoading(true);
    try {
      const result = await createTaskComment({
        taskId,
        content: newComment.trim(),
      });

      if (result?.data) {
        toast.success("Commentaire ajouté");
        setNewComment("");
        loadComments();
      } else {
        toast.error(result?.serverError || "Erreur lors de l'ajout");
      }
    } catch (error) {
      toast.error("Erreur lors de l'ajout du commentaire");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (comment: any) => {
    setEditingId(comment.id);
    setEditContent(comment.content);
  };

  const handleSaveEdit = async (commentId: string) => {
    if (!editContent.trim()) return;

    try {
      const result = await updateTaskComment({
        id: commentId,
        content: editContent.trim(),
      });

      if (result?.data) {
        toast.success("Commentaire modifié");
        setEditingId(null);
        setEditContent("");
        loadComments();
      } else {
        toast.error(result?.serverError || "Erreur");
      }
    } catch (error) {
      toast.error("Erreur lors de la modification");
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditContent("");
  };

  const handleDelete = async (commentId: string) => {
    try {
      const result = await deleteTaskComment({ id: commentId });

      if (result?.data) {
        toast.success("Commentaire supprimé");
        setDeleteId(null);
        loadComments();
      } else {
        toast.error(result?.serverError || "Erreur");
      }
    } catch (error) {
      toast.error("Erreur lors de la suppression");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <MessageSquare className="h-5 w-5 text-muted-foreground" />
        <h3 className="font-semibold">
          Commentaires {comments.length > 0 && `(${comments.length})`}
        </h3>
      </div>

      {/* Liste des commentaires */}
      <ScrollArea className="h-[400px] pr-4">
        {comments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <MessageSquare className="h-12 w-12 text-muted-foreground mb-3 opacity-50" />
            <p className="text-muted-foreground text-sm">
              Aucun commentaire pour le moment
            </p>
            <p className="text-muted-foreground text-xs mt-1">
              Soyez le premier à commenter cette tâche
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {comments.map((comment) => (
              <div
                key={comment.id}
                className="flex gap-3 p-3 rounded-lg hover:bg-muted/30 transition-colors"
              >
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarImage src={comment.User.avatar || undefined} />
                  <AvatarFallback className="text-xs">
                    {comment.User.name
                      .split(" ")
                      .map((n: string) => n[0])
                      .join("")
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">
                      {comment.User.name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(comment.createdAt), {
                        locale: fr,
                        addSuffix: true,
                      })}
                    </span>
                    {comment.isEdited && (
                      <Badge variant="outline" className="text-xs">
                        Modifié
                      </Badge>
                    )}
                  </div>

                  {editingId === comment.id ? (
                    <div className="space-y-2">
                      <MinimalTiptap
                        content={editContent}
                        onChange={(content) => setEditContent(content)}
                        placeholder="Modifier votre commentaire..."
                        className="text-sm min-h-[200px]"
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleSaveEdit(comment.id)}
                          disabled={!editContent.trim()}
                        >
                          Enregistrer
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleCancelEdit}
                        >
                          Annuler
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div
                        className="text-sm text-foreground break-words prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{ __html: comment.content }}
                      />

                      {comment.User.id === currentUserId && (
                        <div className="flex gap-2 mt-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => handleEdit(comment)}
                          >
                            <Edit2 className="h-3 w-3 mr-1" />
                            Modifier
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs text-destructive hover:text-destructive"
                            onClick={() => setDeleteId(comment.id)}
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            Supprimer
                          </Button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Formulaire nouveau commentaire */}
      <form onSubmit={handleSubmit} className="space-y-3 pt-4 border-t">
        <MinimalTiptap
          content={newComment}
          onChange={(content) => setNewComment(content)}
          placeholder="Ajouter un commentaire..."
          className="min-h-[200px]"
          editable={!isLoading}
        />
        <div className="flex justify-between items-center">
          <span className="text-xs text-muted-foreground">
            {newComment.length}/1000 caractères
          </span>
          <Button type="submit" disabled={!newComment.trim() || isLoading}>
            {isLoading ? (
              <span className="flex items-center gap-2">
                <Spinner />
                Envoi...
              </span>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Commenter
              </>
            )}
          </Button>
        </div>
      </form>

      {/* Dialog de confirmation de suppression */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer le commentaire ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Le commentaire sera définitivement supprimé.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && handleDelete(deleteId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

