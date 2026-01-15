/**
 * Chat History Panel - Sliding drawer for session management
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  TextInput,
  Alert,
  Modal,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors, useIsDark } from '../hooks/useThemeColor';
import { ChatSession, ChatHistoryPanelProps } from '../types/chat';
import { GlassStyles } from '../constants/Colors';
import { ModelSelectionPanel } from './ModelSelectionPanel';
import { EmbeddingModelPanel } from './EmbeddingModelPanel';
import { SystemPerformancePanel } from './SystemPerformancePanel';
import { ContextRulesPanel } from './ContextRulesPanel';

const { width: screenWidth } = Dimensions.get('window');

interface SessionItemProps {
  session: ChatSession;
  isSelected: boolean;
  onSelect: () => void;
  onRename: (newTitle: string) => void;
  onDelete: () => void;
}

const SessionItem: React.FC<SessionItemProps> = ({
  session,
  isSelected,
  onSelect,
  onRename,
  onDelete,
}) => {
  const colors = useThemeColors();
  const isDark = useIsDark();
  const [showMenu, setShowMenu] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [newTitle, setNewTitle] = useState(session.title);

  const handleRename = useCallback(() => {
    if (newTitle.trim() && newTitle !== session.title) {
      onRename(newTitle.trim());
    }
    setIsRenaming(false);
    setShowMenu(false);
  }, [newTitle, session.title, onRename]);

  const handleDelete = useCallback(() => {
    Alert.alert(
      'Delete Chat',
      `Are you sure you want to delete "${session.title}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            onDelete();
            setShowMenu(false);
          }
        },
      ]
    );
  }, [session.title, onDelete]);

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <View style={{
      marginBottom: 8,
      borderRadius: 12,
      backgroundColor: isSelected 
        ? (isDark ? 'rgba(138, 99, 255, 0.2)' : colors.tint + '20') 
        : 'transparent',
      ...(isDark && isSelected ? GlassStyles.card : {}),
    }}>
      <TouchableOpacity
        onPress={onSelect}
        style={{
          padding: 16,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
        activeOpacity={0.7}
      >
        <View style={{ flex: 1 }}>
          {isRenaming ? (
            <TextInput
              value={newTitle}
              onChangeText={setNewTitle}
              onBlur={handleRename}
              onSubmitEditing={handleRename}
              autoFocus
              style={{
                fontSize: 16,
                fontWeight: '600',
                color: colors.text,
                backgroundColor: colors.backgroundSecondary,
                padding: 8,
                borderRadius: 6,
                borderWidth: 1,
                borderColor: colors.border,
              }}
              placeholder="Chat title"
              placeholderTextColor={colors.icon}
            />
          ) : (
            <>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: '600',
                  color: colors.text,
                  marginBottom: 4,
                }}
                numberOfLines={1}
              >
                {session.title}
              </Text>
              <Text
                style={{
                  fontSize: 12,
                  color: colors.icon,
                  marginBottom: 2,
                }}
                numberOfLines={1}
              >
                {session.preview || 'No messages yet'}
              </Text>
              <Text
                style={{
                  fontSize: 11,
                  color: colors.icon,
                }}
              >
                {formatDate(session.updatedAt)} • {session.messageCount} messages
              </Text>
            </>
          )}
        </View>

        {!isRenaming && (
          <TouchableOpacity
            onPress={() => setShowMenu(true)}
            style={{
              padding: 8,
              marginLeft: 8,
            }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="ellipsis-vertical" size={16} color={colors.icon} />
          </TouchableOpacity>
        )}
      </TouchableOpacity>

      {/* Context Menu Modal */}
      <Modal
        visible={showMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMenu(false)}
      >
        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            justifyContent: 'center',
            alignItems: 'center',
          }}
          activeOpacity={1}
          onPress={() => setShowMenu(false)}
        >
          <View
            style={[
              {
                backgroundColor: colors.cardBackground,
                borderRadius: 12,
                minWidth: 200,
                padding: 8,
                borderWidth: 1,
                borderColor: colors.border,
              },
              isDark && GlassStyles.overlay,
            ]}
          >
            <TouchableOpacity
              onPress={() => {
                setIsRenaming(true);
                setShowMenu(false);
              }}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                padding: 12,
                borderRadius: 8,
              }}
            >
              <Ionicons name="pencil" size={18} color={colors.icon} />
              <Text style={{ marginLeft: 12, fontSize: 16, color: colors.text }}>
                Rename
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleDelete}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                padding: 12,
                borderRadius: 8,
              }}
            >
              <Ionicons name="trash" size={18} color={colors.error} />
              <Text style={{ marginLeft: 12, fontSize: 16, color: colors.error }}>
                Delete
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

export const ChatHistoryPanel: React.FC<ChatHistoryPanelProps> = ({
  sessions,
  currentSessionId,
  onSessionSelect,
  onSessionCreate,
  onSessionRename,
  onSessionDelete,
  isOpen,
  onToggle,
}) => {
  const colors = useThemeColors();
  const isDark = useIsDark();
  const insets = useSafeAreaInsets();
  
  const [activeTab, setActiveTab] = useState<'chats' | 'models' | 'embeddings' | 'performance' | 'context'>('chats');
  const [showModelSelection, setShowModelSelection] = useState(false);

  const renderSession = useCallback(({ item }: { item: ChatSession }) => (
    <SessionItem
      session={item}
      isSelected={item.id === currentSessionId}
      onSelect={() => onSessionSelect(item.id)}
      onRename={(newTitle) => onSessionRename(item.id, newTitle)}
      onDelete={() => onSessionDelete(item.id)}
    />
  ), [currentSessionId, onSessionSelect, onSessionRename, onSessionDelete]);

  const keyExtractor = useCallback((item: ChatSession) => item.id, []);

  const panelContent = (
    <View
      style={[
        {
          flex: 1,
          backgroundColor: colors.background,
          paddingTop: insets.top,
        },
        isDark && { backgroundColor: 'transparent' },
      ]}
    >
      {/* Header */}
      <View
        style={[
          {
            paddingHorizontal: 16,
            paddingVertical: 16,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
            backgroundColor: colors.cardBackground,
          },
          isDark && GlassStyles.card,
        ]}
      >
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 16,
        }}>
          <Text style={{
            fontSize: 20,
            fontWeight: '700',
            color: colors.text,
          }}>
            AI Assistant
          </Text>

          <TouchableOpacity
            onPress={onToggle}
            style={{
              padding: 10,
              borderRadius: 10,
              backgroundColor: colors.backgroundSecondary,
            }}
          >
            <Ionicons name="close" size={20} color={colors.icon} />
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          {[
            { key: 'chats', label: 'Chats', icon: 'chatbubbles-outline' },
            { key: 'models', label: 'Models', icon: 'cube-outline' },
            { key: 'embeddings', label: 'Vectors', icon: 'git-network-outline' },
            { key: 'context', label: 'Context', icon: 'document-text-outline' },
            { key: 'performance', label: 'System', icon: 'speedometer-outline' },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.key}
              onPress={() => setActiveTab(tab.key as any)}
              style={{
                flex: 1,
                paddingVertical: 8,
                paddingHorizontal: 4,
                borderRadius: 8,
                backgroundColor: activeTab === tab.key ? colors.tint : 'transparent',
                marginHorizontal: 2,
                alignItems: 'center',
              }}
            >
              <Ionicons 
                name={tab.icon as any} 
                size={18} 
                color={activeTab === tab.key ? 'white' : colors.icon} 
              />
              <Text style={{
                color: activeTab === tab.key ? 'white' : colors.text,
                fontSize: 11,
                fontWeight: '500',
                marginTop: 2,
              }}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Content Area */}
      {activeTab === 'chats' && (
        <View style={{ flex: 1 }}>
          {/* New Chat Button */}
          <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
            <TouchableOpacity
              onPress={onSessionCreate}
              style={[
                {
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 12,
                  borderRadius: 12,
                  backgroundColor: colors.tint,
                  marginBottom: 16,
                },
                isDark && GlassStyles.button,
              ]}
            >
              <Ionicons name="add" size={20} color="white" />
              <Text style={{ color: 'white', fontWeight: '600', marginLeft: 8 }}>
                New Chat
              </Text>
            </TouchableOpacity>
          </View>
          
          <FlatList
            data={sessions}
            renderItem={renderSession}
            keyExtractor={keyExtractor}
            contentContainerStyle={{
              paddingHorizontal: 16,
              paddingBottom: insets.bottom + 16,
            }}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={{
                alignItems: 'center',
                justifyContent: 'center',
                paddingVertical: 32,
              }}>
                <Ionicons name="chatbubbles-outline" size={48} color={colors.icon} />
                <Text style={{
                  fontSize: 16,
                  color: colors.icon,
                  textAlign: 'center',
                  marginTop: 16,
                }}>
                  No chat sessions yet.{'\n'}Start a new conversation!
                </Text>
              </View>
            }
            // Virtualization for performance
            initialNumToRender={10}
            maxToRenderPerBatch={5}
            windowSize={5}
            removeClippedSubviews={true}
            getItemLayout={(_, index) => ({
              length: 88, // Approximate item height
              offset: 88 * index,
              index,
            })}
          />
        </View>
      )}

      {activeTab === 'models' && (
        <View style={{ flex: 1, padding: 16 }}>
          <TouchableOpacity
            onPress={() => setShowModelSelection(true)}
            style={[
              {
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 16,
                borderRadius: 12,
                backgroundColor: colors.tint,
                marginBottom: 16,
              },
              isDark && GlassStyles.button,
            ]}
          >
            <Ionicons name="cube" size={20} color="white" />
            <Text style={{ color: 'white', fontWeight: '600', marginLeft: 8 }}>
              Browse AI Models
            </Text>
          </TouchableOpacity>

          <Text style={{ fontSize: 16, color: colors.text, textAlign: 'center', marginTop: 32 }}>
            🤖 Manage AI Models{'\n\n'}
            • Download different model sizes{'\n'}
            • Switch between Qwen, Llama, DeepSeek{'\n'}
            • Optimize for your device{'\n'}
            • View model capabilities
          </Text>
        </View>
      )}

      {activeTab === 'embeddings' && (
        <EmbeddingModelPanel isVisible={activeTab === 'embeddings'} />
      )}

      {activeTab === 'context' && (
        <ContextRulesPanel isVisible={activeTab === 'context'} />
      )}

      {activeTab === 'performance' && (
        <SystemPerformancePanel />
      )}

      {/* Model Selection Modal */}
      <ModelSelectionPanel
        isVisible={showModelSelection}
        onClose={() => setShowModelSelection(false)}
        onModelSelect={(model) => {
          setShowModelSelection(false);
          // Handle model selection
        }}
      />
    </View>
  );

  // On mobile, render as modal; on larger screens could be permanent sidebar
  return (
    <Modal
      visible={isOpen}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onToggle}
    >
      {panelContent}
    </Modal>
  );
};