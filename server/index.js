import app from './app.js';

// Local-dev entrypoint. On Netlify the same `app` is wrapped as a serverless
// function (see netlify/functions/api.js) and this file is never run.
const PORT = Number(process.env.PORT) || 8787;
app.listen(PORT, () => {
  console.log(`[api] Lume Area Scout proxy listening on http://localhost:${PORT}`);
});
