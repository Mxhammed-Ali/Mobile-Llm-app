import React, { useEffect, useState, useMemo } from 'react';
import { NavigationContainer, DefaultTheme as NavigationDefaultTheme, DarkTheme as NavigationDarkTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { View, Alert, AppState } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { loadModel } from './llama/llama.config';
import { LlamaContext } from 'llama.rn';

// ChatScreen removed; using ModernChatScreenWrapper instead
import { ModernChatScreen } from './components/ModernChatScreen';
import SettingsScreen from './app/settings';
import { useTheme } from './contexts/ThemeContext';
import { Gradients, Colors } from './constants/Colors';
import ModelStorage from './utils/modelStorage';
import { ModelManagerService } from './services/ModelManagerService';
import { eventBus } from './utils/eventBus';
import { ChatProvider } from './contexts/ChatContext';
import { logger } from './utils/logger';
// LiquidGlassBackground removed - focusing on light/dark themes only
import { ThemeProvider } from './contexts/ThemeContext';

const Tab = createBottomTabNavigator();

// Create a wrapper component for Modern ChatScreen
const ModernChatScreenWrapper = ({ context, loading, status, downloadProgress, downloadModel, downloadFreshModel }: any) => {
  return (
    <ModernChatScreen 
      context={context} 
      loading={loading}
      status={status}
      downloadProgress={downloadProgress}
      onLoadModel={downloadModel}
      onReloadModel={downloadFreshModel}
    />
  );
};

const downloadLink = "https://huggingface.co/TheBloke/TinyLlama-1.1B-Chat-v1.0-GGUF/resolve/main/tinyllama-1.1b-chat-v1.0.Q2_K.gguf";

export default function App() {
  const { colorScheme, isSystemTheme } = useTheme();
  const [context, setContext] = useState<LlamaContext | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('Ready to load model');
  const [downloadProgress, setDownloadProgress] = useState(0);
  
  // Force save theme when app goes to background
  useEffect(() => {
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        logger.info('📱 App going to background - ensuring theme is saved');
        // Force save current theme state
        AsyncStorage.setItem('user_theme_preference', colorScheme);
        AsyncStorage.setItem('user_theme_preference_system', isSystemTheme.toString());
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [colorScheme, isSystemTheme]);

  // Track ongoing operations to prevent multiple simultaneous calls
  const [isDownloading, setIsDownloading] = useState(false);
  const [isLoadingModel, setIsLoadingModel] = useState(false);
  
  // Simple dark mode check
  const isDark = colorScheme === 'dark';
  


  // Test AsyncStorage
  useEffect(() => {
    const testAsyncStorage = async () => {
      try {
        await AsyncStorage.setItem('test', 'working');
        const result = await AsyncStorage.getItem('test');
        logger.info('AsyncStorage test:', result);
        if (result !== 'working') {
          throw new Error('AsyncStorage not working properly');
        }
      } catch (error) {
        logger.error('AsyncStorage test failed:', error);
        Alert.alert('Error', 'AsyncStorage is not working. Please use a development build.');
      }
    };
    testAsyncStorage();
  }, []);

  // Monitor state changes
  useEffect(() => {
    logger.debug('App state changed:', { context: !!context, loading, status });
  }, [context, loading, status]);

  // Ensure logs appear in Settings LogsViewer by intercepting console
  useEffect(() => {
    try { logger.attachConsoleInterceptor(); } catch {}
  }, []);

  const downloadResumable = FileSystem.createDownloadResumable(
    downloadLink,
    FileSystem.documentDirectory + "model.gguf",
    {},
    (progress: any) => {
      const progressPercent = (progress.totalBytesWritten / progress.totalBytesExpectedToWrite) * 100;
      setDownloadProgress(progressPercent);
      setStatus(`Downloading TinyLlama: ${progressPercent.toFixed(1)}%`);
      logger.debug("downloading", progress);
    },
  );

  const downloadFreshModel = async () => {
    logger.info('downloadFreshModel function called');
    
    // Prevent multiple simultaneous downloads
    if (isDownloading) {
      logger.warn('⚠️ Download already in progress, ignoring request');
      return;
    }
    
    try {
      setIsDownloading(true);
      setStatus("Deleting existing model...");
      const modelPath = FileSystem.documentDirectory + "model.gguf";
      
      // Delete existing model
      try {
        await FileSystem.deleteAsync(modelPath);
        logger.info('✅ Deleted existing model file');
      } catch (deleteError) {
        logger.error('❌ Failed to delete model file:', deleteError);
      }
      
      // Download fresh model
      logger.info('📥 Starting fresh TinyLlama download...');
      setStatus("Starting TinyLlama download...");
      setLoading(true);
      
      const res = await downloadResumable.downloadAsync();
      logger.info("✅ Finished downloading to ", res?.uri);

      if (!res?.uri) {
        logger.error("❌ Download failed - no URI returned");
        setStatus("Download failed");
        Alert.alert("Download Error", "Failed to download TinyLlama model. Please check your internet connection and try again.");
        setLoading(false);
        return;
      }

      // Verify the downloaded file
      const downloadedFileInfo = await FileSystem.getInfoAsync(res.uri);
      logger.info('📊 Downloaded file info:', {
        exists: downloadedFileInfo.exists,
        size: downloadedFileInfo.exists && 'size' in downloadedFileInfo ? downloadedFileInfo.size : 0,
        uri: res.uri
      });

      if (!downloadedFileInfo.exists || (downloadedFileInfo.exists && 'size' in downloadedFileInfo && downloadedFileInfo.size === 0)) {
        throw new Error('Downloaded file is invalid or empty');
      }

      // Add to ModelStorage
      const modelStorage = ModelStorage.getInstance();
      await modelStorage.addDownloadedModel({
        id: 'tinyllama',
        name: 'TinyLlama Q2_K',
        filePath: res.uri,
        size: downloadedFileInfo.exists && 'size' in downloadedFileInfo ? downloadedFileInfo.size : 0,
        downloadDate: new Date().toISOString()
      });

      // Try to load the downloaded model
      setStatus("Loading TinyLlama model...");
      try {
        const context = await loadModel(res.uri);
        logger.info('✅ Model loaded successfully:', !!context);
        logger.debug('✅ Context details:', context);
        logger.debug('Setting context to:', context);
        setContext(context);
        setLoading(false);
        setStatus("TinyLlama Ready!");
        logger.debug('Context set, loading set to false');
      } catch (loadError: any) {
        logger.error('❌ Failed to load downloaded model:', loadError);
        setStatus("Model loading failed");
        Alert.alert("Model Error", "Failed to load model. The model might be too large for this device.");
        setLoading(false);
      }
    } catch (error: any) {
      logger.error("❌ Download error:", error);
      setStatus("Download failed");
      Alert.alert("Error", "Download failed. Please check your internet connection and try again.");
      setLoading(false);
    } finally {
      setIsDownloading(false);
    }
  };

  const downloadModel = async () => {
    logger.info('downloadModel function called');
    
    // Prevent multiple simultaneous operations
    if (isDownloading || isLoadingModel) {
      logger.warn('⚠️ Model operation already in progress, ignoring request');
      return;
    }
    
    try {
      setIsLoadingModel(true);
      setStatus("Checking active model...");
      const modelManager = ModelManagerService.getInstance();
      const activeModel = await modelManager.getActiveModel();
      const modelPath = activeModel?.filePath || (FileSystem.documentDirectory + "model.gguf");
      logger.info('🔍 Loading active model at:', modelPath, 'active:', !!activeModel);

      const isExists = (await FileSystem.getInfoAsync(modelPath)).exists;

      if (isExists) {
        logger.info('📁 Model file found');
        setStatus("Loading model...");
        setLoading(true);
        
        try {
          const context = await loadModel(modelPath);
          logger.info('✅ Existing model loaded successfully:', !!context);
          setContext(context);
          setLoading(false);
          setStatus("Model Ready!");
          return;
        } catch (loadError: any) {
          logger.error('❌ Failed to load existing model:', loadError);
          setStatus("Failed to load model");
          setLoading(false);
          
          // Ask user if they want to download fresh model
          Alert.alert(
            "Model Load Failed", 
            "Failed to load model. Would you like to download a fresh TinyLlama?",
            [
              { text: "Cancel", style: "cancel" },
              { text: "Download Fresh", onPress: () => downloadFreshModel() }
            ]
          );
          return;
        }
      }

      logger.info('📥 Starting fresh TinyLlama download...');
      setStatus("Starting TinyLlama download...");
      setLoading(true);
      
      const res = await downloadResumable.downloadAsync();
      logger.info("✅ Finished downloading to ", res?.uri);

      if (!res?.uri) {
        logger.error("❌ Download failed - no URI returned");
        setStatus("Download failed");
        Alert.alert("Download Error", "Failed to download TinyLlama model. Please check your internet connection and try again.");
        setLoading(false);
        return;
      }

      // Verify the downloaded file
      const downloadedFileInfo = await FileSystem.getInfoAsync(res.uri);
      logger.info('📊 Downloaded file info:', {
        exists: downloadedFileInfo.exists,
        size: downloadedFileInfo.exists && 'size' in downloadedFileInfo ? downloadedFileInfo.size : 0,
        uri: res.uri
      });

      if (!downloadedFileInfo.exists || (downloadedFileInfo.exists && 'size' in downloadedFileInfo && downloadedFileInfo.size === 0)) {
        throw new Error('Downloaded file is invalid or empty');
      }

      // Add to ModelStorage
      const modelStorage = ModelStorage.getInstance();
      await modelStorage.addDownloadedModel({
        id: 'tinyllama',
        name: 'TinyLlama Q2_K',
        filePath: res.uri,
        size: downloadedFileInfo.exists && 'size' in downloadedFileInfo ? downloadedFileInfo.size : 0,
        downloadDate: new Date().toISOString()
      });

      // Try to load the downloaded model
      setStatus("Loading TinyLlama model...");
      try {
        const context = await loadModel(res.uri);
        logger.info('✅ Model loaded successfully:', !!context);
        logger.debug('✅ Context details:', context);
        logger.debug('Setting context to:', context);
        setContext(context);
        setLoading(false);
        setStatus("Model Ready!");
        logger.debug('Context set, loading set to false');
      } catch (loadError: any) {
        logger.error('❌ Failed to load downloaded model:', loadError);
        setStatus("Model loading failed");
        Alert.alert("Model Error", "Failed to load model. The model might be too large for this device.");
        setLoading(false);
      }
    } catch (error: any) {
      logger.error("❌ Download error:", error);
      setStatus("Download failed");
      Alert.alert("Error", "Download failed. Please check your internet connection and try again.");
      setLoading(false);
    } finally {
      setIsLoadingModel(false);
    }
  };

  // React to runtime model changes (activation) and system setting changes
  useEffect(() => {
    const offModel = eventBus.on('model:changed', async () => {
      // Reload active model
      setStatus('Switching model...');
      // Free previous context to reduce memory pressure before loading a bigger model
      if (context) {
        setContext(null);
      }
      // Give JS a moment to release the old context and try GC before loading a larger model
      try { (global as any).gc?.(); } catch {}
      await new Promise(resolve => setTimeout(resolve, 250));
      await downloadModel();
    });
    const offSettings = eventBus.on('settings:changed', async () => {
      // Reinitialize model with new init params
      if (context) {
        setContext(null);
      }
      setStatus('Applying new settings...');
      await downloadModel();
    });
    return () => {
      offModel();
      offSettings();
    };
  }, [context]);

  const renderBackground = useMemo(() => {
    if (isDark) {
      return (
        <LinearGradient
          colors={Gradients.dark.primaryBackground as any}
          locations={[0, 0.5, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 0,
            bottom: 0,
          }}
        />
      );
    }
    
    return null;
  }, [isDark]);

  return (
    <ThemeProvider>
      <ChatProvider>
        <SafeAreaProvider>
          <View style={{ flex: 1 }}>
            {renderBackground}
            <NavigationContainer
              theme={isDark
                ? {
                    ...NavigationDarkTheme,
                    colors: {
                      ...NavigationDarkTheme.colors,
                      background: Colors.dark.background,
                      card: Colors.dark.cardBackground,
                      text: Colors.dark.text,
                      border: Colors.dark.border as string,
                    },
                  }
                : {
                    ...NavigationDefaultTheme,
                    colors: {
                      ...NavigationDefaultTheme.colors,
                      background: Colors.light.background,
                      card: Colors.light.cardBackground,
                      text: Colors.light.text,
                      border: Colors.light.border,
                    },
                  }
              }
            >
              <Tab.Navigator
                id={undefined}
                screenOptions={({ route }: any) => ({
                  tabBarIcon: ({ focused, color, size }: any) => {
                    let iconName: keyof typeof Ionicons.glyphMap;

                    if (route.name === 'Chat') {
                      iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
                    } else if (route.name === 'Settings') {
                      iconName = focused ? 'settings' : 'settings-outline';
                    } else {
                      iconName = 'help-outline';
                    }

                    return <Ionicons name={iconName} size={size} color={color} />;
                  },
                  // Hide the tab bar when the keyboard is open
                  tabBarHideOnKeyboard: true,
                  tabBarActiveTintColor: isDark ? Colors.dark.tabIconSelected : Colors.light.tabIconSelected,
                  tabBarInactiveTintColor: isDark ? Colors.dark.tabIconDefault : Colors.light.tabIconDefault,
                  tabBarStyle: {
                    backgroundColor: isDark ? Colors.dark.backgroundSecondary : Colors.light.background,
                    borderTopWidth: 1,
                    borderTopColor: isDark ? (Colors.dark.border as string) : Colors.light.border,
                    height: 64,
                    paddingBottom: 10,
                    paddingTop: 8,
                  },
                  // Ensure each screen uses the proper background color
                  sceneContainerStyle: {
                    backgroundColor: isDark ? Colors.dark.background : Colors.light.background,
                  },
                  headerShown: false,
                })}
              >
                <Tab.Screen 
                  name="Chat" 
                  options={{ title: 'Mobile LLM Chat' }}
                >
                  {() => (
                    <ModernChatScreenWrapper 
                      context={context} 
                      loading={loading}
                      status={status}
                      downloadProgress={downloadProgress}
                      downloadModel={downloadModel}
                      downloadFreshModel={downloadFreshModel}
                    />
                  )}
                </Tab.Screen>
                <Tab.Screen 
                  name="Settings" 
                  component={SettingsScreen}
                  options={{ title: 'Enhanced Settings' }}
                />
              </Tab.Navigator>
            </NavigationContainer>
          </View>
        </SafeAreaProvider>
      </ChatProvider>
    </ThemeProvider>
  );
} 