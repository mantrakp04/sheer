import { useEffect } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useConfig } from "./hooks";
import { useLoading } from "@/contexts/loading-context";
import { Providers } from "./components/Providers";
import { ChatModels } from "./components/ChatModels";
import { EmbeddingModels } from "./components/EmbeddingModels";
import { Others } from "./components/Others";

export function HomePage() {
  const { data: config, isLoading, error } = useConfig();
  const { startLoading, stopLoading } = useLoading();

  // Show loading screen during initial config load
  useEffect(() => {
    if (isLoading) {
      startLoading("Loading configuration...");
    } else {
      stopLoading();
    }
    
    return () => {
      stopLoading();
    };
  }, [isLoading, startLoading, stopLoading]);

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
          <Others config={config} />
        </TabsContent>
      </Tabs>
    </div>
  );
}