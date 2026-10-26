import type { UserSummary } from '../auth.types';

export interface StoredSession {
  server_url: string;
  access_token: string;
  refresh_token?: string | null;
  user?: UserSummary | null;
}
export interface StorageAdapter {
  isAvailable(): Promise<boolean>;
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  deleteItem(key: string): Promise<void>;
}
export class TokenStorageError extends Error {
  constructor(public readonly code: 'UNAVAILABLE' | 'READ_FAILED' | 'WRITE_FAILED' | 'DELETE_FAILED' | 'INVALID_SESSION') {
    super('Unable to access saved sign-in information.');
    this.name = 'TokenStorageError';
  }
}
export function parseStoredSession(text: string): StoredSession {
  let value: unknown;
  try { value = JSON.parse(text); } catch { throw new TokenStorageError('INVALID_SESSION'); }
  if (typeof value !== 'object' || value === null) throw new TokenStorageError('INVALID_SESSION');
  const data = value as Partial<StoredSession>;
  const valid_user = data.user === undefined || data.user === null ||
    (typeof data.user === 'object' && typeof data.user.id === 'string' && typeof data.user.email === 'string'
      && (data.user.username === undefined || typeof data.user.username === 'string'));
  const valid_refresh_token = data.refresh_token === undefined || data.refresh_token === null ||
    (typeof data.refresh_token === 'string' && !!data.refresh_token.trim());
  if (typeof data.server_url !== 'string' || !/^https?:\/\//i.test(data.server_url)
    || typeof data.access_token !== 'string' || !data.access_token.trim() || !valid_user || !valid_refresh_token) {
    throw new TokenStorageError('INVALID_SESSION');
  }
  return data as StoredSession;
}
// Storage only: no React, UI state, listeners, networking, or token logging.
export function createTokenStorage(adapter: StorageAdapter, storage_key: string) {
  if (!/^[a-zA-Z0-9._-]+$/.test(storage_key)) throw new Error('Invalid storage key.');
  async function requireStorage(): Promise<void> {
    if (!(await adapter.isAvailable())) throw new TokenStorageError('UNAVAILABLE');
  }

  
  async function saveTokens(session: StoredSession): Promise<void> {
    const text = JSON.stringify(session);
    parseStoredSession(text);
    try { await requireStorage(); await adapter.setItem(storage_key, text); }
    catch (error) { if (error instanceof TokenStorageError) throw error; throw new TokenStorageError('WRITE_FAILED'); }
  }


  async function loadTokens(server_url: string): Promise<StoredSession | null> {
    let text: string | null;
    try { await requireStorage(); text = await adapter.getItem(storage_key); }
    catch (error) { if (error instanceof TokenStorageError) throw error; throw new TokenStorageError('READ_FAILED'); }
    if (text === null) return null;
    const session = parseStoredSession(text);
    return session.server_url === server_url ? session : null;
  }
  async function deleteTokens(): Promise<void> {
    try { await requireStorage(); await adapter.deleteItem(storage_key); }
    catch (error) { if (error instanceof TokenStorageError) throw error; throw new TokenStorageError('DELETE_FAILED'); }
  }
  return { saveTokens, loadTokens, deleteTokens };
}
