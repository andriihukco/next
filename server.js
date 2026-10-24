// Local API server (`npm run server`). On Vercel the same handler runs as a function, see api/[...path].js.
import http from 'http';
import { handleApiRequest, startPolling } from './server/transit-api.mjs';

const PORT = Number(process.env.PORT || 3001) || 3001;

startPolling();

http.createServer(handleApiRequest).listen(PORT, () => {
  console.log(`🚀 Lviv Real-Time Transit Data Service running on http://localhost:${PORT}`);
});
