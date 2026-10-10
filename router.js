(function () {
  function parse(){
    const raw=decodeURIComponent((location.hash||'#dashboard').slice(1));
    const parts=raw.split('/');
    const aliases={home:'dashboard',settings:'settings'};
    const route=aliases[parts[0]]||parts[0]||'dashboard';
    return {route,id:parts.slice(1).join('/')||null};
  }
  function navigate(route,id){
    const normalized=String(route||'dashboard').replace(/^#/,'');
    const target='#'+normalized+(id?'/'+encodeURIComponent(id):'');
    if(location.hash===target){renderCurrent();return;}
    location.hash=target;
  }
  function renderCurrent(){const current=parse();if(window.PyTrailApp)window.PyTrailApp.render(current.route,current.id);}
  window.addEventListener('hashchange',renderCurrent);
  window.PyTrailRouter={parse,navigate,renderCurrent};
})();
