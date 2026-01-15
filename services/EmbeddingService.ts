/**
 * Embedding service for generating vector representations of text
 * Designed to be extensible for different embedding models
 */

export interface EmbeddingModel {
  name: string;
  dimensions: number;
  maxTokens: number;
}

export interface EmbeddingService {
  getModel(): EmbeddingModel;
  embed(text: string): Promise<Float32Array>;
  embedBatch(texts: string[]): Promise<Float32Array[]>;
}

// Mock/Simple embedding service for development
export class SimpleEmbeddingService implements EmbeddingService {
  private model: EmbeddingModel = {
    name: 'simple-hash',
    dimensions: 384,
    maxTokens: 512
  };

  getModel(): EmbeddingModel {
    return this.model;
  }

  async embed(text: string): Promise<Float32Array> {
    // Simple hash-based embedding for development
    // In production, this would call BGE-small or another model
    
    const normalized = text.toLowerCase().trim();
    const hash = this.simpleHash(normalized);
    const embedding = new Float32Array(this.model.dimensions);
    
    // Generate pseudo-random but deterministic vector based on text hash
    const seed = hash;
    for (let i = 0; i < this.model.dimensions; i++) {
      // Use a simple PRNG with the text hash as seed
      const x = Math.sin(seed + i * 0.1) * 10000;
      embedding[i] = x - Math.floor(x);
    }
    
    // Normalize the vector
    const norm = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    for (let i = 0; i < embedding.length; i++) {
      embedding[i] /= norm;
    }
    
    return embedding;
  }

  async embedBatch(texts: string[]): Promise<Float32Array[]> {
    return Promise.all(texts.map(text => this.embed(text)));
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
}

// BGE-Small embedding service (placeholder for future implementation)
export class BGESmallEmbeddingService implements EmbeddingService {
  private model: EmbeddingModel = {
    name: 'bge-small-en-v1.5',
    dimensions: 384,
    maxTokens: 512
  };

  getModel(): EmbeddingModel {
    return this.model;
  }

  async embed(text: string): Promise<Float32Array> {
    // TODO: Implement actual BGE-small inference
    // For now, fall back to simple embedding
    const simpleService = new SimpleEmbeddingService();
    return simpleService.embed(text);
  }

  async embedBatch(texts: string[]): Promise<Float32Array[]> {
    return Promise.all(texts.map(text => this.embed(text)));
  }
}

// Factory function for creating embedding services
export const createEmbeddingService = (type: 'simple' | 'bge-small' = 'simple'): EmbeddingService => {
  switch (type) {
    case 'bge-small':
      return new BGESmallEmbeddingService();
    case 'simple':
    default:
      return new SimpleEmbeddingService();
  }
};

// Singleton instance
let embeddingServiceInstance: EmbeddingService | null = null;

export const getEmbeddingService = (type?: 'simple' | 'bge-small'): EmbeddingService => {
  if (!embeddingServiceInstance) {
    embeddingServiceInstance = createEmbeddingService(type);
  }
  return embeddingServiceInstance;
};