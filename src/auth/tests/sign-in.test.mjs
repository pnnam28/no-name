// Compatibility launcher: authoritative mocked integration tests now live at the project root.
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const test_path = fileURLToPath(new URL('../../../tests/integration/auth-flow.test.mjs', import.meta.url));
const result = spawnSync(process.execPath, ['--test', test_path], { stdio: 'inherit' });
process.exitCode = result.status ?? 1;
