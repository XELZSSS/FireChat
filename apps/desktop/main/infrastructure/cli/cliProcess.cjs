/* global process, setTimeout */
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const WINDOWS_EXECUTABLE_EXTENSIONS = ['.exe', '.cmd', '.bat', '.com'];
const WINDOWS_CMD_EXTENSIONS = new Set(['.cmd', '.bat']);
const WINDOWS_CMD_META_CHARS = /([()\][%!^"`<>&|;, *?])/g;

const stripWrappingQuotes = (value) => {
  const trimmed = String(value ?? '').trim();
  const quote = trimmed[0];
  if ((quote === '"' || quote === "'") && trimmed.endsWith(quote)) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
};

const resolveWorkingDirectory = (value) => {
  const trimmed = String(value ?? '').trim();
  if (!trimmed) {
    return process.cwd();
  }
  if (!fs.existsSync(trimmed)) {
    throw new Error(`Working directory does not exist: ${trimmed}`);
  }
  if (!fs.statSync(trimmed).isDirectory()) {
    throw new Error(`Working directory is not a directory: ${trimmed}`);
  }
  return trimmed;
};

const hasDirectorySegment = (command) =>
  path.isAbsolute(command) || command.includes('/') || command.includes('\\');

const isFile = (candidate) => {
  try {
    return fs.statSync(candidate).isFile();
  } catch {
    return false;
  }
};

const resolveWindowsExecutable = (command, cwd) => {
  const normalizedCommand = path.normalize(stripWrappingQuotes(command));
  if (!normalizedCommand) {
    throw new Error('CLI command is required.');
  }

  const extension = path.extname(normalizedCommand);
  const extensions = extension ? [''] : WINDOWS_EXECUTABLE_EXTENSIONS;

  if (hasDirectorySegment(normalizedCommand)) {
    const basePath = path.isAbsolute(normalizedCommand)
      ? normalizedCommand
      : path.resolve(cwd ?? process.cwd(), normalizedCommand);
    const executable = extensions.map((item) => `${basePath}${item}`).find(isFile);
    if (!executable) {
      throw new Error(`CLI command not found: ${command}`);
    }
    return executable;
  }

  const pathValue = process.env.Path ?? process.env.PATH ?? '';
  for (const entry of pathValue.split(path.delimiter).filter(Boolean)) {
    const directory = stripWrappingQuotes(entry);
    const executable = extensions
      .map((item) => path.join(directory, `${normalizedCommand}${item}`))
      .find(isFile);
    if (executable) {
      return executable;
    }
  }

  throw new Error(`CLI command not found: ${command}`);
};

const escapeWindowsCmdCommand = (value) => String(value).replace(WINDOWS_CMD_META_CHARS, '^$1');

const escapeWindowsCmdArgument = (value) => {
  let argument = String(value);
  argument = argument.replace(/(?=(\\+?)?)\1"/g, '$1$1\\"');
  argument = argument.replace(/(?=(\\+?)?)\1$/, '$1$1');
  return `"${argument}"`.replace(WINDOWS_CMD_META_CHARS, '^$1');
};

const resolveSpawnTarget = (command, args, cwd) => {
  if (process.platform !== 'win32') {
    return {
      command: stripWrappingQuotes(command),
      args,
      windowsVerbatimArguments: false,
    };
  }

  const executable = resolveWindowsExecutable(command, cwd);
  const extension = path.extname(executable).toLowerCase();
  if (!WINDOWS_CMD_EXTENSIONS.has(extension)) {
    return {
      command: executable,
      args,
      windowsVerbatimArguments: false,
    };
  }

  const commandLine = [
    escapeWindowsCmdCommand(executable),
    ...args.map((item) => escapeWindowsCmdArgument(item)),
  ].join(' ');

  return {
    command: process.env.ComSpec || process.env.comspec || 'cmd.exe',
    args: ['/d', '/s', '/c', `"${commandLine}"`],
    windowsVerbatimArguments: true,
  };
};

const spawnHidden = (command, args, options = {}) => {
  const target = resolveSpawnTarget(command, args, options.cwd);
  return spawn(target.command, target.args, {
    cwd: options.cwd,
    env: process.env,
    stdio: options.stdio ?? ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
    windowsVerbatimArguments: target.windowsVerbatimArguments,
  });
};

const terminateProcessTree = (child) => {
  if (!child || child.killed) {
    return;
  }
  if (process.platform === 'win32' && child.pid) {
    spawn('taskkill', ['/pid', String(child.pid), '/t', '/f'], {
      stdio: 'ignore',
      windowsHide: true,
    });
    return;
  }
  child.kill('SIGTERM');
  setTimeout(() => {
    if (!child.killed) {
      child.kill('SIGKILL');
    }
  }, 1000);
};

module.exports = {
  resolveWorkingDirectory,
  spawnHidden,
  terminateProcessTree,
};
