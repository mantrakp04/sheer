import React from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { DocumentManager } from "@/lib/document/manager";
import { FilePreviewDialogProps } from "../types";
import { toast } from "sonner";

export const FilePreviewDialog = React.memo(({ document: fileDoc, onClose }: FilePreviewDialogProps) => {
  const [content, setContent] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const documentManager = React.useMemo(() => DocumentManager.getInstance(), []);

  React.useEffect(() => {
    if (!fileDoc) return;

    const loadContent = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const file = await documentManager.getDocument(fileDoc.id);

        if (fileDoc.type === "image") {
          const reader = new FileReader();
          reader.onload = () => setContent(reader.result as string);
          reader.readAsDataURL(file);
        } else if (fileDoc.type === "pdf") {
          const url = URL.createObjectURL(file);
          setContent(url);
          return () => URL.revokeObjectURL(url);
        } else {
          const text = await file.text();
          setContent(text);
        }
      } catch (err) {
        console.error(err);
        setError("Failed to load file content");
      } finally {
        setIsLoading(false);
      }
    };

    loadContent();
  }, [fileDoc, documentManager]);

  const handleDownload = React.useCallback(async () => {
    if (!fileDoc) return;
    try {
      const file = await documentManager.getDocument(fileDoc.id);
      const url = URL.createObjectURL(file);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileDoc.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      toast.error("Failed to download file");
    }
  }, [fileDoc, documentManager]);

  if (!fileDoc) return null;

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      );
    }
    if (error) {
      return (
        <div className="flex items-center justify-center h-full text-destructive">
          {error}
        </div>
      );
    }
    if (content) {
      if (fileDoc.type === "image") {
        return (
          <div className="flex items-center justify-center p-4">
            <img src={content} alt={fileDoc.name} className="max-w-full max-h-full object-contain" />
          </div>
        );
      }
      if (fileDoc.type === "pdf") {
        return <iframe src={content} className="h-full w-full rounded-md bg-muted/50" />;
      }
      return (
        <pre className="p-4 whitespace-pre-wrap font-mono text-sm">
          {content}
        </pre>
      );
    }
    return null;
  };

  return (
    <Dialog open={!!fileDoc} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] h-full flex flex-col">
        <DialogHeader className="flex flex-row items-center justify-between">
          <div className="space-y-1">
            <DialogTitle>{fileDoc.name}</DialogTitle>
            <DialogDescription>
              Type: {fileDoc.type} • Created: {new Date(fileDoc.createdAt).toLocaleString()}
            </DialogDescription>
          </div>
          <Button onClick={handleDownload} variant="outline" size="sm" className="gap-2">
            <Download className="h-4 w-4" />
            Download
          </Button>
        </DialogHeader>
        {renderContent()}
      </DialogContent>
    </Dialog>
  );
});

FilePreviewDialog.displayName = "FilePreviewDialog"; 