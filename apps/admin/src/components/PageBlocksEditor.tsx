import { Button } from 'react-bootstrap'
import { IconPlus, IconEye } from '@tabler/icons-react'
import { PageContentBlock } from './PageContentBlock'
import { useState } from 'react';
import { BLOCK_VARIANTS } from './blockVariants';
import { BlocksRenderer } from './BlocksRenderer';

interface Block {
    id: string
    type: string
    content: Record<string, any>
    order: number
    parentBlockId?: string
    children?: Block[]
}

interface PageBlocksEditorProps {
    blocks: Block[]
    setBlocks: (blocks: Block[]) => void
}

export function PageBlocksEditor({ blocks, setBlocks }: PageBlocksEditorProps) {
    const [showVariants, setShowVariants] = useState(false);
    const [selectedType, setSelectedType] = useState<string | null>(null);
    const [showBlocksPreview, setShowBlocksPreview] = useState(false);

    const handleAddBlockClick = () => {
        setShowVariants(true);
        setSelectedType(null);
    };

    const handleVariantSelect = (type: string) => {
        setSelectedType(type);
    };

    const handleSubvariantSelect = (type: string, subvariant: any) => {
        let blockType = subvariant.id || type;
        let content = subvariant.defaultContent;
        
        if (type === 'columns' && subvariant.id && Array.isArray(subvariant.defaultContent?.columns)) {
            blockType = subvariant.id;
            content = { columns: (subvariant.defaultContent.columns as Array<Record<string, any>>).map((col: Record<string, any>) => ({ ...col })) };
        }
        
        if (type === 'tabs' && subvariant.id === 'TS01') {
            blockType = 'TS01';
            content = {
              tabs: [
                { id: `tab-${Date.now()}-1`, title: 'Таб 1', children: [] },
                { id: `tab-${Date.now()}-2`, title: 'Таб 2', children: [] }
              ]
            };
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
            order: blocks.length,
            children: [],
        };

        setBlocks([...blocks, newBlock]);
        setShowVariants(false);
        setSelectedType(null);
    }

    const updateBlockContent = (blockId: string, content: string | Record<string, any>) => {
    setBlocks(blocks.map((block: Block) => {
        if (block.id !== blockId) return block;
        
        if (block.type.startsWith('CL') && typeof content === 'object' && Array.isArray((content as any).columns)) {
            return { ...block, content: { ...block.content, ...(content as Record<string, any>) } };
        }
        if ((block.type === 'TS01' || block.type === 'TS02') && typeof content === 'object' && Array.isArray((content as any).tabs)) {
            return { ...block, content: { ...block.content, ...(content as Record<string, any>) } };
        }
        if (block.type.startsWith('BF')) {
            return { ...block, content: typeof content === 'object' ? { ...(content as Record<string, any>) } : {} };
        }
        if (block.type === 'QA01' && typeof content === 'object' && Array.isArray((content as any).items)) {
            return { ...block, content: { ...block.content, ...(content as Record<string, any>) } };
        }
        if (block.type.startsWith('GL') && typeof content === 'object') {
            return { ...block, content: { ...block.content, ...(content as Record<string, any>) } };
        }
        if ((block.type === 'TL01' || block.type === 'TL02') && typeof content === 'object') {
            return { ...block, content: { ...block.content, ...(content as Record<string, any>) } };
        }
        if (typeof content === 'string') {
            return { ...block, content: { html: content } };
        }
        return { ...block, content: content as Record<string, any> };
    }));
}

    const removeBlock = (blockId: string) => {
        setBlocks(blocks.filter(block => block.id !== blockId))
    }

    const sortedBlocks = [...blocks].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    return (
        <div style={{ position: 'relative' }}>
            <div className="d-flex align-items-center mb-3">
                <h6 className="fw-bold text-uppercase me-3 mb-0">
                    {showBlocksPreview ? 'ПРЕВЬЮ СОДЕРЖИМОГО' : 'СОДЕРЖИМОЕ СТРАНИЦЫ'}
                </h6>
            </div>
            <div style={{ position: 'fixed', top: 30, right: 20, zIndex: 1050 }}>
                <Button
                    variant="outline-secondary"
                    size="sm"
                    style={{
                        borderRadius: '6px',
                        width: 40,
                        height: 40,
                        padding: 0,
                        marginRight: 8,
                        marginBottom: 8,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                    className="no-caret"
                    onClick={() => setShowBlocksPreview(v => !v)}
                    aria-label="Превью блоков"
                >
                    <IconEye size={20} color="#000" />
                </Button>
                <Button
                    variant="primary"
                    size="sm"
                    style={{
                        borderRadius: '6px',
                        width: 40,
                        height: 40,
                        padding: 0,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                        display: showBlocksPreview ? 'none' : 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                    className="no-caret"
                    onClick={handleAddBlockClick}
                >
                    <IconPlus size={20} />
                </Button>
                {showVariants && !showBlocksPreview && (
                    <div
                        style={{
                            position: 'absolute',
                            top: 50,
                            right: 0,
                            background: '#fff',
                            border: '1px solid #ddd',
                            borderRadius: 8,
                            boxShadow: '0 2px 12px rgba(0,0,0,0.12)',
                            minWidth: 1000,
                            minHeight: 550,
                            maxHeight: 1000,
                            overflowY: 'auto',
                            padding: 16,
                            zIndex: 2000
                        }}
                    >
                        {!selectedType ? (
                            <>
                                <div className="mb-2 fw-bold">Выберите тип блока</div>
                                <div style={{ maxHeight: 500, overflowY: 'auto' }}>
                                    {BLOCK_VARIANTS.map(variant => (
                                        <div key={variant.type} className="mb-2">
                                            <Button variant="light" className="w-100 text-start" onClick={() => handleVariantSelect(variant.type)}>
                                                {variant.label}
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                                <div className="text-end mt-2">
                                    <Button size="sm" variant="outline-secondary" onClick={() => setShowVariants(false)}>Отмена</Button>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="mb-2 fw-bold">Выберите подвариант</div>
                                <div style={{ maxHeight: 600, overflowY: 'auto' }}>
                                    {BLOCK_VARIANTS.find(v => v.type === selectedType)?.subvariants.map(sub => (
                                        <div key={sub.id} className="" style={{ display: 'flex', flexDirection: 'row', background: '#f8f9fa', marginBottom: 12, padding: 8 }}>
                                            <div className="flex-grow-1">
                                                <div className="fw-medium" style={{ borderRadius: 4, border: '1px solid #eee', width: 'fit-content', padding: '5px 10px', backgroundColor: '#eee', marginBottom: 15 }}>{sub.name}</div>
                                                <div className="small text-muted mb-1">{sub.title}</div>
                                                <div className="small">{sub.description}</div>
                                                <Button size="sm" variant="primary" className="mt-2" onClick={() => handleSubvariantSelect(selectedType, sub)}>Выбрать</Button>
                                            </div>
                                            <img src={sub.preview} alt={sub.name} style={{ maxWidth: 500, height: '100%', objectFit: 'contain', marginLeft: 16, borderRadius: 4, border: '1px solid #eee' }} />
                                        </div>
                                    ))}
                                </div>
                                <div className="text-end mt-2">
                                    <Button size="sm" variant="outline-secondary" onClick={() => setSelectedType(null)}>Назад</Button>
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>
            {showBlocksPreview ? (
                <div style={{ marginTop: 40 }}>
                    <BlocksRenderer blocks={sortedBlocks} />
                </div>
            ) : (
                blocks.length === 0 ? (
                    <div className="text-center py-5 text-muted">
                        Нет блоков контента. Нажмите плюсик справа, чтобы добавить.
                    </div>
                ) : (
                    <div className="d-flex flex-column gap-3">
                        {[...blocks].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)).map((block, index, arr) => (
                            <PageContentBlock
                                key={block.id}
                                block={block}
                                onUpdate={(content: any) => updateBlockContent(block.id, content)}
                                onRemove={() => removeBlock(block.id)}
                                order={index + 1}
                                onMoveUp={() => {
                                    if (index > 0) {
                                        const sorted = [...arr];
                                        [sorted[index - 1], sorted[index]] = [sorted[index], sorted[index - 1]];
                                        sorted.forEach((b, idx) => { b.order = idx; });
                                        setBlocks(sorted);
                                    }
                                }}
                                onMoveDown={() => {
                                    if (index < arr.length - 1) {
                                        const sorted = [...arr];
                                        [sorted[index], sorted[index + 1]] = [sorted[index + 1], sorted[index]];
                                        sorted.forEach((b, idx) => { b.order = idx; });
                                        setBlocks(sorted);
                                    }
                                }}
                            />
                        ))}
                    </div>
                )
            )}
        </div>
    );
}


