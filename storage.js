(function () {
  const KEY = 'pytrail-progress-v1';
  const VERSION = 2;
  const now = () => new Date().toISOString();
  const EMPTY = () => ({
    version: VERSION,
    savedAt: now(),
    completedLessons: [], completedExercises: [], exerciseAttempts: {},
    quizAttempts: {}, bestQuizScores: {}, completedProjects: [], projectMilestones: {},
    lastLessonId: null, lastRoute: 'dashboard', lastModuleId: 'start',
    bookmarks: [], notes: {}, drafts: {}, theme: 'dark', editorPrefs: {fontSize: 12, wrap: false},
    achievements: [], recentActivity: [], settings: {confirmReset: true}, statistics: {runs: 0}
  });
  let data = EMPTY();

  function plainObject(value, field, maxEntries=2000) {
    if (value === undefined) return {};
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`The ${field} field must be an object.`);
    const entries = Object.entries(value);
    if (entries.length > maxEntries) throw new Error(`The ${field} field contains too many entries.`);
    for (const [key] of entries) if (!key || key.length > 180 || ['__proto__','constructor','prototype'].includes(key)) throw new Error(`The ${field} field contains an invalid key.`);
    return Object.fromEntries(entries);
  }
  function stringArray(value, field, max=5000) {
    if (value === undefined) return [];
    if (!Array.isArray(value) || value.length > max || !value.every(item => typeof item === 'string' && item.length <= 180)) {
      throw new Error(`The ${field} field is invalid or too large.`);
    }
    return [...new Set(value)];
  }
  function optionalString(value, field, max=180, nullable=false) {
    if (value === undefined || (nullable && value === null)) return nullable ? null : '';
    if (typeof value !== 'string' || value.length > max) throw new Error(`The ${field} field must be a short string${nullable ? ' or null' : ''}.`);
    return value;
  }
  function boundedInteger(value, field, min, max, defaultValue) {
    if (value === undefined) return defaultValue;
    if (!Number.isInteger(value) || value < min || value > max) throw new Error(`The ${field} field must be an integer between ${min} and ${max}.`);
    return value;
  }
  function timestamp(value, field) {
    if (value === undefined || value === null) return null;
    if (typeof value !== 'string' || value.length > 40 || Number.isNaN(Date.parse(value))) throw new Error(`The ${field} field must be a valid timestamp string.`);
    return value;
  }
  function sanitizeImported(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('The backup must be a JSON object.');
    if (value.version !== 1 && value.version !== VERSION) throw new Error('This backup uses an unsupported progress format version.');
    const safe = EMPTY();
    ['completedLessons','completedExercises','completedProjects','bookmarks'].forEach(key => { safe[key] = stringArray(value[key], key); });
    safe.achievements = stringArray(value.achievements, 'achievements', 500);
    safe.lastLessonId = optionalString(value.lastLessonId, 'lastLessonId', 180, true);
    safe.lastRoute = value.lastRoute === undefined ? 'dashboard' : optionalString(value.lastRoute, 'lastRoute', 80);
    safe.lastModuleId = value.lastModuleId === undefined ? 'start' : optionalString(value.lastModuleId, 'lastModuleId', 80);
    if (value.theme !== undefined && value.theme !== 'light' && value.theme !== 'dark') throw new Error('The theme field must be "light" or "dark".');
    safe.theme = value.theme === 'light' ? 'light' : 'dark';

    const notes = plainObject(value.notes, 'notes', 1000);
    for (const [key, note] of Object.entries(notes)) {
      if (typeof note !== 'string' || note.length > 10000) throw new Error('Every note must be text no longer than 10,000 characters.');
      safe.notes[key] = note;
    }
    const drafts = plainObject(value.drafts, 'drafts', 200);
    for (const [key, code] of Object.entries(drafts)) {
      if (typeof code !== 'string' || code.length > 150000) throw new Error('Every saved code draft must be text no longer than 150,000 characters.');
      safe.drafts[key] = code;
    }

    const exerciseAttempts = plainObject(value.exerciseAttempts, 'exerciseAttempts', 5000);
    for (const [id, item] of Object.entries(exerciseAttempts)) {
      if (!item || typeof item !== 'object' || Array.isArray(item)) throw new Error(`Exercise attempt ${id} is invalid.`);
      const attempts = boundedInteger(item.attempts, `${id}.attempts`, 0, 1000000, 0);
      const correct = boundedInteger(item.correct, `${id}.correct`, 0, attempts, 0);
      safe.exerciseAttempts[id] = {attempts, correct, lastAt:timestamp(item.lastAt, `${id}.lastAt`)};
    }

    const quizAttempts = plainObject(value.quizAttempts, 'quizAttempts', 200);
    for (const [moduleId, items] of Object.entries(quizAttempts)) {
      if (!Array.isArray(items) || items.length > 30) throw new Error(`Quiz attempts for ${moduleId} must be an array of at most 30 results.`);
      safe.quizAttempts[moduleId] = items.map((item, index) => {
        if (!item || typeof item !== 'object' || Array.isArray(item)) throw new Error(`Quiz result ${moduleId}[${index}] is invalid.`);
        const total = boundedInteger(item.total, `${moduleId}.total`, 1, 500, 0);
        const score = boundedInteger(item.score, `${moduleId}.score`, 0, total, 0);
        return {score, total, percent:Math.round(score / total * 100), at:timestamp(item.at, `${moduleId}.at`) || now()};
      });
    }
    const bestScores = plainObject(value.bestQuizScores, 'bestQuizScores', 200);
    for (const [moduleId, score] of Object.entries(bestScores)) {
      if (typeof score !== 'number' || !Number.isFinite(score) || score < 0 || score > 100) throw new Error(`Best quiz score for ${moduleId} must be between 0 and 100.`);
      safe.bestQuizScores[moduleId] = score;
    }

    const milestones = plainObject(value.projectMilestones, 'projectMilestones', 1000);
    for (const [projectId, values] of Object.entries(milestones)) {
      if (!Array.isArray(values) || values.length > 100 || !values.every(item => Number.isInteger(item) && item >= 0 && item <= 1000)) throw new Error(`Milestones for ${projectId} are invalid.`);
      safe.projectMilestones[projectId] = [...new Set(values)];
    }

    if (value.editorPrefs !== undefined) {
      const prefs = plainObject(value.editorPrefs, 'editorPrefs', 5);
      const fontSize = prefs.fontSize === undefined ? 12 : prefs.fontSize;
      if (typeof fontSize !== 'number' || !Number.isFinite(fontSize) || fontSize < 8 || fontSize > 30) throw new Error('Editor font size must be between 8 and 30.');
      if (prefs.wrap !== undefined && typeof prefs.wrap !== 'boolean') throw new Error('Editor wrap preference must be true or false.');
      safe.editorPrefs = {fontSize, wrap:prefs.wrap === true};
    }
    if (value.settings !== undefined) {
      const settings = plainObject(value.settings, 'settings', 10);
      if (settings.confirmReset !== undefined && typeof settings.confirmReset !== 'boolean') throw new Error('The confirmReset setting must be true or false.');
      safe.settings = {confirmReset:settings.confirmReset !== false};
    }
    if (value.statistics !== undefined) {
      const stats = plainObject(value.statistics, 'statistics', 10);
      safe.statistics = {runs:boundedInteger(stats.runs, 'statistics.runs', 0, 10000000, 0)};
    }

    if (value.recentActivity !== undefined) {
      if (!Array.isArray(value.recentActivity) || value.recentActivity.length > 50) throw new Error('The recentActivity field must contain at most 50 records.');
      safe.recentActivity = value.recentActivity.map((item, index) => {
        if (!item || typeof item !== 'object' || Array.isArray(item) || typeof item.label !== 'string' || item.label.length > 160) throw new Error(`Recent activity record ${index} is invalid.`);
        return {label:item.label, at:timestamp(item.at, `recentActivity[${index}].at`) || now(), type:item.type === undefined ? 'activity' : optionalString(item.type, `recentActivity[${index}].type`, 40)};
      });
    }
    safe.version = VERSION;
    safe.savedAt = now();
    return safe;
  }
  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) { data = EMPTY(); return data; }
      if (raw.length > 5_000_000) throw new Error('Saved progress is unusually large.');
      const parsed = JSON.parse(raw);
      if (parsed.version === 1) parsed.version = VERSION; // v1 -> v2 adds notes, drafts, editor, and settings defaults.
      data = sanitizeImported(parsed);
      return data;
    } catch (error) {
      data = EMPTY();
      window.PyTrailStorageWarning = 'Local progress could not be read safely. A fresh progress record is in use.';
      console.warn('PyTrail storage recovery:', error);
      return data;
    }
  }
  function save() {
    data.version = VERSION;
    data.savedAt = now();
    try {
      localStorage.setItem(KEY, JSON.stringify(data));
      return true;
    } catch (error) {
      console.warn('PyTrail could not save local progress:', error);
      if (window.PyTrail && typeof window.PyTrail.toast === 'function') window.PyTrail.toast('Browser storage is unavailable or full. Export a backup before continuing.', 'error');
      return false;
    }
  }
  function get() { return data; }
  function update(mutator) {
    mutator(data);
    save();
    document.dispatchEvent(new CustomEvent('pytrail:progress-changed', {detail:data}));
    return data;
  }
  function reset() { data = EMPTY(); save(); document.dispatchEvent(new CustomEvent('pytrail:progress-changed', {detail:data})); return data; }
  function exportJSON() {
    const payload = Object.assign({}, data, {version: VERSION, exportedAt: now()});
    return JSON.stringify(payload, null, 2);
  }
  function importJSON(text) {
    if (typeof text !== 'string' || text.length > 5_000_000) throw new Error('The backup file is too large or could not be read.');
    let parsed;
    try { parsed = JSON.parse(text); } catch { throw new Error('This file is not valid JSON.'); }
    const validated = sanitizeImported(parsed); // Validate completely before replacing the current record.
    data = validated;
    save();
    document.dispatchEvent(new CustomEvent('pytrail:progress-changed', {detail:data}));
    return data;
  }
  load();
  window.PyTrailStorage = {KEY, VERSION, get, update, save, reset, exportJSON, importJSON, load};
})();
