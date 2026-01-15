/**
 * Vector storage service with SQLite fallback
 * Designed for efficient vector similarity search on mobile devices
 */

// Temporarily comment out SQLite to test the UI
// import * as SQLite from 'expo-sqlite';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  ChatMessage, 
  ChatSession, 
  VectorStore, 
  VectorSearchResult, 
  SessionStats,
  VectorStoreConfig 
} from '../types/chat';

// Default configuration optimized for mobile
const DEFAULT_CONFIG: VectorStoreConfig = {
  maxMessagesPerSession: 100,
  embeddingDimensions: 384, // BGE-small dimensionality
  similarityThreshold: 0.7,
  maxStorageMB: 50,
  cleanupPolicy: {
    maxAge: 30, // days
    maxSessions: 50
  }
};

export class InMemoryVectorStore implements VectorStore {
  private sessions: Map<string, ChatSession> = new Map();
  private messages: Map<string, ChatMessage[]> = new Map();
  private config: VectorStoreConfig;
  private isInitialized: boolean = false;

  constructor(config: Partial<VectorStoreConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    this.isInitialized = true;
    return Promise.resolve();
  }

  // Session Management
  async createSession(title?: string): Promise<ChatSession> {
    await this.initialize();
    
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
    return session;
  }

  async getSession(id: string): Promise<ChatSession | null> {
    await this.initialize();
    return this.sessions.get(id) || null;
  }

  async getAllSessions(): Promise<ChatSession[]> {
    await this.initialize();
    return Array.from(this.sessions.values()).sort((a, b) => b.updatedAt - a.updatedAt);
  }

  async updateSession(id: string, updates: Partial<ChatSession>): Promise<void> {
    await this.initialize();

    const session = this.sessions.get(id);
    if (session) {
      const updatedSession = { ...session, ...updates, updatedAt: Date.now() };
      this.sessions.set(id, updatedSession);
    }
  }

  async deleteSession(id: string): Promise<void> {
    await this.initialize();
    this.sessions.delete(id);
    this.messages.delete(id);
  }

  // Message Operations
  async addMessage(messageData: Omit<ChatMessage, 'id' | 'timestamp'>): Promise<ChatMessage> {
    await this.initialize();

    const message: ChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...messageData,
      timestamp: Date.now()
    };

    const sessionMessages = this.messages.get(messageData.sessionId) || [];
    sessionMessages.push(message);
    this.messages.set(messageData.sessionId, sessionMessages);

    // Update session
    const session = this.sessions.get(messageData.sessionId);
    if (session) {
      session.messageCount = sessionMessages.length;
      session.updatedAt = Date.now();
      session.preview = this.truncateContent(messageData.content);
    }

    return message;
  }

  async getMessages(sessionId: string, limit?: number): Promise<ChatMessage[]> {
    await this.initialize();
    const messages = this.messages.get(sessionId) || [];
    return limit ? messages.slice(-limit) : messages;
  }

  async deleteMessage(id: string): Promise<void> {
    await this.initialize();
    
    for (const [sessionId, messages] of this.messages.entries()) {
      const index = messages.findIndex(msg => msg.id === id);
      if (index !== -1) {
        messages.splice(index, 1);
        
        // Update session message count
        const session = this.sessions.get(sessionId);
        if (session) {
          session.messageCount = messages.length;
          session.updatedAt = Date.now();
        }
        break;
      }
    }
  }

  // Vector Search (simple cosine similarity implementation)
  async searchSimilarMessages(
    query: string | Float32Array,
    sessionId?: string,
    limit: number = 5
  ): Promise<VectorSearchResult[]> {
    await this.initialize();
    
    // Simple text-based search for now
    const results: VectorSearchResult[] = [];
    const searchTerm = typeof query === 'string' ? query.toLowerCase() : '';
    
    for (const [sid, messages] of this.messages.entries()) {
      if (sessionId && sid !== sessionId) continue;
      
      for (const message of messages) {
        if (message.content.toLowerCase().includes(searchTerm)) {
          results.push({
            message,
            similarity: 0.8, // Placeholder similarity
          });
        }
      }
    }
    
    return results.slice(0, limit);
  }

  // Maintenance
  async getStats(): Promise<SessionStats> {
    await this.initialize();
    
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
  }

  async cleanup(): Promise<void> {
    await this.initialize();
    
    const cutoffDate = Date.now() - (this.config.cleanupPolicy.maxAge * 24 * 60 * 60 * 1000);
    
    // Remove old sessions
    for (const [id, session] of this.sessions.entries()) {
      if (session.createdAt < cutoffDate) {
        this.sessions.delete(id);
        this.messages.delete(id);
      }
    }
    
    // Keep only the most recent sessions
    const sessions = Array.from(this.sessions.values()).sort((a, b) => b.updatedAt - a.updatedAt);
    if (sessions.length > this.config.cleanupPolicy.maxSessions) {
      const toDelete = sessions.slice(this.config.cleanupPolicy.maxSessions);
      for (const session of toDelete) {
        this.sessions.delete(session.id);
        this.messages.delete(session.id);
      }
    }
  }

  async exportData(): Promise<any> {
    const sessions = await this.getAllSessions();
    const data: any = { sessions: [], messages: [] };
    
    for (const session of sessions) {
      data.sessions.push(session);
      data.messages.push(...(await this.getMessages(session.id)));
    }
    
    return data;
  }

  async importData(data: any): Promise<void> {
    // Implementation for importing chat data
    console.log('Import not yet implemented');
  }

  // Helper methods
  private rowToSession(row: any): ChatSession {
    return {
      id: row.id,
      title: row.title,
      preview: row.preview || '',
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      messageCount: row.message_count || 0,
      embedding: row.embedding ? this.blobToFloat32Array(row.embedding) : undefined,
      metadata: row.metadata ? JSON.parse(row.metadata) : undefined
    };
  }

  private rowToMessage(row: any): ChatMessage {
    return {
      id: row.id,
      sessionId: row.session_id,
      role: row.role,
      content: row.content,
      timestamp: row.timestamp,
      embedding: row.embedding ? this.blobToFloat32Array(row.embedding) : undefined,
      metadata: row.metadata ? JSON.parse(row.metadata) : undefined
    };
  }

  private float32ArrayToBlob(array: Float32Array): Uint8Array {
    return new Uint8Array(array.buffer);
  }

  private blobToFloat32Array(blob: Uint8Array): Float32Array {
    return new Float32Array(blob.buffer);
  }

  private truncateContent(content: string, maxLength: number = 100): string {
    return content.length > maxLength ? content.substring(0, maxLength) + '...' : content;
  }

  // Cosine similarity calculation
  private cosineSimilarity(a: Float32Array, b: Float32Array): number {
    if (a.length !== b.length) return 0;
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }
}

// Singleton instance
let vectorStoreInstance: InMemoryVectorStore | null = null;

export const getVectorStore = (config?: Partial<VectorStoreConfig>): InMemoryVectorStore => {
  if (!vectorStoreInstance) {
    vectorStoreInstance = new InMemoryVectorStore(config);
  }
  return vectorStoreInstance;
};