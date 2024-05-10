console.log('Hello From Thousand Trails Common.js');

// dynamically load additional scripts
const indexedDBScript = document.createElement('script');
indexedDBScript.src = 'https://nick71o.github.io/Thousand%20Trails%20IndexedDB.js';
document.head.appendChild(indexedDBScript);

const axiosScript = document.createElement('script');
axiosScript.src = 'https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js';
document.head.appendChild(axiosScript);