type MonitoringPage = {
    id: string
    slug: string
    title: string
    publishedAt?: string
    isDraft: boolean
    blocks: Array<{
        id: string
        type: string
        content: Record<string, any>
        order: number
        parentBlockId?: string
        children?: any[]
    }>
    createdAt: string
    updatedAt: string
}

type MonitoringItem = {
    id: string
    page: MonitoringPage
}

const pad = (value: number) => String(value).padStart(3, '0')

export const buildMonitoringZakonMocks = (count: number): MonitoringItem[] => {
    const now = new Date()
    const list: MonitoringItem[] = []

    for (let i = 1; i <= count; i += 1) {
        const index = pad(i)
        const publishedAt = new Date(now.getTime() - i * 1000 * 60 * 60).toISOString()
        const slug = `monitoring-zakon/mock-${index}`
        list.push({
            id: `mock-${index}`,
            page: {
                id: `page-mock-${index}`,
                slug,
                title: `Мониторинг законодательства #${index}`,
                publishedAt,
                isDraft: false,
                blocks: [
                    {
                        id: `block-${index}`,
                        type: 'TX01',
                        content: {
                            html: `<p>Тестовый материал мониторинга законодательства №${index}</p>`
                        },
                        order: 0,
                        children: [],
                    },
                ],
                createdAt: publishedAt,
                updatedAt: publishedAt,
            },
        })
    }

    return list
}
