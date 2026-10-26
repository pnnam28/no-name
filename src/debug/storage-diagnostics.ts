import { createTokenStorage } from '../backend/utils/token-storage.core';
import type { StorageAdapter, StoredSession } from '../backend/utils/token-storage.core';

export const debug_storage_key = 'no-name.debug.auth.v1';
const debug_server_url = 'https://debug.invalid';
const sample_session: StoredSession = { server_url: debug_server_url, access_token: 'debug-access-A', refresh_token: 'debug-refresh-A', user: { id: 'debug-user-001', email: 'debug@example.invalid' } };
export type DiagnosticCase = 'availability' | 'roundtrip' | 'overwrite' | 'delete' | 'missing' | 'prepareRestart' | 'verifyRestart';
export interface DiagnosticResult { test_id: string; passed: boolean; duration_ms: number; detail: string }
export async function runStorageDiagnostic(adapter: StorageAdapter, test_id: DiagnosticCase): Promise<DiagnosticResult> {
  const started_at = Date.now();
  // Log only the isolated diagnostic record. Never read the production session key.
  function logRecord(operation: string, raw_value: string | null): void {
    let stored: Partial<StoredSession> | null = null;
    try { stored = raw_value === null ? null : JSON.parse(raw_value); } catch { /* Raw diagnostic value is still useful. */ }
    console.info(`[AUTH-DEBUG][${test_id}][${operation}]`, {
      storage_key: debug_storage_key,
      raw_value,
      access_token: stored?.access_token ?? null,
      refresh_token: stored?.refresh_token ?? null,
      user_id: stored?.user?.id ?? null,
      stored_session: stored,
    });
  }
  const traced_adapter: StorageAdapter = {
    isAvailable: async () => {
      const available = await adapter.isAvailable();
      console.info(`[AUTH-DEBUG][${test_id}][AVAILABILITY]`, { storage_key: debug_storage_key, available });
      return available;
    },
    getItem: async (key) => {
      if (key !== debug_storage_key) throw new Error('Diagnostic key required.');
      const raw_value = await adapter.getItem(key);
      logRecord('READ', raw_value);
      return raw_value;
    },
    setItem: async (key, value) => {
      if (key !== debug_storage_key) throw new Error('Diagnostic key required.');
      await adapter.setItem(key, value);
      logRecord('WRITE', value);
    },
    deleteItem: async (key) => {
      if (key !== debug_storage_key) throw new Error('Diagnostic key required.');
      await adapter.deleteItem(key);
      logRecord('DELETE', null);
    },
  };
  const storage = createTokenStorage(traced_adapter, debug_storage_key);
  console.info(`[AUTH-DEBUG][${test_id}][START]`, { storage_key: debug_storage_key, sample_session });
  try {
    let passed = false;
    let detail = '';
    switch (test_id) {
      case 'availability':
        passed = await traced_adapter.isAvailable();
        if (passed) await traced_adapter.getItem(debug_storage_key);
        detail = passed ? 'Native storage available.' : 'Native storage unavailable (expected on web).'; break;
      case 'roundtrip': {
        await storage.saveTokens(sample_session);
        const loaded = await storage.loadTokens(debug_server_url);
        passed = loaded?.access_token === sample_session.access_token && loaded?.refresh_token === sample_session.refresh_token && loaded?.server_url === debug_server_url;
        detail = 'Access, refresh, and server values match: ' + passed; break;
      }
      case 'overwrite': {
        await storage.saveTokens(sample_session);
        await storage.saveTokens({ ...sample_session, access_token: 'debug-access-B', refresh_token: 'debug-refresh-B' });
        const loaded = await storage.loadTokens(debug_server_url);
        passed = loaded?.access_token === 'debug-access-B' && loaded?.refresh_token === 'debug-refresh-B';
        detail = 'Both replacement values match: ' + passed; break;
      }
      case 'delete':
        await storage.saveTokens(sample_session); await storage.deleteTokens();
        passed = (await storage.loadTokens(debug_server_url)) === null; detail = 'Deleted record is absent: ' + passed; break;
      case 'missing':
        await storage.deleteTokens(); await storage.deleteTokens();
        passed = (await storage.loadTokens(debug_server_url)) === null; detail = 'Missing key and repeated delete handled: ' + passed; break;
      case 'prepareRestart':
        await storage.saveTokens(sample_session); passed = true;
        detail = 'Prepared. Fully close/reopen the same app, then press Verify restart. Do not run other storage tests first.'; break;
      case 'verifyRestart': {
        const loaded = await storage.loadTokens(debug_server_url);
        passed = loaded?.access_token === sample_session.access_token && loaded?.refresh_token === sample_session.refresh_token;
        detail = 'Prepared values found: ' + passed + '. This proves restart persistence only if you actually restarted the app.';
        if (passed) await storage.deleteTokens(); break;
      }
    }
    // Ordinary tests clean up the diagnostic key only; preparation persists deliberately.
    if (!['availability', 'prepareRestart', 'verifyRestart'].includes(test_id)) await storage.deleteTokens();
    const result = { test_id, passed, duration_ms: Date.now() - started_at, detail };
    console.info(`[AUTH-DEBUG][${test_id}][${passed ? 'PASS' : 'FAIL'}]`, result);
    return result;
  } catch (error) {
    // Do not log raw errors or backend response bodies. Session logs above contain diagnostic data only.
    const error_code = typeof error === 'object' && error !== null && 'code' in error ? String(error.code) : 'UNEXPECTED_ERROR';
    const result = { test_id, passed: false, duration_ms: Date.now() - started_at, detail: 'Storage operation failed: ' + error_code };
    console.info(`[AUTH-DEBUG][${test_id}][FAIL]`, result);
    return result;
  }
}
