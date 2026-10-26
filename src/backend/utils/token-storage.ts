import * as SecureStore from 'expo-secure-store';
import { createTokenStorage } from './token-storage.core';
import type { StorageAdapter } from './token-storage.core';

export { createTokenStorage, parseStoredSession, TokenStorageError } from './token-storage.core';
export type { StoredSession, StorageAdapter } from './token-storage.core';


const storage_options = { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY };
export const secure_store_adapter: StorageAdapter = {
  isAvailable: () => SecureStore.isAvailableAsync(),
  getItem: (key) => SecureStore.getItemAsync(key, storage_options),
  setItem: (key, value) => SecureStore.setItemAsync(key, value, storage_options),
  deleteItem: (key) => SecureStore.deleteItemAsync(key, storage_options),
};

// Preserve the existing production key and public function names.
const token_storage = createTokenStorage(secure_store_adapter, 'no-name.auth');
export const { saveTokens, loadTokens, deleteTokens } = token_storage;
