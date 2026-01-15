// @/llama/llama.config

import { initLlama, LlamaContext } from "llama.rn";
import * as FileSystem from 'expo-file-system';
import { getDeviceResources, getModelConfigsForDevice, ModelConfig } from '../utils/deviceResources';
import ModelStorage from '../utils/modelStorage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from '../utils/logger';
import { ModelManagerService } from '../services/ModelManagerService';
import { Platform, Alert } from 'react-native';

const stopWords = ["<|endoftext|>", "</s>", "<|end|>", "<|eot_id|>"];

// Load system performance settings
const loadSystemSettings = async () => {
    try {
        const stored = await AsyncStorage.getItem('system_performance_settings');
        if (stored) {
            const settings = JSON.parse(stored);
            return {
                ...settings,
                modelTimeoutSeconds: settings.modelTimeoutSeconds || 120, // Default 120 seconds (increased from 60)
            };
        }
    } catch (error) {
        logger.error('Error loading system settings:', error);
    }
    
    // Default settings - increased timeout to 120 seconds
    return {
        maxContextTokens: 2048,
        maxRAMUsage: 1500,
        threadCount: 2,
        gpuLayers: 0,
        temperatureSetting: 0.7,
        topP: 0.9,
        topK: 40,
        maxPredictTokens: 1000,
        modelTimeoutSeconds: 120,
        enableMemoryOptimization: true,
        enableContextCompression: false,
        enableAdaptiveTokens: true,
        useSQLiteStorage: false,
    };
};

// Ultra-conservative model loading for mobile devices
export const loadModel = async (modelPath: string): Promise<LlamaContext> => {
    try {
        try {
            const mm = ModelManagerService.getInstance();
            const active = await mm.getActiveModel();
            if (active) {
                logger.info('🧩 Preparing to load active model', {
                    id: active.id,
                    name: active.modelSpec.name,
                    params: active.modelSpec.parameters,
                    quant: active.modelSpec.quantization,
                    file: active.filePath,
                });
            }
        } catch {}
        logger.info('🔍 Loading model from path:', modelPath);
        
        // Check if file exists
        const fileInfo = await FileSystem.getInfoAsync(modelPath);
        if (!fileInfo.exists) {
            throw new Error(`Model file not found: ${modelPath}`);
        }
        
        logger.info('✅ Model file exists, size:', { size: fileInfo.size, unit: 'bytes' });
        
        const modelSizeMB = Math.round((fileInfo.size || 0) / (1024 * 1024));
        logger.info('📊 Model size:', { size: modelSizeMB, unit: 'MB' });
        
        // Get device resources
        const deviceResources = await getDeviceResources();
        logger.info('🎯 Device analysis complete:', {
          totalMemory: deviceResources.totalMemory,
          freeMemory: deviceResources.freeMemory,
            isLowEndDevice: deviceResources.isLowEndDevice,
        });
        
        // Calculate required memory (model size + conservative overhead)
        const requiredMemoryMB = modelSizeMB + 512; // ~512MB overhead for context and runtime
        logger.info('💾 Estimated required memory:', { memory: requiredMemoryMB, unit: 'MB' });
        logger.info('💾 Available memory:', { memory: deviceResources.freeMemory, unit: 'MB' });
        
        // Bail out early if we clearly don't have enough headroom to avoid native OOM crashes
        // Require at least 15% headroom beyond the rough estimate
        if (requiredMemoryMB > deviceResources.freeMemory * 0.85) {
          const msg = 'Not enough free memory to safely load this model. Try a smaller model or lower context tokens.';
          logger.error('❌ Memory feasibility check failed before init', {
            requiredMemoryMB,
            freeMemoryMB: deviceResources.freeMemory,
          });
          throw new Error(msg);
        }
        
        // Force garbage collection
        if (global.gc) {
          logger.info('🧹 Running garbage collection...');
            global.gc();
        }
        
        // Try different configurations based on device capabilities
        // Try user-configured settings first (bounded), then fallback presets
        const systemSettings = await loadSystemSettings();
        const boundedUser = {
          name: 'User',
          contextSize: Math.max(128, Math.min(systemSettings.maxContextTokens ?? 512, 4096)),
          threads: Math.max(1, Math.min(systemSettings.threadCount ?? 2, 8)),
          gpuLayers: Math.max(0, Math.min(systemSettings.gpuLayers ?? 0, Platform.OS === 'ios' ? 8 : 0)),
          useMlock: false,
        };
        const mobileConfigs = [
          boundedUser,
          { name: 'Conservative', contextSize: 512, threads: 1, gpuLayers: 0, useMlock: false },
          { name: 'Balanced', contextSize: 1024, threads: 2, gpuLayers: 0, useMlock: false },
          { name: 'Performance', contextSize: 1536, threads: 4, gpuLayers: Platform.OS === 'ios' ? 4 : 0, useMlock: Platform.OS === 'ios' },
        ];

        // Try each configuration until one works
        for (let configIndex = 0; configIndex < mobileConfigs.length; configIndex++) {
          const mobileConfig = mobileConfigs[configIndex];
          
          logger.info(`🧠 Trying ${mobileConfig.name}: context=${mobileConfig.contextSize}, threads=${mobileConfig.threads}`);
        
        // Create initialization promise with timeout
        const initPromise = initLlama({
            model: modelPath,
            n_ctx: mobileConfig.contextSize,
            n_threads: mobileConfig.threads,
            n_gpu_layers: mobileConfig.gpuLayers,
            use_mlock: mobileConfig.useMlock,
        });
        
        // Add timeout to prevent hanging
        const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => reject(new Error('Model initialization timeout after 90 seconds')), 90000);
        });
        
        const context = await Promise.race([initPromise, timeoutPromise]);
        
          logger.info(`✅ Model loaded successfully with ${mobileConfig.name}!`);
        return context;
        }
        
        throw new Error('All model configurations failed');
        
    } catch (error: any) {
        logger.error('❌ Error loading model:', error);
        
        // Provide specific error messages
        if (error.message?.includes('memory')) {
            throw new Error('Insufficient memory to load model. Try closing other apps or use a smaller model.');
        } else if (error.message?.includes('timeout')) {
            throw new Error('Model initialization timed out. The model might be too large for this device.');
        } else if (error.message?.includes('format')) {
            throw new Error('Model format not supported. Please use a compatible GGUF model.');
        } else if (error.message?.includes('permission')) {
            throw new Error('Permission denied. Check file permissions.');
        } else {
            throw new Error(`Model loading failed: ${error.message}`);
        }
    }
};

// Simplified message sending with better error handling and system settings
export const sendMessage = async (
  context: LlamaContext, 
  message: string, 
  conversationHistory: {role: string, content: string}[] = [],
  contextRules?: string | null
): Promise<string> => {
    try {
        logger.info('💬 Sending message to model', { 
            messageLength: message.length,
            historyLength: conversationHistory.length,
            hasContextRules: !!contextRules
        });

        // Build complete conversation including history and context
        const fullConversation = [];
        
        // Add context rules as system message if available
        if (contextRules) {
            fullConversation.push({
                role: 'system',
                content: contextRules
            });
        }
        
        // Add conversation history
        fullConversation.push(...conversationHistory);
        
        // Add current message
        fullConversation.push({
            role: 'user',
            content: message
        });

        logger.info('📤 Conversation prepared', {
            totalMessages: fullConversation.length,
            userMessages: fullConversation.filter(msg => msg.role === 'user').length,
            assistantMessages: fullConversation.filter(msg => msg.role === 'assistant').length
        });
        
        // Load user-configured system settings with fallbacks
        let systemSettings;
        try {
            systemSettings = await loadSystemSettings();
        } catch (settingsError) {
            logger.warn('⚠️ Failed to load system settings, using defaults:', settingsError);
            systemSettings = {
                maxContextTokens: 512,
                temperatureSetting: 0.7,
                topP: 0.9,
                topK: 40,
                maxPredictTokens: 200,
                threadCount: 2,
                gpuLayers: 0,
                enableMemoryOptimization: true,
            };
        }
        
        // Check if parameters are within safe ranges
        const needsSafetyAdjustment = 
            systemSettings.maxPredictTokens > 1000 ||
            systemSettings.temperatureSetting > 2.0 ||
            systemSettings.temperatureSetting < 0.1 ||
            systemSettings.topP > 1.0 ||
            systemSettings.topP < 0.1 ||
            systemSettings.topK > 100 ||
            systemSettings.topK < 1 ||
            systemSettings.maxContextTokens > 2048 ||
            systemSettings.maxContextTokens < 128 ||
            systemSettings.threadCount > 8 ||
            systemSettings.threadCount < 1 ||
            systemSettings.gpuLayers > 16 ||
            systemSettings.gpuLayers < 0;

        // Compute user and safe settings
        const userSettings = {
            n_predict: systemSettings.maxPredictTokens || 200,
            temperature: systemSettings.temperatureSetting || 0.7,
            top_p: systemSettings.topP || 0.9,
            top_k: systemSettings.topK || 40,
            n_ctx: systemSettings.maxContextTokens || 512,
            n_batch: systemSettings.enableMemoryOptimization ? 16 : 32,
            n_threads: systemSettings.threadCount || 2,
            n_gpu_layers: systemSettings.gpuLayers || 0,
        };

        const safeSettings = {
            n_predict: Math.min(userSettings.n_predict, 1000),
            temperature: Math.min(Math.max(userSettings.temperature, 0.1), 2.0),
            top_p: Math.min(Math.max(userSettings.top_p, 0.1), 1.0),
            top_k: Math.min(Math.max(userSettings.top_k, 1), 100),
            n_ctx: Math.min(Math.max(userSettings.n_ctx, 128), 2048),
            n_batch: userSettings.n_batch,
            n_threads: Math.min(Math.max(userSettings.n_threads, 1), 8),
            n_gpu_layers: Math.min(Math.max(userSettings.n_gpu_layers, 0), 16),
        };

        // Ask user to confirm if outside safe ranges
        let finalSettings = userSettings;
        if (needsSafetyAdjustment) {
            const useSafe: boolean = await new Promise((resolve) => {
                try {
                    Alert.alert(
                        'Confirm parameters',
                        'Some settings exceed recommended safe ranges. Use safer values to reduce risk of timeouts or instability?',
                        [
                            { text: 'Use Original', style: 'destructive', onPress: () => resolve(false) },
                            { text: 'Use Safe', style: 'default', onPress: () => resolve(true) },
                        ],
                        { cancelable: true, onDismiss: () => resolve(true) }
                    );
                } catch {
                    resolve(true);
                }
            });
            finalSettings = useSafe ? safeSettings : userSettings;
            logger.warn('⚠️ Parameters exceed safe ranges', { useSafe });
        }
        
        logger.info('⚙️ Using parameters', { 
            temperature: finalSettings.temperature,
            maxTokens: finalSettings.n_predict,
            timeout: systemSettings.modelTimeoutSeconds || 120
        });
        
        // Add configurable timeout to prevent hanging
        const timeoutMs = (systemSettings.modelTimeoutSeconds || 120) * 1000;
        const timeoutPromise = new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error('Model response timeout')), timeoutMs)
        );
        
        logger.info('🤖 Starting AI completion...');
        
        const completionPromise = context.completion(
            {
                messages: fullConversation,
                ...finalSettings,
                stop: stopWords,
            },
            (data) => {
                // Handle streaming tokens silently
            },
        );
        
        const msgResult = await Promise.race([completionPromise, timeoutPromise]);

        logger.success('✅ AI response received', {
            responseLength: (msgResult.text || '').length
        });

        return msgResult.text || 'No response generated';
        
    } catch (error: any) {
        logger.error('❌ Error in sendMessage', { 
            error: (error as Error).message,
            inputMessage: message
        });
        return `Error generating response: ${(error as Error).message}. Please try again.`;
    }
};

// Add a function to check if model is compatible
export const checkModelCompatibility = async (modelPath: string): Promise<boolean> => {
    try {
        const fileInfo = await FileSystem.getInfoAsync(modelPath);
        if (!fileInfo.exists) {
            return false;
        }
        
        const modelSizeMB = Math.round(fileInfo.size / (1024 * 1024));
        
        // Check if model is too large (more than 2GB)
        if (modelSizeMB > 2048) {
            logger.warn('⚠️ Model is very large, may cause issues on this device');
            return false;
        }
        
        return true;
    } catch (error) {
        logger.error('❌ Error checking model compatibility:', error);
        return false;
    }
}; 