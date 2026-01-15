# Mobile LLM

A powerful React Native application that runs large language models (LLMs) locally on mobile devices. Experience the power of AI without requiring an internet connection or cloud services.

## Overview

Mobile LLM demonstrates how to integrate local LLM execution into mobile applications using React Native and Expo. The app showcases on-device AI inference, allowing users to interact with language models directly on their smartphones with complete privacy and offline capability.

**Key Highlights:**
- 🤖 **Local AI Execution** - Run LLMs entirely on-device using llama.rn
- 🎨 **Beautiful Themes** - Light, Dark, and Liquid Glass themes with smooth transitions
- 📱 **Device Optimized** - Automatic parameter tuning based on device capabilities
- 💾 **Model Management** - Download and manage GGUF models from HuggingFace
- 🔍 **Vector Database** - Context-aware responses using local embeddings
- ⚡ **Performance Focused** - Optimized for mobile hardware constraints

## Features

### 🤖 Local LLM Execution
- Run large language models entirely on your mobile device
- No internet connection required after model download
- Complete privacy - your conversations never leave your device
- Support for GGUF format models via llama.rn
- Configurable context size, GPU layers, and CPU threads

### 🎨 Theme Customization
- **Light Theme**: Clean and bright interface for daytime use
- **Dark Theme**: Easy on the eyes for low-light environments
- **Liquid Glass**: Apple-inspired design with purple/blue gradients and glass morphism
- Persistent theme preferences saved locally
- Optional system theme following for automatic switching

### 🛠️ Model Management
- Built-in model support (DeepSeek R1 Distilled, BGE embeddings)
- Download custom GGUF models from HuggingFace
- Real-time download progress tracking
- Storage usage monitoring
- Automatic file organization and cleanup

### 🔍 Vector Database & Context Retrieval
- Local vector database for semantic search
- Embedding generation using BGE models
- Context-aware chat responses
- Efficient similarity search for relevant information
- On-device embedding computation

### ⚡ Device Optimization
- Automatic hardware detection (RAM, CPU, GPU)
- Device-specific parameter optimization
- Pre-configured profiles for popular devices
- Real-time performance monitoring
- Smart resource allocation based on available memory
- customizable resource allocation 

## Tech Stack

### Core Framework
- **React Native 0.79.5** - Cross-platform mobile framework
- **Expo ~53.0.0** - Development platform and build tools
- **TypeScript ~5.8.3** - Type-safe JavaScript for better code quality

### AI & ML
- **llama.rn ^0.3.2** - Local LLM execution using llama.cpp bindings for React Native. Enables running quantized GGUF models directly on mobile devices with CPU and GPU acceleration.

### Storage & Persistence
- **@react-native-async-storage/async-storage 2.1.2** - Persistent key-value storage for settings, theme preferences, and app state
- **expo-file-system ~18.1.11** - File system access for downloading and managing model files (GGUF models, embeddings)
- **expo-sqlite ~15.2.14** - Local SQLite database for vector storage and chat history

### Navigation & UI
- **@react-navigation/native ^7.0.14** - Navigation framework
- **@react-navigation/bottom-tabs ^7.1.5** - Tab-based navigation for main app screens
- **expo-linear-gradient ~14.1.5** - Gradient backgrounds for theming system
- **expo-blur ~14.1.5** - Backdrop blur effects for glass morphism theme
- **react-native-reanimated ~3.17.4** - Smooth animations and transitions

### Vector Database
- Custom lightweight vector store implementation
- Local embedding generation and storage
- Cosine similarity search for context retrieval
- Efficient indexing for fast lookups

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 18.x or higher ([Download](https://nodejs.org/))
- **npm** or **yarn** package manager
- **Expo CLI** - Install globally: `npm install -g expo-cli`
- **Development Environment**:
  - **For Android**: Android Studio with Android SDK
  - **For iOS**: Xcode (macOS only) with iOS Simulator
- **Physical Device** (recommended for best performance):
  - Android device with USB debugging enabled
  - iOS device with development provisioning profile

## Installation

Follow these steps to set up the project locally:

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/mobile-llm.git
   cd mobile-llm
   ```

2. **Install dependencies**
   ```bash
   npm install --legacy-peer-deps
   ```
   
   > **Note**: The `--legacy-peer-deps` flag is required due to peer dependency conflicts between some packages.

3. **Prebuild native projects** (if running on physical device)
   ```bash
   npx expo prebuild
   ```

4. **Start the development server**
   ```bash
   npm start
   ```

## Usage

### Starting the Development Server

```bash
npm start
```

This opens the Expo development server. You'll see a QR code and several options:

- Press `a` to open on Android emulator/device
- Press `i` to open on iOS simulator (macOS only)
- Scan QR code with Expo Go app (for development builds)

### Running on Android

```bash
npm run android
```

This builds and launches the app on a connected Android device or running emulator.

### Running on iOS

```bash
npm run ios
```

This builds and launches the app on the iOS simulator (macOS only).

### Using the App

1. **Chat Screen**
   - Type your message in the input field
   - Tap send to interact with the local LLM
   - View conversation history
   - Model responses are generated entirely on-device

2. **Settings Screen**
   - **Theme & Appearance**: Choose between Light, Dark, or Liquid Glass themes
   - **AI Configuration**: Adjust model parameters (context size, GPU layers, threads)
   - **Device Optimization**: Auto-optimize settings for your device
   - **Model Management**: Download custom models from HuggingFace
   - **Device Information**: View hardware specs and system details

3. **Model Management**
   - Navigate to Settings → Model Management
   - Enter HuggingFace GGUF model URL
   - Monitor download progress
   - Switch between downloaded models

## Project Structure

```
DeepSeekMobile/
├── app/                          # App screens
│   └── settings.tsx              # Settings and configuration screen
├── components/                   # Reusable UI components
│   ├── ChatInput.tsx             # Message input component
│   ├── ChatMessageBubble.tsx     # Chat message display
│   ├── ChatHistoryPanel.tsx      # Conversation history
│   ├── ModelSelectionPanel.tsx   # Model picker
│   ├── ModelStatusIndicator.tsx  # Model loading status
│   ├── ModernChatScreen.tsx      # Main chat interface
│   ├── ThemedView.tsx            # Themed container with glass effects
│   ├── ThemedText.tsx            # Themed text with gradient support
│   ├── SystemPerformancePanel.tsx # Performance monitoring
│   ├── ContextRulesPanel.tsx     # Context management
│   ├── EmbeddingModelPanel.tsx   # Embedding model controls
│   └── LogsViewer.tsx            # Debug logs viewer
├── constants/                    # App constants
│   └── Colors.ts                 # Theme color definitions (Light/Dark/Liquid Glass)
├── contexts/                     # React contexts
│   ├── ChatContext.tsx           # Chat state management
│   └── ThemeContext.tsx          # Theme state management
├── hooks/                        # Custom React hooks
│   ├── useColorScheme.ts         # Theme detection hook
│   └── useThemeColor.ts          # Color utility hook
├── services/                     # Business logic services
│   ├── ModelManagerService.ts    # LLM model management
│   ├── EmbedderModelManager.ts   # Embedding model management
│   ├── EmbeddingService.ts       # Embedding generation
│   ├── VectorStoreService.ts     # Vector database interface
│   ├── LightVectorDB.ts          # Vector storage implementation
│   ├── SimpleVectorStore.ts      # Alternative vector store
│   └── ContextRulesService.ts    # Context retrieval logic
├── types/                        # TypeScript type definitions
│   ├── chat.ts                   # Chat-related types
│   ├── models.ts                 # Model-related types
│   └── llama.d.ts                # llama.rn type declarations
├── utils/                        # Utility functions
│   ├── modelStorage.ts           # Model file management
│   ├── deviceResources.ts        # Device capability detection
│   ├── systemMonitor.ts          # Performance monitoring
│   ├── logger.ts                 # Logging utility
│   └── eventBus.ts               # Event communication
├── App.tsx                       # Root component with navigation
├── app.json                      # Expo configuration
├── package.json                  # Dependencies and scripts
└── tsconfig.json                 # TypeScript configuration
```

### Key Files

- **App.tsx**: Root component that sets up tab navigation and theme providers
- **services/ModelManagerService.ts**: Handles LLM initialization, inference, and model lifecycle
- **services/VectorStoreService.ts**: Manages vector database for context retrieval
- **components/ModernChatScreen.tsx**: Main chat interface with message handling
- **constants/Colors.ts**: Centralized theme color definitions for all three themes
- **utils/modelStorage.ts**: File system operations for model downloads and storage

## Screenshots

### 1. Chat Interface - Light Theme
*Shows the main chat screen with LLM conversation in light mode*

![Chat Screen - Light Mode](screenshots/chat-light.png)

**What to capture:** Main chat screen with a conversation, showing message bubbles, input field, and light theme colors.

---

### 2. Chat Interface - Dark Theme
*Shows the same chat interface optimized for low-light environments*

![Chat Screen - Dark Mode](screenshots/chat-dark.png)

**What to capture:** Same chat screen but with dark theme enabled, demonstrating the theme switching capability.

---

### 3. Chat Interface - Liquid Glass Theme
*Shows the premium glass morphism theme with gradients*

![Chat Screen - Liquid Glass Theme](screenshots/chat-liquid-glass.png)

**What to capture:** Chat screen with the Liquid Glass theme showing purple/blue gradients and blur effects.

---

### 4. Settings Screen - Theme Selection
*Shows the theme picker with all three theme options*

![Settings - Theme Selection](screenshots/settings-themes.png)

**What to capture:** Settings screen with the theme selection cards visible (Light, Dark, Liquid Glass options).

---

### 5. Settings Screen - AI Configuration
*Shows device optimization and AI parameter controls*

![Settings - AI Configuration](screenshots/settings-ai-config.png)

**What to capture:** Settings screen scrolled to show AI Configuration section with context size, GPU layers, and thread controls.

---

### 6. Model Management
*Shows model download and management interface*

![Model Management](screenshots/model-management.png)

**What to capture:** Settings screen showing model management section with download progress or available models.

---

### 7. Device Information
*Shows hardware specs and system details*

![Device Information](screenshots/device-info.png)

**What to capture:** Settings screen scrolled to device information section showing RAM, CPU, and device model.

---

### 8. Model Loading Status
*Shows the model initialization process*

![Model Loading](screenshots/model-loading.png)

**What to capture:** Chat screen showing the model loading indicator or status message.

---

### How to Add Your Screenshots

1. **Create the screenshots directory:**
   ```bash
   mkdir screenshots
   ```

2. **Capture screenshots from your device:**ool or device screenshot (Power + Volume Down)
   - **iOS**: Use Simulator's screenshot tool (Cmd + S) or device screenshot (Side Button + Volume Up)

3. **Name your files exactly as shown above:**
   - `chat-light.png`
   - `chat-dark.png`
   - `chat-liquid-glass.png`
   - `settings-themes.png`
   - `settings-ai-config.png`
   - `model-management.png`
   - `device-info.png`
   - `model-loading.png`

4. **Place all screenshots in the `screenshots/` directory**

5. **The README will automatically display them** (the markdown image links are already in place above)

> **Tip:** For best results, use consistent device orientation (portrait recommended) and capture at the same resolution for all screenshots.
   - **Android**: Use Android Studio's screenshot t

## Deployment

The code is fully functional and ready for deployment. You only need to sign the app for distribution.


## Architecture

Mobile LLM follows a modular architecture designed for maintainability and extensibility.

### High-Level Design

```
┌─────────────────────────────────────────────────────────┐
│                     Presentation Layer                   │
│  (React Components, Screens, Navigation, Theming)       │
└─────────────────────┬───────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────┐
│                    Business Logic Layer                  │
│  (Services: ModelManager, VectorStore, Embeddings)      │
└─────────────────────┬───────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────┐
│                      Data Layer                          │
│  (AsyncStorage, FileSystem, SQLite, llama.rn)           │
└─────────────────────────────────────────────────────────┘
```

### Key Architectural Decisions

1. **Service-Based Architecture**: Business logic is encapsulated in service classes (ModelManagerService, VectorStoreService) for separation of concerns and testability.

2. **Context API for State**: React Context manages global state (theme, chat) to avoid prop drilling and enable easy state access across components.

3. **Local-First Design**: All AI processing happens on-device. No cloud dependencies after initial model download.

4. **Modular Theming**: Theme system is centralized in Colors.ts with ThemedView/ThemedText components for consistent styling.

5. **Async Operations**: Heavy operations (model loading, inference, embeddings) use async/await with proper error handling and loading states.

6. **Vector Database**: Custom lightweight vector store optimized for mobile constraints, using cosine similarity for semantic search.

For detailed design documentation, see [design.md](.kiro/specs/opensource-rebrand/design.md).

## Contributing

Contributions are welcome! Here's how you can help:

### Getting Started

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Make your changes
4. Test thoroughly on both Android and iOS
5. Commit with clear messages: `git commit -m "Add feature: description"`
6. Push to your fork: `git push origin feature/your-feature-name`
7. Open a Pull Request

### Contribution Guidelines

- **Code Style**: Follow the existing TypeScript and React Native conventions
- **Linting**: Run `npm run lint` before committing
- **Testing**: Test on both Android and iOS when possible
- **Documentation**: Update README and comments for new features
- **Commits**: Write clear, descriptive commit messages
- **Issues**: Check existing issues before creating new ones

### Areas for Contribution

- 🐛 Bug fixes and error handling improvements
- ✨ New features (model formats, UI enhancements)
- 📚 Documentation improvements
- 🎨 UI/UX enhancements
- ⚡ Performance optimizations
- 🧪 Test coverage
- 🌍 Internationalization (i18n)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

The MIT License is a permissive open-source license that allows you to:
- ✅ Use the code commercially
- ✅ Modify the code
- ✅ Distribute the code
- ✅ Use the code privately

With the requirement to:
- 📄 Include the original license and copyright notice

## Acknowledgments

- **llama.cpp** - The underlying C++ library that powers local LLM inference
- **llama.rn** - React Native bindings for llama.cpp
- **Expo Team** - For the excellent development platform
- **React Native Community** - For the robust mobile framework
- **HuggingFace** - For hosting and distributing open-source models

---

## 📸 Screenshot Checklist

Before publishing, capture these 8 screenshots and place them in the `screenshots/` directory:

- [ ] `chat-light.png` - Chat screen in light theme
- [ ] `chat-dark.png` - Chat screen in dark theme  
- [ ] `chat-liquid-glass.png` - Chat screen in liquid glass theme
- [ ] `settings-themes.png` - Settings showing theme selection
- [ ] `settings-ai-config.png` - Settings showing AI configuration
- [ ] `model-management.png` - Model download/management interface
- [ ] `device-info.png` - Device information panel
- [ ] `model-loading.png` - Model loading status indicator

---

**Mobile LLM** - Bringing the power of large language models to your pocket, with complete privacy and offline capability.

Made with ❤️ by the open-source community
