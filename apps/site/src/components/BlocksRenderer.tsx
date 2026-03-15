import React from 'react'
import { getFileUrl } from '../utils/getFileUrl';

export interface Block {
    id: string
    type: string
    content: Record<string, any>
    order: number
    children?: Block[]
}

interface BlocksRendererProps {
    blocks: Block[]
}

interface GalleryImage {
    src?: string;
    alt?: string;
    caption?: string;
}

export const BlocksRenderer: React.FC<BlocksRendererProps> = ({ blocks }) => {
    if (!Array.isArray(blocks) || blocks.length === 0) return null

    const sortedBlocks = [...blocks].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))

    const [openQA, setOpenQA] = React.useState<{ [blockId: string]: number | null }>({});
    const [selectedTabIndex, setSelectedTabIndex] = React.useState<{ [blockId: string]: number }>({});
    const [openTS02Tabs, setOpenTS02Tabs] = React.useState<{ [tabId: string]: boolean }>({});



    return (
        <>
            {sortedBlocks.map(block => {
                const variant = (block.content?.variant || block.type).toLowerCase();
                // Текстовые блоки (TX01–TX11)
                if (block.type.startsWith('TX')) {
                    const variant = block.type.toLowerCase();
                    return (
                        <div
                            key={block.id}
                            className={`body-text article-text ${variant} mb-40`}
                            dangerouslySetInnerHTML={{ __html: block.content?.html || '' }}
                        />
                    );
                }
                // TS01, TS02: Табы
                if ((block.type === 'TS01' || block.type === 'TS02') && Array.isArray(block.content?.tabs)) {
                    const tabs = block.content.tabs;
                    const isVertical = block.type === 'TS02';

                    if (isVertical) {
                        // TS02: Аккордион с независимым состоянием каждой вкладки
                        return (
                            <div key={block.id} className={`tabs-block tabs-block--${block.type.toLowerCase()} mb-40`}>
                                {tabs.map((tab: any) => {
                                    const isOpen = openTS02Tabs[tab.id] || false;
                                    return (
                                        <div key={tab.id} className="tabs-block__accordion-item">
                                            <button
                                                className={`tabs-block__accordion-header ${isOpen ? 'active' : ''}`}
                                                onClick={() => setOpenTS02Tabs({ ...openTS02Tabs, [tab.id]: !isOpen })}
                                            >
                                                <span>{tab.title || ''}</span>
                                                <i
                                                    className='bi bi-chevron-down'
                                                    style={{ marginLeft: '8px', transition: 'transform 0.3s' }}
                                                ></i>
                                            </button>
                                            {isOpen && Array.isArray(tab.children) && tab.children.length > 0 && (
                                                <div className="tabs-block__accordion-content">
                                                    <BlocksRenderer blocks={tab.children} />
                                                </div>
                                            )}
                                            
                                        </div>
                                    );
                                })}
                            </div>
                        );
                    } else {
                        // TS01: Стандартные табы с выбором одного активного
                        const activeTabIndex = selectedTabIndex[block.id] ?? 0;
                        const activeTab = tabs[activeTabIndex] || tabs[0];

                        return (
                            <div key={block.id} className={`tabs-block tabs-block--${block.type.toLowerCase()} mb-40`}>
                                {/* Заголовки табов */}
                                <div className="tabs-block__headers">
                                    {tabs.map((tab: any, idx: number) => (
                                        <button
                                            key={tab.id}
                                            className={`tabs-block__header ${activeTabIndex === idx ? 'active' : ''}`}
                                            onClick={() => setSelectedTabIndex({ ...selectedTabIndex, [block.id]: idx })}
                                        >
                                            <span>{tab.title || ''}</span>
                                        </button>
                                    ))}
                                </div>

                                {/* Содержимое активного таба */}
                                {activeTab && Array.isArray(activeTab.children) && activeTab.children.length > 0 && (
                                    <div className="tabs-block__content">
                                        <BlocksRenderer blocks={activeTab.children} />
                                    </div>
                                )}
                            </div>
                        );
                    }
                }

                // Вопрос-ответ
                if (block.type.startsWith('QA') && Array.isArray(block.content?.items)) {
                    const openIdx = openQA[block.id] ?? null;
                    return (
                        <div key={block.id} className={`qa-block qa-block--${variant} mb-40`}>
                            {block.content.items.map((item: any, idx: number) => {
                                const isOpen = openIdx === idx;
                                const typeQA01 = block.type == 'QA01';
                                const typeQA02 = block.type == 'QA02';
                                return (
                                    <div key={idx} className="qa-block__item mb-2">
                                        <div
                                            className='qa-block__question-wrapper'
                                            style={{ cursor: typeQA01 ? 'pointer' : 'default', userSelect: 'none' }}
                                            onClick={typeQA01 ? () => setOpenQA(prev => ({ ...prev, [block.id]: isOpen ? null : idx })) : undefined}
                                        >
                                            <div className="qa-block__question">{item.question || `Вопрос`}</div>
                                            {typeQA01 && (
                                                <i
                                                    className="bi bi-plus-lg"
                                                    style={{
                                                        transition: 'transform 0.2s',
                                                        transform: isOpen ? 'rotate(45deg)' : 'rotate(0deg)',
                                                        backgroundColor: isOpen ? 'var(--primary-bg-strong)' : 'var(--primary-bg)',
                                                    }}
                                                ></i>
                                            )}
                                        </div>
                                        {typeQA01 && isOpen && (
                                            <div className="qa-block__answer body-text article-text tx01" dangerouslySetInnerHTML={{ __html: item.answer?.html || '' }} />
                                        )}
                                        {typeQA02 && (
                                            <div className="qa-block__answer body-text article-text tx01" dangerouslySetInnerHTML={{ __html: item.answer?.html || '' }} />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    );
                }
                // Кнопочные блоки
                if (block.type.startsWith('BF')) {
                    const { text = '', url = '', fileUrl = '', docUrl = '', pdfUrl = '', linkType = 'external', openInNewTab = true, align = 'center' } = block.content || {};
                    
                    let buttonHref: string | undefined;
                    if (fileUrl) {
                        buttonHref = getFileUrl(fileUrl) || '';
                    } else if (docUrl) {
                        buttonHref = getFileUrl(docUrl) || '';
                    } else if (linkType === 'pdf' && pdfUrl) {
                        buttonHref = getFileUrl(pdfUrl) || '';
                    } else if (linkType === 'internal') {
                        buttonHref = url ? (url.startsWith('/') ? url : `/${url}`) : '#';
                    } else {
                        buttonHref = getFileUrl(url) || url ;
                    }
                    let alignClass = '';
                    if (align === 'left') alignClass = 'text-start';
                    else if (align === 'right') alignClass = 'text-end';
                    else alignClass = 'text-center';
                    return (
                        <div key={block.id} className={`${alignClass} mb-40`}>
                            {buttonHref && buttonHref !== '' ? (
                                <a
                                    href={buttonHref}
                                    target={openInNewTab ? "_blank" : undefined}
                                    rel={openInNewTab ? "noopener noreferrer" : undefined}
                                    className={`button-link ${variant}`}
                                >
                                    <span>{text || 'Кнопка'}</span>
                                    {(block.type === 'BF03' || block.type === 'BF04' || block.type === 'BF06') && (
                                        <i className="bi bi-arrow-up-right"></i>
                                    )}
                                </a>
                            ) : (
                                <span className={`button-link ${variant} disabled`} style={{ pointerEvents: 'none', opacity: 0.5 }}>{text || 'Кнопка'}</span>
                            )}
                        </div>
                    );
                }
                // Колонки (CL01–CL04)
                if (block.type.startsWith('CL')) {
                    const columns: any[] = block.content.columns;
                    if (!Array.isArray(columns)) return null;
                    // Спец.логика для CL02: первая колонка — подзаголовок, вторая - rich text
                    if (block.type === 'CL02' && columns.length >= 2) {
                        return (
                            <div key={block.id} className={`${variant} mb-40`}>
                                <div className='body-text article-text tx01'>
                                    <h2 className='section-title--sm'>{columns[0]?.subtitle || ''}</h2>
                                </div>
                                <div className='body-text article-text tx01' dangerouslySetInnerHTML={{ __html: columns[1]?.html || '' }} />
                            </div>
                        );
                    }
                    
                    return (
                        <div key={block.id} className={`${variant} mb-40`}>
                            {columns.map((col, idx) => (
                                <div key={idx} className='body-text article-text tx01' dangerouslySetInnerHTML={{ __html: col.html || '' }} />
                            ))}
                        </div>
                    );
                }

                if (block.type.startsWith('NT')) {
                    const noteType = block.content.noteType || 'info';
                    return (
                        <div key={block.id} className={`note-block note-block--${variant} note-block--${noteType} mb-40`}>
                            <i className={block.content.icon || 'bi bi-info-square'} ></i>
                            <p className='body-text article-text tx01' dangerouslySetInnerHTML={{ __html: block.content?.html || '' }} />
                        </div>
                    );
                }

                // Блок изображения IM01/IM02/IM03/IM04/image
                if (
                    block.type.startsWith('IM') ||
                    (block.type === 'image')
                ) {
                    const variant = (block.content?.variant || block.type).toUpperCase();
                    // IM04: секция с изображением
                    if (variant === 'IM04') {
                        const { title = '', text = '', src = '', alt = '', reverse = false } = block.content || {};
                        const safeTitle = title ?? undefined;
                        const safeText = text ?? undefined;
                        const safeSrc = src ?? undefined;
                        const safeAlt = alt ?? undefined;
                        return (
                            <div key={block.id} className={`image-block image-block--${variant.toLowerCase()} ${reverse ? ' image-block--reverse' : ''} mb-40`}>
                                <div className='image-block__description'>
                                    {safeTitle && <h2 className="section-title--sm">{safeTitle}</h2>}
                                    <div className="body-text article-text tx01" dangerouslySetInnerHTML={{ __html: safeText || '' }} />
                                </div>
                                <div className='image-block__image'>
                                    {safeSrc ? (
                                        <img src={getFileUrl(safeSrc) || ''} alt={safeAlt} />
                                    ) : (
                                        <div>
                                            <i className="bi bi-image" style={{ fontSize: 48, color: '#bbb' }}></i>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    }
                    // IM01, IM02, IM03 — стандартные изображения
                    const {
                        src = '',
                        alt = '',
                        width,
                        height,
                        alignH = 'center',
                        alignV = 'center',
                        caption = '',
                        variant: v = 'IM01',
                    } = block.content as {
                        src?: string;
                        alt?: string;
                        width?: number;
                        height?: number;
                        alignH?: 'left' | 'center' | 'right';
                        alignV?: 'top' | 'center' | 'bottom';
                        caption?: string;
                        variant?: string;
                    } || {};
                    const imageSrc = src && src.startsWith('/uploads') ? getFileUrl(src) : src;
                    const imageWithCaption = v === 'IM02' || v === 'IM03';
                    const getAlignValue = (align: string) => {
                        if (align === 'left' || align === 'top') return 'flex-start';
                        if (align === 'right' || align === 'bottom') return 'flex-end';
                        return 'center';
                    };
                    return (
                        <div
                            key={block.id}
                            className={`image-block image-block--${v.toLowerCase()} mb-40`}
                            style={{
                                alignItems: v === 'IM02'
                                    ? getAlignValue(alignH)
                                    : v === 'IM03'
                                        ? getAlignValue(alignV)
                                        : getAlignValue(alignH),
                                minHeight: 120,
                            }}
                        >
                            {imageSrc ? (
                                <img
                                    src={imageSrc}
                                    alt={alt}
                                    className="image-block__img"
                                    style={{
                                        maxWidth: width ? `min(${width - 200}px, 100%)` : '100%',
                                        width: '100%',
                                        maxHeight: height ? `min(${height}px, 100%)` : '100%',
                                        height: '100%',
                                        objectFit: 'contain',
                                    }}
                                />
                            ) : (
                                <div className="image-block__placeholder" style={{ width: '100%', height: 180, background: '#e0e0e0', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8 }}>
                                    <i className="bi bi-image" style={{ fontSize: 48, color: '#bbb' }}></i>
                                </div>
                            )}
                            {(imageWithCaption) && (
                                <div className="image-caption" >
                                    <div className="body-text article-text tx04" dangerouslySetInnerHTML={{ __html: caption || '' }} />
                                </div>
                            )}
                        </div>
                    );
                }

                // Галерея (gallery, GL01, GL02)
                if (block.type === 'gallery' || block.type.startsWith('GL')) {
                    const images = block.content.images || [];
                    const imageHeight = block.content.imageHeight || 240;
                    const galleryCaption = block.content.galleryCaption || '';
                    return (
                        <div key={block.id} className={`gallery-container mb-40`}>
                            <div className={`gallery-block gallery-block--${variant.toLowerCase()}`}>
                                {images.length === 0 && (
                                    <div className="text-muted mb-2"></div>
                                )}
                                {images.map((img: GalleryImage, idx: number) => (
                                    <div key={idx} className='gallery-item'>
                                        <div style={{ position: 'relative', height: imageHeight, background: '#f8f9fa', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            {img.src ? (
                                                <img src={getFileUrl(img.src) || ''} alt={img.alt} style={{ maxWidth: '100%', width: '100%', maxHeight: '100%', objectFit: 'cover', height: '100%' }} />
                                            ) : (
                                                <div style={{ color: '#bbb', fontSize: 32 }}><i className="bi bi-image"></i></div>
                                            )}
                                        </div>
                                        {img.caption && img.caption.trim() !== '' && (
                                            <div className="gallery-caption" >
                                                <div className="body-text article-text tx04" dangerouslySetInnerHTML={{ __html: img.caption || '' }} />
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                            {galleryCaption && (
                                <div className="gallery-caption" style={{ marginTop: 10 }}>
                                    <div className="body-text article-text tx04" dangerouslySetInnerHTML={{ __html: galleryCaption || '' }} />
                                </div>
                            )}
                        </div>
                    );
                }

                // TL01: Изображение-ссылка
                if (block.type === 'TL01') {
                    const { src = '', alt = '', width, height, alignH = 'center', url = '', fileUrl = '', pdfUrl = '', linkType = 'url', openInNewTab = true } = block.content || {};
                    const imageSrc = getFileUrl(src);

                    const getAlignValue = (align: string) => {
                        if (align === 'left') return 'flex-start';
                        if (align === 'right') return 'flex-end';
                        return 'center';
                    };

                   
                    const finalUrl = fileUrl ? getFileUrl(fileUrl) : (linkType === 'pdf' ? getFileUrl(pdfUrl) : url);

                    return (
                        <div key={block.id} className="tile-link-block tile-link-block--tl01 mb-40" style={{ display: 'flex', justifyContent: getAlignValue(alignH) }}>
                            <div>
                                {finalUrl ? (
                                    <a
                                        href={finalUrl || '#'}
                                        target={openInNewTab ? "_blank" : undefined}
                                        rel={openInNewTab ? "noopener noreferrer" : undefined}
                                        style={{ display: 'block', cursor: 'pointer' }}
                                    >
                                        {imageSrc ? (
                                            <img
                                                src={imageSrc}
                                                alt={alt}
                                                style={{
                                                    maxWidth: '100%',
                                                    width: width ? `${width}px` : undefined,
                                                    height: height ? `${height}px` : undefined,
                                                    objectFit: 'contain',
                                                    transition: 'transform 0.2s, opacity 0.2s',
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.transform = 'scale(1.02)';
                                                    e.currentTarget.style.opacity = '0.9';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.transform = 'scale(1)';
                                                    e.currentTarget.style.opacity = '1';
                                                }}
                                            />
                                        ) : (
                                            <div style={{ width: '100%', height: 180, background: '#e0e0e0', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8 }}>
                                                <i className="bi bi-image" style={{ fontSize: 48, color: '#bbb' }}></i>
                                            </div>
                                        )}
                                    </a>
                                ) : (
                                    imageSrc ? (
                                        <img
                                            src={imageSrc}
                                            alt={alt}
                                            style={{
                                                maxWidth: '100%',
                                                width: width ? `${width}px` : undefined,
                                                height: height ? `${height}px` : undefined,
                                                objectFit: 'contain',
                                            }}
                                        />
                                    ) : (
                                        <div style={{ width: '100%', height: 180, background: '#e0e0e0', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8 }}>
                                            <i className="bi bi-image" style={{ fontSize: 48, color: '#bbb' }}></i>
                                        </div>
                                    )
                                )}
                            </div>
                        </div>
                    );
                }

                // Плитки-ссылки
                if (block.type === 'TL02' || block.type === 'TL03' || block.type === 'TL04') {
                    const items = block.content.items || [];
                    const columns = block.content.columns || (block.type === 'TL04' ? 4 : 3);
                    const imageHeight = block.content.imageHeight || 240;

                    
                    const containerStyle: React.CSSProperties = block.type === 'TL04' ? {
                        display: 'grid',
                        gridTemplateColumns: `repeat(4, 1fr)`,
                        gridAutoRows: `${imageHeight}px`,
                        gap: '20px',
                        alignItems: 'stretch'
                    } : {
                        display: 'grid',
                        gridTemplateColumns: `repeat(${columns}, 1fr)`,
                        gap: '20px'
                    };

                    let posIndex: Record<string, number> = {};
                    if (block.type === 'TL04') {
                        ['p1', 'p2', 'p3', 'p4'].forEach(p => {
                            const found = items.findIndex((it: any) => it && it.position === p);
                            if (found !== -1) posIndex[p] = found;
                        });
                    }

                    return (
                        <div key={block.id} className={`tile-link-block tile-link-block--${block.type.toLowerCase()} mb-40`}>
                            <div style={containerStyle}>
                                {items.length === 0 && (
                                    <div className="text-muted">Нет изображений</div>
                                )}
                                {items.map((item: any, idx: number) => {
                                    const imageSrc = getFileUrl(item.src);
                                    const itemUrl = item.fileUrl ? getFileUrl(item.fileUrl) : (item.linkType === 'pdf' ? getFileUrl(item.pdfUrl) : item.url);

                                    let itemStyle: React.CSSProperties = {};
                                    let contentStyle: React.CSSProperties = {
                                        position: 'relative',
                                        height: '100%',
                                        background: '#f8f9fa',
                                        overflow: 'hidden',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    };

                                    if (block.type === 'TL04') {
                                        const isP1 = posIndex['p1'] === idx || (!posIndex['p1'] && idx === 0);
                                        const isP2 = posIndex['p2'] === idx || (!posIndex['p2'] && idx === 1 && !posIndex['p1']);
                                        const isP3 = posIndex['p3'] === idx || (!posIndex['p3'] && idx === 2 && !posIndex['p1'] && !posIndex['p2']);
                                        const isP4 = posIndex['p4'] === idx || (!posIndex['p4'] && idx === 3 && !posIndex['p1'] && !posIndex['p2'] && !posIndex['p3']);

                                        if (isP1) {
                                            itemStyle = { gridColumn: '1 / 2', gridRow: '1 / 2' };
                                        } else if (isP2) {
                                            itemStyle = { gridColumn: '2 / 3', gridRow: '1 / 2' };
                                        } else if (isP3) {
                                            itemStyle = { gridColumn: '3 / 5', gridRow: '1 / 3' }; 
                                        } else if (isP4) {
                                            itemStyle = { gridColumn: '1 / 3', gridRow: '2 / 3' }; 
                                        } else {
                                            itemStyle = {};
                                        }
                                    }

                                    const ImageContent = (
                                        <div style={contentStyle}>
                                            {imageSrc ? (
                                                <img
                                                    src={imageSrc}
                                                    alt={item.alt}
                                                    style={{
                                                        maxWidth: '100%',
                                                        width: '100%',
                                                        maxHeight: '100%',
                                                        objectFit: 'cover',
                                                        height: '100%',
                                                        transition: 'transform 0.2s',
                                                    }}
                                                    className="tile-link-image"
                                                />
                                            ) : (
                                                <div style={{ color: '#bbb', fontSize: 32 }}><i className="bi bi-image"></i></div>
                                            )}
                                        </div>
                                    );

                                    return (
                                        <div key={idx} className="tile-link-item" style={itemStyle}>
                                            {itemUrl ? (
                                                <a
                                                    href={itemUrl || '#'}
                                                    target={item.openInNewTab ? "_blank" : undefined}
                                                    rel={item.openInNewTab ? "noopener noreferrer" : undefined}
                                                    style={{ display: 'block', cursor: 'pointer', textDecoration: 'none', color: 'inherit', height: '100%' }}
                                                >
                                                    {ImageContent}
                                                </a>
                                            ) : (
                                                ImageContent
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                }

                // Таблицы
                if (block.type.startsWith('TB')) {
                    const hasHeaders = block.content?.hasHeaders ?? false;
                    const rows: string[][] = Array.isArray(block.content?.rows) ? block.content.rows : [];
                    const headerRow = hasHeaders ? rows[0] : [];

                    if (rows.length === 0) return null;

                    return (
                        <div key={block.id} className={`table-block table-block--${block.type.toLowerCase()} mb-40`}>
                            <div className="table-responsive">
                                <table className="table-block__table">
                                    <tbody>
                                        {rows.map((row, rowIdx) => (
                                            <tr key={rowIdx}>
                                                {row.map((cell, colIdx) => (
                                                    hasHeaders && rowIdx === 0 ? (
                                                        <th key={colIdx}>{cell}</th>
                                                    ) : (
                                                        <td
                                                            key={colIdx}
                                                            data-label={hasHeaders ? (headerRow[colIdx] ?? '') : undefined}
                                                        >
                                                            {cell}
                                                        </td>
                                                    )
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    );
                }

                // CN01: контактная карточка
                if (block.type === 'CN01') {
                    const image = block.content?.image || { src: '', alt: '', width: null, height: null, responsive: true };
                    const name = block.content?.name || '';
                    const position = block.content?.position || '';
                    const contacts = Array.isArray(block.content?.contacts) ? block.content.contacts : [];

                    const imgWidth = image?.width ?? null;
                    const imgHeight = image?.height ?? null;

                    const getHrefFor = (c: any) => {
                       
                        return c?.href || '';
                    };

                    const containerStyle: React.CSSProperties = { display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' };
                    const wrapperStyle: React.CSSProperties = {
                        width: imgWidth ? `${imgWidth}px` : 96,
                        height: imgHeight ? `${imgHeight}px` : 96,
                        background: '#f8f9fa',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                        borderRadius: 6,
                        maxWidth: '100%'
                    };

                    const imgStyle: React.CSSProperties = {
                        width: '100%',
                        maxWidth: imgWidth ? `${imgWidth}px` : '100%',
                        height: imgHeight ? `${imgHeight}px` : 'auto',
                        objectFit: 'cover'
                    };

                    return (
                        <div key={block.id} className={`contact-block mb-40`}>
                            <div style={containerStyle}>
                                <div style={wrapperStyle}>
                                    {image?.src ? <img src={getFileUrl(image.src) || ''} alt={image.alt} style={imgStyle} /> : <i className="bi bi-person" style={{ fontSize: 28, color: '#bbb' }} />}
                                </div>
                                <div style={{ flex: '1 1 auto', minWidth: 0 }}>
                                    <div style={{ fontWeight: 700, fontSize: 16 }}>{name}</div>
                                    <div className="small text-muted">{position}</div>
                                    <div style={{ marginTop: 8 }}>
                                        {contacts.length === 0 && <div className="small text-muted">Нет контактов</div>}
                                        {contacts.map((c: any, idx: number) => (
                                            <div key={c.id || idx} className="small">
                                                {getHrefFor(c) ? (
                                                    <a href={getHrefFor(c)} target="_blank" rel="noopener noreferrer">{c.label ? `${c.label}: ` : ''}{c.value || c.href}</a>
                                                ) : (
                                                    <>{c.label ? `${c.label}: ` : ''}{c.value || c.href}</>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                }


                return (
                    <div
                        key={block.id}
                        className={`body-text article-text ${block.type.toLowerCase()} mb-40`}
                        dangerouslySetInnerHTML={{ __html: block.content?.html || '' }}
                    />
                );
            })}
        </>
    )
}

