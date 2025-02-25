import { IConfig, BaseModel } from "@/lib/config/types";

export interface ProvidersProps {
  config: IConfig | undefined;
}

export interface ModelListProps {
  type: 'chat' | 'embedding';
  models: BaseModel[];
  config: IConfig | undefined;
  enabledModels: string[];
  defaultModel: string;
  title: string;
  description: string;
}

export interface ChatModelsProps {
  config: IConfig | undefined;
}

export interface EmbeddingModelsProps {
  config: IConfig | undefined;
}

export interface OthersProps {
  config: IConfig | undefined;
} 