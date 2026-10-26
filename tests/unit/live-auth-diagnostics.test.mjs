import test from 'node:test';
import assert from 'node:assert/strict';
import { createHarness } from '../mocks/test-harness.mjs';
test('LIVE-01 development logs actual supplied tokens/user and verifies real-key readback without passwords',async()=>{
 const h=await createHarness();const old_info=console.info,old_clear=console.clear;const logs=[];let clears=0;console.info=(...args)=>logs.push(args);console.clear=()=>clears++;globalThis.__DEV__=true;
 try{
  const store=await h.load('src/backend/auth.store.ts');const logger=await h.load('src/debug/live-auth-diagnostics.ts');
  const response={access_token:'backend-issued-access',refresh_token:'backend-issued-refresh',user:{id:'account-42',email:'account@example.com',username:'account-user',password:'DO_NOT_LOG',password_hash:'DO_NOT_LOG_HASH'}};
  logger.logSignInResponse(response);await store.storeSignInSession(response);await logger.logSavedSession(response);
  assert.equal(clears,1);const backend=JSON.parse(logs[0][1]),saved=JSON.parse(logs[1][1]);
  assert.equal(backend.access_token,response.access_token);assert.equal(backend.refresh_token,response.refresh_token);assert.equal(backend.user.id,'account-42');
  assert.equal(saved.storage_key,'no-name.auth');assert.equal(saved.access_token,response.access_token);assert.equal(saved.user.email,response.user.email);
  for(const field of ['access_token_matches_backend','refresh_token_matches_backend','user_id_matches_backend','access_token_matches_memory','refresh_token_matches_memory'])assert.equal(saved[field],true);
  assert(!JSON.stringify(logs).includes('DO_NOT_LOG'));
  h.context.failure='read';await logger.logSavedSession(response);assert(logs.at(-1)[0].includes('READBACK_FAILED'));assert.equal(store.getAuthState().status,'authenticated');
  const before=logs.length;globalThis.__DEV__=false;logger.logSignInResponse(response);await logger.logSavedSession(response);assert.equal(logs.length,before);assert.equal(clears,1);
 }finally{console.info=old_info;console.clear=old_clear;h.dispose();}
});
