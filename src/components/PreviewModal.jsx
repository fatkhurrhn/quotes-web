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
}) {
    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
            onClick={onClose}
        >
            <div
                className="bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-3xl max-h-[92vh] overflow-hidden flex flex-col shadow-2xl animate-slide-up"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Drag handle (mobile) */}
                <div className="pt-3 pb-1 flex justify-center sm:hidden">
                    <div className="w-10 h-1 bg-gray-300 rounded-full"></div>
                </div>

                {/* Header */}
                <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
                    <h3 className="text-base font-semibold text-gray-800">{title}</h3>
                    <button
                        onClick={onClose}
                        className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 active:scale-95 transition"
                    >
                        <i className="ri-close-line text-xl text-gray-500"></i>
                    </button>
                </div>

                {/* Preview Image */}
                <div className="flex-1 overflow-y-auto bg-gradient-to-b from-gray-50 to-gray-100 p-5 flex items-center justify-center">
                    {loading ? (
                        <div className="flex flex-col items-center gap-3 py-16">
                            <div className="w-12 h-12 border-4 border-[#4f90c6]/30 border-t-[#4f90c6] rounded-full animate-spin"></div>
                            <p className="text-xs text-gray-500 font-medium">
                                Membuat preview...
                            </p>
                        </div>
                    ) : imageUrl ? (
                        <img
                            src={imageUrl}
                            alt="Preview"
                            className="max-h-[52vh] w-auto rounded-xl shadow-lg"
                        />
                    ) : (
                        <div className="py-16 text-center">
                            <i className="ri-error-warning-line text-4xl text-red-400 mb-2"></i>
                            <p className="text-xs text-gray-500">Gagal membuat preview</p>
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="px-5 py-4 border-t border-gray-100 flex flex-col gap-2.5 bg-white">
                    {/* Bagikan */}
                    <button
                        onClick={onShare}
                        disabled={loading || sharing}
                        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-semibold bg-gradient-to-tr from-[#355485] to-[#4f90c6] text-white hover:opacity-90 active:scale-[0.98] transition disabled:opacity-50 shadow-md shadow-[#4f90c6]/20"
                    >
                        {sharing ? (
                            <i className="ri-loader-4-line animate-spin text-base"></i>
                        ) : (
                            <i className="ri-share-forward-fill text-base"></i>
                        )}
                        <span>{sharing ? "Membagikan..." : "Bagikan"}</span>
                    </button>

                    {/* Tandai */}
                    <button
                        onClick={onToggleMark}
                        disabled={loading}
                        className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-semibold transition active:scale-[0.98] ${isMarked
                                ? "bg-green-100 text-green-700 hover:bg-green-200"
                                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
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