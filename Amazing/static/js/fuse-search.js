// perform searching via Fuse.js with data from /index.json
(d => {
  const input = d.querySelector('#search-input'),
       output = d.querySelector('.search-results');

  if (!input || !output) return;

  const ds = input.dataset;
  // load search index for Fuse.js
  let fuse;
  input.addEventListener('focus', e => {
    if (fuse) return;
    input.placeholder = ds.infoInit ||
      'Loading search index... Please hold on.';
    const request = new XMLHttpRequest();
    request.responseType = 'json';
    request.addEventListener('load', e => {
      const res = request.response;
      if (!res || res.length === 0) {
        input.placeholder = ds.infoFail ||
          'Failed to load search index!';
        return;
      }
      input.placeholder = ds.infoOk || 'Type to search:';
      input.focus();
      fuse = new Fuse(res, {
        keys: [{name: 'title', weight: 5}, 'content'],
        useExtendedSearch: true,
        includeMatches: true,
        ignoreLocation: true,
        threshold: 0.5
      });
    }, false);
    request.open('GET', '/index.json');
    request.send(null);
  });

  // highlight the keyword of the maximum length in content
  function highlight(res, key, len) {
    let indices;
    for (let m of res.matches) {
      if (m.key === key) indices = m.indices;
    }
    const text = res.item[key];
    if (!indices) return text.substr(0, len);
    let p, pair, k = 0, n = Math.ceil(len / 2);
    while (pair = indices.shift()) {
      if (pair[1] - pair[0] >= k) {
        p = pair;
        k = p[1] - p[0];
      }
    }
    return (p[0] - n > 0 ? '[...] ' : '') + text.substring(p[0] - n, p[0]) +
      '<b>' + text.substring(p[0], p[1] + 1) + '</b>' +
      text.substring(p[1] + 1, p[1] + 1 + n) +
      (p[1] + 1 + n < text.length ? ' [...] ' : '');
  }

  // debounce the search for better performance and UX
  function debounce(fn, delay) {
    let timeout;
    return function(...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => fn(...args), delay);
    };
  }
  const len = ds.textLength || 400,  // number of chars for each search result
    lim = ds.limit || 50,  // max number of search results
    delay = ds.delay || 200,  // search delay after input
    tpl = output.firstElementChild.cloneNode(true);  // search result template
  output.innerHTML = '';
  function search() {
  if (!fuse) return;

  const inputValue = input.value.trim(); // Remove leading/trailing spaces
  output.innerHTML = ''; // Clear previous search results

  if (inputValue) {
    // display search results in <section> and highlight keywords
    const searchResults = fuse.search(inputValue, { limit: lim });
    if (searchResults.length > 0) {
      for (let res of searchResults) {
        const sec = tpl.cloneNode(true);
        const a = sec.querySelector('a');
        a.href = res.item.uri;
        a.innerHTML = highlight(res, 'title', len);
        sec.querySelector('.search-preview').innerHTML = highlight(res, 'content', len);
        output.appendChild(sec);
      }
    } else {
      output.innerHTML = 'No results found. Try a different query.';
    }
  } else {
    output.innerHTML = '';
  }
}
  const isMobi = /Mobi/i.test(navigator.userAgent);
  input.addEventListener(isMobi ? 'input' : 'input', isMobi ? debounce(search, delay) : search);

  document.addEventListener('click', function(event) {
        if (!output.contains(event.target)) {
            output.innerHTML = ''; // Clear search results
        }
    });

})(document);
