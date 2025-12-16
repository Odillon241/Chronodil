"use client";

import * as React from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Search,
  MessageSquare,
  File,
  Hash,
  Loader2,
  Calendar,
  User,
} from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { globalSearch } from "@/actions/chat.actions";
import { useDebounce } from "@/hooks/use-debounce";
import { Badge } from "@/components/ui/badge";

interface ChatGlobalSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectResult: (result: SearchResult) => void;
}

export type SearchResult = {
  id: string;
  type: "message" | "file" | "conversation";
  content: string;
  conversationId: string;
  conversationName: string;
  conversationType: string;
  senderName?: string;
  createdAt: string | Date;
  fileData?: any;
};

export function ChatGlobalSearch({
  open,
  onOpenChange,
  onSelectResult,
}: ChatGlobalSearchProps) {
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<SearchResult[]>([]);
  const [loading, setLoading] = React.useState(false);
  const debouncedQuery = useDebounce(query, 300);

  React.useEffect(() => {
    const fetchResults = async () => {
      if (!debouncedQuery || debouncedQuery.length < 2) {
        setResults([]);
        return;
      }

      setLoading(true);
      try {
        const response = await globalSearch({ query: debouncedQuery });
        if (response?.data?.results) {
          setResults(response.data.results as SearchResult[]);
        }
      } catch (error) {
        console.error("Erreur lors de la recherche:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [debouncedQuery]);

  const messages = results.filter((r) => r.type === "message");
  const files = results.filter((r) => r.type === "file");
  const conversations = results.filter((r) => r.type === "conversation");

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Rechercher des messages, fichiers, canaux..."
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        <CommandEmpty>
          {loading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : query.length < 2 ? (
            "Tapez au moins 2 caractères pour rechercher..."
          ) : (
            "Aucun résultat trouvé."
          )}
        </CommandEmpty>

        {!loading && (
          <>
            {conversations.length > 0 && (
              <CommandGroup heading="Conversations">
                {conversations.map((result) => (
                  <CommandItem
                    key={result.id}
                    onSelect={() => onSelectResult(result)}
                    className="flex items-center gap-2 p-2 cursor-pointer"
                  >
                    <Hash className="h-4 w-4 text-muted-foreground" />
                    <div className="flex flex-col flex-1 min-w-0">
                      <span className="font-medium truncate">
                        {result.conversationName}
                      </span>
                      {result.content && (
                        <span className="text-xs text-muted-foreground truncate">
                          {result.content}
                        </span>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {conversations.length > 0 && (messages.length > 0 || files.length > 0) && (
              <CommandSeparator />
            )}

            {messages.length > 0 && (
              <CommandGroup heading="Messages">
                {messages.map((result) => (
                  <CommandItem
                    key={result.id}
                    onSelect={() => onSelectResult(result)}
                    className="flex flex-col items-start gap-1 p-2 cursor-pointer"
                  >
                    <div className="flex items-center gap-2 w-full">
                      <MessageSquare className="h-3 w-3 text-muted-foreground shrink-0" />
                      <span className="text-xs font-medium text-primary truncate">
                        {result.conversationName}
                      </span>
                      <span className="text-xs text-muted-foreground ml-auto shrink-0">
                        {format(new Date(result.createdAt), "dd MMM HH:mm", {
                          locale: fr,
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 w-full">
                      {result.senderName && (
                        <Badge variant="outline" className="text-[10px] px-1 h-5 shrink-0">
                          {result.senderName}
                        </Badge>
                      )}
                      <span className="text-sm truncate flex-1">
                        {result.content}
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {(messages.length > 0 || conversations.length > 0) && files.length > 0 && (
              <CommandSeparator />
            )}

            {files.length > 0 && (
              <CommandGroup heading="Fichiers">
                {files.map((result) => (
                  <CommandItem
                    key={result.id}
                    onSelect={() => onSelectResult(result)}
                    className="flex items-center gap-2 p-2 cursor-pointer"
                  >
                    <File className="h-4 w-4 text-blue-500" />
                    <div className="flex flex-col flex-1 min-w-0">
                      <span className="font-medium truncate">
                        {result.content}
                      </span>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{result.conversationName}</span>
                        <span>•</span>
                        <span>
                          {format(new Date(result.createdAt), "dd MMM yyyy", {
                            locale: fr,
                          })}
                        </span>
                      </div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}
