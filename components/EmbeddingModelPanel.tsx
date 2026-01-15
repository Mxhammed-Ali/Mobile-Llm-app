/**
 * Embedding Model Panel Component
 * Allows users to select, download, and manage embedding models
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors, useIsDark } from '../hooks/useThemeColor';
import { GlassStyles } from '../constants/Colors';
import { logger } from '../utils/logger';
import { embedderModelManager, EmbedderModel, EmbedderStatus } from '../services/EmbedderModelManager';

interface EmbeddingModelPanelProps {
  isVisible: boolean;
}

export const EmbeddingModelPanel: React.FC<EmbeddingModelPanelProps> = ({ isVisible }) => {
  const colors = useThemeColors();
  const isDark = useIsDark();
  const [status, setStatus] = useState<EmbedderStatus | null>(null);
  const [downloadingModel, setDownloadingModel] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<Record<string, number>>({});

  useEffect(() => {
    if (isVisible) {
      loadStatus();
    }
  }, [isVisible]);

  const loadStatus = useCallback(async () => {
    try {
      await embedderModelManager.initialize();
      const currentStatus = embedderModelManager.getStatus();
      setStatus(currentStatus);
      logger.info('📋 Loaded embedder status', { 
        currentModel: currentStatus.currentModel?.displayName || 'none',
        availableModels: currentStatus.availableModels.length 
      });
    } catch (error) {
      logger.error('❌ Failed to load embedder status', { error: (error as Error).message });
      Alert.alert('Error', 'Failed to load embedding models');
    }
  }, []);

  const handleDownloadModel = useCallback(async (model: EmbedderModel) => {
    if (model.id === 'simple-builtin') {
      Alert.alert('Info', 'Built-in model is already available');
      return;
    }

    if (model.isInstalled) {
      Alert.alert('Info', `${model.displayName} is already installed`);
      return;
    }

    try {
      setDownloadingModel(model.id);
      logger.info('📥 Starting embedder download', { model: model.displayName });

      await embedderModelManager.downloadModel(model.id, (progress) => {
        setDownloadProgress(prev => ({ ...prev, [model.id]: progress }));
      });

      // Refresh status
      await loadStatus();
      
      logger.success('✅ Embedder download completed', { model: model.displayName });
      Alert.alert('Success', `${model.displayName} downloaded successfully!`);
    } catch (error) {
      logger.error('❌ Embedder download failed', { 
        model: model.displayName,
        error: (error as Error).message 
      });
      Alert.alert('Download Failed', (error as Error).message);
    } finally {
      setDownloadingModel(null);
      setDownloadProgress(prev => ({ ...prev, [model.id]: 0 }));
    }
  }, [loadStatus]);

  const handleSelectModel = useCallback(async (model: EmbedderModel) => {
    if (!model.isInstalled) {
      Alert.alert(
        'Model Not Installed',
        `${model.displayName} needs to be downloaded first. Download now?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Download', onPress: () => handleDownloadModel(model) }
        ]
      );
      return;
    }

    if (model.isActive) {
      Alert.alert('Info', `${model.displayName} is already the active embedder`);
      return;
    }

    try {
      logger.info('🔄 Switching embedder model', { to: model.displayName });
      
      await embedderModelManager.selectModel(model.id);
      
      // Refresh status
      await loadStatus();
      
      logger.success('✅ Embedder model switched', { model: model.displayName });
      Alert.alert('Success', `Switched to ${model.displayName}`);
    } catch (error) {
      logger.error('❌ Failed to switch embedder', { 
        model: model.displayName,
        error: (error as Error).message 
      });
      Alert.alert('Error', `Failed to switch to ${model.displayName}: ${(error as Error).message}`);
    }
  }, [loadStatus, handleDownloadModel]);

  const handleDeleteModel = useCallback(async (model: EmbedderModel) => {
    if (model.id === 'simple-builtin') {
      Alert.alert('Error', 'Built-in model cannot be deleted');
      return;
    }

    if (!model.isInstalled) {
      Alert.alert('Info', `${model.displayName} is not installed`);
      return;
    }

    Alert.alert(
      'Delete Model',
      `Are you sure you want to delete ${model.displayName}? This will remove the model file from your device.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              logger.info('🗑️ Deleting embedder model', { model: model.displayName });
              
              await embedderModelManager.deleteModel(model.id);
              
              // Refresh status
              await loadStatus();
              
              logger.success('✅ Embedder model deleted', { model: model.displayName });
              Alert.alert('Deleted', `${model.displayName} has been removed`);
            } catch (error) {
              logger.error('❌ Failed to delete embedder', { 
                model: model.displayName,
                error: (error as Error).message 
              });
              Alert.alert('Error', `Failed to delete ${model.displayName}: ${(error as Error).message}`);
            }
          }
        }
      ]
    );
  }, [loadStatus]);

  const getModelStatusColor = (model: EmbedderModel): string => {
    if (model.isActive) return '#4CAF50'; // Green
    if (model.isInstalled) return '#2196F3'; // Blue
    return colors.icon; // Default
  };

  const getModelStatusIcon = (model: EmbedderModel): keyof typeof Ionicons.glyphMap => {
    if (model.isActive) return 'checkmark-circle';
    if (model.isInstalled) return 'checkmark';
    return 'download-outline';
  };

  const getPerformanceIcon = (performance: { speed: string; accuracy: string; memoryUsage: string }) => {
    if (performance.speed === 'fast' && performance.accuracy === 'high') return 'flash';
    if (performance.accuracy === 'high') return 'medal';
    if (performance.speed === 'fast') return 'speedometer';
    return 'hardware-chip';
  };

  if (!isVisible || !status) {
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
        <Text style={{
          fontSize: 18,
          fontWeight: '600',
          color: colors.text,
          marginBottom: 4,
        }}>
          Embedding Models
        </Text>
        <Text style={{
          fontSize: 14,
          color: colors.icon,
        }}>
          Current: {status.currentModel?.displayName || 'None'}
        </Text>
      </View>

      <ScrollView style={{ flex: 1 }}>
        {status.availableModels.map((model) => {
          const isDownloading = downloadingModel === model.id;
          const progress = downloadProgress[model.id] || 0;

          return (
            <View
              key={model.id}
              style={[
                {
                  margin: 16,
                  padding: 16,
                  borderRadius: 12,
                  backgroundColor: isDark ? 'transparent' : colors.cardBackground,
                  borderWidth: 1,
                  borderColor: model.isActive ? '#4CAF50' : colors.border,
                },
                isDark && GlassStyles.card
              ]}
            >
              {/* Model Header */}
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 12,
              }}>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                    <Ionicons
                      name={getModelStatusIcon(model)}
                      size={20}
                      color={getModelStatusColor(model)}
                      style={{ marginRight: 8 }}
                    />
                    <Text style={{
                      fontSize: 16,
                      fontWeight: '600',
                      color: colors.text,
                      flex: 1,
                    }}>
                      {model.displayName}
                    </Text>
                    <Ionicons
                      name={getPerformanceIcon(model.performance)}
                      size={16}
                      color={colors.icon}
                    />
                  </View>
                  <Text style={{
                    fontSize: 12,
                    color: colors.icon,
                    marginBottom: 4,
                  }}>
                    {model.description}
                  </Text>
                </View>
              </View>

              {/* Model Info */}
              <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                marginBottom: 12,
              }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 12, color: colors.icon }}>
                    Dimensions: {model.dimensions}
                  </Text>
                  <Text style={{ fontSize: 12, color: colors.icon }}>
                    Max Tokens: {model.maxTokens}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 12, color: colors.icon }}>
                    Size: {model.modelSize}
                  </Text>
                  <Text style={{ fontSize: 12, color: colors.icon }}>
                    Speed: {model.performance.speed} | Accuracy: {model.performance.accuracy}
                  </Text>
                </View>
              </View>

              {/* Use Cases */}
              <View style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                marginBottom: 12,
              }}>
                {model.useCase.map((useCase) => (
                  <View
                    key={useCase}
                    style={{
                      backgroundColor: colors.backgroundSecondary,
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      borderRadius: 12,
                      marginRight: 6,
                      marginBottom: 4,
                    }}
                  >
                    <Text style={{
                      fontSize: 10,
                      color: colors.text,
                      textTransform: 'capitalize',
                    }}>
                      {useCase}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Download Progress */}
              {isDownloading && (
                <View style={{
                  marginBottom: 12,
                  padding: 8,
                  backgroundColor: colors.backgroundSecondary,
                  borderRadius: 8,
                }}>
                  <Text style={{
                    fontSize: 12,
                    color: colors.text,
                    marginBottom: 4,
                  }}>
                    Downloading... {Math.round(progress)}%
                  </Text>
                  <View style={{
                    height: 4,
                    backgroundColor: colors.border,
                    borderRadius: 2,
                  }}>
                    <View style={{
                      height: 4,
                      backgroundColor: colors.tint,
                      borderRadius: 2,
                      width: `${progress}%`,
                    }} />
                  </View>
                </View>
              )}

              {/* Action Buttons */}
              <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
              }}>
                {/* Select/Use Button */}
                <TouchableOpacity
                  onPress={() => handleSelectModel(model)}
                  disabled={isDownloading}
                  style={[
                    {
                      flex: 1,
                      backgroundColor: model.isActive ? '#4CAF50' : colors.tint,
                      paddingVertical: 8,
                      paddingHorizontal: 16,
                      borderRadius: 8,
                      marginRight: 8,
                      opacity: isDownloading ? 0.5 : 1,
                    },
                    isDark && GlassStyles.button
                  ]}
                >
                  <Text style={{
                    color: 'white',
                    fontWeight: '600',
                    textAlign: 'center',
                    fontSize: 14,
                  }}>
                    {model.isActive ? 'Active' : model.isInstalled ? 'Use' : 'Download & Use'}
                  </Text>
                </TouchableOpacity>

                {/* Download Button */}
                {!model.isInstalled && model.id !== 'simple-builtin' && (
                  <TouchableOpacity
                    onPress={() => handleDownloadModel(model)}
                    disabled={isDownloading}
                    style={[
                      {
                        backgroundColor: colors.backgroundSecondary,
                        paddingVertical: 8,
                        paddingHorizontal: 12,
                        borderRadius: 8,
                        marginRight: 8,
                        opacity: isDownloading ? 0.5 : 1,
                      },
                      isDark && GlassStyles.button
                    ]}
                  >
                    {isDownloading ? (
                      <ActivityIndicator size="small" color={colors.tint} />
                    ) : (
                      <Ionicons name="download-outline" size={16} color={colors.text} />
                    )}
                  </TouchableOpacity>
                )}

                {/* Delete Button */}
                {model.isInstalled && model.id !== 'simple-builtin' && (
                  <TouchableOpacity
                    onPress={() => handleDeleteModel(model)}
                    disabled={isDownloading}
                    style={[
                      {
                        backgroundColor: colors.backgroundSecondary,
                        paddingVertical: 8,
                        paddingHorizontal: 12,
                        borderRadius: 8,
                        opacity: isDownloading ? 0.5 : 1,
                      },
                      isDark && GlassStyles.button
                    ]}
                  >
                    <Ionicons name="trash-outline" size={16} color="#FF5252" />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
};

export default EmbeddingModelPanel;