// Sanity Studio is a single-page app built into dist/studio. Its own files are served as they are;
// any other /studio/... URL (a deep link such as /studio/structure/project) gets the Studio's index.html.
export default {
  async fetch(request, env) {
    const res = await env.ASSETS.fetch(request);
    if (res.status !== 404 || (request.method !== 'GET' && request.method !== 'HEAD')) return res;
    if (new URL(request.url).pathname.startsWith('/studio/static/')) return res; // a missing build file stays a 404
    return env.ASSETS.fetch(new Request(new URL('/studio/', request.url), request));
  },
};
