import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as FileSystem from 'expo-file-system';

export interface SystemResources {
  memory: {
    total: number;
    available: number;
    used: number;
    percentage: number;
  };
  storage: {
    total: number;
    free: number;
    used: number;
    percentage: number;
  };
  cpu: {
    cores: number;
    architecture: string[];
    usage?: number; // Estimated
  };
  gpu: {
    available: boolean;
    vendor?: string;
    renderer?: string;
    memoryMB?: number;
  };
  performance: {
    canLockCPU: boolean;
    canLockGPU: boolean;
    priority: 'high' | 'normal' | 'low';
  };
}

export interface ResourceLock {
  type: 'cpu' | 'gpu' | 'memory';
  isLocked: boolean;
  priority: number;
  timestamp: number;
}

class SystemMonitor {
  private static instance: SystemMonitor;
  private resourceLocks: Map<string, ResourceLock> = new Map();
  private monitoringInterval?: NodeJS.Timeout;
  private callbacks: ((resources: SystemResources) => void)[] = [];

  static getInstance(): SystemMonitor {
    if (!SystemMonitor.instance) {
      SystemMonitor.instance = new SystemMonitor();
    }
    return SystemMonitor.instance;
  }

  async getSystemResources(): Promise<SystemResources> {
    const [memoryInfo, storageInfo, cpuInfo, gpuInfo] = await Promise.all([
      this.getMemoryInfo(),
      this.getStorageInfo(),
      this.getCPUInfo(),
      this.getGPUInfo()
    ]);

    return {
      memory: memoryInfo,
      storage: storageInfo,
      cpu: cpuInfo,
      gpu: gpuInfo,
      performance: {
        canLockCPU: Platform.OS === 'android', // Android allows process priority
        canLockGPU: Platform.OS === 'ios', // iOS has better GPU control
        priority: this.getCurrentPriority()
      }
    };
  }

  private async getMemoryInfo() {
    try {
      const total = Device.totalMemory ? Math.round(Device.totalMemory / (1024 * 1024)) : 4000;
      
      // Estimate memory usage (this is approximate since we can't get exact free memory)
      let available = Math.round(total * 0.4); // Conservative estimate
      
      if (Platform.OS === 'android') {
        try {
          const maxMemory = await Device.getMaxMemoryAsync();
          if (maxMemory !== Number.MAX_SAFE_INTEGER) {
            const vmLimit = Math.round(maxMemory / (1024 * 1024));
            available = Math.min(available, vmLimit * 0.7);
          }
        } catch {}
      }

      const used = total - available;
      const percentage = (used / total) * 100;

      return {
        total,
        available,
        used,
        percentage: Math.round(percentage)
      };
    } catch (error) {
      console.error('Error getting memory info:', error);
      return {
        total: 4000,
        available: 1600,
        used: 2400,
        percentage: 60
      };
    }
  }

  private async getStorageInfo() {
    try {
      const [freeBytes, totalBytes] = await Promise.all([
        FileSystem.getFreeDiskStorageAsync(),
        FileSystem.getTotalDiskCapacityAsync()
      ]);

      const total = Math.round(totalBytes / (1024 * 1024));
      const free = Math.round(freeBytes / (1024 * 1024));
      const used = total - free;
      const percentage = (used / total) * 100;

      return {
        total,
        free,
        used,
        percentage: Math.round(percentage)
      };
    } catch (error) {
      console.error('Error getting storage info:', error);
      return {
        total: 32000,
        free: 16000,
        used: 16000,
        percentage: 50
      };
    }
  }

  private async getCPUInfo() {
    try {
      const architectures = Device.supportedCpuArchitectures || ['unknown'];
      
      // Estimate core count based on device year and architecture
      let cores = 4;
      if (Device.deviceYearClass) {
        if (Device.deviceYearClass < 2018) cores = 2;
        else if (Device.deviceYearClass < 2020) cores = 4;
        else if (Device.deviceYearClass < 2022) cores = 6;
        else cores = 8;
      }

      // Estimate CPU usage (this is very approximate)
      const usage = this.estimateCPUUsage();

      return {
        cores,
        architecture: architectures,
        usage
      };
    } catch (error) {
      console.error('Error getting CPU info:', error);
      return {
        cores: 4,
        architecture: ['unknown'],
        usage: 25
      };
    }
  }

  private async getGPUInfo() {
    try {
      // Basic GPU detection - more advanced detection would require native modules
      const hasGPU = Platform.OS === 'ios' || 
                     (Platform.OS === 'android' && Device.deviceYearClass !== null && Device.deviceYearClass > 2018);

      let vendor = 'Unknown';
      let renderer = 'Unknown';
      let memoryMB = 0;

      if (Platform.OS === 'ios') {
        vendor = 'Apple';
        renderer = 'Apple GPU';
        // Estimate GPU memory based on device year
        if (Device.deviceYearClass !== null && Device.deviceYearClass > 2020) {
          memoryMB = 1024; // 1GB for newer devices
        } else {
          memoryMB = 512; // 512MB for older devices
        }
      } else if (Platform.OS === 'android') {
        vendor = 'Qualcomm/ARM/Mali';
        renderer = 'Adreno/Mali GPU';
        memoryMB = 256; // Conservative estimate
      }

      return {
        available: hasGPU,
        vendor: hasGPU ? vendor : undefined,
        renderer: hasGPU ? renderer : undefined,
        memoryMB: hasGPU ? memoryMB : undefined
      };
    } catch (error) {
      console.error('Error getting GPU info:', error);
      return {
        available: false,
        vendor: undefined,
        renderer: undefined,
        memoryMB: undefined
      };
    }
  }

  private estimateCPUUsage(): number {
    // Very rough estimation based on active locks and time
    const activeLocks = Array.from(this.resourceLocks.values())
      .filter(lock => lock.type === 'cpu' && lock.isLocked);
    
    return Math.min(activeLocks.length * 25 + Math.random() * 20, 90);
  }

  private getCurrentPriority(): 'high' | 'normal' | 'low' {
    const cpuLocks = Array.from(this.resourceLocks.values())
      .filter(lock => lock.type === 'cpu' && lock.isLocked);
    
    if (cpuLocks.length > 0) {
      const highestPriority = Math.max(...cpuLocks.map(lock => lock.priority));
      if (highestPriority >= 80) return 'high';
      if (highestPriority >= 50) return 'normal';
    }
    
    return 'low';
  }

  // Resource locking simulation (actual implementation would require native modules)
  async lockResource(type: 'cpu' | 'gpu' | 'memory', priority: number = 75): Promise<boolean> {
    try {
      const lockId = `${type}_${Date.now()}`;
      
      // Check if we can actually lock resources on this platform
      if (type === 'cpu' && Platform.OS !== 'android') {
        console.warn('CPU resource locking not supported on this platform');
        return false;
      }
      
      if (type === 'gpu' && Platform.OS !== 'ios') {
        console.warn('GPU resource locking not supported on this platform');
        return false;
      }

      const lock: ResourceLock = {
        type,
        isLocked: true,
        priority,
        timestamp: Date.now()
      };

      this.resourceLocks.set(lockId, lock);
      
      console.log(`🔒 Locked ${type} resources with priority ${priority}`);
      
      // Auto-release after 30 seconds to prevent permanent locks
      setTimeout(() => {
        this.unlockResource(lockId);
      }, 30000);

      return true;
    } catch (error) {
      console.error(`Error locking ${type} resources:`, error);
      return false;
    }
  }

  unlockResource(lockId: string): boolean {
    const lock = this.resourceLocks.get(lockId);
    if (lock) {
      this.resourceLocks.delete(lockId);
      console.log(`🔓 Unlocked ${lock.type} resources`);
      return true;
    }
    return false;
  }

  unlockAllResources(): void {
    const count = this.resourceLocks.size;
    this.resourceLocks.clear();
    console.log(`🔓 Unlocked all ${count} resource locks`);
  }

  startMonitoring(intervalMs: number = 5000): void {
    if (this.monitoringInterval) {
      this.stopMonitoring();
    }

    this.monitoringInterval = setInterval(async () => {
      try {
        const resources = await this.getSystemResources();
        this.callbacks.forEach(callback => {
          try {
            callback(resources);
          } catch (error) {
            console.error('Error in monitoring callback:', error);
          }
        });
      } catch (error) {
        console.error('Error in system monitoring:', error);
      }
    }, intervalMs);

    console.log(`📊 Started system monitoring (${intervalMs}ms interval)`);
  }

  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
      console.log('📊 Stopped system monitoring');
    }
  }

  addMonitoringCallback(callback: (resources: SystemResources) => void): () => void {
    this.callbacks.push(callback);
    const index = this.callbacks.length - 1;
    return () => {
      if (index >= 0 && index < this.callbacks.length) {
        this.callbacks.splice(index, 1);
      }
    };
  }

  getResourceLocks(): ResourceLock[] {
    return Array.from(this.resourceLocks.values());
  }
}

export default SystemMonitor;