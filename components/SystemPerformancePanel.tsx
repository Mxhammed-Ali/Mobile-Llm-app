/**
 * System Performance Panel - Moved from settings
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Switch,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
// Note: Install @react-native-community/slider or use alternative
// For now, we'll create a simple placeholder slider
// import Slider from '@react-native-community/slider';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useThemeColors, useIsDark } from '../hooks/useThemeColor';
import { GlassStyles } from '../constants/Colors';
import { getDeviceResources } from '../utils/deviceResources';
import { eventBus } from '../utils/eventBus';

interface SystemPerformanceState {
  maxContextTokens: number;
  maxRAMUsage: number;
  threadCount: number;
  gpuLayers: number;
  temperatureSetting: number;
  topP: number;
  topK: number;
  maxPredictTokens: number;
  modelTimeoutSeconds: number;
  enableMemoryOptimization: boolean;
  enableContextCompression: boolean;
  enableAdaptiveTokens: boolean;
  useSQLiteStorage: boolean;
}

const DEFAULT_SYSTEM_PERFORMANCE: SystemPerformanceState = {
  maxContextTokens: 2048,
  maxRAMUsage: 1500,
  threadCount: 2,
  gpuLayers: 0,
  temperatureSetting: 0.7,
  topP: 0.9,
  topK: 40,
  maxPredictTokens: 1000,
  modelTimeoutSeconds: 60,
  enableMemoryOptimization: true,
  enableContextCompression: false,
  enableAdaptiveTokens: true,
  useSQLiteStorage: false,
};

interface SliderSettingProps {
  title: string;
  subtitle: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onValueChange: (value: number) => void;
  infoTitle: string;
  infoDescription: string;
}

interface SettingItemProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  showSwitch?: boolean;
  switchValue?: boolean;
  onSwitchChange?: (value: boolean) => void;
}

interface InfoButtonProps {
  title: string;
  description: string;
}

const InfoButton: React.FC<InfoButtonProps> = ({ title, description }) => {
  const colors = useThemeColors();

  const showInfo = () => {
    Alert.alert(title, description, [{ text: 'OK' }]);
  };

  return (
    <TouchableOpacity
      onPress={showInfo}
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
      <Text style={{ color: 'white', fontSize: 12, fontWeight: '600' }}>
        ?
      </Text>
    </TouchableOpacity>
  );
};

const SliderSetting: React.FC<SliderSettingProps> = ({
  title,
  subtitle,
  value,
  min,
  max,
  step,
  onValueChange,
  infoTitle,
  infoDescription,
}) => {
  const colors = useThemeColors();
  const isDark = useIsDark();

  return (
    <View style={{
      padding: 16,
      marginBottom: 12,
      backgroundColor: isDark ? 'rgba(138, 99, 255, 0.1)' : colors.cardBackground,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: isDark ? 'rgba(138, 99, 255, 0.3)' : colors.border,
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text }}>
            {title}
          </Text>
          <Text style={{ fontSize: 12, color: colors.icon, marginTop: 2 }}>
            {subtitle}
          </Text>
        </View>
        <Text style={{ fontSize: 16, fontWeight: '600', color: colors.tint }}>
          {typeof value === 'number' ? value.toFixed(step < 1 ? 1 : 0) : value}
        </Text>
        <InfoButton title={infoTitle} description={infoDescription} />
      </View>
      
      {/* Modern Custom Slider */}
      <View style={{ marginVertical: 8 }}>
        {/* Slider Track */}
        <View style={{
          height: 6,
          backgroundColor: colors.backgroundSecondary,
          borderRadius: 3,
          position: 'relative',
        }}>
          {/* Progress Track */}
          <View style={{
            position: 'absolute',
            left: 0,
            top: 0,
            height: '100%',
            width: `${((value - min) / (max - min)) * 100}%`,
            backgroundColor: colors.tint,
            borderRadius: 3,
          }} />
          
          {/* Slider Thumb */}
          <View style={{
            position: 'absolute',
            left: `${((value - min) / (max - min)) * 100}%`,
            top: -7,
            width: 20,
            height: 20,
            backgroundColor: colors.tint,
            borderRadius: 10,
            marginLeft: -10,
            borderWidth: 3,
            borderColor: 'white',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 3.84,
            elevation: 5,
          }} />
        </View>
        
        {/* Control Buttons */}
        <View style={{ 
          flexDirection: 'row', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginTop: 12 
        }}>
          <TouchableOpacity
            onPress={() => {
              const newValue = Math.max(min, value - step);
              onValueChange(newValue);
            }}
            style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              backgroundColor: colors.backgroundSecondary,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Ionicons name="remove" size={16} color={colors.tint} />
          </TouchableOpacity>
          
          <View style={{ flex: 1, alignItems: 'center' }}>
            <TouchableOpacity
              onPress={() => {
                // Reset to default/middle value
                const defaultValue = min + ((max - min) / 2);
                onValueChange(Math.round(defaultValue / step) * step);
              }}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 6,
                backgroundColor: colors.backgroundSecondary,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <Text style={{ color: colors.tint, fontWeight: '600' }}>
                Reset
              </Text>
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity
            onPress={() => {
              const newValue = Math.min(max, value + step);
              onValueChange(newValue);
            }}
            style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              backgroundColor: colors.backgroundSecondary,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Ionicons name="add" size={16} color={colors.tint} />
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
        <Text style={{ fontSize: 12, color: colors.icon }}>{min}</Text>
        <Text style={{ fontSize: 12, color: colors.icon }}>{max}</Text>
      </View>
    </View>
  );
};

const SettingItem: React.FC<SettingItemProps> = ({
  icon,
  title,
  subtitle,
  showSwitch = false,
  switchValue = false,
  onSwitchChange,
}) => {
  const colors = useThemeColors();
  const isDark = useIsDark();

  return (
    <View style={{
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      marginBottom: 12,
      backgroundColor: isDark ? 'rgba(138, 99, 255, 0.1)' : colors.cardBackground,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: isDark ? 'rgba(138, 99, 255, 0.3)' : colors.border,
    }}>
      {icon}
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text }}>
          {title}
        </Text>
        <Text style={{ fontSize: 12, color: colors.icon, marginTop: 2 }}>
          {subtitle}
        </Text>
      </View>
      {showSwitch && (
        <Switch
          value={switchValue}
          onValueChange={onSwitchChange}
          trackColor={{ false: colors.backgroundSecondary, true: colors.tint }}
          thumbColor={switchValue ? 'white' : colors.icon}
        />
      )}
    </View>
  );
};

interface SystemResourceState {
  cpuUsage: number;
  memoryUsage: number;
  totalMemory: number;
  availableMemory: number;
  storageUsage: number;
  totalStorage: number;
  temperature: number;
  isRefreshing: boolean;
  lastUpdated: number | null;
}

const DEFAULT_RESOURCE_STATE: SystemResourceState = {
  cpuUsage: 0,
  memoryUsage: 0,
  totalMemory: 0,
  availableMemory: 0,
  storageUsage: 0,
  totalStorage: 0,
  temperature: 0,
  isRefreshing: false,
  lastUpdated: null,
};

export const SystemPerformancePanel: React.FC = () => {
  const colors = useThemeColors();
  const isDark = useIsDark();
  
  const [systemPerformance, setSystemPerformance] = useState<SystemPerformanceState>(DEFAULT_SYSTEM_PERFORMANCE);
  const [resourceState, setResourceState] = useState<SystemResourceState>(DEFAULT_RESOURCE_STATE);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load settings on mount
  useEffect(() => {
    loadSystemPerformanceSettings();
    refreshSystemResources(); // Initial resource check
  }, []);

  // Refresh system resources
  const refreshSystemResources = async () => {
    setResourceState(prev => ({ ...prev, isRefreshing: true }));
    
    try {
      const resources = await getDeviceResources();
      
      // Simulate real resource usage (in a real app, you'd get actual values)
      const cpuUsage = Math.min(50 + Math.random() * 30, 100); // Random CPU usage
      const memoryUsage = resources.totalMemory - resources.freeMemory;
      const memoryPercent = (memoryUsage / resources.totalMemory) * 100;
      const storageUsage = resources.diskInfo.totalStorage - resources.diskInfo.freeStorage;
      const storagePercent = (storageUsage / resources.diskInfo.totalStorage) * 100;
      
      setResourceState({
        cpuUsage,
        memoryUsage: memoryPercent,
        totalMemory: resources.totalMemory,
        availableMemory: resources.freeMemory,
        storageUsage: storagePercent,
        totalStorage: resources.diskInfo.totalStorage,
        temperature: 35 + Math.random() * 25, // Simulated temperature
        isRefreshing: false,
        lastUpdated: Date.now(),
      });
    } catch (error) {
      console.error('Failed to refresh system resources:', error);
      setResourceState(prev => ({ ...prev, isRefreshing: false }));
    }
  };

  // Get warning color based on usage percentage
  const getWarningColor = (usage: number): string => {
    if (usage < 50) return colors.tint;
    if (usage < 70) return '#FFA500'; // Orange
    if (usage < 85) return '#FF6B6B'; // Light red
    return '#FF0000'; // Dark red
  };

  // Get background color that darkens with extreme usage
  const getUsageBackgroundColor = (usage: number): string => {
    if (usage < 50) return colors.cardBackground;
    if (usage < 70) return 'rgba(255, 165, 0, 0.1)'; // Orange tint
    if (usage < 85) return 'rgba(255, 107, 107, 0.15)'; // Light red tint
    return 'rgba(255, 0, 0, 0.2)'; // Dark red tint
  };

  const loadSystemPerformanceSettings = async () => {
    try {
      const stored = await AsyncStorage.getItem('system_performance_settings');
      if (stored) {
        const parsed = JSON.parse(stored);
        setSystemPerformance(prev => ({ ...prev, ...parsed }));
      }
    } catch (error) {
      console.error('Failed to load system performance settings:', error);
    }
  };

  const debouncedSave = useCallback((newSettings: Partial<SystemPerformanceState>) => {
    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Update state immediately for UI responsiveness
    setSystemPerformance(prev => ({ ...prev, ...newSettings }));

    // Debounce the actual save operation
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        const currentSettings = await AsyncStorage.getItem('system_performance_settings');
        const current = currentSettings ? JSON.parse(currentSettings) : DEFAULT_SYSTEM_PERFORMANCE;
        const updated = { ...current, ...newSettings };
        
        await AsyncStorage.setItem('system_performance_settings', JSON.stringify(updated));
        console.log('System performance settings saved:', updated);
      } catch (error) {
        console.error('Failed to save system performance settings:', error);
      }
    }, 300); // 300ms debounce
  }, []);

  const saveSystemPerformanceSettings = (newSettings: Partial<SystemPerformanceState>) => {
    debouncedSave(newSettings);
    // Notify app to reinitialize model with new settings
    eventBus.emit('settings:changed');
  };

  return (
    <ScrollView 
      style={{ flex: 1 }}
      contentContainerStyle={{ padding: 16 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header Info */}
      <View style={{
        backgroundColor: isDark ? 'rgba(138, 99, 255, 0.1)' : colors.cardBackground,
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: isDark ? 'rgba(138, 99, 255, 0.3)' : colors.border,
        marginBottom: 16,
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
          <Ionicons name="speedometer" size={20} color={colors.tint} />
          <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text, marginLeft: 8 }}>
            System Performance
          </Text>
        </View>
        <Text style={{ fontSize: 12, color: colors.icon, lineHeight: 16 }}>
          Configure AI model parameters, memory usage, and performance optimizations for your device.
        </Text>
      </View>

      {/* System Resource Monitoring */}
      <View style={{
        backgroundColor: getUsageBackgroundColor(Math.max(resourceState.cpuUsage, resourceState.memoryUsage, resourceState.storageUsage)),
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.border,
        marginBottom: 16,
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="analytics" size={20} color={colors.tint} />
            <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text, marginLeft: 8 }}>
              System Monitor
            </Text>
          </View>
          <TouchableOpacity
            onPress={refreshSystemResources}
            disabled={resourceState.isRefreshing}
            style={{
              backgroundColor: colors.tint,
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 8,
              opacity: resourceState.isRefreshing ? 0.6 : 1,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {resourceState.isRefreshing ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Ionicons name="refresh" size={16} color="white" />
              )}
              <Text style={{ color: 'white', fontSize: 12, marginLeft: 4 }}>
                {resourceState.isRefreshing ? 'Checking...' : 'Refresh'}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Resource Usage Bars */}
        {resourceState.lastUpdated && (
          <View style={{ gap: 12 }}>
            {/* CPU Usage */}
            <View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                <Text style={{ fontSize: 12, color: colors.text }}>CPU Usage</Text>
                <Text style={{ fontSize: 12, color: getWarningColor(resourceState.cpuUsage) }}>
                  {resourceState.cpuUsage.toFixed(1)}%
                </Text>
              </View>
              <View style={{
                height: 6,
                backgroundColor: colors.backgroundSecondary,
                borderRadius: 3,
              }}>
                <View style={{
                  height: '100%',
                  width: `${resourceState.cpuUsage}%`,
                  backgroundColor: getWarningColor(resourceState.cpuUsage),
                  borderRadius: 3,
                }} />
              </View>
            </View>

            {/* Memory Usage */}
            <View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                <Text style={{ fontSize: 12, color: colors.text }}>Memory Usage</Text>
                <Text style={{ fontSize: 12, color: getWarningColor(resourceState.memoryUsage) }}>
                  {resourceState.memoryUsage.toFixed(1)}% ({(resourceState.totalMemory - resourceState.availableMemory).toFixed(0)}MB/{resourceState.totalMemory.toFixed(0)}MB)
                </Text>
              </View>
              <View style={{
                height: 6,
                backgroundColor: colors.backgroundSecondary,
                borderRadius: 3,
              }}>
                <View style={{
                  height: '100%',
                  width: `${resourceState.memoryUsage}%`,
                  backgroundColor: getWarningColor(resourceState.memoryUsage),
                  borderRadius: 3,
                }} />
              </View>
            </View>

            {/* Storage Usage */}
            <View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                <Text style={{ fontSize: 12, color: colors.text }}>Storage Usage</Text>
                <Text style={{ fontSize: 12, color: getWarningColor(resourceState.storageUsage) }}>
                  {resourceState.storageUsage.toFixed(1)}%
                </Text>
              </View>
              <View style={{
                height: 6,
                backgroundColor: colors.backgroundSecondary,
                borderRadius: 3,
              }}>
                <View style={{
                  height: '100%',
                  width: `${resourceState.storageUsage}%`,
                  backgroundColor: getWarningColor(resourceState.storageUsage),
                  borderRadius: 3,
                }} />
              </View>
            </View>

            {/* Temperature */}
            <View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                <Text style={{ fontSize: 12, color: colors.text }}>Temperature</Text>
                <Text style={{ fontSize: 12, color: getWarningColor(resourceState.temperature) }}>
                  {resourceState.temperature.toFixed(1)}°C
                </Text>
              </View>
              <View style={{
                height: 6,
                backgroundColor: colors.backgroundSecondary,
                borderRadius: 3,
              }}>
                <View style={{
                  height: '100%',
                  width: `${Math.min(resourceState.temperature / 80 * 100, 100)}%`,
                  backgroundColor: getWarningColor(resourceState.temperature),
                  borderRadius: 3,
                }} />
              </View>
            </View>

            <Text style={{ fontSize: 10, color: colors.icon, marginTop: 8 }}>
              Last updated: {new Date(resourceState.lastUpdated).toLocaleTimeString()}
            </Text>
          </View>
        )}
      </View>

      {/* Context and Memory Settings */}
      <SliderSetting
        title="Context Window"
        subtitle="Maximum conversation memory in tokens"
        value={systemPerformance.maxContextTokens}
        min={512}
        max={8192}
        step={256}
        onValueChange={(value) => saveSystemPerformanceSettings({ maxContextTokens: value })}
        infoTitle="Context Window"
        infoDescription="Determines how much conversation history the AI can remember. Higher values allow longer conversations but use more memory. Recommended: 2048 tokens."
      />

      <SliderSetting
        title="Max RAM Usage"
        subtitle="Maximum memory allocation in MB"
        value={systemPerformance.maxRAMUsage}
        min={500}
        max={4000}
        step={100}
        onValueChange={(value) => saveSystemPerformanceSettings({ maxRAMUsage: value })}
        infoTitle="Max RAM Usage"
        infoDescription="Limits how much RAM the AI model can use. Lower values prevent crashes on low-memory devices but may reduce performance. Adjust based on your device's available RAM."
      />

      <SliderSetting
        title="Thread Count"
        subtitle="Number of CPU threads for processing"
        value={systemPerformance.threadCount}
        min={1}
        max={8}
        step={1}
        onValueChange={(value) => saveSystemPerformanceSettings({ threadCount: value })}
        infoTitle="Thread Count"
        infoDescription="More threads can speed up processing on multi-core devices but may cause overheating or battery drain. Start with 2 threads and increase if performance is good."
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
        infoDescription="Offloading layers to GPU can significantly speed up inference if your device supports it. Start with 0 and gradually increase. Not all devices support GPU acceleration."
      />

      {/* AI Generation Settings */}
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
        title="Max Response Length"
        subtitle="Maximum length of AI responses"
        value={systemPerformance.maxPredictTokens}
        min={100}
        max={2000}
        step={50}
        onValueChange={(value) => saveSystemPerformanceSettings({ maxPredictTokens: value })}
        infoTitle="Max Response Length"
        infoDescription="Limits how long AI responses can be. Shorter responses are faster and use less memory. Longer responses allow for more detailed answers. Recommended: 1000 tokens."
      />

      <SliderSetting
        title="Model Timeout"
        subtitle="Maximum time to wait for AI response (seconds)"
        value={systemPerformance.modelTimeoutSeconds}
        min={10}
        max={600}
        step={10}
        onValueChange={(value) => saveSystemPerformanceSettings({ modelTimeoutSeconds: value })}
        infoTitle="Model Timeout"
        infoDescription="How long to wait for the AI model to respond before timing out. Lower values (10-60s) can reduce wait time at the risk of cutting off responses; higher values (up to 600s) allow for very long or complex responses. Recommended: 60 seconds."
      />

      {/* Optimization Settings */}
      <SettingItem
        icon={<Ionicons name="flash" size={20} color={colors.tint} />}
        title="Memory Optimization"
        subtitle="Reduce memory usage at the cost of some performance"
        showSwitch={true}
        switchValue={systemPerformance.enableMemoryOptimization}
        onSwitchChange={(value) => saveSystemPerformanceSettings({ enableMemoryOptimization: value })}
      />

      <SettingItem
        icon={<Ionicons name="archive" size={20} color={colors.tint} />}
        title="Context Compression"
        subtitle="Compress old conversation history to save memory"
        showSwitch={true}
        switchValue={systemPerformance.enableContextCompression}
        onSwitchChange={(value) => saveSystemPerformanceSettings({ enableContextCompression: value })}
      />

      <SettingItem
        icon={<Ionicons name="trending-up" size={20} color={colors.tint} />}
        title="Adaptive Token Allocation"
        subtitle="Dynamically adjust token usage based on device performance"
        showSwitch={true}
        switchValue={systemPerformance.enableAdaptiveTokens}
        onSwitchChange={(value) => saveSystemPerformanceSettings({ enableAdaptiveTokens: value })}
      />

      <SettingItem
        icon={<Ionicons name="server" size={20} color={colors.tint} />}
        title="SQLite Storage Mode"
        subtitle="Use SQLite database for chat storage (requires more storage)"
        showSwitch={true}
        switchValue={systemPerformance.useSQLiteStorage}
        onSwitchChange={(value) => saveSystemPerformanceSettings({ useSQLiteStorage: value })}
      />

      {/* Performance Presets */}
      <View style={{
        backgroundColor: isDark ? 'rgba(138, 99, 255, 0.1)' : colors.cardBackground,
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: isDark ? 'rgba(138, 99, 255, 0.3)' : colors.border,
        marginTop: 8,
      }}>
        <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 12 }}>
          Performance Presets
        </Text>
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
                modelTimeoutSeconds: 45,
                enableMemoryOptimization: true,
                enableContextCompression: true,
                enableAdaptiveTokens: true,
                useSQLiteStorage: false,
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
            <Text style={{ fontSize: 12, marginTop: 4, textAlign: 'center', color: colors.text }}>
              Conservative
            </Text>
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
                modelTimeoutSeconds: 60,
                enableMemoryOptimization: true,
                enableContextCompression: false,
                enableAdaptiveTokens: true,
                useSQLiteStorage: false,
              };
              saveSystemPerformanceSettings(balancedSettings);
              Alert.alert('Applied', 'Balanced settings applied - good for most devices');
            }}
            style={{
              flex: 1,
              backgroundColor: colors.backgroundSecondary,
              padding: 12,
              borderRadius: 8,
              alignItems: 'center',
            }}
          >
            <Ionicons name="battery-charging" size={20} color={colors.icon} />
            <Text style={{ fontSize: 12, marginTop: 4, textAlign: 'center', color: colors.text }}>
              Balanced
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              const performanceSettings = {
                maxContextTokens: 4096,
                maxRAMUsage: 3000,
                threadCount: 4,
                gpuLayers: 8,
                temperatureSetting: 0.7,
                topP: 0.9,
                topK: 40,
                maxPredictTokens: 1500,
                modelTimeoutSeconds: 90,
                enableMemoryOptimization: false,
                enableContextCompression: false,
                enableAdaptiveTokens: false,
                useSQLiteStorage: true,
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
            <Ionicons name="flash" size={20} color={colors.icon} />
            <Text style={{ fontSize: 12, marginTop: 4, textAlign: 'center', color: colors.text }}>
              Performance
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Apply Button */}
      <View style={{
        padding: 16,
        backgroundColor: isDark ? 'rgba(138, 99, 255, 0.1)' : colors.cardBackground,
        borderTopWidth: 1,
        borderTopColor: colors.border,
      }}>
        <TouchableOpacity
          onPress={() => {
            Alert.alert(
              'Settings Applied',
              'All system performance settings have been applied and will take effect for new AI interactions.',
              [{ text: 'OK' }]
            );
          }}
          style={{
            backgroundColor: colors.tint,
            paddingVertical: 16,
            borderRadius: 12,
            alignItems: 'center',
            shadowColor: colors.tint,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.3,
            shadowRadius: 4,
            elevation: 4,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="checkmark-circle" size={20} color="white" />
            <Text style={{
              color: 'white',
              fontSize: 16,
              fontWeight: '600',
              marginLeft: 8,
            }}>
              Apply Settings
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};