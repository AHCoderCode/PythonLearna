/* Runs CPython inside a dedicated worker so the main UI is not blocked by Python execution. */
const PYODIDE_BASE = 'https://cdn.jsdelivr.net/pyodide/v314.0.7/full/';
let pyodide = null;
let stdinQueue = [];
let stdinCharacters = [];
let isRunning = false;
let currentRunId = null;
let currentOwnerId = null;
const decoderOut = new TextDecoder();
const decoderErr = new TextDecoder();

function send(type, detail={}) { self.postMessage(Object.assign({type}, (currentRunId !== null && ['stdout','stderr'].includes(type) ? {runId:currentRunId, ownerId:currentOwnerId} : {}), detail)); }
function installStreams() {
  pyodide.setStdout({write(buffer) {
    const value = decoderOut.decode(buffer, {stream:true});
    if (value) send('stdout', {text:value});
    return buffer.length;
  }});
  pyodide.setStderr({write(buffer) {
    const value = decoderErr.decode(buffer, {stream:true});
    if (value) send('stderr', {text:value});
    return buffer.length;
  }});
}
async function initialize() {
  if (pyodide) return;
  send('state', {state:'loading', message:'Downloading and initializing Python for this browser…'});
  try {
    importScripts(PYODIDE_BASE + 'pyodide.js');
    pyodide = await loadPyodide({indexURL:PYODIDE_BASE});
    installStreams();
    const version = pyodide.runPython('import sys; sys.version.split()[0]');
    send('ready', {version, runtime:'Pyodide / CPython'});
  } catch (error) {
    pyodide = null;
    send('initError', {message:error && error.message ? error.message : String(error)});
  }
}
self.addEventListener('message', async event => {
  const message = event.data || {};
  if (message.type === 'init') { await initialize(); return; }
  if (message.type === 'run') {
    if (!pyodide) { await initialize(); if (!pyodide) return; }
    if (isRunning) { send('runError', {runId:message.runId, message:'Another program is already running.'}); return; }
    isRunning = true;
    currentRunId = message.runId;
    currentOwnerId = message.ownerId || null;
    stdinQueue = Array.isArray(message.inputs) ? message.inputs.map(value => String(value)) : [];
    decoderOut.decode(); decoderErr.decode();
    installStreams();
    // Pyodide's stdin callback consumes one character at a time, not one whole line.
    stdinCharacters = [];
    pyodide.setStdin({isatty:true, stdin() {
      if (!stdinCharacters.length) {
        if (!stdinQueue.length) return undefined;
        stdinCharacters = Array.from(stdinQueue.shift() + "\n");
      }
      return stdinCharacters.shift().codePointAt(0);
    }});
    send('state', {state:'running', runId:message.runId, message:'Running your code…'});
    try {
      // Load available Pyodide packages referenced by imports; standard-library code works without extra packages.
      if (typeof pyodide.loadPackagesFromImports === 'function') await pyodide.loadPackagesFromImports(message.code);
      await pyodide.runPythonAsync(message.code);
      send('runComplete', {runId:message.runId, ownerId:currentOwnerId});
    } catch (error) {
      send('runError', {runId:message.runId, ownerId:currentOwnerId, name:error && error.name || 'PythonError', message:error && error.message || String(error)});
    } finally {
      isRunning = false;
      currentRunId = null; currentOwnerId = null;
      stdinQueue = []; stdinCharacters = [];
      send('state', {state:'ready'});
    }
  }
});
