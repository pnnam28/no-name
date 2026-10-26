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

configureApi(backend_url);

export function useAuthSession(){
    return useSyncExternalStore(subscribeAuth, getAuthState, getAuthState);
}

export function AuthProvider({children}: PropsWithChildren) {
    const theme = useTheme();

    const session = useAuthSession();
    
    const [storage_error, setStorageError] = useState(false);
    const [attempt, setAttempt] = useState(0);

    useEffect(() => {
        let active = true;

        void restoreAuthSession().catch(() => {
            if(active){
                setStorageError(true);
            }
        });

        return () => { active = false; };
    }, [attempt]);
    
    if ( storage_error || session.status === 'initializing' ){
       
        return (
        <View
            style={[
            styles.loading,
            { backgroundColor: theme.background },
            ]}
        >
            {storage_error ? (
            <>
                <Text style={{ color: theme.text }}>
                Unable to read your saved session.
                Unlock your device and retry.
                </Text>

                <Button
                title="Retry"
                onPress={() => {
                    setStorageError(false);
                    setAttempt((value) => value + 1);
                }}
                />
            </>
            ) : (
            <>
                <ActivityIndicator color={theme.text} />

                <Text style={{ color: theme.text }}>
                Restoring session…
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
