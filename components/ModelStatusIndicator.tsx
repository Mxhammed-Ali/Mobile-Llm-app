/**
 * Model Status Indicator Component
 * Shows the currently loaded model with a green light indicator
 */

import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useThemeColors } from '../hooks/useThemeColor';
import { ModelManagerService } from '../services/ModelManagerService';
import { embedderModelManager } from '../services/EmbedderModelManager';
import * as FileSystem from 'expo-file-system';

interface ModelStatusIndicatorProps {
  isModelLoaded: boolean;
  showEmbedder?: boolean;
}

export const ModelStatusIndicator: React.FC<ModelStatusIndicatorProps> = ({ 
  isModelLoaded, 
  showEmbedder = false 
}) => {
  const colors = useThemeColors();
  const [activeModelName, setActiveModelName] = useState<string>('');
  const [activeEmbedderName, setActiveEmbedderName] = useState<string>('Loading...');
  const [details, setDetails] = useState<{
    id?: string;
    fileName?: string;
    fileSizeMB?: number;
    verified?: boolean;
    params?: string;
    quant?: string;
  } | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    loadActiveModels();
  }, [isModelLoaded]);

  const loadActiveModels = async () => {
    try {
      // Load AI model info
      const modelManager = ModelManagerService.getInstance();
      const activeModel = await modelManager.getActiveModel();
      
      if (activeModel) {
        // Extract a shorter, more readable name
        const modelName = activeModel.modelSpec.name
          .replace('DeepSeek-R1-Distill-', 'Mobile-LLM-')
          .replace('-GGUF', '')
          .replace('-Q4_K_M', '')
          .replace('Qwen-', '')
          .replace('Llama-', '');
        
        setActiveModelName(modelName);

        // Collect details for quick verification
        try {
          const fileInfo = await FileSystem.getInfoAsync(activeModel.filePath);
          const sizeMB = fileInfo.exists && 'size' in fileInfo ? Math.round((fileInfo.size as number) / (1024 * 1024)) : undefined;
          const fileName = activeModel.filePath.split('/').pop();
          setDetails({
            id: activeModel.id,
            fileName,
            fileSizeMB: sizeMB,
            verified: activeModel.verified,
            params: activeModel.modelSpec.parameters,
            quant: activeModel.modelSpec.quantization,
          });
        } catch {}
      } else {
        setActiveModelName('No Model');
        setDetails(null);
      }

      // Load embedder info
      if (showEmbedder) {
        await embedderModelManager.initialize();
        const currentEmbedder = embedderModelManager.getCurrentModel();
        
        if (currentEmbedder) {
          const embedderName = currentEmbedder.displayName
            .replace('BGE Small English', 'BGE-Small')
            .replace('MiniLM L6 v2', 'MiniLM')
            .replace('MPNet Base v2', 'MPNet')
            .replace('Built-in Simple', 'Simple');
          
          setActiveEmbedderName(embedderName);
        } else {
          setActiveEmbedderName('No Embedder');
        }
      }
    } catch (error) {
      console.error('Failed to get active models:', error);
      setActiveModelName('Unknown Model');
      setActiveEmbedderName('Unknown Embedder');
    }
  };

  const getModelDisplayName = () => {
    if (!isModelLoaded) return 'AI Loading...';
    
    // Default fallback names based on common models
    if (activeModelName) {
      return activeModelName;
    }
    
    // Fallback names
          return 'Mobile LLM';
  };

  return (
    <View style={{ flexDirection: 'column', alignItems: 'flex-end' }}>
      {/* AI Model Status */}
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => setShowDetails(prev => !prev)}
        style={{ flexDirection: 'row', alignItems: 'center', marginBottom: showEmbedder ? 2 : 0 }}
      >
        <View style={{
          width: 8,
          height: 8,
          borderRadius: 4,
          backgroundColor: isModelLoaded ? '#00FF94' : '#FF6B6B',
          marginRight: 6,
          shadowColor: isModelLoaded ? '#00FF94' : '#FF6B6B',
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: isModelLoaded ? 0.8 : 0.6,
          shadowRadius: 4,
          elevation: 4,
        }} />
        <Text style={{ 
          fontSize: showEmbedder ? 14 : 12,
          color: colors.text, 
          fontWeight: '600',
          maxWidth: 140,
        }} numberOfLines={1}>
          {getModelDisplayName()}
        </Text>
      </TouchableOpacity>

      {showDetails && details && (
        <View style={{
          position: 'absolute',
          top: 18,
          right: 0,
          backgroundColor: colors.cardBackground,
          borderColor: colors.border,
          borderWidth: 1,
          borderRadius: 8,
          paddingVertical: 8,
          paddingHorizontal: 10,
          maxWidth: 220,
          zIndex: 1000,
        }}>
          <Text style={{ color: colors.text, fontSize: 12, fontWeight: '700' }} numberOfLines={1}>
            {activeModelName}
          </Text>
          <Text style={{ color: colors.icon, fontSize: 11 }} numberOfLines={1}>
            Params: {details.params} • {details.quant}
          </Text>
          {details.fileName && (
            <Text style={{ color: colors.icon, fontSize: 11 }} numberOfLines={1}>
              File: {details.fileName}
            </Text>
          )}
          {typeof details.fileSizeMB === 'number' && (
            <Text style={{ color: colors.icon, fontSize: 11 }} numberOfLines={1}>
              Size: ~{details.fileSizeMB} MB
            </Text>
          )}
          {typeof details.verified === 'boolean' && (
            <Text style={{ color: colors.icon, fontSize: 11 }} numberOfLines={1}>
              Verified: {details.verified ? 'Yes' : 'No'}
            </Text>
          )}
        </View>
      )}

      {/* Embedder Status */}
      {showEmbedder && (
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{
            width: 6,
            height: 6,
            borderRadius: 3,
            backgroundColor: '#4A90E2',
            marginRight: 6,
            shadowColor: '#4A90E2',
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.6,
            shadowRadius: 2,
            elevation: 2,
          }} />
          <Text style={{ 
            fontSize: 10,
            color: colors.icon, 
            fontWeight: '500',
            maxWidth: 140,
          }} numberOfLines={1}>
            Vector: {activeEmbedderName}
          </Text>
        </View>
      )}
    </View>
  );
};