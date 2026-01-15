/**
 * Context Rules Service
 * Manages AI context and rules for guiding AI behavior
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from '../utils/logger';

const CONTEXT_STORAGE_KEY = 'ai_context_rules';
const CONTEXT_ENABLED_KEY = 'ai_context_enabled';

export interface ContextRulesData {
  contextText: string;
  isEnabled: boolean;
}

class ContextRulesService {
  private static instance: ContextRulesService;
  private cachedData: ContextRulesData | null = null;
  private lastLoadTime: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  public static getInstance(): ContextRulesService {
    if (!ContextRulesService.instance) {
      ContextRulesService.instance = new ContextRulesService();
    }
    return ContextRulesService.instance;
  }

  async getContextRules(): Promise<ContextRulesData> {
    // Return cached data if it's fresh
    const now = Date.now();
    if (this.cachedData && (now - this.lastLoadTime) < this.CACHE_DURATION) {
      logger.debug('📋 Using cached context rules', { 
        cacheAge: Math.round((now - this.lastLoadTime) / 1000),
        isEnabled: this.cachedData.isEnabled 
      });
      return this.cachedData;
    }

    try {
      logger.debug('📋 Loading AI context rules from storage');
      
      const [savedContext, savedEnabled] = await Promise.all([
        AsyncStorage.getItem(CONTEXT_STORAGE_KEY),
        AsyncStorage.getItem(CONTEXT_ENABLED_KEY)
      ]);

      const contextText = savedContext || '';
      const isEnabled = savedEnabled !== null ? savedEnabled === 'true' : false;

      this.cachedData = { contextText, isEnabled };
      this.lastLoadTime = now;

      logger.debug('✅ Loaded AI context rules', { 
        contextLength: contextText.length,
        isEnabled,
        hasCustomRules: !!savedContext
      });

      return this.cachedData;
    } catch (error) {
      logger.error('❌ Failed to load AI context rules', { error: (error as Error).message });
      
      // Return default/fallback data
      const fallbackData: ContextRulesData = { contextText: '', isEnabled: false };
      this.cachedData = fallbackData;
      return fallbackData;
    }
  }

  async getContextForAI(): Promise<string | null> {
    const rules = await this.getContextRules();
    
    if (!rules.isEnabled || !rules.contextText.trim()) {
      logger.debug('🚫 AI context rules are disabled or empty');
      return null;
    }

    logger.info('📜 Applying AI context rules', { 
      contextLength: rules.contextText.length,
      preview: rules.contextText.substring(0, 100) + (rules.contextText.length > 100 ? '...' : '')
    });

    return rules.contextText.trim();
  }

  async saveContextRules(data: ContextRulesData): Promise<void> {
    try {
      logger.info('💾 Saving AI context rules', { 
        contextLength: data.contextText.length,
        isEnabled: data.isEnabled 
      });

      await Promise.all([
        AsyncStorage.setItem(CONTEXT_STORAGE_KEY, data.contextText),
        AsyncStorage.setItem(CONTEXT_ENABLED_KEY, data.isEnabled.toString())
      ]);

      // Update cache
      this.cachedData = data;
      this.lastLoadTime = Date.now();
      
      logger.success('✅ AI context rules saved successfully');
    } catch (error) {
      logger.error('❌ Failed to save AI context rules', { error: (error as Error).message });
      throw error;
    }
  }

  /**
   * Clears the cache to force reload on next access
   */
  clearCache(): void {
    this.cachedData = null;
    this.lastLoadTime = 0;
    logger.debug('🗑️ Cleared AI context rules cache');
  }

  /**
   * Formats context rules for AI consumption
   */
  formatContextForAI(contextText: string): string {
    if (!contextText.trim()) return '';

    // Add clear delimiters for the AI to understand this is context/rules
    return `<SYSTEM_CONTEXT>
${contextText.trim()}
</SYSTEM_CONTEXT>

Please follow the above context and rules in your responses.`;
  }

  /**
   * Gets status information about context rules
   */
  async getStatus(): Promise<{
    isEnabled: boolean;
    hasRules: boolean;
    contextLength: number;
    lastUpdated: string;
  }> {
    const rules = await this.getContextRules();
    
    return {
      isEnabled: rules.isEnabled,
      hasRules: rules.contextText.trim().length > 0,
      contextLength: rules.contextText.length,
      lastUpdated: this.lastLoadTime > 0 
        ? new Date(this.lastLoadTime).toISOString() 
        : 'Never'
    };
  }
}

export const contextRulesService = ContextRulesService.getInstance();
export default ContextRulesService;