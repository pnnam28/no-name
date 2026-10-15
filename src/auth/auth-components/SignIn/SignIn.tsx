import { useRef, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTheme } from '@/hooks/use-theme';
import { authApi } from '../../api/auth';
import { ApiError } from '../../api/client';
import { storeSignInSession } from '../../auth/auth.store';
import type { SignInResponse } from '../../auth/auth.types';

type SignInStatus = 'idle' | 'validationError' | 'loading' | 'invalidCredentials'
  | 'unverifiedEmail' | 'serverError' | 'success';
type FieldErrors = { email?: string; password?: string };

export interface SignInProps {
  /** The parent handles navigation and context updates after the session is stored. */
  onSignedIn?: () => void;
}

function errorMessage(error: unknown): { status: SignInStatus; message: string } {
  if (error instanceof ApiError) {
    // Confirm this code with the backend; not every 403 means unverified email.
    if (error.code === 'EMAIL_NOT_VERIFIED') {
      return { status: 'unverifiedEmail', message: 'Your email is not verified. Please check your verification email.' };
    }
    if (error.status === 401) {
      return { status: 'invalidCredentials', message: 'Incorrect email or password.' };
    }
    if (error.status === 429) {
      return { status: 'serverError', message: 'Too many attempts. Please try again later.' };
    }
    if (error.status === 400 || error.status === 422) {
      return { status: 'serverError', message: 'Invalid sign-in details. Please check your information.' };
    }
    if (error.status === 403) {
      return { status: 'serverError', message: 'This account is currently not allowed to sign in.' };
    }
    return { status: 'serverError', message: 'Unable to sign in right now. Please try again later.' };
  }
  return { status: 'serverError', message: 'Unable to connect. Please check your connection and try again.' };
}

/** Validate the actual response at runtime rather than relying only on TypeScript. */
function isSignInResponse(value: unknown): value is SignInResponse {
  if (typeof value !== 'object' || value === null || !('accessToken' in value)
    || typeof value.accessToken !== 'string' || !value.accessToken.trim()) return false;
  if ('refreshToken' in value && value.refreshToken !== undefined
    && (typeof value.refreshToken !== 'string' || !value.refreshToken.trim())) return false;
  if ('user' in value && value.user !== undefined) {
    const user = value.user;
    if (typeof user !== 'object' || user === null
      || !('id' in user) || typeof user.id !== 'string'
      || !('email' in user) || typeof user.email !== 'string'
      || ('username' in user && user.username !== undefined && typeof user.username !== 'string')) return false;
  }
  return true;
}

export function SignIn({ onSignedIn }: SignInProps = {}) {
  const theme = useTheme();
  const emailInput = useRef<TextInput>(null);
  const passwordInput = useRef<TextInput>(null);
  const submissionInProgress = useRef(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [status, setStatus] = useState<SignInStatus>('idle');
  const [message, setMessage] = useState('');

  async function handleSubmit() {
    // The ref also blocks submissions before React updates the loading state.
    if (submissionInProgress.current || status === 'success') return;

    const identifier = email.trim();
    const nextErrors: FieldErrors = {};
    if (!identifier) nextErrors.email = 'Please enter your email.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier)) nextErrors.email = 'Please enter a valid email address.';
    // Do not trim passwords or apply new password rules to existing accounts.
    if (!password) nextErrors.password = 'Please enter your password.';
    setErrors(nextErrors);
    setMessage('');
    if (nextErrors.email || nextErrors.password) {
      setStatus('validationError');
      (nextErrors.email ? emailInput : passwordInput).current?.focus();
      return;
    }

    submissionInProgress.current = true;
    setStatus('loading');
    try {
      // POST /auth/sign-in: send only identifier and password.
      const response = await authApi.signIn({ identifier, password });
      if (!isSignInResponse(response)) throw new ApiError(200, 'INVALID_RESPONSE');
      storeSignInSession(response);
      setPassword('');
      setStatus('success');
      setMessage('Signed in successfully.');
    } catch (error: unknown) {
      const result = errorMessage(error);
      setStatus(result.status);
      setMessage(result.message);
      return;
    } finally {
      submissionInProgress.current = false;
    }
    // Parent navigation failures are not treated as backend sign-in failures.
    onSignedIn?.();
  }

  const disabled = status === 'loading' || status === 'success';
  const resetFeedback = () => { setErrors({}); setMessage(''); setStatus('idle'); };
  const inputStyle = [styles.input, { color: theme.text, borderColor: theme.textSecondary }];
  return (
    <KeyboardAvoidingView style={[styles.screen, { backgroundColor: theme.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
        <View style={styles.form} accessibilityState={{ busy: status === 'loading' }}>
          <Text accessibilityRole="header" style={[styles.title, { color: theme.text }]}>Sign in</Text>
          <View style={styles.field}>
            <Text style={{ color: theme.text }}>Email</Text>
            <TextInput ref={emailInput} accessibilityLabel="Email" accessibilityHint={errors.email}
              style={inputStyle} value={email} editable={!disabled}
              keyboardType="email-address" autoCapitalize="none" autoCorrect={false}
              autoComplete="username" returnKeyType="next" submitBehavior="submit"
              onSubmitEditing={() => passwordInput.current?.focus()}
              onChangeText={(value) => { setEmail(value); resetFeedback(); }} />
            {errors.email && <Text accessibilityRole="alert" style={{ color: theme.text }}>{errors.email}</Text>}
          </View>
          <View style={styles.field}>
            <Text style={{ color: theme.text }}>Password</Text>
            <TextInput ref={passwordInput} accessibilityLabel="Password" accessibilityHint={errors.password}
              style={inputStyle} value={password} editable={!disabled} secureTextEntry
              autoCapitalize="none" autoCorrect={false} autoComplete="current-password"
              returnKeyType="go" onSubmitEditing={() => { void handleSubmit(); }}
              onChangeText={(value) => { setPassword(value); resetFeedback(); }} />
            {errors.password && <Text accessibilityRole="alert" style={{ color: theme.text }}>{errors.password}</Text>}
          </View>
          <Pressable accessibilityRole="button" accessibilityState={{ disabled, busy: status === 'loading' }}
            disabled={disabled} onPress={() => { void handleSubmit(); }}
            style={({ pressed }) => [styles.button, { backgroundColor: theme.text, opacity: disabled || pressed ? 0.6 : 1 }]}>
            {status === 'loading' && <ActivityIndicator color={theme.background} />}
            <Text style={[styles.buttonText, { color: theme.background }]}>
              {status === 'loading' ? 'Signing in…' : status === 'success' ? 'Signed in' : 'Sign in'}
            </Text>
          </Pressable>
          <Text accessibilityLiveRegion="polite"
            accessibilityRole={status === 'success' || status === 'loading' || status === 'idle' ? undefined : 'alert'}
            style={{ color: theme.text }}>
            {status === 'loading' ? 'Checking your sign-in details…' : message}
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  form: { width: '100%', maxWidth: 440, alignSelf: 'center', gap: 20 },
  title: { fontSize: 32, fontWeight: '700' },
  field: { gap: 8 },
  input: { minHeight: 48, borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, fontSize: 16 },
  button: { minHeight: 48, borderRadius: 12, padding: 14, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
  buttonText: { fontSize: 16, fontWeight: '600' },
});
