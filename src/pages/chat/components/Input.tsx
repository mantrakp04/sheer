import React from "react";
import { Button } from "@/components/ui/button";
import { Send, Loader2 } from "lucide-react";
import { AutosizeTextarea } from "@/components/ui/autosize-textarea";
import { InputProps } from "../types";
import { ModelSelector } from "./ModelSelector";
import { AttachmentDropdown } from "./AttachmentDropdown";
import { DocumentBadgesScrollArea } from "./DocumentBadgesScrollArea";

export const Input = React.memo(({
  input,
  selectedModel,
  attachments,
  onInputChange,
  onModelChange,
  onSendMessage,
  enabledChatModels,
  setPreviewDocument,
  isUrlInputOpen,
  setIsUrlInputOpen,
  urlInput,
  setUrlInput,
  handleAttachmentFileUpload,
  handleAttachmentUrlUpload,
  handleAttachmentRemove,
  selectedModelName,
  isGenerating,
}: InputProps) => {
  return (
    <div className="flex flex-col w-1/2 mx-auto bg-muted rounded-md p-1">
      {attachments.length > 0 && (
        <DocumentBadgesScrollArea
          documents={attachments}
          onPreview={setPreviewDocument}
          onRemove={handleAttachmentRemove}
          maxHeight="100px"
        />
      )}
      <AutosizeTextarea
        value={input}
        onChange={(e) => onInputChange(e.target.value)}
        className="bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 resize-none p-2"
        maxHeight={300}
        minHeight={50}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            onSendMessage();
          }
        }}
      />
      <div className="flex flex-row justify-between items-end">
        <div className="flex gap-0">
          <ModelSelector
            selectedModel={selectedModel}
            selectedModelName={selectedModelName}
            enabledChatModels={enabledChatModels}
            onModelChange={onModelChange}
          />
          <AttachmentDropdown
            isUrlInputOpen={isUrlInputOpen}
            setIsUrlInputOpen={setIsUrlInputOpen}
            urlInput={urlInput}
            setUrlInput={setUrlInput}
            handleAttachmentFileUpload={handleAttachmentFileUpload}
            handleAttachmentUrlUpload={handleAttachmentUrlUpload}
          />
        </div>
        <Button 
          variant="default" 
          size="icon" 
          className="rounded-full" 
          onClick={onSendMessage}
          disabled={isGenerating}
        >
          {isGenerating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
});

Input.displayName = "Input"; 