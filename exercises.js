(function () {
  const esc = s => String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  function render(selectedId) {
    const exercises = window.PYTRAIL_EXERCISES || [];
    const selected = exercises.find(item => item.id === selectedId) || null;
    if (!selected) return `
      <div class="page-heading"><div><p class="eyebrow">HANDS-ON PRACTICE</p><h1>Coding exercises</h1><p>Practice one concept at a time. Your submitted code executes in the same browser-based Python runtime as the Playground.</p></div></div>
      <div class="card card-pad"><div class="section-heading" style="margin-top:0"><div><h2>Choose a challenge</h2><p>Start with a small success, then try the harder tasks.</p></div><span class="chip">${exercises.length} challenges</span></div>
      <div class="grid-auto">${exercises.map(item=>{const done=window.PyTrailStorage.get().completedExercises.includes(item.id);return `<article class="project-card card"><div class="module-card-top"><span class="chip">${esc(item.difficulty)}</span>${done?'<span class="module-status" style="color:var(--success)">Solved ✓</span>':''}</div><h3>${esc(item.title)}</h3><p>${esc(item.prompt)}</p><div class="project-foot"><span class="project-tag">${esc((window.PYTRAIL_CURRICULUM.find(m=>m.id===item.moduleId)||{}).title||'Python')}</span><button class="button button-secondary button-small" data-open-exercise="${esc(item.id)}">Try challenge →</button></div></article>`;}).join('')}</div></div>`;

    const module = window.PYTRAIL_CURRICULUM.find(item=>item.id===selected.moduleId);
    const lesson = window.PYTRAIL_LESSONS.find(item=>item.id===selected.lessonId);
    return `<div class="page-heading"><div><p class="eyebrow">CODING CHALLENGE · ${esc(selected.difficulty.toUpperCase())}</p><h1>${esc(selected.title)}</h1><p>${esc(selected.prompt)}</p></div><div class="heading-actions"><button class="button button-quiet" data-route="exercises">← All exercises</button></div></div>
      <div class="two-column"><div class="content-stack"><div class="card card-pad"><div class="module-card-top"><span class="chip">${esc(module ? module.title : 'Python practice')}</span><span class="chip">${esc(selected.type)}</span></div><h2 style="font-size:17px;margin:14px 0 8px">Your task</h2><p class="muted-copy">${esc(selected.prompt)}</p><div class="callout tip"><strong>How checking works</strong><p>PyTrail executes the code you submit and compares the actual output with the required output. It does not judge correctness from keywords in your source.</p></div>
        <div id="exercise-editor-${esc(selected.id)}"></div>
        <div class="heading-actions" style="justify-content:flex-start;margin-top:13px"><button class="button button-primary" type="button" data-check-exercise="${esc(selected.id)}">Run & check answer →</button><button class="button button-secondary" type="button" data-reveal-solution="${esc(selected.id)}">Reveal worked solution</button></div>
        <div id="exercise-feedback-${esc(selected.id)}" class="feedback-box" role="status"></div>
        <div id="exercise-solution-${esc(selected.id)}" class="callout" hidden><strong>Worked solution</strong><pre style="white-space:pre-wrap;font:11px/1.7 var(--mono);margin:7px 0 0"></pre></div>
      </div></div><aside class="side-panel content-stack"><div class="card card-pad"><h3 class="panel-title">Progress</h3><p class="muted-copy">Attempts: ${(window.PyTrailStorage.get().exerciseAttempts[selected.id]||{}).attempts||0}</p><p class="muted-copy">Status: ${window.PyTrailStorage.get().completedExercises.includes(selected.id)?'Solved ✓':'Not solved yet'}</p></div><div class="card card-pad"><h3 class="panel-title">Progressive hints</h3>${selected.hints.map((hint,i)=>`<details class="hint-item"><summary>Hint ${i+1}</summary><p>${esc(hint)}</p></details>`).join('')}<div class="divider"></div><a class="text-link" href="#lesson/${esc(selected.lessonId)}">Review lesson: ${esc(lesson?lesson.title:'Related lesson')} →</a></div></aside></div>`;
  }
  function bind() {
    document.querySelectorAll('[data-open-exercise]').forEach(button=>button.addEventListener('click',()=>window.PyTrailRouter.navigate('exercises',button.dataset.openExercise)));
    const selectedId=location.hash.startsWith('#exercises/')?decodeURIComponent(location.hash.slice('#exercises/'.length)):null;
    const selected=(window.PYTRAIL_EXERCISES||[]).find(item=>item.id===selectedId);
    if (!selected) return;
    const container=document.getElementById(`exercise-editor-${selected.id}`);
    if (container) window.PyTrailEditor.mount(container,{id:`exercise-${selected.id}`,code:selected.starter,filename:`${selected.id}.py`,draftKey:`exercise:${selected.id}`});
    const checkButton=document.querySelector(`[data-check-exercise="${selected.id}"]`);
    if(checkButton)checkButton.addEventListener('click',async()=>{
      const editor=window.PyTrailEditor.get(`exercise-${selected.id}`);
      if(!editor)return;
      const code=editor.code.value;
      const feedback=document.getElementById(`exercise-feedback-${selected.id}`);
      checkButton.disabled=true;feedback.className='feedback-box visible info';feedback.textContent='Executing your submission in Python…';
      let actual='';let runOwner=`check-${selected.id}-${Date.now()}`;
      const unsubscribe=window.PyTrailRunner.subscribe(message=>{if(message.ownerId!==runOwner)return;if(message.type==='stdout')actual+=message.text||'';if(message.type==='stderr')actual+=message.text||'';});
      try{
        const result=await window.PyTrailRunner.run(code,[],runOwner);
        if(result&&result.ok){const pass=actual.trimEnd()===selected.expectedOutput.trimEnd();window.PyTrailProgress.recordExerciseAttempt(selected.id,pass);feedback.className=`feedback-box visible ${pass?'success':'error'}`;feedback.textContent=pass?`Correct! Python produced the expected output: ${selected.expectedOutput}.`: `Not quite yet. Actual output: ${actual.trimEnd()||'(no output)'}. Expected: ${selected.expectedOutput}. Use a hint, revise your code, and try again.`;if(pass)window.PyTrail.toast('Exercise solved. Progress saved locally.','success');}
        else{window.PyTrailProgress.recordExerciseAttempt(selected.id,false);feedback.className='feedback-box visible error';feedback.textContent=`Python reported ${result&&result.error?result.error.name+': '+result.error.message:'an execution error'}. Fix the error and try again.`;}
      }catch(error){feedback.className='feedback-box visible error';feedback.textContent=error.message;}
      finally{unsubscribe();checkButton.disabled=false;}
    });
    const reveal=document.querySelector(`[data-reveal-solution="${selected.id}"]`);
    if(reveal)reveal.addEventListener('click',()=>{const panel=document.getElementById(`exercise-solution-${selected.id}`);panel.hidden=false;panel.querySelector('pre').textContent=selected.solution;reveal.disabled=true;reveal.textContent='Solution revealed';});
  }
  window.PyTrailExercises={render,bind};
})();
