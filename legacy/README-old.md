# DinoForge - Genetic Engineering Lab 🧬

[![Development Status](https://img.shields.io/badge/Status-Active%20Development-green)]()
[![AI Integration](https://img.shields.io/badge/AI-Integrated-blue)]()
[![License](https://img.shields.io/badge/License-MIT-yellow)]()

Create hybrid dinosaurs through advanced genetic engineering. Combine DNA, customize traits, and generate unique prehistoric creatures with AI-powered image generation.

## 🚀 Recent Implementation

**✅ AI Image Generation Pipeline Completed**

We have successfully implemented a complete AI-powered image generation system:

- **Real AI Integration**: Hugging Face Inference API with Stable Diffusion SDXL
- **Enhanced Error Handling**: Comprehensive error boundaries and user feedback  
- **Advanced Loading States**: Real-time generation progress with visual feedback
- **Configuration Management**: Environment-based API key and feature management
- **Batch Generation**: Support for generating multiple creatures simultaneously

## 🧪 Features

### Core Genetic Engineering
- **DNA Mixing**: Combine up to 4+ dinosaur species with percentage-based genetics
- **Trait Selection**: Include/exclude specific traits for precise control
- **Scientific Profiles**: Auto-generated scientific names and behavioral analysis
- **Advanced Customization**: Colors, patterns, textures, size, and age variations

### AI-Powered Generation ⭐ NEW
- **Real Image Generation**: Hugging Face Stable Diffusion integration
- **Intelligent Prompting**: Automatic prompt enhancement for better results
- **Batch Processing**: Generate multiple variations simultaneously  
- **Fallback System**: Graceful handling of API failures with placeholder generation

## 🛠️ Quick Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure API (Optional but Recommended)
Create a `.env.local` file:
```env
VITE_HUGGINGFACE_API_KEY=your_huggingface_api_key_here
```

Get your free API key at: https://huggingface.co/settings/tokens

### 3. Start Development Server  
```bash
npm run dev
```

### 4. Open in Browser
Navigate to `http://localhost:8080`

## 🎯 How to Use

### Basic Generation
1. **Select Species**: Choose 2-4 dinosaur species and adjust DNA percentages
2. **Customize Appearance**: Pick colors, patterns, textures, and size
3. **Configure Traits**: Include/exclude specific traits (green=include, red=exclude)  
4. **Generate**: Click "Generate Hybrid" to create your creature with AI

### Advanced Features
- **Batch Generation**: Create multiple variations at once
- **Environmental Settings**: Backgrounds, lighting, weather effects
- **Scientific Analysis**: View auto-generated names and behavioral profiles
- **Undo/Redo**: Full state management with Ctrl+Z/Ctrl+Y

## 🔧 Implementation Details

### AI Integration Architecture

```typescript
// Core generation pipeline
generateHybridCreatures() {
  1. Analyze DNA sequences and trait compatibility
  2. Build genetic blueprint and trait mapping  
  3. Generate AI prompt from creature specifications
  4. Call Hugging Face API with enhanced prompts
  5. Process results and create creature objects
}
```

### Key Services Added
- `imageGeneration.ts` - Hugging Face API integration
- `creatureGeneration.ts` - Complete generation orchestration  
- `ErrorBoundary.tsx` - Comprehensive error handling
- `EnhancedLoading.tsx` - Real-time progress feedback

### Environment Configuration
- Works without API key (free tier with limitations)
- Enhanced with API key for faster, higher-quality generation
- Configurable models, batch sizes, and feature flags

## 🚀 Next Development Steps

### Priority 1: Gallery Enhancement
- [ ] Persistent gallery storage (localStorage → backend)
- [ ] Advanced filtering and sorting
- [ ] Favorite creatures management
- [ ] Export/sharing capabilities

### Priority 2: Advanced Genetics  
- [ ] Trait conflict system (carnivore ↔ herbivore)
- [ ] Genetic stability calculations
- [ ] Mutation probability system
- [ ] Hybrid compatibility matrix

### Priority 3: User Experience
- [ ] Animation system for DNA mixing
- [ ] Real-time preview updates
- [ ] Mobile responsiveness optimization
- [ ] Advanced generation parameters UI

### Priority 4: Social Features
- [ ] Community gallery
- [ ] Creature rating system
- [ ] Social sharing integration
- [ ] Collaborative breeding experiments

## 🎨 Technical Implementation Notes

### Current AI Generation Flow
1. **Trait Analysis**: Processes selected traits and DNA percentages
2. **Prompt Construction**: Builds detailed prompts from visual/genetic selections
3. **API Integration**: Calls Hugging Face with optimized parameters  
4. **Error Handling**: Graceful fallbacks for API failures
5. **Result Processing**: Creates gallery-ready creature objects

### Performance Optimizations
- Dynamic import for generation services (code splitting)
- Batch processing for multiple creatures
- Progress callbacks for responsive UI
- Error boundaries preventing app crashes

### Configuration Management
The app now supports comprehensive environment configuration:
- API providers and models
- Feature flags for different deployment environments  
- Debug modes for development
- Batch size limits and quality settings

## 📝 Original Project Info

**Lovable Project URL**: https://lovable.dev/projects/03752d4e-a343-442b-94c4-43384ca8db3c

**Development Approach**: 
- Start with Lovable for rapid prototyping
- Enhanced with local development for complex AI integration
- Seamless sync between Lovable and local IDE

## 🤝 Contributing

The project is actively maintained and welcomes contributions:
1. Fork the repository
2. Create feature branches for new functionality  
3. Test thoroughly with various species combinations
4. Submit pull requests with clear descriptions

---

**Ready to engineer the ultimate prehistoric hybrid? Start generating! 🦕⚡🧬**

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/03752d4e-a343-442b-94c4-43384ca8db3c) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)
