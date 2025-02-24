import React from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { ChatHistoryDB } from "@/lib/chat/memory";
import { Config, ChatSession } from "./types";
import { HumanMessage, AIMessageChunk } from "@langchain/core/messages";
import { ChatManager } from "@/lib/chat/manager";
import { IDocument } from "@/lib/document/types";
import { toast } from "sonner";

export const useChatSession = (id: string | undefined) => {
  const chatHistoryDB = React.useMemo(() => new ChatHistoryDB(), []);
  return useLiveQuery(async () => {
    if (!id || id === "new") return null;
    return await chatHistoryDB.sessions.get(id);
  }, [id]);
};

export const useSelectedModel = (id: string | undefined, config: Config | undefined) => {
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

export const generateMessage = async (
  chatId: string | undefined, 
  input: string, 
  attachments: IDocument[], 
  isGenerating: boolean, 
  setIsGenerating: (isGenerating: boolean) => void, 
  setStreamingHumanMessage: (streamingHumanMessage: HumanMessage | null) => void, 
  setStreamingAIMessageChunks: React.Dispatch<React.SetStateAction<AIMessageChunk[]>>, 
  chatManager: ChatManager,
  setInput: (input: string) => void,
  setAttachments: (attachments: IDocument[]) => void
) => {
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
        setStreamingAIMessageChunks(prev => [...prev, event.content as AIMessageChunk]);
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
}; 