import React from "react";
import { Button } from "@/components/ui/button";
import { X, Check, RefreshCcw, Pencil, ClipboardCopy } from "lucide-react";
import { AutosizeTextarea } from "@/components/ui/autosize-textarea";
import { toast } from "sonner";
import { MessageProps } from "../types";
import { DocumentBadgesScrollArea } from "./DocumentBadgesScrollArea";

interface HumanMessageComponentProps extends MessageProps {
  onEdit?: () => void;
  onRegenerate?: () => void;
  isEditing?: boolean;
  onSave?: (content: string) => void;
  onCancelEdit?: () => void;
}

export const HumanMessageComponent = React.memo(({ 
  message, 
  setPreviewDocument, 
  onEdit, 
  onRegenerate, 
  isEditing, 
  onSave, 
  onCancelEdit 
}: HumanMessageComponentProps) => {
  const [editedContent, setEditedContent] = React.useState(String(message.content));

  if (message.response_metadata?.documents?.length) {
    return (
      <div className="flex flex-col gap-1 max-w-[70%] ml-auto items-end">
        <DocumentBadgesScrollArea
          documents={message.response_metadata.documents}
          onPreview={(doc) => setPreviewDocument?.(doc)}
          onRemove={() => {}}
          removeable={false}
          maxHeight="200px"
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1 max-w-[70%] ml-auto items-end group">
      {isEditing ? (
        <div className="flex flex-col gap-2 w-full">
          <AutosizeTextarea
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
            className="bg-muted p-5 rounded-md"
            maxHeight={300}
          />
          <div className="flex gap-2 justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={onCancelEdit}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => onSave?.(editedContent)}
            >
              <Check className="h-4 w-4 mr-2" />
              Save
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex p-5 bg-muted rounded-md" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {String(message.content)}
          </div>
          <div className="flex flex-row gap-1 opacity-0 group-hover:opacity-100">
            <Button variant="ghost" size="icon" onClick={onRegenerate}>
              <RefreshCcw className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onEdit}>
              <Pencil className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigator.clipboard.writeText(String(message.content)).then(() => toast.success("Message copied to clipboard"))}
            >
              <ClipboardCopy className="h-4 w-4" />
            </Button>
          </div>
        </>
      )}
    </div>
  );
});

HumanMessageComponent.displayName = "HumanMessageComponent"; 