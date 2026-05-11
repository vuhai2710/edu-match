import { access, copyFile, mkdir, writeFile } from 'node:fs/promises';
import http from 'node:http';
import https from 'node:https';
import { constants } from 'node:fs';

const outputPath = new URL('../openapi/edumatch.openapi.json', import.meta.url);
const candidates = [
  {
    label: 'https://localhost:7001/swagger/v1/swagger.json',
    url: 'https://localhost:7001/swagger/v1/swagger.json',
    client: https,
    options: { rejectUnauthorized: false }
  },
  {
    label: 'http://localhost:5001/swagger/v1/swagger.json',
    url: 'http://localhost:5001/swagger/v1/swagger.json',
    client: http,
    options: {}
  }
];
const fileFallbacks = [
  new URL('../swagger.json', import.meta.url),
  new URL('../swagger-check.json', import.meta.url)
];

function download(candidate) {
  return new Promise((resolve, reject) => {
    const request = candidate.client.get(candidate.url, candidate.options, (response) => {
      if (!response.statusCode || response.statusCode >= 400) {
        reject(new Error(`Request failed with status ${response.statusCode ?? 'unknown'}`));
        response.resume();
        return;
      }

      const chunks = [];
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    });

    request.on('error', reject);
  });
}

await mkdir(new URL('../openapi/', import.meta.url), { recursive: true });

let lastError = null;
for (const candidate of candidates) {
  try {
    const body = await download(candidate);
    JSON.parse(body);
    await writeFile(outputPath, body, 'utf8');
    console.log(`Downloaded Swagger from ${candidate.label}`);
    process.exit(0);
  } catch (error) {
    lastError = error;
    console.warn(`Failed to download Swagger from ${candidate.label}: ${error.message}`);
  }
}

for (const fileUrl of fileFallbacks) {
  try {
    await access(fileUrl, constants.R_OK);
    await copyFile(fileUrl, outputPath);
    console.log(`Copied Swagger from ${fileUrl.pathname}`);
    process.exit(0);
  } catch {
  }
}

console.error('Unable to download Swagger spec from any configured endpoint.');
if (lastError) {
  console.error(lastError);
}
process.exit(1);
