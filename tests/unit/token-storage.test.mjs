import test from 'node:test';
import assert from 'node:assert/strict';
import { createHarness } from '../mocks/test-harness.mjs';
const sample = {server_url:'https://backend.example',access_token:'fake-access',refresh_token:'fake-refresh',user:null};
async function setup() { const h=await createHarness(); const core=await h.load('src/backend/utils/token-storage.core.ts'); return {...h,core,storage:core.createTokenStorage({isAvailable:async()=>h.context.available,getItem:async key=>{if(h.context.failure==='read')throw Error();return h.context.values.get(key)??null;},setItem:async(key,value)=>{if(h.context.failure==='write')throw Error();h.context.values.set(key,value);},deleteItem:async key=>{if(h.context.failure==='delete')throw Error();h.context.values.delete(key);}},'test.auth')}; }
for(const [name,action] of [
 ['STORAGE-01 save/load matches all fields',async h=>{await h.storage.saveTokens(sample);assert.deepEqual(await h.storage.loadTokens(sample.server_url),sample);}],
 ['STORAGE-02 overwrite replaces both tokens',async h=>{await h.storage.saveTokens(sample);const next={...sample,access_token:'next-access',refresh_token:'next-refresh'};await h.storage.saveTokens(next);assert.deepEqual(await h.storage.loadTokens(sample.server_url),next);}],
 ['STORAGE-03 delete and repeated delete',async h=>{await h.storage.saveTokens(sample);await h.storage.deleteTokens();await h.storage.deleteTokens();assert.equal(await h.storage.loadTokens(sample.server_url),null);}],
 ['STORAGE-04 missing key',async h=>{assert.equal(await h.storage.loadTokens(sample.server_url),null);}],
 ['STORAGE-05 malformed JSON',async h=>{h.context.values.set('test.auth','{bad');await assert.rejects(h.storage.loadTokens(sample.server_url),e=>e.code==='INVALID_SESSION');}],
 ['STORAGE-06 rejects invalid fields',async h=>{for(const bad of [{...sample,access_token:''},{...sample,refresh_token:123},{...sample,user:{id:1,email:'x'}},{...sample,server_url:'relative'}])await assert.rejects(h.storage.saveTokens(bad),e=>e.code==='INVALID_SESSION');assert.equal(h.context.values.size,0);}],
 ['STORAGE-07 optional fields may be omitted',async h=>{const value={server_url:sample.server_url,access_token:sample.access_token};await h.storage.saveTokens(value);assert.deepEqual(await h.storage.loadTokens(sample.server_url),value);}],
 ['STORAGE-08 server isolation',async h=>{await h.storage.saveTokens(sample);assert.equal(await h.storage.loadTokens('https://other.example'),null);}],
 ['STORAGE-09 adapter unavailable',async h=>{h.context.available=false;await assert.rejects(h.storage.saveTokens(sample),e=>e.code==='UNAVAILABLE');await assert.rejects(h.storage.loadTokens(sample.server_url),e=>e.code==='UNAVAILABLE');await assert.rejects(h.storage.deleteTokens(),e=>e.code==='UNAVAILABLE');}],
 ['STORAGE-10 read failure',async h=>{h.context.failure='read';await assert.rejects(h.storage.loadTokens(sample.server_url),e=>e.code==='READ_FAILED');}],
 ['STORAGE-11 write failure',async h=>{h.context.failure='write';await assert.rejects(h.storage.saveTokens(sample),e=>e.code==='WRITE_FAILED');}],
 ['STORAGE-12 delete failure',async h=>{h.context.failure='delete';await assert.rejects(h.storage.deleteTokens(),e=>e.code==='DELETE_FAILED');}],
 ['STORAGE-13 default native adapter keeps production key',async h=>{const native=await h.load('src/backend/utils/token-storage.ts');await native.saveTokens(sample);assert(h.context.values.has('no-name.auth'));assert.deepEqual(await native.loadTokens(sample.server_url),sample);await native.deleteTokens();assert.equal(h.context.values.size,0);}],
]) test(name,async()=>{const h=await setup();try{await action(h);}finally{h.dispose();}});
