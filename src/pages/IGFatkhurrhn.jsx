import React, { useEffect, useState, useRef } from 'react'
import {
    Share2, Trash2, Pencil, Upload, Loader2, ImageOff,
    X, Check, AlertTriangle
} from 'lucide-react'

const API_BASE = 'https://igfatkhurrhn.fatkhurrhnn.workers.dev'
const CACHE_KEY = 'igfatkhurrhn_files_cache'

export default function IGFatkhurrhn() {
    const [files, setFiles] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [uploading, setUploading] = useState(false)

    const [selected, setSelected] = useState(null)
    const [deleteTarget, setDeleteTarget] = useState(null)
    const [renameTarget, setRenameTarget] = useState(null)
    const [renameValue, setRenameValue] = useState('')

    const fileInputRef = useRef(null)

    // Ambil dari cache dulu, terus fetch di background
    async function fetchFiles() {
        try {
            const res = await fetch(`${API_BASE}/api/list`)
            const data = await res.json()
            setFiles(data)
            setError(null)
            // simpan ke sessionStorage
            try {
                sessionStorage.setItem(CACHE_KEY, JSON.stringify(data))
            } catch (e) { }
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        // cek cache dulu
        try {
            const cached = sessionStorage.getItem(CACHE_KEY)
            if (cached) {
                setFiles(JSON.parse(cached))
                setLoading(false)
            }
        } catch (e) { }
        // tetep fetch di background (biar dapet data baru)
        fetchFiles()
    }, [])

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
        const next = files.filter(x => x.key !== key)
        setFiles(next)
        setDeleteTarget(null)
        setSelected(null)
        try { sessionStorage.setItem(CACHE_KEY, JSON.stringify(next)) } catch (e) { }

        try {
            const res = await fetch(`${API_BASE}/api/delete/${encodeURIComponent(key)}`, {
                method: 'DELETE'
            })
            if (!res.ok) throw new Error('Gagal hapus')
        } catch (err) {
            setFiles(prev)
            try { sessionStorage.setItem(CACHE_KEY, JSON.stringify(prev)) } catch (e) { }
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
        const next = files.map(x => x.key === oldKey ? { ...x, key: newKey, url: `/api/image/${newKey}` } : x)
        setFiles(next)
        setSelected(s => s && s.key === oldKey ? { ...s, key: newKey, url: `/api/image/${newKey}` } : s)
        setRenameTarget(null)
        try { sessionStorage.setItem(CACHE_KEY, JSON.stringify(next)) } catch (e) { }

        try {
            const res = await fetch(`${API_BASE}/api/rename`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ oldKey, newKey })
            })
            if (!res.ok) throw new Error('Gagal rename')
        } catch (err) {
            setFiles(prev)
            try { sessionStorage.setItem(CACHE_KEY, JSON.stringify(prev)) } catch (e) { }
            alert('Gagal rename: ' + err.message)
        }
    }

    // ---------- Share ----------
    async function handleShare(file) {
        const url = `${API_BASE}${file.url}`

        try {
            // Fetch gambar sebagai blob
            const res = await fetch(url)
            if (!res.ok) throw new Error('Gagal ambil gambar')
            const blob = await res.blob()

            // Kasih nama file yang bener
            const fileName = file.key.includes('.') ? file.key : `${file.key}.png`
            const shareFile = new File([blob], fileName, {
                type: blob.type || 'image/png',
            })

            // Cek dukungan share files
            if (navigator.canShare && navigator.canShare({ files: [shareFile] })) {
                await navigator.share({
                    files: [shareFile],
                    title: 'Quote',
                })
            } else {
                // Fallback: kalo browser ga support share files
                // Simpen ke memori + trigger download biasa
                const downloadUrl = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = downloadUrl
                a.download = fileName
                document.body.appendChild(a)
                a.click()
                document.body.removeChild(a)
                URL.revokeObjectURL(downloadUrl)
            }
        } catch (err) {
            if (err.name !== 'AbortError') {
                console.error('Share gagal:', err)
                alert('Gagal bagikan: ' + err.message)
            }
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
                            className="inline-flex items-center gap-1.5 px-3 py-2 bg-neutral-900 text-white text-xs disabled:opacity-50 transition"
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

            {loading && files.length === 0 && (
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

            {files.length > 0 && (
                <div className="grid grid-cols-3 gap-0">
                    {files.map(file => (
                        <button
                            key={file.key}
                            onClick={() => setSelected(file)}
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

            {/* ---------- Popup: Preview Foto ---------- */}
            {selected && !deleteTarget && !renameTarget && (
                <PostPopup
                    file={selected}
                    onClose={() => setSelected(null)}
                    onDelete={() => setDeleteTarget(selected)}
                    onRename={() => openRename(selected)}
                    onShare={() => handleShare(selected)}
                />
            )}

            {/* ---------- Modal: Delete ---------- */}
            {deleteTarget && (
                <Modal onClose={() => setDeleteTarget(null)}>
                    <div className="flex flex-col items-center text-center">
                        <div className="w-12 h-12 bg-red-100 flex items-center justify-center mb-4">
                            <AlertTriangle className="w-6 h-6 text-red-600" />
                        </div>
                        <h2 className="text-lg font-semibold mb-1">Hapus quote ini?</h2>
                        <p className="text-sm text-neutral-500 mb-6 break-all">
                            <span className="font-mono text-xs">{deleteTarget.key}</span>
                        </p>
                        <div className="flex gap-2 w-full">
                            <button
                                onClick={() => setDeleteTarget(null)}
                                className="flex-1 px-4 py-2 border border-neutral-200 text-sm"
                            >
                                Batal
                            </button>
                            <button
                                onClick={confirmDelete}
                                className="flex-1 px-4 py-2 bg-red-600 text-white text-sm"
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
                            className="w-full px-3 py-2 border border-neutral-200 text-sm font-mono focus:outline-none focus:border-neutral-400 mb-6"
                        />
                        <div className="flex gap-2">
                            <button
                                onClick={() => setRenameTarget(null)}
                                className="flex-1 px-4 py-2 border border-neutral-200 text-sm"
                            >
                                Batal
                            </button>
                            <button
                                onClick={confirmRename}
                                className="flex-1 px-4 py-2 bg-neutral-900 text-white text-sm inline-flex items-center justify-center gap-2"
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

/* ---------- Popup Preview Foto ---------- */
function PostPopup({ file, onClose, onDelete, onRename, onShare }) {
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
            className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4"
            onClick={onClose}
        >
            <div
                className="relative w-full max-w-sm bg-white overflow-hidden shadow-xl"
                onClick={e => e.stopPropagation()}
            >
                {/* Close */}
                <button
                    onClick={onClose}
                    className="absolute top-3 right-3 z-10 p-1.5 bg-white/90 backdrop-blur text-neutral-700 active:bg-neutral-100 transition"
                >
                    <X className="w-4 h-4" />
                </button>

                {/* Image */}
                <div className="aspect-square bg-neutral-100">
                    <img
                        src={`${API_BASE}${file.url}`}
                        alt={file.key}
                        className="w-full h-full object-cover"
                    />
                </div>

                {/* Info */}
                {/* <div className="px-4 pt-3 pb-2 flex items-center justify-between">
                    <span className="text-xs text-neutral-500 font-mono truncate">{file.key}</span>
                    <span className="text-xs text-neutral-400">
                        {(file.size / 1024).toFixed(0)} KB
                    </span>
                </div> */}

                {/* Action bar — icon only, tipis */}
                <div className="flex border-t border-neutral-100">
                    <button
                        onClick={onShare}
                        className="flex-1 flex items-center justify-center py-3 text-neutral-700 active:bg-neutral-50 transition"
                        title="Bagikan"
                    >
                        <Share2 className="w-4 h-4" />
                    </button>
                    <div className="w-px bg-neutral-100" />
                    <button
                        onClick={onRename}
                        className="flex-1 flex items-center justify-center py-3 text-neutral-700 active:bg-neutral-50 transition"
                        title="Ubah"
                    >
                        <Pencil className="w-4 h-4" />
                    </button>
                    <div className="w-px bg-neutral-100" />
                    <button
                        onClick={onDelete}
                        className="flex-1 flex items-center justify-center py-3 text-red-600 active:bg-red-50 transition"
                        title="Hapus"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    )
}

/* ---------- Reusable Modal (center, tanpa rounded) ---------- */
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
                className="relative w-full max-w-sm bg-white shadow-xl p-6"
                onClick={e => e.stopPropagation()}
            >
                <button
                    onClick={onClose}
                    className="absolute top-3 right-3 p-1.5 text-neutral-400 active:bg-neutral-100 transition"
                >
                    <X className="w-4 h-4" />
                </button>
                {children}
            </div>
        </div>
    )
}