import React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { IDocument } from "@/lib/document/types";
import { DocumentBadge } from "./DocumentBadge";

interface DocumentBadgesScrollAreaProps {
  documents: IDocument[];
  onPreview: (doc: IDocument) => void;
  onRemove: (docId: string) => void;
  removeable?: boolean;
  maxHeight?: string;
  className?: string;
}

export const DocumentBadgesScrollArea = React.memo(({ 
  documents,
  onPreview,
  onRemove,
  removeable = true,
  maxHeight = "100px",
  className = ""
}: DocumentBadgesScrollAreaProps) => (
  <ScrollArea className={cn("w-full", className)} style={{ maxHeight }}>
    <div className="flex flex-row-reverse flex-wrap-reverse gap-1 p-1">
      {documents.map((document) => (
        <DocumentBadge
          key={document.id}
          document={document}
          onPreview={() => onPreview(document)}
          onRemove={() => onRemove(document.id)}
          removeable={removeable}
        />
      ))}
    </div>
  </ScrollArea>
));

DocumentBadgesScrollArea.displayName = "DocumentBadgesScrollArea"; 