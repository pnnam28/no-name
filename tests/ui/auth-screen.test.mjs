import test from 'node:test';
import assert from 'node:assert/strict';
import { createHarness } from '../mocks/test-harness.mjs';
// Real React server rendering with native host shims: content smoke checks, not device interaction tests.
for(const [name,action]of[
 ['UI-01 signin renders labeled fields and action',async h=>{const {SignIn}=await h.load('src/auth/SignIn/SignIn.tsx');const html=h.render(h.react.createElement(SignIn,{initial_email:'test@example.com'}));assert(html.includes('aria-label="Email"'));assert(html.includes('aria-label="Password"'));assert(html.includes('test@example.com'));assert(html.includes('Sign in'));}],
 ['UI-02 signup renders confirmation field',async h=>{const {SignUp}=await h.load('src/auth/SignUp/SignUp.tsx');const html=h.render(h.react.createElement(SignUp));assert(html.includes('Confirm password'));assert(html.includes('Sign up'));}],
 ['UI-03 provider shows startup loading',async h=>{const {AuthProvider}=await h.load('src/backend/AuthProvider.tsx');const html=h.render(h.react.createElement(AuthProvider,null,'APP_CONTENT'));assert(html.includes('Restoring session'));assert(!html.includes('APP_CONTENT'));}],
 ['UI-04 provider renders children after successful restoration',async h=>{const store=await h.load('src/backend/auth.store.ts');await store.restoreAuthSession();const {AuthProvider}=await h.load('src/backend/AuthProvider.tsx');const html=h.render(h.react.createElement(AuthProvider,null,'APP_CONTENT'));assert(html.includes('APP_CONTENT'));assert(!html.includes('Unable to read'));}],
 ['UI-06 debug panel is hidden in release mode',async h=>{globalThis.__DEV__=false;const {AuthDebugPanel}=await h.load('src/debug/AuthDebugPanel.tsx');assert.equal(h.render(h.react.createElement(AuthDebugPanel,{onClose(){}})),'');}],
 ['UI-07 debug panel shows isolated storage actions',async h=>{globalThis.__DEV__=true;const {AuthDebugPanel}=await h.load('src/debug/AuthDebugPanel.tsx');const html=h.render(h.react.createElement(AuthDebugPanel,{onClose(){}}));assert(html.includes('no-name.debug.auth.v1'));assert(html.includes('Verify restart'));assert(html.includes('Run safe storage tests'));}],
])test(name,async()=>{const h=await createHarness();try{await action(h);}finally{h.dispose();}});

test('UI-05 provider shows Retry after a read error, and retry reaches children',async()=>{
 const h=await createHarness({simulate_effects:true});
 try {
  h.context.failure='read';
  const {AuthProvider}=await h.load('src/backend/AuthProvider.tsx');
  function renderProvider(){h.context.cursor=0;h.context.effects=[];return AuthProvider({children:'APP_CONTENT'});}
  let tree=renderProvider();assert(h.render(tree).includes('Restoring session'));
  h.context.effects[0]();await new Promise(resolve=>setImmediate(resolve));
  tree=renderProvider();const error_html=h.render(tree);assert(error_html.includes('Unable to read'));assert(error_html.includes('Retry'));
  function findRetry(node){if(!node||typeof node!=='object')return null;if(node.props?.title==='Retry')return node;for(const child of [node.props?.children].flat(Infinity)){const found=findRetry(child);if(found)return found;}return null;}
  const retry=findRetry(tree);assert(retry);h.context.failure='';retry.props.onPress();
  renderProvider();h.context.effects[0]();await new Promise(resolve=>setImmediate(resolve));
  tree=renderProvider();assert.equal(h.render(tree),'APP_CONTENT');
 }finally{h.dispose();}
});

test('UI-08 selecting a diagnostic replaces previous results and clears the console',async()=>{
 const h=await createHarness({simulate_effects:true});const original_info=console.info,original_clear=console.clear;let clears=0;
 console.info=()=>{};console.clear=()=>{clears++;};globalThis.__DEV__=true;
 try{
  const {AuthDebugPanel}=await h.load('src/debug/AuthDebugPanel.tsx');
  function panel(){h.context.cursor=0;return AuthDebugPanel({onClose(){}});}
  function findButton(node,title){if(!node||typeof node!=='object')return null;if(node.props?.title===title)return node;for(const child of [node.props?.children].flat(Infinity)){const found=findButton(child,title);if(found)return found;}return null;}
  let tree=panel();findButton(tree,'Save → load → compare').props.onPress();
  await new Promise(resolve=>setImmediate(resolve));
  assert.equal(h.context.states[1].length,1);assert.equal(h.context.states[1][0].test_id,'roundtrip');
  tree=panel();findButton(tree,'Save → delete → verify').props.onPress();
  assert.deepEqual(h.context.states[1],[]);
  await new Promise(resolve=>setImmediate(resolve));
  assert.equal(h.context.states[1].length,1);assert.equal(h.context.states[1][0].test_id,'delete');assert.equal(clears,2);
  tree=panel();findButton(tree,'Clear displayed results').props.onPress();assert.deepEqual(h.context.states[1],[]);assert.equal(clears,3);
 }finally{console.info=original_info;console.clear=original_clear;h.dispose();}
});
