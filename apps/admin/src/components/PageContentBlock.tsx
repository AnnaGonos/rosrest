import { Button } from 'react-bootstrap';
import { useState } from 'react';
import EditModal from './EditModal';
import 'bootstrap-icons/font/bootstrap-icons.css';
import '../../../site/src/index.css';
import './PageBlocksEditor.css';
import RichTextEditorField from './RichTextEditorField';
import ImageUploadField from './ImageUploadField';
import PdfUploadField from './PdfUploadField';
import { BLOCK_VARIANTS } from './blockVariants';


interface Block {
    id: string
    type: string
    content: Record<string, any>
    order: number
    parentBlockId?: string
    children?: Block[]
}

interface ContentBlockProps {
    block: Block
    onUpdate: (content: Record<string, any> | string) => void
    onRemove: () => void
    order: number
}


export function PageContentBlock({ block, onUpdate, onRemove, order, onMoveUp, onMoveDown, onAddBlock }: ContentBlockProps & {
    onMoveUp?: () => void;
    onMoveDown?: () => void;
    onAddBlock?: () => void;
    dragHandleProps?: any;
}) {
    const [editOpen, setEditOpen] = useState(false);
    const [openIdx, setOpenIdx] = useState<number | null>(null);
    const [editIdx, setEditIdx] = useState<number | null>(null);
    const [selectedTabId, setSelectedTabId] = useState<string | null>(null);
    const [tabVariantTargetId, setTabVariantTargetId] = useState<string | null>(null);
    const [selectedTypeForTab, setSelectedTypeForTab] = useState<string | null>(null);
    const items = block.content.items;

    if ((block.type === 'TS01' || block.type === 'TS02') && Array.isArray(block.content?.tabs)) {
        const tabs = block.content.tabs;
        const tabVariant = block.type;

        const handleAddTab = () => {
            const newTabs = [...tabs, { id: `tab-${Date.now()}`, title: 'Новый таб', children: [] }];
            onUpdate({ ...block.content, tabs: newTabs });
        };

        const handleRemoveTab = (tabId: string) => {
            const newTabs = tabs.filter((t: any) => t.id !== tabId);
            onUpdate({ ...block.content, tabs: newTabs });
            if (selectedTabId === tabId) {
                const nextTabId = newTabs[0]?.id ?? null;
                setSelectedTabId(nextTabId);
            }
            if (tabVariantTargetId === tabId) setTabVariantTargetId(null);
        };

        const handleUpdateTabTitle = (tabId: string, newTitle: string) => {
            const newTabs = tabs.map((t: any) => t.id === tabId ? { ...t, title: newTitle } : t);
            onUpdate({ ...block.content, tabs: newTabs });
        };

        const handleAddBlockToTab = (tabId: string, type: string, subvariant: any) => {
            let blockType = subvariant.id || type;
            let content = subvariant.defaultContent;

            if (type === 'columns' && subvariant.id && Array.isArray(subvariant.defaultContent?.columns)) {
                blockType = subvariant.id;
                content = { columns: (subvariant.defaultContent.columns as Array<Record<string, any>>).map((col: Record<string, any>) => ({ ...col })) };
            }
            if (type === 'qa' && subvariant.id === 'QA01') {
                blockType = 'QA01';
            }
            if (type === 'gallery' && (subvariant.id === 'GL01' || subvariant.id === 'GL02')) {
                blockType = subvariant.id;
                content = { ...subvariant.defaultContent };
            }

            const newBlock: Block = {
                id: `block-${Date.now()}`,
                type: blockType,
                content,
                order: 0,
                children: [],
            };

            const newTabs = tabs.map((t: any) => {
                if (t.id === tabId) {
                    const children = Array.isArray(t.children) ? [...t.children] : [];
                    children.forEach((b, idx) => { b.order = idx; });
                    newBlock.order = children.length;
                    return { ...t, children: [...children, newBlock] };
                }
                return t;
            });
            onUpdate({ ...block.content, tabs: newTabs });
            setTabVariantTargetId(null);
            setSelectedTypeForTab(null);
        };

        const handleUpdateTabBlock = (tabId: string, blockId: string, content: string | Record<string, any>) => {
            const newTabs = tabs.map((t: any) => {
                if (t.id === tabId) {
                    const newChildren = t.children.map((b: Block) => {
                        if (b.id !== blockId) return b;
                        if (b.type.startsWith('CL') && typeof content === 'object' && Array.isArray((content as any).columns)) {
                            return { ...b, content: { ...b.content, ...(content as Record<string, any>) } };
                        }
                        if (typeof content === 'string') {
                            return { ...b, content: { html: content } };
                        }
                        return { ...b, content: content as Record<string, any> };
                    });
                    return { ...t, children: newChildren };
                }
                return t;
            });
            onUpdate({ ...block.content, tabs: newTabs });
        };

        const handleRemoveTabBlock = (tabId: string, blockId: string) => {
            const newTabs = tabs.map((t: any) => {
                if (t.id === tabId) {
                    const newChildren = t.children.filter((b: Block) => b.id !== blockId);
                    newChildren.forEach((b: Block, idx: number) => { b.order = idx; });
                    return { ...t, children: newChildren };
                }
                return t;
            });
            onUpdate({ ...block.content, tabs: newTabs });
        };

        const handleMoveTabBlock = (tabId: string, blockId: string, direction: 'up' | 'down') => {
            const newTabs = tabs.map((t: any) => {
                if (t.id === tabId) {
                    const children = [...t.children];
                    const idx = children.findIndex((b: Block) => b.id === blockId);
                    if (idx === -1) return t;

                    if (direction === 'up' && idx > 0) {
                        [children[idx - 1], children[idx]] = [children[idx], children[idx - 1]];
                    } else if (direction === 'down' && idx < children.length - 1) {
                        [children[idx], children[idx + 1]] = [children[idx + 1], children[idx]];
                    }

                    children.forEach((b, i) => { b.order = i; });
                    return { ...t, children };
                }
                return t;
            });
            onUpdate({ ...block.content, tabs: newTabs });
        };

        const handleMoveTab = (tabId: string, direction: 'up' | 'down') => {
            const idx = tabs.findIndex((t: any) => t.id === tabId);
            if (idx === -1) return;

            const newTabs = [...tabs];
            if (direction === 'up' && idx > 0) {
                [newTabs[idx - 1], newTabs[idx]] = [newTabs[idx], newTabs[idx - 1]];
            } else if (direction === 'down' && idx < newTabs.length - 1) {
                [newTabs[idx], newTabs[idx + 1]] = [newTabs[idx + 1], newTabs[idx]];
            }

            onUpdate({ ...block.content, tabs: newTabs });
        };

        const currentTabId = selectedTabId ?? tabs[0]?.id ?? null;
        const activeTab = currentTabId ? tabs.find((t: any) => t.id === currentTabId) : null;
        const sortedChildren = activeTab?.children
            ? [...activeTab.children].sort((a: Block, b: Block) => (a.order ?? 0) - (b.order ?? 0))
            : [];

        const availableVariants = BLOCK_VARIANTS.filter(variant => variant.type !== 'tabs');

        return (
            <div className="card">
                <div className="d-flex align-items-center mb-20 gap-2">
                    <span className="badge bg-light text-dark" style={{ height: '100%', fontSize: 13, fontWeight: 500, borderRadius: '40px', border: '1px solid #000000', padding: '6px 8px' }}>{tabVariant}</span>
                    <Button variant="primary" size="sm" className="d-flex align-items-center px-3 py-1">
                        <i className="bi bi-collection me-2"></i>
                        <span className="fw-bold">{tabVariant === 'TS02' ? 'Табы (вертикальные)' : 'Табы'}</span>
                    </Button>
                    <Button variant="outline-danger" size="sm" className="d-flex align-items-center px-2 py-1 ms-1" title="Удалить блок" onClick={onRemove}>
                        <i className="bi bi-trash"></i>
                    </Button>
                    <Button variant="outline-success" size="sm" className="d-flex align-items-center px-2 py-1 ms-2" title="Вверх" onClick={onMoveUp} disabled={order === 1}>
                        <i className="bi bi-arrow-up"></i>
                    </Button>
                    <Button variant="outline-success" size="sm" className="d-flex align-items-center px-2 py-1" title="Вниз" onClick={onMoveDown}>
                        <i className="bi bi-arrow-down"></i>
                    </Button>
                </div>

                <div className="mb-3">
                    {tabVariant === 'TS01' ? (
                        <div>
                            <div className="d-flex gap-2 mb-2 flex-wrap align-items-start">
                                {tabs.map((tab: any, tabIdx: number) => (
                                    <div key={tab.id} className="d-flex gap-1 align-items-center">
                                        <Button
                                            variant={currentTabId === tab.id ? "primary" : "outline-secondary"}
                                            size="sm"
                                            onClick={() => setSelectedTabId(tab.id)}
                                            className="d-flex align-items-center gap-2"
                                        >
                                            <span>{tab.title || 'Таб'}</span>
                                        </Button>
                                        <div className="d-flex gap-1">
                                            <Button
                                                variant="link"
                                                size="sm"
                                                className="text-secondary"
                                                style={{ padding: '4px 6px', fontSize: 12 }}
                                                onClick={() => handleMoveTab(tab.id, 'up')}
                                                disabled={tabIdx === 0}
                                                title="Переместить влево"
                                            >
                                                <i className="bi bi-arrow-left"></i>
                                            </Button>
                                            <Button
                                                variant="link"
                                                size="sm"
                                                className="text-secondary"
                                                style={{ padding: '4px 6px', fontSize: 12 }}
                                                onClick={() => handleMoveTab(tab.id, 'down')}
                                                disabled={tabIdx === tabs.length - 1}
                                                title="Переместить вправо"
                                            >
                                                <i className="bi bi-arrow-right"></i>
                                            </Button>
                                            <Button
                                                variant="link"
                                                size="sm"
                                                className="text-danger"
                                                style={{ padding: '4px 6px', fontSize: 12 }}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleRemoveTab(tab.id);
                                                }}
                                                title="Удалить таб"
                                            >
                                                <i className="bi bi-x"></i>
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div>
                            <div className="d-flex flex-column gap-2 mb-2">
                                {tabs.map((tab: any, tabIdx: number) => (
                                    <div key={tab.id} className="d-flex gap-1 align-items-center">
                                        <Button
                                            variant={currentTabId === tab.id ? "primary" : "outline-secondary"}
                                            size="sm"
                                            onClick={() => setSelectedTabId(tab.id)}
                                            className="d-flex align-items-center gap-2"
                                            style={{ width: '100%', justifyContent: 'space-between' }}
                                        >
                                            <span>{tab.title || 'Таб'}</span>
                                        </Button>
                                        <div className="d-flex gap-1">
                                            <Button
                                                variant="link"
                                                size="sm"
                                                className="text-secondary"
                                                style={{ padding: '4px 6px', fontSize: 12 }}
                                                onClick={() => handleMoveTab(tab.id, 'up')}
                                                disabled={tabIdx === 0}
                                                title="Переместить вверх"
                                            >
                                                <i className="bi bi-arrow-up"></i>
                                            </Button>
                                            <Button
                                                variant="link"
                                                size="sm"
                                                className="text-secondary"
                                                style={{ padding: '4px 6px', fontSize: 12 }}
                                                onClick={() => handleMoveTab(tab.id, 'down')}
                                                disabled={tabIdx === tabs.length - 1}
                                                title="Переместить вниз"
                                            >
                                                <i className="bi bi-arrow-down"></i>
                                            </Button>
                                            <Button
                                                variant="link"
                                                size="sm"
                                                className="text-danger"
                                                style={{ padding: '4px 6px', fontSize: 12 }}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleRemoveTab(tab.id);
                                                }}
                                                title="Удалить таб"
                                            >
                                                <i className="bi bi-x"></i>
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    <Button variant="outline-success" size="sm" onClick={handleAddTab}>
                        <i className="bi bi-plus"></i> Добавить таб
                    </Button>
                </div>

                {activeTab && (
                    <div className="p-3 border rounded" style={{ backgroundColor: '#f8f9fa', marginBottom: 20 }}>
                        <div className="mb-3">
                            <label className="form-label fw-bold">Название таба</label>
                            <input
                                type="text"
                                className="form-control"
                                value={activeTab.title}
                                onChange={(e) => handleUpdateTabTitle(activeTab.id, e.target.value)}
                                placeholder="Название таба"
                            />
                        </div>

                        <div className="mb-3">
                            <label className="fw-bold mb-2 d-block">Содержимое таба</label>
                            {sortedChildren.length === 0 && (
                                <div className="text-muted mb-2">Нет блоков. Добавьте первый блок.</div>
                            )}
                            <div className="d-flex flex-column gap-3">
                                {sortedChildren.map((childBlock: Block, idx: number) => (
                                    <PageContentBlock
                                        key={childBlock.id}
                                        block={childBlock}
                                        onUpdate={(content: any) => handleUpdateTabBlock(activeTab.id, childBlock.id, content)}
                                        onRemove={() => handleRemoveTabBlock(activeTab.id, childBlock.id)}
                                        order={idx + 1}
                                        onMoveUp={() => handleMoveTabBlock(activeTab.id, childBlock.id, 'up')}
                                        onMoveDown={() => handleMoveTabBlock(activeTab.id, childBlock.id, 'down')}
                                    />
                                ))}
                            </div>
                            <Button
                                variant="outline-success"
                                size="sm"
                                className="mt-2"
                                onClick={() => {
                                    setSelectedTabId(activeTab.id);
                                    setTabVariantTargetId(activeTab.id);
                                    setSelectedTypeForTab(null);
                                }}
                            >
                                <i className="bi bi-plus"></i> Добавить блок в таб
                            </Button>
                        </div>

                        {tabVariantTargetId === activeTab.id && (
                            <div className="p-3 border rounded" style={{ backgroundColor: '#fff', marginTop: 10 }}>
                                {!selectedTypeForTab ? (
                                    <>
                                        <div className="fw-bold mb-2">Выберите тип блока</div>
                                        <div style={{ maxHeight: 200, overflowY: 'auto' }}>
                                            {availableVariants.map(variant => (
                                                <div key={variant.type} className="mb-2">
                                                    <Button
                                                        variant="light"
                                                        className="w-100 text-start"
                                                        onClick={() => setSelectedTypeForTab(variant.type)}
                                                    >
                                                        {variant.label}
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                        <Button
                                            size="sm"
                                            variant="outline-secondary"
                                            className="mt-2"
                                            onClick={() => setTabVariantTargetId(null)}
                                        >
                                            Отмена
                                        </Button>
                                    </>
                                ) : (
                                    <>
                                        <div className="fw-bold mb-2">Выберите подвариант</div>
                                        <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                                            {availableVariants.find(v => v.type === selectedTypeForTab)?.subvariants.map(sub => (
                                                <div key={sub.id} className="mb-2 p-2" style={{ backgroundColor: '#f8f9fa', border: '1px solid #eee', borderRadius: 4 }}>
                                                    <div className="fw-medium" style={{ fontSize: 12, marginBottom: 5 }}>{sub.name}</div>
                                                    <div className="small text-muted mb-1">{sub.title}</div>
                                                    <Button
                                                        size="sm"
                                                        variant="primary"
                                                        onClick={() => {
                                                            handleAddBlockToTab(activeTab.id, selectedTypeForTab, sub);
                                                        }}
                                                    >
                                                        Выбрать
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                        <Button
                                            size="sm"
                                            variant="outline-secondary"
                                            className="mt-2"
                                            onClick={() => setSelectedTypeForTab(null)}
                                        >
                                            Назад
                                        </Button>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    }

    // QA01: Вопрос-Ответ
    if (block.type.startsWith('QA') && Array.isArray(block.content?.items)) {
        return (
            <div className="card">
                <div className="d-flex align-items-center mb-20 gap-2">
                    <span className="badge bg-secondary me-2" style={{ fontSize: 13, fontWeight: 600 }}>{block.type}</span>
                    <Button variant="primary" size="sm" className="d-flex align-items-center px-3 py-1" onClick={() => setOpenIdx(null)}>
                        <i className="bi bi-brush me-2"></i>
                        <span className="fw-bold">Вопрос-Ответ</span>
                    </Button>
                    <Button variant="outline-danger" size="sm" className="d-flex align-items-center px-2 py-1 ms-1" title="Удалить блок" onClick={onRemove}>
                        <i className="bi bi-trash"></i>
                    </Button>
                    <Button variant="outline-success" size="sm" className="d-flex align-items-center px-2 py-1 ms-2" title="Вверх" onClick={onMoveUp} disabled={order === 1}>
                        <i className="bi bi-arrow-up"></i>
                    </Button>
                    <Button variant="outline-success" size="sm" className="d-flex align-items-center px-2 py-1" title="Вниз" onClick={onMoveDown}>
                        <i className="bi bi-arrow-down"></i>
                    </Button>
                </div>
                <div className={`qa-block qa-block--${(block.content?.variant || block.type).toLowerCase()} mb-40`}>
                    {items.length === 0 && (
                        <div className="text-muted mb-2">Нет вопросов. Добавьте первый вопрос.</div>
                    )}
                    {items.map((item: { question: string; answer: { html: string } }, idx: number) => {
                        const isOpen = openIdx === idx;
                        return (
                            <div key={idx} className="qa-block__item mb-2">
                                <div
                                    className='qa-block__question-wrapper'
                                    style={{ cursor: 'pointer', userSelect: 'none' }}
                                    onClick={() => setOpenIdx(isOpen ? null : idx)}
                                >
                                    <div className="qa-block__question">{item.question || `Вопрос ${idx + 1}`}</div>
                                    <i
                                        className="bi bi-plus-lg"
                                        style={{
                                            transition: 'transform 0.2s',
                                            transform: isOpen ? 'rotate(45deg)' : 'rotate(0deg)',
                                            backgroundColor: isOpen ? 'var(--primary-bg-strong)' : 'var(--primary-bg)',
                                        }}
                                    ></i>
                                </div>
                                {isOpen && (
                                    <div className="qa-block__answer body-text article-text tx01" dangerouslySetInnerHTML={{ __html: item.answer?.html || '' }} />
                                )}
                                <Button size="sm" variant="outline-primary" className="mt-2" onClick={() => setEditIdx(idx)}>Редактировать</Button>
                            </div>
                        );
                    })}
                    <Button variant="outline-success" size="sm" className="mt-2" onClick={() => {
                        const newItems = [...items, { question: '', answer: { html: '' } }];
                        onUpdate({ ...block.content, items: newItems });
                    }}>Добавить вопрос</Button>
                </div>
                {editIdx !== null && (
                    <EditModal show={true} onHide={() => setEditIdx(null)} title={`Редактирование вопроса ${editIdx + 1}`}>
                        <div className="mb-3">
                            <label className="form-label fw-bold">Вопрос</label>
                            <input
                                type="text"
                                className="form-control"
                                value={items[editIdx]?.question || ''}
                                onChange={e => {
                                    const newItems = items.map((item: { question: string; answer: { html: string } }, i: number) => i === editIdx ? { ...item, question: e.target.value } : item);
                                    onUpdate({ ...block.content, items: newItems });
                                }}
                            />
                        </div>
                        <label className="form-label fw-bold">Ответ</label>
                        <RichTextEditorField
                            value={items[editIdx]?.answer?.html || ''}
                            onChange={html => {
                                const newItems = items.map((item: { question: string; answer: { html: string } }, i: number) => i === editIdx ? { ...item, answer: { html } } : item);
                                onUpdate({ ...block.content, items: newItems });
                            }}
                            minHeight={160}
                        />
                        <Button variant="outline-danger" size="sm" className="mt-3" onClick={() => {
                            const newItems = items.filter((_: any, i: number) => i !== editIdx);
                            onUpdate({ ...block.content, items: newItems });
                            setEditIdx(null);
                        }}>Удалить вопрос</Button>
                    </EditModal>
                )}
            </div>
        );
    }

        // Галерея: gallery, GL01, GL02
    if (block.type === 'gallery' || block.type.startsWith('GL')) {
        const [editOpen, setEditOpen] = useState(false);
        const [editImgIdx, setEditImgIdx] = useState<number | null>(null);
        const images = Array.isArray(block.content.images) ? block.content.images : [];
        const columns = block.content.columns || 3;
        const imageHeight = block.content.imageHeight || 240;
        const galleryCaption = block.content.galleryCaption || '';
        const maxImages = block.content.maxImages || 20;

        const handleAddImage = () => {
            if (images.length >= maxImages) return;
            const newImages = [...images, { src: '', alt: '', caption: '' }];
            onUpdate({ ...block.content, images: newImages });
        };
        const handleRemoveImage = (idx: number) => {
            const newImages = images.filter((_, i) => i !== idx);
            onUpdate({ ...block.content, images: newImages });
        };
        const handleMoveImage = (from: number, to: number) => {
            if (to < 0 || to >= images.length) return;
            const newImages = [...images];
            const [img] = newImages.splice(from, 1);
            newImages.splice(to, 0, img);
            onUpdate({ ...block.content, images: newImages });
        };
        const handleUpdateImage = (idx: number, data: any) => {
            const newImages = images.map((img, i) => i === idx ? { ...img, ...data } : img);
            onUpdate({ ...block.content, images: newImages });
        };

        return (
            <div className="card">
                <div className="d-flex align-items-center mb-20 gap-2">
                    <span className="badge bg-light text-dark" style={{ height: '100%', fontSize: 13, fontWeight: 500, borderRadius: '40px', border:'1px solid #000000', padding: '6px 8px' }}>{block.type}</span>
                    <Button variant="primary" size="sm" className="d-flex align-items-center px-3 py-1" onClick={() => setEditOpen(true)}>
                        <i className="bi bi-images me-2"></i>
                        <span className="fw-bold">Галерея</span>
                    </Button>
                    <Button variant="outline-danger" size="sm" className="d-flex align-items-center px-2 py-1 ms-1" title="Удалить блок" onClick={onRemove}>
                        <i className="bi bi-trash"></i>
                    </Button>
                    <Button variant="outline-success" size="sm" className="d-flex align-items-center px-2 py-1 ms-2" title="Вверх" onClick={onMoveUp} disabled={order === 1}>
                        <i className="bi bi-arrow-up"></i>
                    </Button>
                    <Button variant="outline-success" size="sm" className="d-flex align-items-center px-2 py-1" title="Вниз" onClick={onMoveDown}>
                        <i className="bi bi-arrow-down"></i>
                    </Button>
                </div>
                <div className="gallery-block mb-40">
                    <div className="d-flex flex-wrap gap-3" style={{ columnGap: 16, rowGap: 24 }}>
                        {images.length === 0 && (
                            <div className="text-muted mb-2">Нет изображений</div>
                        )}
                        {images.map((img, idx) => (
                            <div key={idx} style={{ width: `calc(${100 / columns}% - 12px)`, minWidth: 120, maxWidth: 320, position: 'relative' }}>
                                <div style={{ position: 'relative', height: imageHeight, background: '#f8f9fa', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    {img.src ? (
                                        <img src={img.src} alt={img.alt} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'cover', height: imageHeight }} />
                                    ) : (
                                        <div style={{ color: '#bbb', fontSize: 32 }}><i className="bi bi-image"></i></div>
                                    )}
                                    <Button size="sm" variant="outline-primary" style={{ position: 'absolute', top: 6, right: 6, zIndex: 2 }} onClick={() => setEditImgIdx(idx)}>
                                        <i className="bi bi-pencil"></i>
                                    </Button>
                                    <Button size="sm" variant="outline-danger" style={{ position: 'absolute', top: 6, left: 6, zIndex: 2 }} onClick={() => handleRemoveImage(idx)}>
                                        <i className="bi bi-trash"></i>
                                    </Button>
                                    <Button size="sm" variant="outline-secondary" style={{ position: 'absolute', bottom: 6, left: 6, zIndex: 2 }} onClick={() => handleMoveImage(idx, idx - 1)} disabled={idx === 0}>
                                        <i className="bi bi-arrow-up"></i>
                                    </Button>
                                    <Button size="sm" variant="outline-secondary" style={{ position: 'absolute', bottom: 6, right: 6, zIndex: 2 }} onClick={() => handleMoveImage(idx, idx + 1)} disabled={idx === images.length - 1}>
                                        <i className="bi bi-arrow-down"></i>
                                    </Button>
                                </div>
                                <div className="mt-2 small text-muted">{img.caption || <span style={{ color: '#bbb' }}>Нет подписи</span>}</div>
                            </div>
                        ))}
                    </div>
                    {galleryCaption && <div className="mt-2 small text-muted">{galleryCaption}</div>}
                </div>
                <div className="d-flex gap-2 mt-3">
                    <Button size="sm" variant="outline-primary" onClick={handleAddImage} disabled={images.length >= maxImages}>
                        <i className="bi bi-plus"></i> Добавить изображение
                    </Button>
                    <Button size="sm" variant="outline-secondary" onClick={() => setEditOpen(true)}>
                        <i className="bi bi-pencil"></i> Редактировать галерею
                    </Button>
                </div>
                <EditModal show={editOpen} onHide={() => setEditOpen(false)} title="Редактирование галереи">
                    <div className="mb-3">
                        <label className="form-label fw-bold">Общая подпись к галерее</label>
                        <input
                            type="text"
                            className="form-control"
                            value={galleryCaption}
                            onChange={e => onUpdate({ ...block.content, galleryCaption: e.target.value })}
                        />
                    </div>
                    {block.type !== 'GL05' && (
                        <div className="mb-3">
                            <label className="form-label fw-bold">Высота изображений (px)</label>
                            <input
                                type="number"
                                className="form-control"
                                value={imageHeight}
                                min={60}
                                max={800}
                                onChange={e => onUpdate({ ...block.content, imageHeight: Number(e.target.value) })}
                            />
                        </div>
                    )}
                    <div className="mb-3">
                        <label className="form-label fw-bold">Список изображений</label>
                        <div className="d-flex flex-column gap-3">
                            {images.map((img, idx) => (
                                <div key={idx} className="d-flex align-items-center gap-2 p-2">
                                    <div style={{ width: 80, height: 60, background: '#f8f9fa', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        {img.src ? (
                                            <img src={img.src} alt={img.alt} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'cover', height: 60 }} />
                                        ) : (
                                            <div style={{ color: '#bbb', fontSize: 24 }}><i className="bi bi-image"></i></div>
                                        )}
                                    </div>
                                    <div className="flex-grow-1">
                                        <Button size="sm" variant="outline-primary" onClick={() => setEditImgIdx(idx)}>
                                            <i className="bi bi-pencil"></i> Изменить
                                        </Button>
                                    </div>
                                    <Button size="sm" variant="outline-danger" onClick={() => handleRemoveImage(idx)}>
                                        <i className="bi bi-trash"></i>
                                    </Button>
                                    <Button size="sm" variant="outline-secondary" onClick={() => handleMoveImage(idx, idx - 1)} disabled={idx === 0}>
                                        <i className="bi bi-arrow-up"></i>
                                    </Button>
                                    <Button size="sm" variant="outline-secondary" onClick={() => handleMoveImage(idx, idx + 1)} disabled={idx === images.length - 1}>
                                        <i className="bi bi-arrow-down"></i>
                                    </Button>
                                </div>
                            ))}
                        </div>
                        <Button size="sm" variant="outline-primary" className="mt-2" onClick={handleAddImage} disabled={images.length >= maxImages}>
                            <i className="bi bi-plus"></i> Добавить изображение
                        </Button>
                    </div>
                </EditModal>
                {editImgIdx !== null && (
                    <EditModal show={true} onHide={() => setEditImgIdx(null)} title={`Изображение ${editImgIdx + 1}`}>
                        <ImageUploadField
                            value={images[editImgIdx]}
                            onChange={val => handleUpdateImage(editImgIdx, val)}
                            hideAdvancedFields={true}
                        />
                        <div className="mt-3">
                            <label className="form-label fw-bold">Подпись к изображению</label>
                            <input
                                type="text"
                                className="form-control"
                                value={images[editImgIdx]?.caption || ''}
                                onChange={e => handleUpdateImage(editImgIdx, { caption: e.target.value })}
                            />
                        </div>
                    </EditModal>
                )}
            </div>
        );
    }

    function cleanHtml(html: string) {
        if (!html) return '';
        return html.replace(/^<p style="text-align: left;">([\s\S]*)<\/p>$/i, '$1');
    }

    if (block.type === 'note' || block.type.startsWith('NT')) {
        const iconList = [
            { value: 'bi bi-info-lg', label: 'Info' },
            { value: 'bi bi-info-square', label: 'Info (квадрат)' },
            { value: 'bi bi-info-circle', label: 'Info (круг)' },
            { value: 'bi bi-exclamation-square', label: 'Восклицание (квадрат)' },
            { value: 'bi bi-question-square', label: 'Вопрос (квадрат)' },
            { value: 'bi bi-lightbulb', label: 'Лампочка' },
            { value: 'bi bi-plus-lg', label: 'Плюс' },
            { value: 'bi bi-dash-lg', label: 'Минус' },
            { value: 'bi bi-question-lg', label: 'Вопрос' },
            { value: 'bi bi-bookmarks', label: 'Закладка' },
            { value: 'bi bi-bookmarks-fill', label: 'Закладка (заполненная)' },
        ];
        const colorList = [
            { value: 'default', label: 'Default', style: { background: '#fff' } },
            { value: 'info', label: 'Info', style: { background: 'var(--primary-strong)' } },
            { value: 'warning', label: 'Warning', style: { background: '#f44336' } },
            { value: 'lighting', label: 'Lighting', style: { background: '#FFA500' } },
        ];
        const icon = block.content.icon || iconList[0].value;
        const html = block.content.html || '';
        const noteType = block.content.noteType || colorList[0].value;

        const noteBlockMod = block.type.toLowerCase(); // nt01, nt02
        return (
            <div className="card">
                <div className="d-flex align-items-center mb-20 gap-2">
                    <Button variant="primary" size="sm" className="d-flex align-items-center px-3 py-1" onClick={() => setEditOpen(true)}>
                        <i className={icon + ' me-2'}></i>
                        <span className="fw-bold">Заметка</span>
                    </Button>
                    <Button variant="outline-danger" size="sm" className="d-flex align-items-center px-2 py-1 ms-1" title="Удалить блок" onClick={onRemove}>
                        <i className="bi bi-trash"></i>
                    </Button>
                    <Button variant="outline-success" size="sm" className="d-flex align-items-center px-2 py-1 ms-2" title="Вверх" onClick={onMoveUp} disabled={order === 1}>
                        <i className="bi bi-arrow-up"></i>
                    </Button>
                    <Button variant="outline-success" size="sm" className="d-flex align-items-center px-2 py-1" title="Вниз" onClick={onMoveDown}>
                        <i className="bi bi-arrow-down"></i>
                    </Button>
                </div>
                <div className={`note-block note-block--${noteBlockMod} note-block--${noteType} mb-40`} style={{ cursor: 'pointer' }} onClick={() => setEditOpen(true)}>
                    <i className={icon}></i>
                    <div className="body-text article-text tx01 mb-40">
                        <span dangerouslySetInnerHTML={{ __html: html || '<span style=\'color:#bbb\'>Пусто</span>' }} />
                    </div>
                </div>
                <EditModal show={editOpen} onHide={() => setEditOpen(false)} title="Редактирование заметки">
                    <div className="mb-3">
                        <label className="form-label fw-bold">Выберите иконку</label>
                        <div className="d-flex gap-3 mb-2">
                            {iconList.map(opt => (
                                <Button key={opt.value} variant={icon === opt.value ? 'primary' : 'outline-secondary'} onClick={() => onUpdate({ ...block.content, icon: opt.value })}>
                                    <i className={opt.value} style={{ fontSize: 24 }}></i>
                                </Button>
                            ))}
                        </div>
                    </div>
                    <div className="mb-3">
                        <label className="form-label fw-bold">Выберите цвет</label>
                        <div className="d-flex gap-3 mb-2">
                            {colorList.map(opt => (
                                <Button key={opt.value} variant={noteType === opt.value ? 'primary' : 'outline-secondary'} onClick={() => onUpdate({ ...block.content, noteType: opt.value })} style={{ padding: 0, borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <span style={{ display: 'inline-block', width: 20, height: 20, borderRadius: '50%', ...opt.style }}></span>
                                </Button>
                            ))}
                        </div>
                    </div>
                    <div className="mb-3">
                        <label className="form-label fw-bold">Текст заметки</label>
                        <RichTextEditorField
                            value={html}
                            onChange={html => onUpdate({ ...block.content, html })}
                            minHeight={120}
                        />
                    </div>
                </EditModal>
            </div>
        );
    }

    // Текстовые блоки (TX01–TX03)
    if (block.type === 'text' || block.type.startsWith('TX')) {
        // TX01 — обычный текст, TX02 — узкий текст по центру, TX03 — мелкий текст
        const variant = (block.content?.variant || block.type).toLowerCase();
        let previewClass = `body-text article-text ${variant}`;
        let style: React.CSSProperties = {
            minHeight: 40,
        };

        return (
            <div className="card">
                <div className="d-flex align-items-center mb-20 gap-2">
                    <Button variant="primary" size="sm" className="d-flex align-items-center px-3 py-1" onClick={() => setEditOpen(true)}>
                        <i className="bi bi-brush me-2"></i>
                        <span className="fw-bold">Контент</span>
                    </Button>
                    <Button variant="outline-danger" size="sm" className="d-flex align-items-center px-2 py-1 ms-1" title="Удалить блок" onClick={onRemove}>
                        <i className="bi bi-trash"></i>
                    </Button>
                    <Button variant="outline-success" size="sm" className="d-flex align-items-center px-2 py-1 ms-2" title="Вверх" onClick={onMoveUp} disabled={order === 1}>
                        <i className="bi bi-arrow-up"></i>
                    </Button>
                    <Button variant="outline-success" size="sm" className="d-flex align-items-center px-2 py-1" title="Вниз" onClick={onMoveDown}>
                        <i className="bi bi-arrow-down"></i>
                    </Button>
                </div>
                <div className="preview-site-style">
                    <div className={previewClass} style={style} dangerouslySetInnerHTML={{ __html: cleanHtml(block.content?.html || '<span style=\'color:#bbb\'>Пусто</span>') }} />
                </div>
                <EditModal show={editOpen} onHide={() => setEditOpen(false)} title="Редактирование текста">
                    <RichTextEditorField
                        value={block.content?.html || ''}
                        onChange={(html) => onUpdate(html)}
                        minHeight={200}
                    />
                </EditModal>
            </div>
        );
    }
    // Превью и редактор для колонок (CL01–CL04), спец.логика для CL02
    if (block.type.startsWith('CL') && Array.isArray(block.content?.columns)) {
        const columns = block.content.columns;
        const [editColIdx, setEditColIdx] = useState<number | null>(null);
        const variant = (block.content?.variant || block.type).toLowerCase();

        // Спец.логика для CL02: первая колонка — подзаголовок (subtitle), вторая — rich text
        if (block.type === 'CL02') {
            return (
                <div className="card">
                    <div className="d-flex align-items-center mb-20 gap-2">
                        <Button
                            variant="primary"
                            size="sm"
                            className="d-flex align-items-center px-3 py-1"
                            onClick={() => setEditColIdx(0)}
                        >
                            <i className="bi bi-brush me-2"></i>
                            <span className="fw-bold">Подзаголовок</span>
                        </Button>
                        <Button
                            variant="primary"
                            size="sm"
                            className="d-flex align-items-center px-3 py-1"
                            onClick={() => setEditColIdx(1)}
                        >
                            <i className="bi bi-brush me-2"></i>
                            <span className="fw-bold">Контент 2</span>
                        </Button>
                        <Button variant="outline-danger" size="sm" className="d-flex align-items-center px-2 py-1 ms-1" title="Удалить блок" onClick={onRemove}>
                            <i className="bi bi-trash"></i>
                        </Button>
                        <Button variant="outline-success" size="sm" className="d-flex align-items-center px-2 py-1 ms-2" title="Вверх" onClick={onMoveUp} disabled={order === 1}>
                            <i className="bi bi-arrow-up"></i>
                        </Button>
                        <Button variant="outline-success" size="sm" className="d-flex align-items-center px-2 py-1" title="Вниз" onClick={onMoveDown}>
                            <i className="bi bi-arrow-down"></i>
                        </Button>
                    </div>
                    <div className={variant}>
                        <div className="body-text article-text tx01 mb-40">
                            <h2 className="section-title--sm">{columns[0]?.subtitle || ''}</h2>
                        </div>
                        <div className="body-text article-text tx01 mb-40">
                            <div dangerouslySetInnerHTML={{ __html: columns[1]?.html || '' }} />
                        </div>
                    </div>
                    {editColIdx === 0 && (
                        <EditModal show={true} onHide={() => setEditColIdx(null)} title="Редактирование подзаголовка">
                            <div className="mb-3">
                                <label className="form-label fw-bold">Подзаголовок</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={columns[0]?.subtitle || ''}
                                    onChange={e => {
                                        const newColumns = columns.map((c, i) => i === 0 ? { ...c, subtitle: e.target.value } : c);
                                        onUpdate({ ...block.content, columns: newColumns });
                                    }}
                                />
                            </div>
                        </EditModal>
                    )}
                    {editColIdx === 1 && (
                        <EditModal show={true} onHide={() => setEditColIdx(null)} title="Редактирование контента 2">
                            <RichTextEditorField
                                value={columns[1]?.html || ''}
                                onChange={html => {
                                    const newColumns = columns.map((c, i) => i === 1 ? { ...c, html } : c);
                                    onUpdate({ ...block.content, columns: newColumns });
                                }}
                                minHeight={160}
                            />
                        </EditModal>
                    )}
                </div>
            );
        }

        return (
            <div className={`card`}>
                <div className="d-flex align-items-center mb-20 gap-2">
                    {columns.map((_col, idx) => (
                        <Button
                            key={idx}
                            variant="primary"
                            size="sm"
                            className="d-flex align-items-center px-3 py-1"
                            onClick={() => setEditColIdx(idx)}
                        >
                            <i className="bi bi-brush me-2"></i>
                            <span className="fw-bold">Контент {idx + 1}</span>
                        </Button>
                    ))}
                    <Button variant="outline-danger" size="sm" className="d-flex align-items-center px-2 py-1 ms-1" title="Удалить блок" onClick={onRemove}>
                        <i className="bi bi-trash"></i>
                    </Button>
                    <Button variant="outline-success" size="sm" className="d-flex align-items-center px-2 py-1 ms-2" title="Вверх" onClick={onMoveUp} disabled={order === 1}>
                        <i className="bi bi-arrow-up"></i>
                    </Button>
                    <Button variant="outline-success" size="sm" className="d-flex align-items-center px-2 py-1" title="Вниз" onClick={onMoveDown}>
                        <i className="bi bi-arrow-down"></i>
                    </Button>
                </div>
                <div className={`${variant}`}>
                    {columns.map((col, idx) => (
                        <div key={idx} className={`body-text article-text tx01 mb-40`}>
                            <div dangerouslySetInnerHTML={{ __html: col.html || '' }} />
                        </div>
                    ))}
                </div>
                {editColIdx !== null && (
                    <EditModal show={true} onHide={() => setEditColIdx(null)} title={`Редактирование колонки ${editColIdx + 1}`}>
                        <RichTextEditorField
                            value={columns[editColIdx]?.html || ''}
                            onChange={html => {
                                const newColumns = columns.map((c, i) => i === editColIdx ? { ...c, html } : c);
                                onUpdate({ ...block.content, columns: newColumns });
                            }}
                            minHeight={160}
                        />
                    </EditModal>
                )}
            </div>
        );
    }
    // Кнопочные блоки (BF01–BF07)
    if (block.type.startsWith('BF')) {
        const { text = '', url = '', pdfUrl = '', linkType = 'external', openInNewTab = true, align = 'center' } = block.content || {};
        const buttonHref = linkType === 'pdf' ? pdfUrl : url;

        const getButtonLink = (href: string) => {
            if (!href) return '#';
            return href;
        };

        let alignClass = '';
        if (align === 'left') alignClass = 'text-start';
        else if (align === 'right') alignClass = 'text-end';
        else alignClass = 'text-center';

        return (
            <div className="card">
                <div className="d-flex align-items-center mb-20 gap-2">
                    <Button variant="primary" size="sm" className="d-flex align-items-center px-3 py-1" onClick={() => setEditOpen(true)}>
                        <i className="bi bi-brush me-2"></i>
                        <span className="fw-bold">Кнопка</span>
                    </Button>
                    <Button variant="outline-danger" size="sm" className="d-flex align-items-center px-2 py-1 ms-1" title="Удалить блок" onClick={onRemove}>
                        <i className="bi bi-trash"></i>
                    </Button>
                    <Button variant="outline-success" size="sm" className="d-flex align-items-center px-2 py-1 ms-2" title="Вверх" onClick={onMoveUp} disabled={order === 1}>
                        <i className="bi bi-arrow-up"></i>
                    </Button>
                    <Button variant="outline-success" size="sm" className="d-flex align-items-center px-2 py-1" title="Вниз" onClick={onMoveDown}>
                        <i className="bi bi-arrow-down"></i>
                    </Button>
                </div>
                <div className={`${alignClass}`}>
                    <a
                        href={getButtonLink(buttonHref)}
                        target={openInNewTab ? "_blank" : undefined}
                        rel={openInNewTab ? "noopener noreferrer" : undefined}
                        className={`button-link ${block.type.toLowerCase()}`}
                    >
                        <span>{text || 'Кнопка'}</span>
                        {
                            (block.type === 'BF03' || block.type === 'BF04' || block.type === 'BF06') && (
                                <i className="bi bi-arrow-up-right"></i>
                            )
                        }
                    </a>
                </div>
                <EditModal show={editOpen} onHide={() => setEditOpen(false)} title="Редактирование кнопки">
                    <div className="mb-3">
                        <label className="form-label fw-bold">Текст кнопки</label>
                        <input
                            type="text"
                            className="form-control"
                            value={text}
                            onChange={e => onUpdate({ ...block.content, text: e.target.value })}
                        />
                    </div>
                    <div className="mb-3">
                        <label className="form-label fw-bold">Тип ссылки</label>
                        <select
                            className="form-select"
                            value={linkType}
                            onChange={e => onUpdate({ ...block.content, linkType: e.target.value })}
                        >
                            <option value="external">Внешняя ссылка (URL)</option>
                            <option value="pdf">PDF файл</option>
                        </select>
                    </div>
                    {linkType === 'external' && (
                        <div className="mb-3">
                            <label className="form-label fw-bold">Ссылка (URL)</label>
                            <input
                                type="text"
                                className="form-control"
                                value={url}
                                onChange={e => onUpdate({ ...block.content, url: e.target.value })}
                                placeholder="Например: https://example.com"
                            />
                            <small className="text-muted">
                                Обязательно указывайте протокол (http:// или https://) для внешних ссылок
                            </small>
                        </div>
                    )}
                    {linkType === 'pdf' && (
                        <div className="mb-3">
                            <PdfUploadField
                                value={pdfUrl}
                                onChange={val => {
                                    onUpdate({ ...block.content, pdfUrl: val, linkType: 'pdf' });
                                }}
                            />
                        </div>
                    )}
                    <div className="form-check mt-2">
                        <input
                            className="form-check-input"
                            type="checkbox"
                            id={`openInNewTab-${block.id}`}
                            checked={openInNewTab}
                            onChange={e => onUpdate({ ...block.content, openInNewTab: e.target.checked })}
                        />
                        <label className="form-check-label" htmlFor={`openInNewTab-${block.id}`}>
                            Открывать в новой вкладке
                        </label>
                    </div>
                    <div className="mb-3 mt-3">
                        <label className="form-label fw-bold">Расположение кнопки</label>
                        <select
                            className="form-select"
                            value={align}
                            onChange={e => onUpdate({ ...block.content, align: e.target.value })}
                        >
                            <option value="left">Слева</option>
                            <option value="center">По центру</option>
                            <option value="right">Справа</option>
                        </select>
                    </div>
                </EditModal>
            </div>
        );
    }

    // IM01, IM02, IM03, IM04: изображения и секция с изображением
    if (
        block.type === 'IM01' ||
        block.type === 'IM02' ||
        block.type === 'IM03' ||
        block.type === 'IM04' ||
        (block.type === 'image' && block.type.startsWith('IM'))
    ) {
        const variant = block.content?.variant || block.type;
        const [editOpen, setEditOpen] = useState(false);

        // IM04: секция с изображением (заголовок, текст, картинка, reverse)
        if (variant === 'IM04') {
            const { title = '', text = '', src = '', alt = '', reverse = false } = block.content || {};
            return (
                <div className="card">
                    <div className="d-flex align-items-center mb-20 gap-2">
                        <Button variant="primary" size="sm" className="d-flex align-items-center px-3 py-1" onClick={() => setEditOpen(true)}>
                            <i className="bi bi-image me-2"></i>
                            <span className="fw-bold">Секция с изображением</span>
                        </Button>
                        <Button variant="outline-danger" size="sm" className="d-flex align-items-center px-2 py-1 ms-1" title="Удалить блок" onClick={onRemove}>
                            <i className="bi bi-trash"></i>
                        </Button>
                        <Button variant="outline-success" size="sm" className="d-flex align-items-center px-2 py-1 ms-2" title="Вверх" onClick={onMoveUp} disabled={order === 1}>
                            <i className="bi bi-arrow-up"></i>
                        </Button>
                        <Button variant="outline-success" size="sm" className="d-flex align-items-center px-2 py-1" title="Вниз" onClick={onMoveDown}>
                            <i className="bi bi-arrow-down"></i>
                        </Button>
                    </div>
                    <div className={`d-flex mb-40 ${reverse ? 'flex-row-reverse' : ''}`} style={{ gap: 32, alignItems: 'center', minHeight: 120 }}>
                        <div style={{ flex: 1 }}>
                            {title && <h2 className="section-title--sm mb-2">{title}</h2>}
                            <div className="body-text article-text tx01" dangerouslySetInnerHTML={{ __html: text || '<span style="color:#bbb">Нет текста</span>' }} />
                        </div>
                        <div style={{ flex: 1, minWidth: 180, maxWidth: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {src ? (
                                <img src={src} alt={alt} style={{ maxWidth: '100%', maxHeight: 320, objectFit: 'contain', borderRadius: 8 }} />
                            ) : (
                                <div style={{ width: '100%', height: 180, background: '#e0e0e0', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8 }}>
                                    <i className="bi bi-image" style={{ fontSize: 48, color: '#bbb' }}></i>
                                </div>
                            )}
                        </div>
                    </div>
                    <EditModal show={editOpen} onHide={() => setEditOpen(false)} title="Секция с изображением: текст и картинка">
                        <div className="mb-3">
                            <label className="form-label fw-bold">Заголовок (опционально)</label>
                            <input
                                type="text"
                                className="form-control"
                                value={title}
                                onChange={e => onUpdate({ ...block.content, title: e.target.value })}
                            />
                        </div>
                        <div className="mb-3">
                            <label className="form-label fw-bold">Текст</label>
                            <RichTextEditorField
                                value={text}
                                onChange={html => onUpdate({ ...block.content, text: html })}
                                minHeight={120}
                            />
                        </div>
                        <div className="mb-3">
                            <label className="form-label fw-bold">Изображение</label>
                            <ImageUploadField
                                value={{ src, alt }}
                                onChange={val => onUpdate({ ...block.content, ...val })}
                                hideAdvancedFields={true}
                            />
                        </div>
                        <div className="form-check mb-2">
                            <input
                                className="form-check-input"
                                type="checkbox"
                                id={`reverse-${block.id}`}
                                checked={reverse}
                                onChange={e => onUpdate({ ...block.content, reverse: e.target.checked })}
                            />
                            <label className="form-check-label" htmlFor={`reverse-${block.id}`}>
                                Картинка слева, текст справа
                            </label>
                        </div>
                    </EditModal>
                </div>
            );
        }

        // IM01, IM02, IM03 — стандартные изображения
        let { src = '', alt = '', width, height, alignH = 'center', alignV = 'center', caption = '', /*variant = 'IM01'*/ } = block.content || {};
        const imageSrc = src && src.startsWith('/uploads') ? `http://localhost:3002${src}` : src;
        const imageWithCaption = variant === 'IM02' || variant === 'IM03';
        alignH = ['left', 'center', 'right'].includes(alignH) ? alignH : 'center';
        alignV = ['top', 'center', 'bottom'].includes(alignV) ? alignV : 'center';
        const getAlignValue = (align: string) => {
            if (align === 'left' || align === 'top') return 'flex-start';
            if (align === 'right' || align === 'bottom') return 'flex-end';
            return 'center';
        };
        return (
            <div className="card">
                <div className="d-flex align-items-center mb-20 gap-2">
                    <Button variant="primary" size="sm" className="d-flex align-items-center px-3 py-1" onClick={() => setEditOpen(true)}>
                        <i className="bi bi-image me-2"></i>
                        <span className="fw-bold">{variant === 'IM01' ? 'Изображение' : 'Изображение с подписью'}</span>
                    </Button>
                    <Button variant="outline-danger" size="sm" className="d-flex align-items-center px-2 py-1 ms-1" title="Удалить блок" onClick={onRemove}>
                        <i className="bi bi-trash"></i>
                    </Button>
                    <Button variant="outline-success" size="sm" className="d-flex align-items-center px-2 py-1 ms-2" title="Вверх" onClick={onMoveUp} disabled={order === 1}>
                        <i className="bi bi-arrow-up"></i>
                    </Button>
                    <Button variant="outline-success" size="sm" className="d-flex align-items-center px-2 py-1" title="Вниз" onClick={onMoveDown}>
                        <i className="bi bi-arrow-down"></i>
                    </Button>
                </div>
                <div
                    className={`image-block image-block--${variant.toLowerCase()} mb-40`}
                    style={{
                        alignItems: getAlignValue(alignH),
                        justifyContent: getAlignValue(alignV),
                        minHeight: 120,
                    }}
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
                                objectPosition: `${alignH === 'left' ? 'left' : alignH === 'right' ? 'right' : 'center'} ${alignV === 'top' ? 'top' : alignV === 'bottom' ? 'bottom' : 'center'}`,
                            }}
                        />
                    ) : (
                        <div style={{ width: '100%', height: 180, background: '#e0e0e0', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8 }}>
                            <i className="bi bi-image" style={{ fontSize: 48, color: '#bbb' }}></i>
                        </div>
                    )}
                    {(imageWithCaption) && (
                        <div className="image-caption" style={{ maxWidth: '70%', width: width ? `${width}px` : undefined}}>
                            <div className="body-text article-text tx04" dangerouslySetInnerHTML={{ __html: caption || '<span style=\"color:#bbb\">Нет подписи</span>' }} />
                        </div>
                    )}
                </div>
                <EditModal show={editOpen} onHide={() => setEditOpen(false)} title={variant === 'IM01' ? 'Изображение: загрузка или ссылка' : 'Изображение с подписью'}>
                    <ImageUploadField
                        value={{ src, alt, width, height, alignH, alignV, variant }}
                        onChange={val => onUpdate({ ...block.content, ...val, alignH: val.alignH ?? alignH, alignV: val.alignV ?? alignV })}
                    />
                    {(variant === 'IM02' || variant === 'IM03') && (
                        <div className="mt-3">
                            <label className="form-label fw-bold">Подпись к изображению</label>
                            <RichTextEditorField
                                value={caption || ''}
                                onChange={html => onUpdate({ ...block.content, caption: html })}
                                minHeight={80}
                            />
                        </div>
                    )}
                </EditModal>
            </div>
        );
    }

    // TL01, TL02: Плитка и ссылка
    if (block.type === 'TL01') {
        const [editOpen, setEditOpen] = useState(false);
        const { src = '', alt = '', width, height, alignH = 'center', url = '', pdfUrl = '', linkType = 'url', openInNewTab = true } = block.content ||{};
        console.log('TL01 Block Content:', { src, alt, url, pdfUrl, linkType, openInNewTab, fullContent: block.content });
        const imageSrc = src && src.startsWith('/uploads') ? `http://localhost:3002${src}` : src;
        
        const getAlignValue = (align: string) => {
            if (align === 'left') return 'flex-start';
            if (align === 'right') return 'flex-end';
            return 'center';
        };

        return (
            <div className="card">
                <div className="d-flex align-items-center mb-20 gap-2">
                    <span className="badge bg-light text-dark" style={{ height: '100%', fontSize: 13, fontWeight: 500, borderRadius: '40px', border: '1px solid #000000', padding: '6px 8px' }}>TL01</span>
                    <Button variant="primary" size="sm" className="d-flex align-items-center px-3 py-1" onClick={() => setEditOpen(true)}>
                        <i className="bi bi-link-45deg me-2"></i>
                        <span className="fw-bold">Изображение-ссылка</span>
                    </Button>
                    <Button variant="outline-danger" size="sm" className="d-flex align-items-center px-2 py-1 ms-1" title="Удалить блок" onClick={onRemove}>
                        <i className="bi bi-trash"></i>
                    </Button>
                    <Button variant="outline-success" size="sm" className="d-flex align-items-center px-2 py-1 ms-2" title="Вверх" onClick={onMoveUp} disabled={order === 1}>
                        <i className="bi bi-arrow-up"></i>
                    </Button>
                    <Button variant="outline-success" size="sm" className="d-flex align-items-center px-2 py-1" title="Вниз" onClick={onMoveDown}>
                        <i className="bi bi-arrow-down"></i>
                    </Button>
                </div>
                
                <div className="mb-3" style={{ display: 'flex', justifyContent: getAlignValue(alignH), minHeight: 120 }}>
                    {imageSrc ? (
                        <div style={{ position: 'relative', cursor: 'pointer' }}>
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
                            {url && (
                                <div style={{ 
                                    position: 'absolute', 
                                    top: 8, 
                                    right: 8, 
                                    backgroundColor: 'rgba(0,0,0,0.7)', 
                                    color: 'white', 
                                    padding: '4px 8px', 
                                    borderRadius: 4,
                                    fontSize: 12
                                }}>
                                    <i className="bi bi-link-45deg"></i> Ссылка
                                </div>
                            )}
                        </div>
                    ) : (
                        <div style={{ width: '100%', height: 180, background: '#e0e0e0', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8 }}>
                            <i className="bi bi-image" style={{ fontSize: 48, color: '#bbb' }}></i>
                        </div>
                    )}
                </div>
                {(url || pdfUrl) && (
                    <div className="alert alert-info small" style={{ padding: '8px 12px', marginBottom: 10 }}>
                        <strong>{linkType === 'pdf' ? 'PDF файл' : 'Ссылка'}:</strong> {linkType === 'pdf' ? pdfUrl : url}
                    </div>
                )}

                <EditModal show={editOpen} onHide={() => setEditOpen(false)} title="Изображение-ссылка">
                    <ImageUploadField
                        value={{ src, alt, width, height, alignH }}
                        onChange={val => onUpdate({ ...block.content, ...val })}
                    />
                    <div className="mt-3">
                        <label className="form-label fw-bold">Тип ссылки</label>
                        <div className="btn-group w-100 mb-3" role="group">
                            <input
                                type="radio"
                                className="btn-check"
                                name={`linkType-tl01-${block.id}`}
                                id={`linkType-url-${block.id}`}
                                checked={linkType === 'url'}
                                onChange={() => onUpdate({ ...block.content, linkType: 'url' })}
                            />
                            <label className="btn btn-outline-primary" htmlFor={`linkType-url-${block.id}`}>URL ссылка</label>
                            
                            <input
                                type="radio"
                                className="btn-check"
                                name={`linkType-tl01-${block.id}`}
                                id={`linkType-pdf-${block.id}`}
                                checked={linkType === 'pdf'}
                                onChange={() => onUpdate({ ...block.content, linkType: 'pdf' })}
                            />
                            <label className="btn btn-outline-primary" htmlFor={`linkType-pdf-${block.id}`}>PDF файл</label>
                        </div>
                        
                        {linkType === 'url' ? (
                            <>
                                <label className="form-label fw-bold">URL ссылки</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={url}
                                    onChange={e => onUpdate({ ...block.content, url: e.target.value })}
                                    placeholder="https://example.com"
                                />
                                <small className="text-muted">
                                    Укажите полный URL (например: https://example.com)
                                </small>
                            </>
                        ) : (
                            <PdfUploadField
                                value={pdfUrl}
                                onChange={(url) => {
                                    console.log('TL01 PDF onChange:', { url, currentContent: block.content });
                                    onUpdate({ ...block.content, pdfUrl: url });
                                }}
                                label="PDF файл"
                            />
                        )}
                    </div>
                    <div className="mt-3">
                        <div className="form-check form-switch">
                            <input
                                className="form-check-input"
                                type="checkbox"
                                id={`openInNewTab-${block.id}`}
                                checked={openInNewTab}
                                onChange={e => onUpdate({ ...block.content, openInNewTab: e.target.checked })}
                            />
                            <label className="form-check-label" htmlFor={`openInNewTab-${block.id}`}>
                                Открывать в новой вкладке
                            </label>
                        </div>
                    </div>
                </EditModal>
            </div>
        );
    }

    // TL02: Галерея изображений-ссылок
    if (block.type === 'TL02') {
        const [editOpen, setEditOpen] = useState(false);
        const [editItemIdx, setEditItemIdx] = useState<number | null>(null);
        const items = Array.isArray(block.content.items) ? block.content.items : [];
        const columns = block.content.columns || 3;
        const imageHeight = block.content.imageHeight || 240;
        const maxItems = block.content.maxItems || 12;

        const handleAddItem = () => {
            if (items.length >= maxItems) return;
            const newItems = [...items, { src: '', alt: '', url: '', pdfUrl: '', linkType: 'url', openInNewTab: true }];
            onUpdate({ ...block.content, items: newItems });
        };

        const handleRemoveItem = (idx: number) => {
            const newItems = items.filter((_: any, i: number) => i !== idx);
            onUpdate({ ...block.content, items: newItems });
        };

        const handleMoveItem = (from: number, to: number) => {
            if (to < 0 || to >= items.length) return;
            const newItems = [...items];
            const [item] = newItems.splice(from, 1);
            newItems.splice(to, 0, item);
            onUpdate({ ...block.content, items: newItems });
        };

        const handleUpdateItem = (idx: number, data: any) => {
            const newItems = items.map((item: any, i: number) => i === idx ? { ...item, ...data } : item);
            onUpdate({ ...block.content, items: newItems });
        };

        return (
            <div className="card">
                <div className="d-flex align-items-center mb-20 gap-2">
                    <span className="badge bg-light text-dark" style={{ height: '100%', fontSize: 13, fontWeight: 500, borderRadius: '40px', border: '1px solid #000000', padding: '6px 8px' }}>TL02</span>
                    <Button variant="primary" size="sm" className="d-flex align-items-center px-3 py-1" onClick={() => setEditOpen(true)}>
                        <i className="bi bi-images me-2"></i>
                        <span className="fw-bold">Галерея изображений-ссылок</span>
                    </Button>
                    <Button variant="outline-danger" size="sm" className="d-flex align-items-center px-2 py-1 ms-1" title="Удалить блок" onClick={onRemove}>
                        <i className="bi bi-trash"></i>
                    </Button>
                    <Button variant="outline-success" size="sm" className="d-flex align-items-center px-2 py-1 ms-2" title="Вверх" onClick={onMoveUp} disabled={order === 1}>
                        <i className="bi bi-arrow-up"></i>
                    </Button>
                    <Button variant="outline-success" size="sm" className="d-flex align-items-center px-2 py-1" title="Вниз" onClick={onMoveDown}>
                        <i className="bi bi-arrow-down"></i>
                    </Button>
                </div>

                <div className="d-flex flex-wrap gap-3 mb-3" style={{ columnGap: 16, rowGap: 24 }}>
                    {items.length === 0 && (
                        <div className="text-muted mb-2">Нет изображений</div>
                    )}
                    {items.map((item: any, idx: number) => (
                        <div key={idx} style={{ width: `calc(${100 / columns}% - 12px)`, minWidth: 120, maxWidth: 320, position: 'relative' }}>
                            <div style={{ position: 'relative', height: imageHeight, background: '#f8f9fa', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {item.src ? (
                                    <img src={item.src} alt={item.alt} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'cover', height: imageHeight }} />
                                ) : (
                                    <div style={{ color: '#bbb', fontSize: 32 }}><i className="bi bi-image"></i></div>
                                )}
                                {item.url && (
                                    <div style={{ 
                                        position: 'absolute', 
                                        top: 6, 
                                        right: 6, 
                                        backgroundColor: 'rgba(0,0,0,0.7)', 
                                        color: 'white', 
                                        padding: '4px 8px', 
                                        borderRadius: 4,
                                        fontSize: 11,
                                        zIndex: 1
                                    }}>
                                        <i className="bi bi-link-45deg"></i>
                                    </div>
                                )}
                                <Button size="sm" variant="outline-primary" style={{ position: 'absolute', top: 6, left: 6, zIndex: 2 }} onClick={() => setEditItemIdx(idx)}>
                                    <i className="bi bi-pencil"></i>
                                </Button>
                                <Button size="sm" variant="outline-danger" style={{ position: 'absolute', bottom: 6, left: 6, zIndex: 2 }} onClick={() => handleRemoveItem(idx)}>
                                    <i className="bi bi-trash"></i>
                                </Button>
                                <Button size="sm" variant="outline-secondary" style={{ position: 'absolute', bottom: 6, right: 40, zIndex: 2 }} onClick={() => handleMoveItem(idx, idx - 1)} disabled={idx === 0}>
                                    <i className="bi bi-arrow-left"></i>
                                </Button>
                                <Button size="sm" variant="outline-secondary" style={{ position: 'absolute', bottom: 6, right: 6, zIndex: 2 }} onClick={() => handleMoveItem(idx, idx + 1)} disabled={idx === items.length - 1}>
                                    <i className="bi bi-arrow-right"></i>
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="d-flex gap-2">
                    <Button size="sm" variant="outline-primary" onClick={handleAddItem} disabled={items.length >= maxItems}>
                        <i className="bi bi-plus"></i> Добавить изображение
                    </Button>
                    <Button size="sm" variant="outline-secondary" onClick={() => setEditOpen(true)}>
                        <i className="bi bi-pencil"></i> Настройки галереи
                    </Button>
                </div>

                <EditModal show={editOpen} onHide={() => setEditOpen(false)} title="Настройки галереи">
                    <div className="mb-3">
                        <label className="form-label fw-bold">Количество колонок</label>
                        <input
                            type="number"
                            className="form-control"
                            value={columns}
                            min={1}
                            max={6}
                            onChange={e => onUpdate({ ...block.content, columns: Number(e.target.value) })}
                        />
                    </div>
                    <div className="mb-3">
                        <label className="form-label fw-bold">Высота изображений (px)</label>
                        <input
                            type="number"
                            className="form-control"
                            value={imageHeight}
                            min={60}
                            max={800}
                            onChange={e => onUpdate({ ...block.content, imageHeight: Number(e.target.value) })}
                        />
                    </div>
                </EditModal>

                {editItemIdx !== null && (
                    <EditModal show={true} onHide={() => setEditItemIdx(null)} title={`Изображение ${editItemIdx + 1}`}>
                        <ImageUploadField
                            value={items[editItemIdx]}
                            onChange={val => handleUpdateItem(editItemIdx, val)}
                            hideAdvancedFields={true}
                        />
                        <div className="mt-3">
                            <label className="form-label fw-bold">Тип ссылки</label>
                            <div className="btn-group w-100 mb-3" role="group">
                                <input
                                    type="radio"
                                    className="btn-check"
                                    name={`linkType-tl02-item-${editItemIdx}`}
                                    id={`linkType-url-item-${editItemIdx}`}
                                    checked={(items[editItemIdx]?.linkType || 'url') === 'url'}
                                    onChange={() => handleUpdateItem(editItemIdx, { linkType: 'url' })}
                                />
                                <label className="btn btn-outline-primary" htmlFor={`linkType-url-item-${editItemIdx}`}>URL ссылка</label>
                                
                                <input
                                    type="radio"
                                    className="btn-check"
                                    name={`linkType-tl02-item-${editItemIdx}`}
                                    id={`linkType-pdf-item-${editItemIdx}`}
                                    checked={items[editItemIdx]?.linkType === 'pdf'}
                                    onChange={() => handleUpdateItem(editItemIdx, { linkType: 'pdf' })}
                                />
                                <label className="btn btn-outline-primary" htmlFor={`linkType-pdf-item-${editItemIdx}`}>PDF файл</label>
                            </div>
                            
                            {(items[editItemIdx]?.linkType || 'url') === 'url' ? (
                                <>
                                    <label className="form-label fw-bold">URL ссылки</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={items[editItemIdx]?.url || ''}
                                        onChange={e => handleUpdateItem(editItemIdx, { url: e.target.value })}
                                        placeholder="https://example.com"
                                    />
                                    <small className="text-muted">
                                        Укажите полный URL (например: https://example.com)
                                    </small>
                                </>
                            ) : (
                                <PdfUploadField
                                    value={items[editItemIdx]?.pdfUrl || ''}
                                    onChange={(url) => {
                                        console.log('TL02 PDF onChange:', { url, editItemIdx, currentItem: items[editItemIdx] });
                                        handleUpdateItem(editItemIdx, { pdfUrl: url });
                                    }}
                                    label="PDF файл"
                                />
                            )}
                        </div>
                        <div className="mt-3">
                            <div className="form-check form-switch">
                                <input
                                    className="form-check-input"
                                    type="checkbox"
                                    id={`openInNewTab-item-${editItemIdx}`}
                                    checked={items[editItemIdx]?.openInNewTab ?? true}
                                    onChange={e => handleUpdateItem(editItemIdx, { openInNewTab: e.target.checked })}
                                />
                                <label className="form-check-label" htmlFor={`openInNewTab-item-${editItemIdx}`}>
                                    Открывать в новой вкладке
                                </label>
                            </div>
                        </div>
                    </EditModal>
                )}
            </div>
        );
    }

    // TB01, TB02: Таблицы
    if (block.type.startsWith('TB')) {
        const hasHeaders = block.content?.hasHeaders ?? false;
        const rows: string[][] = Array.isArray(block.content?.rows) ? block.content.rows : [['', '', '']];
        const [editOpen, setEditOpen] = useState(false);

        const handleUpdateCell = (rowIdx: number, colIdx: number, value: string) => {
            const newRows = rows.map((row, rIdx) => 
                rIdx === rowIdx ? row.map((cell, cIdx) => cIdx === colIdx ? value : cell) : row
            );
            onUpdate({ ...block.content, rows: newRows });
        };

        const handleAddRow = () => {
            const colCount = rows[0]?.length || 3;
            const newRow = Array(colCount).fill('');
            onUpdate({ ...block.content, rows: [...rows, newRow] });
        };

        const handleRemoveRow = (rowIdx: number) => {
            if (rows.length <= 1) return;
            const newRows = rows.filter((_, idx) => idx !== rowIdx);
            onUpdate({ ...block.content, rows: newRows });
        };

        const handleAddColumn = () => {
            const newRows = rows.map(row => [...row, '']);
            onUpdate({ ...block.content, rows: newRows });
        };

        const handleRemoveColumn = (colIdx: number) => {
            if (rows[0]?.length <= 1) return;
            const newRows = rows.map(row => row.filter((_, idx) => idx !== colIdx));
            onUpdate({ ...block.content, rows: newRows });
        };

        const handleToggleHeaders = () => {
            onUpdate({ ...block.content, hasHeaders: !hasHeaders });
        };

        return (
            <div className="card">
                <div className="d-flex align-items-center mb-20 gap-2">
                    <span className="badge bg-light text-dark" style={{ height: '100%', fontSize: 13, fontWeight: 500, borderRadius: '40px', border: '1px solid #000000', padding: '6px 8px' }}>{block.type}</span>
                    <Button variant="primary" size="sm" className="d-flex align-items-center px-3 py-1" onClick={() => setEditOpen(true)}>
                        <i className="bi bi-table me-2"></i>
                        <span className="fw-bold">Таблица</span>
                    </Button>
                    <Button variant="outline-danger" size="sm" className="d-flex align-items-center px-2 py-1 ms-1" title="Удалить блок" onClick={onRemove}>
                        <i className="bi bi-trash"></i>
                    </Button>
                    <Button variant="outline-success" size="sm" className="d-flex align-items-center px-2 py-1 ms-2" title="Вверх" onClick={onMoveUp} disabled={order === 1}>
                        <i className="bi bi-arrow-up"></i>
                    </Button>
                    <Button variant="outline-success" size="sm" className="d-flex align-items-center px-2 py-1" title="Вниз" onClick={onMoveDown}>
                        <i className="bi bi-arrow-down"></i>
                    </Button>
                </div>

                <div className="table-responsive mb-3">
                    <table className="table table-bordered" style={{ fontSize: 14 }}>
                        <tbody>
                            {rows.map((row, rowIdx) => (
                                <tr key={rowIdx}>
                                    {row.map((cell, colIdx) => (
                                        hasHeaders && rowIdx === 0 ? (
                                            <th key={colIdx} style={{ backgroundColor: '#f8f9fa', padding: '8px' }}>
                                                {cell || `Заголовок ${colIdx + 1}`}
                                            </th>
                                        ) : (
                                            <td key={colIdx} style={{ padding: '8px' }}>
                                                {cell || `Ячейка ${rowIdx}-${colIdx}`}
                                            </td>
                                        )
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <Button variant="outline-secondary" size="sm" onClick={() => setEditOpen(true)}>
                    <i className="bi bi-pencil"></i> Редактировать таблицу
                </Button>

                <EditModal show={editOpen} onHide={() => setEditOpen(false)} title="Редактирование таблицы">
                    <div className="mb-3">
                        <div className="form-check form-switch">
                            <input
                                className="form-check-input"
                                type="checkbox"
                                id="tableHasHeaders"
                                checked={hasHeaders}
                                onChange={handleToggleHeaders}
                            />
                            <label className="form-check-label fw-bold" htmlFor="tableHasHeaders">
                                Первая строка - заголовки
                            </label>
                        </div>
                    </div>

                    <div className="mb-3">
                        <label className="form-label fw-bold">Содержимое таблицы</label>
                        <div className="table-responsive">
                            <table className="table table-bordered">
                                <tbody>
                                    {rows.map((row, rowIdx) => (
                                        <tr key={rowIdx}>
                                            {row.map((cell, colIdx) => (
                                                <td key={colIdx} style={{ padding: '4px', verticalAlign: 'middle' }}>
                                                    <input
                                                        type="text"
                                                        className="form-control form-control-sm"
                                                        value={cell}
                                                        onChange={(e) => handleUpdateCell(rowIdx, colIdx, e.target.value)}
                                                        placeholder={hasHeaders && rowIdx === 0 ? `Заголовок ${colIdx + 1}` : `${rowIdx}-${colIdx}`}
                                                    />
                                                </td>
                                            ))}
                                            <td style={{ padding: '4px', width: '50px', textAlign: 'center' }}>
                                                <Button
                                                    variant="outline-danger"
                                                    size="sm"
                                                    onClick={() => handleRemoveRow(rowIdx)}
                                                    disabled={rows.length <= 1}
                                                    title="Удалить строку"
                                                >
                                                    <i className="bi bi-trash"></i>
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                    <tr>
                                        {rows[0]?.map((_, colIdx) => (
                                            <td key={colIdx} style={{ padding: '4px', textAlign: 'center' }}>
                                                <Button
                                                    variant="outline-danger"
                                                    size="sm"
                                                    onClick={() => handleRemoveColumn(colIdx)}
                                                    disabled={rows[0]?.length <= 1}
                                                    title="Удалить колонку"
                                                >
                                                    <i className="bi bi-trash"></i>
                                                </Button>
                                            </td>
                                        ))}
                                        <td></td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="d-flex gap-2">
                        <Button variant="outline-primary" size="sm" onClick={handleAddRow}>
                            <i className="bi bi-plus"></i> Добавить строку
                        </Button>
                        <Button variant="outline-primary" size="sm" onClick={handleAddColumn}>
                            <i className="bi bi-plus"></i> Добавить колонку
                        </Button>
                    </div>
                </EditModal>
            </div>
        );
    }
}
