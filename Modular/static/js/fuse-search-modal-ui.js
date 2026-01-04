// Handle search input
const searchInput = document.getElementById('searchInput');
const searchResults = document.createElement('div');
searchResults.className = 'search-results mt-2';
searchInput.parentNode.parentNode.appendChild(searchResults);

let searchData = [];
let fuse;


const fileIndexPath = searchInput.getAttribute('b-search-file-index') || '/index.json'; // fallback to default

// Fetch search data when page loads
fetch(fileIndexPath)
  .then(response => response.json())
  .then(data => {
    searchData = data;
    fuse = new Fuse(searchData, {
      keys: [{
        name: 'title',
        weight: 2
      }, {
        name: 'content',
        weight: 1
      }],
      threshold: 0.3,
      includeScore: true,
      includeMatches: true,
      findAllMatches: true, // Change if required
      ignoreLocation: true, // Change if required
      distance: 100, // Change if required
      minMatchCharLength: 3,
      useExtendedSearch: true
    });

    // Modify the search input listener
    searchInput.addEventListener('input', function(e) {
      const searchTerm = e.target.value;
      if (searchTerm.length < 2) {
        searchResults.innerHTML = '';
        return;
      }

      // Use extended search syntax for exact matching
      const results = fuse.search(searchTerm);
   

      displayResults(results);
    });
  })

function findContentSnippet(result) {
  const contentMatches = result.matches.find(m => m.key === 'content');
  const titleMatches = result.matches.find(m => m.key === 'title');

  if (!contentMatches) {
    return result.item.content.substring(0, 200);
  }

  // Store matches in array with their details
  let matches = [];

  [contentMatches, titleMatches].forEach(matchGroup => {
    if (!matchGroup) return;
    
    matchGroup.indices.forEach(([start, end]) => {
      matches.push({
        length: (end + 1) - start,
        start: start,
        end: end + 1,
        field: matchGroup.key,
        text: matchGroup.value.substring(start, end + 1)
      });
    });
  });

  // Sort by length descending and take top 3
  matches.sort((a, b) => b.length - a.length);
  matches = matches.slice(0, 3).filter(m => m.field === 'content');

  if (matches.length === 0) {
    return result.item.content.substring(0, 200);
  }

  const content = result.item.content;
  let snippet = '';
  let lastEnd = 0;

  matches.forEach((match, index) => {
    const snippetStart = Math.max(0, match.start - 100); // Show ~100 chars before match
    const snippetEnd = Math.min(content.length, match.end + 100); // Show ~100 chars after match
    
    if (index > 0) snippet += '...  <br/> [...] ';
    
    snippet += content.substring(snippetStart, match.start) +
               `<strong>${content.substring(match.start, match.end)}</strong>` +
               content.substring(match.end, snippetEnd);
    
    lastEnd = snippetEnd;
  });

  return snippet;
}

// 2. Add this new function after findContentSnippet
function highlightTitle(result) {
  const titleMatches = result.matches.find(m => m.key === 'title');
  if (!titleMatches) return result.item.title;

  let title = result.item.title;
  const indices = [...titleMatches.indices].sort((a, b) => b[0] - a[0]);
  
  indices.forEach(([start, end]) => {
    const before = title.substring(0, start);
    const match = title.substring(start, end + 1);
    const after = title.substring(end + 1);
    title = `${before}<strong>${match}</strong>${after}`;
  });
  
  return title;
}

// 3. Replace the existing displayResults function
function displayResults(results) {
  if (!results.length) {
    searchResults.innerHTML = '<p class="text-muted">No results found. Please try a different query. </p>';
    return;
  }

  // Deduplicate results based on URI
  const uniqueResults = results.reduce((acc, current) => {
    const exists = acc.find(item => 
      item.item.uri === current.item.uri || 
      item.item.title === current.item.title
    );
    if (!exists) {
      acc.push(current);
    }
    return acc;
  }, []);

  const html = uniqueResults
    .slice(0, 7)
    .map(result => `
      <div class="result-item p-2 border-bottom">
        <a href="${result.item.uri}" class="text-decoration-none" target="_blank">
          <h6 class="mb-1">${highlightTitle(result)}</h6>
          <small class="text-muted">[...] ${findContentSnippet(result)}...</small>
        </a>
      </div>
    `)
    .join('');

  searchResults.innerHTML = html;
}

