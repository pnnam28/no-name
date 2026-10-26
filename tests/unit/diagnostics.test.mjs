import test from 'node:test';
import assert from 'node:assert/strict';
import { createHarness } from '../mocks/test-harness.mjs';
test('DEBUG-01 diagnostics never modify production session and never log real credentials',async()=>{
 const h=await createHarness();const original=console.info;const logs=[];console.info=(...args)=>logs.push(JSON.stringify(args));
 try{
  h.context.values.set('no-name.auth','PRIVATE_REAL_SESSION');
  const {secure_store_adapter}=await h.load('src/backend/utils/token-storage.ts');
  const {runStorageDiagnostic,debug_storage_key}=await h.load('src/debug/storage-diagnostics.ts');
  for(const id of ['availability','roundtrip','overwrite','delete','missing'])assert.equal((await runStorageDiagnostic(secure_store_adapter,id)).passed,true);
  assert.equal(h.context.values.get('no-name.auth'),'PRIVATE_REAL_SESSION');assert(!h.context.values.has(debug_storage_key));
  assert(!logs.join('').includes('PRIVATE_REAL_SESSION'));assert(logs.join('').includes('debug-access-A'));assert(logs.join('').includes('debug-refresh-A'));assert(logs.join('').includes('debug-user-001'));
  const entries=logs.map(line=>JSON.parse(line));
  assert(entries.some(entry=>entry[0].includes('[WRITE]') && entry[1].access_token==='debug-access-A' && entry[1].user_id==='debug-user-001'));
  assert(entries.some(entry=>entry[0].includes('[READ]') && entry[1].raw_value!==null));
  assert(entries.some(entry=>entry[0].includes('[DELETE]') && entry[1].raw_value===null));
  assert.equal((await runStorageDiagnostic(secure_store_adapter,'prepareRestart')).passed,true);
  assert(h.context.values.has(debug_storage_key));assert.equal((await runStorageDiagnostic(secure_store_adapter,'verifyRestart')).passed,true);
  assert(!h.context.values.has(debug_storage_key));
  h.context.failure='write';assert.equal((await runStorageDiagnostic(secure_store_adapter,'roundtrip')).passed,false);
 }finally{console.info=original;h.dispose();}
});
