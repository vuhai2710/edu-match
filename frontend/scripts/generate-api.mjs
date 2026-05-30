import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const workspaceRoot = resolve(__dirname, '..');
const outputPath = resolve(workspaceRoot, 'artifacts', 'openapi.json');
const swaggerUrl =
  process.env.EDUMATCH_SWAGGER_URL ??
  'https://localhost:7001/swagger/v1/swagger.json';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

await mkdir(dirname(outputPath), { recursive: true });

const response = await fetch(swaggerUrl, {
  headers: {
    Accept: 'application/json',
  },
});

if (!response.ok) {
  throw new Error(`Failed to fetch Swagger from ${swaggerUrl}: ${response.status}`);
}

const body = await response.text();
await writeFile(outputPath, body, 'utf8');

const command = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const result = spawnSync(command, ['ng-openapi', '-c', 'openapi.config.ts'], {
  cwd: workspaceRoot,
  stdio: 'inherit',
  shell: process.platform === 'win32',
});

if (result.status !== 0) {
  throw new Error(`ng-openapi exited with status ${result.status ?? 'unknown'}`);
}

const authServicePath = resolve(
  workspaceRoot,
  'src',
  'app',
  'api',
  'generated',
  'client',
  'services',
  'auth.service.ts',
);
const serviceIndexPath = resolve(
  workspaceRoot,
  'src',
  'app',
  'api',
  'generated',
  'client',
  'services',
  'index.ts',
);

await rm(authServicePath, { force: true });

const serviceIndex = await readFile(serviceIndexPath, 'utf8');
const sanitizedServiceIndex = serviceIndex
  .split('\n')
  .filter((line) => !line.includes('AuthService'))
  .join('\n');

await writeFile(serviceIndexPath, sanitizedServiceIndex, 'utf8');
