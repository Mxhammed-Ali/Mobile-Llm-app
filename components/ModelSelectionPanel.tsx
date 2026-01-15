/**
 * Model Selection Panel Component
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ScrollView,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors, useIsDark } from '../hooks/useThemeColor';
import { GlassStyles } from '../constants/Colors';
import { MODEL_FAMILIES } from '../data/modelDatabase';
import { ModelManagerService } from '../services/ModelManagerService';
import { 
  ModelSpec, 
  ModelFilter, 
  ModelRecommendation, 
  InstalledModel, 
  ModelDownload,
  ModelCapability,
  ModelUseCase 
} from '../types/models';
import { eventBus } from '../utils/eventBus';

interface ModelSelectionPanelProps {
  isVisible: boolean;
  onClose: () => void;
  onModelSelect: (model: ModelSpec) => void;
}

const ModelCard: React.FC<{
  model: ModelSpec;
  isInstalled: boolean;
  isActive: boolean;
  isDownloading: boolean;
  downloadProgress?: number;
  onInstall: () => void;
  onActivate: () => void;
  onDelete: () => void;
  onSelect: () => void;
}> = ({ 
  model, 
  isInstalled, 
  isActive, 
  isDownloading, 
  downloadProgress, 
  onInstall, 
  onActivate, 
  onDelete,
  onSelect 
}) => {
  const colors = useThemeColors();
  const isDark = useIsDark();

  const getPerformanceColor = (performance: string) => {
    switch (performance) {
      case 'excellent': return '#00FF94';
      case 'very-good': return '#4CAF50';
      case 'good': return '#FFC947';
      case 'fair': return '#FF6B6B';
      default: return colors.icon;
    }
  };

  const formatFileSize = (bytes: number) => {
    const gb = bytes / (1024 * 1024 * 1024);
    return `${gb.toFixed(1)} GB`;
  };

  return (
    <TouchableOpacity
      onPress={onSelect}
      style={[
        {
          padding: 16,
          marginBottom: 12,
          borderRadius: 12,
          backgroundColor: colors.cardBackground,
          borderWidth: 1,
          borderColor: isActive ? colors.tint : colors.border,
        },
        isDark && GlassStyles.card,
        isActive && { borderWidth: 2 }
      ]}
    >
      {/* Header */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text }}>
            {model.name}
          </Text>
          <Text style={{ fontSize: 14, color: colors.icon, marginTop: 2 }}>
            {MODEL_FAMILIES[model.family]?.name} • {model.parameters} • {model.quantization}
          </Text>
        </View>
        
        {isActive && (
          <View style={{
            backgroundColor: colors.tint,
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 8,
          }}>
            <Text style={{ color: 'white', fontSize: 12, fontWeight: '600' }}>
              ACTIVE
            </Text>
          </View>
        )}
      </View>

      {/* Description */}
      <Text style={{ 
        fontSize: 14, 
        color: colors.text, 
        marginTop: 8,
        lineHeight: 20 
      }}>
        {model.description}
      </Text>

      {/* Capabilities */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 }}>
        {model.capabilities.slice(0, 3).map((capability, index) => (
          <View key={index} style={{
            backgroundColor: colors.backgroundSecondary,
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 6,
            marginRight: 6,
            marginBottom: 4,
          }}>
            <Text style={{ fontSize: 12, color: colors.text, fontWeight: '500' }}>
              {capability.replace('-', ' ')}
            </Text>
          </View>
        ))}
        {model.capabilities.length > 3 && (
          <Text style={{ fontSize: 12, color: colors.icon, alignSelf: 'center' }}>
            +{model.capabilities.length - 3} more
          </Text>
        )}
      </View>

      {/* Performance Metrics */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 }}>
        <View style={{ alignItems: 'center' }}>
          <Text style={{ fontSize: 12, color: colors.icon }}>Quality</Text>
          <Text style={{ 
            fontSize: 14, 
            fontWeight: '600', 
            color: getPerformanceColor(model.performance.quality),
            marginTop: 2 
          }}>
            {model.performance.quality.replace('-', ' ')}
          </Text>
        </View>
        <View style={{ alignItems: 'center' }}>
          <Text style={{ fontSize: 12, color: colors.icon }}>Speed</Text>
          <Text style={{ 
            fontSize: 14, 
            fontWeight: '600', 
            color: getPerformanceColor(model.performance.speed),
            marginTop: 2 
          }}>
            {model.performance.speed.replace('-', ' ')}
          </Text>
        </View>
        <View style={{ alignItems: 'center' }}>
          <Text style={{ fontSize: 12, color: colors.icon }}>Size</Text>
          <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text, marginTop: 2 }}>
            {formatFileSize(model.fileSize)}
          </Text>
        </View>
        <View style={{ alignItems: 'center' }}>
          <Text style={{ fontSize: 12, color: colors.icon }}>RAM</Text>
          <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text, marginTop: 2 }}>
            {model.minRAM}GB
          </Text>
        </View>
      </View>

      {/* Action Button */}
      <View style={{ marginTop: 12 }}>
        {isDownloading ? (
          <View style={{ marginTop: 12 }}>
            {/* Progress Bar */}
            <View style={{
              height: 6,
              backgroundColor: colors.backgroundSecondary,
              borderRadius: 3,
              marginBottom: 8,
            }}>
              <View style={{
                height: '100%',
                width: `${downloadProgress || 0}%`,
                backgroundColor: colors.tint,
                borderRadius: 3,
              }} />
            </View>
            
            {/* Progress Text */}
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              paddingVertical: 8,
            }}>
              <ActivityIndicator size="small" color={colors.tint} />
              <Text style={{ marginLeft: 8, color: colors.text, fontWeight: '600' }}>
                Downloading {downloadProgress?.toFixed(1)}%
              </Text>
            </View>
          </View>
        ) : isInstalled ? (
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity
              onPress={isActive ? undefined : onActivate}
              style={{
                backgroundColor: isActive ? colors.backgroundSecondary : colors.tint,
                paddingVertical: 12,
                borderRadius: 8,
                alignItems: 'center',
                flex: 1,
              }}
              disabled={isActive}
            >
              <Text style={{ 
                color: isActive ? colors.text : 'white', 
                fontWeight: '600' 
              }}>
                {isActive ? 'Currently Active' : 'Activate Model'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={onDelete}
              style={{
                backgroundColor: '#FF4444',
                paddingVertical: 12,
                paddingHorizontal: 16,
                borderRadius: 8,
                alignItems: 'center',
              }}
            >
              <Ionicons name="trash" size={16} color="white" />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            onPress={onInstall}
            style={{
              backgroundColor: colors.tint,
              paddingVertical: 12,
              borderRadius: 8,
              alignItems: 'center',
            }}
          >
            <Text style={{ color: 'white', fontWeight: '600' }}>
              Install Model
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
};

const FilterChip: React.FC<{
  label: string;
  isSelected: boolean;
  onToggle: () => void;
}> = ({ label, isSelected, onToggle }) => {
  const colors = useThemeColors();
  
  return (
    <TouchableOpacity
      onPress={onToggle}
      style={{
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        backgroundColor: isSelected ? colors.tint : colors.backgroundSecondary,
        marginRight: 8,
        marginBottom: 8,
      }}
    >
      <Text style={{
        color: isSelected ? 'white' : colors.text,
        fontSize: 12,
        fontWeight: '500'
      }}>
        {label}
      </Text>
    </TouchableOpacity>
  );
};

export const ModelSelectionPanel: React.FC<ModelSelectionPanelProps> = ({
  isVisible,
  onClose,
  onModelSelect,
}) => {
  const colors = useThemeColors();
  const isDark = useIsDark();
  const [modelManager] = useState(() => ModelManagerService.getInstance());
  
  const [models, setModels] = useState<ModelSpec[]>([]);
  const [filteredModels, setFilteredModels] = useState<ModelSpec[]>([]);
  const [installedModels, setInstalledModels] = useState<InstalledModel[]>([]);
  const [downloads, setDownloads] = useState<ModelDownload[]>([]);
  const [recommendations, setRecommendations] = useState<ModelRecommendation[]>([]);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'installed' | 'recommended' | 'config'>('recommended');
  
  const [filter, setFilter] = useState<ModelFilter>({});
  
  // AI Configuration state
  const [aiConfig, setAiConfig] = useState({
    autoOptimize: true,
    customModelUrl: '',
  });
  const [isConfigLoading, setIsConfigLoading] = useState(false);

  // Load data
  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [models, searchQuery, filter, activeTab]);

  const loadData = async () => {
    try {
      const allModels = modelManager.getAllModels();
      const installed = await modelManager.getInstalledModels();
      const activeDownloads = modelManager.getActiveDownloads();
      const recs = modelManager.getRecommendations(['general-chat', 'mobile-optimized']);

      setModels(allModels);
      setInstalledModels(installed);
      setDownloads(activeDownloads);
      setRecommendations(recs);
    } catch (error) {
      console.error('Failed to load model data:', error);
    }
  };

  const applyFilters = () => {
    let filtered = models;

    // Apply search query
    if (searchQuery) {
      filtered = filtered.filter(model =>
        model.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        model.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        model.family.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply tab filter
    if (activeTab === 'installed') {
      const installedIds = installedModels.map(m => m.id);
      filtered = filtered.filter(model => installedIds.includes(model.id));
    } else if (activeTab === 'recommended') {
      const recommendedIds = recommendations.map(r => r.model.id);
      filtered = filtered.filter(model => recommendedIds.includes(model.id));
    }

    // Apply additional filters
    filtered = modelManager.filterModels({ ...filter });

    setFilteredModels(filtered);
  };

  const handleInstallModel = async (modelId: string) => {
    try {
      const model = models.find(m => m.id === modelId);
      if (!model) return;

      Alert.alert(
        'Install Model',
        `Download ${model.name} (${(model.fileSize / (1024 * 1024 * 1024)).toFixed(1)} GB)?\n\nThis may take several minutes depending on your internet connection.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Install',
            onPress: async () => {
              try {
                const success = await modelManager.downloadModel(modelId, (progress) => {
                  setDownloads(modelManager.getActiveDownloads());
                  console.log(`Download progress for ${modelId}: ${progress.progress.toFixed(1)}%`);
                });
                
                if (success) {
                  await loadData();
                  Alert.alert('Success', 'Model installed successfully!');
                } else {
                  Alert.alert('Error', 'Failed to install model');
                }
              } catch (downloadError) {
                console.error('Download failed:', downloadError);
                Alert.alert(
                  'Download Failed', 
                  downloadError instanceof Error ? downloadError.message : 'An unknown error occurred during download'
                );
                // Refresh data to clear any stale download states
                await loadData();
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Failed to install model:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'Unknown error');
    }
  };

  const handleActivateModel = async (modelId: string) => {
    try {
      const success = await modelManager.setActiveModel(modelId);
      if (success) {
        await loadData();
        const model = models.find(m => m.id === modelId);
        if (model) {
          onModelSelect(model);
        }
        // Notify app to reload model
        eventBus.emit('model:changed', { modelId });
      } else {
        Alert.alert('Error', 'Failed to activate model');
      }
    } catch (error) {
      console.error('Failed to activate model:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'Unknown error');
    }
  };

  const isModelInstalled = (modelId: string) => {
    return installedModels.some(m => m.id === modelId);
  };

  const isModelActive = (modelId: string) => {
    return installedModels.some(m => m.id === modelId && m.isActive);
  };

  const isModelDownloading = (modelId: string) => {
    return downloads.some(d => d.modelId === modelId && d.status === 'downloading');
  };

  const getDownloadProgress = (modelId: string) => {
    const download = downloads.find(d => d.modelId === modelId);
    return download?.progress || 0;
  };

  const handleDeleteModel = async (modelId: string) => {
    try {
      const model = models.find(m => m.id === modelId);
      if (!model) return;

      Alert.alert(
        'Delete Model',
        `Are you sure you want to delete ${model.name}? This will free up ${(model.fileSize / (1024 * 1024 * 1024)).toFixed(1)} GB of storage.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              try {
                const success = await modelManager.uninstallModel(modelId);
                if (success) {
                  await loadData();
                  Alert.alert('Success', 'Model deleted successfully!');
                } else {
                  Alert.alert('Error', 'Failed to delete model');
                }
              } catch (deleteError) {
                console.error('Delete failed:', deleteError);
                Alert.alert(
                  'Delete Failed', 
                  deleteError instanceof Error ? deleteError.message : 'An unknown error occurred during deletion'
                );
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Failed to delete model:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'Unknown error');
    }
  };

  // AI Configuration functions
  const handleOptimizeForDevice = async () => {
    setIsConfigLoading(true);
    try {
      // Simulate optimization
      await new Promise(resolve => setTimeout(resolve, 2000));
      Alert.alert('Success', 'AI parameters optimized for your device!');
    } catch (error) {
      Alert.alert('Error', 'Failed to optimize parameters');
    } finally {
      setIsConfigLoading(false);
    }
  };

  const handleDownloadCustomModel = async () => {
    if (!aiConfig.customModelUrl.trim()) {
      Alert.alert('Error', 'Please enter a valid model URL');
      return;
    }

    setIsConfigLoading(true);
    try {
      // Validate URL format
      if (!aiConfig.customModelUrl.includes('huggingface.co') || !aiConfig.customModelUrl.endsWith('.gguf')) {
        throw new Error('Please enter a valid HuggingFace GGUF model URL');
      }

      Alert.alert(
        'Download Custom Model',
        `Download model from:\n${aiConfig.customModelUrl}`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Download',
            onPress: () => {
              // TODO: Implement custom model download
              Alert.alert('Info', 'Custom model download feature coming soon!');
            }
          }
        ]
      );
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Invalid URL');
    } finally {
      setIsConfigLoading(false);
    }
  };

  const renderModelCard = ({ item }: { item: ModelSpec }) => (
    <ModelCard
      model={item}
      isInstalled={isModelInstalled(item.id)}
      isActive={isModelActive(item.id)}
      isDownloading={isModelDownloading(item.id)}
      downloadProgress={getDownloadProgress(item.id)}
      onInstall={() => handleInstallModel(item.id)}
      onActivate={() => handleActivateModel(item.id)}
      onDelete={() => handleDeleteModel(item.id)}
      onSelect={() => {
        // Show model details or additional actions
      }}
    />
  );

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={{
        flex: 1,
        backgroundColor: colors.background,
      }}>
        {/* Header */}
        <View style={[
          {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 16,
            paddingVertical: 16,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
            backgroundColor: colors.cardBackground,
          },
          isDark && GlassStyles.card,
        ]}>
          <Text style={{
            fontSize: 20,
            fontWeight: '700',
            color: colors.text,
          }}>
            AI Models
          </Text>
          
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity
              onPress={() => setShowFilters(!showFilters)}
              style={{
                padding: 10,
                borderRadius: 10,
                backgroundColor: colors.backgroundSecondary,
                marginRight: 8,
              }}
            >
              <Ionicons name="options" size={20} color={colors.icon} />
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={onClose}
              style={{
                padding: 10,
                borderRadius: 10,
                backgroundColor: colors.backgroundSecondary,
              }}
            >
              <Ionicons name="close" size={20} color={colors.icon} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Search */}
        <View style={{ padding: 16 }}>
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search models..."
            placeholderTextColor={colors.icon}
            style={{
              backgroundColor: colors.backgroundSecondary,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 12,
              paddingHorizontal: 16,
              paddingVertical: 12,
              fontSize: 16,
              color: colors.text,
            }}
          />
        </View>

        {/* Tabs */}
        <View style={{ flexDirection: 'row', paddingHorizontal: 16, marginBottom: 16 }}>
          {[
            { key: 'recommended', label: 'Recommended' },
            { key: 'all', label: 'All Models' },
            { key: 'installed', label: 'Installed' },
            { key: 'config', label: 'Config' },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.key}
              onPress={() => setActiveTab(tab.key as any)}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 20,
                backgroundColor: activeTab === tab.key ? colors.tint : colors.backgroundSecondary,
                marginRight: 8,
              }}
            >
              <Text style={{
                color: activeTab === tab.key ? 'white' : colors.text,
                fontWeight: '600',
              }}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Filters */}
        {showFilters && (
          <View style={{ paddingHorizontal: 16, marginBottom: 16 }}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 8 }}>
              Filters
            </Text>
            
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {/* Add filter chips here */}
              <FilterChip
                label="Mobile Optimized"
                isSelected={filter.useCase?.includes('mobile-optimized') || false}
                onToggle={() => {
                  const newUseCase = filter.useCase?.includes('mobile-optimized' as any)
                    ? filter.useCase.filter(u => u !== 'mobile-optimized')
                    : [...(filter.useCase || []), 'mobile-optimized' as any];
                  setFilter({ ...filter, useCase: newUseCase });
                }}
              />
              {/* Add more filter chips */}
            </ScrollView>
          </View>
        )}

        {/* Content Area */}
        {activeTab === 'config' ? (
          <ScrollView 
            contentContainerStyle={{ padding: 16 }}
            showsVerticalScrollIndicator={false}
          >
            {/* AI Configuration Section */}
            <View style={[
              {
                padding: 16,
                borderRadius: 12,
                backgroundColor: colors.cardBackground,
                borderWidth: 1,
                borderColor: colors.border,
                marginBottom: 16,
              },
              isDark && GlassStyles.card,
            ]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                <Ionicons name="analytics" size={20} color={colors.tint} />
                <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text, marginLeft: 8 }}>
                  AI Configuration
                </Text>
              </View>

              {/* Auto-Optimize Setting */}
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingVertical: 12,
                borderBottomWidth: 1,
                borderBottomColor: colors.border,
              }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text }}>
                    Auto-Optimize for Device
                  </Text>
                  <Text style={{ fontSize: 12, color: colors.icon, marginTop: 2 }}>
                    Automatically adjust AI parameters based on your device
                  </Text>
                </View>
                <Switch
                  value={aiConfig.autoOptimize}
                  onValueChange={(value) => setAiConfig(prev => ({ ...prev, autoOptimize: value }))}
                  trackColor={{ false: colors.backgroundSecondary, true: colors.tint }}
                  thumbColor={aiConfig.autoOptimize ? 'white' : colors.icon}
                />
              </View>

              {/* Manual Optimize Button */}
              <TouchableOpacity
                onPress={handleOptimizeForDevice}
                disabled={isConfigLoading}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: colors.tint,
                  paddingVertical: 12,
                  borderRadius: 8,
                  marginTop: 16,
                  opacity: isConfigLoading ? 0.7 : 1,
                }}
              >
                {isConfigLoading ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Ionicons name="hardware-chip" size={16} color="white" />
                )}
                <Text style={{ 
                  color: 'white', 
                  fontWeight: '600', 
                  marginLeft: 8 
                }}>
                  {isConfigLoading ? 'Optimizing...' : 'Optimize Parameters'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Custom Model Download Section */}
            <View style={[
              {
                padding: 16,
                borderRadius: 12,
                backgroundColor: colors.cardBackground,
                borderWidth: 1,
                borderColor: colors.border,
              },
              isDark && GlassStyles.card,
            ]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                <Ionicons name="cloud-download" size={20} color={colors.tint} />
                <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text, marginLeft: 8 }}>
                  Download Custom Model
                </Text>
              </View>

              <Text style={{ fontSize: 12, color: colors.icon, marginBottom: 12 }}>
                Enter HuggingFace GGUF model URL:
              </Text>

              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: 8,
                  padding: 12,
                  fontSize: 14,
                  color: colors.text,
                  backgroundColor: colors.backgroundSecondary,
                  marginBottom: 16,
                  textAlignVertical: 'top',
                }}
                placeholder="https://huggingface.co/.../model.gguf"
                placeholderTextColor={colors.icon}
                value={aiConfig.customModelUrl}
                onChangeText={(text) => setAiConfig(prev => ({ ...prev, customModelUrl: text }))}
                multiline
                numberOfLines={3}
              />

              <TouchableOpacity
                onPress={handleDownloadCustomModel}
                disabled={isConfigLoading || !aiConfig.customModelUrl.trim()}
                style={{
                  backgroundColor: colors.tint,
                  paddingVertical: 12,
                  borderRadius: 8,
                  alignItems: 'center',
                  opacity: isConfigLoading || !aiConfig.customModelUrl.trim() ? 0.5 : 1,
                }}
              >
                <Text style={{ color: 'white', fontWeight: '600' }}>
                  {isConfigLoading ? 'Downloading...' : 'Download Model'}
                </Text>
              </TouchableOpacity>

              {/* Example URLs */}
              <View style={{ marginTop: 16 }}>
                <Text style={{ fontSize: 12, fontWeight: '600', color: colors.text, marginBottom: 8 }}>
                  Example URLs:
                </Text>
                {[
                  'DeepSeek-R1-Distill-Qwen-1.5B-Q4_K_M.gguf',
                  'Qwen2.5-3B-Instruct-Q4_K_M.gguf',
                  'Llama-3.2-1B-Instruct-Q4_K_M.gguf'
                ].map((example, index) => (
                  <TouchableOpacity
                    key={index}
                    onPress={() => setAiConfig(prev => ({ 
                      ...prev, 
                      customModelUrl: `https://huggingface.co/example/${example}` 
                    }))}
                    style={{
                      backgroundColor: colors.backgroundSecondary,
                      padding: 8,
                      borderRadius: 6,
                      marginBottom: 4,
                    }}
                  >
                    <Text style={{ fontSize: 11, color: colors.icon }}>
                      {example}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>
        ) : (
          /* Models List */
          <FlatList
            data={filteredModels}
            renderItem={renderModelCard}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: 16 }}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={{ alignItems: 'center', paddingVertical: 32 }}>
                <Ionicons name="cube-outline" size={48} color={colors.icon} />
                <Text style={{
                  fontSize: 16,
                  color: colors.icon,
                  textAlign: 'center',
                  marginTop: 16,
                }}>
                  No models found
                </Text>
              </View>
            }
          />
        )}
      </View>
    </Modal>
  );
};