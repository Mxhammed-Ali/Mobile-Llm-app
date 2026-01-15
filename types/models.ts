/**
 * Comprehensive model management types
 */

export interface ModelSpec {
  id: string;
  name: string;
  family: 'qwen' | 'llama' | 'deepseek' | 'tinyllama' | 'phi' | 'gemma' | 'mistral';
  version: string;
  parameters: string; // e.g., "1.5B", "7B", "32B"
  quantization: 'Q2_K' | 'Q3_K_M' | 'Q4_K_M' | 'Q5_K_M' | 'Q6_K' | 'Q8_0' | 'F16';
  
  // Model characteristics
  capabilities: ModelCapability[];
  useCase: ModelUseCase[];
  performance: ModelPerformance;
  
  // Download information
  downloadUrl: string;
  fileSize: number; // in bytes
  checksum?: string;
  
  // Device compatibility
  minRAM: number; // in GB
  minVRAM?: number; // in GB
  recommendedRAM: number; // in GB
  supportedPlatforms: ('android' | 'ios' | 'windows' | 'macos' | 'linux')[];
  
  // Model metadata
  description: string;
  strengths: string[];
  limitations: string[];
  contextWindow: number; // context length
  license: string;
  releaseDate: string;
  developer: string;
  
  // Performance metrics
  benchmarks?: ModelBenchmarks;
}

export type ModelCapability = 
  | 'reasoning' 
  | 'coding' 
  | 'math' 
  | 'creative-writing' 
  | 'conversation' 
  | 'analysis' 
  | 'multilingual' 
  | 'problem-solving'
  | 'instruction-following';

export type ModelUseCase = 
  | 'general-chat' 
  | 'coding-assistant' 
  | 'creative-writing' 
  | 'educational' 
  | 'research' 
  | 'business' 
  | 'mobile-optimized'
  | 'reasoning-tasks'
  | 'math-problems';

export interface ModelPerformance {
  speed: 'very-fast' | 'fast' | 'medium' | 'slow';
  quality: 'excellent' | 'very-good' | 'good' | 'fair';
  efficiency: 'excellent' | 'very-good' | 'good' | 'fair';
  memoryUsage: 'low' | 'medium' | 'high' | 'very-high';
}

export interface ModelBenchmarks {
  mmlu?: number; // MMLU score
  hellaswag?: number;
  arc?: number;
  truthfulqa?: number;
  gsm8k?: number; // Math benchmark
  humaneval?: number; // Coding benchmark
  mt_bench?: number; // Conversation benchmark
}

export interface EmbeddingModel {
  id: string;
  name: string;
  family: 'bge' | 'sentence-transformers' | 'openai' | 'cohere';
  dimensions: number;
  maxTokens: number;
  downloadUrl: string;
  fileSize: number;
  description: string;
  useCase: ('semantic-search' | 'similarity' | 'classification' | 'clustering')[];
  performance: {
    speed: 'very-fast' | 'fast' | 'medium' | 'slow';
    quality: 'excellent' | 'very-good' | 'good' | 'fair';
  };
  benchmarks?: {
    mteb?: number; // Massive Text Embedding Benchmark
  };
}

export interface ModelDownload {
  id: string;
  modelId: string;
  status: 'pending' | 'downloading' | 'completed' | 'failed' | 'paused';
  progress: number; // 0-100
  speed?: number; // bytes per second
  eta?: number; // estimated time remaining in seconds
  filePath?: string;
  error?: string;
  startTime: number;
  endTime?: number;
}

export interface InstalledModel {
  id: string;
  modelSpec: ModelSpec;
  filePath: string;
  installDate: number;
  lastUsed?: number;
  isActive: boolean;
  verified: boolean; // checksum verified
}

export interface ModelFilter {
  family?: string[];
  parameters?: string[];
  capabilities?: ModelCapability[];
  useCase?: ModelUseCase[];
  maxSize?: number; // in GB
  maxRAM?: number; // in GB
  quality?: ModelPerformance['quality'][];
  speed?: ModelPerformance['speed'][];
}

export interface ModelRecommendation {
  model: ModelSpec;
  score: number; // 0-1
  reasons: string[];
  matchedCriteria: string[];
}

export interface DeviceCapabilities {
  totalRAM: number; // in GB
  availableRAM: number; // in GB
  totalStorage: number; // in GB
  availableStorage: number; // in GB
  cpuCores: number;
  platform: 'android' | 'ios' | 'windows' | 'macos' | 'linux';
  gpuSupport: boolean;
  recommendedModelSize: string; // e.g., "7B", "1.5B"
}