import React from "react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Input as InputField } from "@/components/ui/input";
import { Paperclip, Upload, Link2 } from "lucide-react";

interface AttachmentDropdownProps {
  isUrlInputOpen: boolean;
  setIsUrlInputOpen: (open: boolean) => void;
  urlInput: string;
  setUrlInput: (url: string) => void;
  handleAttachmentFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleAttachmentUrlUpload: () => void;
}

export const AttachmentDropdown = React.memo(({ 
  isUrlInputOpen, 
  setIsUrlInputOpen, 
  urlInput, 
  setUrlInput, 
  handleAttachmentFileUpload, 
  handleAttachmentUrlUpload 
}: AttachmentDropdownProps) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
      >
        <Paperclip className="h-4 w-4" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="start" className="w-[300px]">
      <DropdownMenuItem
        onSelect={() => {
          const input = document.createElement("input");
          input.type = "file";
          input.multiple = true;
          input.accept = ".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif,.mp3,.mp4,.wav,.ogg";
          input.onchange = (e) => handleAttachmentFileUpload(e as unknown as React.ChangeEvent<HTMLInputElement>);
          input.click();
        }}
      >
        <Upload className="h-4 w-4 mr-2" />
        Upload Files
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem onSelect={(e) => {
        e.preventDefault();
        setIsUrlInputOpen(true);
      }}>
        <Link2 className="h-4 w-4 mr-2" />
        Add URLs
      </DropdownMenuItem>
      {isUrlInputOpen && (
        <div className="p-2 flex gap-2">
          <InputField
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="Enter URLs (comma-separated)"
            className="flex-1"
          />
          <Button size="sm" onClick={handleAttachmentUrlUpload}>
            Add
          </Button>
        </div>
      )}
    </DropdownMenuContent>
  </DropdownMenu>
));

AttachmentDropdown.displayName = "AttachmentDropdown"; 