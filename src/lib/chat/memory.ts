import { BaseChatMessageHistory } from "@langchain/core/chat_history";
import Dexie from "dexie";
import { IChatSession } from "./types";
import { ConfigManager } from "@/lib/config/manager";
import {
  mapStoredMessageToChatMessage,
  mapChatMessagesToStoredMessages,
  BaseMessage,
  AIMessage,
  HumanMessage,
} from "@langchain/core/messages";
import { IConfig, CHAT_MODELS, EMBEDDING_MODELS } from "@/lib/config/types";

// Create a singleton instance of ChatHistoryDB
export class ChatHistoryDB extends Dexie {
  sessions!: Dexie.Table<IChatSession, string>;
  private static instance: ChatHistoryDB | null = null;

  private constructor() {
    super("chat_history");
    this.version(1).stores({
      sessions: "id, title, createdAt, updatedAt, model, embedding_model, enabled_tools, messages",
    });
  }

  public static getInstance(): ChatHistoryDB {
    if (!ChatHistoryDB.instance) {
      ChatHistoryDB.instance = new ChatHistoryDB();
    }
    return ChatHistoryDB.instance;
  }
}

export class DexieChatMemory extends BaseChatMessageHistory {
  db: ChatHistoryDB;
  lc_namespace = ["langchain", "stores", "message", "dexie"];
  sessionId: string;
  chatHistory!: IChatSession | undefined;
  config!: IConfig;
  configManager: ConfigManager;
  initialized: boolean = false;

  constructor(sessionId: string) {
    super();
    this.sessionId = sessionId;
    this.db = ChatHistoryDB.getInstance();
    this.configManager = ConfigManager.getInstance();
  }

  async initialize() {
    if (this.initialized) return;
    
    this.config = await this.configManager.getConfig();
    this.chatHistory = await this.db.sessions.get(this.sessionId);
    
    if (!this.chatHistory) {
      const chatModel = CHAT_MODELS.find((m) => m.model === this.config.default_chat_model);
      const embeddingModel = EMBEDDING_MODELS.find((m) => m.model === this.config.default_embedding_model);
      
      if (!chatModel) {
        throw new Error("Chat or embedding models are not configured.");
      }

      this.chatHistory = {
        id: this.sessionId,
        name: "New Chat",
        createdAt: Date.now(),
        updatedAt: Date.now(),
        model: chatModel.model,
        embedding_model: embeddingModel?.model || '',
        enabled_tools: [],
        messages: [],
      };

      await this.db.sessions.put(this.chatHistory);
    }
    
    this.initialized = true;
  }

  private async updateSession() {
    if (!this.chatHistory) return;
    this.chatHistory.updatedAt = Date.now();
    await this.db.sessions.put(this.chatHistory);
  }

  async getMessages(): Promise<BaseMessage[]> {
    await this.initialize();
    return this.chatHistory?.messages.map(mapStoredMessageToChatMessage) || [];
  }

  async addMessage(message: BaseMessage): Promise<void> {
    await this.initialize();
    if (!this.chatHistory) return;
    const storedMessage = mapChatMessagesToStoredMessages([message]);
    this.chatHistory.messages.push(storedMessage[0]);
    await this.updateSession();
  }

  async addUserMessage(message: string): Promise<void> {
    await this.addMessage(new HumanMessage(message));
  }

  async addAIChatMessage(message: string): Promise<void> {
    await this.addMessage(new AIMessage(message));
  }

  async clear(): Promise<void> {
    this.chatHistory = undefined;
    this.initialized = false;
    await this.db.sessions.delete(this.sessionId);
  }
}