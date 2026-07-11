export interface AppSettings {
  groqApiKey: string;
  groqModel: string;
}

export const DEFAULT_SETTINGS: AppSettings = {
  groqApiKey: "",
  groqModel: "openai/gpt-oss-120b",
};

export const SETTINGS_KEYS = {
  groqApiKey: "groq_api_key",
  groqModel: "groq_model",
} as const;
