/**
 * Context & Rules Panel Component
 * Allows users to define AI guidance, context, and rules
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useThemeColors, useIsDark } from '../hooks/useThemeColor';
import { GlassStyles } from '../constants/Colors';
import { logger } from '../utils/logger';

const CONTEXT_STORAGE_KEY = 'ai_context_rules';
const CONTEXT_ENABLED_KEY = 'ai_context_enabled';

interface ContextRulesPanelProps {
  isVisible: boolean;
}

interface ContextRulesData {
  contextText: string;
  isEnabled: boolean;
}

const DEFAULT_CONTEXT = `You are a helpful AI assistant. Please follow these guidelines:

1. Be concise and direct in your responses
2. Ask clarifying questions when needed
3. Provide practical, actionable advice
4. Stay focused on the user's specific request
5. Be honest about limitations

Additional Rules:
- If unsure, say so rather than guessing
- Format code with proper syntax highlighting
- Explain complex concepts step by step
- Prioritize user safety and ethical considerations

Custom Instructions:
[Add your specific instructions here]`;

export const ContextRulesPanel: React.FC<ContextRulesPanelProps> = ({ isVisible }) => {
  const colors = useThemeColors();
  const isDark = useIsDark();
  
  const [contextData, setContextData] = useState<ContextRulesData>({
    contextText: DEFAULT_CONTEXT,
    isEnabled: true,
  });
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isVisible) {
      loadContextData();
    }
  }, [isVisible]);

  const loadContextData = useCallback(async () => {
    try {
      setIsLoading(true);
      logger.debug('📋 Loading AI context and rules');
      
      const [savedContext, savedEnabled] = await Promise.all([
        AsyncStorage.getItem(CONTEXT_STORAGE_KEY),
        AsyncStorage.getItem(CONTEXT_ENABLED_KEY)
      ]);

      const contextText = savedContext || DEFAULT_CONTEXT;
      const isEnabled = savedEnabled !== null ? savedEnabled === 'true' : true;

      setContextData({ contextText, isEnabled });
      setHasUnsavedChanges(false);
      
      logger.success('✅ Loaded AI context rules', { 
        contextLength: contextText.length,
        isEnabled,
        hasCustomRules: savedContext !== null
      });
    } catch (error) {
      logger.error('❌ Failed to load AI context rules', { error: (error as Error).message });
      Alert.alert('Error', 'Failed to load context rules');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveContextData = useCallback(async () => {
    try {
      setIsLoading(true);
      logger.info('💾 Saving AI context rules', { 
        contextLength: contextData.contextText.length,
        isEnabled: contextData.isEnabled 
      });

      await Promise.all([
        AsyncStorage.setItem(CONTEXT_STORAGE_KEY, contextData.contextText),
        AsyncStorage.setItem(CONTEXT_ENABLED_KEY, contextData.isEnabled.toString())
      ]);

      setHasUnsavedChanges(false);
      
      logger.success('✅ AI context rules saved successfully', {
        contextLength: contextData.contextText.length,
        isEnabled: contextData.isEnabled
      });
      
      Alert.alert('Saved', 'AI context and rules have been saved successfully');
    } catch (error) {
      logger.error('❌ Failed to save AI context rules', { error: (error as Error).message });
      Alert.alert('Error', 'Failed to save context rules');
    } finally {
      setIsLoading(false);
    }
  }, [contextData]);

  const resetToDefault = useCallback(() => {
    Alert.alert(
      'Reset to Default',
      'Are you sure you want to reset to default context and rules? This will overwrite your current text.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            setContextData(prev => ({ ...prev, contextText: DEFAULT_CONTEXT }));
            setHasUnsavedChanges(true);
            logger.info('🔄 Reset AI context to default');
          }
        }
      ]
    );
  }, []);

  const handleTextChange = useCallback((text: string) => {
    setContextData(prev => ({ ...prev, contextText: text }));
    setHasUnsavedChanges(true);
  }, []);

  const handleToggleEnabled = useCallback((enabled: boolean) => {
    setContextData(prev => ({ ...prev, isEnabled: enabled }));
    setHasUnsavedChanges(true);
    logger.info('🔄 AI context rules toggled', { enabled });
  }, []);

  const getStatusColor = () => {
    if (!contextData.isEnabled) return '#FF5252'; // Red for disabled
    if (hasUnsavedChanges) return '#FF9800'; // Orange for unsaved changes
    return '#4CAF50'; // Green for active and saved
  };

  const getStatusText = () => {
    if (!contextData.isEnabled) return 'Disabled';
    if (hasUnsavedChanges) return 'Unsaved Changes';
    return 'Active';
  };

  if (!isVisible) {
    return null;
  }

  return (
    <View style={{
      flex: 1,
      backgroundColor: isDark ? 'transparent' : colors.background,
    }}>
      {/* Header */}
      <View style={[
        {
          paddingHorizontal: 20,
          paddingVertical: 16,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        },
        isDark && GlassStyles.card
      ]}>
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 8,
        }}>
          <Text style={{
            fontSize: 18,
            fontWeight: '600',
            color: colors.text,
          }}>
            Context & Rules
          </Text>
          
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
          }}>
            <View style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: getStatusColor(),
              marginRight: 6,
            }} />
            <Text style={{
              fontSize: 12,
              color: colors.icon,
              fontWeight: '500',
            }}>
              {getStatusText()}
            </Text>
          </View>
        </View>
        
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <Text style={{
            fontSize: 14,
            color: colors.icon,
            flex: 1,
          }}>
            Define AI behavior, context, and rules to guide responses
          </Text>
          
          <Switch
            value={contextData.isEnabled}
            onValueChange={handleToggleEnabled}
            trackColor={{ false: colors.border, true: colors.tint + '80' }}
            thumbColor={contextData.isEnabled ? colors.tint : colors.icon}
          />
        </View>
      </View>

      {/* Content */}
      <ScrollView style={{ flex: 1, padding: 16 }}>
        {/* Enable/Disable Info */}
        <View style={[
          {
            padding: 12,
            borderRadius: 8,
            backgroundColor: contextData.isEnabled 
              ? colors.tint + '20' 
              : colors.backgroundSecondary,
            marginBottom: 16,
            borderWidth: 1,
            borderColor: contextData.isEnabled ? colors.tint + '40' : colors.border,
          },
          isDark && GlassStyles.card
        ]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
            <Ionicons
              name={contextData.isEnabled ? 'checkmark-circle' : 'close-circle'}
              size={16}
              color={contextData.isEnabled ? colors.tint : colors.icon}
              style={{ marginRight: 6 }}
            />
            <Text style={{
              fontSize: 14,
              fontWeight: '600',
              color: colors.text,
            }}>
              {contextData.isEnabled ? 'Context Rules Active' : 'Context Rules Disabled'}
            </Text>
          </View>
          <Text style={{
            fontSize: 12,
            color: colors.icon,
          }}>
            {contextData.isEnabled 
              ? 'AI will follow the rules and context defined below'
              : 'AI will respond without custom context or rules'
            }
          </Text>
        </View>

        {/* Text Editor */}
        <View style={[
          {
            borderRadius: 12,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: isDark ? 'transparent' : colors.cardBackground,
            overflow: 'hidden',
          },
          isDark && GlassStyles.card
        ]}>
          <View style={{
            paddingHorizontal: 12,
            paddingVertical: 8,
            backgroundColor: colors.backgroundSecondary,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
          }}>
            <Text style={{
              fontSize: 14,
              fontWeight: '600',
              color: colors.text,
            }}>
              AI Context & Rules
            </Text>
          </View>
          
          <TextInput
            style={{
              padding: 16,
              fontSize: 14,
              color: colors.text,
              textAlignVertical: 'top',
              minHeight: 300,
              backgroundColor: 'transparent',
            }}
            value={contextData.contextText}
            onChangeText={handleTextChange}
            placeholder="Enter AI context, rules, and guidelines here..."
            placeholderTextColor={colors.icon}
            multiline={true}
            scrollEnabled={true}
            editable={!isLoading}
          />
        </View>

        {/* Character Count */}
        <Text style={{
          fontSize: 12,
          color: colors.icon,
          textAlign: 'right',
          marginTop: 8,
          marginBottom: 16,
        }}>
          {contextData.contextText.length} characters
        </Text>

        {/* Action Buttons */}
        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginBottom: 32,
        }}>
          {/* Reset Button */}
          <TouchableOpacity
            onPress={resetToDefault}
            disabled={isLoading}
            style={[
              {
                flex: 1,
                backgroundColor: colors.backgroundSecondary,
                paddingVertical: 12,
                paddingHorizontal: 16,
                borderRadius: 8,
                marginRight: 8,
                opacity: isLoading ? 0.5 : 1,
              },
              isDark && GlassStyles.button
            ]}
          >
            <Text style={{
              color: colors.text,
              fontWeight: '600',
              textAlign: 'center',
              fontSize: 14,
            }}>
              Reset to Default
            </Text>
          </TouchableOpacity>

          {/* Save Button */}
          <TouchableOpacity
            onPress={saveContextData}
            disabled={isLoading || !hasUnsavedChanges}
            style={[
              {
                flex: 1,
                backgroundColor: hasUnsavedChanges ? colors.tint : colors.backgroundSecondary,
                paddingVertical: 12,
                paddingHorizontal: 16,
                borderRadius: 8,
                marginLeft: 8,
                opacity: (isLoading || !hasUnsavedChanges) ? 0.5 : 1,
              },
              isDark && GlassStyles.button
            ]}
          >
            <Text style={{
              color: hasUnsavedChanges ? 'white' : colors.text,
              fontWeight: '600',
              textAlign: 'center',
              fontSize: 14,
            }}>
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Help Text */}
        <View style={[
          {
            padding: 12,
            borderRadius: 8,
            backgroundColor: colors.backgroundSecondary,
            marginBottom: 16,
          },
          isDark && GlassStyles.card
        ]}>
          <Text style={{
            fontSize: 12,
            color: colors.icon,
            lineHeight: 18,
          }}>
            💡 Tips:{'\n'}
            • Be specific about the AI's role and expertise{'\n'}
            • Define response format preferences{'\n'}
            • Set behavioral guidelines and limitations{'\n'}
            • Include domain-specific context{'\n'}
            • Use "You are..." statements for clear identity
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

export default ContextRulesPanel;