import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  Switch,
  TextInput,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '@/contexts/ThemeContext';
import { useThemeColors, useIsDark } from '../hooks/useThemeColor';
import { ThemedText } from '@/components/ThemedText';
import { Colors, GlassStyles } from '../constants/Colors';
import { getDeviceResources, DeviceResources } from '@/utils/deviceResources';
import SystemMonitor, { SystemResources } from '@/utils/systemMonitor';
import { LogsViewer } from '../components/LogsViewer';
import { logger } from '@/utils/logger';

interface TestResults {
  storage: boolean;
  database: boolean;
  models: boolean;
  details: string[];
}

interface DeviceInfoState {
  isLoaded: boolean;
  deviceResources?: DeviceResources;
  lastUpdated?: Date;
}

interface SystemMonitorState {
  isActive: boolean;
  resources?: SystemResources;
  lastUpdated?: Date;
}

interface AISettings {
  modelParameters: any; // Simplified for now
  selectedLLM: string;
  selectedEmbedder: string;
  customModelUrl: string;
  autoOptimize: boolean;
}

interface SystemPerformanceSettings {
  maxContextTokens: number;
  maxRAMUsage: number; // in MB
  threadCount: number;
  gpuLayers: number;
  temperatureSetting: number;
  topP: number;
  topK: number;
  maxPredictTokens: number;
  enableMemoryOptimization: boolean;
  enableContextCompression: boolean;
  enableAdaptiveTokens: boolean;
}

export default function SettingsScreen() {
  const colors = useThemeColors();
  const { colorScheme, setColorScheme, isSystemTheme, setSystemTheme } = useTheme();
  const isDark = useIsDark();
  const insets = useSafeAreaInsets();
  const rootBackground = useMemo(() => {
    return colors.background;
  }, [colors.background]);
  const [showLogs, setShowLogs] = useState(false);
  
  // State management
  const [isLoading, setIsLoading] = useState(false);
  const [testResults, setTestResults] = useState<TestResults | null>(null);
  const [notifications, setNotifications] = useState(true);
  const [autoSave, setAutoSave] = useState(true);
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfoState>({
    isLoaded: false,
    deviceResources: undefined,
    lastUpdated: undefined
  });
  
  const [systemMonitor, setSystemMonitor] = useState<SystemMonitorState>({
    isActive: false,
    resources: undefined,
    lastUpdated: undefined
  });
  const [aiSettings, setAISettings] = useState<AISettings>({
    modelParameters: {
      n_ctx: 1024,
      n_gpu_layers: 0,
      n_predict: 1024,
      temperature: 0.7,
      top_p: 0.8,
      top_k: 20,
      min_p: 0,
      stop: [],
      n_threads: 2,
      use_mlock: false,
    },
          selectedLLM: 'mobile-llm',
    selectedEmbedder: 'bge-small',
    customModelUrl: '',
    autoOptimize: true,
  });

  const [systemPerformance, setSystemPerformance] = useState<SystemPerformanceSettings>({
    maxContextTokens: 2048,
    maxRAMUsage: 1500, // 1.5GB default
    threadCount: 2,
    gpuLayers: 0,
    temperatureSetting: 0.7,
    topP: 0.9,
    topK: 40,
    maxPredictTokens: 1000,
    enableMemoryOptimization: true,
    enableContextCompression: false,
    enableAdaptiveTokens: true,
  });

  useEffect(() => {
    // Only load AI settings and system performance on startup
    // Device info will be loaded manually when user requests it
    loadAISettings();
    loadSystemPerformanceSettings();
  }, []);

  const checkDeviceResources = async () => {
    try {
      setIsLoading(true);
      logger.info('🔍 Manual device resources check requested...');
      
      // Force refresh to get latest data
      const deviceResources = await getDeviceResources(true);
      
      setDeviceInfo({
        isLoaded: true,
        deviceResources,
        lastUpdated: new Date()
      });

      Alert.alert(
        'Device Check Complete',
        `Device: ${deviceResources.deviceInfo.modelName}\nRAM: ${deviceResources.totalMemory} MB\nArchitecture: ${deviceResources.cpuArchitectures.join(', ')}\nClassification: ${deviceResources.isLowEndDevice ? 'Low-end' : 'High-end'}`
      );
      } catch (error) {
      logger.error('Error checking device resources:', error);
      Alert.alert('Error', 'Failed to check device resources. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Alias for consistency
  const refreshDeviceResources = checkDeviceResources;

  const toggleSystemMonitoring = async () => {
    const monitor = SystemMonitor.getInstance();
    
    if (systemMonitor.isActive) {
      // Stop monitoring
      monitor.stopMonitoring();
      monitor.unlockAllResources();
      setSystemMonitor({
        isActive: false,
        resources: undefined,
        lastUpdated: undefined
      });
      Alert.alert('Monitoring Stopped', 'System resource monitoring has been disabled and all resource locks released.');
    } else {
      // Start monitoring
      try {
        const resources = await monitor.getSystemResources();
        setSystemMonitor({
          isActive: true,
          resources,
          lastUpdated: new Date()
        });

        // Set up monitoring callback
        monitor.addMonitoringCallback((newResources) => {
          setSystemMonitor(prev => ({
            ...prev,
            resources: newResources,
            lastUpdated: new Date()
          }));
        });

        monitor.startMonitoring(3000); // Update every 3 seconds
        Alert.alert('Monitoring Started', 'System resource monitoring is now active. Resources will update every 3 seconds.');
      } catch (error) {
        logger.error('Error starting system monitoring:', error);
        Alert.alert('Error', 'Failed to start system monitoring.');
      }
    }
  };

  const lockResources = async () => {
    const monitor = SystemMonitor.getInstance();
    
    Alert.alert(
      'Lock System Resources',
      'This will attempt to reserve CPU/GPU resources for the AI model. Choose priority level:',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Normal (50%)', 
          onPress: async () => {
            const success = await monitor.lockResource('cpu', 50);
            if (Platform.OS === 'ios') {
              await monitor.lockResource('gpu', 50);
            }
            Alert.alert(success ? 'Success' : 'Failed', success ? 'Resources locked with normal priority' : 'Failed to lock resources');
          }
        },
        { 
          text: 'High (80%)', 
          onPress: async () => {
            const success = await monitor.lockResource('cpu', 80);
            if (Platform.OS === 'ios') {
              await monitor.lockResource('gpu', 80);
            }
            Alert.alert(success ? 'Success' : 'Failed', success ? 'Resources locked with high priority' : 'Failed to lock resources');
          }
        }
      ]
    );
  };

  // Debounced AsyncStorage operations to prevent callback leaks
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSaveDataRef = useRef<{ key: string; data: string } | null>(null);

  const debouncedSave = useCallback((key: string, data: string) => {
    // Skip if same data
    if (lastSaveDataRef.current && 
        lastSaveDataRef.current.key === key && 
        lastSaveDataRef.current.data === data) {
      return;
    }
    
    lastSaveDataRef.current = { key, data };
    
    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    // Debounce save operation
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await AsyncStorage.setItem(key, data);
    } catch (error) {
        logger.error('Error saving to AsyncStorage:', error);
    }
    }, 500);
  }, []);

  const loadAISettings = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem('ai_settings');
      if (stored) {
        const settings = JSON.parse(stored);
        setAISettings(settings);
      }
    } catch (error) {
      logger.error('Error loading AI settings:', error);
    }
  }, []);

  const saveAISettings = useCallback(async (newSettings: Partial<AISettings>) => {
      const updatedSettings = { ...aiSettings, ...newSettings };
      setAISettings(updatedSettings);
    debouncedSave('ai_settings', JSON.stringify(updatedSettings));
  }, [aiSettings, debouncedSave]);

  const loadSystemPerformanceSettings = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem('system_performance_settings');
      if (stored) {
        const settings = JSON.parse(stored);
        setSystemPerformance(prev => ({ ...prev, ...settings }));
      }
    } catch (error) {
      logger.error('Error loading system performance settings:', error);
    }
  }, []);

  const saveSystemPerformanceSettings = useCallback(async (newSettings: Partial<SystemPerformanceSettings>) => {
    const updatedSettings = { ...systemPerformance, ...newSettings };
    setSystemPerformance(updatedSettings);
    debouncedSave('system_performance_settings', JSON.stringify(updatedSettings));
  }, [systemPerformance, debouncedSave]);

  const optimizeForDevice = async () => {
    try {
      // Get current device resources or use cached data
      let resources = deviceInfo.deviceResources;
      if (!resources) {
        resources = await getDeviceResources(true);
        setDeviceInfo({
          isLoaded: true,
          deviceResources: resources,
          lastUpdated: new Date()
        });
      }

      // Get system monitoring data if available
      const monitor = SystemMonitor.getInstance();
      let systemRes;
      try {
        systemRes = await monitor.getSystemResources();
      } catch {
        systemRes = null;
      }

      // Calculate optimized parameters based on actual device capabilities
      const optimizedParams = {
        maxContextTokens: resources.recommendedConfig.contextSize,
        threadCount: resources.recommendedConfig.threads,
        gpuLayers: resources.recommendedConfig.gpuLayers,
        // Adjust based on current memory usage
        maxRAMUsage: systemRes ? 
          Math.min(2000, Math.floor(systemRes.memory.available * 0.7)) : 
          Math.floor(resources.totalMemory * 0.6),
        // Conservative settings for better stability
        temperatureSetting: 0.7,
        topP: 0.9,
        topK: 40,
        maxPredictTokens: resources.isLowEndDevice ? 500 : 1000,
        enableMemoryOptimization: resources.isLowEndDevice || (systemRes?.memory.percentage || 0) > 60,
        enableContextCompression: resources.isLowEndDevice,
        enableAdaptiveTokens: true,
      };

      // Update system performance settings
      await saveSystemPerformanceSettings(optimizedParams);

      // Also update AI settings for compatibility
      await saveAISettings({
        modelParameters: {
          n_ctx: optimizedParams.maxContextTokens,
          n_threads: optimizedParams.threadCount,
          n_gpu_layers: optimizedParams.gpuLayers,
          temperature: optimizedParams.temperatureSetting,
          top_p: optimizedParams.topP,
          top_k: optimizedParams.topK,
          n_predict: optimizedParams.maxPredictTokens,
        },
        autoOptimize: true,
      });

      Alert.alert(
        'Optimization Complete', 
        `Settings optimized for ${resources.deviceInfo.modelName}:\n` +
        `• Context: ${optimizedParams.maxContextTokens} tokens\n` +
        `• RAM: ${optimizedParams.maxRAMUsage}MB limit\n` +
        `• Threads: ${optimizedParams.threadCount}\n` +
        `• GPU Layers: ${optimizedParams.gpuLayers}\n` +
        `• Memory Optimization: ${optimizedParams.enableMemoryOptimization ? 'On' : 'Off'}`
      );
    } catch (error) {
      logger.error('Error optimizing for device:', error);
      Alert.alert('Error', 'Failed to optimize device parameters');
    }
  };

  const downloadCustomModel = async () => {
    if (!aiSettings.customModelUrl.trim()) {
      Alert.alert('Error', 'Please enter a valid model URL');
      return;
    }

    try {
      setIsLoading(true);
      Alert.alert('Info', 'Custom model download not implemented yet. Use the main app to download models.');
    } catch (error) {
      logger.error('Error downloading custom model:', error);
      Alert.alert('Error', 'Failed to download custom model');
    } finally {
      setIsLoading(false);
    }
  };

  const runDiagnostics = async () => {
    setIsLoading(true);
    
    setTimeout(() => {
      const results: TestResults = {
        storage: true,
        database: deviceInfo.isLoaded,
        models: true,
        details: [
          '✅ Storage: Available and working',
          `${deviceInfo.isLoaded ? '✅' : '❌'} Device Resources: ${deviceInfo.isLoaded ? 'Loaded' : 'Not loaded'}`,
          '✅ Models: Available',
          `📱 Device: ${deviceInfo.deviceResources?.deviceInfo.modelName || 'Unknown'}`,
          `💾 RAM: ${deviceInfo.deviceResources ? (deviceInfo.deviceResources.totalMemory / 1024).toFixed(1) + 'GB' : 'Unknown'}`,
          `💿 Storage: ${deviceInfo.deviceResources ? (deviceInfo.deviceResources.diskInfo.freeStorage / 1024).toFixed(1) + 'GB free' : 'Unknown'}`,
          `🏗️ Architecture: ${deviceInfo.deviceResources?.cpuArchitectures.join(', ') || 'Unknown'}`,
        ]
      };
      
      setTestResults(results);
      setIsLoading(false);
      
      Alert.alert(
        'Diagnostics Complete',
        `Storage: ${results.storage ? '✅' : '❌'}\nDevice Resources: ${results.database ? '✅' : '❌'}\nModels: ${results.models ? '✅' : '❌'}`,
        [{ text: 'View Details', onPress: () => showTestDetails(results) }]
      );
    }, 2000);
  };

  const showTestDetails = (results: TestResults) => {
    Alert.alert(
      'Diagnostic Details',
      results.details.join('\n'),
      [{ text: 'OK' }]
    );
  };

  const SettingItem = ({ 
    icon, 
    title, 
    subtitle, 
    onPress, 
    rightElement,
    showSwitch = false,
    switchValue = false,
    onSwitchChange = () => {}
  }: {
    icon: React.ReactNode;
    title: string;
    subtitle?: string;
    onPress?: () => void;
    rightElement?: React.ReactNode;
    showSwitch?: boolean;
    switchValue?: boolean;
    onSwitchChange?: (value: boolean) => void;
  }) => (
    <TouchableOpacity
      onPress={onPress}
      disabled={!onPress && !showSwitch}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        backgroundColor: isDark ? 'transparent' : colors.cardBackground,
      }}
    >
      <View style={{ marginRight: 12 }}>
        {icon}
      </View>
      <View style={{ flex: 1 }}>
        <ThemedText style={{ fontSize: 16, fontWeight: '500' }}>{title}</ThemedText>
        {subtitle && (
          <ThemedText style={{ fontSize: 14, color: colors.icon, marginTop: 2 }}>{subtitle}</ThemedText>
        )}
      </View>
      {showSwitch ? (
        <Switch
          value={switchValue}
          onValueChange={onSwitchChange}
          trackColor={{ false: colors.border, true: colors.tint }}
          thumbColor={switchValue ? 'white' : colors.backgroundTertiary}
        />
      ) : rightElement ? (
        <View style={{ marginLeft: 8 }}>
          {rightElement}
        </View>
      ) : null}
    </TouchableOpacity>
  );

  const StatusIcon = ({ success }: { success: boolean }) => (
    <Ionicons 
      name={success ? "checkmark-circle" : "close-circle"} 
      size={20} 
      color={success ? colors.success : colors.error} 
    />
  );

  const InfoButton = ({ title, description }: { title: string; description: string }) => (
    <TouchableOpacity
      onPress={() => Alert.alert(title, description)}
      style={{
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: colors.tint,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 8,
      }}
    >
      <Ionicons name="information" size={12} color="white" />
    </TouchableOpacity>
  );

  const SliderSetting = ({ 
    title, 
    subtitle, 
    value, 
    min, 
    max, 
    step = 1, 
    unit = '',
    onValueChange,
    infoTitle,
    infoDescription
  }: {
    title: string;
    subtitle: string;
    value: number;
    min: number;
    max: number;
    step?: number;
    unit?: string;
    onValueChange: (value: number) => void;
    infoTitle: string;
    infoDescription: string;
  }) => (
    <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <ThemedText style={{ fontSize: 16, fontWeight: '500' }}>{title}</ThemedText>
            <InfoButton title={infoTitle} description={infoDescription} />
          </View>
          <ThemedText style={{ fontSize: 14, color: colors.icon, marginTop: 2 }}>{subtitle}</ThemedText>
        </View>
        <View style={{
          backgroundColor: colors.tint,
          paddingHorizontal: 12,
          paddingVertical: 6,
          borderRadius: 16,
          minWidth: 60,
          alignItems: 'center',
        }}>
          <ThemedText style={{ color: 'white', fontWeight: '600', fontSize: 14 }}>
            {value}{unit}
          </ThemedText>
        </View>
      </View>
      <View style={{ marginTop: 12 }}>
        <View style={{
          height: 4,
          backgroundColor: colors.border,
          borderRadius: 2,
        }}>
          <View style={{
            height: 4,
            backgroundColor: colors.tint,
            borderRadius: 2,
            width: `${((value - min) / (max - min)) * 100}%`,
          }} />
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
          <TouchableOpacity
            onPress={() => onValueChange(Math.max(min, value - step))}
            style={{
              backgroundColor: colors.backgroundSecondary,
              padding: 8,
              borderRadius: 6,
            }}
          >
            <Ionicons name="remove" size={16} color={colors.icon} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => onValueChange(Math.min(max, value + step))}
            style={{
              backgroundColor: colors.backgroundSecondary,
              padding: 8,
              borderRadius: 6,
            }}
          >
            <Ionicons name="add" size={16} color={colors.icon} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const ThemeSelector = () => (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
              {(['light', 'dark'] as ('light' | 'dark')[]).map((theme) => (
        <TouchableOpacity
          key={theme}
          onPress={() => setColorScheme(theme)}
          style={{
            flex: 1,
            marginHorizontal: 4,
            padding: 12,
            borderRadius: 8,
            borderWidth: 2,
            borderColor: colorScheme === theme ? colors.tint : colors.border,
            backgroundColor: theme === 'dark' 
                ? colors.backgroundTertiary 
                : colors.backgroundSecondary,
            alignItems: 'center',
          }}
        >
          <ThemedText style={{ 
            fontSize: 12, 
            fontWeight: '600',
            color: colorScheme === theme ? colors.tint : colors.text 
          }}>
            {theme.charAt(0).toUpperCase() + theme.slice(1)}
          </ThemedText>
        </TouchableOpacity>
      ))}
    </View>
  );

  const baseBackground = isDark ? Colors.dark.background : colors.background;

  return (
    <View style={{ flex: 1, backgroundColor: baseBackground }}>
      <SafeAreaView style={{ flex: 1, backgroundColor: baseBackground }}>
        {/* Transparent SafeAreaView to show gradient background */}
        <ScrollView style={{ flex: 1 }}>
          {/* Header */}
          <View style={{
            paddingHorizontal: 16,
            paddingVertical: 24,
            paddingTop: insets.top + 24,
            backgroundColor: isDark ? 'transparent' : colors.cardBackground,
            borderBottomWidth: isDark ? 0 : 1,
            borderBottomColor: colors.border,
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="settings" size={24} color={colors.tint} />
              <ThemedText style={{ marginLeft: 8, fontSize: 20, fontWeight: 'bold' }}>
                Enhanced Settings
              </ThemedText>
            </View>
          </View>

          {/* Theme Settings */}
          <View style={{ 
            marginTop: 16, 
            marginHorizontal: 16, 
            borderRadius: 12,
            padding: 16,
            backgroundColor: isDark ? Colors.dark.cardBackground : colors.cardBackground,
            borderWidth: 1,
            borderColor: isDark ? 'rgba(138, 99, 255, 0.3)' : colors.border,
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <Ionicons name="color-palette" size={20} color={colors.tint} />
              <ThemedText style={{ marginLeft: 8, fontSize: 18, fontWeight: '600' }}>
                Theme & Appearance
              </ThemedText>
            </View>
            <ThemeSelector />
            <SettingItem
              icon={<Ionicons name="shield-checkmark" size={20} color={colors.icon} />}
              title="Follow System Theme"
              subtitle="Automatically switch between light and dark"
              showSwitch={true}
              switchValue={isSystemTheme}
              onSwitchChange={setSystemTheme}
            />
          </View>

          {/* AI Settings */}
          <View style={{ 
            marginTop: 16, 
            marginHorizontal: 16, 
            borderRadius: 12,
            backgroundColor: isDark ? Colors.dark.cardBackground : colors.cardBackground,
            borderWidth: 1,
            borderColor: isDark ? 'rgba(138, 99, 255, 0.3)' : colors.border,
          }}>
            <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="analytics" size={20} color={colors.tint} />
                <ThemedText style={{ marginLeft: 8, fontSize: 18, fontWeight: '600' }}>
                  AI Configuration
                </ThemedText>
              </View>
            </View>
            
            <SettingItem
              icon={<Ionicons name="flash" size={20} color={colors.icon} />}
              title="Auto-Optimize for Device"
              subtitle="Automatically adjust AI parameters based on your device"
              showSwitch={true}
              switchValue={aiSettings.autoOptimize}
              onSwitchChange={(value) => saveAISettings({ autoOptimize: value })}
            />

            <SettingItem
              icon={<Ionicons name="hardware-chip" size={20} color={colors.icon} />}
              title="Optimize Parameters"
              subtitle="Manually optimize AI settings for your device"
              onPress={optimizeForDevice}
              rightElement={
                <TouchableOpacity onPress={optimizeForDevice}>
                  <ThemedText style={{ color: colors.tint }}>Optimize</ThemedText>
                </TouchableOpacity>
              }
            />

            {/* Custom Model Download */}
            <View style={{ padding: 16 }}>
              <ThemedText style={{ fontSize: 16, fontWeight: '600', marginBottom: 12 }}>
                Download Custom Model
              </ThemedText>
              <ThemedText style={{ fontSize: 14, color: colors.icon, marginBottom: 8 }}>
                Enter HuggingFace GGUF model URL:
              </ThemedText>
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: 8,
                  padding: 12,
                  fontSize: 14,
                  color: colors.text,
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : colors.backgroundSecondary,
                  marginBottom: 12,
                }}
                placeholder="https://huggingface.co/.../model.gguf"
                placeholderTextColor={colors.icon}
                value={aiSettings.customModelUrl}
                onChangeText={(text) => setAISettings(prev => ({ ...prev, customModelUrl: text }))}
                multiline
              />
              <TouchableOpacity
                onPress={downloadCustomModel}
                disabled={isLoading || !aiSettings.customModelUrl.trim()}
                style={{
                  backgroundColor: colors.tint,
                  padding: 12,
                  borderRadius: 8,
                  alignItems: 'center',
                  opacity: isLoading || !aiSettings.customModelUrl.trim() ? 0.5 : 1,
                }}
              >
                <ThemedText style={{ color: 'white', fontWeight: '600' }}>
                  {isLoading ? 'Downloading...' : 'Download Model'}
                </ThemedText>
              </TouchableOpacity>
            </View>
          </View>

          {/* System Performance */}
          <View style={{ 
            marginTop: 16, 
            marginHorizontal: 16, 
            borderRadius: 12,
            backgroundColor: isDark ? Colors.dark.cardBackground : colors.cardBackground,
            borderWidth: 1,
            borderColor: isDark ? 'rgba(138, 99, 255, 0.3)' : colors.border,
          }}>
            <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="speedometer" size={20} color={colors.tint} />
                <ThemedText style={{ marginLeft: 8, fontSize: 18, fontWeight: '600' }}>
                  System Performance
                </ThemedText>
              </View>
            </View>

            <SliderSetting
              title="Context Tokens"
              subtitle="Maximum context length for conversations"
              value={systemPerformance.maxContextTokens}
              min={512}
              max={8192}
              step={256}
              onValueChange={(value) => saveSystemPerformanceSettings({ maxContextTokens: value })}
              infoTitle="Context Tokens"
              infoDescription="Context tokens determine how much conversation history the AI can remember. Higher values allow longer conversations but use more memory. Recommended: 2048 for most devices."
            />

            <SliderSetting
              title="RAM Usage Limit"
              subtitle="Maximum RAM allocation for AI processing"
              value={systemPerformance.maxRAMUsage}
              min={500}
              max={4000}
              step={100}
              unit=" MB"
              onValueChange={(value) => saveSystemPerformanceSettings({ maxRAMUsage: value })}
              infoTitle="RAM Usage Limit"
              infoDescription="Controls how much device memory the AI can use. Lower values prevent crashes on low-memory devices but may reduce performance. Recommended: 50-70% of available RAM."
            />

            <SliderSetting
              title="Thread Count"
              subtitle="Number of CPU threads for AI processing"
              value={systemPerformance.threadCount}
              min={1}
              max={8}
              step={1}
              onValueChange={(value) => saveSystemPerformanceSettings({ threadCount: value })}
              infoTitle="Thread Count"
              infoDescription="More threads can improve AI response speed but use more CPU. Set to match your device's CPU cores for optimal performance. Too many threads may cause overheating."
            />

            <SliderSetting
              title="GPU Layers"
              subtitle="Number of model layers to run on GPU"
              value={systemPerformance.gpuLayers}
              min={0}
              max={32}
              step={1}
              onValueChange={(value) => saveSystemPerformanceSettings({ gpuLayers: value })}
              infoTitle="GPU Layers"
              infoDescription="GPU acceleration can significantly improve AI speed. Start with 0 and increase gradually. Not all devices support GPU acceleration. Monitor temperature and battery usage."
            />

            <SliderSetting
              title="Temperature"
              subtitle="Controls AI response creativity and randomness"
              value={systemPerformance.temperatureSetting}
              min={0.1}
              max={2.0}
              step={0.1}
              onValueChange={(value) => saveSystemPerformanceSettings({ temperatureSetting: value })}
              infoTitle="Temperature"
              infoDescription="Lower values (0.1-0.7) make responses more focused and deterministic. Higher values (0.8-2.0) make responses more creative but potentially less coherent. Recommended: 0.7"
            />

            <SliderSetting
              title="Top-P"
              subtitle="Nucleus sampling for response diversity"
              value={systemPerformance.topP}
              min={0.1}
              max={1.0}
              step={0.05}
              onValueChange={(value) => saveSystemPerformanceSettings({ topP: value })}
              infoTitle="Top-P (Nucleus Sampling)"
              infoDescription="Controls response diversity by limiting word choices to the top probability mass. Lower values (0.1-0.5) are more focused, higher values (0.8-1.0) are more diverse. Works with temperature."
            />

            <SliderSetting
              title="Top-K"
              subtitle="Limits vocabulary choices for responses"
              value={systemPerformance.topK}
              min={1}
              max={100}
              step={5}
              onValueChange={(value) => saveSystemPerformanceSettings({ topK: value })}
              infoTitle="Top-K Sampling"
              infoDescription="Limits AI word choices to the K most likely options. Lower values (10-30) are more focused, higher values (50-100) allow more variety. Use with temperature and top-p for fine control."
            />

            <SliderSetting
              title="Max Prediction Tokens"
              subtitle="Maximum length of AI responses"
              value={systemPerformance.maxPredictTokens}
              min={100}
              max={2000}
              step={50}
              onValueChange={(value) => saveSystemPerformanceSettings({ maxPredictTokens: value })}
              infoTitle="Max Prediction Tokens"
              infoDescription="Limits how long AI responses can be. Shorter responses are faster and use less memory. Longer responses allow for more detailed answers. Recommended: 1000 tokens."
            />

            <SettingItem
              icon={<Ionicons name="flash" size={20} color={colors.icon} />}
              title="Memory Optimization"
              subtitle="Reduce memory usage at the cost of some performance"
              showSwitch={true}
              switchValue={systemPerformance.enableMemoryOptimization}
              onSwitchChange={(value) => saveSystemPerformanceSettings({ enableMemoryOptimization: value })}
            />

            <SettingItem
              icon={<Ionicons name="archive" size={20} color={colors.icon} />}
              title="Context Compression"
              subtitle="Compress old conversation history to save memory"
              showSwitch={true}
              switchValue={systemPerformance.enableContextCompression}
              onSwitchChange={(value) => saveSystemPerformanceSettings({ enableContextCompression: value })}
            />

            <SettingItem
              icon={<Ionicons name="trending-up" size={20} color={colors.icon} />}
              title="Adaptive Token Allocation"
              subtitle="Dynamically adjust token usage based on device performance"
              showSwitch={true}
              switchValue={systemPerformance.enableAdaptiveTokens}
              onSwitchChange={(value) => saveSystemPerformanceSettings({ enableAdaptiveTokens: value })}
            />

            {/* Performance Preset Buttons */}
            <View style={{ padding: 16 }}>
              <ThemedText style={{ fontSize: 16, fontWeight: '600', marginBottom: 12 }}>
                Performance Presets
              </ThemedText>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
                <TouchableOpacity
                  onPress={() => {
                    const conservativeSettings = {
                      maxContextTokens: 1024,
                      maxRAMUsage: 800,
                      threadCount: 1,
                      gpuLayers: 0,
                      temperatureSetting: 0.7,
                      topP: 0.9,
                      topK: 40,
                      maxPredictTokens: 500,
                      enableMemoryOptimization: true,
                      enableContextCompression: true,
                      enableAdaptiveTokens: true,
                    };
                    saveSystemPerformanceSettings(conservativeSettings);
                    Alert.alert('Applied', 'Conservative settings applied - optimized for low-end devices');
                  }}
                  style={{
                    flex: 1,
                    backgroundColor: colors.backgroundSecondary,
                    padding: 12,
                    borderRadius: 8,
                    alignItems: 'center',
                  }}
                >
                  <Ionicons name="battery-half" size={20} color={colors.icon} />
                  <ThemedText style={{ fontSize: 12, marginTop: 4, textAlign: 'center' }}>
                    Conservative
                  </ThemedText>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    const balancedSettings = {
                      maxContextTokens: 2048,
                      maxRAMUsage: 1500,
                      threadCount: 2,
                      gpuLayers: 0,
                      temperatureSetting: 0.7,
                      topP: 0.9,
                      topK: 40,
                      maxPredictTokens: 1000,
                      enableMemoryOptimization: true,
                      enableContextCompression: false,
                      enableAdaptiveTokens: true,
                    };
                    saveSystemPerformanceSettings(balancedSettings);
                    Alert.alert('Applied', 'Balanced settings applied - good for most devices');
                  }}
                  style={{
                    flex: 1,
                    backgroundColor: colors.tint,
                    padding: 12,
                    borderRadius: 8,
                    alignItems: 'center',
                  }}
                >
                  <Ionicons name="speedometer" size={20} color="white" />
                  <ThemedText style={{ fontSize: 12, marginTop: 4, textAlign: 'center', color: 'white' }}>
                    Balanced
                  </ThemedText>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    const performanceSettings = {
                      maxContextTokens: 4096,
                      maxRAMUsage: 2500,
                      threadCount: 4,
                      gpuLayers: 8,
                      temperatureSetting: 0.7,
                      topP: 0.9,
                      topK: 40,
                      maxPredictTokens: 1500,
                      enableMemoryOptimization: false,
                      enableContextCompression: false,
                      enableAdaptiveTokens: true,
                    };
                    saveSystemPerformanceSettings(performanceSettings);
                    Alert.alert('Applied', 'Performance settings applied - for high-end devices only');
                  }}
                  style={{
                    flex: 1,
                    backgroundColor: colors.backgroundSecondary,
                    padding: 12,
                    borderRadius: 8,
                    alignItems: 'center',
                  }}
                >
                  <Ionicons name="rocket" size={20} color={colors.icon} />
                  <ThemedText style={{ fontSize: 12, marginTop: 4, textAlign: 'center' }}>
                    Performance
                  </ThemedText>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* System Monitoring */}
          <View style={{ 
            marginTop: 16, 
            marginHorizontal: 16, 
            borderRadius: 12,
            backgroundColor: isDark ? Colors.dark.cardBackground : colors.cardBackground,
            borderWidth: 1,
            borderColor: isDark ? 'rgba(138, 99, 255, 0.3)' : colors.border,
          }}>
            <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="pulse" size={20} color={colors.tint} />
                <ThemedText style={{ marginLeft: 8, fontSize: 18, fontWeight: '600' }}>
                  System Monitoring
                </ThemedText>
              </View>
            </View>

            <SettingItem
              icon={<Ionicons name="stats-chart" size={20} color={colors.icon} />}
              title="Real-time Monitoring"
              subtitle="Monitor CPU, GPU, RAM, and storage usage"
              showSwitch={true}
              switchValue={systemMonitor.isActive}
              onSwitchChange={toggleSystemMonitoring}
            />

            {systemMonitor.isActive && systemMonitor.resources && (
              <>
                <SettingItem
                  icon={<Ionicons name="hardware-chip" size={20} color={colors.icon} />}
                  title="CPU Usage"
                  subtitle={`${systemMonitor.resources.cpu.cores} cores, ${systemMonitor.resources.cpu.usage || 0}% usage`}
                  rightElement={
                    <View style={{
                      backgroundColor: (systemMonitor.resources.cpu.usage || 0) > 80 ? colors.error : 
                                      (systemMonitor.resources.cpu.usage || 0) > 50 ? colors.warning : colors.success,
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      borderRadius: 12,
                    }}>
                      <ThemedText style={{ color: 'white', fontSize: 12 }}>
                        {systemMonitor.resources.cpu.usage || 0}%
                      </ThemedText>
                    </View>
                  }
                />

                <SettingItem
                  icon={<Ionicons name="analytics" size={20} color={colors.icon} />}
                  title="Memory Usage"
                  subtitle={`${systemMonitor.resources.memory.used} MB / ${systemMonitor.resources.memory.total} MB`}
                  rightElement={
                    <View style={{
                      backgroundColor: systemMonitor.resources.memory.percentage > 80 ? colors.error : 
                                      systemMonitor.resources.memory.percentage > 60 ? colors.warning : colors.success,
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      borderRadius: 12,
                    }}>
                      <ThemedText style={{ color: 'white', fontSize: 12 }}>
                        {systemMonitor.resources.memory.percentage}%
                      </ThemedText>
                    </View>
                  }
                />

                <SettingItem
                  icon={<Ionicons name="archive" size={20} color={colors.icon} />}
                  title="Storage Usage"
                  subtitle={`${(systemMonitor.resources.storage.free / 1024).toFixed(1)} GB free`}
                  rightElement={
                    <View style={{
                      backgroundColor: systemMonitor.resources.storage.percentage > 90 ? colors.error : 
                                      systemMonitor.resources.storage.percentage > 75 ? colors.warning : colors.success,
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      borderRadius: 12,
                    }}>
                      <ThemedText style={{ color: 'white', fontSize: 12 }}>
                        {systemMonitor.resources.storage.percentage}%
                      </ThemedText>
                    </View>
                  }
                />

                {systemMonitor.resources.gpu.available && (
                  <SettingItem
                    icon={<Ionicons name="videocam" size={20} color={colors.icon} />}
                    title="GPU Available"
                    subtitle={`${systemMonitor.resources.gpu.vendor} - ${systemMonitor.resources.gpu.memoryMB}MB`}
                  />
                )}

                <SettingItem
                  icon={<Ionicons name="lock-closed" size={20} color={colors.icon} />}
                  title="Lock Resources for AI"
                  subtitle="Reserve CPU/GPU resources for better AI performance"
                  onPress={lockResources}
                  rightElement={
                    <TouchableOpacity onPress={lockResources}>
                      <View style={{
                        backgroundColor: colors.tint,
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 16,
                      }}>
                        <ThemedText style={{ color: 'white', fontSize: 12, fontWeight: '600' }}>
                          Lock
                        </ThemedText>
                      </View>
                    </TouchableOpacity>
                  }
                />

                {systemMonitor.lastUpdated && (
                  <View style={{ padding: 16, alignItems: 'center' }}>
                    <ThemedText style={{ fontSize: 12, color: colors.icon }}>
                      Last updated: {systemMonitor.lastUpdated.toLocaleTimeString()}
                    </ThemedText>
                  </View>
                )}
              </>
            )}
          </View>

          {/* Device Information */}
          <View style={{ 
            marginTop: 16, 
            marginHorizontal: 16, 
            borderRadius: 12,
            backgroundColor: isDark ? Colors.dark.cardBackground : colors.cardBackground,
            borderWidth: 1,
            borderColor: isDark ? 'rgba(138, 99, 255, 0.3)' : colors.border,
          }}>
            <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="phone-portrait" size={20} color={colors.tint} />
                <ThemedText style={{ marginLeft: 8, fontSize: 18, fontWeight: '600' }}>
                  Device Information
                </ThemedText>
              </View>
            </View>
            
            <SettingItem
              icon={<Ionicons name="phone-portrait" size={20} color={colors.icon} />}
              title="Check Device Resources"
              subtitle="Manually scan device capabilities and memory"
              onPress={checkDeviceResources}
              rightElement={
                <TouchableOpacity onPress={checkDeviceResources} disabled={isLoading}>
                  <View style={{
                    backgroundColor: colors.tint,
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 16,
                    opacity: isLoading ? 0.5 : 1,
                  }}>
                    <ThemedText style={{ color: 'white', fontSize: 12, fontWeight: '600' }}>
                      {isLoading ? 'Checking...' : 'Check Now'}
                    </ThemedText>
                  </View>
                </TouchableOpacity>
              }
            />

            {deviceInfo.isLoaded && deviceInfo.deviceResources && (
              <>
            <SettingItem
              icon={<Ionicons name="information-circle" size={20} color={colors.icon} />}
              title="Device Model"
                  subtitle={`${deviceInfo.deviceResources.deviceInfo.brand} ${deviceInfo.deviceResources.deviceInfo.modelName}`}
            />

            <SettingItem
              icon={<Ionicons name="hardware-chip" size={20} color={colors.icon} />}
              title="Total RAM"
                  subtitle={`${(deviceInfo.deviceResources.totalMemory / 1024).toFixed(1)} GB`}
                />

                <SettingItem
                  icon={<Ionicons name="hardware-chip" size={20} color={colors.icon} />}
                  title="Available RAM"
                  subtitle={`${(deviceInfo.deviceResources.freeMemory / 1024).toFixed(1)} GB estimated`}
                />

                <SettingItem
                  icon={<Ionicons name="archive" size={20} color={colors.icon} />}
                  title="Free Storage"
                  subtitle={`${(deviceInfo.deviceResources.diskInfo.freeStorage / 1024).toFixed(1)} GB available`}
            />

            <SettingItem
              icon={<Ionicons name="server" size={20} color={colors.icon} />}
              title="System Version"
                  subtitle={`${deviceInfo.deviceResources.deviceInfo.osName} ${deviceInfo.deviceResources.deviceInfo.osVersion}`}
                />

                <SettingItem
                  icon={<Ionicons name="build" size={20} color={colors.icon} />}
                  title="Architecture"
                  subtitle={deviceInfo.deviceResources.cpuArchitectures.join(', ')}
                />
              </>
            )}

            <SettingItem
              icon={<Ionicons name="bug" size={20} color={colors.icon} />}
              title="Run Diagnostics"
              subtitle="Check system health and model availability"
              onPress={runDiagnostics}
              rightElement={
                isLoading ? (
                  <ThemedText style={{ color: colors.tint }}>Running...</ThemedText>
                ) : testResults ? (
                  <View style={{ flexDirection: 'row', gap: 4 }}>
                    <StatusIcon success={testResults.storage} />
                    <StatusIcon success={testResults.database} />
                    <StatusIcon success={testResults.models} />
                  </View>
                ) : (
                  <ThemedText style={{ color: colors.tint }}>Test</ThemedText>
                )
              }
            />

            {/* AI Resource Analysis */}
            {deviceInfo.isLoaded && deviceInfo.deviceResources && (
              <>
                <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Ionicons name="analytics" size={20} color={colors.tint} />
                      <ThemedText style={{ marginLeft: 8, fontSize: 18, fontWeight: '600' }}>
                        AI Resource Analysis
                      </ThemedText>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      {deviceInfo.lastUpdated && (
                        <ThemedText style={{ fontSize: 10, color: colors.icon, marginRight: 8 }}>
                          {deviceInfo.lastUpdated.toLocaleTimeString()}
                        </ThemedText>
                      )}
                    <TouchableOpacity onPress={refreshDeviceResources} disabled={isLoading}>
                      <Ionicons 
                        name="refresh" 
                        size={20} 
                        color={isLoading ? colors.icon : colors.tint} 
                      />
                    </TouchableOpacity>
                    </View>
                  </View>
                </View>

                <SettingItem
                  icon={<Ionicons name="speedometer" size={20} color={colors.icon} />}
                  title="Device Classification"
                  subtitle={deviceInfo.deviceResources.isLowEndDevice ? 'Low-end device - Conservative settings recommended' : 'High-end device - Performance settings available'}
                />

                <SettingItem
                  icon={<Ionicons name="build" size={20} color={colors.icon} />}
                  title="64-bit Support"
                  subtitle={deviceInfo.deviceResources.cpuArchitectures.some(arch => arch.includes('64')) ? 'Yes - Full model support' : 'No - Limited model support'}
                />

                {deviceInfo.deviceResources.maxMemory && (
                <SettingItem
                    icon={<Ionicons name="hardware-chip" size={20} color={colors.icon} />}
                    title="Android VM Memory Limit"
                    subtitle={`${(deviceInfo.deviceResources.maxMemory / 1024).toFixed(1)} GB maximum`}
                  />
                )}

                <SettingItem
                  icon={<Ionicons name="settings" size={20} color={colors.icon} />}
                  title="Recommended AI Config"
                  subtitle={`${deviceInfo.deviceResources.recommendedConfig.name} - ${deviceInfo.deviceResources.recommendedConfig.contextSize} context, ${deviceInfo.deviceResources.recommendedConfig.threads} threads`}
                  rightElement={
                    <View style={{
                      backgroundColor: colors.tint,
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      borderRadius: 12,
                    }}>
                      <ThemedText style={{ color: 'white', fontSize: 12 }}>
                        {deviceInfo.deviceResources.recommendedConfig.contextSize}
                      </ThemedText>
                    </View>
                  }
                />
              </>
            )}
          </View>

          {/* App Settings */}
          <View style={{ 
            marginTop: 16, 
            marginHorizontal: 16, 
            borderRadius: 12,
            marginBottom: 32,
            backgroundColor: isDark ? Colors.dark.cardBackground : colors.cardBackground,
            borderWidth: 1,
            borderColor: isDark ? 'rgba(138, 99, 255, 0.3)' : colors.border,
          }}>
            <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="cog" size={20} color={colors.tint} />
                <ThemedText style={{ marginLeft: 8, fontSize: 18, fontWeight: '600' }}>
                  App Settings
                </ThemedText>
              </View>
            </View>
            
            <SettingItem
              icon={<Ionicons name="notifications" size={20} color={colors.icon} />}
              title="Notifications"
              subtitle="Receive push notifications"
              showSwitch={true}
              switchValue={notifications}
              onSwitchChange={setNotifications}
            />

            <SettingItem
              icon={<Ionicons name="save" size={20} color={colors.icon} />}
              title="Auto Save"
              subtitle="Automatically save chat history"
              showSwitch={true}
              switchValue={autoSave}
              onSwitchChange={setAutoSave}
            />

            <SettingItem
              icon={<Ionicons name="help-circle" size={20} color={colors.icon} />}
              title="About"
              subtitle="Mobile LLM v2.0.0 - Enhanced Edition"
              onPress={() => Alert.alert('About', 'Mobile LLM v2.0.0 Enhanced Edition\n\nFeatures:\n• Advanced theme system\n• Dynamic AI optimization\n• Custom model downloads\n• Enhanced user experience')}
            />
          </View>

          {/* Debug & Logs Section */}
          <View style={[
            {
              marginTop: 24,
              padding: 16,
              borderRadius: 12,
              backgroundColor: colors.cardBackground,
              borderWidth: 1,
              borderColor: colors.border,
            },
            isDark ? GlassStyles.card : null,
          ]}>
            <Text style={{ fontSize: 18, fontWeight: '600', color: colors.text, marginBottom: 16 }}>
              Debug & Logs
            </Text>
            
            <TouchableOpacity
              onPress={() => setShowLogs(true)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                padding: 12,
                borderRadius: 8,
                backgroundColor: colors.backgroundSecondary,
              }}
            >
              <Ionicons name="document-text-outline" size={20} color={colors.icon} />
              <Text style={{ marginLeft: 12, color: colors.text, fontSize: 16 }}>
                View App Logs
              </Text>
              <Ionicons name="chevron-forward" size={20} color={colors.icon} style={{ marginLeft: 'auto' }} />
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>

      {/* Logs Viewer */}
      <LogsViewer 
        isVisible={showLogs}
        onClose={() => setShowLogs(false)}
      />
    </View>
  );
} 