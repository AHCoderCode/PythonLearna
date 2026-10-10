(function () {
  const make = (id, moduleId, title, questions) => ({id,moduleId,title,questions:questions.map(([prompt,options,answer,explanation,lessonId])=>({prompt,options,answer,explanation,lessonId}))});
  const Q = [
    make('q-start','start','Getting started',[
      ['What does print("Hi") do?',['Creates a file named Hi','Displays Hi in the output','Installs Python','Declares a permanent variable'],1,'print() writes a value to the output stream.','hello-world'],
      ['In this academy, what runs the submitted Python code?',['JavaScript eval()','A set of predefined output strings','Pyodide running CPython in WebAssembly','The CSS engine'],2,'Pyodide runs real Python code compiled for the browser environment.','how-python-runs'],
      ['Which language usually describes the structure of a web page?',['HTML','Python only','SQL','Bash'],0,'HTML describes page structure; CSS styles it and JavaScript adds browser behavior.','python-vs-web']
    ]),
    make('q-fundamentals','fundamentals','Python fundamentals',[
      ['What is the value of 7 // 2?',['3.5','4','3','1'],2,'Floor division rounds the quotient down.','math-operators'],
      ['What type does input() return before conversion?',['int','str','bool','float'],1,'input() returns text, so numeric input should be converted before arithmetic.','input-conversion'],
      ['Which assignment creates a boolean value?',['ready = "True"','ready = 1','ready = True','ready == True = ready'],2,'True without quotes is a boolean; "True" is text.','variables-types']
    ]),
    make('q-strings','strings-operators','Strings and operators',[
      ['What does "  hi  ".strip() return?',['"hi"','"  hi  "','"HI"','An error'],0,'strip() removes leading and trailing whitespace.','string-tools'],
      ['What does word[-1] select?',['The first character','The last character','The middle character','The length'],1,'Negative index -1 refers to the last item.','indexing-slicing'],
      ['Which operator checks membership?',['is','=>','in',':='],2,'The in operator tests membership or substring presence.','boolean-membership']
    ]),
    make('q-conditions','conditions','Conditions and decisions',[
      ['Which keyword handles another condition after if?',['when','elif','otherwise','then'],1,'elif adds another conditional branch.','if-elif-else'],
      ['What does and require?',['Both expressions to be true','Either expression to be true','Both to be false','An integer'],0,'and is true only when both operands are true.','compound-conditions'],
      ['Why test boundary values?',['To make code longer','To hide errors','To check behavior at and around thresholds','To avoid using functions'],2,'Boundary tests expose common off-by-one and condition errors.','guard-clauses']
    ]),
    make('q-loops','loops','Loops',[
      ['What values does range(1, 4) produce?',['1, 2, 3, 4','0, 1, 2, 3','1, 2, 3','2, 3, 4'],2,'The stop value is excluded.','for-range'],
      ['What can create an infinite while loop?',['Changing the condition state','A condition that never becomes false','Using a counter','Using break'],1,'A loop needs a way to stop or be intentionally interrupted.','while-accumulator'],
      ['What does continue do?',['Ends the whole program','Exits the nearest loop','Skips to the next loop iteration','Does nothing forever'],2,'continue skips the remaining body of the current iteration.','break-continue']
    ]),
    make('q-data','data-structures','Data structures',[
      ['Which collection is mutable and ordered?',['tuple','list','frozenset','str'],1,'Lists are ordered and mutable.','lists-tuples'],
      ['Which structure maps keys to values?',['dictionary','tuple','range','generator'],0,'Dictionaries provide key-value lookup.','sets-dictionaries'],
      ['What does [n*n for n in numbers if n%2==0] do?',['Squares every number','Keeps only odd numbers','Squares even numbers','Sorts the input'],2,'The comprehension filters even values and squares each one.','comprehensions-copying']
    ]),
    make('q-functions','functions','Functions',[
      ['What is the main difference between print and return?',['They are identical','return sends a value to the caller','print creates a parameter','return only works in classes'],1,'return provides a value to the caller; print displays it.','define-return'],
      ['What does *args collect?',['Extra positional arguments in a tuple','Extra keyword arguments in a dictionary','Only strings','The function source code'],0,'*args receives extra positional arguments.','args-keyword-types'],
      ['Why avoid a mutable list as a default parameter?',['Lists cannot be passed to functions','It makes all calls share the same default object','It prevents return','It changes indentation'],1,'Default values are created when the function is defined, so a mutable default can be shared between calls.','scope-defaults']
    ]),
    make('q-debug','debugging','Debugging and exceptions',[
      ['Which exception often means a string cannot be converted with int()?',['ValueError','IndexError','StopIteration','NameError'],0,'int("seven") raises ValueError.','read-tracebacks'],
      ['When does finally run?',['Only if no error occurs','Only after ValueError','On normal and exceptional paths as the block exits','Only when manually called'],2,'finally is intended for cleanup and normally runs on both success and failure paths.','try-except-finally'],
      ['What does raise do?',['Silently fixes an error','Raises an exception','Restarts the interpreter','Creates a boolean'],1,'raise signals an exception to the current execution flow.','raise-custom-errors']
    ]),
    make('q-files','files-data','Files and data',[
      ['Why use a with block when opening a file?',['It automatically uploads to the web','It helps close the resource reliably','It encrypts the file','It disables file errors'],1,'The context manager handles closing when the block exits.','file-basics'],
      ['What does json.loads(text) do?',['Parses JSON text into Python values','Turns a list into a tuple','Writes a CSV','Loads the operating system'],0,'loads parses a JSON string.','json-csv'],
      ['Where are files created by the browser playground stored by default?',['Directly in Downloads','In the browser runtime virtual filesystem','In GitHub','In a cloud account'],1,'The virtual filesystem is separate from your computer’s normal files.','paths-file-errors']
    ]),
    make('q-modules','modules-env','Modules and environments',[
      ['What does import math do?',['Deletes a module','Makes names from math available through the module object','Installs every Python package','Starts a new interpreter'],1,'import binds a module name so you can access its attributes.','imports-main'],
      ['Why use a virtual environment?',['To isolate project dependencies','To change HTML into Python','To remove tests','To guarantee every package works in a browser'],0,'Virtual environments help separate project installations.','venvs-pip'],
      ['What is a common cause of a confusing import error?',['A file shadowing a standard-library module','Using a return statement','Naming a string','Using comments'],0,'Avoid naming your own files after standard-library modules.','package-design']
    ]),
    make('q-oop','oop','Object-oriented programming',[
      ['What does self refer to in an instance method?',['The current instance','The class file path','A global variable only','The parent class always'],0,'self is the conventional first parameter for instance methods.','classes-init'],
      ['What is composition commonly used to model?',['A has-a relationship','A syntax error','A Boolean expression','A for loop'],0,'Composition builds an object from other objects.','inheritance-composition'],
      ['What does @dataclass help with?',['Generating common data-holder methods','Starting parallel processes','Opening the browser','Encrypting attributes'],0,'Dataclasses reduce repetitive boilerplate for data-oriented classes.','dataclasses-properties']
    ]),
    make('q-iterators','iterators','Iterators and generators',[
      ['What does next(iterator) do?',['Sorts all values','Requests the next item','Creates a class','Copies a list'],1,'next() asks an iterator for its next value.','iterable-iterator'],
      ['What does yield do in a generator?',['Ends the entire Python process','Produces a value and suspends the function','Converts a string to int','Creates a file'],1,'yield pauses the generator while preserving its state.','generator-yield'],
      ['When is a normal loop often better than a comprehension?',['When it is clearer for multi-step logic','Never','Only on Windows','Only for dictionaries'],0,'Readable code is more important than compressing every expression.','comprehension-tradeoffs']
    ]),
    make('q-advanced','advanced-features','Advanced features',[
      ['What is a decorator commonly used to do?',['Add behavior around another callable','Declare CSS colors','Install packages','Create a SQL table'],0,'Decorators wrap or transform a function or class.','closures-decorators'],
      ['What does a context manager help coordinate?',['Setup and cleanup around a block','Only arithmetic precedence','Class names','Browser history'],0,'The with statement uses a context manager to manage entry and exit behavior.','context-managers'],
      ['Are type annotations automatically enforced at runtime?',['Always, for every function','No, not by Python itself in general','Only on Linux','Only in comments'],1,'Annotations communicate expected types, but Python does not generally enforce them.','typing-pattern-match']
    ]),
    make('q-stdlib','stdlib','Standard library',[
      ['Which module is designed for secure random tokens?',['random','secrets','statistics','time'],1,'secrets provides cryptographically strong tokens.','logging-security'],
      ['What does Counter help with?',['Frequency counts','HTTP encryption','Create Python syntax','Open a browser tab'],0,'collections.Counter counts hashable items.','useful-stdlib'],
      ['What is timedelta useful for?',['Date and time arithmetic','Parsing classes','Setting types','Installing wheels'],0,'timedelta represents a duration.','datetime-random']
    ]),
    make('q-algorithms','algorithms','Algorithms',[
      ['What must be true for ordinary binary search?',['The collection is sorted','The data is all strings','The list has five items','There are no duplicates'],0,'Binary search relies on sorted ordering to discard half the remaining search range.','linear-binary-search'],
      ['What is a recursion base case?',['A condition that stops further recursion','A global variable','An import alias','A class method'],0,'A base case prevents recursive calls from continuing indefinitely.','recursion'],
      ['What does O(n²) commonly describe?',['Constant work','A single pass','Nested iteration over n-sized data','Logarithmic growth'],2,'A nested loop over the same n values often has quadratic behavior.','big-o']
    ]),
    make('q-testing','testing-quality','Testing and code quality',[
      ['What is a regression test intended to catch?',['Previously working behavior breaking after a change','A spelling style only','A slow internet connection','A browser theme'],0,'A regression test checks behavior that should remain correct after changes.','edge-regression'],
      ['What does PEP 8 describe?',['Python style guidance','A Python runtime','A database driver','An HTML framework'],0,'PEP 8 is the common Python style guide.','refactoring-pep8'],
      ['Should assert be used to validate untrusted production input?',['Yes, always','No, asserts can be disabled in optimized mode','Only for passwords','Only in browser code'],1,'Use explicit validation and appropriate exceptions for production input.','assertions-tests']
    ]),
    make('q-concurrency','concurrency','Concurrency and async',[
      ['What is async I/O especially useful for?',['Waiting on many I/O operations','Replacing every CPU algorithm','Creating HTML','Making code always faster'],0,'Async I/O helps overlap waiting on operations that yield to an event loop.','async-await'],
      ['What is a race condition?',['A result dependent on timing/interleaving','A fast sort','A syntax error','A secure token'],0,'Concurrent operations can interleave in ways that affect results.','race-conditions'],
      ['What is a typical thread/process distinction?',['Threads share a process; processes have separate address spaces','Processes are always free','Threads only run Python 2','They are identical'],0,'Processes provide separate address spaces, while threads share process memory.','threads-processes']
    ]),
    make('q-appdev','application-dev','Application development',[
      ['Why use parameterized SQL queries?',['To separate values from SQL syntax','To style a webpage','To disable SQLite','To make all values integers'],0,'Parameters reduce SQL injection risk by keeping values separate from query text.','sqlite-design'],
      ['Where should a private API secret live?',['In public frontend JavaScript','In a protected server-side configuration when needed','In a public README','In a CSS custom property'],1,'Anything bundled into frontend code is visible to users.','config-secrets'],
      ['What does JSON commonly represent in APIs?',['Structured data exchange','A type of CSS selector','A Python loop','A compiler'],0,'JSON is a common format for request and response bodies.','http-json']
    ]),
    make('q-special','specializations','Specialization paths',[
      ['What should automation do before destructive file changes?',['Preview/dry-run and check edge cases','Delete everything immediately','Hide errors','Skip backups'],0,'Previewing intended changes helps identify mistakes before applying them.','automation-planning'],
      ['What does a data workflow often include?',['Cleaning and exploring data before modeling','Only training a model','Only changing CSS','Only downloading a file'],0,'Reliable data work includes collection, cleaning, exploration, modeling, and evaluation.','data-ai-path'],
      ['Should you assume every third-party package works in Pyodide?',['Yes, all packages work','No, package compatibility varies','Only if it is popular','Only if pip is installed'],1,'Native extensions and OS-specific behavior can limit browser compatibility.','web-game-path']
    ]),
    make('q-capstones','capstones','Capstone projects',[
      ['What is a useful first project step?',['Define a small testable milestone','Write the whole application at once','Skip requirements','Start with animations'],0,'Small milestones make project scope and testing manageable.','project-planning'],
      ['What should project tests include?',['Only the happy path','Normal behavior and meaningful edge cases','Only comments','No assertions'],1,'Boundary, invalid-input, and expected behavior tests improve confidence.','project-testing'],
      ['How should you describe known limitations?',['Hide them','State them clearly with future improvements','Claim everything is complete','Delete the README'],1,'Honest limitations help others understand what has and has not been verified.','capstone-review']
    ])
  ];
  window.PYTRAIL_QUIZZES=Q;
  function render(selectedId){
    const quizzes=window.PYTRAIL_QUIZZES;
    if(!selectedId)return `<div class="page-heading"><div><p class="eyebrow">CHECK YOUR UNDERSTANDING</p><h1>Quizzes</h1><p>Each module quiz has three questions, answer explanations, and a saved best score. Opening a quiz does not mark a lesson complete.</p></div></div><div class="grid-auto">${quizzes.map(quiz=>{const module=window.PYTRAIL_CURRICULUM.find(item=>item.id===quiz.moduleId);const best=window.PyTrailStorage.get().bestQuizScores[quiz.moduleId];return `<article class="project-card card"><div class="module-card-top"><span class="chip">${quiz.questions.length} questions</span>${best!==undefined?`<span class="module-status">Best: ${best}%</span>`:''}</div><h3>${module?module.title:quiz.title}</h3><p>Review key concepts from this stage of your learning path.</p><div class="project-foot"><span class="project-tag">${module?module.level:'Python'}</span><button class="button button-secondary button-small" data-open-quiz="${quiz.moduleId}">${best!==undefined?'Try again':'Start quiz'} →</button></div></article>`;}).join('')}</div>`;
    const quiz=quizzes.find(item=>item.moduleId===selectedId);if(!quiz)return render(null);
    return `<div class="page-heading"><div><p class="eyebrow">MODULE ASSESSMENT</p><h1>${quiz.title}</h1><p>Choose one answer for each question, then submit to see the score and explanations.</p></div><div class="heading-actions"><button class="button button-quiet" data-route="quizzes">← All quizzes</button></div></div><form id="quiz-form" data-module="${quiz.moduleId}">${quiz.questions.map((question,index)=>`<section class="quiz-question card"><p class="eyebrow">QUESTION ${index+1} OF ${quiz.questions.length}</p><h3>${question.prompt}</h3><div class="choice-list">${question.options.map((option,optionIndex)=>`<label class="choice-option"><input type="radio" name="question-${index}" value="${optionIndex}" required><span>${option}</span></label>`).join('')}</div><div class="quiz-feedback" id="quiz-feedback-${index}" aria-live="polite"></div></section>`).join('')}<button class="button button-primary" type="submit">Submit answers →</button></form><div id="quiz-result" class="card quiz-result" hidden aria-live="polite"></div>`;
  }
  function bind(){
    document.querySelectorAll('[data-open-quiz]').forEach(button=>button.addEventListener('click',()=>window.PyTrailRouter.navigate('quizzes',button.dataset.openQuiz)));
    const form=document.getElementById('quiz-form');if(!form)return;
    const quiz=window.PYTRAIL_QUIZZES.find(item=>item.moduleId===form.dataset.module);if(!quiz)return;
    form.addEventListener('submit',event=>{event.preventDefault();let score=0;quiz.questions.forEach((question,index)=>{const chosen=form.querySelector(`input[name="question-${index}"]:checked`);const correct=chosen&&Number(chosen.value)===question.answer;if(correct)score++;const node=document.getElementById(`quiz-feedback-${index}`);node.textContent=(correct?'Correct. ':'Not quite. ')+question.explanation+(correct?'':' Review: '+(window.PYTRAIL_LESSONS.find(item=>item.id===question.lessonId)||{}).title);node.style.color=correct?'var(--success)':'var(--error)';});const percent=window.PyTrailProgress.recordQuiz(quiz.moduleId,score,quiz.questions.length);const result=document.getElementById('quiz-result');result.hidden=false;result.innerHTML=`<p class="eyebrow">RESULT</p><div class="quiz-score">${percent}%</div><h2>${percent>=70?'Nice work — milestone reached':'Good practice. Keep going.'}</h2><p>You answered ${score} of ${quiz.questions.length} questions correctly. ${percent>=70?'Your score is saved locally.':'Review the explanations and try again when you are ready.'}</p><div class="heading-actions" style="justify-content:center;margin-top:14px"><button class="button button-primary" type="button" data-retry-quiz>Try again</button><button class="button button-secondary" type="button" data-route="lesson/${quiz.questions[0].lessonId}">Review lesson</button></div>`;window.PyTrail.bindRouteButtons();result.querySelector('[data-retry-quiz]').addEventListener('click',()=>window.PyTrailRouter.navigate('quizzes',quiz.moduleId));result.scrollIntoView({behavior:'smooth',block:'nearest'});});
  }
  window.PyTrailQuizzes={render,bind};
})();
