import { CHAT_MODELS } from "@/lib/config/types";
import { ModelList } from "./ModelList";
import { ChatModelsProps } from "../types";

export const ChatModels = ({ config }: ChatModelsProps) => {
  if (!config) return null;
  
  return (
    <ModelList
      type="chat"
      models={CHAT_MODELS}
      config={config}
      enabledModels={config.enabled_chat_models || []}
      defaultModel={config.default_chat_model}
      title="Chat Models"
      description="Enable or disable available chat models"
    />
  );
} 