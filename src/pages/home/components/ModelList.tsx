import { useState } from "react";
import { PROVIDERS, PROVIDERS_CONN_ARGS_MAP, ChatModel, BaseModel } from "@/lib/config/types";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useUpdateConfig, useUpdateEnabledModels } from "../hooks";
import { ModelListProps } from "../types";

export const ModelList = ({ type, models, config, enabledModels, defaultModel, title, description }: ModelListProps) => {
  const updateEnabledModels = useUpdateEnabledModels(type);
  const updateConfig = useUpdateConfig();
  const [selectedDefault, setSelectedDefault] = useState(defaultModel);

  const handleModelToggle = async (model: BaseModel, enabled: boolean) => {
    await updateEnabledModels.mutateAsync({
      modelId: model.model,
      enabled,
    });
  };

  const handleDefaultModelChange = async (modelId: string) => {
    setSelectedDefault(modelId);
    await updateConfig.mutateAsync({
      [type === 'chat' ? 'default_chat_model' : 'default_embedding_model']: modelId,
    });
  };

  if (!config) return null;

  const isProviderConfigured = (provider: PROVIDERS) => {
    // Special case for OpenAI - only require API key
    if (provider === PROVIDERS.openai) {
      return config.openai_api_key && config.openai_api_key.trim().length > 0;
    }
    
    // For other providers, check all required fields
    return PROVIDERS_CONN_ARGS_MAP[provider].every(
      (arg) => {
        const value = config[arg as keyof typeof config];
        return typeof value === 'string' && value.trim().length > 0;
      }
    );
  };

  const handleSelectAll = async () => {
    for (const model of models) {
      if (isProviderConfigured(model.provider) && !enabledModels.includes(model.model)) {
        await updateEnabledModels.mutateAsync({ modelId: model.model, enabled: true });
      }
    }
  };

  const handleUnselectAll = async () => {
    for (const model of models) {
      if (enabledModels.includes(model.model)) {
        await updateEnabledModels.mutateAsync({ modelId: model.model, enabled: false });
      }
    }
    // Then clear the default model
    updateConfig.mutate({ [`default_${type}_model`]: '' });
  };

  return (
    <Card className="h-[calc(100vh-12rem)]">
      <CardHeader className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleSelectAll}
              disabled={models.length === 0 || updateConfig.isPending}
            >
              Select All
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleUnselectAll}
              disabled={enabledModels.length === 0 || updateConfig.isPending}
            >
              Unselect All
            </Button>
          </div>
        </div>
        <div>
          <Select value={selectedDefault} onValueChange={handleDefaultModelChange}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select default model" />
            </SelectTrigger>
            <SelectContent>
              {models.filter(model => enabledModels.includes(model.model)).map(model => (
                <SelectItem key={model.model} value={model.model}>
                  {model.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {enabledModels.length === 0 && (
            <p className="text-sm text-muted-foreground mt-2">
              Enable at least one model to set as default
            </p>
          )}
        </div>
      </CardHeader>
      <ScrollArea className="h-[calc(100%-13rem)] px-6">
        <div className="space-y-4 pb-6">
          {models.map((model) => {
            const providerConfigured = isProviderConfigured(model.provider);
            const isChatModel = (m: BaseModel): m is ChatModel => 'modalities' in m;
            
            return (
              <div key={model.model} className={`p-4 rounded-lg border ${providerConfigured ? '' : 'opacity-50'}`}>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <h3 className="font-medium">{model.name}</h3>
                    <p className="text-sm text-muted-foreground">{model.description}</p>
                    {!providerConfigured && (
                      <p className="text-sm text-muted-foreground">
                        Configure {model.provider} provider first
                      </p>
                    )}
                    {isChatModel(model) && model.modalities && model.modalities.length > 0 && (
                      <div className="flex gap-2 flex-wrap pt-2">
                        {model.modalities.map((modality) => (
                          <Badge key={modality} variant="outline" className="capitalize">
                            {modality.toLowerCase()}
                          </Badge>
                        ))}
                      </div>
                    )}
                    {isChatModel(model) && model.isReasoning && (
                      <div className="flex gap-2 flex-wrap pt-2">
                        <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800">
                          Thinking
                        </Badge>
                      </div>
                    )}
                  </div>
                  <Switch 
                    checked={enabledModels.includes(model.model)}
                    onCheckedChange={(checked) => {
                      handleModelToggle(model, checked);
                      if (!checked && selectedDefault === model.model) {
                        handleDefaultModelChange('');
                      }
                    }}
                    disabled={!providerConfigured || updateEnabledModels.isPending}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </Card>
  );
} 