/**
 * Logs Viewer Component
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors, useIsDark } from '../hooks/useThemeColor';
import { GlassStyles } from '../constants/Colors';
import { logger, LogEntry } from '../utils/logger';

interface LogsViewerProps {
  isVisible: boolean;
  onClose: () => void;
}

export const LogsViewer: React.FC<LogsViewerProps> = ({ isVisible, onClose }) => {
  const colors = useThemeColors();
  const isDark = useIsDark();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filter, setFilter] = useState<string>('');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');

  useEffect(() => {
    if (isVisible) {
      setLogs(logger.getLogs());
      const unsubscribe = logger.subscribe(setLogs);
      return unsubscribe;
    }
  }, [isVisible]);

  const filteredLogs = logs.filter(log => {
    const matchesFilter = !filter || 
      log.message.toLowerCase().includes(filter.toLowerCase()) ||
      (log.data && JSON.stringify(log.data).toLowerCase().includes(filter.toLowerCase()));
    
    const matchesLevel = selectedLevel === 'all' || log.level === selectedLevel;
    
    return matchesFilter && matchesLevel;
  });

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'error': return '#ff4444';
      case 'warn': return '#ffaa00';
      case 'success': return '#00aa00';
      case 'info': return '#0088ff';
      case 'debug': return '#888888';
      default: return colors.text;
    }
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'error': return 'close-circle';
      case 'warn': return 'warning';
      case 'success': return 'checkmark-circle';
      case 'info': return 'information-circle';
      case 'debug': return 'bug';
      default: return 'ellipse';
    }
  };

  const handleShare = async () => {
    try {
      const logText = logger.formatLogs();
      await Share.share({
        message: logText,
        title: 'App Logs',
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to share logs');
    }
  };

  const handleClear = () => {
    Alert.alert(
      'Clear Logs',
      'Are you sure you want to clear all logs?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear', 
          style: 'destructive',
          onPress: () => {
            logger.clearLogs();
            setLogs([]);
          }
        },
      ]
    );
  };

  if (!isVisible) return null;

  return (
    <View style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: colors.background,
      zIndex: 1000,
    }}>
      {/* Header */}
      <View style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          backgroundColor: colors.cardBackground,
        },
        isDark && GlassStyles.card,
      ]}>
        <Text style={{ fontSize: 18, fontWeight: '600', color: colors.text }}>
          App Logs ({filteredLogs.length})
        </Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity
            onPress={handleShare}
            style={{
              padding: 8,
              borderRadius: 8,
              backgroundColor: colors.backgroundSecondary,
            }}
          >
            <Ionicons name="share-outline" size={20} color={colors.icon} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleClear}
            style={{
              padding: 8,
              borderRadius: 8,
              backgroundColor: colors.backgroundSecondary,
            }}
          >
            <Ionicons name="trash-outline" size={20} color={colors.icon} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onClose}
            style={{
              padding: 8,
              borderRadius: 8,
              backgroundColor: colors.backgroundSecondary,
            }}
          >
            <Ionicons name="close" size={20} color={colors.icon} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Filters */}
      <View style={{
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: colors.backgroundSecondary,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
      }}>
        <TextInput
          value={filter}
          onChangeText={setFilter}
          placeholder="Filter logs..."
          placeholderTextColor={colors.icon}
          style={{
            backgroundColor: colors.cardBackground,
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderRadius: 8,
            color: colors.text,
            marginBottom: 8,
          }}
        />
        
        {/* Level Filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {['all', 'error', 'warn', 'success', 'info', 'debug'].map(level => (
              <TouchableOpacity
                key={level}
                onPress={() => setSelectedLevel(level)}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 16,
                  backgroundColor: selectedLevel === level ? colors.tint : colors.backgroundSecondary,
                }}
              >
                <Text style={{
                  color: selectedLevel === level ? 'white' : colors.text,
                  fontSize: 12,
                  fontWeight: '500',
                }}>
                  {level.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Logs */}
      <ScrollView style={{ flex: 1, paddingHorizontal: 16 }}>
        {filteredLogs.length === 0 ? (
          <View style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            paddingVertical: 64,
          }}>
            <Ionicons name="document-outline" size={64} color={colors.icon} />
            <Text style={{
              fontSize: 16,
              color: colors.text,
              marginTop: 16,
              textAlign: 'center',
            }}>
              No logs to display
            </Text>
          </View>
        ) : (
          filteredLogs.map((log) => (
            <View
              key={log.id}
              style={[
                {
                  padding: 12,
                  marginVertical: 4,
                  borderRadius: 8,
                  backgroundColor: colors.cardBackground,
                  borderLeftWidth: 4,
                  borderLeftColor: getLevelColor(log.level),
                },
                isDark && GlassStyles.card,
              ]}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                <Ionicons 
                  name={getLevelIcon(log.level) as any} 
                  size={16} 
                  color={getLevelColor(log.level)} 
                />
                <Text style={{
                  fontSize: 12,
                  color: colors.icon,
                  marginLeft: 8,
                }}>
                  {new Date(log.timestamp).toLocaleTimeString()}
                </Text>
                <Text style={{
                  fontSize: 10,
                  color: getLevelColor(log.level),
                  marginLeft: 8,
                  fontWeight: '600',
                }}>
                  {log.level.toUpperCase()}
                </Text>
              </View>
              
              <Text style={{
                fontSize: 14,
                color: colors.text,
                lineHeight: 20,
              }}>
                {log.message}
              </Text>
              
              {log.data && (
                <Text style={{
                  fontSize: 12,
                  color: colors.icon,
                  marginTop: 4,
                  fontFamily: 'monospace',
                }}>
                  {JSON.stringify(log.data, null, 2)}
                </Text>
              )}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}; 