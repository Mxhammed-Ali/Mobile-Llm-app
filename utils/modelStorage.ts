import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';

export interface ModelConfig {
  contextSize: number;
  threads: number;
  gpuLayers: number;
  name: string;
}

export interface DownloadedModel {
  id: string;
  name: string;
  filePath: string;
  size: number;
  downloadDate: string;
}

export class ModelStorage {
  private static instance: ModelStorage;

  private constructor() {}

  static getInstance(): ModelStorage {
    if (!ModelStorage.instance) {
      ModelStorage.instance = new ModelStorage();
    }
    return ModelStorage.instance;
  }

  // Get downloaded models
  async getDownloadedModels(): Promise<DownloadedModel[]> {
    try {
      const modelsJson = await AsyncStorage.getItem('downloaded_models');
      return modelsJson ? JSON.parse(modelsJson) : [];
    } catch (error) {
      console.error('Error getting downloaded models:', error);
      return [];
    }
  }

  // Save downloaded models
  async saveDownloadedModels(models: DownloadedModel[]): Promise<void> {
    try {
      await AsyncStorage.setItem('downloaded_models', JSON.stringify(models));
    } catch (error) {
      console.error('Error saving downloaded models:', error);
    }
  }

  // Add a downloaded model
  async addDownloadedModel(model: DownloadedModel): Promise<void> {
    try {
      const models = await this.getDownloadedModels();
      models.push(model);
      await this.saveDownloadedModels(models);
    } catch (error) {
      console.error('Error adding downloaded model:', error);
    }
  }

  // Get model file path for a specific model
  async getModelFilePath(modelId: string): Promise<string | null> {
    try {
      const models = await this.getDownloadedModels();
      const model = models.find(m => m.id === modelId);
      
      if (model) {
        const fileInfo = await FileSystem.getInfoAsync(model.filePath);
        if (fileInfo.exists) {
          return model.filePath;
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error getting model file path:', error);
      return null;
    }
  }

  // Check if model exists
  async modelExists(modelId: string): Promise<boolean> {
    const filePath = await this.getModelFilePath(modelId);
    return filePath !== null;
  }

  // Delete a model
  async deleteModel(modelId: string): Promise<void> {
    try {
      const models = await this.getDownloadedModels();
      const model = models.find(m => m.id === modelId);
      
      if (model) {
        // Delete the file
        try {
          const fileInfo = await FileSystem.getInfoAsync(model.filePath);
          if (fileInfo.exists) {
            await FileSystem.deleteAsync(model.filePath);
          }
        } catch (error) {
          console.warn('Error deleting model file:', error);
        }
        
        // Remove from storage
        const updatedModels = models.filter(m => m.id !== modelId);
        await this.saveDownloadedModels(updatedModels);
      }
    } catch (error) {
      console.error('Error deleting model:', error);
    }
  }

  // Format file size
  private formatFileSize(bytes: number): string {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }
}

export default ModelStorage; 