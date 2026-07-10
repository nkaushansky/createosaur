# Createosaur - Multi-Provider AI Dinosaur Creator 🧬

[![Development Status](https://img.shields.io/badge/Status-Production%20Ready-green)]()
[![AI Integration](https://img.shields.io/badge/AI-Multi%20Provider-blue)]()
[![TypeScript](https://img.shields.io/badge/TypeScript-Enabled-blue)]()
[![License](https://img.shields.io/badge/License-MIT-yellow)]()

Create unique hybrid dinosaurs through advanced genetic engineering with cutting-edge AI image generation. Combine DNA, customize traits, and generate stunning prehistoric creatures using multiple premium AI providers.

## 🚀 Latest Updates - Phase 2 Complete

**✅ Multi-Provider AI Architecture Implemented**

We have successfully completed Phase 2 with a comprehensive multi-provider AI system:

- **🤖 Multiple AI Providers**: Hugging Face, OpenAI DALL-E 3/2, Stability AI
- **🔄 Smart Fallback System**: Automatic provider switching when failures occur
- **⚙️ Enhanced Settings**: Per-provider API key management with setup guidance
- **📊 Provider Registry**: Centralized management with configuration detection
- **🎯 Preferred Provider**: Set your preferred AI service with automatic fallback
- **🎭 Demo Mode**: SVG-based creature generation when no providers configured

## 🧪 Features

### Advanced Genetic Engineering
- **DNA Hybridization**: Combine multiple dinosaur species with precision genetics
- **Trait Control**: Include/exclude specific characteristics for targeted results  
- **Scientific Analysis**: Auto-generated names, classifications, and behavioral profiles
- **Comprehensive Customization**: Colors, patterns, textures, sizes, and developmental stages

### Multi-Provider AI Generation ⭐ ENHANCED
- **🎨 Premium Quality**: OpenAI DALL-E 3 for highest quality generation
- **⚡ High Speed**: Hugging Face Stable Diffusion for rapid iterations
- **🎯 Specialized Models**: Stability AI for enhanced detail and realism
- **🔧 Smart Routing**: Automatic provider selection based on availability and preferences
- **💾 Persistent Gallery**: Save, organize, and manage your creature collections

### Gallery & Management System
- **📁 Persistent Storage**: Local storage with import/export capabilities
- **🗂️ Organization**: Search, filter, and categorize your creatures
- **⭐ Favorites**: Mark and quickly access your best creations
- **📤 Sharing**: Export creatures and share with others

## 🛠️ Setup & Installation

### 1. Clone and Install
```bash
git clone <repository-url>
cd primal-maker-studio
npm install
```

### 2. Configure AI Providers (Optional)

Create a `.env.local` file and add any of these API keys:

```env
# Hugging Face (Free tier available)
VITE_HUGGINGFACE_API_KEY=hf_xxxxxxxxxxxxxxxxxxxx

# OpenAI (Premium quality)  
VITE_OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxx

# Stability AI (High quality alternative)
VITE_STABILITY_API_KEY=sk-xxxxxxxxxxxxxxxxxxxx
```

**Getting API Keys:**

- **Hugging Face**: [Get free API key](https://huggingface.co/settings/tokens) - Select "Inference API" permissions
- **OpenAI**: [Get API key](https://platform.openai.com/api-keys) - Requires credits for usage
- **Stability AI**: [Get API key](https://platform.stability.ai/account/keys) - Pay-per-use model

### 3. Start Development
```bash
npm run dev
```

Open [http://localhost:8081](http://localhost:8081) in your browser.

### 4. Production Build
```bash
npm run build
npm run preview
```

## 🏗️ Architecture

### Multi-Provider System
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Hugging Face  │    │    OpenAI       │    │  Stability AI   │
│   (Free/Fast)   │    │  (Premium)      │    │  (Specialized)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
         ┌─────────────────────────────────────────────────┐
         │           Provider Registry                     │
         │     • Automatic Fallback                       │
         │     • Configuration Detection                  │  
         │     • Provider Preferences                     │
         └─────────────────────────────────────────────────┘
                                 │
         ┌─────────────────────────────────────────────────┐
         │        Image Generation Service                 │
         │     • Unified Interface                        │
         │     • Error Handling                           │
         │     • Demo Mode Fallback                       │
         └─────────────────────────────────────────────────┘
```

### Technology Stack
- **Frontend**: React 18 + TypeScript + Vite
- **UI Framework**: shadcn/ui + Tailwind CSS  
- **State Management**: React Hooks + Context
- **AI Integration**: Multiple provider APIs with unified interface
- **Storage**: LocalStorage with JSON serialization
- **Build Tool**: Vite with SWC compilation

## 🎮 Usage Guide

### Basic Creature Generation
1. **Select Dinosaur Species**: Choose base creatures for DNA mixing
2. **Customize Traits**: Adjust colors, patterns, size, and features
3. **Configure AI**: Select preferred provider or use demo mode
4. **Generate**: Create your hybrid creature with AI
5. **Save & Manage**: Add to gallery and organize your collection

### Advanced Features
- **Batch Generation**: Create multiple variations simultaneously
- **Provider Switching**: Automatically tries backup providers if primary fails
- **Scientific Analysis**: Detailed creature profiles with generated names
- **Export System**: Share creatures as images or data files

## 🚀 Deployment

### Vercel (Recommended)
```bash
npm install -g vercel
vercel --prod
```

### Netlify
```bash
npm run build
# Upload dist/ folder to Netlify
```

### Traditional Hosting
```bash
npm run build
# Upload dist/ folder to your web server
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔮 Roadmap

### Phase 3: Production & Optimization (In Progress)
- [ ] Performance optimization and code splitting
- [ ] Advanced caching strategies  
- [ ] Analytics and usage monitoring
- [ ] Custom domain setup
- [ ] SEO optimization

### Phase 4: Advanced Features (Planned)
- [ ] User accounts and cloud storage
- [ ] Social sharing and community features
- [ ] Advanced genetic algorithms
- [ ] Real-time collaboration
- [ ] Mobile app version

## 📞 Support

For questions, issues, or feature requests:
- Create an issue on GitHub
- Check the documentation in `/docs`
- Review the code comments for implementation details

---

**Createosaur** - Where prehistoric genetics meets cutting-edge AI 🦕⚡

Visit us at [createosaur.com](https://createosaur.com)