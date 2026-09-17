import {
    X,
    Download,
    Share2,
    Check,
    CheckCheck,
    LoaderCircle,
    AlertCircle,
    Shuffle,
} from "lucide-react";

export default function PreviewModal({
    isOpen,
    onClose,
    title,
    imageUrl,
    loading,
    isMarked,
    onToggleMark,
    onShare,
    sharing,
    onShuffleBg,      // <-- baru
    shufflingBg,      // <-- baru
    canShuffleBg,     // <-- baru (opsional, biar kontrol dari parent)
}) {
    if (!isOpen) return null;

    const isReels = title?.toLowerCase().includes("reels");

    const previewFormat = isReels
        ? {
            label: "Instagram Reels",
            size: "1080 × 1920 px",
            ratio: "9 / 16",
            canvasClass: "aspect-[9/16]",
            maxHeight: "max-h-[58vh]",
        }
        : {
            label: "Instagram Feed",
            size: "1080 × 1080 px",
            ratio: "1 / 1",
            canvasClass: "aspect-square",
            maxHeight: "max-h-[58vh]",
        };

    const handleDownload = () => {
        if (!imageUrl || loading) return;

        const filename = isReels
            ? "quote-reels.png"
            : "quote-feed.png";

        const link = document.createElement("a");
        link.href = imageUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 backdrop-blur-sm sm:items-center sm:p-5"
            onClick={onClose}
        >
            <div
                className="relative flex max-h-[94vh] w-full flex-col overflow-hidden border border-gray-200 bg-white shadow-2xl sm:max-w-md sm:rounded-2xl"
                onClick={(event) => event.stopPropagation()}
            >
                {/* Mobile Drag Handle */}
                <div className="flex justify-center pb-1 pt-3 sm:hidden">
                    <div className="h-1 w-9 rounded-full bg-gray-300" />
                </div>

                {/* Header */}
                <div className="flex items-center justify-between gap-4 border-b border-gray-100 px-5 py-4">
                    <div className="min-w-0">
                        <div className="mb-1 flex items-center gap-2">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-400">
                                Image Preview
                            </p>

                            <span className="h-1 w-1 rounded-full bg-gray-300" />

                            <p className="text-[10px] font-medium text-[#4f90c6]">
                                {previewFormat.label}
                            </p>
                        </div>

                        <h3 className="truncate text-sm font-semibold text-gray-900 sm:text-base">
                            {title || "Preview Quote"}
                        </h3>

                        <p className="mt-1 text-[11px] text-gray-400">
                            {previewFormat.size}
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="flex h-8 w-8 shrink-0 items-center justify-center border border-gray-200 text-gray-500 transition hover:border-gray-300 hover:bg-gray-50 hover:text-gray-900 active:scale-95"
                        aria-label="Tutup preview"
                    >
                        <X size={17} strokeWidth={1.8} />
                    </button>
                </div>

                {/* Preview Area */}
                <div className="flex min-h-[300px] flex-1 items-center justify-center overflow-y-auto bg-[#f7f8fa] p-5 sm:p-6">
                    {loading ? (
                        <div className="flex w-full flex-col items-center justify-center gap-4">
                            <div
                                className={`relative flex ${previewFormat.canvasClass} w-full max-w-[280px] items-center justify-center overflow-hidden border border-gray-200 bg-white shadow-sm`}
                            >
                                <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-gray-100 via-white to-gray-100" />

                                <div className="relative z-10 flex flex-col items-center gap-3">
                                    <div className="flex h-11 w-11 items-center justify-center border border-gray-200 bg-white text-[#4f90c6] shadow-sm">
                                        <LoaderCircle
                                            size={22}
                                            strokeWidth={1.8}
                                            className="animate-spin"
                                        />
                                    </div>

                                    <div className="text-center">
                                        <p className="text-xs font-semibold text-gray-600">
                                            Membuat preview...
                                        </p>

                                        <p className="mt-1 text-[10px] text-gray-400">
                                            {previewFormat.size}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <p className="text-[11px] text-gray-400">
                                Menyiapkan ukuran {isReels ? "Reels" : "Feed"}
                            </p>
                        </div>
                    ) : imageUrl ? (
                        <div className="flex max-w-full items-center justify-center">
                            <img
                                src={imageUrl}
                                alt={title || "Preview quote"}
                                className={`block w-auto max-w-full object-contain border border-gray-200 bg-white shadow-lg ${previewFormat.maxHeight}`}
                            />
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
                            <div className="mb-3 flex h-12 w-12 items-center justify-center border border-red-100 bg-red-50 text-red-400">
                                <AlertCircle
                                    size={24}
                                    strokeWidth={1.7}
                                />
                            </div>

                            <p className="text-sm font-semibold text-gray-700">
                                Gagal membuat preview
                            </p>

                            <p className="mt-1 text-xs text-gray-400">
                                Silakan coba buka preview kembali
                            </p>
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="space-y-2 border-t border-gray-100 bg-white px-5 py-4">
                    {/* Shuffle Background (khusus Reels) */}
                    {isReels && canShuffleBg && (
                        <button
                            type="button"
                            onClick={onShuffleBg}
                            disabled={loading || shufflingBg || !imageUrl}
                            className="flex w-full items-center justify-center gap-2 border border-violet-200 bg-violet-50 px-4 py-3 text-xs font-semibold text-violet-700 transition hover:bg-violet-100 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm"
                        >
                            {shufflingBg ? (
                                <LoaderCircle
                                    size={16}
                                    strokeWidth={1.9}
                                    className="animate-spin"
                                />
                            ) : (
                                <Shuffle
                                    size={16}
                                    strokeWidth={1.9}
                                />
                            )}

                            <span>
                                {shufflingBg
                                    ? "Mengacak background..."
                                    : "Acak Background"}
                            </span>
                        </button>
                    )}

                    <div className="grid grid-cols-2 gap-2">
                        {/* Download */}
                        <button
                            type="button"
                            onClick={handleDownload}
                            disabled={loading || !imageUrl}
                            className="flex items-center justify-center gap-2 border border-gray-200 bg-white px-4 py-3 text-gray-700 transition hover:border-gray-300 hover:bg-gray-50 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <Download size={16} strokeWidth={1.9} />
                            <span className="text-xs font-semibold sm:text-sm">
                                Download
                            </span>
                        </button>

                        {/* Share */}
                        <button
                            type="button"
                            onClick={onShare}
                            disabled={loading || sharing || !imageUrl}
                            className="flex items-center justify-center gap-2 bg-[#4f90c6] px-4 py-3 text-white shadow-sm shadow-[#4f90c6]/20 transition hover:bg-[#447fb1] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {sharing ? (
                                <LoaderCircle
                                    size={16}
                                    strokeWidth={1.9}
                                    className="animate-spin"
                                />
                            ) : (
                                <Share2
                                    size={16}
                                    strokeWidth={1.9}
                                />
                            )}

                            <span className="text-xs font-semibold sm:text-sm">
                                {sharing ? "Membagikan..." : "Bagikan"}
                            </span>
                        </button>
                    </div>

                    {/* Mark as Used */}
                    <button
                        type="button"
                        onClick={onToggleMark}
                        disabled={loading}
                        className={`flex w-full items-center justify-center gap-2 border px-4 py-3 text-xs font-semibold transition active:scale-[0.98] sm:text-sm ${isMarked
                            ? "border-green-200 bg-green-50 text-green-700 hover:bg-green-100"
                            : "border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50"
                            } ${loading ? "cursor-not-allowed opacity-50" : ""}`}
                    >
                        {isMarked ? (
                            <CheckCheck
                                size={17}
                                strokeWidth={2}
                                className="text-green-600"
                            />
                        ) : (
                            <Check
                                size={17}
                                strokeWidth={1.9}
                                className="text-gray-500"
                            />
                        )}

                        <span>
                            {isMarked
                                ? "Sudah Ditandai"
                                : "Tandai Sudah Dipakai"}
                        </span>
                    </button>
                </div>
            </div>
        </div>
    );
}