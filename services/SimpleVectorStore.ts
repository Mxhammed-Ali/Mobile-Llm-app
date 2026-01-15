/**
 * Simple in-memory vector storage for testing UI
 */

import { 
  ChatMessage, 
  ChatSession, 
  VectorStore, 
  VectorSearchResult, 
  SessionStats,
  VectorStoreConfig 
} from '../types/chat';
import { logger } from '../utils/logger';

const DEFAULT_CONFIG: VectorStoreConfig = {
  maxMessagesPerSession: 100,
  embeddingDimensions: 384,
  similarityThreshold: 0.7,
  maxStorageMB: 50,
  cleanupPolicy: {
    maxAge: 30,
    maxSessions: 50
  }
};

export class SimpleVectorStore implements VectorStore {
  private sessions: Map<string, ChatSession> = new Map();
  private messages: Map<string, ChatMessage[]> = new Map();
  private messageCounter: number = 0;
  private config: VectorStoreConfig;

  constructor(config: Partial<VectorStoreConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  // Session Management
  async createSession(title?: string): Promise<ChatSession> {
    logger.info('📝 Creating new session', { title });
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
    logger.success('✅ Session created', { sessionId: session.id, title: session.title });
    return session;
  }

  async getSession(id: string): Promise<ChatSession | null> {
    logger.debug('🔍 Getting session', { sessionId: id });
    const session = this.sessions.get(id) || null;
    if (session) {
      logger.debug('✅ Session found', { sessionId: id, title: session.title });
    } else {
      logger.warn('⚠️ Session not found', { sessionId: id });
    }
    return session;
  }

  async getAllSessions(): Promise<ChatSession[]> {
    logger.debug('📋 Getting all sessions', { count: this.sessions.size });
    const sessions = Array.from(this.sessions.values()).sort((a, b) => b.updatedAt - a.updatedAt);
    logger.debug('✅ Retrieved all sessions', { count: sessions.length });
    return sessions;
  }

  async updateSession(id: string, updates: Partial<ChatSession>): Promise<void> {
    logger.info('✏️ Updating session', { sessionId: id, updates });
    const session = this.sessions.get(id);
    if (session) {
      const updatedSession = { ...session, ...updates, updatedAt: Date.now() };
      this.sessions.set(id, updatedSession);
      logger.success('✅ Session updated', { sessionId: id });
    } else {
      logger.warn('⚠️ Session not found for update', { sessionId: id });
    }
  }

  async deleteSession(id: string): Promise<void> {
    logger.info('🗑️ Deleting session', { sessionId: id });
    this.sessions.delete(id);
    this.messages.delete(id);
    logger.success('✅ Session deleted', { sessionId: id });
  }

  // Message Operations
  async addMessage(messageData: Omit<ChatMessage, 'id' | 'timestamp'>): Promise<ChatMessage> {
    // Generate a truly unique ID with session prefix, timestamp, counter, and random
    const now = Date.now();
    this.messageCounter++;
    const randomPart = Math.random().toString(36).substr(2, 8);
    const sessionPrefix = messageData.sessionId.substr(-6); // Last 6 chars of session ID
    
    const message: ChatMessage = {
      id: `msg_${sessionPrefix}_${now}_${this.messageCounter}_${randomPart}`,
      timestamp: now,
      ...messageData
    };

    logger.info('📝 Creating message', { 
      messageId: message.id, 
      sessionId: messageData.sessionId,
      role: messageData.role,
      contentLength: messageData.content.length
    });

    const sessionMessages = this.messages.get(message.sessionId) || [];
    sessionMessages.push(message);
    this.messages.set(message.sessionId, sessionMessages);

    // Update session stats
    const session = this.sessions.get(message.sessionId);
    if (session) {
      session.messageCount = sessionMessages.length;
      session.updatedAt = message.timestamp;
      session.preview = this.truncateContent(message.content);
      this.sessions.set(session.id, session);
      logger.debug('✅ Session stats updated', { 
        sessionId: session.id, 
        messageCount: session.messageCount 
      });
    }

    logger.success('✅ Message added', { 
      messageId: message.id, 
      sessionId: messageData.sessionId,
      role: messageData.role
    });
    return message;
  }

  async getMessages(sessionId: string, limit?: number): Promise<ChatMessage[]> {
    logger.debug('📥 Getting messages', { sessionId, limit });
    const messages = this.messages.get(sessionId) || [];
    const result = limit ? messages.slice(-limit) : messages;
    logger.debug('✅ Retrieved messages', { sessionId, count: result.length });
    return result;
  }

  async deleteMessage(id: string): Promise<void> {
    logger.info('🗑️ Deleting message', { messageId: id });
    for (const [sessionId, messages] of this.messages.entries()) {
      const index = messages.findIndex(m => m.id === id);
      if (index >= 0) {
        messages.splice(index, 1);
        this.messages.set(sessionId, messages);
        
        // Update session message count
        const session = this.sessions.get(sessionId);
        if (session) {
          session.messageCount = messages.length;
          this.sessions.set(sessionId, session);
        }
        logger.success('✅ Message deleted', { messageId: id, sessionId });
        break;
      }
    }
    logger.warn('⚠️ Message not found for deletion', { messageId: id });
  }

  async updateMessage(messageId: string, updates: Partial<ChatMessage>): Promise<void> {
    logger.debug('✏️ Updating message', { messageId, updates: Object.keys(updates) });
    for (const [sessionId, sessionMessages] of this.messages.entries()) {
      const messageIndex = sessionMessages.findIndex(msg => msg.id === messageId);
      if (messageIndex !== -1) {
        sessionMessages[messageIndex] = { ...sessionMessages[messageIndex], ...updates };
        this.messages.set(sessionId, sessionMessages);
        logger.success('✅ Message updated', { messageId, sessionId });
        break;
      }
    }
    logger.warn('⚠️ Message not found for update', { messageId });
  }

  // Vector Search (placeholder)
  async searchSimilarMessages(
    query: string | Float32Array,
    sessionId?: string,
    limit: number = 5
  ): Promise<VectorSearchResult[]> {
    logger.debug('🔍 Searching similar messages', { 
      queryType: typeof query, 
      sessionId, 
      limit 
    });
    return [];
  }

  // Maintenance
  async getStats(): Promise<SessionStats> {
    logger.debug('📊 Getting storage stats');
    const totalMessages = Array.from(this.messages.values()).reduce(
      (sum, messages) => sum + messages.length, 
      0
    );
    
    const oldestSession = Math.min(
      ...Array.from(this.sessions.values()).map(s => s.createdAt)
    );

    const stats = {
      totalSessions: this.sessions.size,
      totalMessages,
      storageUsed: 0,
      oldestSession: isFinite(oldestSession) ? oldestSession : Date.now()
    };

    logger.debug('✅ Storage stats retrieved', stats);
    return stats;
  }

  async cleanup(): Promise<void> {
    logger.info('🧹 Starting cleanup');
    // Simple cleanup: keep only recent sessions
    const sessions = Array.from(this.sessions.values())
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .slice(0, this.config.cleanupPolicy.maxSessions);
    
    this.sessions.clear();
    this.messages.clear();
    
    sessions.forEach(session => {
      this.sessions.set(session.id, session);
      this.messages.set(session.id, []);
    });
    logger.success('✅ Cleanup completed', { keptSessions: sessions.length });
  }

  async exportData(): Promise<any> {
    logger.info('📤 Exporting data');
    const data = {
      sessions: Array.from(this.sessions.values()),
      messages: Object.fromEntries(this.messages.entries())
    };
    logger.success('✅ Data exported', { 
      sessionsCount: data.sessions.length,
      messagesCount: Object.keys(data.messages).length
    });
    return data;
  }

  async importData(data: any): Promise<void> {
    logger.info('📥 Importing data');
    if (data.sessions) {
      data.sessions.forEach((session: ChatSession) => {
        this.sessions.set(session.id, session);
      });
    }
    
    if (data.messages) {
      Object.entries(data.messages).forEach(([sessionId, messages]) => {
        this.messages.set(sessionId, messages as ChatMessage[]);
      });
    }
    logger.success('✅ Data imported', { 
      sessionsCount: data.sessions?.length || 0,
      messagesCount: Object.keys(data.messages || {}).length
    });
  }

  private truncateContent(content: string, maxLength: number = 100): string {
    return content.length > maxLength ? content.substring(0, maxLength) + '...' : content;
  }
}

// Singleton instance
let vectorStoreInstance: SimpleVectorStore | null = null;

export const getVectorStore = (config?: Partial<VectorStoreConfig>): SimpleVectorStore => {
  if (!vectorStoreInstance) {
    vectorStoreInstance = new SimpleVectorStore(config);
  }
  return vectorStoreInstance;
};