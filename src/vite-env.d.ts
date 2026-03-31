/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** 可选；与 Pages 不同域时填 Worker/Pages 的 origin，同域留空 */
  readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
