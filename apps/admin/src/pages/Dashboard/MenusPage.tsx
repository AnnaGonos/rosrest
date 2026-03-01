import { useEffect, useState, useRef } from 'react'
import { Modal, Button, Form, Container, Row, Col } from 'react-bootstrap'
import DashboardLayout from '../../layouts/DashboardLayout'
import { DndContext, closestCenter, PointerSensor, TouchSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core'
import { arrayMove, SortableContext, useSortable, rectSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

type MenuNode = {
    tempId: string
    id?: string
    title?: string | null
    url?: string | null
    ord?: number
    children?: MenuNode[]
}


export default function MenusPage() {
    const [nodes, setNodes] = useState<MenuNode[]>([])
    const [message, setMessage] = useState<string | null>(null)
    const [orderChanged, setOrderChanged] = useState(false)
    const idCounter = useRef(1)
    const lastSnapshotRef = useRef<MenuNode[] | null>(null)

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { delay: 1000, tolerance: 1 } }),
        useSensor(TouchSensor, { activationConstraint: { delay: 1000, tolerance: 1 } })
    )

    const [editingNode, setEditingNode] = useState<MenuNode | null>(null)
    const [showEditModal, setShowEditModal] = useState(false)

    const [showAddModal, setShowAddModal] = useState(false)
    const [addModalParent, setAddModalParent] = useState<string | null>(null)
    const [addTitle, setAddTitle] = useState('')
    const [addUrl, setAddUrl] = useState<string | null>(null)

    useEffect(() => {
        fetchMenu()
    }, [])

    const fetchMenu = async () => {
        try {
            const API_BASE = (import.meta as any).env.VITE_API_URL || 'http://localhost:3002'
            const res = await fetch(`${API_BASE}/menus`)
            if (!res.ok) return
            const data = await res.json()
            const items = Array.isArray(data) ? data : (Array.isArray(data?.items) ? data.items : [])
    
            const list: MenuNode[] = items.map((it: any) => ({ tempId: `t${idCounter.current++}`, id: it.id, title: it.title ?? it.label ?? '', url: it.url ?? null, ord: it.ord ?? 0, children: [] }))
            const byId = new Map<string, MenuNode>()
            for (const n of list) byId.set(n.id || n.tempId, n)
            for (const it of items) {
                const node = byId.get(it.id)
                if (!node) continue
                if (it.parentId) {
                    const parent = byId.get(it.parentId)
                    if (parent) parent.children = [...(parent.children || []), node]
                }
            }
            const roots = list.filter(n => {
                const original = items.find((i: any) => i.id === n.id)
                return !original || !original.parentId
            })
            setNodes(roots)
        } catch (e) {
            console.error(e)
        }
    }

    const startAddModal = (parentTempId?: string | null) => {
        setAddModalParent(parentTempId ?? null)
        setAddTitle('')
        setAddUrl(null)
        setShowAddModal(true)
    }

    const cancelAddModal = () => {
        setShowAddModal(false)
        setAddModalParent(null)
        setAddTitle('')
        setAddUrl(null)
    }

    const createFromAddModal = async () => {
        const temp = `t${idCounter.current++}`
        const node: MenuNode = { tempId: temp, title: addTitle || '', url: addUrl ?? null, ord: 0, children: [] }
        let updated: MenuNode[]
        if (!addModalParent) {
            updated = [...nodes, node]
        } else {
            const recur = (arr: MenuNode[]): MenuNode[] => arr.map(n => n.tempId === addModalParent ? { ...n, children: [...(n.children || []), node] } : { ...n, children: n.children ? recur(n.children) : [] })
            updated = recur(nodes)
        }
        setNodes(updated)
        lastSnapshotRef.current = updated

        await saveItems(updated)
        cancelAddModal()
    }

   
    const deleteNode = async (tempId: string) => {
        const findAndCollect = (arr: MenuNode[], target: string): { found: boolean, ids: string[] } => {
            for (const n of arr) {
                if (n.tempId === target) {
                    const ids: string[] = []
                    const collect = (m: MenuNode) => { if (m.id) ids.push(m.id); if (m.children) m.children.forEach(collect) }
                    collect(n)
                    return { found: true, ids }
                }
                if (n.children && n.children.length) {
                    const res = findAndCollect(n.children, target)
                    if (res.found) return res
                }
            }
            return { found: false, ids: [] }
        }

        const res = findAndCollect(nodes, tempId)
        const API_BASE = (import.meta as any).env.VITE_API_URL || 'http://localhost:3002'

        if (res.ids.length > 0) {
            
            try {
                for (const id of res.ids) {
                    await fetch(`${API_BASE}/menus/item/${id}`, { method: 'DELETE' })
                }
               
                await fetchMenu()
                setMessage('Item deleted')
                setTimeout(() => setMessage(null), 2000)
                return
            } catch (e) {
                console.error(e)
                setMessage('Error deleting item')
                return
            }
        }

        const recur = (arr: MenuNode[]): MenuNode[] => arr.filter(n => n.tempId !== tempId).map(n => ({ ...n, children: n.children ? recur(n.children) : [] }))
        setNodes(prev => recur(prev))
    }

    const moveNode = (tempId: string, direction: 'up' | 'down') => {
        const recur = (arr: MenuNode[]): MenuNode[] => {
            for (let i = 0; i < arr.length; i++) {
                if (arr[i].tempId === tempId) {
                    const j = direction === 'up' ? i - 1 : i + 1
                    if (j < 0 || j >= arr.length) return arr
                    const copy = arr.slice();
                    const tmp = copy[i]; copy[i] = copy[j]; copy[j] = tmp;
                    setOrderChanged(true);
                    return copy
                }
                if (arr[i].children && arr[i].children!.length) {
                    const updated = recur(arr[i].children!)
                    if (updated !== arr[i].children) return arr.map((n, idx) => idx === i ? { ...n, children: updated } : n)
                }
            }
            return arr
        }
        setNodes(prev => recur(prev))
    }

    const flatten = (arr: MenuNode[], parentTempId?: string) => {
        const out: any[] = []
        arr.forEach((n, idx) => {
            out.push({ tempId: n.tempId, title: n.title, url: n.url, ord: idx, parentTempId })
            if (n.children && n.children.length) out.push(...flatten(n.children, n.tempId))
        })
        return out
    }

    const saveItems = async (nodesToSave?: MenuNode[]) => {
        try {
            const API_BASE = (import.meta as any).env.VITE_API_URL || 'http://localhost:3002'
            const payload = flatten(nodesToSave ?? lastSnapshotRef.current ?? nodes)
            await fetch(`${API_BASE}/menus/main`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
            setMessage('Обновлено')
            setTimeout(() => setMessage(null), 2000)
            fetchMenu()
        } catch (e) {
            console.error(e)
            setMessage('Ошибка сохранения')
        }
    }

    const findPath = (arr: MenuNode[], id: string, path: string[] = []): { path: string[], index: number } | null => {
        for (let i = 0; i < arr.length; i++) {
            if (arr[i].tempId === id) return { path, index: i }
            if (arr[i].children && arr[i].children!.length) {
                const res = findPath(arr[i].children!, id, [...path, arr[i].tempId])
                if (res) return res
            }
        }
        return null
    }

    const getArrayByPath = (root: MenuNode[], path: string[]): MenuNode[] => {
        if (!path || path.length === 0) return root
        let cur: MenuNode[] = root
        for (const p of path) {
            const node = cur.find(n => n.tempId === p)
            if (!node) return []
            cur = node.children || []
        }
        return cur
    }

    const setArrayAtPath = (root: MenuNode[], path: string[], newArray: MenuNode[]): MenuNode[] => {
        if (!path || path.length === 0) return newArray
        return root.map(n => {
            if (n.tempId !== path[0]) return { ...n }
            return { ...n, children: setArrayAtPath(n.children || [], path.slice(1), newArray) }
        })
    }

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event
        if (!active || !over) return
        const activeId = String(active.id)
        const overId = String(over.id)
        if (activeId === overId) return

        const src = findPath(nodes, activeId)
        const tgt = findPath(nodes, overId)
        if (!src || !tgt) return


        const sameParent = JSON.stringify(src.path) === JSON.stringify(tgt.path)
        if (!sameParent) return

        const parentArr = getArrayByPath(nodes, src.path)
        const newParent = arrayMove(parentArr, src.index, tgt.index)
        const newNodes = setArrayAtPath(nodes, src.path, newParent)
        setNodes(newNodes)
        
        lastSnapshotRef.current = newNodes
        await saveItems(newNodes)
    }

    const openEdit = (n: MenuNode) => {
        setEditingNode({ ...n })
        setShowEditModal(true)
    }

    const closeEdit = () => {
        setShowEditModal(false)
        setEditingNode(null)
    }

    const handleModalSave = async () => {
        if (editingNode) {
            const recur = (arr: MenuNode[]): MenuNode[] => arr.map(n => n.tempId === editingNode.tempId ? { ...n, title: editingNode.title, url: editingNode.url } : { ...n, children: n.children ? recur(n.children) : [] })
            const updated = recur(nodes)
            setNodes(updated)
            lastSnapshotRef.current = updated
            await saveItems(updated)
        } else {
            await saveItems()
        }
        closeEdit()
    }

    const renderNode = (n: MenuNode, depth = 0) => (
        <SortableItem key={n.tempId} id={n.tempId} depth={depth} node={n} openEdit={openEdit} moveNode={moveNode} deleteNode={deleteNode} />
    )

    function SortableItem({ id, node, depth, openEdit, moveNode, deleteNode }: any) {
        const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id })
        const style = {
            transform: CSS.Transform.toString(transform),
            transition,
            marginLeft: depth * 20,
            border: '1px solid #eee',
            padding: 8,
            marginBottom: 6,
            background: '#fff',
        }
        return (
            <div ref={setNodeRef} style={{ ...style, cursor: 'grab' }} {...attributes} {...listeners}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
        
                    <div style={{ padding: 6, userSelect: 'none', display: 'inline-flex', alignItems: 'center', borderRadius: 4, background: 'transparent' }} aria-label="drag-handle">☰</div>
                    <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, maxWidth: 600, marginLeft: 6, overflowWrap: 'break-word', wordBreak: 'break-word', textAlign: 'left' }}>
                        <div style={{ lineHeight: 1.2 }}>{node.title || <i style={{ color: '#888' }}>no title</i>}</div>
                        <div style={{ color: '#666', fontSize: '0.9em', marginTop: 2 }}>{node.url || ''}</div>
                    </div>
                    <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
                        <Button size="sm" variant="outline-secondary" onClick={() => moveNode(node.tempId, 'up')} disabled={false} title="Вверх">
                            <i className="bi bi-arrow-up"></i>
                        </Button>
                        <Button size="sm" variant="outline-secondary" onClick={() => moveNode(node.tempId, 'down')} disabled={false} title="Вниз">
                            <i className="bi bi-arrow-down"></i>
                        </Button>
                        <Button size="sm" variant="outline-primary" onClick={() => startAddModal(node.tempId)}>Добавить подзаголовок</Button>
                        <Button size="sm" variant="light" title="Редактировать" onClick={() => openEdit(node)}>
                            <i className="bi bi-pencil" />
                        </Button>
                        <Button size="sm" variant="light" title="Удалить" onClick={() => deleteNode(node.tempId)}>
                            <i className="bi bi-trash text-danger" />
                        </Button>
                    </div>
                </div>
                {node.children && node.children.length > 0 && (
                    <div style={{ marginTop: 8, width: '100%' }}>
                        <SortableContext items={node.children.map((c: MenuNode) => c.tempId)} strategy={rectSortingStrategy}>
                            {node.children.map((c: MenuNode) => renderNode(c, depth + 1))}
                        </SortableContext>
                    </div>
                )}
            </div>
        )
    }

    return (
        <DashboardLayout title="Меню">
            <Container fluid>
                <Row className="mb-3">
                    <Col>
                        <h2 className="mb-0">Меню в шапке</h2>
                        <a href="https://disk.yandex.ru/d/9HU4-_uyDLuuUw"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-outline-dark  d-flex align-items-center"
                            style={{ width: 'fit-content', margin: '20px 0' }}
                        >
                            <i className="bi bi-info-lg me-2"></i>
                            Советы по публикации
                        </a>
                        <div>
                            <Button variant="success" onClick={() => startAddModal(null)}>Добавить заголовок</Button>
                        </div>
                        {orderChanged && (
                            <div className="mt-3">
                                <Button variant="warning" onClick={() => { saveItems(nodes); setOrderChanged(false); }}>Обновить порядок</Button>
                            </div>
                        )}
                        {showAddModal && (
                            <Modal show={showAddModal} onHide={cancelAddModal} backdrop="static">
                                <Modal.Header closeButton>
                                    <Modal.Title>Добавить пункт меню</Modal.Title>
                                </Modal.Header>
                                <Modal.Body>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Название</Form.Label>
                                        <Form.Control value={addTitle} onChange={e => setAddTitle(e.target.value)} />
                                    </Form.Group>
                                    <Form.Group className="mb-3">
                                        <Form.Label>URL</Form.Label>
                                        <Form.Control value={addUrl || ''} onChange={e => setAddUrl(e.target.value || null)} />
                                    </Form.Group>
                                </Modal.Body>
                                <Modal.Footer>
                                    <Button variant="secondary" onClick={cancelAddModal}>Отмена</Button>
                                    <Button variant="primary" onClick={createFromAddModal} disabled={!addTitle}>Создать</Button>
                                </Modal.Footer>
                            </Modal>
                        )}
                    </Col>
                </Row>
                <Row className="mb-4">
                    <Col />
                    <Col md={8} className="text-start">

                    </Col>
                </Row>
                <Row>
                    <Col>
                        {nodes.length === 0 && <div className="text-muted">Нет пунктов</div>}
                        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                            <SortableContext items={nodes.map(n => n.tempId)} strategy={rectSortingStrategy}>
                                <>
                                    {nodes.map(n => renderNode(n))}
                                </>
                            </SortableContext>
                        </DndContext>
                    </Col>
                </Row>
                {message && <Row className="mt-3"><Col><div className="alert alert-info">{message}</div></Col></Row>}
                <Modal show={showEditModal} onHide={closeEdit} backdrop="static">
                    <Modal.Header closeButton>
                        <Modal.Title>Редактировать пункт меню</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <Form.Group className="mb-3">
                            <Form.Label>Название</Form.Label>
                            <Form.Control value={editingNode?.title || ''} onChange={e => setEditingNode(ed => ed ? { ...ed, title: e.target.value } : ed)} />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>URL</Form.Label>
                            <Form.Control value={editingNode?.url || ''} onChange={e => setEditingNode(ed => ed ? { ...ed, url: e.target.value || null } : ed)} />
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={closeEdit}>Отмена</Button>
                        <Button variant="primary" onClick={handleModalSave} disabled={!editingNode?.title}>Сохранить</Button>
                    </Modal.Footer>
                </Modal>
            </Container>
        </DashboardLayout>
    )
}
