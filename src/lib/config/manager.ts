import Dexie, { Table } from "dexie";
import { IConfig, DEFAULT_CONFIG, loadAllModels } from "./types";

export class ConfigManager extends Dexie {
  configs!: Table<IConfig>;
  private static instance: ConfigManager;
  private currentConfig: IConfig | null = null;
  private initPromise: Promise<IConfig> | null = null;

  private constructor() {
    super("configs");
    this.version(1).stores({
      configs: "id, createdAt, updatedAt",
    });
    this.initPromise = this.initialize();
  }

  public static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  async initialize(): Promise<IConfig> {
    // Return existing config or in-progress initialization
    if (this.currentConfig) return this.currentConfig;
    if (this.initPromise) return this.initPromise;
    
    try {
      const configs = await this.configs.toArray();
      
      if (configs.length === 0) {
        // Create default config if none exists
        const defaultConfig: IConfig = {
          ...DEFAULT_CONFIG,
          id: crypto.randomUUID(),
          createdAt: Date.now(),
          updatedAt: Date.now(),
          ollama_available: false
        };
        
        // Check Ollama availability if URL is provided
        if (defaultConfig.ollama_base_url.trim() !== '') {
          defaultConfig.ollama_available = await this.checkOllamaAvailability(defaultConfig.ollama_base_url);
        }
        
        await this.configs.add(defaultConfig);
        this.currentConfig = defaultConfig;
      } else {
        // Use the most recently updated config
        this.currentConfig = configs.sort((a, b) => b.updatedAt - a.updatedAt)[0];
        
        // Check Ollama availability if URL is provided
        if (this.currentConfig.ollama_base_url.trim() !== '') {
          const ollamaAvailable = await this.checkOllamaAvailability(this.currentConfig.ollama_base_url);
          
          // Update availability if changed
          if (ollamaAvailable !== this.currentConfig.ollama_available) {
            await this.updateConfig({ ollama_available: ollamaAvailable });
          }
        }
      }
      
      // Load models after config is ready
      await this.loadModels();
      return this.currentConfig;
    } catch (error) {
      console.error("Error initializing config:", error);
      throw error;
    } finally {
      this.initPromise = null;
    }
  }

  private async checkOllamaAvailability(baseUrl: string): Promise<boolean> {
    if (!baseUrl || baseUrl.trim() === '') return false;
    
    try {
      const response = await fetch(`${baseUrl}/api/tags`);
      if (!response.ok) return false;
      
      const data = await response.json();
      return Array.isArray(data.models) && data.models.length > 0;
    } catch (error) {
      console.error("Ollama server not available:", error);
      return false;
    }
  }

  private async loadModels(): Promise<void> {
    if (!this.currentConfig) return;
    
    try {
      const { ollamaAvailable } = await loadAllModels(
        this.currentConfig.ollama_base_url,
        this.currentConfig.openai_model,
        this.currentConfig.hf_custom_models
      );
      
      // Update availability if changed
      if (ollamaAvailable !== this.currentConfig.ollama_available) {
        await this.updateConfig({ ollama_available: ollamaAvailable });
      }
    } catch (error) {
      console.error("Error loading models:", error);
    }
  }

  async getConfig(): Promise<IConfig> {
    return this.currentConfig || this.initialize();
  }

  async updateConfig(updates: Partial<Omit<IConfig, 'id' | 'createdAt' | 'updatedAt'>>): Promise<IConfig> {
    const current = await this.getConfig();
    const updatedConfig: IConfig = {
      ...current,
      ...updates,
      updatedAt: Date.now(),
    };
    
    await this.configs.put(updatedConfig);
    this.currentConfig = updatedConfig;
    
    // Handle Ollama URL updates
    if (updates.ollama_base_url !== undefined && 
        updates.ollama_base_url !== current.ollama_base_url) {
      
      // Check availability only if URL is not empty
      const ollamaAvailable = updates.ollama_base_url.trim() === '' 
        ? false 
        : await this.checkOllamaAvailability(updates.ollama_base_url);
      
      if (ollamaAvailable !== this.currentConfig.ollama_available) {
        return this.updateConfig({ ollama_available: ollamaAvailable });
      }
      
      // Reload models if URL changed
      await this.loadModels();
    }
    
    // Reload models if OpenAI custom models changed
    if (updates.openai_model !== undefined &&
        updates.openai_model !== current.openai_model) {
      await this.loadModels();
    }
    
    // Reload models if Hugging Face custom models changed
    if (updates.hf_custom_models !== undefined &&
        updates.hf_custom_models !== current.hf_custom_models) {
      await this.loadModels();
    }
    
    return updatedConfig;
  }

  async resetToDefaults(): Promise<IConfig> {
    const current = await this.getConfig();
    const resetConfig: IConfig = {
      ...DEFAULT_CONFIG,
      id: current.id,
      createdAt: current.createdAt,
      updatedAt: Date.now(),
      ollama_available: false
    };
    
    // Check Ollama availability if URL is provided
    if (resetConfig.ollama_base_url.trim() !== '') {
      resetConfig.ollama_available = await this.checkOllamaAvailability(resetConfig.ollama_base_url);
    }
    
    await this.configs.put(resetConfig);
    this.currentConfig = resetConfig;
    
    // Reload models after reset
    await this.loadModels();
    
    return resetConfig;
  }
}
