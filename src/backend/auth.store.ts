import type { AuthState, SignInResponse } from './auth.types';

import {backend_url} from './config';

import {
  deleteTokens,
  loadTokens,
  saveTokens,
  TokenStorageError,
} from './utils/token-storage';


/** Initial session state; a reactive subscription mechanism has not been implemented. */
export function createInitialAuthState(): AuthState {
  return { status: 'initializing', access_token: null, user: null };
}

// Memory only: do not write tokens to localStorage or logs.
let state = createInitialAuthState();
let refresh_token: string | null = null;

const listeners = new Set<() => void>();

let operation_queue: Promise<unknown> = Promise.resolve();

let restore_operation: Promise<void> | null = null;


function enqueueAction<T> (action: () => Promise<T>,): Promise<T> {
  const operation = operation_queue.then(action);

  //A failed operation must not block every future operation
  operation_queue = operation.catch(()=>undefined);

  return operation;
  
}

function publishState(next_state: AuthState): void {
  state = next_state;

  listeners.forEach((listener) => listener());

}

export function getAuthState(): Readonly<AuthState> {
  return state;
}

export function subscribeAuth(listener: () => void,): () => void {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

export function storeSignInSession(session: SignInResponse,):Promise<void> {
  return enqueueAction(async () => {
    const next_refresh_token = session.refresh_token ?? null; //check coi la undefined, null hay la empty string

    const next_state: AuthState = {
      status:'authenticated',
      access_token: session.access_token,
      user: session.user ?? null,
    };
    //save token 
    await saveTokens({
      server_url: backend_url.replace(/\/+$/, ''),  
      access_token: session.access_token,
      refresh_token: next_refresh_token,
      user: next_state.user,
    });

    // Report success only after storage succeeds.
    refresh_token = next_refresh_token;
    publishState(next_state);
  });
}

export function restoreAuthSession(): Promise<void> {
  if (restore_operation){           // check if restore is started
    return restore_operation;
  }
  // try and catch the restore operation
  restore_operation = enqueueAction(async () => {
    let saved_session;

    try{
      saved_session = await loadTokens(
        backend_url.replace(/\/+$/, ''),
      );
    }catch (error) {
      if( !(error instanceof TokenStorageError) || 
          error.code !== 'INVALID_SESSION')
      {
        throw error;
      }

      //remove malformed or incompatible saved data
      //remove token khong hop le hoac khong tuong thich
      await deleteTokens();
      saved_session = null;
    }

    refresh_token = saved_session?.refresh_token ?? null;
    // neu phien dang nhap co ton tai
    // khoi phuc cho nguoi dung dang nhap
    if(saved_session) {
      publishState({
        status: 'authenticated',
        access_token: saved_session.access_token,
        user: saved_session.user ?? null,
      });
    } else {
      publishState({
        status: 'signedOut',
        access_token: null,
        user:null,
      });
    }
  });

  // reset the restore_operation for the retry the next time
  restore_operation.catch(() => {
    //Allow retry after a storage failure
    restore_operation = null;
  });

  return restore_operation;
}

export function getRefreshTokenInMemory(): string | null {
  return refresh_token; 
}

export function clearAuthSession(): Promise<void> {
  return enqueueAction(async () => {
    await deleteTokens();

    refresh_token = null;

    publishState({
      status: 'signedOut',
      access_token: null,
      user: null,
    });
  });
}


// export function storeSignInSession(session:SignInResponse,): Promise<void> {
//   return enqueueAction(async () => {
//     const next_refesh_token = session.refresh_token;


// }


//--------------------------------------------------------=---
// export function getAuthState(): Readonly<AuthState> { return { ...state }; }

// export function storeSignInSession(session: SignInResponse): void {
//   // The onboarding contract is unknown; do not infer email verification or profile completion.
//   state = { status: 'authenticated', access_token: session.access_token, user: session.user ?? null };
//   // If the backend uses an HttpOnly cookie, JavaScript does not read its refresh token.
//   // JSON refresh tokens are kept in memory and lost on restart; native secure storage is not implemented.
//   refresh_token = session.refresh_token ?? null;
// }

// export function getRefreshTokenInMemory(): string | null { return refresh_token; }

// export function clearAuthSession(): void {
//   state = { status: 'signedOut', access_token: null, user: null };
//   refresh_token = null;
// }
