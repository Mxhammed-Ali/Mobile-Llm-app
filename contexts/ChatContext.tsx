/**
 * Chat Context for managing global chat state
 */

import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { ChatMessage, ChatSession, ChatUIState } from '../types/chat';
import { getLightVectorDB } from '../services/LightVectorDB';
import { sendMessage as sendLlamaMessage } from '../llama/llama.config';
import { LlamaContext } from 'llama.rn';
import { logger } from '../utils/logger';
import { contextRulesService } from '../services/ContextRulesService';

interface ChatContextType {
  state: ChatUIState;
  actions: {
    // Session management
    createSession: (title?: string) => Promise<string>;
    selectSession: (sessionId: string) => Promise<void>;
    renameSession: (sessionId: string, newTitle: string) => Promise<void>;
    deleteSession: (sessionId: string) => Promise<void>;
    toggleHistoryPanel: () => void;
    
    // Message management
    sendMessage: (content: string, context?: LlamaContext) => Promise<void>;
    retryMessage: (messageId: string) => Promise<void>;
    deleteMessage: (messageId: string) => Promise<void>;
    
    // UI state
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
    clearError: () => void;
  };
}

// Action types
type ChatAction =
  | { type: 'SET_SESSIONS'; sessions: ChatSession[] }
  | { type: 'SET_CURRENT_SESSION'; sessionId: string | null }
  | { type: 'SET_MESSAGES'; messages: ChatMessage[] }
  | { type: 'ADD_MESSAGE'; message: ChatMessage }
  | { type: 'UPDATE_MESSAGE'; messageId: string; updates: Partial<ChatMessage> }
  | { type: 'REMOVE_MESSAGE'; messageId: string }
  | { type: 'SET_LOADING'; loading: boolean }
  | { type: 'SET_GENERATING'; generating: boolean }
  | { type: 'SET_ERROR'; error: string | null }
  | { type: 'TOGGLE_HISTORY_PANEL' }
  | { type: 'UPDATE_SESSION'; sessionId: string; updates: Partial<ChatSession> };

// Initial state
const initialState: ChatUIState = {
  currentSessionId: null,
  sessions: [],
  messages: [],
  isHistoryPanelOpen: false,
  isLoading: false,
  isGenerating: false,
  error: null,
};

// Reducer
const chatReducer = (state: ChatUIState, action: ChatAction): ChatUIState => {
  switch (action.type) {
    case 'SET_SESSIONS':
      return { ...state, sessions: action.sessions };
    
    case 'SET_CURRENT_SESSION':
      return { ...state, currentSessionId: action.sessionId };
    
    case 'SET_MESSAGES':
      return { ...state, messages: action.messages };
    
    case 'ADD_MESSAGE':
      // Prevent duplicate messages by ID
      if (state.messages.find(m => m.id === action.message.id)) {
        console.log('⚠️ Duplicate message skipped:', action.message.id);
        return state;
      }
      return {
        ...state,
        messages: [...state.messages, action.message],
      };
    
    case 'UPDATE_MESSAGE':
      return {
        ...state,
        messages: state.messages.map(msg =>
          msg.id === action.messageId ? { ...msg, ...action.updates } : msg
        )
      };
    
    case 'REMOVE_MESSAGE':
      return {
        ...state,
        messages: state.messages.filter(msg => msg.id !== action.messageId)
      };
    
    case 'SET_LOADING':
      return { ...state, isLoading: action.loading };
    
    case 'SET_GENERATING':
      return { ...state, isGenerating: action.generating };
    
    case 'SET_ERROR':
      return { ...state, error: action.error };
    
    case 'TOGGLE_HISTORY_PANEL':
      return { ...state, isHistoryPanelOpen: !state.isHistoryPanelOpen };
    
    case 'UPDATE_SESSION':
      return {
        ...state,
        sessions: state.sessions.map(session =>
          session.id === action.sessionId ? { ...session, ...action.updates } : session
        )
      };
    
    default:
      return state;
  }
};

// Context
const ChatContext = createContext<ChatContextType | null>(null);

// Provider component
export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(chatReducer, initialState);
  const vectorStore = getLightVectorDB();

  // Load sessions on mount
  useEffect(() => {
    loadSessions();
  }, []);

  // Load current session messages when session changes
  useEffect(() => {
    if (state.currentSessionId) {
      loadMessages(state.currentSessionId);
    } else {
      dispatch({ type: 'SET_MESSAGES', messages: [] });
    }
  }, [state.currentSessionId]);

  const loadSessions = useCallback(async () => {
    try {
      logger.info('🔄 Loading sessions...');
      dispatch({ type: 'SET_LOADING', loading: true });
      const sessions = await vectorStore.getAllSessions();
      logger.success('📋 Loaded sessions', { count: sessions.length });
      dispatch({ type: 'SET_SESSIONS', sessions });
      
      // If no current session and sessions exist, select the most recent one
      if (!state.currentSessionId && sessions.length > 0) {
        logger.info('🎯 Selecting first session', { sessionId: sessions[0].id });
        dispatch({ type: 'SET_CURRENT_SESSION', sessionId: sessions[0].id });
      }
    } catch (error) {
      logger.error('❌ Failed to load sessions', { error: (error as Error).message });
      dispatch({ type: 'SET_ERROR', error: 'Failed to load chat sessions' });
    } finally {
      dispatch({ type: 'SET_LOADING', loading: false });
    }
  }, [state.currentSessionId]);

  const loadMessages = useCallback(async (sessionId: string) => {
    try {
      logger.info('📥 Loading messages for session', { sessionId });
      dispatch({ type: 'SET_LOADING', loading: true });
      const messages = await vectorStore.getMessages(sessionId);
      logger.success('📥 Loaded messages', { sessionId, count: messages.length });
      dispatch({ type: 'SET_MESSAGES', messages });
    } catch (error) {
      logger.error('Failed to load messages', { sessionId, error: (error as Error).message });
      dispatch({ type: 'SET_ERROR', error: 'Failed to load messages' });
    } finally {
      dispatch({ type: 'SET_LOADING', loading: false });
    }
  }, []);

  const createSession = useCallback(async (title?: string): Promise<string> => {
    try {
      logger.info('➕ Creating new session', { title });
      const session = await vectorStore.createSession(title);
      logger.success('✅ Created session', { sessionId: session.id, title });
      
      // Clear current messages to ensure clean slate for new chat
      dispatch({ type: 'SET_MESSAGES', messages: [] });
      
      // Update sessions list and set as current
      dispatch({ type: 'SET_SESSIONS', sessions: [session, ...state.sessions] });
      dispatch({ type: 'SET_CURRENT_SESSION', sessionId: session.id });
      
      logger.success('✅ New session created and activated', { sessionId: session.id });
      return session.id;
    } catch (error) {
      logger.error('❌ Failed to create session', { error: (error as Error).message });
      dispatch({ type: 'SET_ERROR', error: 'Failed to create new chat' });
      throw error;
    }
  }, [state.sessions]);

  const selectSession = useCallback(async (sessionId: string) => {
    logger.info('🔄 Selecting session', { sessionId });
    
    // Clear current messages first to ensure clean context
    dispatch({ type: 'SET_MESSAGES', messages: [] });
    
    // Set the new session
    dispatch({ type: 'SET_CURRENT_SESSION', sessionId });
    
    // Load messages for the selected session
    await loadMessages(sessionId);
    
    // Close history panel on mobile after selection
    if (state.isHistoryPanelOpen) {
      dispatch({ type: 'TOGGLE_HISTORY_PANEL' });
    }
    
    logger.success('✅ Session selected and messages loaded', { sessionId });
  }, [state.isHistoryPanelOpen, loadMessages]);

  const renameSession = useCallback(async (sessionId: string, newTitle: string) => {
    try {
      logger.info('✏️ Renaming session', { sessionId, newTitle });
      await vectorStore.updateSession(sessionId, { title: newTitle });
      dispatch({ type: 'UPDATE_SESSION', sessionId, updates: { title: newTitle } });
      logger.success('✅ Session renamed', { sessionId, newTitle });
    } catch (error) {
      logger.error('Failed to rename session', { sessionId, newTitle, error: (error as Error).message });
      dispatch({ type: 'SET_ERROR', error: 'Failed to rename chat' });
    }
  }, []);

  const deleteSession = useCallback(async (sessionId: string) => {
    try {
      logger.info('🗑️ Deleting session', { sessionId });
      await vectorStore.deleteSession(sessionId);
      const updatedSessions = state.sessions.filter(s => s.id !== sessionId);
      dispatch({ type: 'SET_SESSIONS', sessions: updatedSessions });
      
      // If deleted session was current, select another or clear
      if (state.currentSessionId === sessionId) {
        // Clear current messages first
        dispatch({ type: 'SET_MESSAGES', messages: [] });
        
        if (updatedSessions.length > 0) {
          // Select the first available session and load its messages
          const newCurrentId = updatedSessions[0].id;
          dispatch({ type: 'SET_CURRENT_SESSION', sessionId: newCurrentId });
          await loadMessages(newCurrentId);
          logger.success('✅ Switched to session', { newSessionId: newCurrentId });
        } else {
          // No sessions left, clear current session
          dispatch({ type: 'SET_CURRENT_SESSION', sessionId: null });
          logger.info('✅ No sessions remaining, cleared current session');
        }
      }
      
      logger.success('✅ Session deleted successfully', { sessionId });
    } catch (error) {
      logger.error('❌ Failed to delete session', { sessionId, error: (error as Error).message });
      dispatch({ type: 'SET_ERROR', error: 'Failed to delete chat' });
    }
  }, [state.sessions, state.currentSessionId, loadMessages]);

  const sendMessage = useCallback(async (content: string, context?: LlamaContext) => {
    // Prevent duplicate sends
    if (state.isGenerating) {
      logger.warn('Already generating, ignoring duplicate send request');
      return;
    }

    // Prevent duplicate content
    const trimmedContent = content.trim();
    if (!trimmedContent) {
      return;
    }

    // Check for recent duplicate messages
    const recentMessage = state.messages[state.messages.length - 1];
    if (recentMessage && 
        recentMessage.role === 'user' && 
        recentMessage.content === trimmedContent &&
        Date.now() - recentMessage.timestamp < 5000) {
      logger.warn('Duplicate message detected, ignoring');
      return;
    }

    let sessionId = state.currentSessionId;
    if (!sessionId) {
      try {
        sessionId = await createSession();
      } catch {
        logger.error('Failed to create session for message');
        return;
      }
    }

    try {
      logger.info('📨 Sending message', { contentLength: trimmedContent.length });
      dispatch({ type: 'SET_GENERATING', generating: true });
      dispatch({ type: 'SET_ERROR', error: null });

      // Prepare conversation history for AI
      const previousMessages = state.messages.map(msg => ({ role: msg.role, content: msg.content }));
      
      logger.info('📋 Conversation history', {
        previousMessages: previousMessages.length
      });

      const currentSessionId = sessionId!;

      if (!currentSessionId) {
        throw new Error('No valid session ID available');
      }

      // Get AI context/rules if enabled
      const contextRules = await contextRulesService.getContextForAI();

      // Send to AI with history + current message + context
      if (context) {
        try {
          logger.info('🤖 Sending to AI', {
            historyLength: previousMessages.length,
            hasContextRules: !!contextRules
          });

          const response = await sendLlamaMessage(context, trimmedContent, previousMessages, contextRules);
          
          logger.success('✅ AI response received', {
            responseLength: response.length
          });

          // Store user message with embedding
          const userMessage = await vectorStore.addMessage({
            sessionId: currentSessionId,
            role: 'user',
            content: trimmedContent,
          });

          // Store AI response with embedding
          const aiMessage = await vectorStore.addMessage({
            sessionId: currentSessionId,
            role: 'assistant',
            content: response,
          });

          // Update UI with both messages
          dispatch({ type: 'ADD_MESSAGE', message: userMessage });
          dispatch({ type: 'ADD_MESSAGE', message: aiMessage });

          logger.info('💬 Conversation turn complete', {
            messagesStored: 2
          });
          
        } catch (aiError) {
          logger.error('AI response failed', { error: (aiError as Error).message });
          dispatch({ type: 'SET_ERROR', error: 'Failed to get AI response' });
        }
      } else {
        logger.warn('No AI context available');
        
        // If no AI context, just store the user message
        const userMessage = await vectorStore.addMessage({
          sessionId: currentSessionId,
          role: 'user',
          content: trimmedContent,
        });

        dispatch({ type: 'ADD_MESSAGE', message: userMessage });
      }

    } catch (error) {
      logger.error('Failed to send message', { error: (error as Error).message });
      dispatch({ type: 'SET_ERROR', error: 'Failed to send message' });
    } finally {
      dispatch({ type: 'SET_GENERATING', generating: false });
    }
  }, [state.currentSessionId, state.messages, state.isGenerating, createSession]);

  const retryMessage = useCallback(async (messageId: string) => {
    // Find the message to retry
    const message = state.messages.find(m => m.id === messageId);
    if (!message || message.role !== 'user') return;

    logger.info('🔄 Retrying message', { messageId });

    // Remove the failed AI response if it exists
    const messageIndex = state.messages.findIndex(m => m.id === messageId);
    const nextMessage = state.messages[messageIndex + 1];
    if (nextMessage && nextMessage.role === 'assistant') {
      dispatch({ type: 'REMOVE_MESSAGE', messageId: nextMessage.id });
      await vectorStore.deleteMessage(nextMessage.id);
      logger.info('🗑️ Removed failed AI response', { messageId: nextMessage.id });
    }

    // Resend the message
    // Note: This is a simplified retry - in production you might want more sophisticated logic
    await sendMessage(message.content);
  }, [state.messages, sendMessage]);

  const deleteMessage = useCallback(async (messageId: string) => {
    try {
      logger.info('🗑️ Deleting message', { messageId });
      await vectorStore.deleteMessage(messageId);
      dispatch({ type: 'REMOVE_MESSAGE', messageId });
      logger.success('✅ Message deleted', { messageId });
    } catch (error) {
      logger.error('Failed to delete message', { messageId, error: (error as Error).message });
      dispatch({ type: 'SET_ERROR', error: 'Failed to delete message' });
    }
  }, []);

  const toggleHistoryPanel = useCallback(() => {
    logger.info('🔄 Toggling history panel', { currentState: state.isHistoryPanelOpen });
    dispatch({ type: 'TOGGLE_HISTORY_PANEL' });
  }, [state.isHistoryPanelOpen]);

  const setLoading = useCallback((loading: boolean) => {
    logger.debug('🔄 Setting loading state', { loading });
    dispatch({ type: 'SET_LOADING', loading });
  }, []);

  const setError = useCallback((error: string | null) => {
    logger.debug('🔄 Setting error state', { error });
    dispatch({ type: 'SET_ERROR', error });
  }, []);

  const clearError = useCallback(() => {
    logger.debug('🔄 Clearing error state');
    dispatch({ type: 'SET_ERROR', error: null });
  }, []);

  const contextValue: ChatContextType = {
    state,
    actions: {
      createSession,
      selectSession,
      renameSession,
      deleteSession,
      toggleHistoryPanel,
      sendMessage,
      retryMessage,
      deleteMessage,
      setLoading,
      setError,
      clearError,
    },
  };

  return (
    <ChatContext.Provider value={contextValue}>
      {children}
    </ChatContext.Provider>
  );
};

// Hook for using chat context
export const useChat = (): ChatContextType => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};