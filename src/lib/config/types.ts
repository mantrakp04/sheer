import ollama from "ollama/browser";

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
  anthropic_api_key: string;
  gemini_api_key: string;
}

export const DEFAULT_CONFIG: Omit<IConfig, 'id' | 'createdAt' | 'updatedAt'> = {
  default_chat_model: '',
  enabled_chat_models: [],
  default_embedding_model: '',
  enabled_embedding_models: [],
  ollama_base_url: 'http://localhost:11434',
  openai_api_key: '',
  anthropic_api_key: '',
  gemini_api_key: ''
};

export enum PROVIDERS {
  openai = 'openai',
  anthropic = 'anthropic',
  ollama = 'ollama',
  gemini = 'gemini',
}

export enum MODALITIES {
  image = 'image',
  audio = 'audio',
  video = 'video',
  pdf = 'pdf',
}

export const PROVIDERS_CONN_ARGS_MAP: Record<PROVIDERS, string[]> = {
  [PROVIDERS.openai]: ['openai_api_key'],
  [PROVIDERS.anthropic]: ['anthropic_api_key'],
  [PROVIDERS.ollama]: ['ollama_base_url'],
  [PROVIDERS.gemini]: ['gemini_api_key'],
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

export const CHAT_MODELS: ChatModel[] = [
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
  ...(await ollama.list()).models.map(
    (model) => ({
      name: model.name,
      model: model.name,
      description: 'Ollama model',
      provider: PROVIDERS.ollama,
      modalities: [],
      isReasoning: false,
    }),
  ),
]

export const EMBEDDING_MODELS: EmbeddingModel[] = [
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
  ...(await ollama.list()).models.map(
    (model) => ({
      name: model.name,
      model: model.name,
      description: 'Ollama Embeddings',
      provider: PROVIDERS.ollama,
    }),
  ),
]
