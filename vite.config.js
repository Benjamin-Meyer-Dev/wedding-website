import { execSync } from 'node:child_process'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Every asset filename is content-hashed, but nothing on the page said WHEN it
// was built — so "am I looking at the new deploy or a cached one?" was
// unanswerable from the site itself. Stamp the build once, here, and expose it
// three ways: a <meta> in the HTML, a /build.json you can open on a phone, and
// __BUILD_TIME__ / __BUILD_COMMIT__ for the app to render.
const BUILD_TIME = new Date().toISOString()
let BUILD_COMMIT = 'unknown'
try {
    BUILD_COMMIT = execSync('git rev-parse --short HEAD', {
        stdio: ['ignore', 'pipe', 'ignore'],
    }).toString().trim()
} catch {
    // not a git checkout (or no git on PATH) — the timestamp alone still works
}

function buildStamp() {
    return {
        name: 'build-stamp',
        transformIndexHtml() {
            return [
                { tag: 'meta', attrs: { name: 'build-time', content: BUILD_TIME }, injectTo: 'head' },
                { tag: 'meta', attrs: { name: 'build-commit', content: BUILD_COMMIT }, injectTo: 'head' },
            ]
        },
        generateBundle() {
            this.emitFile({
                type: 'asset',
                fileName: 'build.json',
                source: JSON.stringify({ builtAt: BUILD_TIME, commit: BUILD_COMMIT }, null, 2),
            })
        },
    }
}

// The hero photo is the largest paint on both the login and the homepage, and
// nothing can request it until the JS bundle has parsed and React has mounted.
// This drops a <link rel="preload"> into the HTML so the browser starts the
// download while it is still parsing the document, in parallel with the bundle.
// In a build the asset name is content-hashed, so the URL is read back out of
// the emitted bundle; in dev the source path serves directly.
function preloadHero() {
    let base = '/'
    return {
        name: 'preload-hero',
        configResolved(config) { base = config.base },
        transformIndexHtml(html, ctx) {
            let href = `${base}src/assets/HomePage.jpg`
            if (ctx.bundle) {
                const asset = Object.values(ctx.bundle).find(
                    (c) => c.type === 'asset' && /HomePage-.*\.jpg$/.test(c.fileName),
                )
                if (!asset) return
                href = base + asset.fileName
            }
            return [{
                tag: 'link',
                attrs: { rel: 'preload', as: 'image', href, fetchpriority: 'high' },
                injectTo: 'head',
            }]
        },
    }
}

export default defineConfig({
    plugins: [react(), preloadHero(), buildStamp()],
    base: '/wedding-website/',
    define: {
        __BUILD_TIME__: JSON.stringify(BUILD_TIME),
        __BUILD_COMMIT__: JSON.stringify(BUILD_COMMIT),
    },
})
