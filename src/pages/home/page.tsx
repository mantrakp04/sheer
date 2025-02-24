import { PROVIDERS, CHAT_MODELS, EMBEDDING_MODELS, IConfig, PROVIDERS_CONN_ARGS_MAP, ChatModel, BaseModel } from "@/lib/config/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useConfig, useUpdateConfig, useUpdateEnabledModels } from "@/hooks/use-config";
import { useDebounceCallback } from "@/hooks/use-debounce";
import { useState } from "react";

const Providers = ({ config }: { config: IConfig | undefined }) => {
  const updateConfig = useUpdateConfig();
  const [localValues, setLocalValues] = useState<Record<string, string>>({});
  const debouncedUpdateConfig = useDebounceCallback((updates: Record<string, string>) => {
    updateConfig.mutate(updates);
  }, 500);

  if (!config) return null;

  return (
    <Card className="h-[calc(100vh-12rem)]">
      <CardHeader>
        <CardTitle>Providers</CardTitle>
        <CardDescription>Configure your AI provider credentials</CardDescription>
      </CardHeader>
      <ScrollArea className="h-[calc(100%-8rem)]">
        <CardContent className="space-y-8 px-6">
          {Object.values(PROVIDERS).map((provider) => (
            <div key={provider} className="space-y-4">
              <h3 className="text-lg font-semibold capitalize">{provider}</h3>
              <div className="grid gap-4">
                {PROVIDERS_CONN_ARGS_MAP[provider].map((arg) => {
                  const value = localValues[arg] ?? config[arg as keyof IConfig] ?? '';
                  return (
                    <div key={arg} className="space-y-2">
                      <label htmlFor={arg} className="text-sm font-medium">{arg.replace(/_/g, ' ').replace(/url/i, 'URL')}</label>
                      <Input 
                        id={arg} 
                        type="text" 
                        value={value} 
                        onChange={(e) => {
                          const newValue = e.target.value;
                          setLocalValues(prev => ({ ...prev, [arg]: newValue }));
                          debouncedUpdateConfig({ [arg]: newValue });
                        }}
                        disabled={updateConfig.isPending}
                        className="font-mono"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </CardContent>
      </ScrollArea>
    </Card>
  );
}

interface ModelListProps {
  type: 'chat' | 'embedding';
  models: BaseModel[];
  config: IConfig | undefined;
  enabledModels: string[];
  defaultModel: string;
  title: string;
  description: string;
}

const ModelList = ({ type, models, config, enabledModels, defaultModel, title, description }: ModelListProps) => {
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
    return PROVIDERS_CONN_ARGS_MAP[provider].every(
      (arg) => {
        const value = config[arg as keyof IConfig];
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

const ChatModels = ({ config }: { config: IConfig | undefined }) => {
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

const EmbeddingModels = ({ config }: { config: IConfig | undefined }) => {
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

const Others = () => {
  return (
    <div>
      <h1>Others</h1>
    </div>
  );
}

export function HomePage() {
  const { data: config, isLoading, error } = useConfig();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
          <p className="text-muted-foreground">Loading configuration...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center space-y-4">
          <p className="text-destructive">Failed to load configuration</p>
          <p className="text-sm text-muted-foreground">Please try refreshing the page</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <Tabs defaultValue="providers" className="space-y-6">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="providers">Providers</TabsTrigger>
          <TabsTrigger value="chat-models">Chat Models</TabsTrigger>
          <TabsTrigger value="embedding-models">Embedding Models</TabsTrigger>
          <TabsTrigger value="others">Others</TabsTrigger>
        </TabsList>
        <TabsContent value="providers">
          <Providers config={config} />
        </TabsContent>
        <TabsContent value="chat-models">
          <ChatModels config={config} />
        </TabsContent>
        <TabsContent value="embedding-models">
          <EmbeddingModels config={config} />
        </TabsContent>
        <TabsContent value="others">
          <Others />
        </TabsContent>
      </Tabs>
    </div>
  );
}