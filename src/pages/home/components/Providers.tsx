import { useState } from "react";
import { PROVIDERS, PROVIDERS_CONN_ARGS_MAP } from "@/lib/config/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2, ChevronDown } from "lucide-react";
import { useUpdateConfig, useDebounceCallback } from "../hooks";
import { ProvidersProps } from "../types";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Providers = ({ config }: ProvidersProps) => {
  const updateConfig = useUpdateConfig();
  const [localValues, setLocalValues] = useState<Record<string, string>>({});
  const [openCollapsible, setOpenCollapsible] = useState(false);
  const debouncedUpdateConfig = useDebounceCallback((updates: Record<string, string>) => {
    updateConfig.mutate(updates);
  }, 500);

  if (!config) return null;

  const handleHuggingFaceOAuth = () => {
    const clientId = import.meta.env.VITE_HF_CLIENT_ID;
    const redirectUri = window.location.origin + '/integrations/huggingface-callback';
    
    if (!clientId) {
      toast.error("HuggingFace OAuth configuration is missing");
      return;
    }
    
    const state = Math.random().toString(36).substring(2);
    const authUrl = `https://huggingface.co/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=openid%20inference-api&prompt=consent&state=${state}`;
    
    window.location.href = authUrl;
  };

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
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold capitalize">{provider}</h3>
                {provider === PROVIDERS.ollama && (
                  <div className="flex items-center gap-2">
                    {!config.ollama_base_url || config.ollama_base_url.trim() === '' ? (
                      <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-300 dark:border-yellow-800">
                        <AlertCircle className="h-3.5 w-3.5 mr-1" />
                        Not Configured
                      </Badge>
                    ) : config.ollama_available ? (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800">
                        <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                        Connected
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800">
                        <AlertCircle className="h-3.5 w-3.5 mr-1" />
                        Not Connected
                      </Badge>
                    )}
                  </div>
                )}
                {provider === PROVIDERS.huggingface && config?.hf_token && (
                  <Badge>Connected</Badge>
                )}
              </div>
              <div className="grid gap-4">
                {provider === PROVIDERS.openai ? (
                  <>
                    {/* Required OpenAI fields */}
                    {PROVIDERS_CONN_ARGS_MAP[provider]
                      .filter(arg => arg === 'openai_api_key')
                      .map((arg) => {
                        const value = localValues[arg] ?? config[arg as keyof typeof config] ?? '';
                        
                        return (
                          <div key={arg} className="space-y-2">
                            <label htmlFor={arg} className="text-sm font-medium flex items-center">
                              {arg.replace(/_/g, ' ').replace(/url/i, 'URL')}
                            </label>
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
                    
                    {/* Optional OpenAI fields in Collapsible */}
                    <Collapsible
                      open={openCollapsible}
                      onOpenChange={setOpenCollapsible}
                      className="mt-2 space-y-2 border rounded-md p-2"
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-muted-foreground">Advanced Options</h4>
                        <CollapsibleTrigger asChild>
                          <Button variant="ghost" size="sm" className="p-0 h-8 w-8">
                            <ChevronDown className={`h-4 w-4 transition-transform ${openCollapsible ? "transform rotate-180" : ""}`} />
                            <span className="sr-only">Toggle advanced options</span>
                          </Button>
                        </CollapsibleTrigger>
                      </div>
                      <CollapsibleContent className="space-y-4 pt-2">
                        {PROVIDERS_CONN_ARGS_MAP[provider]
                          .filter(arg => arg === 'openai_base_url' || arg === 'openai_model')
                          .map((arg) => {
                            const value = localValues[arg] ?? config[arg as keyof typeof config] ?? '';
                            
                            return (
                              <div key={arg} className="space-y-2">
                                <label htmlFor={arg} className="text-sm font-medium flex items-center">
                                  {arg.replace(/_/g, ' ').replace(/url/i, 'URL')}
                                  <Badge variant="outline" className="ml-2 text-xs font-normal bg-gray-50 text-gray-500 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700">
                                    Optional
                                  </Badge>
                                </label>
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
                                {arg === 'openai_model' && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Enter comma-separated model names to add multiple custom models (e.g. "gpt-4-turbo,gpt-4-vision")
                                  </p>
                                )}
                              </div>
                            );
                          })}
                      </CollapsibleContent>
                    </Collapsible>
                  </>
                ) : provider === PROVIDERS.huggingface ? (
                  <>
                    <div className="space-y-2">
                      <label htmlFor="hf_token" className="text-sm font-medium flex items-center">
                        API Token
                      </label>
                      <div className="flex gap-2">
                        <Input 
                          id="hf_token" 
                          type="password" 
                          placeholder="Enter your Hugging Face API token"
                          value={localValues.hf_token ?? config?.hf_token ?? ''} 
                          onChange={(e) => {
                            const newValue = e.target.value;
                            setLocalValues(prev => ({ ...prev, hf_token: newValue }));
                            debouncedUpdateConfig({ hf_token: newValue });
                          }}
                          disabled={updateConfig.isPending}
                          className="font-mono"
                        />
                        <Button 
                          variant="outline" 
                          onClick={handleHuggingFaceOAuth}
                          disabled={updateConfig.isPending}
                        >
                          Connect
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="hf_custom_models" className="text-sm font-medium flex items-center">
                        Custom Models (comma-separated)
                      </label>
                      <Input 
                        id="hf_custom_models" 
                        placeholder="e.g. Qwen/Qwen2-VL-7B-Instruct,mistralai/Mixtral-8x7B-Instruct-v0.1"
                        value={localValues.hf_custom_models ?? config?.hf_custom_models ?? ''} 
                        onChange={(e) => {
                          const newValue = e.target.value;
                          setLocalValues(prev => ({ ...prev, hf_custom_models: newValue }));
                          debouncedUpdateConfig({ hf_custom_models: newValue });
                        }}
                        disabled={updateConfig.isPending}
                        className="font-mono"
                      />
                      <p className="text-xs text-muted-foreground">
                        Add custom models in the format: owner/model-name
                      </p>
                    </div>
                  </>
                ) : (
                  // Non-OpenAI providers
                  PROVIDERS_CONN_ARGS_MAP[provider].map((arg) => {
                    const value = localValues[arg] ?? config[arg as keyof typeof config] ?? '';
                    
                    return (
                      <div key={arg} className="space-y-2">
                        <label htmlFor={arg} className="text-sm font-medium flex items-center">
                          {arg.replace(/_/g, ' ').replace(/url/i, 'URL')}
                        </label>
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
                  })
                )}
              </div>
              {provider === PROVIDERS.ollama && (
                <>
                  {!config.ollama_base_url || config.ollama_base_url.trim() === '' ? (
                    <Alert className="mt-4 border-yellow-200 text-yellow-800 dark:border-yellow-800 dark:text-yellow-300">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Ollama Not Configured</AlertTitle>
                      <AlertDescription>
                        Please enter a valid Ollama server URL to enable Ollama models.
                      </AlertDescription>
                    </Alert>
                  ) : !config.ollama_available && (
                    <Alert variant="destructive" className="mt-4">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Connection Error</AlertTitle>
                      <AlertDescription>
                        Could not connect to Ollama server at {config.ollama_base_url}. Please check that Ollama is running and the URL is correct.
                      </AlertDescription>
                    </Alert>
                  )}
                </>
              )}
            </div>
          ))}
        </CardContent>
      </ScrollArea>
    </Card>
  );
} 