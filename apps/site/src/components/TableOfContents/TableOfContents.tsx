import { useEffect, useState } from 'react'
import './TableOfContents.css'

interface TocItem {
    id: string
    text: string
    level: number
}

interface TableOfContentsProps {
    blocks: any[]
}

export default function TableOfContents({ blocks }: TableOfContentsProps) {
    const [tocItems, setTocItems] = useState<TocItem[]>([])
    const [activeId, setActiveId] = useState<string>('')

    useEffect(() => {
        const items = extractHeadings(blocks)
        setTocItems(items)

        items.forEach(item => {
            const element = document.getElementById(item.id)
            if (element) {
                element.setAttribute('id', item.id)
            }
        })
    }, [blocks])

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setActiveId(entry.target.id)
                    }
                })
            },
            { rootMargin: '-150px 0px -66%' }
        )

        tocItems.forEach(item => {
            const element = document.getElementById(item.id)
            if (element) {
                observer.observe(element)
            }
        })

        return () => observer.disconnect()
    }, [tocItems])

    const extractHeadings = (blocks: any[]): TocItem[] => {
        const headings: TocItem[] = []
        
        const processBlocks = (blockList: any[]) => {
            const sortedBlocks = [...blockList].sort((a, b) => {
                const orderA = a.order ?? 0
                const orderB = b.order ?? 0
                return orderA - orderB
            })
            
            sortedBlocks.forEach(block => {
                if (block.type?.startsWith('TX') && block.content?.html) {
                    const html = block.content.html
                    const tempDiv = document.createElement('div')
                    tempDiv.innerHTML = html
                    
                    const headingElements = tempDiv.querySelectorAll('h1, h2, h3, h4, h5, h6')
                    headingElements.forEach((heading: Element) => {
                        const text = heading.textContent?.trim() || ''
                        const level = parseInt(heading.tagName[1])
                        const id = generateId(text)
                        
                        headings.push({ id, text, level })
                        
                        setTimeout(() => {
                            const elements = document.querySelectorAll(`${heading.tagName}`)
                            elements.forEach((el: Element) => {
                                if (el.textContent?.trim() === text && !el.id) {
                                    el.id = id
                                }
                            })
                        }, 100)
                    })
                }
                
                if (block.content?.tabs) {
                    block.content.tabs.forEach((tab: any) => {
                        if (tab.children) {
                            processBlocks(tab.children)
                        }
                    })
                }
                if (block.children) {
                    processBlocks(block.children)
                }
            })
        }
        
        processBlocks(blocks)
        return headings
    }

    const generateId = (text: string): string => {
        return text
            .toLowerCase()
            .replace(/[^\w\s-а-яё]/gi, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim()
    }

    const handleClick = (id: string) => {
        const element = document.getElementById(id)
        if (element) {
            const offset = 150
            const elementPosition = element.getBoundingClientRect().top
            const offsetPosition = elementPosition + window.pageYOffset - offset

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            })
        }
    }

    if (tocItems.length === 0) {
        return null
    }

    return (
        <nav className="table-of-contents">
            <div className="table-of-contents__header">Содержание</div>
            <ul className="table-of-contents__list">
                {tocItems.map((item) => (
                    <li
                        key={item.id}
                        className={`table-of-contents__item table-of-contents__item--level-${item.level} ${
                            activeId === item.id ? 'active' : ''
                        }`}
                    >
                        <a
                            href={`#${item.id}`}
                            onClick={(e) => {
                                e.preventDefault()
                                handleClick(item.id)
                            }}
                            className="table-of-contents__link"
                        >
                            {item.text}
                        </a>
                    </li>
                ))}
            </ul>
        </nav>
    )
}
