/**
 * Embedder Model Management Service
 * Manages downloading, loading, and switching between different embedding models
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import { logger } from '../utils/logger';

export interface EmbedderModel {
  id: string;
  name: string;
  displayName: string;
  description: string;
  dimensions: number;
  maxTokens: number;
  modelSize: string;
  downloadUrl: string;
  filename: string;
  isInstalled: boolean;
  isActive: boolean;
  useCase: string[];
  performance: {
    speed: 'fast' | 'medium' | 'slow';
    accuracy: 'high' | 'medium' | 'low';
    memoryUsage: 'low' | 'medium' | 'high';
  };
}

export interface EmbedderStatus {
  currentModel: EmbedderModel | null;
  isLoading: boolean;
  downloadProgress: number;
  error: string | null;
  availableModels: EmbedderModel[];
}

class EmbedderModelManagerService {
  private static instance: EmbedderModelManagerService;
  private currentModel: EmbedderModel | null = null;
  private embeddingFunction: ((text: string) => Promise<Float32Array>) | null = null;
  private modelsDirectory: string;
  private statusKey = 'embedder_model_status';

  // Available embedder models
  private availableModels: EmbedderModel[] = [
    {
      id: 'bge-small-en-v1.5',
      name: 'bge-small-en-v1.5',
      displayName: 'BGE Small English',
      description: 'High-quality English embeddings, balanced performance',
      dimensions: 384,
      maxTokens: 512,
      modelSize: '133MB',
      downloadUrl: 'https://huggingface.co/BAAI/bge-small-en-v1.5/resolve/main/onnx/model.onnx',
      filename: 'bge-small-en-v1.5.onnx',
      isInstalled: false,
      isActive: false,
      useCase: ['general', 'search', 'similarity'],
      performance: {
        speed: 'fast',
        accuracy: 'high',
        memoryUsage: 'low'
      }
    },
    {
      id: 'all-minilm-l6-v2',
      name: 'all-minilm-l6-v2',
      displayName: 'MiniLM L6 v2',
      description: 'Fast and efficient, good for general tasks',
      dimensions: 384,
      maxTokens: 256,
      modelSize: '89MB',
      downloadUrl: 'https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2/resolve/main/onnx/model.onnx',
      filename: 'all-minilm-l6-v2.onnx',
      isInstalled: false,
      isActive: false,
      useCase: ['general', 'fast'],
      performance: {
        speed: 'fast',
        accuracy: 'medium',
        memoryUsage: 'low'
      }
    },
    {
      id: 'all-mpnet-base-v2',
      name: 'all-mpnet-base-v2',
      displayName: 'MPNet Base v2',
      description: 'High accuracy embeddings for demanding tasks',
      dimensions: 768,
      maxTokens: 384,
      modelSize: '420MB',
      downloadUrl: 'https://huggingface.co/sentence-transformers/all-mpnet-base-v2/resolve/main/onnx/model.onnx',
      filename: 'all-mpnet-base-v2.onnx',
      isInstalled: false,
      isActive: false,
      useCase: ['accuracy', 'research', 'quality'],
      performance: {
        speed: 'medium',
        accuracy: 'high',
        memoryUsage: 'medium'
      }
    },
    {
      id: 'simple-builtin',
      name: 'simple-builtin',
      displayName: 'Built-in Simple',
      description: 'Lightweight built-in embedder, always available',
      dimensions: 128,
      maxTokens: 512,
      modelSize: '0MB',
      downloadUrl: '',
      filename: '',
      isInstalled: true,
      isActive: true, // Default active
      useCase: ['lightweight', 'offline', 'fallback'],
      performance: {
        speed: 'fast',
        accuracy: 'low',
        memoryUsage: 'low'
      }
    }
  ];

  constructor() {
    this.modelsDirectory = `${FileSystem.documentDirectory}embedder_models/`;
    this.currentModel = this.availableModels.find(m => m.id === 'simple-builtin') || null;
  }

  public static getInstance(): EmbedderModelManagerService {
    if (!EmbedderModelManagerService.instance) {
      EmbedderModelManagerService.instance = new EmbedderModelManagerService();
    }
    return EmbedderModelManagerService.instance;
  }

  async initialize(): Promise<void> {
    try {
      logger.info('🧠 Initializing EmbedderModelManager');
      
      // Ensure models directory exists
      const dirInfo = await FileSystem.getInfoAsync(this.modelsDirectory);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(this.modelsDirectory, { intermediates: true });
        logger.info('📁 Created embedder models directory');
      }

      // Load saved status
      await this.loadStatus();
      
      // Check which models are actually installed
      await this.updateInstalledStatus();
      
      logger.success('✅ EmbedderModelManager initialized');
    } catch (error) {
      logger.error('❌ Failed to initialize EmbedderModelManager', { error: (error as Error).message });
    }
  }

  private async loadStatus(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(this.statusKey);
      if (stored) {
        const status = JSON.parse(stored);
        if (status.currentModelId) {
          const model = this.availableModels.find(m => m.id === status.currentModelId);
          if (model) {
            this.currentModel = model;
            // Set active status
            this.availableModels.forEach(m => m.isActive = m.id === status.currentModelId);
            logger.info('📋 Loaded embedder status', { currentModel: model.displayName });
          }
        }
      }
    } catch (error) {
      logger.warn('⚠️ Failed to load embedder status', { error: (error as Error).message });
    }
  }

  private async saveStatus(): Promise<void> {
    try {
      const status = {
        currentModelId: this.currentModel?.id || null,
        timestamp: Date.now()
      };
      await AsyncStorage.setItem(this.statusKey, JSON.stringify(status));
      logger.debug('💾 Saved embedder status');
    } catch (error) {
      logger.warn('⚠️ Failed to save embedder status', { error: (error as Error).message });
    }
  }

  private async updateInstalledStatus(): Promise<void> {
    for (const model of this.availableModels) {
      if (model.id === 'simple-builtin') {
        model.isInstalled = true;
        continue;
      }

      const modelPath = `${this.modelsDirectory}${model.filename}`;
      const fileInfo = await FileSystem.getInfoAsync(modelPath);
      model.isInstalled = fileInfo.exists;
      
      logger.debug('📋 Model status check', { 
        model: model.displayName, 
        installed: model.isInstalled,
        path: modelPath
      });
    }
  }

  async downloadModel(modelId: string, onProgress?: (progress: number) => void): Promise<void> {
    const model = this.availableModels.find(m => m.id === modelId);
    if (!model) {
      throw new Error(`Model ${modelId} not found`);
    }

    if (model.id === 'simple-builtin') {
      throw new Error('Built-in model cannot be downloaded');
    }

    if (model.isInstalled) {
      throw new Error(`Model ${model.displayName} is already installed`);
    }

    const modelPath = `${this.modelsDirectory}${model.filename}`;
    
    try {
      logger.info('📥 Starting embedder model download', { 
        model: model.displayName,
        size: model.modelSize,
        url: model.downloadUrl
      });

      const downloadResult = await FileSystem.downloadAsync(
        model.downloadUrl,
        modelPath,
        {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; EmbedderApp/1.0)'
          }
        }
      );

      if (downloadResult.status === 200) {
        model.isInstalled = true;
        logger.success('✅ Embedder model downloaded successfully', { 
          model: model.displayName,
          path: modelPath,
          status: downloadResult.status
        });
      } else {
        throw new Error(`Download failed with status ${downloadResult.status}`);
      }
    } catch (error) {
      logger.error('❌ Failed to download embedder model', { 
        model: model.displayName,
        error: (error as Error).message 
      });
      throw error;
    }
  }

  async selectModel(modelId: string): Promise<void> {
    const model = this.availableModels.find(m => m.id === modelId);
    if (!model) {
      throw new Error(`Model ${modelId} not found`);
    }

    if (!model.isInstalled) {
      throw new Error(`Model ${model.displayName} is not installed. Please download it first.`);
    }

    try {
      logger.info('🔄 Switching embedder model', { 
        from: this.currentModel?.displayName || 'none',
        to: model.displayName 
      });

      // Deactivate current model
      if (this.currentModel) {
        this.currentModel.isActive = false;
      }

      // Activate new model
      this.currentModel = model;
      model.isActive = true;
      
      // Update all models' active status
      this.availableModels.forEach(m => m.isActive = m.id === modelId);

      // Initialize the embedding function
      await this.initializeEmbeddingFunction(model);

      // Save status
      await this.saveStatus();

      logger.success('✅ Embedder model switched successfully', { 
        model: model.displayName,
        dimensions: model.dimensions,
        maxTokens: model.maxTokens
      });
    } catch (error) {
      logger.error('❌ Failed to switch embedder model', { 
        model: model.displayName,
        error: (error as Error).message 
      });
      throw error;
    }
  }

  private async initializeEmbeddingFunction(model: EmbedderModel): Promise<void> {
    if (model.id === 'simple-builtin') {
      // Use the simple embedding function from LightVectorDB
      this.embeddingFunction = async (text: string): Promise<Float32Array> => {
        return this.generateSimpleEmbedding(text, model.dimensions);
      };
      logger.info('🧠 Initialized simple built-in embedder');
    } else {
      // For now, use simple embedder but with model-specific dimensions
      // TODO: In the future, integrate ONNX runtime for real model inference
      this.embeddingFunction = async (text: string): Promise<Float32Array> => {
        logger.debug('🧠 Using simple embedding (ONNX runtime not yet implemented)', { model: model.displayName });
        return this.generateSimpleEmbedding(text, model.dimensions);
      };
      logger.warn('⚠️ Using simple embedding fallback for downloaded model (ONNX runtime integration pending)');
    }
  }

  private generateSimpleEmbedding(text: string, dimensions: number): Float32Array {
    const embedding = new Float32Array(dimensions);
    const words = text.toLowerCase().split(/\s+/);
    const chars = text.toLowerCase().replace(/\s/g, '');
    
    // Character-based features (first half of dimensions)
    const halfDim = Math.floor(dimensions / 2);
    for (let i = 0; i < Math.min(chars.length - 1, halfDim); i++) {
      const bigram = chars.substr(i, 2);
      const hash = this.simpleHash(bigram) % halfDim;
      embedding[hash] += 1;
    }
    
    // Word-based features (second half of dimensions)
    for (let i = 0; i < Math.min(words.length, halfDim); i++) {
      const word = words[i];
      const hash = this.simpleHash(word) % halfDim;
      embedding[halfDim + hash] += 1;
    }
    
    // Normalize the embedding
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    if (magnitude > 0) {
      for (let i = 0; i < embedding.length; i++) {
        embedding[i] /= magnitude;
      }
    }
    
    return embedding;
  }

  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  async embed(text: string): Promise<Float32Array> {
    if (!this.embeddingFunction) {
      // Initialize with default model if not initialized
      if (!this.currentModel) {
        this.currentModel = this.availableModels.find(m => m.id === 'simple-builtin') || this.availableModels[0];
      }
      await this.initializeEmbeddingFunction(this.currentModel);
    }

    if (!this.embeddingFunction) {
      throw new Error('No embedding function available');
    }

    logger.debug('🧠 Generating embedding', { 
      text: text.substring(0, 50) + (text.length > 50 ? '...' : ''),
      model: this.currentModel?.displayName || 'unknown',
      textLength: text.length
    });

    try {
      const embedding = await this.embeddingFunction(text);
      
      logger.debug('✅ Embedding generated', {
        model: this.currentModel?.displayName || 'unknown',
        dimensions: embedding.length,
        magnitude: Math.sqrt(Array.from(embedding).reduce((sum, val) => sum + val * val, 0))
      });

      return embedding;
    } catch (error) {
      logger.error('❌ Failed to generate embedding', { 
        error: (error as Error).message,
        model: this.currentModel?.displayName || 'unknown'
      });
      throw error;
    }
  }

  async deleteModel(modelId: string): Promise<void> {
    const model = this.availableModels.find(m => m.id === modelId);
    if (!model) {
      throw new Error(`Model ${modelId} not found`);
    }

    if (model.id === 'simple-builtin') {
      throw new Error('Built-in model cannot be deleted');
    }

    if (!model.isInstalled) {
      throw new Error(`Model ${model.displayName} is not installed`);
    }

    if (model.isActive) {
      // Switch to built-in model before deleting
      await this.selectModel('simple-builtin');
    }

    const modelPath = `${this.modelsDirectory}${model.filename}`;
    
    try {
      await FileSystem.deleteAsync(modelPath);
      model.isInstalled = false;
      
      logger.success('✅ Embedder model deleted', { model: model.displayName });
    } catch (error) {
      logger.error('❌ Failed to delete embedder model', { 
        model: model.displayName,
        error: (error as Error).message 
      });
      throw error;
    }
  }

  getStatus(): EmbedderStatus {
    return {
      currentModel: this.currentModel,
      isLoading: false, // TODO: Track loading state
      downloadProgress: 0, // TODO: Track download progress
      error: null, // TODO: Track errors
      availableModels: [...this.availableModels]
    };
  }

  getCurrentModel(): EmbedderModel | null {
    return this.currentModel;
  }

  getAvailableModels(): EmbedderModel[] {
    return [...this.availableModels];
  }

  cosineSimilarity(a: Float32Array, b: Float32Array): number {
    if (a.length !== b.length) return 0;
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    
    normA = Math.sqrt(normA);
    normB = Math.sqrt(normB);
    
    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (normA * normB);
  }
}

export const embedderModelManager = EmbedderModelManagerService.getInstance();
export default EmbedderModelManagerService;