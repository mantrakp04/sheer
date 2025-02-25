import React, { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import { mapStoredMessageToChatMessage } from "@langchain/core/messages";
import { ConfigManager } from "@/lib/config/manager";
import { toast } from "sonner";
import { Messages } from "./components/Messages";
import { Input } from "./components/Input";
import { FilePreviewDialog } from "./components/FilePreviewDialog";
import { useChatSession, useSelectedModel, generateMessage, useChatManager } from "@/hooks/use-chat";
import { CHAT_MODELS, PROVIDERS } from "@/lib/config/types";
import { IDocument } from "@/lib/document/types";
import { HumanMessage } from "@langchain/core/messages";
import { AIMessageChunk } from "@langchain/core/messages";
import { DocumentManager } from "@/lib/document/manager";
import { useLoading } from "@/contexts/loading-context";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { ChatCompletionReasoningEffort } from "openai/resources/chat/completions";

export function ChatPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { startLoading, stopLoading } = useLoading();

  // Use singleton instances
  const configManager = React.useMemo(() => ConfigManager.getInstance(), []);
  const chatManager = useChatManager();
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
  const [error, setError] = React.useState<string | null>(null);

  const config = useLiveQuery(async () => await configManager.getConfig());
  const chatSession = useChatSession(id);
  const [selectedModel, setSelectedModel, chatHistoryDB] = useSelectedModel(id, config);

  // Show loading screen during initial config load
  useEffect(() => {
    if (!config) {
      startLoading("Loading configuration...");
      return;
    }
    stopLoading();
  }, [config, startLoading, stopLoading]);

  const selectedModelName = React.useMemo(() => (
    CHAT_MODELS.find(model => model.model === selectedModel)?.name || "Select a model"
  ), [selectedModel]);

  const selectedModelProvider = React.useMemo(() => {
    const model = CHAT_MODELS.find(model => model.model === selectedModel);
    return model?.provider;
  }, [selectedModel]);

  const isModelReasoning = React.useMemo(() => {
    const model = CHAT_MODELS.find(model => model.model === selectedModel);
    return model?.isReasoning || false;
  }, [selectedModel]);

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
        // Get the new model details
        const newModel = CHAT_MODELS.find(m => m.model === model);
        
        // Set default reasoning effort if the model supports it
        let reasoningEffort = session.reasoningEffort;
        if (newModel?.isReasoning && !reasoningEffort) {
          reasoningEffort = newModel.provider === PROVIDERS.anthropic ? 
            "disabled" as ChatCompletionReasoningEffort : 
            "low" as ChatCompletionReasoningEffort;
        } else if (!newModel?.isReasoning) {
          reasoningEffort = null;
        }
        
        await chatHistoryDB.sessions.update(id, {
          ...session,
          model,
          reasoningEffort,
          updatedAt: Date.now()
        });
      }
    }
    setSelectedModel(model);
    setError(null); // Clear any previous errors when changing models
  }, [config, id, setSelectedModel, configManager, chatHistoryDB.sessions]);

  const handleReasoningEffortChange = React.useCallback(async (effort: string) => {
    if (!id || id === "new" || !chatSession) return;
    
    try {
      await chatHistoryDB.sessions.update(id, {
        ...chatSession,
        reasoningEffort: effort as ChatCompletionReasoningEffort,
        updatedAt: Date.now()
      });
    } catch (error) {
      console.error("Error updating reasoning effort:", error);
      toast.error("Failed to update reasoning effort");
    }
  }, [id, chatSession, chatHistoryDB.sessions]);

  const handleSendMessage = React.useCallback(async () => {
    // Clear any previous errors
    setError(null);
    
    // Check if trying to use Ollama when it's not available or not configured
    if (selectedModelProvider === PROVIDERS.ollama && config) {
      if (!config.ollama_base_url || config.ollama_base_url.trim() === '') {
        setError(`Ollama base URL is not configured. Please set a valid URL in the settings.`);
        return;
      }
      
      if (!config.ollama_available) {
        setError(`Ollama server is not available. Please check your connection to ${config.ollama_base_url}`);
        return;
      }
    }
    
    let chatId = id;
    let isNewChat = false;
    if (id === "new") {
      chatId = crypto.randomUUID();
      isNewChat = true;
      navigate(`/chat/${chatId}`, { replace: true });
    }
    
    // Reset controller before starting a new chat
    chatManager.resetController();
    
    try {
      await generateMessage(
        chatId, 
        input, 
        attachments, 
        isGenerating, 
        setIsGenerating, 
        setStreamingHumanMessage, 
        setStreamingAIMessageChunks, 
        chatManager, 
        setInput, 
        setAttachments
      );

      if (isNewChat && chatId) {
        const chatName = await chatManager.chatChain(
          `Based on this user message, generate a very concise (max 40 chars) but descriptive name for this chat: "${input}"`,
          "You are a helpful assistant that generates concise chat names. Respond only with the name, no quotes or explanation.",
          chatSession?.reasoningEffort as ChatCompletionReasoningEffort
        );
        await chatHistoryDB.sessions.update(chatId, {
          name: String(chatName.content)
        });
      }
    } catch (error) {
      console.error("Error sending message:", error);
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("An unknown error occurred while sending your message");
      }
    }
  }, [id, input, attachments, isGenerating, chatManager, navigate, chatHistoryDB.sessions, selectedModelProvider, config, chatSession]);
  
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

    // Clear any previous errors
    setError(null);
    
    // Check if trying to use Ollama when it's not available or not configured
    if (selectedModelProvider === PROVIDERS.ollama && config) {
      if (!config.ollama_base_url || config.ollama_base_url.trim() === '') {
        setError(`Ollama base URL is not configured. Please set a valid URL in the settings.`);
        return;
      }
      
      if (!config.ollama_available) {
        setError(`Ollama server is not available. Please check your connection to ${config.ollama_base_url}`);
        return;
      }
    }

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

      // Reset controller before regenerating
      chatManager.resetController();
      
      await generateMessage(
        id, 
        content, 
        [], 
        isGenerating, 
        setIsGenerating, 
        setStreamingHumanMessage, 
        setStreamingAIMessageChunks, 
        chatManager, 
        setInput, 
        setAttachments
      );
    } catch (error) {
      console.error("Error editing message:", error);
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("An unknown error occurred while editing your message");
      }
    }
  }, [id, editingMessageIndex, chatSession, isGenerating, chatHistoryDB.sessions, chatManager, selectedModelProvider, config]);

  const handleRegenerateMessage = React.useCallback(async (index: number) => {
    if (!id || !chatSession || isGenerating) return;

    // Clear any previous errors
    setError(null);
    
    // Check if trying to use Ollama when it's not available or not configured
    if (selectedModelProvider === PROVIDERS.ollama && config) {
      if (!config.ollama_base_url || config.ollama_base_url.trim() === '') {
        setError(`Ollama base URL is not configured. Please set a valid URL in the settings.`);
        return;
      }
      
      if (!config.ollama_available) {
        setError(`Ollama server is not available. Please check your connection to ${config.ollama_base_url}`);
        return;
      }
    }

    try {
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
      
      // Reset controller before regenerating
      chatManager.resetController();
      
      await generateMessage(
        id, 
        content, 
        [], 
        isGenerating, 
        setIsGenerating, 
        setStreamingHumanMessage, 
        setStreamingAIMessageChunks, 
        chatManager, 
        setInput, 
        setAttachments
      );
    } catch (error) {
      console.error("Error regenerating message:", error);
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("An unknown error occurred while regenerating the message");
      }
    }
  }, [id, chatSession, isGenerating, chatHistoryDB.sessions, chatManager, selectedModelProvider, config]);

  const stopGenerating = React.useCallback(() => {
    chatManager.controller.abort();
    setIsGenerating(false);
  }, [chatManager]);

  return (
    <div className="flex flex-col h-screen p-2">
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
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
        stopGenerating={stopGenerating}
        selectedModelProvider={selectedModelProvider}
        isModelReasoning={isModelReasoning}
        reasoningEffort={chatSession?.reasoningEffort}
        onReasoningEffortChange={handleReasoningEffortChange}
      />
      <FilePreviewDialog
        document={previewDocument}
        onClose={() => setPreviewDocument(null)}
      />
    </div>
  );
}