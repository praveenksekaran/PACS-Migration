// Runtime configuration loaded by index.html before the React app starts.
//
// Development: leave apiUrl empty so all /rs and /wadouri requests go through
// the Vite dev-server proxy (configured in vite.config.ts) → http://localhost:5001
//
// Production: set apiUrl to the base URL of your PACS backend, e.g.
//   window.config = { apiUrl: 'https://pacs.example.com' };
window.config = {
  apiUrl: '',
};
