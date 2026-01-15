/**
 * Chat system data models for ChatGPT-style interface
 */

export interface ChatMessage {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  embedding?: Float32Array; // Vector embedding for similarity search
  metadata?: {
    model?: string;
    tokens?: number;
    processingTime?: number;
  };
}

export interface ChatSession {
  id: string;
  title: string;
  preview: string; // Last message preview
  createdAt: number;
  updatedAt: number;
  messageCount: number;
  embedding?: Float32Array; // Aggregated session embedding
  metadata?: {
    archived?: boolean;
    starred?: boolean;
    tags?: string[];
  };
}

export interface VectorSearchResult {
  message: ChatMessage;
  similarity: number;
}

export interface SessionStats {
  totalSessions: number;
  totalMessages: number;
  storageUsed: number; // bytes
  oldestSession: number; // timestamp
}

// Configuration for vector storage
export interface VectorStoreConfig {
  maxMessagesPerSession: number;
  embeddingDimensions: number;
  similarityThreshold: number;
  maxStorageMB: number;
  cleanupPolicy: {
    maxAge: number; // days
    maxSessions: number;
  };
}

// Abstract interface for storage implementations
export interface VectorStore {
  // Session management
  createSession(title?: string): Promise<ChatSession>;
  getSession(id: string): Promise<ChatSession | null>;
  getAllSessions(): Promise<ChatSession[]>;
  updateSession(id: string, updates: Partial<ChatSession>): Promise<void>;
  deleteSession(id: string): Promise<void>;
  
  // Message operations
  addMessage(message: Omit<ChatMessage, 'id' | 'timestamp'>): Promise<ChatMessage>;
  getMessages(sessionId: string, limit?: number): Promise<ChatMessage[]>;
  deleteMessage(id: string): Promise<void>;
  
  // Vector search
  searchSimilarMessages(
    query: string | Float32Array,
    sessionId?: string,
    limit?: number
  ): Promise<VectorSearchResult[]>;
  
  // Maintenance
  getStats(): Promise<SessionStats>;
  cleanup(): Promise<void>;
  exportData(): Promise<any>;
  importData(data: any): Promise<void>;
}

// UI State types
export interface ChatUIState {
  currentSessionId: string | null;
  sessions: ChatSession[];
  messages: ChatMessage[];
  isHistoryPanelOpen: boolean;
  isLoading: boolean;
  isGenerating: boolean;
  error: string | null;
}

export interface ChatHistoryPanelProps {
  sessions: ChatSession[];
  currentSessionId: string | null;
  onSessionSelect: (sessionId: string) => void;
  onSessionCreate: () => void;
  onSessionRename: (sessionId: string, newTitle: string) => void;
  onSessionDelete: (sessionId: string) => void;
  isOpen: boolean;
  onToggle: () => void;
}

export interface ChatMessageBubbleProps {
  message: ChatMessage;
  isLastMessage: boolean;
  onRetry?: () => void;
}

export interface ChatInputProps {
  onSendMessage: (content: string) => void;
  isDisabled?: boolean;
  placeholder?: string;
}