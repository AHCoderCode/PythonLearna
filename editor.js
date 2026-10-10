(function () {
  const editors = new Map();
  let submitInputValues = null;
  const get = id => editors.get(id);
  const esc = value => String(value ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');

  function mount(container, options={}) {
    const id = options.id || container.id || `editor-${Math.random().toString(36).slice(2,8)}`;
    if (editors.has(id)) destroy(id);
    const starter = String(options.code ?? 'print("Hello, Python!")');
    const draft = options.draftKey ? window.PyTrailStorage.get().drafts[options.draftKey] : null;
    const state = {id, container, starter, draftKey:options.draftKey || null, filename:options.filename || 'main.py', busy:false, runId:null, inputConfirmedCode:null, fullscreen:false, unsub:null};
    container.classList.add('python-editor');
    container.innerHTML = `
    <div class="editor-shell" data-editor-shell="${id}">
      <div class="editor-toolbar"><div class="editor-toolbar-left"><span class="editor-file"><span class="python-glyph">Py</span><span>${esc(state.filename)}</span></span><span class="editor-status" data-status-for="${id}"><span class="editor-status-dot"></span><span data-status-label="${id}">Python loads when you run code</span></span></div>
        <div class="editor-toolbar-right">
          <button class="button button-primary" type="button" data-action="run">▶ Run Code <span class="run-tip">Ctrl ↵</span></button>
          <button class="button button-quiet" type="button" data-action="retry" title="Retry Python if it failed to load">Retry Python</button>
          <button class="button button-secondary" type="button" data-action="stop" disabled>■ Stop</button>
          <button class="button button-quiet" type="button" data-action="reset">Reset Code</button>
          <button class="button button-quiet" type="button" data-action="copy">Copy</button>
          <button class="button button-quiet" type="button" data-action="download">Download .py</button>
          <button class="button button-quiet" type="button" data-action="fullscreen" title="Fullscreen editor">⛶</button>
        </div>
      </div>
      <div class="editor-workspace">
        <section class="editor-pane" aria-label="Python code editor"><div class="pane-title"><span>PYTHON EDITOR</span><span class="pane-aux">UTF-8 · 4 spaces</span></div>
          <div class="code-editor-wrap"><div class="line-gutter" data-gutter aria-hidden="true">1</div><textarea class="code-input" data-code aria-label="Python source code" spellcheck="false" autocapitalize="off" autocomplete="off" autocorrect="off">${esc(typeof draft === 'string' ? draft : starter)}</textarea></div>
          <div class="editor-foot"><span data-line-count>1 line</span><span><kbd>Tab</kbd> indent · <kbd>Ctrl ↵</kbd> run · <kbd>Ctrl S</kbd> save draft</span></div>
        </section>
        <section class="editor-pane" aria-label="Python output console"><div class="pane-title"><span class="editor-output-label"><span class="output-live-dot"></span>OUTPUT CONSOLE</span><button type="button" class="code-copy-inline" data-action="clear">Clear output</button></div>
          <pre class="console-output is-empty" data-output aria-live="polite">Run your Python code to see real output here.</pre>
          <div class="stdin-area"><label for="stdin-${id}">Program input (stdin)</label><textarea id="stdin-${id}" data-stdin rows="2" spellcheck="false" placeholder="One line for each input() call…">${esc(options.stdin || '')}</textarea><div class="stdin-help">Enter one response per line before running. input() reads these lines in order; prompts appear in output.</div></div>
        </section>
      </div>
      <div class="runtime-message" data-runtime>Your code stays in this browser. The first run downloads Python from the Pyodide CDN.</div>
    </div>`;
    state.shell = container.querySelector('[data-editor-shell]');
    state.code = container.querySelector('[data-code]');
    state.gutter = container.querySelector('[data-gutter]');
    state.output = container.querySelector('[data-output]');
    state.runtime = container.querySelector('[data-runtime]');
    state.runButton = container.querySelector('[data-action="run"]');
    state.stopButton = container.querySelector('[data-action="stop"]');
    state.lineCount = container.querySelector('[data-line-count]');

    function refreshGutter() {
      const lines = Math.max(1, state.code.value.split('\n').length);
      state.gutter.textContent = Array.from({length:lines}, (_,i) => i+1).join('\n');
      state.gutter.scrollTop = state.code.scrollTop;
      state.lineCount.textContent = `${lines} line${lines === 1 ? '' : 's'}`;
    }
    function setStatus(kind, text) {
      const node = container.querySelector(`[data-status-for="${id}"]`);
      node.className = `editor-status ${kind || ''}`.trim();
      container.querySelector(`[data-status-label="${id}"]`).textContent = text;
      state.runButton.disabled = state.busy || kind === 'loading';
      state.stopButton.disabled = !(state.busy && window.PyTrailRunner.status().running);
    }
    function message(text, kind='') { state.runtime.textContent = text; state.runtime.className = `runtime-message ${kind}`.trim(); }
    function clearOutput() { state.output.textContent = 'Run your Python code to see real output here.'; state.output.classList.add('is-empty'); }
    function output(text, isError=false) {
      if (state.output.classList.contains('is-empty')) { state.output.textContent = ''; state.output.classList.remove('is-empty'); }
      const span = document.createElement('span'); span.textContent = text; if (isError) span.className = 'console-error'; state.output.appendChild(span); state.output.scrollTop = state.output.scrollHeight;
    }
    function saveDraft(show=false) {
      if (!state.draftKey) return;
      window.PyTrailStorage.update(data => { data.drafts[state.draftKey] = state.code.value.slice(0,150000); });
      if (show && window.PyTrail) window.PyTrail.toast('Draft saved on this browser.','success');
    }
    function stdinLines() { const value = container.querySelector('[data-stdin]').value; return value ? value.split(/\r?\n/) : []; }
    function findInputPrompts(code) {
      const matches = []; const expression = /\binput\s*\(\s*(['"])(.*?)\1/g; let match;
      while ((match = expression.exec(code)) && matches.length < 12) matches.push(match[2].replace(/\\n/g,' '));
      if (!/\binput\s*\(/.test(code)) return [];
      return matches.length ? matches : ['Enter a value'];
    }
    function askForInputs(prompts, currentValues) {
      const dialog = document.getElementById('input-dialog');
      const fields = document.getElementById('program-input-fields');
      fields.replaceChildren();
      prompts.forEach((prompt, index) => {
        const row = document.createElement('div'); row.className='input-field-row';
        const label = document.createElement('label'); label.htmlFor=`python-input-${index}`; label.textContent=prompt ? `input() ${index+1}: ${prompt}` : `input() ${index+1}`;
        const input = document.createElement('input'); input.type='text'; input.id=`python-input-${index}`; input.name=`line-${index}`; input.value=currentValues[index] ?? ''; input.autocomplete='off';
        row.append(label,input); fields.append(row);
      });
      const extra = document.getElementById('extra-stdin'); extra.value=currentValues.slice(prompts.length).join('\n');
      submitInputValues = values => { state.inputConfirmedCode=state.code.value; container.querySelector('[data-stdin]').value=values.join('\n'); runWithInputs(values); };
      if (typeof dialog.showModal === 'function') dialog.showModal(); else dialog.setAttribute('open','');
      const first = fields.querySelector('input'); if (first) first.focus();
    }
    async function runWithInputs(inputs) {
      state.busy=true; setStatus('running','Running…'); clearOutput();
      message('Python is executing in a dedicated worker. Use Stop to terminate the worker if a program runs too long.');
      saveDraft(false);
      try {
        const result = await window.PyTrailRunner.run(state.code.value, inputs, id);
        if (result && result.cancelled) { output('\n[Execution stopped. Python session restarted; variables were cleared.]\n',true); message('Execution stopped. A fresh Python interpreter is starting.'); }
        else if (result && !result.ok) { output(`\n${result.error.name || 'Python error'}: ${result.error.message || 'Execution failed.'}\n`,true); message('Python reported an error. Read the error details in the output console.','error'); }
        else if (result && result.ok) { if (state.output.classList.contains('is-empty')) { state.output.textContent='(Program finished with no output.)'; state.output.classList.remove('is-empty'); } message('Execution finished. Output above was produced by Python.'); }
      } catch (error) { output(`\nRuntime error: ${error.message}\n`,true); message('Python could not run. Check your connection and wait for the runtime to become Ready.','error'); }
      finally {
        state.busy=false;
        const status=window.PyTrailRunner.status();
        setStatus(status.ready?'ready':status.loading?'loading':'error',status.ready?`Python ${status.version || ''} ready`:status.loading?'Loading Python…':'Runtime unavailable');
      }
    }
    function run() {
      if (state.busy) return;
      const prompts=findInputPrompts(state.code.value); const values=stdinLines();
      if (prompts.length && state.inputConfirmedCode !== state.code.value) { askForInputs(prompts,values); return; }
      runWithInputs(values);
    }
    async function act(action) {
      if (action==='run') run();
      else if (action==='retry') { message('Starting Python again…'); setStatus('loading','Loading Python…'); window.PyTrailRunner.restart(); }
      else if (action==='stop') { if (window.PyTrailRunner.stop()) { state.busy=false; setStatus('loading','Restarting…'); } }
      else if (action==='reset') { state.code.value=starter; state.inputConfirmedCode=null; refreshGutter(); saveDraft(false); clearOutput(); message('Starter code restored.'); }
      else if (action==='clear') clearOutput();
      else if (action==='copy') {
        try { await navigator.clipboard.writeText(state.code.value); window.PyTrail.toast('Code copied to clipboard.','success'); }
        catch { state.code.focus(); state.code.select(); const ok=document.execCommand && document.execCommand('copy'); window.PyTrail.toast(ok?'Code copied.':'Copy was blocked. Select the code and copy it manually.',ok?'success':'error'); }
      } else if (action==='download') {
        const blob=new Blob([state.code.value],{type:'text/x-python;charset=utf-8'}); const url=URL.createObjectURL(blob); const link=document.createElement('a'); link.href=url; link.download=state.filename.endsWith('.py')?state.filename:`${state.filename}.py`; document.body.appendChild(link);link.click();link.remove();URL.revokeObjectURL(url);window.PyTrail.toast('Python source downloaded.','success');
      } else if (action==='fullscreen') {
        state.fullscreen=!state.fullscreen;state.shell.classList.toggle('editor-fullscreen',state.fullscreen);document.body.style.overflow=state.fullscreen?'hidden':'';state.code.focus();
      }
    }
    state.code.addEventListener('input',()=>{refreshGutter();saveDraft(false);state.inputConfirmedCode=null;});
    state.code.addEventListener('scroll',()=>{state.gutter.scrollTop=state.code.scrollTop;});
    state.code.addEventListener('keydown',event=>{
      if ((event.ctrlKey||event.metaKey)&&event.key==='Enter'){event.preventDefault();run();return;}
      if ((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='s'){event.preventDefault();saveDraft(true);return;}
      if (event.key==='Escape'&&state.fullscreen){state.fullscreen=false;state.shell.classList.remove('editor-fullscreen');document.body.style.overflow='';return;}
      if(event.key==='Tab'){event.preventDefault();const start=state.code.selectionStart,end=state.code.selectionEnd;if(event.shiftKey){const lineStart=state.code.value.lastIndexOf('\n',start-1)+1;if(state.code.value.slice(lineStart,lineStart+4)==='    '){state.code.setRangeText('',lineStart,lineStart+4,'end');state.code.setSelectionRange(Math.max(lineStart,start-4),Math.max(lineStart,end-4));}}else{state.code.setRangeText('    ',start,end,'end');}refreshGutter();saveDraft(false);return;}
      if(event.key==='Enter'){const start=state.code.selectionStart;const line=state.code.value.slice(0,start).split('\n').pop();const indent=(line.match(/^\s*/)||[''])[0]+(/:\s*$/.test(line)?'    ':'');if(indent){event.preventDefault();state.code.setRangeText('\n'+indent,start,state.code.selectionEnd,'end');refreshGutter();saveDraft(false);}}
    });
    container.addEventListener('click',event=>{const button=event.target.closest('[data-action]');if(button)act(button.dataset.action);});
    state.unsub=window.PyTrailRunner.subscribe(event=>{
      if(event.ownerId&&event.ownerId!==id)return;
      if(event.type==='state'){
        if(event.state==='loading')setStatus('loading','Loading Python…');
        else if(event.state==='ready')setStatus('ready',`Python ${event.version||window.PyTrailRunner.status().version||''} ready`);
        else if(event.state==='running')setStatus('running','Running…');
      } else if(event.type==='stdout'&&event.ownerId===id)output(event.text||'');
      else if(event.type==='stderr'&&event.ownerId===id)output(event.text||'',true);
      else if(event.type==='initError'){setStatus('error','Runtime unavailable');message('The Python runtime could not load. Your editor and lessons are still available. Check the internet connection, then try again.','error');}
      else if(event.type==='stopped'&&state.busy)message(event.message);
      else if(event.type==='sessionRestarted')message(event.message);
    });
    state.destroy=()=>{if(state.busy)window.PyTrailRunner.cancelPending(id);if(state.unsub)state.unsub();if(state.fullscreen)document.body.style.overflow='';editors.delete(id);};
    refreshGutter(); editors.set(id,state); setStatus('','Python loads when you run code');
    return state;
  }
  function destroy(id){const state=editors.get(id);if(state&&state.destroy)state.destroy();}
  function clearAll(){[...editors.keys()].forEach(destroy);}
  document.addEventListener('click',event=>{const button=event.target.closest('[data-close-dialog]');if(button){const dialog=document.getElementById(button.dataset.closeDialog);if(dialog&&dialog.open)dialog.close();}});
  const inputForm=document.getElementById('program-input-form');
  inputForm.addEventListener('submit',event=>{
    event.preventDefault();if(!submitInputValues)return;
    const fields=[...document.querySelectorAll('#program-input-fields input')].map(input=>input.value);
    const extraText=document.getElementById('extra-stdin').value;const extra=extraText?extraText.split(/\r?\n/):[];
    const values=fields.concat(extra);const dialog=document.getElementById('input-dialog');if(dialog.open)dialog.close();
    const callback=submitInputValues;submitInputValues=null;callback(values);
  });
  window.PyTrailEditor={mount,destroy,clearAll,get,ensureRuntime(){window.PyTrailRunner.ensureReady();}};
})();
