import 'react-native-url-polyfill/auto';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, processLock } from '@supabase/supabase-js';
import type { Database } from './database.types';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // Surface misconfiguration loudly in dev rather than failing with opaque 401s.
  console.warn(
    '[Hyu] Missing EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY. ' +
      'Copy .env.example to .env and fill in your Supabase project values.',
  );
}

// SecureStore has a ~2KB per-value limit. Supabase sessions can exceed that, so
// we shard large values across multiple SecureStore keys.
const CHUNK_SIZE = 1900;

const SecureStoreAdapter = {
  async getItem(key: string): Promise<string | null> {
    const head = await SecureStore.getItemAsync(key);
    if (head === null) return null;
    if (!head.startsWith('__chunked__:')) return head;

    const count = parseInt(head.slice('__chunked__:'.length), 10);
    let value = '';
    for (let i = 0; i < count; i++) {
      const part = await SecureStore.getItemAsync(`${key}__${i}`);
      if (part === null) return null;
      value += part;
    }
    return value;
  },
  async setItem(key: string, value: string): Promise<void> {
    if (value.length <= CHUNK_SIZE) {
      await SecureStore.setItemAsync(key, value);
      return;
    }
    const count = Math.ceil(value.length / CHUNK_SIZE);
    await SecureStore.setItemAsync(key, `__chunked__:${count}`);
    for (let i = 0; i < count; i++) {
      await SecureStore.setItemAsync(
        `${key}__${i}`,
        value.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE),
      );
    }
  },
  async removeItem(key: string): Promise<void> {
    const head = await SecureStore.getItemAsync(key);
    if (head?.startsWith('__chunked__:')) {
      const count = parseInt(head.slice('__chunked__:'.length), 10);
      for (let i = 0; i < count; i++) {
        await SecureStore.deleteItemAsync(`${key}__${i}`);
      }
    }
    await SecureStore.deleteItemAsync(key);
  },
};

// Web has no SecureStore; localStorage-backed AsyncStorage is the right call there.
const storage = Platform.OS === 'web' ? AsyncStorage : SecureStoreAdapter;

export const supabase = createClient<Database>(
  supabaseUrl ?? 'http://localhost',
  supabaseAnonKey ?? 'public-anon-key',
  {
    auth: {
      storage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: Platform.OS === 'web',
      lock: processLock,
    },
  },
);
