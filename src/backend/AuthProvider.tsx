/* AuthProvider.tsx khôi phục phiên đăng nhập đã lưu khi mở app và hiển thị loading 
trong lúc chờ. Nó giúp giao diện theo dõi trạng thái trong auth.store để cập nhật 
khi đăng nhập hoặc đăng xuất. Nó không kiểm tra mật khẩu hay xác nhận token còn hiệu lực; 
backend server chịu trách nhiệm đó. */

import {
    useEffect,
    useState,
    useSyncExternalStore,
} from 'react';

import type {PropsWithChildren} from 'react';

import {
    ActivityIndicator,
    Button,
    StyleSheet,
    Text,
    View,
}   from 'react-native';

import { useTheme } from '@/hooks/use-theme';

import {configureApi} from './api/client';

import {backend_url} from './config';

import {
    getAuthState,
    restoreAuthSession,
    subscribeAuth,
} from './auth.store';

import { auth_api } from './api/auth';

import {
  ApiError,
} from './api/client';

import {
  clearAuthSession,
} from './auth.store';

import {
  TokenStorageError,
} from './utils/token-storage';


configureApi(backend_url);

export function useAuthSession(){
    return useSyncExternalStore(subscribeAuth, getAuthState, getAuthState);
}

export function AuthProvider({
  children,
}: PropsWithChildren) {
  const theme = useTheme();
  const session = useAuthSession();

  const [ready, setReady] = useState(false);
  const [error_message, setErrorMessage] =
    useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;

    async function initialize() {
      try {
        await restoreAuthSession();

        if (
          getAuthState().status === 'authenticated'
        ) {
          const result =
            await auth_api.signInViaToken();

          if (
            typeof result?.user_id !== 'string' ||
            !result.user_id.trim()
          ) {
            throw new ApiError(
              502,
              'INVALID_VALIDATION_RESPONSE',
            );
          }

          const saved_user = getAuthState().user;

          if (
            saved_user &&
            saved_user.id !== result.user_id
          ) {
            throw new ApiError(
              502,
              'SESSION_IDENTITY_MISMATCH',
            );
          }
        }

        if (active) {
          setReady(true);
        }
      } catch (error) {
        const message =
          error instanceof TokenStorageError
            ? 'Unable to read or save credentials. Unlock your device and retry.'
            : error instanceof ApiError &&
                (
                  error.code === 'REFRESH_REJECTED' ||
                  error.code === 'NO_REFRESH_TOKEN'
                )
              ? 'Your saved session cannot be renewed. Please sign in again.'
              : 'Unable to verify the session. Check your connection and retry.';

        if (active) {
          setErrorMessage(message);
        }
      }
    }

    void initialize();

    return () => {
      active = false;
    };
  }, [attempt]);

  async function signInAgain() {
    try {
      await clearAuthSession();
      setErrorMessage(null);
      setReady(true);
    } catch {
      setErrorMessage(
        'Unable to clear saved credentials. Unlock your device and retry.',
      );
    }
  }

  if (
    !ready ||
    session.status === 'initializing'
  ) {
    return (
      <View
        style={[
          styles.loading,
          { backgroundColor: theme.background },
        ]}
      >
        {error_message ? (
          <>
            <Text
              accessibilityLiveRegion="polite"
              style={{ color: theme.text }}
            >
              {error_message}
            </Text>

            <Button
              title="Retry"
              onPress={() => {
                setErrorMessage(null);
                setAttempt((value) => value + 1);
              }}
            />

            <Button
              title="Clear saved session and sign in"
              onPress={() => {
                void signInAgain();
              }}
            />
          </>
        ) : (
          <>
            <ActivityIndicator color={theme.text} />

            <Text style={{ color: theme.text }}>
              {session.session_activity === 'refreshing'
                ? 'Renewing session…'
                : 'Checking session…'}
            </Text>
          </>
        )}
      </View>
    );
  }

  return children;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 16,
  },
});
