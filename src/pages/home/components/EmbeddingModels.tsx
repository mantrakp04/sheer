import { EMBEDDING_MODELS } from "@/lib/config/types";
import { ModelList } from "./ModelList";
import { EmbeddingModelsProps } from "../types";

export const EmbeddingModels = ({ config }: EmbeddingModelsProps) => {
  if (!config) return null;

  return (
    <ModelList
      type="embedding"
      models={EMBEDDING_MODELS}
      config={config}
      enabledModels={config.enabled_embedding_models || []}
      defaultModel={config.default_embedding_model}
      title="Embedding Models"
      description="Enable or disable available embedding models"
    />
  );
} 