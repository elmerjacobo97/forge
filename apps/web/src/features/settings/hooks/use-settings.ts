import { useCallback, useState } from "react";
import { SETTINGS_KEYS } from "../types";

function readSetting(key: string): string {
  try {
    return sessionStorage.getItem(key) ?? "";
  } catch {
    return "";
  }
}

function writeSetting(key: string, value: string): void {
  sessionStorage.setItem(key, value);
}

export function useSettings() {
  const [groqApiKey, setGroqApiKeyState] = useState(() => readSetting(SETTINGS_KEYS.groqApiKey));
  const [groqModel, setGroqModel] = useState(
    () => readSetting(SETTINGS_KEYS.groqModel) || "openai/gpt-oss-120b",
  );

  const saveGroqApiKey = useCallback(async (key: string) => {
    writeSetting(SETTINGS_KEYS.groqApiKey, key);
    setGroqApiKeyState(key);
  }, []);

  const saveGroqModel = useCallback(async (model: string) => {
    writeSetting(SETTINGS_KEYS.groqModel, model);
    setGroqModel(model);
  }, []);

  return {
    loading: false,
    groqApiKey,
    groqModel,
    saveGroqApiKey,
    saveGroqModel,
  };
}

/** Read groqApiKey once from store (outside React — for services) */
export async function getGroqApiKey(): Promise<string> {
  return readSetting(SETTINGS_KEYS.groqApiKey);
}

/** Read groqModel once from store (outside React — for services) */
export async function getGroqModel(): Promise<string> {
  return readSetting(SETTINGS_KEYS.groqModel) || "openai/gpt-oss-120b";
}
