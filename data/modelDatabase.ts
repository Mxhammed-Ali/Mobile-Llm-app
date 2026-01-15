/**
 * Comprehensive AI Model Database
 * Based on latest models from Qwen, Llama, DeepSeek, and other providers
 */

import { ModelSpec, EmbeddingModel } from '../types/models';

export const AI_MODELS: ModelSpec[] = [
  // DeepSeek Models
  {
    id: 'deepseek-r1-distill-qwen-1.5b',
    name: 'DeepSeek-R1-Distill-Qwen-1.5B',
    family: 'deepseek',
    version: 'R1-Distill',
    parameters: '1.5B',
    quantization: 'Q4_K_M',
    capabilities: ['reasoning', 'conversation', 'problem-solving', 'math'],
    useCase: ['general-chat', 'educational', 'mobile-optimized', 'reasoning-tasks'],
    performance: {
      speed: 'very-fast',
      quality: 'very-good',
      efficiency: 'excellent',
      memoryUsage: 'low'
    },
    downloadUrl: 'https://huggingface.co/hdnh2006/DeepSeek-R1-Distill-Qwen-1.5B-GGUF/resolve/main/DeepSeek-R1-Distill-Qwen-1.5B-Q4_K_M.gguf',
    fileSize: 1.12 * 1024 * 1024 * 1024, // 1.12 GB
    minRAM: 2,
    recommendedRAM: 4,
    supportedPlatforms: ['android', 'ios', 'windows', 'macos', 'linux'],
    description: 'Highly efficient reasoning model distilled from DeepSeek-R1. Excellent for mobile devices with strong reasoning capabilities.',
    strengths: ['Fast inference', 'Low memory usage', 'Strong reasoning', 'Mobile optimized'],
    limitations: ['Limited context', 'Smaller knowledge base'],
    contextWindow: 4096,
    license: 'apache-2.0',
    releaseDate: '2025-01-20',
    developer: 'DeepSeek-AI',
    benchmarks: {
      mmlu: 68.5,
      gsm8k: 74.2,
      humaneval: 45.8,
      mt_bench: 7.1
    }
  },
  {
    id: 'deepseek-r1-distill-qwen-7b',
    name: 'DeepSeek-R1-Distill-Qwen-7B',
    family: 'deepseek',
    version: 'R1-Distill',
    parameters: '7B',
    quantization: 'Q4_K_M',
    capabilities: ['reasoning', 'coding', 'conversation', 'problem-solving', 'math', 'analysis'],
    useCase: ['general-chat', 'coding-assistant', 'educational', 'reasoning-tasks'],
    performance: {
      speed: 'fast',
      quality: 'excellent',
      efficiency: 'very-good',
      memoryUsage: 'medium'
    },
    downloadUrl: 'https://huggingface.co/unsloth/DeepSeek-R1-Distill-Qwen-7B-GGUF/resolve/main/DeepSeek-R1-Distill-Qwen-7B-Q4_K_M.gguf',
    fileSize: 4.68 * 1024 * 1024 * 1024, // 4.68 GB
    minRAM: 6,
    recommendedRAM: 8,
    supportedPlatforms: ['android', 'ios', 'windows', 'macos', 'linux'],
    description: 'Powerful 7B reasoning model with excellent coding and problem-solving capabilities. Great balance of performance and efficiency.',
    strengths: ['Strong reasoning', 'Good coding abilities', 'Balanced performance', 'Wide compatibility'],
    limitations: ['Higher memory usage than 1.5B models'],
    contextWindow: 32768,
    license: 'apache-2.0',
    releaseDate: '2025-01-20',
    developer: 'DeepSeek-AI',
    benchmarks: {
      mmlu: 78.9,
      gsm8k: 84.2,
      humaneval: 62.1,
      mt_bench: 8.3
    }
  },
  {
    id: 'deepseek-r1-distill-qwen-32b',
    name: 'DeepSeek-R1-Distill-Qwen-32B',
    family: 'deepseek',
    version: 'R1-Distill',
    parameters: '32B',
    quantization: 'Q4_K_M',
    capabilities: ['reasoning', 'coding', 'conversation', 'creative-writing', 'analysis', 'multilingual'],
    useCase: ['general-chat', 'coding-assistant', 'creative-writing', 'research', 'business'],
    performance: {
      speed: 'medium',
      quality: 'excellent',
      efficiency: 'good',
      memoryUsage: 'high'
    },
    downloadUrl: 'https://huggingface.co/bartowski/DeepSeek-R1-Distill-Qwen-32B-GGUF/resolve/main/DeepSeek-R1-Distill-Qwen-32B-Q4_K_M.gguf',
    fileSize: 19.85 * 1024 * 1024 * 1024, // 19.85 GB
    minRAM: 24,
    recommendedRAM: 32,
    supportedPlatforms: ['windows', 'macos', 'linux'],
    description: 'Top-tier reasoning model that outperforms OpenAI o1-mini. Excellent for complex reasoning, coding, and creative tasks.',
    strengths: ['Exceptional reasoning', 'Strong coding', 'Creative abilities', 'Large context window'],
    limitations: ['High memory requirements', 'Slower inference'],
    contextWindow: 128000,
    license: 'apache-2.0',
    releaseDate: '2025-01-20',
    developer: 'DeepSeek-AI',
    benchmarks: {
      mmlu: 85.4,
      gsm8k: 91.7,
      humaneval: 78.9,
      mt_bench: 8.9
    }
  },

  // Qwen Models
  {
    id: 'qwen2.5-0.5b',
    name: 'Qwen2.5-0.5B',
    family: 'qwen',
    version: '2.5',
    parameters: '0.5B',
    quantization: 'Q4_K_M',
    capabilities: ['conversation', 'instruction-following'],
    useCase: ['general-chat', 'mobile-optimized'],
    performance: {
      speed: 'very-fast',
      quality: 'good',
      efficiency: 'excellent',
      memoryUsage: 'low'
    },
    downloadUrl: 'https://huggingface.co/Qwen/Qwen2.5-0.5B-Instruct-GGUF/resolve/main/qwen2.5-0.5b-instruct-q4_k_m.gguf',
    fileSize: 0.35 * 1024 * 1024 * 1024, // 0.35 GB
    minRAM: 1,
    recommendedRAM: 2,
    supportedPlatforms: ['android', 'ios', 'windows', 'macos', 'linux'],
    description: 'Ultra-lightweight Qwen model perfect for resource-constrained devices. Fast and efficient for basic conversations.',
    strengths: ['Ultra-fast', 'Minimal memory', 'Good for mobile', 'Quick responses'],
    limitations: ['Limited capabilities', 'Basic knowledge', 'Short context'],
    contextWindow: 2048,
    license: 'apache-2.0',
    releaseDate: '2024-09-19',
    developer: 'Alibaba',
    benchmarks: {
      mmlu: 45.8,
      gsm8k: 24.3,
      humaneval: 18.9
    }
  },
  {
    id: 'qwen2.5-1.5b',
    name: 'Qwen2.5-1.5B',
    family: 'qwen',
    version: '2.5',
    parameters: '1.5B',
    quantization: 'Q4_K_M',
    capabilities: ['conversation', 'instruction-following', 'multilingual'],
    useCase: ['general-chat', 'mobile-optimized', 'educational'],
    performance: {
      speed: 'very-fast',
      quality: 'good',
      efficiency: 'excellent',
      memoryUsage: 'low'
    },
    downloadUrl: 'https://huggingface.co/Qwen/Qwen2.5-1.5B-Instruct-GGUF/resolve/main/qwen2.5-1.5b-instruct-q4_k_m.gguf',
    fileSize: 0.95 * 1024 * 1024 * 1024, // 0.95 GB
    minRAM: 2,
    recommendedRAM: 3,
    supportedPlatforms: ['android', 'ios', 'windows', 'macos', 'linux'],
    description: 'Compact and efficient Qwen model with good multilingual support. Ideal for mobile applications.',
    strengths: ['Fast inference', 'Multilingual', 'Mobile friendly', 'Good efficiency'],
    limitations: ['Limited reasoning', 'Basic coding abilities'],
    contextWindow: 8192,
    license: 'apache-2.0',
    releaseDate: '2024-09-19',
    developer: 'Alibaba',
    benchmarks: {
      mmlu: 58.2,
      gsm8k: 38.7,
      humaneval: 31.2
    }
  },
  {
    id: 'qwen2.5-7b',
    name: 'Qwen2.5-7B',
    family: 'qwen',
    version: '2.5',
    parameters: '7B',
    quantization: 'Q4_K_M',
    capabilities: ['conversation', 'coding', 'multilingual', 'analysis', 'instruction-following'],
    useCase: ['general-chat', 'coding-assistant', 'educational', 'business'],
    performance: {
      speed: 'fast',
      quality: 'very-good',
      efficiency: 'very-good',
      memoryUsage: 'medium'
    },
    downloadUrl: 'https://huggingface.co/Qwen/Qwen2.5-7B-Instruct-GGUF/resolve/main/qwen2.5-7b-instruct-q4_k_m.gguf',
    fileSize: 4.37 * 1024 * 1024 * 1024, // 4.37 GB
    minRAM: 6,
    recommendedRAM: 8,
    supportedPlatforms: ['android', 'ios', 'windows', 'macos', 'linux'],
    description: 'Well-balanced 7B model with strong coding and multilingual capabilities. Excellent for general-purpose use.',
    strengths: ['Good coding', 'Multilingual support', 'Balanced performance', 'Wide compatibility'],
    limitations: ['Moderate reasoning capabilities'],
    contextWindow: 32768,
    license: 'apache-2.0',
    releaseDate: '2024-09-19',
    developer: 'Alibaba',
    benchmarks: {
      mmlu: 74.8,
      gsm8k: 68.9,
      humaneval: 54.2,
      mt_bench: 7.8
    }
  },

  // Llama Models
  {
    id: 'llama3.2-1b',
    name: 'Llama 3.2-1B',
    family: 'llama',
    version: '3.2',
    parameters: '1B',
    quantization: 'Q4_K_M',
    capabilities: ['conversation', 'instruction-following'],
    useCase: ['general-chat', 'mobile-optimized'],
    performance: {
      speed: 'very-fast',
      quality: 'good',
      efficiency: 'excellent',
      memoryUsage: 'low'
    },
    downloadUrl: 'https://huggingface.co/bartowski/Llama-3.2-1B-Instruct-GGUF/resolve/main/Llama-3.2-1B-Instruct-Q4_K_M.gguf',
    fileSize: 0.67 * 1024 * 1024 * 1024, // 0.67 GB
    minRAM: 2,
    recommendedRAM: 3,
    supportedPlatforms: ['android', 'ios', 'windows', 'macos', 'linux'],
    description: 'Compact Llama model optimized for mobile and edge devices. Fast and efficient for basic conversations.',
    strengths: ['Ultra-fast', 'Mobile optimized', 'Low memory', 'Good instruction following'],
    limitations: ['Basic capabilities', 'Limited knowledge'],
    contextWindow: 8192,
    license: 'llama3.2',
    releaseDate: '2024-09-25',
    developer: 'Meta',
    benchmarks: {
      mmlu: 49.3,
      gsm8k: 32.1,
      humaneval: 28.7
    }
  },
  {
    id: 'llama3.2-3b',
    name: 'Llama 3.2-3B',
    family: 'llama',
    version: '3.2',
    parameters: '3B',
    quantization: 'Q4_K_M',
    capabilities: ['conversation', 'instruction-following', 'analysis'],
    useCase: ['general-chat', 'educational', 'mobile-optimized'],
    performance: {
      speed: 'fast',
      quality: 'good',
      efficiency: 'very-good',
      memoryUsage: 'low'
    },
    downloadUrl: 'https://huggingface.co/bartowski/Llama-3.2-3B-Instruct-GGUF/resolve/main/Llama-3.2-3B-Instruct-Q4_K_M.gguf',
    fileSize: 1.87 * 1024 * 1024 * 1024, // 1.87 GB
    minRAM: 3,
    recommendedRAM: 4,
    supportedPlatforms: ['android', 'ios', 'windows', 'macos', 'linux'],
    description: 'Balanced 3B Llama model with good performance for mobile devices. Strong instruction following capabilities.',
    strengths: ['Good performance', 'Mobile friendly', 'Strong instruction following', 'Efficient'],
    limitations: ['Limited reasoning', 'Basic coding abilities'],
    contextWindow: 8192,
    license: 'llama3.2',
    releaseDate: '2024-09-25',
    developer: 'Meta',
    benchmarks: {
      mmlu: 63.2,
      gsm8k: 47.8,
      humaneval: 41.3
    }
  },

  // TinyLlama (for reference/compatibility)
  {
    id: 'tinyllama-1.1b',
    name: 'TinyLlama-1.1B-Chat',
    family: 'tinyllama',
    version: '1.1',
    parameters: '1.1B',
    quantization: 'Q2_K',
    capabilities: ['conversation'],
    useCase: ['mobile-optimized'],
    performance: {
      speed: 'very-fast',
      quality: 'fair',
      efficiency: 'excellent',
      memoryUsage: 'low'
    },
    downloadUrl: 'https://huggingface.co/TheBloke/TinyLlama-1.1B-Chat-v1.0-GGUF/resolve/main/tinyllama-1.1b-chat-v1.0.Q2_K.gguf',
    fileSize: 0.45 * 1024 * 1024 * 1024, // 0.45 GB
    minRAM: 1,
    recommendedRAM: 2,
    supportedPlatforms: ['android', 'ios', 'windows', 'macos', 'linux'],
    description: 'Legacy ultra-lightweight model for basic conversations. Extremely fast but limited capabilities.',
    strengths: ['Ultra-fast', 'Minimal memory', 'Broad compatibility'],
    limitations: ['Very basic capabilities', 'Limited knowledge', 'Poor reasoning'],
    contextWindow: 2048,
    license: 'apache-2.0',
    releaseDate: '2024-01-04',
    developer: 'TinyLlama Team',
    benchmarks: {
      mmlu: 25.8,
      gsm8k: 15.2,
      humaneval: 12.3
    }
  }
];

export const EMBEDDING_MODELS: EmbeddingModel[] = [
  {
    id: 'bge-small-en-v1.5',
    name: 'BGE-Small-EN-v1.5',
    family: 'bge',
    dimensions: 384,
    maxTokens: 512,
    downloadUrl: 'https://huggingface.co/BAAI/bge-small-en-v1.5/resolve/main/pytorch_model.bin',
    fileSize: 133 * 1024 * 1024, // 133 MB
    description: 'Compact and efficient embedding model for English text. Perfect for mobile applications.',
    useCase: ['semantic-search', 'similarity', 'clustering'],
    performance: {
      speed: 'very-fast',
      quality: 'very-good'
    },
    benchmarks: {
      mteb: 62.8
    }
  },
  {
    id: 'bge-base-en-v1.5',
    name: 'BGE-Base-EN-v1.5',
    family: 'bge',
    dimensions: 768,
    maxTokens: 512,
    downloadUrl: 'https://huggingface.co/BAAI/bge-base-en-v1.5/resolve/main/pytorch_model.bin',
    fileSize: 438 * 1024 * 1024, // 438 MB
    description: 'High-quality embedding model with excellent performance for various text understanding tasks.',
    useCase: ['semantic-search', 'similarity', 'classification', 'clustering'],
    performance: {
      speed: 'fast',
      quality: 'excellent'
    },
    benchmarks: {
      mteb: 67.2
    }
  },
  {
    id: 'all-MiniLM-L6-v2',
    name: 'All-MiniLM-L6-v2',
    family: 'sentence-transformers',
    dimensions: 384,
    maxTokens: 256,
    downloadUrl: 'https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2/resolve/main/pytorch_model.bin',
    fileSize: 90 * 1024 * 1024, // 90 MB
    description: 'Lightweight sentence transformer model, great for semantic similarity tasks.',
    useCase: ['semantic-search', 'similarity'],
    performance: {
      speed: 'very-fast',
      quality: 'good'
    },
    benchmarks: {
      mteb: 56.3
    }
  }
];

export const MODEL_FAMILIES = {
  qwen: {
    name: 'Qwen',
    description: 'Alibaba\'s multilingual large language models with strong coding and reasoning capabilities.',
    strengths: ['Multilingual support', 'Good coding abilities', 'Efficient performance'],
    website: 'https://qwenlm.github.io/'
  },
  llama: {
    name: 'Llama',
    description: 'Meta\'s family of open-source language models, known for strong performance and wide adoption.',
    strengths: ['Strong performance', 'Wide community support', 'Well-optimized'],
    website: 'https://llama.meta.com/'
  },
  deepseek: {
    name: 'DeepSeek',
    description: 'Advanced reasoning models with state-of-the-art problem-solving capabilities.',
    strengths: ['Exceptional reasoning', 'Strong math abilities', 'Advanced problem solving'],
    website: 'https://www.deepseek.com/'
  },
  tinyllama: {
    name: 'TinyLlama',
    description: 'Ultra-compact models optimized for resource-constrained environments.',
    strengths: ['Minimal size', 'Fast inference', 'Mobile optimized'],
    website: 'https://github.com/jzhang38/TinyLlama'
  },
  phi: {
    name: 'Phi',
    description: 'Microsoft\'s small language models with strong performance per parameter.',
    strengths: ['High efficiency', 'Strong performance', 'Compact size'],
    website: 'https://azure.microsoft.com/en-us/products/ai-services/phi-3'
  },
  gemma: {
    name: 'Gemma',
    description: 'Google\'s family of lightweight, state-of-the-art open models.',
    strengths: ['High quality', 'Good performance', 'Google backing'],
    website: 'https://ai.google.dev/gemma'
  },
  mistral: {
    name: 'Mistral',
    description: 'High-performance models from Mistral AI with excellent efficiency.',
    strengths: ['High performance', 'Good efficiency', 'European origin'],
    website: 'https://mistral.ai/'
  }
} as const;