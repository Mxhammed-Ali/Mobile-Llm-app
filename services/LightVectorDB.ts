/**
 * Lightweight Vector Embedding Database for Mobile
 * Uses in-memory storage with AsyncStorage persistence
 * Fallback to SimpleVectorStore if embedding fails
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  ChatMessage, 
  ChatSession, 
  VectorStore, 
  VectorSearchResult, 
  SessionStats,
  VectorStoreConfig 
} from '../types/chat';
import { SimpleVectorStore } from './SimpleVectorStore';
import { logger } from '../utils/logger';
import { embedderModelManager } from './EmbedderModelManager';

// Simple embedding service using character n-grams for lightweight text similarity
class SimpleEmbeddingService {
  private vocabulary: Map<string, number> = new Map();
  private vectorSize = 128; // Small fixed size for mobile

  // Generate a simple embedding based on character n-grams and word frequency
  generateEmbedding(text: string): Float32Array {
    const embedding = new Float32Array(this.vectorSize);
    const words = text.toLowerCase().split(/\s+/);
    const chars = text.toLowerCase().replace(/\s/g, '');
    
    // Character-based features (first 64 dimensions)
    for (let i = 0; i < Math.min(chars.length - 1, 32); i++) {
      const bigram = chars.substr(i, 2);
      const hash = this.simpleHash(bigram) % 32;
      embedding[hash] += 1;
    }
    
    // Word-based features (next 64 dimensions)
    for (let i = 0; i < Math.min(words.length, 32); i++) {
      const word = words[i];
      const hash = this.simpleHash(word) % 32;
      embedding[32 + hash] += 1;
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

  // Simple hash function for consistent feature mapping
  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  // Calculate cosine similarity between two embeddings
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

export class LightVectorDB implements VectorStore {
  private embedding: SimpleEmbeddingService;
  private fallbackStore: SimpleVectorStore;
  private sessions: Map<string, ChatSession> = new Map();
  private messages: Map<string, ChatMessage[]> = new Map();
  private messageEmbeddings: Map<string, Float32Array> = new Map();
  private config: VectorStoreConfig;
  private isInitialized = false;
  private storageKey = 'light_vector_db_v1';

  constructor(config: Partial<VectorStoreConfig> = {}) {
    this.config = {
      maxMessagesPerSession: 100,
      embeddingDimensions: 128,
      similarityThreshold: 0.3,
      maxStorageMB: 25,
      cleanupPolicy: {
        maxAge: 30,
        maxSessions: 50
      },
      ...config
    };
    
    this.embedding = new SimpleEmbeddingService();
    this.fallbackStore = new SimpleVectorStore(config);
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    try {
      logger.info('🚀 Initializing LightVectorDB');
      await this.loadFromStorage();
      // SimpleVectorStore doesn't need initialization
      this.isInitialized = true;
      logger.success('✅ LightVectorDB initialized successfully');
    } catch (error) {
      logger.error('❌ Failed to initialize LightVectorDB, using fallback only', { error: (error as Error).message });
      // SimpleVectorStore doesn't need initialization
      this.isInitialized = true;
    }
  }

  // Session Management
  async createSession(title?: string): Promise<ChatSession> {
    await this.initialize();
    
    try {
      const session: ChatSession = {
        id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title: title || 'New Chat',
        preview: '',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        messageCount: 0
      };

      this.sessions.set(session.id, session);
      this.messages.set(session.id, []);
      
      await this.saveToStorage();
      logger.success('✅ Session created in LightVectorDB', { sessionId: session.id });
      return session;
    } catch (error) {
      logger.warn('⚠️ Failed to create session in LightVectorDB, using fallback', { error: (error as Error).message });
      return this.fallbackStore.createSession(title);
    }
  }

  async getSession(id: string): Promise<ChatSession | null> {
    await this.initialize();
    
    try {
      const session = this.sessions.get(id);
      if (session) {
        logger.debug('✅ Session found in LightVectorDB', { sessionId: id });
        return session;
      }
      logger.debug('⚠️ Session not found in LightVectorDB, checking fallback', { sessionId: id });
      return this.fallbackStore.getSession(id);
    } catch (error) {
      logger.warn('⚠️ Error getting session from LightVectorDB, using fallback', { error: (error as Error).message });
      return this.fallbackStore.getSession(id);
    }
  }

  async getAllSessions(): Promise<ChatSession[]> {
    await this.initialize();
    
    try {
      const sessions = Array.from(this.sessions.values()).sort((a, b) => b.updatedAt - a.updatedAt);
      logger.debug('✅ Retrieved sessions from LightVectorDB', { count: sessions.length });
      return sessions;
    } catch (error) {
      logger.warn('⚠️ Error getting sessions from LightVectorDB, using fallback', { error: (error as Error).message });
      return this.fallbackStore.getAllSessions();
    }
  }

  async updateSession(id: string, updates: Partial<ChatSession>): Promise<void> {
    await this.initialize();
    
    try {
      const session = this.sessions.get(id);
      if (session) {
        const updatedSession = { ...session, ...updates, updatedAt: Date.now() };
        this.sessions.set(id, updatedSession);
        await this.saveToStorage();
        logger.debug('✅ Session updated in LightVectorDB', { sessionId: id });
        return;
      }
      
      // Try fallback
      await this.fallbackStore.updateSession(id, updates);
    } catch (error) {
      logger.warn('⚠️ Error updating session in LightVectorDB, using fallback', { error: (error as Error).message });
      await this.fallbackStore.updateSession(id, updates);
    }
  }

  async deleteSession(id: string): Promise<void> {
    await this.initialize();
    
    try {
      this.sessions.delete(id);
      this.messages.delete(id);
      
      // Clean up embeddings for this session
      const messagesToDelete = Array.from(this.messageEmbeddings.keys()).filter(msgId => msgId.startsWith(id));
      messagesToDelete.forEach(msgId => this.messageEmbeddings.delete(msgId));
      
      await this.saveToStorage();
      logger.success('✅ Session deleted from LightVectorDB', { sessionId: id });
      
      // Also delete from fallback
      await this.fallbackStore.deleteSession(id);
    } catch (error) {
      logger.warn('⚠️ Error deleting session from LightVectorDB, using fallback', { error: (error as Error).message });
      await this.fallbackStore.deleteSession(id);
    }
  }

  // Message Operations - CRITICAL: Prevent Duplicates
  async addMessage(messageData: Omit<ChatMessage, 'id' | 'timestamp'>): Promise<ChatMessage> {
    await this.initialize();
    
    try {
      // Generate unique ID to prevent duplicates
      const now = Date.now();
      const randomPart = Math.random().toString(36).substr(2, 12);
      const sessionPrefix = messageData.sessionId.substr(-6);
      
      const message: ChatMessage = {
        id: `msg_${sessionPrefix}_${now}_${randomPart}`,
        ...messageData,
        timestamp: now
      };

      // Check for duplicate content in the same session
      const sessionMessages = this.messages.get(messageData.sessionId) || [];
      const isDuplicate = sessionMessages.some(existing => 
        existing.content === message.content && 
        existing.role === message.role &&
        Math.abs(existing.timestamp - message.timestamp) < 1000 // Within 1 second
      );

      if (isDuplicate) {
        logger.warn('⚠️ Duplicate message detected, skipping', { 
          sessionId: messageData.sessionId, 
          content: messageData.content.substring(0, 50) 
        });
        return sessionMessages[sessionMessages.length - 1]; // Return the existing message
      }

      // Generate embedding for the message using EmbedderModelManager
      try {
        logger.info('🧠 EMBEDDING PROCESS - Starting embedding generation', {
          messageId: message.id,
          messageRole: message.role,
          messageLength: message.content.length,
          messagePreview: message.content.substring(0, 100) + (message.content.length > 100 ? '...' : ''),
          embedderModel: embedderModelManager.getCurrentModel()?.displayName || 'none'
        });

        // Initialize embedder if needed
        await embedderModelManager.initialize();
        
        const embedding = await embedderModelManager.embed(message.content);
        message.embedding = embedding;
        this.messageEmbeddings.set(message.id, embedding);

        logger.success('✅ EMBEDDING PROCESS - Embedding generated successfully', {
          messageId: message.id,
          embeddingDimensions: embedding.length,
          embeddingMagnitude: Math.sqrt(Array.from(embedding).reduce((sum, val) => sum + val * val, 0)),
          embeddingPreview: Array.from(embedding.slice(0, 10)),
          embeddingNonZeroValues: Array.from(embedding).filter(val => val !== 0).length,
          embeddingDensity: Array.from(embedding).filter(val => val !== 0).length / embedding.length,
          embedderModel: embedderModelManager.getCurrentModel()?.displayName || 'unknown'
        });
      } catch (embeddingError) {
        logger.warn('⚠️ EMBEDDING PROCESS - Failed to generate embedding for message', { 
          error: (embeddingError as Error).message,
          messageId: message.id,
          messageContent: message.content.substring(0, 50),
          embedderModel: embedderModelManager.getCurrentModel()?.displayName || 'unknown'
        });
      }

      // Add to our storage
      sessionMessages.push(message);
      this.messages.set(messageData.sessionId, sessionMessages);

      // Update session
      const session = this.sessions.get(messageData.sessionId);
      if (session) {
        session.messageCount = sessionMessages.length;
        session.updatedAt = now;
        session.preview = this.truncateContent(message.content);
        this.sessions.set(messageData.sessionId, session);
      }

      await this.saveToStorage();
      logger.success('✅ Message added to LightVectorDB', { messageId: message.id, sessionId: messageData.sessionId });

      return message;
    } catch (error) {
      logger.warn('⚠️ Error adding message to LightVectorDB, using fallback', { error: (error as Error).message });
      return this.fallbackStore.addMessage(messageData);
    }
  }

  async getMessages(sessionId: string, limit?: number): Promise<ChatMessage[]> {
    await this.initialize();
    
    try {
      const messages = this.messages.get(sessionId) || [];
      const result = limit ? messages.slice(-limit) : messages;
      logger.debug('✅ Retrieved messages from LightVectorDB', { sessionId, count: result.length });
      return result;
    } catch (error) {
      logger.warn('⚠️ Error getting messages from LightVectorDB, using fallback', { error: (error as Error).message });
      return this.fallbackStore.getMessages(sessionId, limit);
    }
  }

  async deleteMessage(id: string): Promise<void> {
    await this.initialize();
    
    try {
      for (const [sessionId, messages] of this.messages.entries()) {
        const index = messages.findIndex(msg => msg.id === id);
        if (index !== -1) {
          messages.splice(index, 1);
          this.messageEmbeddings.delete(id);
          
          // Update session message count
          const session = this.sessions.get(sessionId);
          if (session) {
            session.messageCount = messages.length;
            session.updatedAt = Date.now();
            this.sessions.set(sessionId, session);
          }
          
          await this.saveToStorage();
          logger.success('✅ Message deleted from LightVectorDB', { messageId: id });
          break;
        }
      }
      
      // Also delete from fallback
      await this.fallbackStore.deleteMessage(id);
    } catch (error) {
      logger.warn('⚠️ Error deleting message from LightVectorDB, using fallback', { error: (error as Error).message });
      await this.fallbackStore.deleteMessage(id);
    }
  }

  // Vector Search with Embedding Similarity
  async searchSimilarMessages(
    query: string | Float32Array,
    sessionId?: string,
    limit: number = 5
  ): Promise<VectorSearchResult[]> {
    await this.initialize();
    
    try {
      // Generate query embedding using EmbedderModelManager
      const queryEmbedding = typeof query === 'string' 
        ? await embedderModelManager.embed(query)
        : query;

      logger.info('🔍 VECTOR SEARCH - Starting similarity search', {
        query: typeof query === 'string' ? query.substring(0, 50) : 'embedding',
        embedderModel: embedderModelManager.getCurrentModel()?.displayName || 'unknown',
        searchScope: sessionId ? 'single_session' : 'all_sessions',
        threshold: this.config.similarityThreshold
      });

      const results: VectorSearchResult[] = [];

      // Search through all messages
      for (const [sid, messages] of this.messages.entries()) {
        if (sessionId && sid !== sessionId) continue;

        for (const message of messages) {
          const messageEmbedding = this.messageEmbeddings.get(message.id);
          if (messageEmbedding) {
            const similarity = embedderModelManager.cosineSimilarity(queryEmbedding, messageEmbedding);
            
            if (similarity >= this.config.similarityThreshold) {
              results.push({
                message,
                similarity
              });
            }
          }
        }
      }

      // Sort by similarity and limit results
      results.sort((a, b) => b.similarity - a.similarity);
      const limitedResults = results.slice(0, limit);
      
      logger.success('✅ VECTOR SEARCH - Search completed', { 
        query: typeof query === 'string' ? query.substring(0, 50) : 'embedding',
        resultsFound: limitedResults.length,
        topSimilarity: limitedResults.length > 0 ? limitedResults[0].similarity : 0,
        embedderModel: embedderModelManager.getCurrentModel()?.displayName || 'unknown'
      });
      
      return limitedResults;
    } catch (error) {
      logger.warn('⚠️ Error in vector search, using fallback text search', { 
        error: (error as Error).message,
        embedderModel: embedderModelManager.getCurrentModel()?.displayName || 'unknown'
      });
      return this.fallbackStore.searchSimilarMessages(query, sessionId, limit);
    }
  }

  // Storage Management
  private async saveToStorage(): Promise<void> {
    try {
      const data = {
        sessions: Array.from(this.sessions.entries()),
        messages: Array.from(this.messages.entries()),
        embeddings: Array.from(this.messageEmbeddings.entries()).map(([id, embedding]) => [
          id,
          Array.from(embedding) // Convert Float32Array to regular array for JSON
        ]),
        timestamp: Date.now()
      };
      
      await AsyncStorage.setItem(this.storageKey, JSON.stringify(data));
      logger.debug('💾 LightVectorDB data saved to storage');
    } catch (error) {
      logger.warn('⚠️ Failed to save LightVectorDB data to storage', { error: (error as Error).message });
    }
  }

  private async loadFromStorage(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(this.storageKey);
      if (!stored) return;

      const data = JSON.parse(stored);
      
      // Restore sessions
      this.sessions = new Map(data.sessions || []);
      
      // Restore messages
      this.messages = new Map(data.messages || []);
      
      // Restore embeddings
      if (data.embeddings) {
        this.messageEmbeddings = new Map(
          data.embeddings.map(([id, embedding]: [string, number[]]) => [
            id,
            new Float32Array(embedding) // Convert back to Float32Array
          ])
        );
      }
      
      logger.success('✅ LightVectorDB data loaded from storage', { 
        sessions: this.sessions.size,
        messages: this.messages.size,
        embeddings: this.messageEmbeddings.size
      });
    } catch (error) {
      logger.warn('⚠️ Failed to load LightVectorDB data from storage', { error: (error as Error).message });
    }
  }

  // Utility methods
  private truncateContent(content: string, maxLength: number = 100): string {
    return content.length > maxLength ? content.substring(0, maxLength) + '...' : content;
  }

  async getStats(): Promise<SessionStats> {
    await this.initialize();
    
    try {
      let totalMessages = 0;
      for (const messages of this.messages.values()) {
        totalMessages += messages.length;
      }
      
      const oldestSession = this.sessions.size > 0 
        ? Math.min(...Array.from(this.sessions.values()).map(s => s.createdAt))
        : Date.now();
      
      return {
        totalSessions: this.sessions.size,
        totalMessages,
        storageUsed: 0, // TODO: Calculate actual storage
        oldestSession
      };
    } catch (error) {
      logger.warn('⚠️ Error getting stats from LightVectorDB, using fallback', { error: (error as Error).message });
      return this.fallbackStore.getStats();
    }
  }

  async cleanup(): Promise<void> {
    await this.initialize();
    
    try {
      const cutoffDate = Date.now() - (this.config.cleanupPolicy.maxAge * 24 * 60 * 60 * 1000);
      
      // Remove old sessions
      for (const [id, session] of this.sessions.entries()) {
        if (session.createdAt < cutoffDate) {
          await this.deleteSession(id);
        }
      }
      
      // Keep only the most recent sessions
      const sessions = Array.from(this.sessions.values()).sort((a, b) => b.updatedAt - a.updatedAt);
      if (sessions.length > this.config.cleanupPolicy.maxSessions) {
        const toDelete = sessions.slice(this.config.cleanupPolicy.maxSessions);
        for (const session of toDelete) {
          await this.deleteSession(session.id);
        }
      }
      
      await this.saveToStorage();
      logger.success('✅ LightVectorDB cleanup completed');
    } catch (error) {
      logger.warn('⚠️ Error during LightVectorDB cleanup', { error: (error as Error).message });
    }
  }

  async exportData(): Promise<any> {
    await this.initialize();
    
    try {
      return {
        sessions: Array.from(this.sessions.values()),
        messages: Object.fromEntries(this.messages.entries()),
        embeddings: Object.fromEntries(
          Array.from(this.messageEmbeddings.entries()).map(([id, embedding]) => [
            id,
            Array.from(embedding)
          ])
        ),
        config: this.config,
        timestamp: Date.now()
      };
    } catch (error) {
      logger.warn('⚠️ Error exporting LightVectorDB data, using fallback', { error: (error as Error).message });
      return this.fallbackStore.exportData();
    }
  }

  async importData(data: any): Promise<void> {
    await this.initialize();
    
    try {
      if (data.sessions) {
        this.sessions = new Map(data.sessions.map((s: ChatSession) => [s.id, s]));
      }
      
      if (data.messages) {
        this.messages = new Map(Object.entries(data.messages));
      }
      
      if (data.embeddings) {
        this.messageEmbeddings = new Map(
          Object.entries(data.embeddings).map(([id, embedding]: [string, any]) => [
            id,
            new Float32Array(embedding)
          ])
        );
      }
      
      await this.saveToStorage();
      logger.success('✅ LightVectorDB data imported successfully');
    } catch (error) {
      logger.warn('⚠️ Error importing LightVectorDB data, using fallback', { error: (error as Error).message });
      await this.fallbackStore.importData(data);
    }
  }
}

// Singleton instance
let lightVectorDBInstance: LightVectorDB | null = null;

export const getLightVectorDB = (config?: Partial<VectorStoreConfig>): LightVectorDB => {
  if (!lightVectorDBInstance) {
    lightVectorDBInstance = new LightVectorDB(config);
  }
  return lightVectorDBInstance;
};

export default LightVectorDB;