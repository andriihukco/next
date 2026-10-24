// Every /api/* request on Vercel goes through the same handler as the local server.
import { handleApiRequest } from '../server/transit-api.mjs';

export default handleApiRequest;
