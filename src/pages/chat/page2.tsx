import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useVirtualizer } from '@tanstack/react-virtual';
import { AIMessageChunk, BaseMessage, HumanMessage } from '@langchain/core/messages';
import { mapStoredMessageToChatMessage } from '@langchain/core/messages';
import { ChatManager } from '@/lib/chat/manager';
import { ChatHistoryDB, DexieChatMemory } from '@/lib/chat/memory';
import { ConfigManager } from '@/lib/config/manager';
import { DocumentManager } from '@/lib/document/manager';
import { IDocument } from '@/lib/document/types';
import { CHAT_MODELS } from '@/lib/config/types';
import { toast } from 'sonner';
import { cn } from "@/lib/utils";

// Components
import { AutosizeTextarea } from '@/components/ui/autosize-textarea';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

// Icons
import { Send, X, Check, Info, Paperclip, Upload, Link2, Loader2, Download, ClipboardCopy, RefreshCcw, Pencil } from 'lucide-react';

// Markdown
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';
import 'katex/dist/katex.min.css';

// Types
interface ChatState {
  input: string;
  attachments: IDocument[];
  isUrlInputOpen: boolean;
  urlInput: string;
  previewDocument: IDocument | null;
  isGenerating: boolean;
  streamingHumanMessage: HumanMessage | null;
  streamingAIMessageChunks: AIMessageChunk[];
  editingMessageIndex: number | null;
}

// Query Keys
const chatKeys = {
  all: ['chat'] as const,
  session: (id: string) => [...chatKeys.all, 'session', id] as const,
  config: ['config'] as const,
};

// Custom Hooks
const useChatSession = (id: string | undefined) => {
  const chatHistoryDB = React.useMemo(() => new ChatHistoryDB(), []);
  
  return useQuery({
    queryKey: chatKeys.session(id || 'new'),
    queryFn: async () => {
      if (!id || id === 'new') return null;
      return await chatHistoryDB.sessions.get(id);
    },
    staleTime: 1000 * 60, // 1 minute
  });
};

const useConfig = () => {
  const configManager = React.useMemo(() => ConfigManager.getInstance(), []);
  
  return useQuery({
    queryKey: chatKeys.config,
    queryFn: async () => await configManager.getConfig(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

// Optimized Components
const MessageContent = React.memo(({ content }: { content: string }) => (
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
          toast.success('Code copied to clipboard');
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
    }}
  >
    {content}
  </ReactMarkdown>
));
MessageContent.displayName = 'MessageContent';

const VirtualizedMessages = React.memo(({ 
  messages,
  streamingMessages,
  parentRef,
  onEditMessage,
  onRegenerateMessage,
  editingMessageIndex,
  onSaveEdit,
  onCancelEdit,
}: {
  messages: BaseMessage[];
  streamingMessages: {
    human: HumanMessage | null;
    ai: AIMessageChunk[];
  };
  parentRef: React.MutableRefObject<HTMLDivElement | null>;
  onEditMessage: (index: number) => void;
  onRegenerateMessage: (index: number) => void;
  editingMessageIndex: number | null;
  onSaveEdit: (content: string) => void;
  onCancelEdit: () => void;
}) => {
  const rowVirtualizer = useVirtualizer({
    count: messages.length + (streamingMessages.human ? 2 : 0),
    getScrollElement: () => parentRef.current,
    estimateSize: () => 100,
    overscan: 5,
  });

  if (!parentRef.current) return null;

  return (
    <div
      className="flex-1 overflow-auto"
      style={{
        height: `100%`,
        width: `100%`,
        contain: 'strict',
      }}
    >
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
          const index = virtualRow.index;
          const message = index < messages.length 
            ? messages[index]
            : index === messages.length && streamingMessages.human 
              ? streamingMessages.human
              : null;

          if (!message) return null;

          const isHuman = message instanceof HumanMessage;
          const isEditing = editingMessageIndex === index;

          return (
            <div
              key={virtualRow.index}
              data-index={virtualRow.index}
              ref={rowVirtualizer.measureElement}
              className={`absolute top-0 left-0 w-full ${
                isHuman ? 'flex justify-end' : ''
              }`}
              style={{
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              <div className={`max-w-[70%] ${isHuman ? 'ml-auto' : ''}`}>
                {isHuman ? (
                  <HumanMessageComponent
                    message={message}
                    isEditing={isEditing}
                    onEdit={() => onEditMessage(index)}
                    onRegenerate={() => onRegenerateMessage(index)}
                    onSave={onSaveEdit}
                    onCancelEdit={onCancelEdit}
                  />
                ) : (
                  <AIMessageComponent message={message} />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});
VirtualizedMessages.displayName = 'VirtualizedMessages';

const HumanMessageComponent = React.memo(({ 
  message, 
  isEditing,
  onEdit,
  onRegenerate,
  onSave,
  onCancelEdit,
}: { 
  message: HumanMessage;
  isEditing?: boolean;
  onEdit?: () => void;
  onRegenerate?: () => void;
  onSave?: (content: string) => void;
  onCancelEdit?: () => void;
}) => {
  const [editedContent, setEditedContent] = React.useState(String(message.content));

  if (message.response_metadata?.documents?.length) {
    return (
      <div className="flex flex-col gap-1 max-w-[70%] ml-auto items-end">
        <DocumentBadgesScrollArea
          documents={message.response_metadata.documents}
          onPreview={() => {}}
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
HumanMessageComponent.displayName = 'HumanMessageComponent';

const AIMessageComponent = React.memo(({ message }: { message: BaseMessage }) => {
  const handleCopy = React.useCallback(() => {
    const content = String(message.content);
    navigator.clipboard.writeText(content)
      .then(() => toast.success("Response copied to clipboard"))
      .catch(() => toast.error("Failed to copy response"));
  }, [message.content]);

  return (
    <div className="flex flex-col gap-1 group">
      <MessageContent content={String(message.content)} />
      <div className="flex flex-row gap-1 opacity-0 group-hover:opacity-100">
        <Button variant="ghost" size="sm" onClick={handleCopy}>
          <ClipboardCopy className="h-4 w-4 mr-2" />
          Copy response
        </Button>
      </div>
    </div>
  );
});
AIMessageComponent.displayName = 'AIMessageComponent';

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
DocumentBadgesScrollArea.displayName = 'DocumentBadgesScrollArea';

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
DocumentBadge.displayName = 'DocumentBadge';

const FilePreviewDialog = React.memo(({ document: fileDoc, onClose }: { 
  document: IDocument | null; 
  onClose: () => void; 
}) => {
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
        <div className="flex-1 overflow-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full text-destructive">
              {error}
            </div>
          ) : content ? (
            fileDoc.type === "image" ? (
              <div className="flex items-center justify-center p-4">
                <img src={content} alt={fileDoc.name} className="max-w-full max-h-full object-contain" />
              </div>
            ) : fileDoc.type === "pdf" ? (
              <iframe src={content} className="h-full w-full rounded-md bg-muted/50" />
            ) : (
              <pre className="p-4 whitespace-pre-wrap font-mono text-sm">
                {content}
              </pre>
            )
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
});
FilePreviewDialog.displayName = 'FilePreviewDialog';

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
ModelSelector.displayName = 'ModelSelector';

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
          <Input
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
AttachmentDropdown.displayName = 'AttachmentDropdown';

// Main Component
export function ChatPage2() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const parentRef = React.useRef<HTMLDivElement>(null);

  // Services
  const chatManager = React.useMemo(() => new ChatManager(), []);
  const documentManager = React.useMemo(() => DocumentManager.getInstance(), []);

  // Queries
  const { data: chatSession, isLoading: isLoadingSession } = useChatSession(id);
  const { data: config, isLoading: isLoadingConfig } = useConfig();

  // Computed values
  const selectedModelName = React.useMemo(() => (
    CHAT_MODELS.find(model => model.model === chatSession?.model)?.name || "Select a model"
  ), [chatSession?.model]);

  // Local State
  const [state, setState] = React.useState<ChatState>({
    input: '',
    attachments: [],
    isUrlInputOpen: false,
    urlInput: '',
    previewDocument: null,
    isGenerating: false,
    streamingHumanMessage: null,
    streamingAIMessageChunks: [],
    editingMessageIndex: null,
  });

  // Mutations
  const sendMessageMutation = useMutation({
    mutationFn: async ({ chatId, input, attachments }: { 
      chatId: string; 
      input: string; 
      attachments: IDocument[]; 
    }) => {
      setState(prev => ({ 
        ...prev, 
        isGenerating: true,
        streamingHumanMessage: new HumanMessage(input),
        streamingAIMessageChunks: [],
      }));

      try {
        const messageIterator = chatManager.chat(chatId, input, attachments);
        for await (const event of messageIterator) {
          if (event.type === 'stream') {
            setState(prev => ({
              ...prev,
              streamingAIMessageChunks: [...prev.streamingAIMessageChunks, event.content],
            }));
          }
        }
      } finally {
        setState(prev => ({ 
          ...prev, 
          isGenerating: false,
          streamingHumanMessage: null,
          streamingAIMessageChunks: [],
        }));
        queryClient.invalidateQueries({ queryKey: chatKeys.session(chatId) });
      }
    },
  });

  const regenerateMessageMutation = useMutation({
    mutationFn: async (messageIndex: number) => {
      if (!id || !chatSession) return;
      
      const messages = chatSession.messages;
      if (messages.length <= messageIndex) return;
      
      const message = messages[messageIndex];
      const content = message.data.content;

      // Remove messages after the current message
      const newMessages = messages.slice(0, messageIndex);
      
      const chatHistoryDB = new ChatHistoryDB();
      await chatHistoryDB.sessions.update(id, {
        ...chatSession,
        messages: newMessages,
        updatedAt: Date.now()
      });

      await sendMessageMutation.mutateAsync({
        chatId: id,
        input: content,
        attachments: [],
      });
    },
  });

  const editMessageMutation = useMutation({
    mutationFn: async ({ content }: { content: string }) => {
      if (!id || !chatSession || state.editingMessageIndex === null) return;
      
      // Update the message directly in the database
      const updatedMessages = [...chatSession.messages];
      updatedMessages[state.editingMessageIndex] = {
        ...updatedMessages[state.editingMessageIndex],
        data: {
          ...updatedMessages[state.editingMessageIndex].data,
          content
        }
      };
      // Remove messages after the edited message
      const newMessages = updatedMessages.slice(0, state.editingMessageIndex + 1);
      
      const chatHistoryDB = new ChatHistoryDB();
      await chatHistoryDB.sessions.update(id, {
        ...chatSession,
        messages: newMessages,
        updatedAt: Date.now()
      });

      setState(prev => ({
        ...prev,
        editingMessageIndex: null,
      }));

      await sendMessageMutation.mutateAsync({
        chatId: id,
        input: content,
        attachments: [],
      });
    },
  });

  // Handlers
  const handleSendMessage = React.useCallback(async () => {
    if (!state.input.trim() || state.isGenerating) return;

    let chatId = id;
    if (id === 'new') {
      chatId = crypto.randomUUID();
      new DexieChatMemory(chatId);
      navigate(`/chat/${chatId}`, { replace: true });
    }

    if (!chatId) return;

    setState(prev => ({
      ...prev,
      input: '',
      attachments: [],
    }));

    await sendMessageMutation.mutateAsync({
      chatId,
      input: state.input,
      attachments: state.attachments,
    });
  }, [id, state.input, state.attachments, state.isGenerating, navigate, sendMessageMutation]);

  const handleModelChange = React.useCallback(async (model: string) => {
    if (!id || !chatSession) return;
    
    try {
      const chatHistoryDB = new ChatHistoryDB();
      await chatHistoryDB.sessions.update(id, {
        ...chatSession,
        model,
        updatedAt: Date.now()
      });
      queryClient.invalidateQueries({ queryKey: chatKeys.session(id) });
    } catch (error) {
      console.error('Failed to update model:', error);
      toast.error('Failed to update model');
    }
  }, [id, chatSession, queryClient]);

  const handleAttachmentFileUpload = React.useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    try {
      const newDocs = await Promise.all(
        Array.from(files).map(file => documentManager.uploadDocument(file))
      );
      setState(prev => ({
        ...prev,
        attachments: [...prev.attachments, ...newDocs]
      }));
    } catch (error) {
      console.error(error);
      toast.error("Failed to upload files");
    }
  }, [documentManager]);

  const handleAttachmentUrlUpload = React.useCallback(async () => {
    if (!state.urlInput.trim()) return;

    try {
      const urls = state.urlInput.split(",").map(url => url.trim());
      const newDocs = await Promise.all(
        urls.map(url => documentManager.uploadUrl(url))
      );
      setState(prev => ({
        ...prev,
        attachments: [...prev.attachments, ...newDocs],
        urlInput: '',
        isUrlInputOpen: false,
      }));
    } catch (error) {
      console.error(error);
      toast.error("Failed to upload URLs");
    }
  }, [state.urlInput, documentManager]);

  const handleAttachmentRemove = React.useCallback((docId: string) => {
    setState(prev => ({
      ...prev,
      attachments: prev.attachments.filter(doc => doc.id !== docId)
    }));
  }, []);

  // Loading State
  if (isLoadingSession || isLoadingConfig) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Error State
  if (!config) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center space-y-2">
          <p className="text-destructive">Failed to load configuration</p>
          <Button onClick={() => queryClient.invalidateQueries({ queryKey: chatKeys.config })}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen p-2">
      <div ref={parentRef} className="flex-1">
        <VirtualizedMessages
          messages={chatSession?.messages.map(mapStoredMessageToChatMessage) || []}
          streamingMessages={{
            human: state.streamingHumanMessage,
            ai: state.streamingAIMessageChunks,
          }}
          parentRef={parentRef}
          onEditMessage={(index) => setState(prev => ({ ...prev, editingMessageIndex: index }))}
          onRegenerateMessage={(index) => regenerateMessageMutation.mutate(index)}
          editingMessageIndex={state.editingMessageIndex}
          onSaveEdit={(content) => editMessageMutation.mutate({ content })}
          onCancelEdit={() => setState(prev => ({ ...prev, editingMessageIndex: null }))}
        />
      </div>
      
      {/* Chat Input */}
      <div className="flex flex-col w-1/2 mx-auto bg-muted rounded-md p-1">
        {state.attachments.length > 0 && (
          <DocumentBadgesScrollArea
            documents={state.attachments}
            onPreview={(doc) => setState(prev => ({ ...prev, previewDocument: doc }))}
            onRemove={handleAttachmentRemove}
            maxHeight="100px"
          />
        )}
        <AutosizeTextarea
          value={state.input}
          onChange={(e) => setState(prev => ({ ...prev, input: e.target.value }))}
          className="bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 resize-none p-0"
          maxHeight={300}
          minHeight={50}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSendMessage();
            }
          }}
        />
        
        {/* Input Actions */}
        <div className="flex justify-between items-center mt-2">
          <div className="flex gap-2">
            <ModelSelector
              selectedModel={chatSession?.model || ''}
              selectedModelName={selectedModelName}
              enabledChatModels={config?.enabled_chat_models}
              onModelChange={handleModelChange}
            />
            <AttachmentDropdown
              isUrlInputOpen={state.isUrlInputOpen}
              setIsUrlInputOpen={(open) => setState(prev => ({ ...prev, isUrlInputOpen: open }))}
              urlInput={state.urlInput}
              setUrlInput={(url) => setState(prev => ({ ...prev, urlInput: url }))}
              handleAttachmentFileUpload={handleAttachmentFileUpload}
              handleAttachmentUrlUpload={handleAttachmentUrlUpload}
            />
          </div>
          <Button
            variant="default"
            size="icon"
            className="rounded-full"
            onClick={handleSendMessage}
            disabled={state.isGenerating}
          >
            {state.isGenerating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      <FilePreviewDialog
        document={state.previewDocument}
        onClose={() => setState(prev => ({ ...prev, previewDocument: null }))}
      />
    </div>
  );
} 