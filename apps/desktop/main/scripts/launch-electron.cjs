const { spawn } = require('child_process');

const electronBinaryPath = require('electron');

const [, , appPath = '.', devServerUrl] = process.argv;

const env = { ...process.env };
delete env.ELECTRON_RUN_AS_NODE;

if (devServerUrl) {
  env.VITE_DEV_SERVER_URL = devServerUrl;
}

const child = spawn(electronBinaryPath, [appPath], {
  stdio: 'inherit',
  env,
  windowsHide: false,
});

let didExit = false;

child.on('close', (code, signal) => {
  didExit = true;

  if (code === null) {
    console.error(`Electron exited with signal ${signal}`);
    process.exit(1);
  }

  process.exit(code);
});

const forwardSignal = (signal) => {
  process.on(signal, () => {
    if (!didExit) {
      child.kill(signal);
    }
  });
};

forwardSignal('SIGINT');
forwardSignal('SIGTERM');
forwardSignal('SIGUSR2');
