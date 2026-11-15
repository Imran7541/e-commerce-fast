export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // 1. Proxy all /api/* requests to the live 24/7 Render backend
    if (url.pathname.startsWith('/api/')) {
      const targetUrl = new URL(
        url.pathname + url.search,
        'https://familio-bazar.onrender.com'
      );
      const newHeaders = new Headers(request.headers);
      newHeaders.set('host', 'familio-bazar.onrender.com');

      const init = {
        method: request.method,
        headers: newHeaders,
        redirect: 'follow',
      };
      if (request.method !== 'GET' && request.method !== 'HEAD') {
        init.body = request.body;
      }
      try {
        const resp = await fetch(targetUrl.toString(), init);
        const headers = new Headers(resp.headers);
        headers.set('Access-Control-Allow-Origin', '*');
        return new Response(resp.body, {
          status: resp.status,
          statusText: resp.statusText,
          headers,
        });
      } catch (err) {
        return new Response(JSON.stringify({ error: 'Backend unreachable: ' + err.message }), {
          status: 502,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    // 2. Fetch static assets from Cloudflare Edge
    const assetResponse = await env.ASSETS.fetch(request);
    if (assetResponse.status === 404) {
      // 3. For SPA client routes (/shop, /admin, /pos, /cart, /checkout, etc.), fallback to /index.html
      const indexRequest = new Request(new URL('/index.html', request.url), request);
      return env.ASSETS.fetch(indexRequest);
    }

    return assetResponse;
  },
};
