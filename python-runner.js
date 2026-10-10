(function () {
  let worker = null;
  let ready = false;
  let loading = false;
  let workerUnavailable = false;
  let activeRunId = null;
  let activeOwnerId = null;
  let nextRunId = 1;
  const listeners = new Set();
  const pending = new Map();
  const waitingRuns = new Set();
  let lastRuntimeVersion = '';

  function emit(event) {
    listeners.forEach(callback => {
      try { callback(event); } catch (error) { console.warn('Runner subscriber error', error); }
    });
  }
  function setState(state, message='') { emit({type:'state', state, message, version:lastRuntimeVersion}); }
  function unsubscribe(callback) { if (callback) listeners.delete(callback); }
  function cancelWaiting(record) {
    if (!record || !waitingRuns.has(record)) return false;
    waitingRuns.delete(record);
    if (record.timer) clearTimeout(record.timer);
    unsubscribe(record.unsubscribe);
    record.resolve({ok:false, cancelled:true, pending:true});
    return true;
  }
  function cancelAllWaiting() { [...waitingRuns].forEach(cancelWaiting); }
  function terminateWorker() {
    if (!worker) return;
    const current = worker;
    worker = null;
    current.removeEventListener('message', handleMessage);
    current.terminate();
  }
  function handleWorkerError(current, event) {
    if (worker !== current) return;
    const message = event.message || 'The Python worker failed to load.';
    terminateWorker();
    ready = false; loading = false; workerUnavailable = true; activeRunId = null; activeOwnerId = null;
    const error = {type:'initError', message};
    emit(error); setState('error', message);
    cancelAllWaiting();
  }
  function createWorker() {
    try {
      terminateWorker();
      const current = new Worker(new URL('js/pyodide-worker.js', location.href.split('#')[0]));
      worker = current;
      current.addEventListener('message', handleMessage);
      current.addEventListener('error', event => handleWorkerError(current, event));
      current.postMessage({type:'init'});
      return true;
    } catch (error) {
      workerUnavailable = true; loading = false; ready = false;
      const message = error && error.message ? error.message : 'Workers are unavailable in this browser.';
      emit({type:'initError', message});
      setState('error', 'Python runtime could not start.');
      cancelAllWaiting();
      return false;
    }
  }
  function ensureReady() {
    if (ready || loading) return;
    loading = true;
    workerUnavailable = false;
    setState('loading', 'Starting the browser-based Python runtime…');
    if (!createWorker()) loading = false;
  }
  function handleMessage(event) {
    if (worker && event.currentTarget && event.currentTarget !== worker) return;
    const message = event.data || {};
    if (message.type === 'state') {
      if (message.state === 'loading') { loading = true; ready = false; }
      if (message.state === 'running') { activeRunId = message.runId; activeOwnerId = message.ownerId || null; }
      if (message.state === 'ready') { ready = true; loading = false; activeRunId = null; activeOwnerId = null; }
      setState(message.state, message.message || '');
    }
    if (message.type === 'ready') {
      ready = true; loading = false; workerUnavailable = false;
      lastRuntimeVersion = message.version || '';
      setState('ready', `${message.runtime || 'Python'} ${lastRuntimeVersion} ready`);
    }
    if (message.type === 'initError') {
      const failed = worker;
      worker = null;
      if (failed) { failed.removeEventListener('message', handleMessage); failed.terminate(); }
      ready = false; loading = false; workerUnavailable = true; activeRunId = null; activeOwnerId = null;
      emit(message); setState('error', message.message);
      cancelAllWaiting();
    }
    if (message.type === 'stdout' || message.type === 'stderr') emit(message);
    if (message.type === 'runComplete' || message.type === 'runError') {
      if (message.runId && pending.has(message.runId)) {
        const callbacks = pending.get(message.runId);
        pending.delete(message.runId);
        if (message.type === 'runComplete') callbacks.resolve({ok:true});
        else callbacks.resolve({ok:false, error:message});
      }
      emit(message);
    }
  }
  function subscribe(callback) { listeners.add(callback); return () => listeners.delete(callback); }
  function run(code, inputs=[], ownerId='') {
    ensureReady();
    return new Promise((resolve, reject) => {
      let record = null;
      const sendRun = () => {
        if (record) {
          waitingRuns.delete(record);
          if (record.timer) clearTimeout(record.timer);
          unsubscribe(record.unsubscribe);
          record = null;
        }
        if (!ready || !worker) {
          reject(new Error('Python is not ready yet. Wait for the runtime status to say Ready, then run again.'));
          return;
        }
        const runId = nextRunId++;
        pending.set(runId, {resolve, reject});
        activeRunId = runId; activeOwnerId = ownerId || null;
        emit({type:'runStarted', runId, ownerId});
        worker.postMessage({type:'run', runId, ownerId, code:String(code), inputs:inputs.map(value => String(value))});
      };
      if (ready) { sendRun(); return; }
      if (workerUnavailable || !loading || !worker) {
        reject(new Error('The Python runtime could not start. Check the connection and browser worker support, then try again.'));
        return;
      }
      record = {ownerId, resolve, timer:null, unsubscribe:null, cancel:()=>cancelWaiting(record)};
      waitingRuns.add(record);
      record.timer = setTimeout(() => {
        if (!waitingRuns.has(record)) return;
        waitingRuns.delete(record); unsubscribe(record.unsubscribe);
        reject(new Error('Python is still loading after two minutes. Please check the network and try again.'));
      }, 120000);
      record.unsubscribe = subscribe(message => {
        if (message.type === 'state' && message.state === 'ready') sendRun();
        if (message.type === 'initError') {
          if (waitingRuns.has(record)) {
            waitingRuns.delete(record); clearTimeout(record.timer); unsubscribe(record.unsubscribe);
            reject(new Error(message.message || 'Python failed to initialize.'));
          }
        }
      });
      // Catch synchronous construction errors that occurred before this listener could subscribe.
      if (workerUnavailable || (!loading && !ready) || !worker) {
        waitingRuns.delete(record); clearTimeout(record.timer); unsubscribe(record.unsubscribe); record = null;
        reject(new Error('The Python runtime could not start. Check the connection and try again.'));
      }
    });
  }
  function cancelPending(ownerId) {
    const matches = [...waitingRuns].filter(record => record.ownerId === ownerId);
    matches.forEach(cancelWaiting);
    return matches.length > 0;
  }
  function stop() {
    if (!activeRunId) return false;
    pending.forEach(item => item.resolve({ok:false, cancelled:true})); pending.clear();
    cancelAllWaiting();
    terminateWorker();
    ready = false; loading = false; activeRunId = null; activeOwnerId = null; workerUnavailable = false;
    emit({type:'stopped', message:'Execution stopped. The interpreter was restarted, so variables from the previous session were cleared.'});
    ensureReady();
    return true;
  }
  function restart() {
    pending.forEach(item => item.resolve({ok:false, cancelled:true})); pending.clear();
    cancelAllWaiting();
    terminateWorker();
    ready = false; loading = false; activeRunId = null; activeOwnerId = null; workerUnavailable = false; lastRuntimeVersion = '';
    emit({type:'sessionRestarted', message:'A fresh Python session is starting. Variables and imports from the previous session are cleared.'});
    ensureReady();
  }
  function status() { return {ready,loading,running:Boolean(activeRunId),pending:waitingRuns.size,version:lastRuntimeVersion,ownerId:activeOwnerId}; }
  window.PyTrailRunner = {subscribe, ensureReady, run, stop, restart, cancelPending, status};
})();
