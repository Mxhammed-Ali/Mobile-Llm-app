/**
 * TypeScript declarations for llama.rn module
 */

declare module 'llama.rn' {
  export interface NativeContextParams {
    model: string;
    n_ctx?: number;
    n_threads?: number;
    n_gpu_layers?: number;
    use_mlock?: boolean;
    useMmap?: boolean;
    vocabOnly?: boolean;
    n_batch?: number;
    n_ubatch?: number;
    rope_freq_base?: number;
    rope_freq_scale?: number;
    mul_mat_q?: boolean;
    f16_kv?: boolean;
    embedding?: boolean;
    logits_all?: boolean;
    vocab_only?: boolean;
    numa?: boolean;
    n_keep?: number;
    n_draft?: number;
    n_chunks?: number;
  }

  export interface CompletionParams {
    messages?: { role: string; content: string }[];
    n_predict?: number;
    stop?: string[];
    temperature?: number;
    top_p?: number;
    top_k?: number;
    n_ctx?: number;
    n_batch?: number;
    n_threads?: number;
    n_gpu_layers?: number;
  }

  export interface CompletionResult {
    text: string;
    tokens?: number[];
  }

  export interface LlamaContext {
    completion(
      params: CompletionParams,
      onProgress?: (data: { token: string }) => void
    ): Promise<CompletionResult>;
  }

  export function initLlama(params: NativeContextParams): Promise<LlamaContext>;
}