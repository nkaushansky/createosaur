/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_HUGGINGFACE_API_KEY?: string;
  readonly VITE_IMAGE_PROVIDER?: 'huggingface' | 'openai' | 'stability';
  readonly VITE_DEFAULT_MODEL?: string;
  readonly VITE_ENABLE_IMAGE_GEN?: string;
  readonly VITE_MAX_BATCH_SIZE?: string;
  readonly VITE_SHOW_DEBUG?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
