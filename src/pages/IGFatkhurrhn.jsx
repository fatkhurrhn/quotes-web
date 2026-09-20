import React, { useEffect, useState, useRef } from 'react'
import {
    Share2, Trash2, Pencil, Upload, Loader2, ImageOff,
    X, Check, AlertTriangle, ArrowLeft
} from 'lucide-react'

const API_BASE = 'https://igfatkhurrhn.fatkhurrhnn.workers.dev'

export default function IGFatkhurrhn() {
    const [files, setFiles] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [uploading, setUploading] = useState(false)

    const [selectedIndex, setSelectedIndex] = useState(null)
    const [deleteTarget, setDeleteTarget] = useState(null)
    const [renameTarget, setRenameTarget] = useState(null)
    const [renameValue, setRenameValue] = useState('')

    const fileInputRef = useRef(null)

    const selected = selectedIndex !== null ? files[selectedIndex] : null

    async function fetchFiles() {
        setLoading(true)
        try {
            const res = await fetch(`${API_BASE}/api/list`)
            const data = await res.json()
            setFiles(data)
            setError(null)
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { fetchFiles() }, [])

    // ---------- Upload ----------
    async function handleUpload(e) {
        const fileList = e.target.files
        if (!fileList || fileList.length === 0) return

        setUploading(true)
        try {
            for (const file of Array.from(fileList)) {
                const formData = new FormData()
                formData.append('file', file)
                const res = await fetch(`${API_BASE}/api/upload`, {
                    method: 'POST',
                    body: formData
                })
                if (!res.ok) throw new Error('Upload gagal')
            }
            await fetchFiles()
        } catch (err) {
            alert('Gagal upload: ' + err.message)
        } finally {
            setUploading(false)
            if (fileInputRef.current) fileInputRef.current.value = ''
        }
    }

    // ---------- Delete ----------
    async function confirmDelete() {
        if (!deleteTarget) return
        const key = deleteTarget.key
        const prev = files
        setFiles(f => f.filter(x => x.key !== key))
        setDeleteTarget(null)
        setSelectedIndex(null)

        try {
            const res = await fetch(`${API_BASE}/api/delete/${encodeURIComponent(key)}`, {
                method: 'DELETE'
            })
            if (!res.ok) throw new Error('Gagal hapus')
        } catch (err) {
            setFiles(prev)
            alert('Gagal hapus: ' + err.message)
        }
    }

    // ---------- Rename ----------
    function openRename(file) {
        setRenameTarget(file)
        setRenameValue(file.key)
    }

    async function confirmRename() {
        if (!renameTarget || !renameValue.trim()) return
        const oldKey = renameTarget.key
        const newKey = renameValue.trim()

        if (oldKey === newKey) {
            setRenameTarget(null)
            return
        }

        const prev = files
        setFiles(f => f.map(x => x.key === oldKey ? { ...x, key: newKey, url: `/api/image/${newKey}` } : x))
        setRenameTarget(null)

        try {
            const res = await fetch(`${API_BASE}/api/rename`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ oldKey, newKey })
            })
            if (!res.ok) throw new Error('Gagal rename')
        } catch (err) {
            setFiles(prev)
            alert('Gagal rename: ' + err.message)
        }
    }

    // ---------- Share ----------
    async function handleShare(file) {
        const url = `${API_BASE}${file.url}`
        try {
            if (navigator.share) {
                await navigator.share({ title: 'Quote', text: 'Check this quote!', url })
            } else {
                await navigator.clipboard.writeText(url)
                alert('Link disalin!')
            }
        } catch (err) {
            if (err.name !== 'AbortError') console.error(err)
        }
    }

    return (
        <div className="min-h-screen bg-white text-neutral-900">
            {/* Header */}
            <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-neutral-100">
                <div className="px-4 py-3 flex items-center justify-between">
                    <div>
                        <h1 className="text-lg font-light tracking-tight leading-none">
                            IG<span className="font-semibold">Fatkhurrhn</span>
                        </h1>
                        <p className="text-[11px] text-neutral-400 mt-0.5">
                            {files.length} quotes
                        </p>
                    </div>
                    <div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleUpload}
                            className="hidden"
                        />
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploading}
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full bg-neutral-900 text-white text-xs disabled:opacity-50 transition"
                        >
                            {uploading ? (
                                <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Uploading</>
                            ) : (
                                <><Upload className="w-3.5 h-3.5" /> Upload</>
                            )}
                        </button>
                    </div>
                </div>
            </header>

            {loading && (
                <div className="flex justify-center py-20">
                    <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
                </div>
            )}

            {error && (
                <div className="text-center py-20 text-red-500 text-sm px-4">
                    Gagal memuat: {error}
                </div>
            )}

            {!loading && !error && files.length === 0 && (
                <div className="flex flex-col items-center py-20 text-neutral-400">
                    <ImageOff className="w-10 h-10 mb-3" />
                    <p className="text-sm">Belum ada quotes</p>
                </div>
            )}

            {!loading && files.length > 0 && (
                <div className="grid grid-cols-3 gap-0">
                    {files.map((file, idx) => (
                        <button
                            key={file.key}
                            onClick={() => setSelectedIndex(idx)}
                            className="relative aspect-square bg-neutral-100 overflow-hidden active:opacity-80 transition"
                        >
                            <img
                                src={`${API_BASE}${file.url}`}
                                alt={file.key}
                                loading="lazy"
                                className="w-full h-full object-cover"
                            />
                        </button>
                    ))}
                </div>
            )}

            {/* ---------- Viewer (full screen, swipeable) ---------- */}
            {selected && !deleteTarget && !renameTarget && (
                <PostViewer
                    files={files}
                    index={selectedIndex}
                    onIndexChange={setSelectedIndex}
                    onClose={() => setSelectedIndex(null)}
                    onDelete={() => setDeleteTarget(selected)}
                    onRename={() => openRename(selected)}
                    onShare={() => handleShare(selected)}
                />
            )}

            {/* ---------- Modal: Delete ---------- */}
            {deleteTarget && (
                <Modal onClose={() => setDeleteTarget(null)}>
                    <div className="flex flex-col items-center text-center">
                        <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
                            <AlertTriangle className="w-6 h-6 text-red-600" />
                        </div>
                        <h2 className="text-lg font-semibold mb-1">Hapus quote ini?</h2>
                        <p className="text-sm text-neutral-500 mb-6 break-all">
                            <span className="font-mono text-xs">{deleteTarget.key}</span>
                        </p>
                        <div className="flex gap-2 w-full">
                            <button
                                onClick={() => setDeleteTarget(null)}
                                className="flex-1 px-4 py-2 rounded-lg border border-neutral-200 text-sm"
                            >
                                Batal
                            </button>
                            <button
                                onClick={confirmDelete}
                                className="flex-1 px-4 py-2 rounded-lg bg-red-600 text-white text-sm"
                            >
                                Hapus
                            </button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* ---------- Modal: Rename ---------- */}
            {renameTarget && (
                <Modal onClose={() => setRenameTarget(null)}>
                    <div>
                        <h2 className="text-lg font-semibold mb-1">Ubah nama file</h2>
                        <p className="text-sm text-neutral-500 mb-4">Nama baru (harus unik)</p>
                        <input
                            type="text"
                            value={renameValue}
                            onChange={e => setRenameValue(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && confirmRename()}
                            autoFocus
                            className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm font-mono focus:outline-none focus:border-neutral-400 mb-6"
                        />
                        <div className="flex gap-2">
                            <button
                                onClick={() => setRenameTarget(null)}
                                className="flex-1 px-4 py-2 rounded-lg border border-neutral-200 text-sm"
                            >
                                Batal
                            </button>
                            <button
                                onClick={confirmRename}
                                className="flex-1 px-4 py-2 rounded-lg bg-neutral-900 text-white text-sm inline-flex items-center justify-center gap-2"
                            >
                                <Check className="w-4 h-4" /> Simpan
                            </button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    )
}

/* ---------- Post Viewer (fullscreen, swipeable) ---------- */
function PostViewer({ files, index, onIndexChange, onClose, onDelete, onRename, onShare }) {
    const file = files[index]
    const touchStart = useRef(null)
    const touchDelta = useRef(0)
    const [drag, setDrag] = useState(0)

    // Keyboard nav
    useEffect(() => {
        function onKey(e) {
            if (e.key === 'Escape') onClose()
            if (e.key === 'ArrowRight' && index < files.length - 1) onIndexChange(index + 1)
            if (e.key === 'ArrowLeft' && index > 0) onIndexChange(index - 1)
        }
        document.addEventListener('keydown', onKey)
        document.body.style.overflow = 'hidden'
        return () => {
            document.removeEventListener('keydown', onKey)
            document.body.style.overflow = ''
        }
    }, [index, files.length, onClose, onIndexChange])

    // Reset drag saat pindah foto
    useEffect(() => {
        setDrag(0)
        touchStart.current = null
        touchDelta.current = 0
    }, [index])

    function onTouchStart(e) {
        touchStart.current = e.touches[0].clientX
    }

    function onTouchMove(e) {
        if (touchStart.current === null) return
        const delta = e.touches[0].clientX - touchStart.current
        if ((index === 0 && delta > 0) || (index === files.length - 1 && delta < 0)) {
            touchDelta.current = delta * 0.3
        } else {
            touchDelta.current = delta
        }
        setDrag(touchDelta.current)
    }

    function onTouchEnd() {
        const threshold = 60
        if (touchDelta.current < -threshold && index < files.length - 1) {
            onIndexChange(index + 1)
        } else if (touchDelta.current > threshold && index > 0) {
            onIndexChange(index - 1)
        }
        setDrag(0)
        touchStart.current = null
        touchDelta.current = 0
    }

    return (
        <div className="fixed inset-0 z-40 bg-white flex flex-col">
            {/* Top bar */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100">
                <button
                    onClick={onClose}
                    className="p-2 -ml-2 rounded-full active:bg-neutral-100 transition"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <span className="text-xs text-neutral-500 font-mono truncate max-w-[60%]">
                    {file.key}
                </span>
                <span className="text-xs text-neutral-400">
                    {index + 1} / {files.length}
                </span>
            </div>

            {/* Image area — swipeable */}
            <div
                className="flex-1 bg-neutral-950 relative overflow-hidden select-none"
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
            >
                <div
                    className="absolute inset-0 flex items-center justify-center will-change-transform"
                    style={{
                        transform: `translateX(${drag}px)`,
                        transition: touchStart.current === null ? 'transform 0.25s ease-out' : 'none',
                    }}
                >
                    <img
                        src={`${API_BASE}${file.url}`}
                        alt={file.key}
                        draggable={false}
                        className="max-w-full max-h-full object-contain pointer-events-none"
                    />
                </div>

                {/* Hint panah (desktop doang) */}
                <div className="hidden md:flex absolute inset-y-0 left-0 items-center pl-3 pointer-events-none">
                    {index > 0 && (
                        <div className="w-8 h-8 rounded-full bg-white/10 backdrop-blur flex items-center justify-center text-white text-xs">
                            ‹
                        </div>
                    )}
                </div>
                <div className="hidden md:flex absolute inset-y-0 right-0 items-center pr-3 pointer-events-none">
                    {index < files.length - 1 && (
                        <div className="w-8 h-8 rounded-full bg-white/10 backdrop-blur flex items-center justify-center text-white text-xs">
                            ›
                        </div>
                    )}
                </div>
            </div>

            {/* Action bar */}
            <div className="border-t border-neutral-100 px-4 py-4 grid grid-cols-3 gap-3 bg-white">
                <ActionButton
                    icon={<Share2 className="w-5 h-5" />}
                    label="Bagikan"
                    onClick={onShare}
                />
                <ActionButton
                    icon={<Pencil className="w-5 h-5" />}
                    label="Ubah"
                    onClick={onRename}
                />
                <ActionButton
                    icon={<Trash2 className="w-5 h-5" />}
                    label="Hapus"
                    onClick={onDelete}
                    variant="danger"
                />
            </div>
        </div>
    )
}

function ActionButton({ icon, label, onClick, variant }) {
    const base = "flex flex-col items-center justify-center gap-1 py-3 rounded-xl border text-xs transition active:scale-95"
    const styles = variant === 'danger'
        ? "border-red-100 text-red-600 bg-red-50"
        : "border-neutral-200 text-neutral-700 bg-white"

    return (
        <button onClick={onClick} className={`${base} ${styles}`}>
            {icon}
            <span>{label}</span>
        </button>
    )
}

/* ---------- Reusable Modal (center) ---------- */
function Modal({ children, onClose }) {
    useEffect(() => {
        function onKey(e) { if (e.key === 'Escape') onClose() }
        document.addEventListener('keydown', onKey)
        document.body.style.overflow = 'hidden'
        return () => {
            document.removeEventListener('keydown', onKey)
            document.body.style.overflow = ''
        }
    }, [onClose])

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={onClose}
        >
            <div
                className="relative w-full max-w-sm bg-white rounded-2xl shadow-xl p-6"
                onClick={e => e.stopPropagation()}
            >
                <button
                    onClick={onClose}
                    className="absolute top-3 right-3 p-1.5 rounded-full text-neutral-400 active:bg-neutral-100 transition"
                >
                    <X className="w-4 h-4" />
                </button>
                {children}
            </div>
        </div>
    )
}