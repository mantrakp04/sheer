import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ConfigManager } from "@/lib/config/manager";
import { toast } from "sonner";

export const configKeys = {
  all: ['config'] as const,
  details: () => [...configKeys.all, 'details'] as const,
} as const;

export function useConfig() {
  const configManager = ConfigManager.getInstance();
  
  return useQuery({
    queryKey: configKeys.details(),
    queryFn: async () => await configManager.getConfig(),
  });
}

export function useUpdateConfig() {
  const queryClient = useQueryClient();
  const configManager = ConfigManager.getInstance();

  return useMutation({
    mutationFn: async (updates: Record<string, string>) => {
      return await configManager.updateConfig(updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: configKeys.all });
      toast.success('Configuration updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update configuration');
      console.error('Config update error:', error);
    }
  });
}

export function useUpdateEnabledModels(type: 'chat' | 'embedding') {
  const queryClient = useQueryClient();
  const configManager = ConfigManager.getInstance();
  const configKey = type === 'chat' ? 'enabled_chat_models' : 'enabled_embedding_models';

  return useMutation({
    mutationFn: async ({ modelId, enabled }: { modelId: string, enabled: boolean }) => {
      const currentConfig = await configManager.getConfig();
      const enabledModels = new Set(currentConfig[configKey] || []);
      
      if (enabled) {
        enabledModels.add(modelId);
      } else {
        enabledModels.delete(modelId);
      }

      return await configManager.updateConfig({
        [configKey]: Array.from(enabledModels)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: configKeys.all });
      toast.success(`${type === 'chat' ? 'Chat' : 'Embedding'} models updated successfully`);
    },
    onError: (error) => {
      toast.error(`Failed to update ${type === 'chat' ? 'chat' : 'embedding'} models`);
      console.error(`${type} models update error:`, error);
    }
  });
}