/**
 * Comprehensive Model Management Service
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import { Alert } from 'react-native';
import { 
  ModelSpec, 
  EmbeddingModel, 
  ModelDownload, 
  InstalledModel, 
  ModelFilter, 
  ModelRecommendation,
  DeviceCapabilities 
} from '../types/models';
import { AI_MODELS, EMBEDDING_MODELS } from '../data/modelDatabase';
import { getDeviceResources } from '../utils/deviceResources';

const STORAGE_KEYS = {
  INSTALLED_MODELS: 'installed_models',
  ACTIVE_MODEL: 'active_model',
  DOWNLOADS: 'model_downloads',
  PREFERENCES: 'model_preferences'
};

export class ModelManagerService {
  private static instance: ModelManagerService;
  private installedModels: Map<string, InstalledModel> = new Map();
  private activeDownloads: Map<string, ModelDownload> = new Map();
  private deviceCapabilities: DeviceCapabilities | null = null;

  private constructor() {
    this.initializeService();
  }

  static getInstance(): ModelManagerService {
    if (!ModelManagerService.instance) {
      ModelManagerService.instance = new ModelManagerService();
    }
    return ModelManagerService.instance;
  }

  private async initializeService(): Promise<void> {
    try {
      await this.loadInstalledModels();
      await this.loadDeviceCapabilities();
      await this.cleanupFailedDownloads();
    } catch (error) {
      console.error('Failed to initialize ModelManagerService:', error);
    }
  }

  // Device Capabilities
  private async loadDeviceCapabilities(): Promise<void> {
    try {
      const resources = await getDeviceResources();
      this.deviceCapabilities = {
        totalRAM: resources.totalMemory,
        availableRAM: resources.freeMemory,
        totalStorage: resources.diskInfo.totalStorage,
        availableStorage: resources.diskInfo.freeStorage,
        cpuCores: resources.recommendedConfig.threads,
        platform: resources.deviceInfo.osName?.toLowerCase().includes('android') ? 'android' : 'ios',
        gpuSupport: resources.recommendedConfig.gpuLayers > 0,
        recommendedModelSize: this.getRecommendedModelSize(resources.totalMemory)
      };
    } catch (error) {
      console.error('Failed to load device capabilities:', error);
      // Provide fallback values if device detection fails
      this.deviceCapabilities = {
        totalRAM: 4000,
        availableRAM: 2000,
        totalStorage: 32000,
        availableStorage: 16000,
        cpuCores: 4,
        platform: 'android',
        gpuSupport: false,
        recommendedModelSize: '1.5B'
      };
    }
  }

  private getRecommendedModelSize(totalRAM: number): string {
    if (totalRAM >= 16) return '7B';
    if (totalRAM >= 8) return '3B';
    if (totalRAM >= 4) return '1.5B';
    return '0.5B';
  }

  // Model Discovery and Filtering
  getAllModels(): ModelSpec[] {
    return AI_MODELS;
  }

  getEmbeddingModels(): EmbeddingModel[] {
    return EMBEDDING_MODELS;
  }

  filterModels(filter: ModelFilter): ModelSpec[] {
    return AI_MODELS.filter(model => {
      // Family filter
      if (filter.family && !filter.family.includes(model.family)) {
        return false;
      }

      // Parameters filter
      if (filter.parameters && !filter.parameters.includes(model.parameters)) {
        return false;
      }

      // Capabilities filter
      if (filter.capabilities && !filter.capabilities.some(cap => 
        model.capabilities.includes(cap))) {
        return false;
      }

      // Use case filter
      if (filter.useCase && !filter.useCase.some(use => 
        model.useCase.includes(use))) {
        return false;
      }

      // Size filter (in GB)
      if (filter.maxSize) {
        const modelSizeGB = model.fileSize / (1024 * 1024 * 1024);
        if (modelSizeGB > filter.maxSize) {
          return false;
        }
      }

      // RAM filter
      if (filter.maxRAM && model.minRAM > filter.maxRAM) {
        return false;
      }

      // Quality filter
      if (filter.quality && !filter.quality.includes(model.performance.quality)) {
        return false;
      }

      // Speed filter
      if (filter.speed && !filter.speed.includes(model.performance.speed)) {
        return false;
      }

      return true;
    });
  }

  // Model Recommendations
  getRecommendations(useCase?: string[], maxRAM?: number): ModelRecommendation[] {
    const deviceRAM = this.deviceCapabilities?.availableRAM || 4;
    const effectiveMaxRAM = maxRAM || deviceRAM;

    const recommendations: ModelRecommendation[] = AI_MODELS
      .filter(model => model.minRAM <= effectiveMaxRAM)
      .map(model => {
        let score = 0;
        const reasons: string[] = [];
        const matchedCriteria: string[] = [];

        // Device compatibility scoring
        if (model.recommendedRAM <= effectiveMaxRAM) {
          score += 0.3;
          reasons.push('Compatible with your device RAM');
          matchedCriteria.push('device-compatible');
        }

        // Use case scoring
        if (useCase) {
          const matchedUseCases = model.useCase.filter(uc => useCase.includes(uc));
          if (matchedUseCases.length > 0) {
            score += 0.3 * (matchedUseCases.length / useCase.length);
            reasons.push(`Matches ${matchedUseCases.length} of your use cases`);
            matchedCriteria.push('use-case-match');
          }
        }

        // Performance scoring
        const performanceScore = this.getPerformanceScore(model);
        score += 0.3 * performanceScore;
        if (performanceScore > 0.7) {
          reasons.push('High performance model');
          matchedCriteria.push('high-performance');
        }

        // Efficiency scoring (especially important for mobile)
        if (model.performance.efficiency === 'excellent') {
          score += 0.1;
          reasons.push('Excellent efficiency');
          matchedCriteria.push('efficient');
        }

        return {
          model,
          score,
          reasons: reasons.slice(0, 3), // Limit to top 3 reasons
          matchedCriteria
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 10); // Top 10 recommendations

    return recommendations;
  }

  private getPerformanceScore(model: ModelSpec): number {
    const qualityScore = {
      'excellent': 1.0,
      'very-good': 0.8,
      'good': 0.6,
      'fair': 0.4
    }[model.performance.quality] || 0.4;

    const speedScore = {
      'very-fast': 1.0,
      'fast': 0.8,
      'medium': 0.6,
      'slow': 0.4
    }[model.performance.speed] || 0.4;

    return (qualityScore + speedScore) / 2;
  }

  // Model Installation Management
  async getInstalledModels(): Promise<InstalledModel[]> {
    return Array.from(this.installedModels.values());
  }

  async getActiveModel(): Promise<InstalledModel | null> {
    try {
      const activeModelId = await AsyncStorage.getItem(STORAGE_KEYS.ACTIVE_MODEL);
      if (activeModelId && this.installedModels.has(activeModelId)) {
        return this.installedModels.get(activeModelId)!;
      }
    } catch (error) {
      console.error('Failed to get active model:', error);
    }
    return null;
  }

  async setActiveModel(modelId: string): Promise<boolean> {
    try {
      if (!this.installedModels.has(modelId)) {
        throw new Error('Model not installed');
      }

      // Deactivate current model
      for (const model of Array.from(this.installedModels.values())) {
        model.isActive = false;
      }

      // Activate new model
      const model = this.installedModels.get(modelId)!;
      model.isActive = true;
      model.lastUsed = Date.now();

      await AsyncStorage.setItem(STORAGE_KEYS.ACTIVE_MODEL, modelId);
      await this.saveInstalledModels();

      return true;
    } catch (error) {
      console.error('Failed to set active model:', error);
      return false;
    }
  }

  // Model Download Management
  async downloadModel(modelId: string, onProgress?: (progress: ModelDownload) => void): Promise<boolean> {
    const model = AI_MODELS.find(m => m.id === modelId);
    if (!model) {
      throw new Error('Model not found');
    }

    // Check if already downloading
    if (this.activeDownloads.has(modelId)) {
      throw new Error('Model is already being downloaded');
    }

    // Check if already installed
    if (this.installedModels.has(modelId)) {
      throw new Error('Model is already installed');
    }

    // Check storage space
    const availableSpace = this.deviceCapabilities?.availableStorage || 0;
    const requiredSpace = model.fileSize / (1024 * 1024 * 1024); // Convert to GB
    if (requiredSpace > availableSpace * 0.9) { // Leave 10% buffer
      throw new Error('Insufficient storage space');
    }

    const download: ModelDownload = {
      id: `download_${Date.now()}`,
      modelId,
      status: 'pending',
      progress: 0,
      startTime: Date.now()
    };

    this.activeDownloads.set(modelId, download);

    try {
      // Create model directory
      const modelDir = `${FileSystem.documentDirectory}models/${modelId}/`;
      await FileSystem.makeDirectoryAsync(modelDir, { intermediates: true });

      const fileName = model.downloadUrl.split('/').pop() || `${modelId}.gguf`;
      const filePath = `${modelDir}${fileName}`;

      download.status = 'downloading';
      download.filePath = filePath;
      onProgress?.(download);

      // Download with progress tracking
      const downloadResumable = FileSystem.createDownloadResumable(
        model.downloadUrl,
        filePath,
        {},
        (progressData: any) => {
          const progress = (progressData.totalBytesWritten / progressData.totalBytesExpectedToWrite) * 100;
          download.progress = progress;
          download.speed = progressData.totalBytesWritten / ((Date.now() - download.startTime) / 1000);
          download.eta = (progressData.totalBytesExpectedToWrite - progressData.totalBytesWritten) / (download.speed || 1);
          onProgress?.(download);
        }
      );

      // Add timeout protection (30 minutes max)
      const downloadTimeout = 30 * 60 * 1000; // 30 minutes
      const result = await Promise.race([
        downloadResumable.downloadAsync(),
        new Promise<null>((_, reject) => 
          setTimeout(() => reject(new Error('Download timeout after 30 minutes')), downloadTimeout)
        )
      ]);

      if (!result?.uri) {
        throw new Error('Download failed - no file URI returned');
      }

      // Verify file
      const fileInfo = await FileSystem.getInfoAsync(result.uri);
      if (!fileInfo.exists || ('size' in fileInfo && fileInfo.size === 0)) {
        throw new Error('Downloaded file is invalid or empty');
      }

      // Verify checksum if available
      let verified = true;
      if (model.checksum) {
        // TODO: Implement checksum verification
        verified = true; // Placeholder
      }

      // Create installed model record
      const installedModel: InstalledModel = {
        id: modelId,
        modelSpec: model,
        filePath: result.uri,
        installDate: Date.now(),
        isActive: this.installedModels.size === 0, // Make first model active
        verified
      };

      this.installedModels.set(modelId, installedModel);
      
      if (installedModel.isActive) {
        await AsyncStorage.setItem(STORAGE_KEYS.ACTIVE_MODEL, modelId);
      }

      await this.saveInstalledModels();

      download.status = 'completed';
      download.endTime = Date.now();
      download.progress = 100;
      onProgress?.(download);

      this.activeDownloads.delete(modelId);
      return true;

    } catch (error) {
      console.error('Model download failed:', error);
      download.status = 'failed';
      
      // Provide more descriptive error messages
      let errorMessage = 'Unknown error occurred';
      if (error instanceof Error) {
        if (error.message.includes('Network')) {
          errorMessage = 'Network connection failed. Please check your internet connection.';
        } else if (error.message.includes('space') || error.message.includes('storage')) {
          errorMessage = 'Insufficient storage space. Please free up some space and try again.';
        } else if (error.message.includes('timeout')) {
          errorMessage = 'Download timed out. Please try again with a better connection.';
        } else {
          errorMessage = error.message;
        }
      }
      
      download.error = errorMessage;
      onProgress?.(download);

      // Cleanup failed download gracefully
      try {
        if (download.filePath) {
          await FileSystem.deleteAsync(download.filePath, { idempotent: true });
        }
        
        // Clean up model directory if empty
        const modelDir = `${FileSystem.documentDirectory}models/${modelId}/`;
        const dirInfo = await FileSystem.getInfoAsync(modelDir);
        if (dirInfo.exists && dirInfo.isDirectory) {
          try {
            await FileSystem.deleteAsync(modelDir, { idempotent: true });
          } catch (dirCleanupError) {
            // Ignore directory cleanup errors
            console.log('Could not cleanup model directory:', dirCleanupError);
          }
        }
      } catch (cleanupError) {
        console.error('Failed to cleanup failed download:', cleanupError);
      }

      this.activeDownloads.delete(modelId);
      
      // Don't throw error to prevent app crash
      return false;
    }
  }

  async pauseDownload(modelId: string): Promise<boolean> {
    const download = this.activeDownloads.get(modelId);
    if (download && download.status === 'downloading') {
      download.status = 'paused';
      // TODO: Implement actual pause logic
      return true;
    }
    return false;
  }

  async resumeDownload(modelId: string): Promise<boolean> {
    const download = this.activeDownloads.get(modelId);
    if (download && download.status === 'paused') {
      download.status = 'downloading';
      // TODO: Implement actual resume logic
      return true;
    }
    return false;
  }

  async cancelDownload(modelId: string): Promise<boolean> {
    const download = this.activeDownloads.get(modelId);
    if (download) {
      try {
        if (download.filePath) {
          await FileSystem.deleteAsync(download.filePath, { idempotent: true });
        }
        this.activeDownloads.delete(modelId);
        return true;
      } catch (error) {
        console.error('Failed to cancel download:', error);
        return false;
      }
    }
    return false;
  }

  async uninstallModel(modelId: string): Promise<boolean> {
    const model = this.installedModels.get(modelId);
    if (!model) {
      return false;
    }

    try {
      // Don't allow uninstalling active model if it's the only one
      if (model.isActive && this.installedModels.size === 1) {
        throw new Error('Cannot uninstall the only active model');
      }

      // Delete model file
      await FileSystem.deleteAsync(model.filePath, { idempotent: true });

      // Remove from installed models
      this.installedModels.delete(modelId);

      // If this was the active model, activate another one
      if (model.isActive && this.installedModels.size > 0) {
        const nextModel = Array.from(this.installedModels.values())[0];
        await this.setActiveModel(nextModel.id);
      }

      await this.saveInstalledModels();
      return true;

    } catch (error) {
      console.error('Failed to uninstall model:', error);
      Alert.alert('Error', 'Failed to uninstall model: ' + (error instanceof Error ? error.message : 'Unknown error'));
      return false;
    }
  }

  getActiveDownloads(): ModelDownload[] {
    return Array.from(this.activeDownloads.values());
  }

  // Storage Management
  private async loadInstalledModels(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.INSTALLED_MODELS);
      if (stored) {
        const models: InstalledModel[] = JSON.parse(stored);
        this.installedModels.clear();
        for (const model of models) {
          this.installedModels.set(model.id, model);
        }
      }
    } catch (error) {
      console.error('Failed to load installed models:', error);
    }
  }

  private async saveInstalledModels(): Promise<void> {
    try {
      const models = Array.from(this.installedModels.values());
      await AsyncStorage.setItem(STORAGE_KEYS.INSTALLED_MODELS, JSON.stringify(models));
    } catch (error) {
      console.error('Failed to save installed models:', error);
    }
  }

  private async cleanupFailedDownloads(): Promise<void> {
    try {
      // Remove any stale download records
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.DOWNLOADS);
      if (stored) {
        const downloads: ModelDownload[] = JSON.parse(stored);
        for (const download of downloads) {
          if (download.status === 'downloading' || download.status === 'pending') {
            // Mark as failed if app was closed during download
            if (download.filePath) {
              await FileSystem.deleteAsync(download.filePath, { idempotent: true });
            }
          }
        }
      }
      await AsyncStorage.removeItem(STORAGE_KEYS.DOWNLOADS);
    } catch (error) {
      console.error('Failed to cleanup failed downloads:', error);
    }
  }

  // Utility methods
  getModelById(modelId: string): ModelSpec | undefined {
    return AI_MODELS.find(m => m.id === modelId);
  }

  getEmbeddingModelById(modelId: string): EmbeddingModel | undefined {
    return EMBEDDING_MODELS.find(m => m.id === modelId);
  }

  getDeviceCapabilities(): DeviceCapabilities | null {
    return this.deviceCapabilities;
  }

  async getStorageInfo(): Promise<{ used: number; total: number; available: number }> {
    try {
      const info = await FileSystem.getInfoAsync(FileSystem.documentDirectory + 'models/');
      let used = 0;
      
      if (info.exists && info.isDirectory) {
        // Calculate total size of installed models
        for (const model of Array.from(this.installedModels.values())) {
          const modelInfo = await FileSystem.getInfoAsync(model.filePath);
          if (modelInfo.exists && 'size' in modelInfo) {
            used += modelInfo.size;
          }
        }
      }

      const total = this.deviceCapabilities?.totalStorage || 0;
      const available = this.deviceCapabilities?.availableStorage || 0;

      return { used, total, available };
    } catch (error) {
      console.error('Failed to get storage info:', error);
      return { used: 0, total: 0, available: 0 };
    }
  }
}