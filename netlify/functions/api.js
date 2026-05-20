import serverless from 'serverless-http';
import app from '../../server/app.js';

const inner = serverless(app);

/**
 * Normalize the request path so Express always sees the real `/api/...` route,
 * regardless of whether Netlify hands us the original path or the
 * `/.netlify/functions/api/...` form after the redirect rewrite.
 */
export const handler = (event, context) => {
  let p = (event.path || '/').replace(/^\/\.netlify\/functions\/api/, '') || '/';
  if (!p.startsWith('/api')) p = '/api' + (p === '/' ? '' : p);
  event.path = p;
  return inner(event, context);
};
