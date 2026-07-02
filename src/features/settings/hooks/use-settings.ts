import { useState, useEffect, useCallback } from "react";
import { load, Store } from "@tauri-apps/plugin-store";
import { SETTINGS_STORE_FILE, SETTINGS_KEYS } from "../types";

let storePromise: Promise<Store> | null = null;

function getStore(): Promise<Store> {
  if (!storePromise) {
    storePromise = load(SETTINGS_STORE_FILE);
  }
  return storePromise;
}

export function useSettings() {
  const [groqApiKey, setGroqApiKeyState] = useState<string>("");
  const [groqModel, setGroqModel] = useState<string>("openai/gpt-oss-120b");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getStore()
      .then(async (store) => {
        const key = await store.get<string>(SETTINGS_KEYS.groqApiKey);
        const model = await store.get<string>(SETTINGS_KEYS.groqModel);
        if (!cancelled) {
          setGroqApiKeyState(key ?? "");
          setGroqModel(model ?? "openai/gpt-oss-120b");
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const saveGroqApiKey = useCallback(async (key: string) => {
    const store = await getStore();
    await store.set(SETTINGS_KEYS.groqApiKey, key);
    await store.save();
    setGroqApiKeyState(key);
  }, []);

  const saveGroqModel = useCallback(async (model: string) => {
    const store = await getStore();
    await store.set(SETTINGS_KEYS.groqModel, model);
    await store.save();
    setGroqModel(model);
  }, []);

  return {
    loading,
    groqApiKey,
    groqModel,
    saveGroqApiKey,
    saveGroqModel,
  };
}

/** Read groqApiKey once from store (outside React — for services) */
export async function getGroqApiKey(): Promise<string> {
  const store = await getStore();
  return (await store.get<string>(SETTINGS_KEYS.groqApiKey)) ?? "";
}

/** Read groqModel once from store (outside React — for services) */
export async function getGroqModel(): Promise<string> {
  const store = await getStore();
  return (await store.get<string>(SETTINGS_KEYS.groqModel)) ?? "openai/gpt-oss-120b";
}
