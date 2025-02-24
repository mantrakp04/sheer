import { StoredMessage } from "@langchain/core/messages";

export interface IChatSession {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  messages: StoredMessage[];
  model: string;
  embedding_model: string;
  enabled_tools: string[];
}
