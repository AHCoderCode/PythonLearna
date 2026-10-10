# PyTrail Academy QA checklist

Use this checklist again after changing the project or before publishing. A static check is not the same as an interactive test of the browser runtime.

## Verified in this delivery environment

- [x] The required static-site files are present, and every deferred script path in `index.html` points to an existing file.
- [x] All JavaScript files pass `node --check` syntax validation.
- [x] The curriculum data loads in a JavaScript VM with 20 modules and 60 unique lesson IDs.
- [x] The curriculum contains 216 module-topic entries across its 20 stages.
- [x] All 15 coding exercises link to existing modules and lessons.
- [x] All 20 project records have IDs, starter code, and milestone lists.
- [x] The app defines 20 module quizzes, and every quiz has three multiple-choice questions in its data.
- [x] The 60 published lesson sample programs were executed with local CPython and their captured output was compared with the authored reference output (see test command below).
- [x] All 15 exercise reference solutions were run with local CPython and their output matched the configured checker output.
- [x] All 40 project starter/solution snippets parse as Python source, and the 20 reference solutions were run locally with smoke input data. These are sample checks, not comprehensive test coverage for all branches.
- [x] Progress backup validation was exercised for valid export/import, malformed JSON, unsupported versions, invalid nested values, and oversized payloads.
- [x] The lightweight smoke-check script passes: `node tests/smoke-check.js`.
- [x] The runtime URL is explicitly pinned to the stable Pyodide `v314.0.7` CDN distribution rather than a floating development URL.

## Browser checks to perform before public release

- [ ] Open the site in a current Chromium-based browser and Firefox over `http://localhost` or HTTPS.
- [ ] Confirm the dashboard renders with no uncaught JavaScript errors.
- [ ] Navigate through every main page and open a lesson, exercise, quiz, and project detail page.
- [ ] Open the Python Playground and wait until the runtime reports Ready.
- [ ] Run `print("Hello, World!")` and verify the console shows Python-produced output.
- [ ] Change the submitted code and confirm the output changes.
- [ ] Verify arithmetic, variables, conditions, loops, functions, collections, exceptions, and Unicode output.
- [ ] Run syntax-error and runtime-exception examples and verify the console reports their actual tracebacks.
- [ ] Try an empty program and a program that prints nothing.
- [ ] Verify `input()` by running the input-conversion lesson with `Alex` and `15`, then check the actual output.
- [ ] Verify multiple input values, a missing input/EOF case, and additional stdin lines for repeated inputs.
- [ ] Click Stop during a long-running program and verify the worker is terminated and the session restarts.
- [ ] Restart the Python session and confirm variables/imports from the old session are gone while editor code remains.
- [ ] Test Run repeatedly and verify output from separate runs is not mixed together.
- [ ] Test Reset Code, Copy, Download `.py`, Clear output, fullscreen, Tab indentation, Ctrl+Enter, and Ctrl+S.
- [ ] Complete a lesson and verify completion survives refresh; confirm merely opening a lesson does not complete it.
- [ ] Edit a lesson note, bookmark a lesson, and change the theme; refresh and verify they persist.
- [ ] Solve an exercise and verify its checker uses real Python output; try an incorrect answer and confirm useful feedback appears.
- [ ] Submit each quiz type, check the score and explanations, then retake it and inspect the saved best score.
- [ ] Check all project milestones, mark a project complete, and verify the dashboard/stats update.
- [ ] Search lesson titles, code terms, exercises, projects, cheat-sheet entries, and glossary terms; verify the target opens correctly.
- [ ] Export a JSON backup and confirm the downloaded file is valid JSON with schema version 2.
- [ ] Import the backup into a clean browser profile and verify the saved state is restored.
- [ ] Verify invalid JSON, unsupported versions, incorrect field types, oversized backups, and out-of-range values are rejected without replacing current progress.
- [ ] Confirm the reset action asks for confirmation and clears only after approval.
- [ ] Check the mobile navigation drawer, lesson reader, code editor, console, dialogs, search, and buttons at a 390px viewport.
- [ ] Confirm no horizontal page overflow at 320px, 390px, tablet width, and desktop width.
- [ ] Verify keyboard focus visibility, form labels, dialog keyboard operation, text contrast, and reduced-motion behavior.
- [ ] Simulate CDN/network failure and verify lessons remain available, the editor code is preserved, and a clear runtime error is shown.
- [ ] Verify supported/unsupported package examples match the documented Pyodide runtime limitations.
- [ ] Test GitHub Pages, Vercel, and direct deployment from a static host after publication.

## Commands

From the project folder, run the structural check:

```bash
node tests/smoke-check.js
```

Syntax-check all JavaScript files on a machine with Node.js:

```bash
find js data tests -name '*.js' -print0 | xargs -0 -n1 node --check
```

## Verification limitation in this delivery environment

An interactive browser test could not be completed here because the available browser harness was blocked from navigating both the local test server and `file://` URLs by the environment policy. Therefore the CDN download, Pyodide worker startup, execution, live `input()` flow, UI interactions, and visual responsive layout are listed above as **not yet browser-verified**. Do not interpret successful syntax/data checks as a pass for those runtime checks.
