import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://lzeyykrwldowtjksptfu.supabase.co';
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6ZXl5a3J3bGRvd3Rqa3NwdGZ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY2MDg0MDksImV4cCI6MjA5MjE4NDQwOX0.QUce4zJSL5kfGQx0pJkt2pPsTkJM4h7sKQYa-IbQcno';

// Web aur Mobile dono ke liye Safe Storage Adapter
const SafeStorage = {
  getItem: (key: string) => {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') {
        return Promise.resolve(window.localStorage.getItem(key));
      }
      return Promise.resolve(null);
    }
    return AsyncStorage.getItem(key);
  },
  setItem: (key: string, value: string) => {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, value);
      }
      return Promise.resolve();
    }
    return AsyncStorage.setItem(key, value);
  },
  removeItem: (key: string) => {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(key);
      }
      return Promise.resolve();
    }
    return AsyncStorage.removeItem(key);
  },
};

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    storage: SafeStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});