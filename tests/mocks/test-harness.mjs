import { readFile, access } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
const source_root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const dependency_root = process.env.AUTH_TEST_DEPENDENCY_ROOT || source_root;
const require = createRequire(path.join(dependency_root, 'package.json'));
const ts = require('typescript');
let sequence = 0;
globalThis.__auth_test_contexts ??= new Map();
export async function createHarness({ simulate_effects = false } = {}) {
  const id = `${process.pid}-${Date.now()}-${sequence++}`;
  const context = { values: new Map(), calls: [], failure: '', available: true, fetch: async () => new Response('{}'), os: 'ios', states: [], effects: [], cursor: 0 };
  globalThis.__auth_test_contexts.set(id, context);
  const prefix = `const context = globalThis.__auth_test_contexts.get(${JSON.stringify(id)});
`;
  const dataUrl = text => 'data:text/javascript;base64,' + Buffer.from(text + `
// ${id}`).toString('base64');
  const react_url = pathToFileURL(require.resolve('react')).href;
  const hooks_url = dataUrl(prefix + `
    export function useState(initial) { const index = context.cursor++; if (!(index in context.states)) context.states[index] = typeof initial === 'function' ? initial() : initial; return [context.states[index], next => { context.states[index] = typeof next === 'function' ? next(context.states[index]) : next; }]; }
    export function useRef(initial) { const [reference] = useState(() => ({current:initial})); return reference; }
    export function useEffect(effect) { context.effects.push(effect); }
    export function useSyncExternalStore(subscribe, getSnapshot) { return getSnapshot(); }
  `);
  const secure_url = dataUrl(prefix + `
    export const WHEN_UNLOCKED_THIS_DEVICE_ONLY = 'device-only';
    export async function isAvailableAsync() { return context.available; }
    export async function getItemAsync(key) { context.calls.push(['read', key]); if(context.failure === 'read') throw Error('simulated'); return context.values.get(key) ?? null; }
    export async function setItemAsync(key, value) { context.calls.push(['write', key]); if(context.failure === 'write') throw Error('simulated'); context.values.set(key,value); }
    export async function deleteItemAsync(key) { context.calls.push(['delete', key]); if(context.failure === 'delete') throw Error('simulated'); context.values.delete(key); }
  `);
  const native_url = dataUrl(prefix + `
    import React from ${JSON.stringify(react_url)};
    const box = ({children}) => React.createElement('div', null, children);
    export const View = box, ScrollView = box, SafeAreaView = box, KeyboardAvoidingView = box;
    export const Text = ({children}) => React.createElement('span', null, children);
    export const Pressable = ({children, disabled}) => React.createElement('button', {disabled}, children);
    export const TextInput = ({value, accessibilityLabel, editable}) => React.createElement('input', {defaultValue:value, 'aria-label':accessibilityLabel, disabled:editable===false});
    export const Button = ({title, disabled}) => React.createElement('button',{disabled},title);
    export const Modal = ({visible, children}) => visible ? children : null;
    export const ActivityIndicator = () => React.createElement('span', null, 'Loading');
    export const StyleSheet = {create: value => value};
    export const Platform = {get OS(){return context.os;}};
  `);
  const config_url = dataUrl("export const backend_url = 'https://backend.example';");
  const theme_url = dataUrl("export function useTheme(){ return {text:'#000',text_secondary:'#666',background:'#fff',background_selected:'#ddd'}; }");
  const cache = new Map();
  async function exists(file) { try { await access(file); return true; } catch { return false; } }
  async function resolveFile(file) {
    for (const suffix of ['', '.ts', '.tsx', '.mjs', '/index.ts']) {
      const candidate = file + suffix;
      if (await exists(candidate)) {
        // Directories are skipped; resolve index explicitly below.
        try { await readFile(candidate); return candidate; } catch {}
      }
    }
    throw Error('Cannot resolve source module: ' + file);
  }
  async function moduleUrl(file) {
    const relative = path.relative(source_root, file).replaceAll('\\','/');
    if (relative === 'src/backend/config.ts') return config_url;
    if (relative === 'src/hooks/use-theme.ts') return theme_url;
    if (cache.has(file)) return cache.get(file);
    let text;
    try { text = await readFile(file,'utf8'); }
    catch { text = await readFile(path.join(dependency_root,relative),'utf8'); }
    text = ts.transpileModule(text,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext,jsx:ts.JsxEmit.ReactJSX}}).outputText;
    const matches = [...text.matchAll(/(?:from\s+|import\s*)['"]([^'"]+)['"]/g)];
    for (const match of matches.reverse()) {
      const specifier = match[1]; let target;
      if (specifier === 'react' && simulate_effects && ['src/backend/AuthProvider.tsx', 'src/debug/AuthDebugPanel.tsx'].includes(relative)) target = hooks_url;
      else if (specifier === 'expo-secure-store') target = secure_url;
      else if (specifier === 'react-native' || specifier === 'react-native-safe-area-context') target = native_url;
      else if (specifier.startsWith('.') || specifier.startsWith('@/')) {
        const base = specifier.startsWith('@/') ? path.join(source_root,'src',specifier.slice(2)) : path.resolve(path.dirname(file),specifier);
        let resolved;
        try { resolved = await resolveFile(base); }
        catch { const rel = path.relative(source_root,base); const actual = await resolveFile(path.join(dependency_root,rel)); resolved = path.join(source_root,path.relative(dependency_root,actual)); }
        target = await moduleUrl(resolved);
      } else target = pathToFileURL(require.resolve(specifier)).href;
      const start = match.index + match[0].indexOf(specifier);
      text = text.slice(0,start)+target+text.slice(start+specifier.length);
    }
    // Requests use isolated per-test networking, not the real backend.
    if (relative === 'src/backend/api/client.ts') text = prefix + text.replace(/\bfetch\(/g,'context.fetch(');
    const url = dataUrl(text); cache.set(file,url); return url;
  }
  async function load(relative) { return import(await moduleUrl(path.join(source_root,relative))); }
  async function source(relative) { try { return await readFile(path.join(source_root,relative),'utf8'); } catch { return readFile(path.join(dependency_root,relative),'utf8'); } }
  return { context, load, source, react: require('react'), render: require('react-dom/server').renderToStaticMarkup,
    dispose: () => globalThis.__auth_test_contexts.delete(id) };
}
