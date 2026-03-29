import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const API_BASE = 'https://api.rosrest.com/api'
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const publicPath = path.resolve(__dirname, '..', 'public')
const outFile = path.join(publicPath, 'sitemap.xml')

fs.mkdirSync(publicPath, { recursive: true })

async function fetchJson(path) {
    const res = await fetch(`${API_BASE}${path}`)
    if (!res.ok) return null
    return res.json()
}

function formatUrl(loc, lastmod) {
    let xml = '  <url>\n'
    xml += `    <loc>${loc}</loc>\n`
    if (lastmod) xml += `    <lastmod>${lastmod}</lastmod>\n`
    xml += '  </url>\n'
    return xml
}

function toIsoDate(value) {
    if (!value) return null

    try {
        if (typeof value === 'number') {
            const d = new Date(value)
            if (!Number.isNaN(d.getTime())) return d.toISOString().split('T')[0]
        }

        const s = String(value).trim()
        const dotDate = /^\s*(\d{1,2})\.(\d{1,2})\.(\d{4})(?:[ T](.*))?\s*$/.exec(s)
        if (dotDate) {
            const day = dotDate[1].padStart(2, '0')
            const month = dotDate[2].padStart(2, '0')
            const year = dotDate[3]
            return `${year}-${month}-${day}`
        }

        const parsed = new Date(s)
        if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().split('T')[0]
    } catch (e) {
    }
    return null
}

async function build() {
    const origin = process.env.SITE_ORIGIN || 'https://rosrest.com'

    const staticPaths = [
        '/',
        '/documents',
        '/about',
        '/about/head-speech',
        '/charter',
        '/contracts',
        '/about/awards',
        '/about/partners',
        '/contacts',
        '/news',
        '/events',
        '/projects',
        '/services',
        '/members',
        '/library',
        '/education',
        '/education/srednee-professionalnoe-obrazovanie',
        '/education/vysshee-professionalnoe-obrazovanie',
        '/press-center',
        '/for-journalist'
    ]

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`

    for (const p of staticPaths) {
        xml += formatUrl(origin + p)
    }

    try {
        const sections = await fetchJson('/rar-sections')
        if (Array.isArray(sections)) {
            for (const s of sections) {
                if (!s || !s.slug) continue
                const lm = toIsoDate(s.updatedAt || s.publishedAt || s.createdAt)
                xml += formatUrl(`${origin}/members/${s.slug}`, lm)
            }
        }
    } catch (e) {
        console.warn('Failed to fetch sections for sitemap:', e.message)
    }

    try {
        const members = await fetchJson('/rar-members')
        if (Array.isArray(members)) {
            for (const m of members) {
                if (!m || !m.page || !m.page.slug) continue
                if (m.page.isDraft) continue
                const slug = m.page.slug.replace(/^portfolio\//, '')
                const lm = toIsoDate(m.page.updatedAt || m.page.publishedAt || m.page.createdAt || m.updatedAt)
                xml += formatUrl(`${origin}/portfolio/${slug}`, lm)
            }
        }
    } catch (e) {
        console.warn('Failed to fetch members for sitemap:', e.message)
    }

    try {
        const books = await fetchJson('/library?type=book&limit=1000')
        if (Array.isArray(books)) {
            for (const b of books) {
                if (!b || typeof b.id === 'undefined') continue
                if (b.isPublished === false) continue
                const lm = toIsoDate(b.updatedAt || b.publishedAt || b.createdAt || (b.page && (b.page.updatedAt || b.page.publishedAt)))
                xml += formatUrl(`${origin}/library/${b.id}`, lm)
            }
        }
    } catch (e) {
        console.warn('Failed to fetch library books for sitemap:', e.message)
    }

    try {
        const articles = await fetchJson('/library?type=article&limit=1000')
        if (Array.isArray(articles)) {
            for (const a of articles) {
                if (!a) continue
                if (a.page?.isDraft) continue
                const pageSlug = a.page?.slug || ''
                const slug = pageSlug.replace(/^library\//, '')
                if (!slug) continue
                const lm = toIsoDate(a.page?.updatedAt || a.page?.publishedAt || a.updatedAt || a.createdAt)
                xml += formatUrl(`${origin}/articles/${slug}`, lm)
            }
        }
    } catch (e) {
        console.warn('Failed to fetch library articles for sitemap:', e.message)
    }

    try {
        const events = await fetchJson('/events?isPublished=true&limit=100000')
        let eventsArr = []
        if (Array.isArray(events)) eventsArr = events
        else if (events && Array.isArray(events.events)) eventsArr = events.events

        for (const ev of eventsArr) {
            if (!ev || typeof ev.id === 'undefined') continue

            if (ev.isPublished === false) continue
            const lm = toIsoDate(ev.updatedAt || ev.publishedAt || ev.startDate || ev.createdAt)
            xml += formatUrl(`${origin}/events/${ev.id}`, lm)
        }
    } catch (e) {
        console.warn('Failed to fetch events for sitemap:', e.message)
    }

    try {
        const projects = await fetchJson('/projects?isDraft=false')
        if (Array.isArray(projects)) {
            for (const p of projects) {
                if (!p || !p.page || !p.page.slug) continue
                const slug = p.page.slug.replace(/^projects\//, '')
                const lm = toIsoDate(p.page.updatedAt || p.page.publishedAt || p.page.createdAt || p.updatedAt)
                xml += formatUrl(`${origin}/projects/${slug}`, lm)
            }
        }
    } catch (e) {
        console.warn('Failed to fetch projects for sitemap:', e.message)
    }

    try {
        const newsResp = await fetchJson('/news?isDraft=false&page=1&pageSize=1000')
        let newsArr = []
        if (Array.isArray(newsResp)) newsArr = newsResp
        else if (newsResp && Array.isArray(newsResp.items)) newsArr = newsResp.items

        for (const n of newsArr) {
            if (!n || !n.page || !n.page.slug) continue
            if (n.page.isDraft) continue
            const slug = n.page.slug.replace(/^news\//, '')
            if (!slug) continue
            const lm = toIsoDate(n.page.updatedAt || n.page.publishedAt || n.updatedAt || n.createdAt)
            xml += formatUrl(`${origin}/news/${slug}`, lm)
        }
    } catch (e) {
        console.warn('Failed to fetch news for sitemap:', e.message)
    }

    try {
        const services = await fetchJson('/services?isDraft=false')
        if (Array.isArray(services)) {
            for (const s of services) {
                if (!s || !s.page || !s.page.slug) continue
                if (s.page.isDraft) continue
                const slug = s.page.slug.replace(/^services\//, '')
                const lm = toIsoDate(s.page.updatedAt || s.page.publishedAt || s.page.createdAt || s.updatedAt)
                xml += formatUrl(`${origin}/services/${slug}`, lm)
            }
        }
    } catch (e) {
        console.warn('Failed to fetch services for sitemap:', e.message)
    }

    try {
        const categories = await fetchJson('/document-categories/tree')
        const walk = async (nodes) => {
            if (!Array.isArray(nodes)) return
            for (const node of nodes) {
                if (!node) continue
                const slugOrId = node.slug || node.id
                if (slugOrId) {
                    const lm = toIsoDate(node.updatedAt || node.createdAt)
                    xml += formatUrl(`${origin}/documents/${slugOrId}`, lm)
                }

                // Intentionally do NOT include direct file URLs or external redirects for documents.
                // SEO should list only the category pages (already added above). Individual documents
                // may point to file downloads or external sites and should not be part of sitemap.

                if (node.children && node.children.length) {
                    await walk(node.children)
                }
            }
        }

        await walk(categories)
    } catch (e) {
        console.warn('Failed to fetch document categories for sitemap:', e.message)
    }

    xml += '</urlset>\n'

    fs.writeFileSync(outFile, xml, { encoding: 'utf8' })
    console.log('Sitemap written to', outFile)
}

build().catch(err => {
    console.error(err)
    process.exit(1)
})
