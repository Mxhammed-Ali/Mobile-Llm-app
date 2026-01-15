# 🤖 Mobile LLM

<div align="center">

**A powerful React Native application that runs large language models (LLMs) locally on mobile devices**

Experience the power of AI without requiring an internet connection or cloud services

[![React Native](https://img.shields.io/badge/React%20Native-0.79.5-blue.svg)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-~53.0.0-000020.svg)](https://expo.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-blue.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

</div>

---

## 📑 Table of Contents

- [Overview](#-overview)
- [Screenshots](#-screenshots)
- [Key Features](#-key-features)
- [Tech Stack](#-tech-stack)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Usage](#-usage)
- [Project Structure](#-project-structure)
- [Architecture](#-architecture)
- [Deployment](#-deployment)
- [Contributing](#-contributing)
- [License](#-license)
- [Acknowledgments](#-acknowledgments)

---

## 🌟 Overview

Mobile LLM demonstrates how to integrate local LLM execution into mobile applications using React Native and Expo. The app showcases on-device AI inference, allowing users to interact with language models directly on their smartphones with complete privacy and offline capability.

### Key Highlights

- 🤖 **Local AI Execution** - Run LLMs entirely on-device using llama.rn
- 🎨 **Beautiful Themes** - Light and Dark themes with smooth transitions
- 📱 **Device Optimized** - Automatic parameter tuning based on device capabilities
- 💾 **Model Management** - Download and manage GGUF models from HuggingFace
- 🔍 **Vector Database** - Context-aware responses using local embeddings
- ⚡ **Performance Focused** - Optimized for mobile hardware constraints

---

## 📸 Screenshots

<div align="center">

### Main screen
<img src="assets/images/4/llm-app-interface-7.png" width="250" alt="Dark Theme">

### Chat Interface - Dark Theme (Alternative View)
<img src="assets/images/4/llm-app-interface-3.png" width="250" alt="Dark Theme Alternative">

### Chat Interface - Light Theme
<img src="assets/images/4/llm-app-interface-1.png" width="250" alt="Light Theme">

### Chat selection Selection
<img src="assets/images/4/llm-app-interface-6.png" width="250" alt="Theme Selection">

### Settings - AI Configuration
<img src="assets/images/4/llm-app-interface-2.png" width="250" alt="AI Configuration">

### System Performance
<img src="assets/images/4/llm-app-interface-5.png" width="250" alt="System Performance">

### Context Rules
<img src="assets/images/4/llm-app-interface-9.png" width="250" alt="Context Rules">

### Embedding Model Panel
<img src="assets/images/4/llm-app-interface-4.png" width="250" alt="Embedding Model">

</div>

---

## ✨ Key Features

### 🤖 Local LLM Execution
- Run large language models entirely on your mobile device
- No internet connection required after model download
- Complete privacy - your conversations never leave your device
- Support for GGUF format models via llama.rn
- Configurable context size, GPU layers, and CPU threads

### 🎨 Theme Customization
- **Light Theme**: Clean and bright interface for daytime use
- **Dark Theme**: Easy on the eyes for low-light environments
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
- Customizable resource allocation

---

## 🛠️ Tech Stack

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
- **expo-blur ~14.1.5** - Backdrop blur effects for UI elements
- **react-native-reanimated ~3.17.4** - Smooth animations and transitions

### Vector Database
- Custom lightweight vector store implementation
- Local embedding generation and storage
- Cosine similarity search for context retrieval
- Efficient indexing for fast lookups

---

## 📋 Prerequisites

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

---

## 🚀 Installation

Follow these steps to set up the project locally:

### 1. Clone the repository
```bash
git clone https://github.com/Mxhammed-Ali/Mobile-Llm-app.git
cd Mobile-Llm-app
```

### 2. Install dependencies
```bash
npm install --legacy-peer-deps
```

> **Note**: The `--legacy-peer-deps` flag is required due to peer dependency conflicts between some packages.

### 3. Prebuild native projects (if running on physical device)
```bash
npx expo prebuild
```

### 4. Start the development server
```bash
npm start
```

---

## 💻 Usage

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

#### 1. Chat Screen
- Type your message in the input field
- Tap send to interact with the local LLM
- View conversation history
- Model responses are generated entirely on-device

#### 2. Settings Screen
- **Theme & Appearance**: Choose between Light and Dark themes
- **AI Configuration**: Adjust model parameters (context size, GPU layers, threads)
- **Device Optimization**: Auto-optimize settings for your device
- **Model Management**: Download custom models from HuggingFace
- **Device Information**: View hardware specs and system details

#### 3. Model Management
- Navigate to Settings → Model Management
- Enter HuggingFace GGUF model URL
- Monitor download progress
- Switch between downloaded models

---

## 📁 Project Structure

```
Mobile-Llm-app/
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
│   └── Colors.ts                 # Theme color definitions
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
- **constants/Colors.ts**: Centralized theme color definitions for both themes
- **utils/modelStorage.ts**: File system operations for model downloads and storage

---

## 🏗️ Architecture

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

---

## 🚢 Deployment

The code is fully functional and ready for deployment. You only need to sign the app for distribution.

### Building for Production

#### Android
```bash
eas build --platform android
```

#### iOS
```bash
eas build --platform ios
```

---

## 🤝 Contributing

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

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

The MIT License is a permissive open-source license that allows you to:
- ✅ Use the code commercially
- ✅ Modify the code
- ✅ Distribute the code
- ✅ Use the code privately

With the requirement to:
- 📄 Include the original license and copyright notice

---

## 🙏 Acknowledgments

- **llama.cpp** - The underlying C++ library that powers local LLM inference
- **llama.rn** - React Native bindings for llama.cpp
- **Expo Team** - For the excellent development platform
- **React Native Community** - For the robust mobile framework
- **HuggingFace** - For hosting and distributing open-source models

---

<div align="center">

**Mobile LLM** - Bringing the power of large language models to your pocket, with complete privacy and offline capability.

Made with ❤️ by the open-source community

[⬆ Back to Top](#-mobile-llm)

</div>
