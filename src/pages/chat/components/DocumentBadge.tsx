import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { IDocument } from "@/lib/document/types";

interface DocumentBadgeProps {
  document: IDocument;
  onPreview: () => void;
  onRemove: () => void;
  removeable?: boolean;
}

export const DocumentBadge = React.memo(({ 
  document, 
  onPreview, 
  onRemove,
  removeable = true
}: DocumentBadgeProps) => (
  <Badge 
    key={document.id}
    className="gap-1 cursor-pointer justify-between max-w-[200px] w-fit truncate bg-muted-foreground/20 hover:bg-primary/5"
    onClick={onPreview}
  >
    <span className="truncate">{document.name}</span>
    {removeable && (
      <Button
        variant="ghost"
        size="icon"
        className="h-4 w-4"
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
      >
        <X className="h-3 w-3" />
      </Button>
    )}
  </Badge>
));

DocumentBadge.displayName = "DocumentBadge"; 