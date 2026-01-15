/**
 * Enhanced color system with light and dark themes
 * Both themes use similar color schemes with purple/blue gradients
 */

const tintColorLight = '#6366F1'; // Indigo
const tintColorDark = '#8B5CF6'; // Purple

export const Colors = {
  light: {
    text: '#1F2937',
    background: '#FFFFFF',
    backgroundSecondary: '#F9FAFB',
    backgroundTertiary: '#F3F4F6',
    tint: tintColorLight,
    tintSecondary: '#4F46E5',
    icon: '#6B7280',
    tabIconDefault: '#9CA3AF',
    tabIconSelected: tintColorLight,
    border: '#E5E7EB',
    borderLight: '#F3F4F6',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    gradientStart: '#6366F1',
    gradientEnd: '#8B5CF6',
    cardBackground: '#FFFFFF',
    shadowColor: '#000000',
    overlayBackground: 'rgba(0, 0, 0, 0.5)',
  },
  dark: {
    text: '#FFFFFF',
    background: '#0D0C21',
    backgroundSecondary: '#15132D',
    backgroundTertiary: '#1F1B3A',
    tint: '#8A63FF',
    tintSecondary: '#FF6BCB',
    icon: '#FFFFFF',
    tabIconDefault: 'rgba(255, 255, 255, 0.6)',
    tabIconSelected: '#8A63FF',
    border: 'rgba(255, 255, 255, 0.1)',
    borderLight: 'rgba(255, 255, 255, 0.2)',
    success: '#00D4AA',
    warning: '#FFB800',
    error: '#FF6B6B',
    gradientStart: '#8A63FF',
    gradientEnd: '#FF6BCB',
    cardBackground: '#15132D',
    shadowColor: 'rgba(138, 99, 255, 0.3)',
    overlayBackground: 'rgba(13, 12, 33, 0.8)',
  },
};

export type ColorScheme = 'light' | 'dark';

// Theme gradient configurations
export const Gradients = {
  light: {
    primary: ['#6366F1', '#8B5CF6'],
    secondary: ['#4F46E5', '#7C3AED'],
    accent: ['#EC4899', '#8B5CF6'],
  },
  dark: {
    // Dark theme gradients with rich neon accents
    primaryBackground: ['#0D0C21', '#15132D', '#1F1B3A'],
    cardGradient: ['#15132D', '#1F1B3A'],
    primary: ['#8A63FF', '#FF6BCB'],
    secondary: ['#A855F7', '#6366F1'],
    accent: ['#FF6BCB', '#8A63FF'],
    neon: ['#00F5FF', '#8A63FF', '#FF6BCB'],
    button: ['#8A63FF', '#A855F7'],
  },
};

// Proper glassmorphism based on reference implementation
export const GlassStyles = {
  // Glass cards with proper blur and translucency
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)', // Exact value from reference
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)', // Exact value from reference
    borderRadius: 12,
    shadowColor: 'rgba(31, 38, 135, 0.37)', // Shadow from reference
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 32,
    elevation: 16,
  },
  
  // Input fields with proper glass effect
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    shadowColor: 'rgba(31, 38, 135, 0.37)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 8,
  },
  
  // Glass buttons with proper translucency
  button: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    shadowColor: 'rgba(31, 38, 135, 0.37)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 8,
  },
  
  // Tab bar and navigation
  tabBar: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 32,
    shadowColor: 'rgba(142, 197, 252, 0.2)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  
  // Overlay and modal backgrounds
  overlay: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 28,
    shadowColor: 'rgba(142, 197, 252, 0.6)',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.8,
    shadowRadius: 40,
    elevation: 24,
  },
};

// Dark theme clean styles - no glows, better contrast
export const DarkStyles = {
  card: {
    backgroundColor: '#15132D', // Card background
    borderWidth: 1,
    borderColor: 'rgba(138, 99, 255, 0.3)', // Subtle purple border
    borderRadius: 12,
    shadowColor: 'rgba(0, 0, 0, 0.3)', // Clean drop shadow
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 8,
  },
  
  // Clean chat bubble style
  chatBubble: {
    backgroundColor: '#1e1c3c', // Flat background
    borderWidth: 1,
    borderColor: 'rgba(138, 99, 255, 0.3)', // Purple accent border
    borderRadius: 16,
    // No glow effects - clean and flat
  },
  
  // User message bubble
  userBubble: {
    backgroundColor: '#8A63FF', // Primary purple
    borderWidth: 0,
    borderRadius: 16,
    // No glow effects
  },
  
  button: {
    backgroundColor: '#8A63FF',
    borderWidth: 0,
    borderRadius: 16,
    shadowColor: 'rgba(0, 0, 0, 0.2)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 4,
  },
  
  // Remove neon accent - cleaner approach
  container: {
    backgroundColor: '#0d0c21', // Page background
    borderWidth: 0,
    borderRadius: 0,
  },
};
