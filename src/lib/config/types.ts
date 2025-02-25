// import ollama from "ollama/browser";

export interface IConfig {
  id: string;
  createdAt: number;
  updatedAt: number;
  default_chat_model: string;
  enabled_chat_models: string[];
  default_embedding_model: string;
  enabled_embedding_models: string[];
  ollama_base_url: string;
  openai_api_key: string;
  openai_base_url: string;
  openai_model: string;
  anthropic_api_key: string;
  gemini_api_key: string;
  ollama_available: boolean;
  hf_token: string;
  hf_model: string;
  hf_custom_models: string;
}

export const DEFAULT_CONFIG: Omit<IConfig, 'id' | 'createdAt' | 'updatedAt'> = {
  default_chat_model: '',
  enabled_chat_models: [],
  default_embedding_model: '',
  enabled_embedding_models: [],
  ollama_base_url: 'http://localhost:11434',
  openai_api_key: '',
  openai_base_url: '',
  openai_model: '',
  anthropic_api_key: '',
  gemini_api_key: '',
  ollama_available: false,
  hf_token: '',
  hf_model: '',
  hf_custom_models: '',
};

export enum PROVIDERS {
  openai = 'openai',
  anthropic = 'anthropic',
  ollama = 'ollama',
  gemini = 'gemini',
  huggingface = 'huggingface',
}

export enum MODALITIES {
  image = 'image',
  audio = 'audio',
  video = 'video',
  pdf = 'pdf',
}

export const PROVIDERS_CONN_ARGS_MAP: Record<PROVIDERS, string[]> = {
  [PROVIDERS.openai]: ['openai_api_key', 'openai_base_url', 'openai_model'],
  [PROVIDERS.anthropic]: ['anthropic_api_key'],
  [PROVIDERS.ollama]: ['ollama_base_url'],
  [PROVIDERS.gemini]: ['gemini_api_key'],
  [PROVIDERS.huggingface]: ['hf_token', 'hf_custom_models'],
};

export interface BaseModel {
  name: string;
  provider: PROVIDERS;
  model: string;
  description: string;
}

export interface ChatModel extends BaseModel {
  modalities: MODALITIES[];
  isReasoning: boolean;
  reasoningArgs?: string[];
}

export type EmbeddingModel = BaseModel

// Base models that are always available
export const BASE_CHAT_MODELS: ChatModel[] = [
  {
    name: 'GPT-4o',
    provider: PROVIDERS.openai,
    model: 'gpt-4o',
    description: 'OpenAI GPT-4o',
    modalities: [MODALITIES.image],
    isReasoning: false,
  },
  {
    name: 'GPT-4o Mini',
    provider: PROVIDERS.openai,
    model: 'gpt-4o-mini',
    description: 'OpenAI GPT-4o Mini',
    modalities: [MODALITIES.image],
    isReasoning: false,
  },
  {
    name: 'o3-mini',
    provider: PROVIDERS.openai,
    model: 'o3-mini',
    description: 'OpenAI o3-mini',
    modalities: [],
    isReasoning: true,
    reasoningArgs: ['low', 'medium', 'high'],
  },
  {
    name: 'Claude 3.5 Sonnet',
    provider: PROVIDERS.anthropic,
    model: 'claude-3-5-sonnet-20240620',
    description: 'Anthropic Claude 3.5 Sonnet',
    modalities: [MODALITIES.image, MODALITIES.pdf],
    isReasoning: false,
  },
  {
    name: 'Claude 3.5 Haiku',
    provider: PROVIDERS.anthropic,
    model: 'claude-3-5-haiku-20241022',
    description: 'Anthropic Claude 3.5 Haiku',
    modalities: [MODALITIES.image, MODALITIES.pdf],
    isReasoning: false,
  },
  {
    name: 'Claude 3.7 Sonnet',
    provider: PROVIDERS.anthropic,
    model: 'claude-3-7-sonnet-20250219',
    description: 'Anthropic Claude 3.7 Sonnet',
    modalities: [MODALITIES.image, MODALITIES.pdf],
    isReasoning: true,
    reasoningArgs: ['disabled', 'low', 'medium', 'high'],
  },
  {
    name: 'Gemini 2.0 Flash',
    provider: PROVIDERS.gemini,
    model: 'gemini-2.0-flash',
    description: 'Google Gemini 2.0 Flash',
    modalities: [MODALITIES.image, MODALITIES.pdf, MODALITIES.audio, MODALITIES.video],
    isReasoning: false,
  },
  {
    name: 'Gemini 2.0 Flash Lite',
    provider: PROVIDERS.gemini,
    model: 'gemini-2.0-flash-lite-preview-02-05',
    description: 'Google Gemini 2.0 Flash Lite',
    modalities: [MODALITIES.image, MODALITIES.pdf, MODALITIES.audio, MODALITIES.video],
    isReasoning: false,
  },
  {
    name: 'Gemini 2.0 Pro Exp',
    provider: PROVIDERS.gemini,
    model: 'gemini-2.0-pro-exp-02-05',
    description: 'Google Gemini 2.0 Pro Exp',
    modalities: [MODALITIES.image, MODALITIES.pdf, MODALITIES.audio, MODALITIES.video],
    isReasoning: false,
  },
  {
    name: 'Gemini 2.0 Flash Thinking Exp',
    provider: PROVIDERS.gemini,
    model: 'gemini-2.0-flash-thinking-exp-01-21',
    description: 'Google Gemini 2.0 Flash Thinking Exp',
    modalities: [MODALITIES.image, MODALITIES.pdf, MODALITIES.audio, MODALITIES.video],
    isReasoning: false,
  },
  {
    name: 'Hugging Face - Mistral',
    provider: PROVIDERS.huggingface,
    model: 'mistralai/Mistral-7B-Instruct-v0.2',
    description: 'Mistral AI 7B Instruct model',
    modalities: [],
    isReasoning: false,
  },
  {
    name: 'Hugging Face - Llama 2',
    provider: PROVIDERS.huggingface,
    model: 'meta-llama/Llama-2-7b-chat-hf',
    description: 'Meta Llama 2 7B Chat',
    modalities: [],
    isReasoning: false,
  },
];

// Base embedding models that are always available
export const BASE_EMBEDDING_MODELS: EmbeddingModel[] = [
  {
    name: 'OpenAI Embeddings',
    provider: PROVIDERS.openai,
    model: 'text-embedding-3-small',
    description: 'OpenAI Embeddings',
  },
  {
    name: 'Gemini Embeddings',
    provider: PROVIDERS.gemini,
    model: 'text-embedding-005',
    description: 'Google GenAI Embeddings',
  },
];

// Function to safely get custom OpenAI models
export async function getCustomOpenAIModels(openaiModel?: string): Promise<ChatModel[]> {
  if (!openaiModel || openaiModel.trim() === '') {
    return [];
  }

  // Split the comma-separated list of models into an array
  const models = openaiModel.split(',').map(model => model.trim());

  return models.map(model => ({
    name: `Custom: ${model}`,
    provider: PROVIDERS.openai,
    model: model,
    description: `Custom OpenAI model: ${model}`,
    modalities: [MODALITIES.image],
    isReasoning: false,
  }));
}

// Function to safely get Ollama models
export async function getOllamaModels(baseUrl?: string): Promise<ChatModel[]> {
  // Skip if no base URL is provided or it's empty
  if (!baseUrl || baseUrl.trim() === '') {
    return [];
  }
  
  try {
    // We can't directly configure Ollama's base URL through the API
    // Instead, we'll use the fetch API with the provided base URL
    const response = await fetch(`${baseUrl}/api/tags`);
    if (!response.ok) {
      throw new Error(`Failed to connect to Ollama server: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.models.map(
      (model: { name: string }) => ({
        name: model.name,
        model: model.name,
        description: 'Ollama model',
        provider: PROVIDERS.ollama,
        modalities: [],
        isReasoning: false,
      })
    );
  } catch (error) {
    console.error("Failed to fetch Ollama models:", error);
    return [];
  }
}

// Function to safely get Ollama embedding models
export async function getOllamaEmbeddingModels(baseUrl?: string): Promise<EmbeddingModel[]> {
  // Skip if no base URL is provided or it's empty
  if (!baseUrl || baseUrl.trim() === '') {
    return [];
  }
  
  try {
    // We can't directly configure Ollama's base URL through the API
    // Instead, we'll use the fetch API with the provided base URL
    const response = await fetch(`${baseUrl}/api/tags`);
    if (!response.ok) {
      throw new Error(`Failed to connect to Ollama server: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.models.map(
      (model: { name: string }) => ({
        name: model.name,
        model: model.name,
        description: 'Ollama Embeddings',
        provider: PROVIDERS.ollama,
      })
    );
  } catch (error) {
    console.error("Failed to fetch Ollama embedding models:", error);
    return [];
  }
}

// Function to safely get custom HuggingFace models
export async function getCustomHuggingFaceModels(hfCustomModels?: string): Promise<ChatModel[]> {
  if (!hfCustomModels || hfCustomModels.trim() === '') {
    return [];
  }

  // Split the comma-separated list of models into an array
  const models = hfCustomModels.split(',').map(model => model.trim());

  return models.map(model => ({
    name: `HF Custom: ${model.split('/').pop() || model}`,
    provider: PROVIDERS.huggingface,
    model: model,
    description: `Custom Hugging Face model: ${model}`,
    modalities: [MODALITIES.image],
    isReasoning: false,
  }));
}

// Initialize with base models
export let CHAT_MODELS: ChatModel[] = [...BASE_CHAT_MODELS];
export let EMBEDDING_MODELS: EmbeddingModel[] = [...BASE_EMBEDDING_MODELS];

// Function to load all models including Ollama if available
export async function loadAllModels(ollamaBaseUrl?: string, openaiModel?: string, hfCustomModels?: string) {
  try {
    // Get the Ollama base URL from the config if not provided
    const configManager = (await import('./manager')).ConfigManager.getInstance();
    const config = await configManager.getConfig();
    if (ollamaBaseUrl === undefined) {
      try {
        ollamaBaseUrl = config.ollama_base_url;
      } catch (error) {
        console.error("Error getting config for Ollama base URL:", error);
        ollamaBaseUrl = '';
      }
    }
    
    // Skip loading Ollama models if base URL is not configured
    let ollamaModels: ChatModel[] = [];
    let ollamaEmbeddingModels: EmbeddingModel[] = [];
    
    if (ollamaBaseUrl && ollamaBaseUrl.trim() !== '') {
      ollamaModels = await getOllamaModels(ollamaBaseUrl);
      ollamaEmbeddingModels = await getOllamaEmbeddingModels(ollamaBaseUrl);
    }

    const customOpenAIModels = await getCustomOpenAIModels(openaiModel || config.openai_model);
    const customHuggingFaceModels = await getCustomHuggingFaceModels(hfCustomModels || config.hf_custom_models);
    
    CHAT_MODELS = [
      ...BASE_CHAT_MODELS, 
      ...ollamaModels, 
      ...customOpenAIModels,
      ...customHuggingFaceModels
    ];
    EMBEDDING_MODELS = [...BASE_EMBEDDING_MODELS, ...ollamaEmbeddingModels];
    
    return {
      ollamaAvailable: ollamaModels.length > 0,
      chatModels: CHAT_MODELS,
      embeddingModels: EMBEDDING_MODELS
    };
  } catch (error) {
    console.error("Error loading models:", error);
    return {
      ollamaAvailable: false,
      chatModels: BASE_CHAT_MODELS,
      embeddingModels: BASE_EMBEDDING_MODELS
    };
  }
}
