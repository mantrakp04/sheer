import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ChatManager } from "@/lib/chat/manager";
import { useLiveQuery } from "dexie-react-hooks";
import { mapStoredMessageToChatMessage } from "@langchain/core/messages";
import { DexieChatMemory } from "@/lib/chat/memory";
import { ConfigManager } from "@/lib/config/manager";
import { DocumentManager } from "@/lib/document/manager";
import { toast } from "sonner";
import { Messages } from "./components/Messages";
import { Input } from "./components/Input";
import { FilePreviewDialog } from "./components/FilePreviewDialog";
import { useChatSession, useSelectedModel, generateMessage } from "./hooks";
import { CHAT_MODELS } from "@/lib/config/types";
import { IDocument } from "@/lib/document/types";
import { HumanMessage } from "@langchain/core/messages";
import { AIMessageChunk } from "@langchain/core/messages";

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
    let isNewChat = false;
    if (id === "new") {
      chatId = crypto.randomUUID();
      new DexieChatMemory(chatId);
      isNewChat = true;
      navigate(`/chat/${chatId}`, { replace: true });
    }
    await generateMessage(chatId, input, attachments, isGenerating, setIsGenerating, setStreamingHumanMessage, setStreamingAIMessageChunks, chatManager, setInput, setAttachments);

    if (isNewChat && chatId) {
      const chatName = await chatManager.chatChain(
        `Based on this user message, generate a very concise (max 40 chars) but descriptive name for this chat: "${input}"`,
        "You are a helpful assistant that generates concise chat names. Respond only with the name, no quotes or explanation."
      );
      await chatHistoryDB.sessions.update(chatId, {
        name: String(chatName.content)
      });
    }
  }, [id, input, attachments, isGenerating, chatManager, navigate, chatHistoryDB.sessions]);
  
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

    generateMessage(id, content, [], isGenerating, setIsGenerating, setStreamingHumanMessage, setStreamingAIMessageChunks, chatManager, setInput, setAttachments);
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
    
    generateMessage(id, content, [], isGenerating, setIsGenerating, setStreamingHumanMessage, setStreamingAIMessageChunks, chatManager, setInput, setAttachments);
  }, [id, chatSession, isGenerating, chatHistoryDB.sessions, chatManager]);

  const stopGenerating = React.useCallback(() => {
    chatManager.controller.abort();
    setIsGenerating(false);
  }, [chatManager, setIsGenerating]);

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
        stopGenerating={stopGenerating}
      />
      <FilePreviewDialog
        document={previewDocument}
        onClose={() => setPreviewDocument(null)}
      />
    </div>
  );
}