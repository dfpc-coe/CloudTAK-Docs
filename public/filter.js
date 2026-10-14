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

    grid.querySelectorAll('.tile').forEach((tile) => {
      const match = !query || normalize(tile.textContent).includes(query);
      tile.hidden = !match;
      if (match) visible += 1;
    });

    if (empty) empty.hidden = visible > 0;

    const url = new URL(window.location.href);
    if (query) {
      url.searchParams.set('q', input.value);
    } else {
      url.searchParams.delete('q');
    }
    window.history.replaceState(null, '', url);
  }

  document.querySelectorAll('input[data-filter]').forEach((input) => {
    const initial = new URL(window.location.href).searchParams.get('q');
    if (initial) input.value = initial;
    input.addEventListener('input', () => applyFilter(input));
    applyFilter(input);
  });
})();
