(function () {
  const storage = () => window.PyTrailStorage.get();
  const uniquePush = (array, item) => { if (!array.includes(item)) array.push(item); };
  function activity(label, type='activity') {
    window.PyTrailStorage.update(data => {
      data.recentActivity.unshift({label, type, at:new Date().toISOString()});
      data.recentActivity = data.recentActivity.slice(0, 50);
    });
  }
  function completedLessons() { return storage().completedLessons; }
  function isLessonComplete(id) { return completedLessons().includes(id); }
  function markLessonComplete(id) {
    const lesson = (window.PYTRAIL_LESSONS || []).find(item => item.id === id);
    if (!lesson) return false;
    window.PyTrailStorage.update(data => {
      uniquePush(data.completedLessons, id);
      data.lastLessonId = id;
      data.lastModuleId = lesson.moduleId;
      data.lastRoute = 'lesson';
      data.achievements = data.achievements || [];
      if (data.completedLessons.length >= 1) uniquePush(data.achievements, 'first-lesson');
      if (data.completedLessons.length >= 5) uniquePush(data.achievements, 'five-lessons');
      const module = (window.PYTRAIL_CURRICULUM || []).find(item => item.id === lesson.moduleId);
      if (module && module.lessons.every(item => data.completedLessons.includes(item.id))) uniquePush(data.achievements, 'module-'+module.id);
      data.recentActivity.unshift({label:'Completed lesson: '+lesson.title,type:'lesson',at:new Date().toISOString()});
      data.recentActivity = data.recentActivity.slice(0,50);
    });
    return true;
  }
  function recordExerciseAttempt(id, correct) {
    window.PyTrailStorage.update(data => {
      data.exerciseAttempts[id] = data.exerciseAttempts[id] || {attempts:0, correct:0, lastAt:null};
      data.exerciseAttempts[id].attempts += 1;
      if (correct) {
        data.exerciseAttempts[id].correct += 1;
        uniquePush(data.completedExercises, id);
        if (data.completedExercises.length >= 1) uniquePush(data.achievements, 'first-exercise');
      }
      data.exerciseAttempts[id].lastAt = new Date().toISOString();
      data.recentActivity.unshift({label:(correct?'Solved exercise: ':'Tried exercise: ')+id,type:'exercise',at:new Date().toISOString()});
      data.recentActivity = data.recentActivity.slice(0,50);
    });
  }
  function recordQuiz(moduleId, score, total) {
    const percent = total ? Math.round(score / total * 100) : 0;
    window.PyTrailStorage.update(data => {
      data.quizAttempts[moduleId] = data.quizAttempts[moduleId] || [];
      data.quizAttempts[moduleId].push({score,total,percent,at:new Date().toISOString()});
      data.quizAttempts[moduleId] = data.quizAttempts[moduleId].slice(-30);
      data.bestQuizScores[moduleId] = Math.max(data.bestQuizScores[moduleId] || 0, percent);
      if (percent >= 70) uniquePush(data.achievements, 'first-quiz');
      data.recentActivity.unshift({label:`Quiz: ${moduleId} — ${percent}%`,type:'quiz',at:new Date().toISOString()});
      data.recentActivity = data.recentActivity.slice(0,50);
    });
    return percent;
  }
  function markProjectComplete(id) {
    window.PyTrailStorage.update(data => {
      uniquePush(data.completedProjects, id);
      if (data.completedProjects.length >= 1) uniquePush(data.achievements, 'first-project');
      data.recentActivity.unshift({label:'Completed project: '+id,type:'project',at:new Date().toISOString()});
      data.recentActivity = data.recentActivity.slice(0,50);
    });
  }
  function toggleBookmark(id) {
    let added = false;
    window.PyTrailStorage.update(data => {
      const index = data.bookmarks.indexOf(id);
      if (index >= 0) data.bookmarks.splice(index,1);
      else { data.bookmarks.push(id); added = true; }
    });
    return added;
  }
  function completionPercent() {
    const lessons = window.PYTRAIL_LESSONS || [];
    return lessons.length ? Math.round(completedLessons().filter(id => lessons.some(l => l.id === id)).length / lessons.length * 100) : 0;
  }
  function modulePercent(module) {
    return module.lessons.length ? Math.round(module.lessons.filter(l => isLessonComplete(l.id)).length / module.lessons.length * 100) : 0;
  }
  function currentLesson() {
    const id = storage().lastLessonId;
    return (window.PYTRAIL_LESSONS || []).find(item => item.id === id) || (window.PYTRAIL_LESSONS || [])[0] || null;
  }
  window.PyTrailProgress = {activity, completedLessons, isLessonComplete, markLessonComplete, recordExerciseAttempt, recordQuiz, markProjectComplete, toggleBookmark, completionPercent, modulePercent, currentLesson};
})();
