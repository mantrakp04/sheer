import Dexie, { Table } from "dexie";
import { IConfig, DEFAULT_CONFIG } from "./types";

export class ConfigManager extends Dexie {
  configs!: Table<IConfig>;
  private static instance: ConfigManager;
  private currentConfig: IConfig | null = null;

  private constructor() {
    super("configs");
    this.version(1).stores({
      configs: "id, createdAt, updatedAt",
    });
    this.initialize();
  }

  public static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  async initialize() {
    const configs = await this.configs.toArray();
    if (configs.length === 0) {
      // Create default config if none exists
      const defaultConfig: IConfig = {
        ...DEFAULT_CONFIG,
        id: crypto.randomUUID(),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      await this.configs.add(defaultConfig);
      this.currentConfig = defaultConfig;
    } else {
      // Use the most recently updated config
      this.currentConfig = configs.sort((a, b) => b.updatedAt - a.updatedAt)[0];
    }
    return this.currentConfig;
  }

  async getConfig(): Promise<IConfig> {
    if (!this.currentConfig) {
      await this.initialize();
    }
    return this.currentConfig!;
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
    return updatedConfig;
  }

  async resetToDefaults(): Promise<IConfig> {
    const current = await this.getConfig();
    const resetConfig: IConfig = {
      ...DEFAULT_CONFIG,
      id: current.id,
      createdAt: current.createdAt,
      updatedAt: Date.now(),
    };
    
    await this.configs.put(resetConfig);
    this.currentConfig = resetConfig;
    return resetConfig;
  }
}
