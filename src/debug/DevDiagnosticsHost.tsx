import { useState } from 'react';
import type { PropsWithChildren } from 'react';
import { Button, Modal, SafeAreaView } from 'react-native';
import { AuthDebugPanel } from './AuthDebugPanel';

export function DevDiagnosticsHost({ children }: PropsWithChildren) {
  const [open, setOpen] = useState(false);
  if (!__DEV__) return children;
  return <>
    {children}
    <SafeAreaView style={{ position: 'absolute', right: 12, bottom: 12 }}>
      <Button title="Auth diagnostics" onPress={() => setOpen(true)} />
    </SafeAreaView>
    <Modal visible={open} animationType="slide" onRequestClose={() => setOpen(false)}>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
        {open && <AuthDebugPanel onClose={() => setOpen(false)} />}
      </SafeAreaView>
    </Modal>
  </>;
}
