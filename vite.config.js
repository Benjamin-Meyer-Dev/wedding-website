import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

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
    plugins: [react(), preloadHero()],
    base: '/wedding-website/',
})
