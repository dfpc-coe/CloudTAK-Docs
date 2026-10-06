(function () {
  function normalize(text) {
    return (text || '').toLowerCase().replace(/\s+/g, ' ').trim();
  }

  function applyFilter(input) {
    const grid = document.getElementById(input.dataset.filter);
    if (!grid) return;

    const query = normalize(input.value);
    const empty = document.querySelector('[data-filter-empty="' + input.dataset.filter + '"]');
    let visible = 0;

    grid.querySelectorAll('.docs-card').forEach((card) => {
      const match = !query || normalize(card.textContent).includes(query);
      card.hidden = !match;
      if (match) visible += 1;
    });

    if (empty) empty.hidden = visible > 0;

    const url = new URL(window.location.href);
    if (query) {
      url.searchParams.set('q', input.value);
    } else {
      url.searchParams.delete('q');
    }
    try {
      window.history.replaceState(null, '', url);
    } catch (err) {
      // file:// pages cannot rewrite their URL
    }
  }

  function bindFilters() {
    document.querySelectorAll('input[data-filter]').forEach((input) => {
      if (input.dataset.filterBound) return;
      input.dataset.filterBound = 'true';

      const initial = new URL(window.location.href).searchParams.get('q');
      if (initial) input.value = initial;

      input.addEventListener('input', () => applyFilter(input));
      applyFilter(input);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindFilters);
  } else {
    bindFilters();
  }

  if (typeof document$ !== 'undefined' && document$ && typeof document$.subscribe === 'function') {
    document$.subscribe(bindFilters);
  }
})();
