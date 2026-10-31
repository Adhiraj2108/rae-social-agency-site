import { spawn } from 'node:child_process';
import { createConnection } from 'node:net';
import { setTimeout as delay } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const children = new Set();
let stopping = false;

function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  process.exitCode = code;
  for (const child of children) child.kill('SIGTERM');
  // A stalled child must not leave a development server running after this command stops.
  const timeout = setTimeout(() => {
    for (const child of children) child.kill('SIGKILL');
  }, 5000);
  timeout.unref();
}

process.on('SIGINT', () => stop());
process.on('SIGTERM', () => stop());

function start(script, args, cwd, env = {}) {
  const child = spawn(process.execPath, [script, ...args], {
    cwd, env: { ...process.env, ...env }, stdio: 'inherit',
  });
  children.add(child);
  child.on('error', (error) => {
    console.error(error.message);
    stop(1);
  });
  child.on('exit', (code, signal) => {
    children.delete(child);
    if (!stopping) stop(code ?? (signal ? 1 : 0));
  });
  return child;
}

function portInUse(port, host) {
  return new Promise((resolve) => {
    const socket = createConnection({ port, host });
    socket.setTimeout(1000);
    socket.once('connect', () => { socket.destroy(); resolve(true); });
    socket.once('error', () => { socket.destroy(); resolve(false); });
    socket.once('timeout', () => { socket.destroy(); resolve(true); });
  });
}

async function main() {
  const [websiteRunning, studioRunning] = await Promise.all([
    portInUse(4321, 'localhost'), portInUse(3333, '127.0.0.1'),
  ]);
  if (websiteRunning && studioRunning) {
    try {
      const [website, studio] = await Promise.all([
        fetch('http://localhost:4321/', { signal: AbortSignal.timeout(3000) }).then(r => r.text()),
        fetch('http://localhost:4321/studio/', { signal: AbortSignal.timeout(3000) }).then(r => r.text()),
      ]);
      if (website.includes('data-wf-site="6abe0e27763529229eb860de"') && studio.includes('/studio/.sanity/runtime/app.js')) {
        console.log('The Rae preview is already running.\nWebsite: http://localhost:4321\nStudio:  http://localhost:4321/studio\nTo restart it, press Ctrl+C in its original terminal first.');
        return;
      }
    } catch { /* Report the occupied ports below if this is not a healthy Rae preview. */ }
  }
  if (websiteRunning || studioRunning) {
    const ports = [websiteRunning && 4321, studioRunning && 3333].filter(Boolean).join(' and ');
    throw new Error(`Port ${ports} is already in use. Stop the existing preview with Ctrl+C in its original terminal, then run npm run dev again.`);
  }
  const studio = start(`${root}studio/node_modules/sanity/bin/sanity`, ['dev'], `${root}studio`, {
    RAE_STUDIO_PROXY_PORT: '4321',
  });
  // Start the website only when the Studio proxy target is ready.
  for (let attempt = 0; attempt < 120; attempt++) {
    if (stopping || studio.exitCode !== null) return;
    try {
      const response = await fetch('http://127.0.0.1:3333/studio/', {
        signal: AbortSignal.timeout(1000),
      });
      await response.body?.cancel();
      if (response.ok) {
        if (stopping) return;
        start(`${root}node_modules/astro/bin/astro.mjs`, ['dev', '--ignore-lock'], root);
        console.log('\nWebsite: http://localhost:4321\nStudio:  http://localhost:4321/studio\n');
        return;
      }
    } catch { /* Studio is still starting. */ }
    await delay(500);
  }
  console.error('Sanity Studio did not start. Check the Studio output above.');
  stop(1);
}

main().catch((error) => {
  console.error(error);
  stop(1);
});
