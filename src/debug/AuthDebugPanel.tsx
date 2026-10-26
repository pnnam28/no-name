import { useRef, useState } from 'react';
import { Button, Platform, ScrollView, Text, View } from 'react-native';
import { secure_store_adapter } from '../backend/utils/token-storage';
import { debug_storage_key, runStorageDiagnostic } from './storage-diagnostics';
import type { DiagnosticCase, DiagnosticResult } from './storage-diagnostics';

const diagnostic_cases: { id: DiagnosticCase; label: string }[] = [
  { id: 'availability', label: 'Check native storage' },
  { id: 'roundtrip', label: 'Save → load → compare' },
  { id: 'overwrite', label: 'Overwrite token pair' },
  { id: 'delete', label: 'Save → delete → verify' },
  { id: 'missing', label: 'Missing key / delete twice' },
  { id: 'prepareRestart', label: 'Prepare restart test' },
  { id: 'verifyRestart', label: 'Verify restart (after reopening)' },
];
export function AuthDebugPanel({ onClose }: { onClose: () => void }) {
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState<DiagnosticResult[]>([]);
  const running = useRef(false);
  if (!__DEV__) return null;
  async function runCases(ids: DiagnosticCase[]) {
    if (running.current) return;
    running.current = true; setBusy(true);
    setResults([]);
    console.clear();
    try {
      for (const id of ids) {
        const result = await runStorageDiagnostic(secure_store_adapter, id);
        setResults((previous) => [...previous.slice(-29), result]);
      }
    } finally { running.current = false; setBusy(false); }
  }
  return <ScrollView contentContainerStyle={{ padding: 24, gap: 12 }}>
    <Text accessibilityRole="header" style={{ fontSize: 24, fontWeight: '700' }}>Auth diagnostics</Text>
    <Text>Platform: {Platform.OS}. Uses fake credentials and the diagnostic key only: {debug_storage_key}.</Text>
    <Text>Native persistence requires iOS/Android. Browser storage is unsupported by the current production adapter.</Text>
    <Text>Each selection replaces the previous results and clears the console. Logs include full fake tokens, user ID and diagnostic storage values. Run safe tests first. Restart testing is separate: prepare, close the app, reopen diagnostics, then verify.</Text>
    <Button title="Close diagnostics" onPress={onClose} disabled={busy} />
    <Button title="Run safe storage tests" disabled={busy} onPress={() => { void runCases(['availability', 'roundtrip', 'overwrite', 'delete', 'missing']); }} />
    {diagnostic_cases.map((item) => <Button key={item.id} title={item.label} disabled={busy} onPress={() => { void runCases([item.id]); }} />)}
    <Button title="Clear displayed results" disabled={busy} onPress={() => { setResults([]); console.clear(); }} />
    {results.map((result, index) => <View key={index} style={{ padding: 10, backgroundColor: result.passed ? '#e6f4ea' : '#fce8e6' }}>
      <Text accessibilityLiveRegion="polite">{result.passed ? 'PASS' : 'FAIL'} · {result.test_id} · {result.duration_ms} ms</Text>
      <Text>{result.detail}</Text>
    </View>)}
  </ScrollView>;
}
