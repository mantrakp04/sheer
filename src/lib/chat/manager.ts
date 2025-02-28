import { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { Embeddings } from "@langchain/core/embeddings";
import { CHAT_MODELS, EMBEDDING_MODELS, IConfig, MODALITIES, PROVIDERS } from "@/lib/config/types";
import { ConfigManager } from "@/lib/config/manager";
import { ChatOllama, OllamaEmbeddings } from "@langchain/ollama";
import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai";
import { ChatAnthropic } from "@langchain/anthropic";
import { ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { IDocument } from "../document/types";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { Tool } from "langchain/tools";
import { Calculator } from "@langchain/community/tools/calculator";
import { AgentExecutor, createToolCallingAgent } from "langchain/agents";
import { RunnableWithMessageHistory } from "@langchain/core/runnables";
import { DexieChatMemory } from "./memory";
import { DocumentManager } from "@/lib/document/manager";
import { Document } from "@langchain/core/documents";
import { HumanMessage, ToolMessage } from "@langchain/core/messages";
import { IChatSession } from "./types";
import { ChatHFInference } from "./chat-hf";
import { ChatCompletionReasoningEffort } from "openai/resources/chat/completions";

// Define an error interface for better type safety
interface ErrorWithMessage {
  message: string;
}

function isErrorWithMessage(error: unknown): error is ErrorWithMessage {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as Record<string, unknown>).message === 'string'
  );
}

function toErrorWithMessage(error: unknown): ErrorWithMessage {
  if (isErrorWithMessage(error)) return error;
  
  try {
    return new Error(String(error));
  } catch {
    // fallback in case there's an error stringifying the error
    return new Error('Unknown error');
  }
}

function getErrorMessage(error: unknown): string {
  return toErrorWithMessage(error).message;
}

export class ChatManager {
  model!: BaseChatModel;
  embeddings!: Embeddings | null;
  controller: AbortController;
  configManager: ConfigManager;
  config!: IConfig;
  documentManager: DocumentManager;
  private static instance: ChatManager | null = null;

  constructor() {
    this.controller = new AbortController();
    this.configManager = ConfigManager.getInstance();
    this.documentManager = DocumentManager.getInstance();
    this.initializeConfig();
  }

  public static getInstance(): ChatManager {
    if (!ChatManager.instance) {
      ChatManager.instance = new ChatManager();
    }
    return ChatManager.instance;
  }

  private async initializeConfig() {
    this.config = await this.configManager.getConfig();
  }

  public resetController() {
    this.controller = new AbortController();
  }

  private async getChatModel(modelName: string, reasoningEffort?: ChatCompletionReasoningEffort): Promise<BaseChatModel> {
    // Ensure config is loaded
    if (!this.config) {
      await this.initializeConfig();
    }
    
    const model = CHAT_MODELS.find(m => m.model === modelName);

    if (!model) {
      throw new Error(`Chat model ${modelName} not found`);
    }

    try {
      switch (model.provider) {
        case PROVIDERS.ollama:
          return new ChatOllama({
            baseUrl: this.config.ollama_base_url,
            model: model.model,
          });

        case PROVIDERS.openai:
          return new ChatOpenAI({
            modelName: this.config.openai_model && this.config.openai_model.trim() !== '' ? this.config.openai_model : model.model,
            apiKey: this.config.openai_api_key,
            reasoningEffort: model.isReasoning ? reasoningEffort : undefined,
            maxCompletionTokens: -1,
            configuration: {
              baseURL: this.config.openai_base_url && this.config.openai_base_url.trim() !== '' ? this.config.openai_base_url : undefined,
            }
          });

        case PROVIDERS.anthropic: {
          const isThinkingDisabled = !reasoningEffort || String(reasoningEffort) === "disabled";
          
          return new ChatAnthropic({
            modelName: model.model,
            apiKey: this.config.anthropic_api_key,
            maxTokens: 64000,
            thinking: model.isReasoning && !isThinkingDisabled ? {
              type: "enabled",
              budget_tokens:
                reasoningEffort === "high" ? 32000 :
                reasoningEffort === "medium" ? 16000 :
                8000 // low
            } : undefined // disabled
          });
        }

        case PROVIDERS.gemini:
          return new ChatGoogleGenerativeAI({
            modelName: model.model,
            apiKey: this.config.gemini_api_key,
          });

        case PROVIDERS.huggingface:
          return ChatHFInference({
            modelName: model.model,
            apiKey: this.config.hf_token,
          });

        default:
          throw new Error(`Provider ${model.provider} not implemented yet for chat models`);
      }
    } catch (error: unknown) {
      console.error(`Error creating chat model ${modelName}:`, error);
      throw new Error(`Failed to initialize chat model ${modelName}: ${getErrorMessage(error)}`);
    }
  }

  private async getEmbeddingModel(modelName: string): Promise<Embeddings> {
    // Ensure config is loaded
    if (!this.config) {
      await this.initializeConfig();
    }
    
    if (!modelName) {
      throw new Error("No embedding model specified");
    }
    
    const model = EMBEDDING_MODELS.find(m => m.model === modelName);

    if (!model) {
      throw new Error(`Embedding model ${modelName} not found`);
    }

    // Check if trying to use Ollama when it's not available
    if (model.provider === PROVIDERS.ollama) {
      // Check if Ollama base URL is not configured
      if (!this.config.ollama_base_url || this.config.ollama_base_url.trim() === '') {
        throw new Error(`Ollama base URL is not configured. Please set a valid URL in the settings.`);
      }
      
      // Check if Ollama is not available
      if (!this.config.ollama_available) {
        throw new Error(`Ollama server is not available. Please check your connection to ${this.config.ollama_base_url}`);
      }
    }

    try {
      switch (model.provider) {
        case PROVIDERS.ollama:
          return new OllamaEmbeddings({
            baseUrl: this.config.ollama_base_url,
            model: model.model,
          });

        case PROVIDERS.openai:
          return new OpenAIEmbeddings({
            modelName: model.model,
            apiKey: this.config.openai_api_key,
          });

        case PROVIDERS.gemini:
          return new GoogleGenerativeAIEmbeddings({
            modelName: model.model,
            apiKey: this.config.gemini_api_key,
          });

        default:
          throw new Error(`Provider ${model.provider} not implemented yet for embedding models`);
      }
    } catch (error: unknown) {
      console.error(`Error creating embedding model ${modelName}:`, error);
      throw new Error(`Failed to initialize embedding model ${modelName}: ${getErrorMessage(error)}`);
    }
  }

  private async getAgent(
    enabledTools: string[] = [],
  ) {
    const prompt = ChatPromptTemplate.fromMessages([
      ["system", "You are a helpful assistant"],
      ["placeholder", "{chat_history}"],
      ["human", "{input}"],
      ["placeholder", "{agent_scratchpad}"],
    ]);

    const tools: Tool[] = [];
    if (enabledTools?.includes("calculator")) {
      tools.push(new Calculator());
    }

    const agent = createToolCallingAgent({
      llm: this.model,
      tools,
      prompt,
    });

    const agentExecutor = new AgentExecutor({
      agent,
      tools,
      returnIntermediateSteps: true,
    })

    return new RunnableWithMessageHistory({
      runnable: agentExecutor,
      getMessageHistory: (sessionId: string) => new DexieChatMemory(sessionId),
      inputMessagesKey: "input",
      historyMessagesKey: "chat_history"
    });
  }

  private async createMessageWithAttachments(
    documents?: IDocument[],
    chatSession?: IChatSession,
  ): Promise<HumanMessage> {
    if (!documents || documents.length === 0) {
      return new HumanMessage({ content: "" });
    }
  
    const currentModel = CHAT_MODELS.find(
      m => m.model === (chatSession?.model || this.config.default_chat_model)
    );
    
    if (!currentModel) {
      throw new Error(`Model ${chatSession?.model || this.config.default_chat_model} not found in CHAT_MODELS`);
    }
  
    // Initialize containers for different file types
    const processedContent: {
      docs: Document[];
      images: File[];
      audios: File[];
      videos: File[];
      pdfs: File[];
    } = {
      docs: [],
      images: [],
      audios: [],
      videos: [],
      pdfs: []
    };
  
    // Process and categorize documents based on type and model capabilities
    for (const doc of documents) {
      const file = await this.documentManager.getDocument(doc.id);
      
      switch (doc.type) {
        case "image":
          if (currentModel.modalities.includes(MODALITIES.image)) {
            processedContent.images.push(file);
          }
          break;
        case "audio":
          if (currentModel.modalities.includes(MODALITIES.audio)) {
            processedContent.audios.push(file);
          }
          break;
        case "video":
          if (currentModel.modalities.includes(MODALITIES.video)) {
            processedContent.videos.push(file);
          }
          break;
        case "pdf":
          if (currentModel.modalities.includes(MODALITIES.pdf)) {
            processedContent.pdfs.push(file);
          } else {
            processedContent.docs.push(...(await this.documentManager.loadDocument(doc.id)));
          }
          break;
        default:
          processedContent.docs.push(...(await this.documentManager.loadDocument(doc.id)));
          break;
      }
    }
  
    // Provider-specific content formatting
    const providerFormatters = {
      [PROVIDERS.openai]: async () => {
        const content = [];
        
        // Add images
        for (const image of processedContent.images) {
          const base64 = Buffer.from(await image.arrayBuffer()).toString("base64");
          content.push({
            type: "image_url",
            image_url: {
              url: `data:${image.type};base64,${base64}`
            }
          });
        }
        
        // Add text documents
        for (const doc of processedContent.docs) {
          content.push({
            type: "text",
            text: `File name: ${doc.metadata.name}\nFile content: ${doc.pageContent}`
          });
        }
        
        return content;
      },
  
      [PROVIDERS.anthropic]: async () => {
        const content = [];
        
        // Add images
        for (const image of processedContent.images) {
          const base64 = Buffer.from(await image.arrayBuffer()).toString("base64");
          content.push({
            type: "image_url",
            image_url: {
              url: `data:${image.type};base64,${base64}`
            }
          });
        }
        
        // Add PDFs
        for (const pdf of processedContent.pdfs) {
          content.push({
            type: "document",
            source: {
              type: "base64",
              data: Buffer.from(await pdf.arrayBuffer()).toString("base64"),
              media_type: "application/pdf",
            }
          });
        }
        
        // Add text documents
        for (const doc of processedContent.docs) {
          content.push({
            type: "text",
            text: `File name: ${doc.metadata.name}\nFile content: ${doc.pageContent}`
          });
        }
        
        return content;
      },
  
      [PROVIDERS.ollama]: async () => {
        // Ollama only supports text content
        return processedContent.docs.map(doc => ({
          type: "text",
          text: `File name: ${doc.metadata.name}\nFile content: ${doc.pageContent}`
        }));
      },
  
      [PROVIDERS.gemini]: async () => {
        const content = [];
        
        // Process media files (images, audio, video)
        const mediaFiles = [...processedContent.images, ...processedContent.audios, ...processedContent.videos, ...processedContent.pdfs];
        for (const media of mediaFiles) {
          content.push({
            type: "media",
            mimeType: media.type,
            data: Buffer.from(await media.arrayBuffer()).toString("base64")
          });
        }
        
        // Add text documents
        for (const doc of processedContent.docs) {
          content.push({
            type: "text",
            text: `File name: ${doc.metadata.name}\nFile content: ${doc.pageContent}`
          });
        }
        
        return content;
      },

      [PROVIDERS.huggingface]: async () => {
        // Hugging Face Inference API primarily supports text
        return processedContent.docs.map(doc => ({
          type: "text",
          text: `File name: ${doc.metadata.name}\nFile content: ${doc.pageContent}`
        }));
      }
    };
  
    // Get the appropriate formatter for the current provider
    const formatter = providerFormatters[currentModel.provider];
    if (!formatter) {
      throw new Error(`Provider ${currentModel.provider} not implemented for message attachments`);
    }
  
    // Format the content according to provider specifications
    const content = await formatter();
  
    return new HumanMessage({
      content,
      response_metadata: {
        documents: documents.map(document => ({
          id: document.id,
          name: document.name,
          source: document.path,
          type: document.type,
          createdAt: document.createdAt,
        }))
      }
    });
  }

  async *chat(
    sessionId: string,
    input: string,
    documents?: IDocument[],
  ) {
    const memory = new DexieChatMemory(sessionId);
    await memory.initialize(); // Initialize memory once at the start
    
    const chatSession = await memory.db.table("sessions").get(sessionId);
    
    this.model = await this.getChatModel(
      chatSession?.model || this.config.default_chat_model,
      chatSession?.reasoningEffort as ChatCompletionReasoningEffort
    );
    try {
      this.embeddings = await this.getEmbeddingModel(chatSession?.embedding_model || this.config.default_embedding_model || null);
    } catch (error) {
      console.log(error)
    }

    const agent = await this.getAgent(chatSession?.enabled_tools || []);

    const documentMessage = await this.createMessageWithAttachments(documents, chatSession);

    if (documentMessage.content && documentMessage.content.length > 0) {
      await memory.addMessage(documentMessage);
    }

    const eventStream = await agent.streamEvents(
      { input },
      {
        configurable: {
          sessionId,
        },
        version: "v2",
        signal: this.controller.signal,
      }
    )
    let currentResponse = "";
    for await (const event of eventStream) {
      if (event.event === "on_chat_model_stream") {
        const chunk = event.data?.chunk;
        console.log(chunk)
        if (chunk) {
          currentResponse += chunk;
          yield { type: "stream", content: chunk };
        }
      } else if (event.event === "on_chat_model_end") {
        console.log(event)
        yield { type: "end", content: currentResponse, usageMetadata: event.data?.output?.usage_metadata };
      } else if (event.event === "on_tool_start") {
        yield { type: "tool_start", name: event.name, input: event.data?.input };
      } else if (event.event === "on_tool_end") {
        // Store tool interaction in memory
        console.log(event)
        await memory.addMessage(new ToolMessage({
          tool_call_id: event.name,
          content: event.data?.output,
          name: event.name,
          status: "success", // Since we're in the on_tool_end event, we know it succeeded
          artifact: event.data, // Store the full tool output data as artifact
          response_metadata: {
            input: event.data?.input,
            timestamp: Date.now()
          }
        }));
        yield { type: "tool_end", name: event.name, output: event.data?.output };
      }
    }
  }

  async chatChain(
    input: string | HumanMessage,
    systemPrompt?: string,
    reasoningEffort?: ChatCompletionReasoningEffort,
  ) {
    const model = await this.getChatModel(this.config.default_chat_model, reasoningEffort);
    const humanMessage = typeof input === "string" ? new HumanMessage(input) : input;
    return await model.invoke([
      { type: "system", content: systemPrompt || "You are a helpful assistant" },
      humanMessage
    ]);
  }
}
