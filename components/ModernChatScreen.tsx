/**
 * Modern Chat Screen with sliding history panel and vector storage
 */

import React, { useCallback, useRef, useEffect, useMemo } from 'react';
import {
  View,
  FlatList,
  TouchableOpacity,
  Platform,
  KeyboardAvoidingView,
  SafeAreaView,
  StatusBar,
  Text,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LlamaContext } from 'llama.rn';
import { useTheme } from '../contexts/ThemeContext';
import { useThemeColors, useIsDark } from '../hooks/useThemeColor';
import { Colors, GlassStyles } from '../constants/Colors';
import { useChat } from '../contexts/ChatContext';
import { ChatHistoryPanel } from './ChatHistoryPanel';
import { ChatMessageBubble } from './ChatMessageBubble';
import { ChatInput } from './ChatInput';
import { ModelStatusIndicator } from './ModelStatusIndicator';
import { ChatMessage } from '../types/chat';
import { logger } from '../utils/logger';

interface ModernChatScreenProps {
  context?: LlamaContext | null;
  loading?: boolean;
  status?: string;
  downloadProgress?: number;
  onLoadModel?: () => void;
  onReloadModel?: () => void;
}

export const ModernChatScreen: React.FC<ModernChatScreenProps> = ({
  context,
  loading,
  status,
  downloadProgress,
  onLoadModel,
  onReloadModel,
}) => {
  const colors = useThemeColors();
  const { colorScheme, setColorScheme, isSystemTheme, setSystemTheme } = useTheme();
  const isDark = useIsDark();
  const insets = useSafeAreaInsets();
  const rootBackground = useMemo(() => {
    return colors.background;
  }, [colors.background]);

  const { state, actions } = useChat();
  const flatListRef = useRef<FlatList>(null);
  const lastStateSignature = useRef<string>('');
  const lastAISignature = useRef<string>('');

  // Debug logs (only when there are significant changes)
  useEffect(() => {
    const stateSignature = `${state.currentSessionId}-${state.messages.length}-${state.isLoading}-${!!state.error}`;
    if (stateSignature !== lastStateSignature.current) {
      lastStateSignature.current = stateSignature;
      logger.debug('🎮 ModernChatScreen state:', {
        currentSessionId: state.currentSessionId,
        messagesCount: state.messages.length,
        sessionsCount: state.sessions.length,
        isLoading: state.isLoading,
        error: state.error,
        isHistoryPanelOpen: state.isHistoryPanelOpen,
      });
    }
  }, [state]);

  useEffect(() => {
    const aiSignature = `${!!context}-${loading}-${status}-${downloadProgress}`;
    if (aiSignature !== lastAISignature.current) {
      lastAISignature.current = aiSignature;
      logger.debug('🤖 ModernChatScreen AI props:', {
        hasContext: !!context,
        loading,
        status,
        downloadProgress,
        hasOnLoadModel: !!onLoadModel,
      });
    }
  }, [context, loading, status, downloadProgress, onLoadModel]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (state.messages.length > 0 && flatListRef.current) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [state.messages.length]);

  // Create initial session if none exists
  useEffect(() => {
    if (!state.currentSessionId && state.sessions.length === 0 && !state.isLoading) {
      actions.createSession('New Chat');
    }
  }, [state.currentSessionId, state.sessions.length, state.isLoading, actions]);

  const handleThemeSwitch = useCallback(() => {
    if (isSystemTheme) {
      setSystemTheme(false);
      setColorScheme('light');
    } else {
      const themes: ('light' | 'dark')[] = ['light', 'dark'];
      const currentIndex = themes.indexOf(colorScheme);
      const nextIndex = (currentIndex + 1) % themes.length;
      setColorScheme(themes[nextIndex]);
    }
  }, [colorScheme, isSystemTheme, setColorScheme, setSystemTheme]);

  const handleSendMessage = useCallback((content: string) => {
    actions.sendMessage(content, context || undefined);
    // Scroll to bottom after sending
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 150);
  }, [actions, context]);

  const handleRetryMessage = useCallback((messageId: string) => {
    actions.retryMessage(messageId);
  }, [actions]);

  const renderMessage = useCallback(({ item, index }: { item: ChatMessage; index: number }) => {
    const isLastMessage = index === state.messages.length - 1;
    return (
      <ChatMessageBubble
        message={item}
        isLastMessage={isLastMessage}
        onRetry={item.role === 'user' ? () => handleRetryMessage(item.id) : undefined}
      />
    );
  }, [state.messages.length, handleRetryMessage]);

  const keyExtractor = useCallback((item: ChatMessage) => item.id, []);

  // Manual scroll to latest message
  const scrollToLatest = useCallback(() => {
    flatListRef.current?.scrollToEnd({ animated: true });
  }, []);

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    if (state.messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 400);
    }
  }, [state.messages.length]);

  return (
    <View style={{ flex: 1, backgroundColor: rootBackground }}>
      <SafeAreaView style={{ flex: 1, backgroundColor: rootBackground }}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior="padding"
          // Use padding behavior to keep bottom nav in place
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <StatusBar
            barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'}
            backgroundColor={rootBackground}
            translucent={false}
          />

          {/* Header */}
          <View style={[
            {
              paddingHorizontal: 16,
              paddingVertical: 12,
              paddingTop: insets.top + 12,
              borderBottomWidth: 1,
              borderBottomColor: colors.border,
              backgroundColor: colors.cardBackground,
            },
            isDark && GlassStyles.card
          ]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <TouchableOpacity
                  onPress={actions.toggleHistoryPanel}
                  style={{
                    padding: 8,
                    borderRadius: 8,
                    backgroundColor: colors.backgroundSecondary,
                    marginRight: 12,
                  }}
                >
                  <Ionicons name="menu" size={20} color={colors.icon} />
                </TouchableOpacity>

                <Ionicons name="chatbubbles" size={24} color={colors.tint} />
                <Text style={{ marginLeft: 8, fontSize: 18, fontWeight: '600', color: colors.text }}>
                  {state.sessions.find(s => s.id === state.currentSessionId)?.title || 'Chat'}
                </Text>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ marginRight: 8 }}>
                  <ModelStatusIndicator isModelLoaded={!!context} showEmbedder={true} />
                </View>

                <TouchableOpacity
                  onPress={handleThemeSwitch}
                  style={{
                    padding: 8,
                    borderRadius: 8,
                    backgroundColor: colors.backgroundSecondary,
                    marginRight: 8,
                  }}
                >
                  <Ionicons 
                    name={colorScheme === 'dark' ? 'moon' : 'sunny'} 
                    size={18} 
                    color={colors.icon} 
                  />
                </TouchableOpacity>

                {context && onReloadModel && (
                  <TouchableOpacity
                    onPress={onReloadModel}
                    style={{
                      padding: 8,
                      borderRadius: 8,
                      backgroundColor: colors.backgroundSecondary,
                    }}
                  >
                    <Ionicons name="refresh" size={18} color={colors.icon} />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>

          {/* Messages or Load Placeholder */}
          {context ? (
            <FlatList
              ref={flatListRef}
              data={state.messages}
              renderItem={renderMessage}
              keyExtractor={keyExtractor}
              style={{ flex: 1 }}
              contentContainerStyle={{ 
                paddingVertical: 8,
                // Add generous bottom padding so the last message is not hidden behind input/nav
                paddingBottom: insets.bottom + 140,
                flexGrow: 1,
              }}
              showsVerticalScrollIndicator={false}
              onContentSizeChange={() => {
                // Always scroll DOWN to latest on content change
                setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 50);
              }}
              ListEmptyComponent={
                <View style={{
                  flex: 1,
                  justifyContent: 'center',
                  alignItems: 'center',
                  paddingVertical: 64,
                }}>
                  <Ionicons name="chatbubble-outline" size={64} color={colors.icon} />
                  <Text style={{
                    fontSize: 18,
                    color: colors.text,
                    marginTop: 16,
                    textAlign: 'center',
                  }}>
                    Start a conversation
                  </Text>
                  <Text style={{
                    fontSize: 14,
                    color: colors.icon,
                    marginTop: 8,
                    textAlign: 'center',
                    paddingHorizontal: 32,
                  }}>
                    Type a message below to begin chatting with the AI
                  </Text>
                </View>
              }
              // Performance optimizations
              initialNumToRender={20}
              maxToRenderPerBatch={10}
              windowSize={10}
              removeClippedSubviews={true}
            />
          ) : (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <Ionicons name="download-outline" size={48} color={colors.icon} />
              <Text style={{ marginTop: 16, fontSize: 18, color: colors.text, textAlign: 'center' }}>
                {status || 'AI Model Not Loaded'}
              </Text>
              {typeof downloadProgress === 'number' && downloadProgress > 0 && (
                <Text style={{ marginTop: 8, fontSize: 14, color: colors.icon }}>
                  {downloadProgress.toFixed(1)}%
                </Text>
              )}
              <View style={{ flexDirection: 'row', marginTop: 16 }}>
                {onLoadModel && (
                  <TouchableOpacity
                    onPress={onLoadModel}
                    style={[
                      {
                        paddingHorizontal: 16,
                        paddingVertical: 10,
                        borderRadius: 10,
                        backgroundColor: colors.tint,
                        marginRight: 8,
                      },
                      isDark && GlassStyles.button,
                    ]}
                  >
                    <Text style={{ color: 'white', fontSize: 14, fontWeight: '600' }}>
                      {loading ? 'Loading...' : 'Load Model'}
                    </Text>
                  </TouchableOpacity>
                )}
                {onReloadModel && (
                  <TouchableOpacity
                    onPress={onReloadModel}
                    style={[
                      {
                        paddingHorizontal: 16,
                        paddingVertical: 10,
                        borderRadius: 10,
                        backgroundColor: colors.backgroundSecondary,
                      },
                      isDark && GlassStyles.button,
                    ]}
                  >
                    <Text style={{ color: colors.text, fontSize: 14, fontWeight: '600' }}>
                      Reload
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}

          {/* Loading indicator for AI response */}
          {context && state.isGenerating && (
            <View style={{
              paddingHorizontal: 16,
              paddingVertical: 8,
              alignItems: 'flex-start',
            }}>
              <View style={[
                {
                  flexDirection: 'row',
                  alignItems: 'center',
                  padding: 16,
                  borderRadius: 18,
                  backgroundColor: colors.backgroundSecondary,
                  borderWidth: 1,
                  borderColor: colors.border,
                  maxWidth: '80%',
                  borderBottomLeftRadius: 6,
                },
                isDark && GlassStyles.card,
              ]}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: colors.tint,
                    marginRight: 8,
                  }} />
                  <View style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: colors.tint,
                    marginRight: 8,
                    opacity: 0.7,
                  }} />
                  <View style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: colors.tint,
                    opacity: 0.4,
                  }} />
                </View>
                <Text style={{ marginLeft: 12, color: colors.text, fontSize: 14 }}>
                  AI is thinking...
                </Text>
              </View>
            </View>
          )}

          {/* Jump to Latest Button */}
          {state.messages.length > 3 && (
            <View style={{
              position: 'absolute',
              // Keep above input and nav
              bottom: insets.bottom + 100,
              right: 16,
              zIndex: 1000,
            }}>
              <TouchableOpacity
                onPress={scrollToLatest}
                style={{
                  backgroundColor: colors.tint,
                  width: 50,
                  height: 50,
                  borderRadius: 25,
                  alignItems: 'center',
                  justifyContent: 'center',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.25,
                  shadowRadius: 4,
                  elevation: 5,
                }}
              >
                <Ionicons name="arrow-down" size={24} color="white" />
              </TouchableOpacity>
            </View>
          )}

          {/* Chat Input */}
          <ChatInput
            onSendMessage={handleSendMessage}
            isDisabled={!context || state.isGenerating}
            placeholder={context ? "Type a message..." : "AI model not loaded"}
          />
        </KeyboardAvoidingView>
      </SafeAreaView>

      {/* Chat History Panel */}
      <ChatHistoryPanel
        sessions={state.sessions}
        currentSessionId={state.currentSessionId}
        onSessionSelect={actions.selectSession}
        onSessionCreate={() => actions.createSession()}
        onSessionRename={actions.renameSession}
        onSessionDelete={actions.deleteSession}
        isOpen={state.isHistoryPanelOpen}
        onToggle={actions.toggleHistoryPanel}
      />
    </View>
  );
};