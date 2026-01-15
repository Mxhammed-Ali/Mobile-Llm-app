import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as FileSystem from 'expo-file-system';

export interface DeviceResources {
  totalMemory: number; // in MB
  freeMemory: number; // in MB
  maxMemory?: number; // in MB (Android VM limit)
  cpuArchitectures: string[];
  isLowEndDevice: boolean;
  recommendedConfig: ModelConfig;
  diskInfo: {
    freeStorage: number; // in MB
    totalStorage: number; // in MB
  };
  deviceInfo: {
    brand: string;
    manufacturer: string;
    modelName: string;
    deviceYearClass: number | null;
    osName: string | null;
    osVersion: string | null;
    uptime: number; // in milliseconds
  };
}

export interface ModelConfig {
  contextSize: number;
  threads: number;
  gpuLayers: number;
  name: string;
}

// Timeout wrapper for async operations to prevent hanging promises
const withTimeout = <T>(promise: Promise<T>, timeoutMs: number = 5000): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => 
      setTimeout(() => reject(new Error('Operation timed out')), timeoutMs)
    )
  ]);
};

// Singleton to prevent multiple simultaneous device resource calls
let deviceResourcesPromise: Promise<DeviceResources> | null = null;
let lastCheckTimestamp = 0;
const CACHE_DURATION = 30000; // 30 seconds cache

async function _getDeviceResourcesInternal(): Promise<DeviceResources> {
  try {
    console.log('🔍 Detecting device resources using Expo modules...');
    
    // Get basic device information using expo-device with timeout protection
    let uptime = 0;
    try {
      uptime = await withTimeout(Device.getUptimeAsync(), 3000);
    } catch (error) {
      console.log('⚠️ Could not get device uptime, using default');
    }

    const deviceInfo = {
      brand: Device.brand || 'Unknown',
      manufacturer: Device.manufacturer || 'Unknown', 
      modelName: Device.modelName || 'Unknown',
      deviceYearClass: Device.deviceYearClass,
      osName: Device.osName,
      osVersion: Device.osVersion,
      uptime
    };

    console.log('📱 Device Info:', deviceInfo);

    // Get memory information
    let totalMemory = 4000; // Default 4GB in MB
    let maxMemory: number | undefined;
    let freeMemory = 2000; // Estimated free memory

    if (Device.totalMemory) {
      totalMemory = Math.round(Device.totalMemory / (1024 * 1024)); // Convert bytes to MB
      console.log('✅ Got total memory:', totalMemory, 'MB');
    } else {
      console.log('⚠️ Could not get total memory, using default:', totalMemory, 'MB');
    }

    // Get Android VM max memory with timeout protection
    if (Platform.OS === 'android') {
      try {
        const androidMaxMemory = await withTimeout(Device.getMaxMemoryAsync(), 3000);
        if (androidMaxMemory !== Number.MAX_SAFE_INTEGER) {
          maxMemory = Math.round(androidMaxMemory / (1024 * 1024)); // Convert to MB
          console.log('✅ Got Android max VM memory:', maxMemory, 'MB');
        }
      } catch (error: any) {
        console.log('⚠️ Could not get Android max memory:', error.message);
      }
    }

    // Get CPU architectures
    const cpuArchitectures = Device.supportedCpuArchitectures || ['unknown'];
    console.log('🏗️ CPU Architectures:', cpuArchitectures);

    // Estimate free memory (conservative: 50% of total)
    freeMemory = Math.round(totalMemory * 0.5);
    console.log('📊 Estimated free memory:', freeMemory, 'MB (50% of total)');

    // Get disk space information using expo-file-system
    let diskInfo = {
      freeStorage: 1000, // Default 1GB
      totalStorage: 32000 // Default 32GB
    };

    try {
      const [freeBytes, totalBytes] = await Promise.all([
        withTimeout(FileSystem.getFreeDiskStorageAsync(), 3000),
        withTimeout(FileSystem.getTotalDiskCapacityAsync(), 3000)
      ]);
      
      diskInfo = {
        freeStorage: Math.round(freeBytes / (1024 * 1024)), // Convert to MB
        totalStorage: Math.round(totalBytes / (1024 * 1024)) // Convert to MB
      };
      
      console.log('💾 Disk Info:', diskInfo);
    } catch (error: any) {
      console.log('⚠️ Could not get disk space info, using defaults:', error.message);
    }

    // Determine device capabilities
    const is64Bit = cpuArchitectures.some(arch => 
      arch.includes('64') || arch.includes('arm64') || arch.includes('x86_64')
    );
    
    // Estimate CPU count based on device year and architecture
    let estimatedCpuCores = 4; // Default
    if (deviceInfo.deviceYearClass) {
      if (deviceInfo.deviceYearClass < 2018) estimatedCpuCores = 2;
      else if (deviceInfo.deviceYearClass < 2020) estimatedCpuCores = 4;
      else estimatedCpuCores = 6;
    }

    // Determine if it's a low-end device
    const isLowEndDevice = totalMemory < 4000 || 
                          !is64Bit || 
                          (deviceInfo.deviceYearClass !== null && deviceInfo.deviceYearClass < 2019);

    // Recommend configuration based on device capabilities
    let recommendedConfig: ModelConfig;
    
    if (isLowEndDevice) {
      recommendedConfig = {
        name: 'Conservative (Low-end device)',
        contextSize: 1024,
        threads: Math.min(2, estimatedCpuCores),
        gpuLayers: 0
      };
    } else if (totalMemory < 6000) {
      recommendedConfig = {
        name: 'Balanced (Mid-range device)', 
        contextSize: 2048,
        threads: Math.min(4, estimatedCpuCores),
        gpuLayers: Platform.OS === 'ios' ? 4 : 0 // Try GPU on iOS
      };
    } else {
      recommendedConfig = {
        name: 'Performance (High-end device)',
        contextSize: 4096,
        threads: Math.min(6, estimatedCpuCores),
        gpuLayers: Platform.OS === 'ios' ? 8 : 0 // More GPU layers on iOS
      };
    }

    console.log('🎯 Recommended config:', recommendedConfig);
    console.log('🏷️ Device classification:', isLowEndDevice ? 'Low-end' : 'High-end');
    console.log('🔧 64-bit support:', is64Bit ? 'Yes' : 'No');

    return {
      totalMemory,
      freeMemory,
      maxMemory,
      cpuArchitectures,
      isLowEndDevice,
      recommendedConfig,
      diskInfo,
      deviceInfo
    };
    
  } catch (error) {
    console.error('❌ Error detecting device resources:', error);
    
    // Fallback to conservative settings
    return {
      totalMemory: 2000,
      freeMemory: 600,
      cpuArchitectures: ['unknown'],
      isLowEndDevice: true,
      recommendedConfig: {
        name: 'Fallback (Ultra Conservative)',
        contextSize: 512,
        threads: 1,
        gpuLayers: 0
      },
      diskInfo: {
        freeStorage: 1000,
        totalStorage: 16000
      },
      deviceInfo: {
        brand: 'Unknown',
        manufacturer: 'Unknown',
        modelName: 'Unknown',
        deviceYearClass: null,
        osName: Platform.OS,
        osVersion: 'Unknown',
        uptime: 0
      }
    };
  }
}

export async function getDeviceResources(forceRefresh: boolean = false): Promise<DeviceResources> {
  const now = Date.now();
  
  // Check if we have a recent cached result and no force refresh
  if (!forceRefresh && deviceResourcesPromise && (now - lastCheckTimestamp) < CACHE_DURATION) {
    console.log('📋 Using cached device resources');
    return deviceResourcesPromise;
  }

  // Check if there's already a pending request
  if (deviceResourcesPromise && (now - lastCheckTimestamp) < 5000) {
    console.log('⏳ Device resources check already in progress, waiting...');
    return deviceResourcesPromise;
  }

  // Start new device resources check
  console.log('🔄 Starting new device resources check');
  lastCheckTimestamp = now;
  
  deviceResourcesPromise = _getDeviceResourcesInternal()
    .finally(() => {
      // Clear the promise after completion (success or failure)
      setTimeout(() => {
        deviceResourcesPromise = null;
      }, 1000);
    });

  return deviceResourcesPromise;
}

export function getModelConfigsForDevice(resources: DeviceResources): ModelConfig[] {
  const { totalMemory, isLowEndDevice, cpuArchitectures } = resources;
  
  const is64Bit = cpuArchitectures.some(arch => 
    arch.includes('64') || arch.includes('arm64') || arch.includes('x86_64')
  );
  
  if (isLowEndDevice || !is64Bit) {
    return [
      {
        name: 'Ultra Conservative',
        contextSize: 512,
        threads: 1,
        gpuLayers: 0
      },
      {
        name: 'Conservative',
        contextSize: 1024,
        threads: 1,
        gpuLayers: 0
      },
      {
        name: 'Minimal',
        contextSize: 2048,
        threads: 2,
        gpuLayers: 0
      }
    ];
  } else if (totalMemory < 6000) {
    return [
      {
        name: 'Conservative',
        contextSize: 1024,
        threads: 2,
        gpuLayers: 0
      },
      {
        name: 'Balanced',
        contextSize: 2048,
        threads: 3,
        gpuLayers: Platform.OS === 'ios' ? 2 : 0
      },
      {
        name: 'Standard',
        contextSize: 4096,
        threads: 4,
        gpuLayers: Platform.OS === 'ios' ? 4 : 0
      }
    ];
  } else {
    return [
      {
        name: 'Balanced',
        contextSize: 2048,
        threads: 4,
        gpuLayers: Platform.OS === 'ios' ? 4 : 0
      },
      {
        name: 'Performance',
        contextSize: 4096,
        threads: 6,
        gpuLayers: Platform.OS === 'ios' ? 8 : 0
      },
      {
        name: 'High Performance',
        contextSize: 8192,
        threads: 8,
        gpuLayers: Platform.OS === 'ios' ? 12 : 0
      }
    ];
  }
} 