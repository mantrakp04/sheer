import { BaseMessage, HumanMessage, AIMessageChunk, StoredMessage } from "@langchain/core/messages";
import { IDocument } from "@/lib/document/types";
import { DocumentManager } from "@/lib/document/manager";

export interface MessageProps {
  message: BaseMessage;
  documentManager?: DocumentManager;
  setPreviewDocument?: (document: IDocument | null) => void;
  previewDocument?: IDocument | null;
}

export interface MessagesProps {
  messages: BaseMessage[] | undefined;
  streamingHumanMessage: HumanMessage | null;
  streamingAIMessageChunks: AIMessageChunk[];
  setPreviewDocument: (document: IDocument | null) => void;
  onEditMessage: (index: number) => void;
  onRegenerateMessage: (index: number) => void;
  editingMessageIndex: number | null;
  onSaveEdit: (content: string) => void;
  onCancelEdit: () => void;
}

export interface InputProps {
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
  stopGenerating: () => void;
}

export interface FilePreviewDialogProps {
  document: IDocument | null;
  onClose: () => void;
}

export interface Config {
  default_chat_model: string;
  enabled_chat_models: string[];
}

export interface ChatSession {
  model: string;
  updatedAt: number;
  messages: StoredMessage[];
} 