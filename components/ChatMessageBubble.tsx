/**
 * Enhanced Chat Message Bubble Component
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  Animated,
  LayoutAnimation,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors, useIsDark } from '../hooks/useThemeColor';
import { useTheme } from '../contexts/ThemeContext';
import { ChatMessageBubbleProps } from '../types/chat';
import { GlassStyles, DarkStyles } from '../constants/Colors';

export const ChatMessageBubble: React.FC<ChatMessageBubbleProps> = ({
  message,
  isLastMessage,
  onRetry,
}) => {
  const colors = useThemeColors();
  const isDark = useIsDark();
  const { colorScheme } = useTheme();
  const [showActions, setShowActions] = useState(false);

  const isUser = message.role === 'user';
  const isAssistant = message.role === 'assistant';
  const isSystem = message.role === 'system';

  const toggleActions = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setShowActions(!showActions);
  }, [showActions]);

  const handleCopy = useCallback(() => {
    // TODO: Implement copy to clipboard
    console.log('Copy message:', message.content);
    setShowActions(false);
  }, [message.content]);

  const handleRetry = useCallback(() => {
    if (onRetry) {
      onRetry();
    }
    setShowActions(false);
  }, [onRetry]);

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // System messages (minimal styling)
  if (isSystem) {
    return (
      <View style={{
        alignItems: 'center',
        marginVertical: 8,
        paddingHorizontal: 16,
      }}>
        <Text style={{
          fontSize: 12,
          color: colors.icon,
          fontStyle: 'italic',
          textAlign: 'center',
          backgroundColor: colors.backgroundSecondary,
          paddingHorizontal: 12,
          paddingVertical: 6,
          borderRadius: 12,
        }}>
          {message.content}
        </Text>
      </View>
    );
  }

  // Get bubble styling based on theme and role
  const getBubbleStyle = (): any => {
    const baseStyle = {
      maxWidth: '80%' as const,
      marginVertical: 4,
      marginHorizontal: 16,
      padding: 16,
      borderRadius: 18,
    };

    if (isDark) {
      // Use DarkStyles for liquid glass to avoid cloudiness
      if (isUser) {
        return {
          ...baseStyle,
          backgroundColor: DarkStyles.userBubble.backgroundColor,
          borderWidth: DarkStyles.userBubble.borderWidth,
          alignSelf: 'flex-end' as const,
          borderBottomRightRadius: 6,
        };
      } else {
        return {
          ...baseStyle,
          backgroundColor: DarkStyles.chatBubble.backgroundColor,
          borderWidth: DarkStyles.chatBubble.borderWidth,
          borderColor: DarkStyles.chatBubble.borderColor,
          alignSelf: 'flex-start' as const,
          borderBottomLeftRadius: 6,
        };
      }
    } else {
      // Standard theme styling
      if (isUser) {
        return {
          ...baseStyle,
          backgroundColor: colors.tint,
          alignSelf: 'flex-end' as const,
          borderBottomRightRadius: 6,
        };
      } else {
        return {
          ...baseStyle,
          backgroundColor: colors.cardBackground,
          borderWidth: 1,
          borderColor: colors.border,
          alignSelf: 'flex-start' as const,
          borderBottomLeftRadius: 6,
        };
      }
    }
  };

  const getTextColor = () => {
    if (isUser) {
      return 'white';
    }
    return colors.text;
  };

  return (
    <View style={{ marginBottom: isLastMessage ? 16 : 0 }}>
      <TouchableOpacity
        onLongPress={toggleActions}
        activeOpacity={0.8}
        style={getBubbleStyle()}
      >
        <Text style={{
          fontSize: 16,
          color: getTextColor(),
          lineHeight: 22,
        }}>
          {message.content}
        </Text>

        {/* Timestamp */}
        <Text style={{
          fontSize: 11,
          color: isUser ? 'rgba(255, 255, 255, 0.7)' : colors.icon,
          marginTop: 8,
          alignSelf: isUser ? 'flex-end' : 'flex-start',
        }}>
          {formatTimestamp(message.timestamp)}
        </Text>

        {/* Message status indicators */}
        {isUser && (
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            alignSelf: 'flex-end',
            marginTop: 4,
          }}>
            <Ionicons 
              name="checkmark" 
              size={12} 
              color="rgba(255, 255, 255, 0.7)" 
            />
          </View>
        )}
      </TouchableOpacity>

      {/* Action buttons */}
      {showActions && (
        <Animated.View
          style={{
            flexDirection: 'row',
            justifyContent: isUser ? 'flex-end' : 'flex-start',
            marginHorizontal: 16,
            marginTop: 8,
          }}
        >
          <TouchableOpacity
            onPress={handleCopy}
            style={[
              {
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: colors.backgroundSecondary,
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 16,
                marginHorizontal: 4,
                borderWidth: 1,
                borderColor: colors.border,
              },
              isDark && GlassStyles.button,
            ]}
          >
            <Ionicons name="copy-outline" size={14} color={colors.icon} />
            <Text style={{
              marginLeft: 6,
              fontSize: 12,
              color: colors.text,
            }}>
              Copy
            </Text>
          </TouchableOpacity>

          {isUser && onRetry && (
            <TouchableOpacity
              onPress={handleRetry}
              style={[
                {
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: colors.backgroundSecondary,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 16,
                  marginHorizontal: 4,
                  borderWidth: 1,
                  borderColor: colors.border,
                },
                isDark && GlassStyles.button,
              ]}
            >
              <Ionicons name="refresh-outline" size={14} color={colors.icon} />
              <Text style={{
                marginLeft: 6,
                fontSize: 12,
                color: colors.text,
              }}>
                Retry
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={toggleActions}
            style={[
              {
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: colors.backgroundSecondary,
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 16,
                marginHorizontal: 4,
                borderWidth: 1,
                borderColor: colors.border,
              },
              isDark && GlassStyles.button,
            ]}
          >
            <Ionicons name="close" size={14} color={colors.icon} />
          </TouchableOpacity>
        </Animated.View>
      )}
    </View>
  );
};