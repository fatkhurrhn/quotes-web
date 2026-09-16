export default function PreviewModal({
    isOpen,
    onClose,
    title,
    imageUrl,
    loading,
    isMarked,
    onToggleMark,
    onCopyText,
    copied,
}) {
    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
                    <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition"
                    >
                        <i className="ri-close-line text-xl text-gray-500"></i>
                    </button>
                </div>

                {/* Preview Image */}
                <div className="flex-1 overflow-y-auto bg-gray-50 p-4 flex items-center justify-center">
                    {loading ? (
                        <div className="flex flex-col items-center gap-3 py-12">
                            <i className="ri-loader-4-line animate-spin text-3xl text-[#4f90c6]"></i>
                            <p className="text-xs text-gray-500">Membuat preview...</p>
                        </div>
                    ) : imageUrl ? (
                        <img
                            src={imageUrl}
                            alt="Preview"
                            className="max-h-[55vh] w-auto rounded-lg shadow-md"
                        />
                    ) : (
                        <div className="py-12 text-center">
                            <i className="ri-error-warning-line text-4xl text-red-400 mb-2"></i>
                            <p className="text-xs text-gray-500">Gagal membuat preview</p>
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="px-4 py-3 border-t border-gray-200 flex flex-col gap-2">
                    {/* Copy Text */}
                    <button
                        onClick={onCopyText}
                        disabled={loading}
                        className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition ${copied
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            } ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                        <i
                            className={`${copied ? "ri-check-line" : "ri-file-copy-line"
                                } text-base`}
                        ></i>
                        <span>{copied ? "Tersalin!" : "Salin Teks"}</span>
                    </button>

                    {/* Tandai Toggle */}
                    <button
                        onClick={onToggleMark}
                        disabled={loading}
                        className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition ${isMarked
                                ? "bg-green-100 text-green-700 hover:bg-green-200"
                                : "bg-gradient-to-tr from-[#355485] to-[#4f90c6] text-white hover:opacity-90"
                            } ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                        <i
                            className={`${isMarked ? "ri-check-double-fill" : "ri-check-line"
                                } text-base`}
                        ></i>
                        <span>{isMarked ? "Sudah Ditandai" : "Tandai Sudah Dipakai"}</span>
                    </button>
                </div>
            </div>
        </div>
    );
}