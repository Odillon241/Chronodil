"use client";

import { useMemo } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    CalendarDays,
    Hash,
    Lock,
    Mail,
    Shield,
    User,
    Users,
    File,
    Image as ImageIcon,
    Download,
    Link as LinkIcon
} from "lucide-react";
import { Conversation, MessageAttachment } from "@/features/chat/types/chat.types";
import { cn } from "@/lib/utils";

interface ChatInfoDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    conversation: Conversation;
    currentUserId: string;
}

export function ChatInfoDialog({
    open,
    onOpenChange,
    conversation,
    currentUserId,
}: ChatInfoDialogProps) {

    // Identifier l'autre utilisateur pour les chats directs
    const otherUser = useMemo(() => {
        if (conversation.type === "DIRECT") {
            return conversation.ConversationMember.find(
                (m) => m.User.id !== currentUserId
            )?.User;
        }
        return null;
    }, [conversation, currentUserId]);

    const creator = useMemo(() => {
        if (!conversation.createdBy) return null;
        return conversation.ConversationMember.find(m => m.User.id === conversation.createdBy)?.User;
    }, [conversation]);

    const formattedDate = useMemo(() => {
        if (!conversation.createdAt) return null;
        return format(new Date(conversation.createdAt), "d MMMM yyyy", { locale: fr });
    }, [conversation.createdAt]);

    const sortedMembers = useMemo(() => {
        return [...(conversation.ConversationMember || [])].sort((a, b) => {
            // Admins first
            if (a.isAdmin && !b.isAdmin) return -1;
            if (!a.isAdmin && b.isAdmin) return 1;
            return a.User.name.localeCompare(b.User.name);
        });
    }, [conversation.ConversationMember]);

    // Extraire les pièces jointes des messages chargés
    const sharedFiles = useMemo(() => {
        const files: { attachment: MessageAttachment, sender: string, date: Date }[] = [];
        conversation.Message?.forEach(msg => {
            if (msg.attachments && msg.attachments.length > 0) {
                msg.attachments.forEach(att => {
                    files.push({
                        attachment: att,
                        sender: msg.User.name,
                        date: new Date(msg.createdAt)
                    });
                });
            }
        });
        return files.sort((a, b) => b.date.getTime() - a.date.getTime());
    }, [conversation.Message]);

    const commonGroups = []; // Placeholder pour l'instant

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden bg-background/95 backdrop-blur-xl border-border shadow-2xl flex flex-col max-h-[85vh]">

                {/* Header - Fixed */}
                <div className="relative shrink-0">
                    <div className="absolute inset-0 bg-secondary/30 h-32 w-full z-0" />
                    <DialogHeader className="p-6 pb-2 relative z-10 flex flex-col items-center text-center mt-8">
                        <div className="mb-4 shadow-xl rounded-full border-4 border-background bg-background">
                            <Avatar className="h-24 w-24">
                                {conversation.type === "DIRECT" && otherUser ? (
                                    <>
                                        <AvatarImage src={otherUser.image || otherUser.avatar || ""} />
                                        <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                                            {otherUser.name.substring(0, 2).toUpperCase()}
                                        </AvatarFallback>
                                    </>
                                ) : (
                                    <AvatarFallback className={cn(
                                        "text-2xl",
                                        conversation.type === "CHANNEL" ? "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" :
                                            conversation.type === "PROJECT" ? "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400" :
                                                "bg-secondary text-secondary-foreground"
                                    )}>
                                        {conversation.type === "CHANNEL" ? <Hash className="h-10 w-10" /> :
                                            conversation.type === "PROJECT" ? "P" : <Users className="h-10 w-10" />}
                                    </AvatarFallback>
                                )}
                            </Avatar>
                        </div>

                        <DialogTitle className="text-2xl font-bold">
                            {conversation.type === "DIRECT" ? otherUser?.name : conversation.name || "Conversation"}
                        </DialogTitle>

                        <DialogDescription className="text-base mt-1 flex items-center justify-center gap-2">
                            {conversation.type === "DIRECT" ? (
                                <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-secondary/50 text-secondary-foreground text-xs font-medium">
                                    {otherUser?.role || "Membre"}
                                </span>
                            ) : (
                                <span className="flex items-center gap-1.5">
                                    {conversation.isPrivate && <Lock className="h-3 w-3" />}
                                    {conversation.description || "Aucune description"}
                                </span>
                            )}
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <Tabs defaultValue="info" className="flex-1 flex flex-col overflow-hidden w-full">
                    <TabsList className="w-full justify-start rounded-none border-b bg-transparent px-6 h-12">
                        <TabsTrigger value="info" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full px-4">
                            Infos
                        </TabsTrigger>
                        <TabsTrigger value="files" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full px-4">
                            Fichiers <span className="ml-2 text-[10px] bg-muted px-1.5 py-0.5 rounded-full">{sharedFiles.length}</span>
                        </TabsTrigger>
                        {conversation.type === "DIRECT" && (
                            <TabsTrigger value="common" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full px-4">
                                Commun
                            </TabsTrigger>
                        )}
                    </TabsList>

                    <ScrollArea className="flex-1 w-full">
                        <div className="p-6 pt-6">

                            {/* TAB INFO */}
                            <TabsContent value="info" className="mt-0 space-y-6 animate-in slide-in-from-bottom-2 duration-300">
                                {/* Info Cards Grid */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-muted/30 p-3 rounded-xl flex flex-col gap-1 items-start border border-border/50">
                                        <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                                            <CalendarDays className="h-3.5 w-3.5" /> Créé le
                                        </span>
                                        <span className="font-medium text-sm">{formattedDate}</span>
                                    </div>
                                    <div className="bg-muted/30 p-3 rounded-xl flex flex-col gap-1 items-start border border-border/50">
                                        <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                                            <Users className="h-3.5 w-3.5" /> Membres
                                        </span>
                                        <span className="font-medium text-sm">{conversation.ConversationMember?.length || 0} participants</span>
                                    </div>
                                </div>

                                {/* User Details (Direct Only) */}
                                {conversation.type === "DIRECT" && otherUser && (
                                    <div className="space-y-3">
                                        <h4 className="text-sm font-semibold tracking-tight text-muted-foreground uppercase text-[11px]">Coordonnées</h4>
                                        <div className="bg-card border rounded-xl p-0 overflow-hidden shadow-sm">
                                            <div className="flex items-center gap-3 p-3 border-b border-border/50">
                                                <div className="h-8 w-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600">
                                                    <Mail className="h-4 w-4" />
                                                </div>
                                                <div className="flex-1 overflow-hidden">
                                                    <p className="text-xs text-muted-foreground">Email</p>
                                                    <p className="text-sm font-medium truncate select-all">{otherUser.email || "Non renseigné"}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3 p-3">
                                                <div className="h-8 w-8 rounded-lg bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center text-purple-600">
                                                    <User className="h-4 w-4" />
                                                </div>
                                                <div className="flex-1 overflow-hidden">
                                                    <p className="text-xs text-muted-foreground">ID Utilisateur</p>
                                                    <p className="text-sm font-medium truncate font-mono text-[11px] opacity-80 select-all">{otherUser.id}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Members List (Non-Direct) */}
                                {conversation.type !== "DIRECT" && (
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <h4 className="text-sm font-semibold tracking-tight text-muted-foreground uppercase text-[11px]">
                                                Membres ({conversation.ConversationMember?.length || 0})
                                            </h4>
                                            {creator && (
                                                <span className="text-[10px] text-muted-foreground bg-secondary/50 px-2 py-0.5 rounded-full">
                                                    Créé par {creator.name}
                                                </span>
                                            )}
                                        </div>

                                        <div className="bg-card border rounded-xl overflow-hidden divide-y divide-border/50 shadow-sm">
                                            {sortedMembers.slice(0, 50).map((member) => (
                                                <div key={member.User.id} className="flex items-center justify-between p-3 hover:bg-muted/30 transition-colors">
                                                    <div className="flex items-center gap-3">
                                                        <Avatar className="h-8 w-8">
                                                            <AvatarImage src={member.User.image || member.User.avatar || ""} />
                                                            <AvatarFallback className="text-xs">{member.User.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                                                        </Avatar>
                                                        <div>
                                                            <p className="text-sm font-medium flex items-center gap-1.5">
                                                                {member.User.name}
                                                                {member.User.id === currentUserId && <span className="text-[10px] text-muted-foreground">(Vous)</span>}
                                                            </p>
                                                            <p className="text-[11px] text-muted-foreground truncate max-w-[150px]">{member.User.email}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        {member.isAdmin && (
                                                            <Badge variant="outline" className="gap-1 text-[10px] h-5 border-amber-200 text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-400">
                                                                <Shield className="h-3 w-3" /> Admin
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </TabsContent>

                            {/* TAB FICHIERS */}
                            <TabsContent value="files" className="mt-0 animate-in slide-in-from-bottom-2 duration-300">
                                {sharedFiles.length > 0 ? (
                                    <div className="space-y-4">
                                        <h4 className="text-sm font-semibold tracking-tight text-muted-foreground uppercase text-[11px]">
                                            Partagés récemment
                                        </h4>
                                        <div className="grid grid-cols-1 gap-2">
                                            {sharedFiles.map((file, i) => (
                                                <div key={i} className="flex items-center gap-3 p-3 rounded-xl border bg-card hover:bg-accent/50 transition-colors group">
                                                    <div className="h-10 w-10 shrink-0 rounded-lg bg-muted flex items-center justify-center overflow-hidden border">
                                                        {file.attachment.type.startsWith("image/") ? (
                                                            <img src={file.attachment.url} alt={file.attachment.name} className="h-full w-full object-cover" />
                                                        ) : (
                                                            <File className="h-5 w-5 text-muted-foreground" />
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium truncate">{file.attachment.name}</p>
                                                        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                                                            <span>{(file.attachment.size / 1024).toFixed(1)} KB</span>
                                                            <span>•</span>
                                                            <span>{format(file.date, "d MMM", { locale: fr })}</span>
                                                            <span>•</span>
                                                            <span>{file.sender}</span>
                                                        </div>
                                                    </div>
                                                    <a
                                                        href={file.attachment.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="p-2 text-muted-foreground hover:text-primary transition-colors opacity-0 group-hover:opacity-100"
                                                    >
                                                        <Download className="h-4 w-4" />
                                                    </a>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-10 text-center space-y-3">
                                        <div className="h-16 w-16 bg-muted/30 rounded-full flex items-center justify-center">
                                            <File className="h-8 w-8 text-muted-foreground/50" />
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-sm font-medium">Aucun fichier partagé</p>
                                            <p className="text-xs text-muted-foreground text-balance max-w-[200px]">
                                                Les fichiers échangés dans cette conversation apparaîtront ici.
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </TabsContent>

                            {/* TAB COMMUN (Placeholder) */}
                            <TabsContent value="common" className="mt-0 animate-in slide-in-from-bottom-2 duration-300">
                                <div className="flex flex-col items-center justify-center py-10 text-center space-y-3">
                                    <div className="h-16 w-16 bg-muted/30 rounded-full flex items-center justify-center">
                                        <LinkIcon className="h-8 w-8 text-muted-foreground/50" />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium">Groupes en commun</p>
                                        <p className="text-xs text-muted-foreground text-balance max-w-[200px]">
                                            Aucun groupe en commun trouvé avec cet utilisateur pour le moment.
                                        </p>
                                    </div>
                                </div>
                            </TabsContent>

                        </div>
                    </ScrollArea>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}
