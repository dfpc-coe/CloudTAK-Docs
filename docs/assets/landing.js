(function () {
  function applyLandingLayout() {
    const isLandingPage = Boolean(document.querySelector('.docs-landing'));

    if (!document.body) return;

    document.body.classList.toggle('docs-landing-page', isLandingPage);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyLandingLayout);
  } else {
    applyLandingLayout();
  }

  if (typeof document$ !== 'undefined' && document$ && typeof document$.subscribe === 'function') {
    document$.subscribe(applyLandingLayout);
  }
})();