import { useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SignIn, SignUp } from '@/auth';
import { configureApi, ApiError } from '@/backend/api/client';
import { auth_api } from '@/backend/api/auth';
import { clearAuthSession } from '@/backend/auth.store';
import { backend_url } from '@/backend/config';
import { useTheme } from '@/hooks/use-theme';

import {useAuthSession,} from '@/backend/AuthProvider';
import {TokenStorageError,} from '@/backend/utils/token-storage';


configureApi(backend_url);

export default function FrontendScreen() {
  const theme = useTheme();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const session = useAuthSession();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [signup_email, setSignupEmail] = useState('');
  const logout_lock = useRef(false);
  const signed_in = session.status === 'authenticated';

  async function logout() {
    if (logout_lock.current) return;
    logout_lock.current = true; setBusy(true); setMessage('');
    try {
      await auth_api.signOut();
      await clearAuthSession(); 
      setMessage('You have signed out.');
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        try{
          await clearAuthSession();
          setMessage('Your session expired. Please sign in again.');
        }catch {
          setMessage('Unable to remove your saved session. Please retry logout.',);
        }
      } else if (error instanceof TokenStorageError){
        // Ngu du v troi ???? logout server maf ko xoa duoc session ???
        setMessage('The server signed out, but this device could not remove the saved session. Please retry logout.');
      } else {
        setMessage('Unable to confirm logout. Please try again.');
      }
      } finally 
      { 
        logout_lock.current = false; 
        setBusy(false); 
      }
  }

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Text accessibilityRole="header" style={[styles.title, { color: theme.text }]}>{signed_in ? 'Your account' : 'Welcome'}</Text>
        {!signed_in && <View style={styles.tabs}>
          {(['signin', 'signup'] as const).map((item) => (
            <Pressable key={item} accessibilityRole="button" accessibilityState={{ selected: mode === item, disabled: busy }}
              disabled={busy} onPress={() => { setMode(item); setMessage(''); }}
              style={[styles.tab, { borderColor: theme.text_secondary, backgroundColor: mode === item ? theme.background_selected : theme.background }]}>
              <Text style={{ color: theme.text }}>{item === 'signin' ? 'Sign in' : 'Sign up'}</Text>
            </Pressable>
          ))}
        </View>}
        {!!message && <Text accessibilityLiveRegion="polite" style={{ color: theme.text }}>{message}</Text>}
      </View>
      {signed_in ? <View style={styles.account}>
        <Text style={[styles.title, { color: theme.text }]}>You are signed in</Text>
        {!!session.user?.email && <Text style={{ color: theme.text }}>{session.user.email}</Text>}
        <Pressable accessibilityRole="button" accessibilityState={{ disabled: busy, busy }} disabled={busy}
          onPress={() => { void logout(); }} style={[styles.button, { backgroundColor: theme.text, opacity: busy ? 0.6 : 1 }]}>
          {busy && <ActivityIndicator color={theme.background} />}
          <Text style={{ color: theme.background }}>{busy ? 'Logging out…' : 'Log out'}</Text>
        </Pressable>
      </View> : mode === 'signin'
        ? <SignIn initial_email={signup_email} onSignedIn={() => { setMessage(''); }} onBusyChange={setBusy} />
        : <SignUp onBusyChange={setBusy} onSignedUp={(email) => {
            setSignupEmail(email); setMode('signin');
            setMessage('Account created. Verify your email if required, then sign in.');
          }} />}
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  screen: { flex: 1 }, header: { padding: 24, gap: 16, width: '100%', maxWidth: 520, alignSelf: 'center' },
  title: { fontSize: 28, fontWeight: '700' }, tabs: { flexDirection: 'row', gap: 12 },
  tab: { flex: 1, minHeight: 48, borderWidth: 1, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  account: { padding: 24, gap: 20, width: '100%', maxWidth: 480, alignSelf: 'center' },
  button: { minHeight: 48, padding: 14, borderRadius: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
});
