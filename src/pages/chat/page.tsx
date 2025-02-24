import React from "react";
import { AIMessage, AIMessageChunk, BaseMessage, HumanMessage } from "@langchain/core/messages";
import { useParams, useNavigate } from "react-router-dom";
import { ChatManager } from "@/lib/chat/manager";
import { useLiveQuery } from "dexie-react-hooks";
import { mapStoredMessageToChatMessage } from "@langchain/core/messages";
import { ChatHistoryDB, DexieChatMemory } from "@/lib/chat/memory";
import { AutosizeTextarea } from "@/components/ui/autosize-textarea";
import { Button } from "@/components/ui/button";
import { Send, X, Check, Info, Paperclip, Upload, Link2, Loader2, Download, ClipboardCopy, RefreshCcw, Pencil } from "lucide-react";
import { IDocument } from "@/lib/document/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Input as InputField } from "@/components/ui/input";
import { CHAT_MODELS } from "@/lib/config/types";
import { ConfigManager } from "@/lib/config/manager";
import { Badge } from "@/components/ui/badge";
import { DocumentManager } from "@/lib/document/manager";
import { toast } from "sonner";
import { isHumanMessage, isAIMessage } from "@langchain/core/messages";
import { ScrollArea } from "@/components/ui/scroll-area";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import "katex/dist/katex.min.css";
// import { Components } from "react-markdown";
// import type { SyntaxHighlighterProps } from 'react-syntax-highlighter';
// import type { CodeProps } from 'react-markdown/lib/ast-to-react';
import { cn } from "@/lib/utils";

// Types
interface MessageProps {
  message: BaseMessage;
  documentManager?: DocumentManager;
  setPreviewDocument?: (document: IDocument | null) => void;
  previewDocument?: IDocument | null;
}

interface MessagesProps {
  messages: BaseMessage[] | undefined;
  streamingHumanMessage: HumanMessage | null;
  streamingAIMessageChunks: AIMessageChunk[];
  setPreviewDocument: (document: IDocument | null) => void;
}

interface InputProps {
  input: string;
  selectedModel: string;
  attachments: IDocument[];
  enabledChatModels: string[] | undefined;
  isUrlInputOpen: boolean;
  urlInput: string;
  selectedModelName: string;
  isGenerating: boolean;
  onInputChange: (value: string) => void;
  onModelChange: (model: string) => void;
  onSendMessage: () => void;
  setPreviewDocument: (doc: IDocument | null) => void;
  setIsUrlInputOpen: (open: boolean) => void;
  setUrlInput: (url: string) => void;
  handleAttachmentFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleAttachmentUrlUpload: () => void;
  handleAttachmentRemove: (docId: string) => void;
}

interface FilePreviewDialogProps {
  document: IDocument | null;
  onClose: () => void;
}

// Components
const DocumentBadge = React.memo(({ 
  document, 
  onPreview, 
  onRemove,
  removeable = true
}: { 
  document: IDocument; 
  onPreview: () => void; 
  onRemove: () => void;
  removeable?: boolean;
}) => (
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

const DocumentBadgesScrollArea = React.memo(({ 
  documents,
  onPreview,
  onRemove,
  removeable = true,
  maxHeight = "100px",
  className = ""
}: { 
  documents: IDocument[];
  onPreview: (doc: IDocument) => void;
  onRemove: (docId: string) => void;
  removeable?: boolean;
  maxHeight?: string;
  className?: string;
}) => (
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

const HumanMessageComponent = React.memo(({ message, setPreviewDocument, onEdit, onRegenerate, isEditing, onSave, onCancelEdit }: MessageProps & {
  onEdit?: () => void;
  onRegenerate?: () => void;
  isEditing?: boolean;
  onSave?: (content: string) => void;
  onCancelEdit?: () => void;
}) => {
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

const AIMessageComponent = React.memo(({ message }: MessageProps) => {
  const handleCopy = React.useCallback(() => {
    const content = String(message.content);
    navigator.clipboard.writeText(content)
      .then(() => toast.success("Response copied to clipboard"))
      .catch(() => toast.error("Failed to copy response"));
  }, [message.content]);

  return (
    <div className="flex flex-col gap-1 group">
      <ReactMarkdown
        remarkPlugins={[remarkMath, remarkGfm]}
        rehypePlugins={[rehypeKatex]}
        components={{
          code(props) {
            const {children, className, ...rest} = props;
            const match = /language-(\w+)/.exec(className || '');
            const language = match ? match[1] : '';
            const code = String(children).replace(/\n$/, '');

            const copyToClipboard = () => {
              navigator.clipboard.writeText(code);
              toast.success("Code copied to clipboard");
            };

            return match ? (
              <div className="relative rounded-md overflow-hidden">
                <div className="absolute right-2 top-2 flex items-center gap-2">
                  {language && (
                    <Badge variant="secondary" className="text-xs font-mono">
                      {language}
                    </Badge>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 bg-muted/50 hover:bg-muted"
                    onClick={copyToClipboard}
                  >
                    <ClipboardCopy className="h-3 w-3" />
                  </Button>
                </div>
                <SyntaxHighlighter
                  style={oneDark}
                  language={language}
                  PreTag="div"
                  customStyle={{ margin: 0, borderRadius: 0 }}
                >
                  {code}
                </SyntaxHighlighter>
              </div>
            ) : (
              <code {...rest} className={`${className} bg-muted px-1.5 py-0.5 rounded-md`}>
                {children}
              </code>
            );
          },
          a(props) {
            return <a {...props} className="text-primary hover:underline" target="_blank" rel="noopener noreferrer" />;
          },
          table(props) {
            return <table {...props} className="border-collapse table-auto w-full" />;
          },
          th(props) {
            return <th {...props} className="border border-muted-foreground px-4 py-2 text-left" />;
          },
          td(props) {
            return <td {...props} className="border border-muted-foreground px-4 py-2" />;
          },
          blockquote(props) {
            return <blockquote {...props} className="border-l-4 border-primary pl-4 italic" />;
          },
          ul(props) {
            return <ul {...props} className="list-disc list-inside" />;
          },
          ol(props) {
            return <ol {...props} className="list-decimal list-inside" />;
          },
        }}
      >
        {String(message.content)}
      </ReactMarkdown>
      <div className="flex flex-row gap-1 opacity-0 group-hover:opacity-100">
        <Button variant="ghost" size="sm" onClick={handleCopy}>
          <ClipboardCopy className="h-4 w-4 mr-2" />
          Copy response
        </Button>
      </div>
    </div>
  );
});
AIMessageComponent.displayName = "AIMessageComponent";

const Messages = React.memo(({ 
  messages, 
  streamingHumanMessage, 
  streamingAIMessageChunks, 
  setPreviewDocument,
  onEditMessage,
  onRegenerateMessage,
  editingMessageIndex,
  onSaveEdit,
  onCancelEdit,
}: MessagesProps & {
  onEditMessage: (index: number) => void;
  onRegenerateMessage: (index: number) => void;
  editingMessageIndex: number | null;
  onSaveEdit: (content: string) => void;
  onCancelEdit: () => void;
}) => {
  const { id } = useParams();
  
  if (id === "new" || !messages) {
    return <ScrollArea className="flex-1" />;
  }

  return (
    <ScrollArea className="flex-1">
      <div className="flex flex-col w-1/2 mx-auto gap-1">
        {messages.map((message, index) => {
          if (isHumanMessage(message)) {
            return (
              <HumanMessageComponent 
                key={index} 
                message={message} 
                setPreviewDocument={setPreviewDocument}
                onEdit={() => onEditMessage(index)}
                onRegenerate={() => onRegenerateMessage(index)}
                isEditing={editingMessageIndex === index}
                onSave={onSaveEdit}
                onCancelEdit={onCancelEdit}
              />
            );
          }
          if (isAIMessage(message)) {
            return <AIMessageComponent key={index} message={message} />;
          }
          return null;
        })}
        {streamingHumanMessage && (
          <HumanMessageComponent 
            message={streamingHumanMessage} 
            setPreviewDocument={setPreviewDocument} 
          />
        )}
        {streamingAIMessageChunks.length > 0 && (
          <AIMessageComponent 
            message={new AIMessage(streamingAIMessageChunks.map(chunk => chunk.content).join(""))} 
          />
        )}
      </div>
    </ScrollArea>
  );
});
Messages.displayName = "Messages";

const FilePreviewDialog = React.memo(({ document: fileDoc, onClose }: FilePreviewDialogProps) => {
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

const ModelSelector = React.memo(({ 
  selectedModel, 
  selectedModelName, 
  enabledChatModels, 
  onModelChange 
}: { 
  selectedModel: string; 
  selectedModelName: string; 
  enabledChatModels: string[] | undefined; 
  onModelChange: (model: string) => void;
}) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button 
        variant="ghost" 
        className="w-[200px] h-8 p-1 justify-start font-normal"
      >
        {selectedModelName}
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent className="w-[400px]">
      {CHAT_MODELS
        .filter((model) => enabledChatModels?.includes(model.model))
        .map((model) => (
          <TooltipProvider key={model.model}>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuItem
                  className="p-4"
                  onSelect={() => onModelChange(model.model)}
                >
                  <div className="flex items-center gap-2 w-full">
                    {model.model === selectedModel && (
                      <Check className="h-4 w-4 shrink-0" />
                    )}
                    <span className="flex-grow">{model.name}</span>
                    <Info className="h-4 w-4 text-muted-foreground shrink-0" />
                  </div>
                </DropdownMenuItem>
              </TooltipTrigger>
              <TooltipContent side="right" align="start" className="max-w-[300px]">
                <p>{model.description}</p>
                {model.modalities && model.modalities.length > 0 && (
                  <div className="flex gap-1 flex-wrap mt-1">
                    {model.modalities.map((modality) => (
                      <Badge key={modality} variant="secondary" className="capitalize text-xs">
                        {modality.toLowerCase()}
                      </Badge>
                    ))}
                  </div>
                )}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ))}
    </DropdownMenuContent>
  </DropdownMenu>
));
ModelSelector.displayName = "ModelSelector";

const AttachmentDropdown = React.memo(({ 
  isUrlInputOpen, 
  setIsUrlInputOpen, 
  urlInput, 
  setUrlInput, 
  handleAttachmentFileUpload, 
  handleAttachmentUrlUpload 
}: { 
  isUrlInputOpen: boolean; 
  setIsUrlInputOpen: (open: boolean) => void; 
  urlInput: string; 
  setUrlInput: (url: string) => void; 
  handleAttachmentFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void; 
  handleAttachmentUrlUpload: () => void;
}) => (
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

const Input = React.memo(({
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
        className="bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 resize-none p-0"
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

// Custom hooks
const useChatSession = (id: string | undefined) => {
  const chatHistoryDB = React.useMemo(() => new ChatHistoryDB(), []);
  return useLiveQuery(async () => {
    if (!id || id === "new") return null;
    return await chatHistoryDB.sessions.get(id);
  }, [id]);
};

interface Config {
  default_chat_model: string;
  enabled_chat_models: string[];
}

interface ChatSession {
  model: string;
  updatedAt: number;
}

const useSelectedModel = (id: string | undefined, config: Config | undefined) => {
  const [selectedModel, setSelectedModel] = React.useState<string | null>(null);
  const chatHistoryDB = React.useMemo(() => new ChatHistoryDB(), []);

  useLiveQuery(async () => {
    if (!config) return;
    
    const model = !id || id === "new" 
      ? config.default_chat_model
      : (await chatHistoryDB.sessions.get(id) as ChatSession | undefined)?.model ?? config.default_chat_model;
    setSelectedModel(model);
  }, [id, config]);

  return [selectedModel, setSelectedModel, chatHistoryDB] as const;
};

export function ChatPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const configManager = React.useMemo(() => ConfigManager.getInstance(), []);
  const chatManager = React.useMemo(() => new ChatManager(), []);
  const documentManager = React.useMemo(() => DocumentManager.getInstance(), []);

  const [input, setInput] = React.useState("");
  const [attachments, setAttachments] = React.useState<IDocument[]>([]);
  const [isUrlInputOpen, setIsUrlInputOpen] = React.useState(false);
  const [urlInput, setUrlInput] = React.useState("");
  const [previewDocument, setPreviewDocument] = React.useState<IDocument | null>(null);
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [streamingHumanMessage, setStreamingHumanMessage] = React.useState<HumanMessage | null>(null);
  const [streamingAIMessageChunks, setStreamingAIMessageChunks] = React.useState<AIMessageChunk[]>([]);
  const [editingMessageIndex, setEditingMessageIndex] = React.useState<number | null>(null);

  const config = useLiveQuery(async () => await configManager.getConfig());
  const chatSession = useChatSession(id);
  const [selectedModel, setSelectedModel, chatHistoryDB] = useSelectedModel(id, config);

  const selectedModelName = React.useMemo(() => (
    CHAT_MODELS.find(model => model.model === selectedModel)?.name || "Select a model"
  ), [selectedModel]);

  const handleModelChange = React.useCallback(async (model: string) => {
    if (!config) return;
    
    if (!id || id === "new") {
      await configManager.updateConfig({
        ...config,
        default_chat_model: model
      });
    } else {
      const session = await chatHistoryDB.sessions.get(id);
      if (session) {
        await chatHistoryDB.sessions.update(id, {
          ...session,
          model,
          updatedAt: Date.now()
        });
      }
    }
    setSelectedModel(model);
  }, [config, id, setSelectedModel, configManager, chatHistoryDB.sessions]);

  const handleSendMessage = React.useCallback(async () => {
    let chatId = id;
    if (id === "new") {
      chatId = crypto.randomUUID();
      new DexieChatMemory(chatId);
      navigate(`/chat/${chatId}`, { replace: true });
    }
    if (!chatId || !input.trim() || isGenerating) return;

    try {
      setIsGenerating(true);

      const chatInput = input;
      const chatAttachments = attachments;

      setInput("");
      setAttachments([]);
      setStreamingHumanMessage(new HumanMessage(chatInput));

      const messageIterator = chatManager.chat(chatId, chatInput, chatAttachments);

      for await (const event of messageIterator) {
        if (event.type === "stream") {
          setStreamingAIMessageChunks(prev => [...prev, event.content]);
        } else if (event.type === "end") {
          setIsGenerating(false);
          setStreamingHumanMessage(null);
          setStreamingAIMessageChunks([]);
        }
      }
    } catch (error) {
      console.error(error);
      toast.error(`Failed to send message: ${error}`);
      setIsGenerating(false);
    }
  }, [id, input, isGenerating, attachments, chatManager, navigate]);
  
  const handleAttachmentFileUpload = React.useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    try {
      const newDocs = await Promise.all(
        Array.from(files).map(file => documentManager.uploadDocument(file))
      );
      setAttachments(prev => [...prev, ...newDocs]);
    } catch (error) {
      console.error(error);
      toast.error("Failed to upload files");
    }
  }, [documentManager]);
  
  const handleAttachmentUrlUpload = React.useCallback(async () => {
    if (!urlInput.trim()) return;

    try {
      const urls = urlInput.split(",").map(url => url.trim());
      const newDocs = await Promise.all(
        urls.map(url => documentManager.uploadUrl(url))
      );
      setAttachments(prev => [...prev, ...newDocs]);
      setUrlInput("");
      setIsUrlInputOpen(false);
    } catch (error) {
      console.error(error);
      toast.error("Failed to upload URLs");
    }
  }, [urlInput, documentManager]);

  const handleAttachmentRemove = React.useCallback((docId: string) => {
    setAttachments(prev => prev.filter(doc => doc.id !== docId));
  }, []);

  const handleEditMessage = React.useCallback((index: number) => {
    setEditingMessageIndex(index);
  }, []);

  const handleSaveEdit = React.useCallback(async (content: string) => {
    if (!id || editingMessageIndex === null || !chatSession || isGenerating) return;

    try {
      // Update the message directly in the database
      const updatedMessages = [...chatSession.messages];
      updatedMessages[editingMessageIndex] = {
        ...updatedMessages[editingMessageIndex],
        data: {
          ...updatedMessages[editingMessageIndex].data,
          content
        }
      };
      // Remove messages after the edited message
      const newMessages = updatedMessages.slice(0, editingMessageIndex);
      
      await chatHistoryDB.sessions.update(id, {
        ...chatSession,
        messages: newMessages,
        updatedAt: Date.now()
      });

      setInput(content);
      setEditingMessageIndex(null);
      setAttachments([]);
      
      setIsGenerating(true);
      const messageIterator = chatManager.chat(id, content);

      for await (const event of messageIterator) {
        if (event.type === "stream") {
          setStreamingAIMessageChunks(prev => [...prev, event.content]);
        } else if (event.type === "end") {
          setIsGenerating(false);
          setStreamingAIMessageChunks([]);
        }
      }
    } catch (error) {
      console.error("Failed to save edit:", error);
      toast.error("Failed to save edit");
      setIsGenerating(false);
    }
  }, [id, editingMessageIndex, chatSession, isGenerating, chatHistoryDB.sessions, chatManager]);

  const handleRegenerateMessage = React.useCallback(async (index: number) => {
    if (!id || !chatSession || isGenerating) return;

    const messages = chatSession.messages;
    if (messages.length <= index) return;
    
    const message = messages[index];
    const content = message.data.content;

    // Remove messages after the current message
    const newMessages = messages.slice(0, index);
    
    await chatHistoryDB.sessions.update(id, {
      ...chatSession,
      messages: newMessages,
      updatedAt: Date.now()
    });
    
    setIsGenerating(true);
    const messageIterator = chatManager.chat(id, content);

    for await (const event of messageIterator) {
      if (event.type === "stream") {
        setStreamingAIMessageChunks(prev => [...prev, event.content]);
      } else if (event.type === "end") {
        setIsGenerating(false);
        setStreamingAIMessageChunks([]);
      }
    }
  }, [id, chatSession, isGenerating, chatHistoryDB.sessions, chatManager]);

  return (
    <div className="flex flex-col h-screen p-2">
      <Messages
        messages={chatSession?.messages.map(mapStoredMessageToChatMessage)}
        streamingHumanMessage={streamingHumanMessage}
        streamingAIMessageChunks={streamingAIMessageChunks}
        setPreviewDocument={setPreviewDocument}
        onEditMessage={handleEditMessage}
        onRegenerateMessage={handleRegenerateMessage}
        editingMessageIndex={editingMessageIndex}
        onSaveEdit={handleSaveEdit}
        onCancelEdit={() => setEditingMessageIndex(null)}
      />
      <Input
        input={input}
        selectedModel={selectedModel || ""}
        attachments={attachments}
        onInputChange={setInput}
        onModelChange={handleModelChange}
        onSendMessage={handleSendMessage}
        enabledChatModels={config?.enabled_chat_models}
        setPreviewDocument={setPreviewDocument}
        isUrlInputOpen={isUrlInputOpen}
        setIsUrlInputOpen={setIsUrlInputOpen}
        urlInput={urlInput}
        setUrlInput={setUrlInput}
        handleAttachmentFileUpload={handleAttachmentFileUpload}
        handleAttachmentUrlUpload={handleAttachmentUrlUpload}
        handleAttachmentRemove={handleAttachmentRemove}
        selectedModelName={selectedModelName}
        isGenerating={isGenerating}
      />
      <FilePreviewDialog
        document={previewDocument}
        onClose={() => setPreviewDocument(null)}
      />
    </div>
  );
}