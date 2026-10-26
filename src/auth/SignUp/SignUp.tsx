import { useRef, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTheme } from '@/hooks/use-theme';
import { auth_api } from '../../backend/api/auth';
import { ApiError } from '../../backend/api/client';

export function SignUp({ onBusyChange, onSignedUp }: { onBusyChange?: (busy: boolean) => void; onSignedUp?: (email: string) => void } = {}) {
  const theme = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [complete, setComplete] = useState(false);
  const [message, setMessage] = useState('');
  const lock = useRef(false);
  async function submit() {
    if (lock.current || complete) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setMessage('Enter a valid email address.'); return; }
    if (!password) { setMessage('Enter a password.'); return; }
    if (password !== confirm) { setMessage('Passwords do not match.'); return; }
    lock.current = true; setBusy(true); onBusyChange?.(true); setMessage('');
    let registration_succeeded = false;
    try {
      await auth_api.signUp({ email: email.trim(), password });
      setPassword(''); setConfirm(''); setComplete(true);
      registration_succeeded = true;
      setMessage('Account created. Check your email if verification is required, then use Sign in.');
    } catch (error) {
      setMessage(error instanceof ApiError
        ? error.status === 409 ? 'This email is already registered.'
          : error.status === 429 ? 'Too many attempts. Try again later.'
          : error.status === 400 || error.status === 422 ? 'Registration was rejected. Check your email and the server’s password requirements.'
          : 'Unable to create your account. Please try again.'
        : 'Unable to connect. Check your connection and try again.');
    } finally { lock.current = false; setBusy(false); onBusyChange?.(false); }
    if (registration_succeeded) onSignedUp?.(email.trim());
  }
  const disabled = busy || complete;
  const input_style = [styles.input, { color: theme.text, borderColor: theme.text_secondary }];
  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: theme.background }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.form}>
          <Text accessibilityRole="header" style={[styles.title, { color: theme.text }]}>Create account</Text>
          <Text style={{ color: theme.text_secondary }}>Enter your email and choose a password to create an account.</Text>
          <Text style={{ color: theme.text }}>Email</Text>
          <TextInput accessibilityLabel="Email" style={input_style} value={email} onChangeText={setEmail} editable={!disabled}
            keyboardType="email-address" autoCapitalize="none" autoCorrect={false} autoComplete="email" />
          <Text style={{ color: theme.text }}>Password</Text>
          <TextInput accessibilityLabel="Password" style={input_style} value={password} onChangeText={setPassword}
            editable={!disabled} secureTextEntry autoCapitalize="none" autoCorrect={false} autoComplete="new-password" />
          <Text style={{ color: theme.text }}>Confirm password</Text>
          <TextInput accessibilityLabel="Confirm password" style={input_style} value={confirm} onChangeText={setConfirm}
            editable={!disabled} secureTextEntry autoCapitalize="none" autoCorrect={false} autoComplete="new-password"
            returnKeyType="go" onSubmitEditing={() => { void submit(); }} />
          <Pressable accessibilityRole="button" accessibilityState={{ disabled, busy }} disabled={disabled}
            onPress={() => { void submit(); }} style={[styles.button, { backgroundColor: theme.text, opacity: disabled ? 0.6 : 1 }]}>
            {busy && <ActivityIndicator color={theme.background} />}
            <Text style={{ color: theme.background, fontWeight: '600' }}>{busy ? 'Creating account…' : complete ? 'Account created' : 'Sign up'}</Text>
          </Pressable>
          <Text accessibilityLiveRegion="polite" style={{ color: theme.text }}>{message}</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
const styles = StyleSheet.create({
  content: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  form: { width: '100%', maxWidth: 440, alignSelf: 'center', gap: 12 },
  title: { fontSize: 30, fontWeight: '700' },
  input: { minHeight: 48, borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, fontSize: 16 },
  button: { minHeight: 48, borderRadius: 12, padding: 14, flexDirection: 'row', justifyContent: 'center', gap: 8 },
});
