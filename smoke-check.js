/* Run with: node tests/smoke-check.js. This is a data/structure check, not a live browser-runtime test. */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const root = path.resolve(__dirname, '..');
const required = [
  'index.html','README.md','QA-CHECKLIST.md','css/styles.css','css/editor.css','css/responsive.css',
  'js/app.js','js/router.js','js/storage.js','js/progress.js','js/python-runner.js','js/pyodide-worker.js','js/editor.js','js/exercises.js','js/quizzes.js','js/projects.js','js/search.js',
  'data/curriculum.js','data/exercises.js','data/projects.js','data/reference.js','tests/smoke-check.js'
];
const missing = required.filter(file => !fs.existsSync(path.join(root, file)));
if (missing.length) { console.error('Missing required files:', missing.join(', ')); process.exit(1); }
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const scripts = [...html.matchAll(/<script defer src="([^"]+)"/g)].map(match => match[1]);
const missingScripts = scripts.filter(file => !fs.existsSync(path.join(root, file)));
if (missingScripts.length) { console.error('Broken script references:', missingScripts.join(', ')); process.exit(1); }
const context = {window:{}, console};
for (const file of ['data/curriculum.js','data/exercises.js','data/projects.js','data/reference.js','js/quizzes.js']) {
  vm.runInNewContext(fs.readFileSync(path.join(root, file), 'utf8'), context, {filename:file});
}
const modules = context.window.PYTRAIL_CURRICULUM || [];
const lessons = context.window.PYTRAIL_LESSONS || [];
const exercises = context.window.PYTRAIL_EXERCISES || [];
const projects = context.window.PYTRAIL_PROJECTS || [];
const quizzes = context.window.PYTRAIL_QUIZZES || [];
const unique = items => new Set(items).size === items.length;
const moduleIds = modules.map(item => item.id);
const lessonIds = lessons.map(item => item.id);
const projectIds = projects.map(item => item.id);
if (modules.length !== 20 || lessons.length !== 60 || exercises.length < 15 || projects.length !== 20 || quizzes.length !== 20) {
  throw new Error(`Dataset counts unexpected: ${modules.length} modules, ${lessons.length} lessons, ${exercises.length} exercises, ${projects.length} projects, ${quizzes.length} quizzes.`);
}
if (!unique(moduleIds) || !unique(lessonIds) || !unique(projectIds)) throw new Error('Module, lesson, or project IDs are duplicated.');
const badExercises = exercises.filter(item => !lessonIds.includes(item.lessonId) || !moduleIds.includes(item.moduleId) || !item.solution || typeof item.expectedOutput !== 'string');
if (badExercises.length) throw new Error('Invalid exercise links or checker fields: ' + badExercises.map(item => item.id).join(', '));
const badProjects = projects.filter(item => !item.id || !item.starter || !item.solution || !Array.isArray(item.milestones) || !item.milestones.length || !Array.isArray(item.requirements) || !item.requirements.length || !Array.isArray(item.hints) || !Array.isArray(item.tests) || !item.solutionExplanation);
if (badProjects.length) throw new Error('Invalid project records: ' + badProjects.map(item => item.id).join(', '));
const badQuizzes = quizzes.filter(quiz => !moduleIds.includes(quiz.moduleId) || quiz.questions.length !== 3 || quiz.questions.some(question => question.options.length !== 4 || !Number.isInteger(question.answer) || question.answer < 0 || question.answer > 3 || !lessonIds.includes(question.lessonId)));
if (badQuizzes.length || moduleIds.some(id => !quizzes.some(quiz => quiz.moduleId === id))) throw new Error('A module quiz is missing or has invalid questions/lesson references.');
const worker = fs.readFileSync(path.join(root, 'js/pyodide-worker.js'), 'utf8');
if (!html.includes('main-content') || !html.includes('program-input-form')) throw new Error('Core application shell or input dialog missing.');
if (!worker.includes('https://cdn.jsdelivr.net/pyodide/v314.0.7/full/')) throw new Error('Pinned Pyodide runtime URL missing.');
if (!worker.includes('runPythonAsync') || !worker.includes('setStdin')) throw new Error('Actual Python execution or stdin handling is missing.');
console.log(`PASS: ${required.length} required project files exist.`);
console.log(`PASS: all ${scripts.length} deferred script references resolve.`);
console.log(`PASS: ${modules.length} modules, ${lessons.length} unique lessons, ${exercises.length} exercises, ${projects.length} projects, and ${quizzes.length} linked module quizzes validated.`);
console.log('PASS: pinned Pyodide worker, Python execution API, and input mechanism are present.');
console.log('NOTE: run browser QA in QA-CHECKLIST.md separately; this script does not claim live runtime verification.');
