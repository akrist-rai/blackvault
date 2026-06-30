import adapter from '@sveltejs/adapter-static';

// BASE_PATH is set by the GitHub Pages workflow (e.g. "/blackvault") so the
// site works under a project-repo subpath. Left empty for Netlify/local.
const base = process.env.BASE_PATH ?? '';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  kit: {
    adapter: adapter({
      pages: 'build',
      assets: 'build',
      fallback: 'index.html',
    }),
    paths: {
      base,
    },
  },
};

export default config;
