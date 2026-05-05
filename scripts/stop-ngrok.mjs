/**
 * Stops local ngrok agent(s). Use when ERR_NGROK_334 says the endpoint is already online
 * (usually a leftover ngrok.exe from another terminal or a previous run).
 */
import { execSync } from 'node:child_process';
import process from 'node:process';

function run(cmd) {
  try {
    execSync(cmd, { stdio: 'ignore' });
  } catch {
    // ignore — no process or permission
  }
}

if (process.platform === 'win32') {
  run('taskkill /F /IM ngrok.exe');
} else {
  run('pkill -x ngrok || true');
}
