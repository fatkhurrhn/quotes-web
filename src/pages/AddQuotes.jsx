import { useState, useEffect } from "react";
import { myQuotesCollection } from "../firebase";
import { addDoc, serverTimestamp } from "firebase/firestore";
import BottomNav from "../components/BottomNav";
import { Link } from "react-router-dom";

const AddQuotes = () => {
    const [quote, setQuote] = useState("");
    const [author, setAuthor] = useState("");
    const [category, setCategory] = useState("motivation");
    const [isLoading, setIsLoading] = useState(false);
    const [showNotification, setShowNotification] = useState(false);
    const [notificationMessage, setNotificationMessage] = useState("");
    const [notificationType, setNotificationType] = useState("success");

    // History drawer state
    const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState(false);

    // Author history state
    const [authorHistory, setAuthorHistory] = useState([]);

    // History state
    const [quoteHistory, setQuoteHistory] = useState([]);

    // Load history from localStorage
    useEffect(() => {
        const savedHistory = localStorage.getItem("quoteHistory");
        if (savedHistory) {
            setQuoteHistory(JSON.parse(savedHistory));
        }

        // Load author history
        const savedAuthors = localStorage.getItem("authorHistory");
        if (savedAuthors) {
            setAuthorHistory(JSON.parse(savedAuthors));
        }
    }, []);

    // Save author to history when submitting
    const saveAuthorToHistory = (authorName) => {
        if (!authorName.trim()) return;

        // Hapus yang duplikat, tambahkan yang baru di awal
        const updatedAuthors = [
            authorName,
            ...authorHistory.filter(a => a !== authorName)
        ].slice(0, 10);

        setAuthorHistory(updatedAuthors);
        localStorage.setItem("authorHistory", JSON.stringify(updatedAuthors));
    };

    // Save history to localStorage
    const saveToHistory = (newQuote) => {
        const updatedHistory = [newQuote, ...quoteHistory].slice(0, 10);
        setQuoteHistory(updatedHistory);
        localStorage.setItem("quoteHistory", JSON.stringify(updatedHistory));
    };

    // Handle manual author change
    const handleManualAuthor = (e) => {
        setAuthor(e.target.value);
    };

    // Pilih author dari history
    const selectAuthorFromHistory = (selectedAuthor) => {
        setAuthor(selectedAuthor);
    };

    // Show notification popup
    const showPopupNotification = (message, isError = false) => {
        setNotificationMessage(message);
        setNotificationType(isError ? "error" : "success");
        setShowNotification(true);

        setTimeout(() => {
            setShowNotification(false);
        }, 2000);
    };

    // Handle Submit - dengan status PENDING
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const newQuote = {
                text: quote,
                author: author,
                category: category,
                status: "pending",
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                likes: 0,
                views: 0,
            };

            await addDoc(myQuotesCollection, newQuote);

            // ✅ KIRIM NOTIFIKASI TELEGRAM (dalam try block)
            try {
                await fetch('/api/send-telegram', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        type: 'new_quote',     // ← WAJIB tambahin ini!
                        author: author,
                        quoteText: quote,
                    }),
                });
                console.log('Telegram notification sent');
            } catch (teleError) {
                console.error('Failed to send Telegram notification:', teleError);
                // Notifikasi gagal, tapi quote tetap tersimpan
            }

            // Save author to history
            saveAuthorToHistory(author);

            // Simpan ke history
            saveToHistory({
                text: quote,
                author: author,
                category: category,
                timestamp: new Date().toISOString()
            });

            // Reset form
            setQuote("");
            setAuthor("");
            setCategory("motivation");

            showPopupNotification("Quote berhasil ditambahkan! Menunggu persetujuan admin.");

        } catch (error) {
            console.error("Error adding quote: ", error);
            showPopupNotification("Terjadi kesalahan saat menambahkan quote", true);
        } finally {
            setIsLoading(false);
        }
    };

    // Load history item ke form
    const loadHistoryItem = (item) => {
        setQuote(item.text);
        setAuthor(item.author);
        setCategory(item.category);
        setIsHistoryDrawerOpen(false);
    };

    // Clear all history
    const clearHistory = () => {
        if (window.confirm("Hapus semua history quote?")) {
            setQuoteHistory([]);
            localStorage.removeItem("quoteHistory");
            showPopupNotification("History quote berhasil dihapus");
        }
    };

    // Clear author history
    const clearAuthorHistory = () => {
        if (window.confirm("Hapus semua riwayat author?")) {
            setAuthorHistory([]);
            localStorage.removeItem("authorHistory");
            showPopupNotification("Riwayat author berhasil dihapus");
        }
    };

    return (
        <div className="min-h-screen bg-[#f9fafb] pb-16">
            {/* <BottomNav /> */}

            {/* Header */}
            <div className="bg-gradient-to-r from-[#2a436c] to-[#355485] pt-10 pb-8 rounded-b-3xl shadow-md">
                <div className="max-w-lg mx-auto px-5">
                    <div className="text-center">
                       <Link to="/">
                            <h1 className="text-2xl font-bold text-white mb-1">Tambah Quotes</h1>
                       </Link>
                        <p className="text-[#cbdde9] text-xs">Bagikan kata-kata bijakmu</p>
                    </div>
                </div>
            </div>

            {/* Notification Popup */}
            {showNotification && (
                <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 animate-bounce">
                    <div className={`px-5 py-3 rounded-xl shadow-lg flex items-center gap-2 ${notificationType === "error"
                            ? "bg-red-500 text-white"
                            : "bg-green-500 text-white"
                        }`}>
                        <i className={`${notificationType === "error" ? "ri-error-warning-line" : "ri-checkbox-circle-line"} text-xl`}></i>
                        <span className="text-sm font-medium">{notificationMessage}</span>
                    </div>
                </div>
            )}

            {/* Form */}
            <div className="max-w-lg mx-auto px-5 -mt-5">
                <div className="bg-white rounded-2xl shadow-sm border border-[#e5e7eb] p-5">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Quote Textarea with History Icon */}
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <label className="block text-sm font-medium text-gray-700">
                                    <i className="ri-double-quotes-L text-[#355485] mr-1"></i>
                                    Isi Quote
                                </label>
                                <button
                                    type="button"
                                    onClick={() => setIsHistoryDrawerOpen(true)}
                                    className="text-[#355485] hover:text-[#2a436c] transition-colors"
                                    title="Lihat History"
                                >
                                    <i className="ri-history-line text-lg"></i>
                                </button>
                            </div>
                            <textarea
                                placeholder="Tulis quote-mu di sini..."
                                rows={4}
                                className="w-full px-4 py-3 rounded-xl border border-[#e5e7eb] bg-white text-gray-800 focus:outline-none focus:border-[#4f90c6] focus:ring-1 focus:ring-[#4f90c6] transition resize-none"
                                value={quote}
                                onChange={(e) => setQuote(e.target.value)}
                                required
                            />
                        </div>

                        {/* Author Input with History Chips */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <i className="ri-user-line text-[#355485] mr-1"></i>
                                Nama Author
                            </label>
                            <input
                                placeholder="Nama Instagram-mu (tanpa @)"
                                type="text"
                                className="w-full px-4 py-3 rounded-xl border border-[#e5e7eb] bg-white text-gray-800 focus:outline-none focus:border-[#4f90c6] focus:ring-1 focus:ring-[#4f90c6] transition"
                                value={author}
                                onChange={handleManualAuthor}
                                required
                            />

                            {/* Author History Chips */}
                            {authorHistory.length > 0 && (
                                <div className="mt-3">
                                    {/* <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs text-gray-500 flex items-center gap-1">
                                            <i className="ri-history-line"></i>
                                            Riwayat Author
                                        </span>
                                        <button
                                            type="button"
                                            onClick={clearAuthorHistory}
                                            className="text-xs text-red-500 hover:text-red-700"
                                        >
                                            Hapus semua
                                        </button>
                                    </div> */}
                                    <div className="flex flex-wrap gap-2">
                                        {authorHistory.map((auth, idx) => (
                                            <button
                                                key={idx}
                                                type="button"
                                                onClick={() => selectAuthorFromHistory(auth)}
                                                className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-[12px] rounded-full transition-all flex items-center gap-1"
                                            >
                                                <i className="ri-user-line text-xs"></i>
                                                {auth}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Category Select */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <i className="ri-price-tag-3-line text-[#355485] mr-1"></i>
                                Kategori
                            </label>
                            <select
                                className="w-full px-4 py-3 rounded-xl border border-[#e5e7eb] bg-white text-gray-800 focus:outline-none focus:border-[#4f90c6] focus:ring-1 focus:ring-[#4f90c6] transition cursor-pointer"
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                            >
                                <option value="motivation">🔥 Motivasi</option>
                                <option value="life">💭 Reminder</option>
                                <option value="love">❤️ Cinta</option>
                                <option value="funny">😂 Lucu</option>
                                <option value="other">📌 Lainnya</option>
                            </select>
                        </div>

                        {/* Info Box */}
                        <div className="bg-blue-50 rounded-xl p-3 border border-blue-100">
                            <div className="flex items-start gap-2">
                                <i className="ri-information-line text-blue-500 text-sm mt-0.5"></i>
                                <p className="text-xs text-blue-700">
                                    Quote akan masuk ke antrian persetujuan admin terlebih dahulu.
                                    Setelah disetujui, quote akan tampil di halaman QuotesKu.
                                </p>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-3 bg-gradient-to-r from-[#355485] to-[#4f90c6] text-white rounded-xl font-medium flex items-center justify-center disabled:opacity-70 hover:shadow-lg transition-all"
                        >
                            {isLoading ? (
                                <>
                                    <i className="ri-loader-4-line animate-spin mr-2"></i>
                                    Menambahkan...
                                </>
                            ) : (
                                <>
                                    <i className="ri-send-plane-line mr-2"></i>
                                    Kirim Quote
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>

            {/* History Drawer from Bottom */}
            {isHistoryDrawerOpen && (
                <>
                    {/* Overlay */}
                    <div
                        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
                        onClick={() => setIsHistoryDrawerOpen(false)}
                    />

                    {/* Drawer */}
                    <div className="fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-3xl shadow-2xl transform transition-transform animate-slide-up max-h-[70vh] flex flex-col">
                        {/* Drawer Header */}
                        <div className="flex justify-between items-center p-5 border-b border-[#e5e7eb]">
                            <div className="flex items-center gap-2">
                                <i className="ri-history-line text-xl text-[#355485]"></i>
                                <h3 className="text-lg font-semibold text-gray-800">History Quote</h3>
                            </div>
                            <button
                                onClick={() => setIsHistoryDrawerOpen(false)}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <i className="ri-close-line text-2xl"></i>
                            </button>
                        </div>

                        {/* Drawer Content */}
                        <div className="flex-1 overflow-y-auto p-4">
                            {quoteHistory.length > 0 ? (
                                <div className="space-y-3">
                                    {quoteHistory.map((item, index) => (
                                        <div
                                            key={index}
                                            className="p-4 bg-gray-50 rounded-xl border border-[#e5e7eb] cursor-pointer hover:bg-gray-100 transition-all"
                                            onClick={() => loadHistoryItem(item)}
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <span className="text-xs text-gray-400">
                                                    {new Date(item.timestamp).toLocaleString('id-ID')}
                                                </span>
                                                <span className="text-xs px-2 py-1 rounded-full bg-white text-gray-600">
                                                    {item.category === "motivation" ? "Motivasi" :
                                                        item.category === "life" ? "Reminder" :
                                                            item.category === "love" ? "Cinta" :
                                                                item.category === "funny" ? "Lucu" : "Lainnya"}
                                                </span>
                                            </div>
                                            <p className="text-gray-700 text-sm mb-2 line-clamp-2">
                                                "{item.text}"
                                            </p>
                                            <p className="text-gray-400 text-xs">
                                                — {item.author || "Anonymous"}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <i className="ri-inbox-line text-5xl text-gray-300 mb-3"></i>
                                    <p className="text-gray-400 text-sm">Belum ada history quote</p>
                                </div>
                            )}
                        </div>

                        {/* Drawer Footer */}
                        {quoteHistory.length > 0 && (
                            <div className="p-4 border-t border-[#e5e7eb]">
                                <button
                                    onClick={clearHistory}
                                    className="w-full py-2.5 bg-red-50 text-red-600 rounded-xl text-sm font-medium hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
                                >
                                    <i className="ri-delete-bin-line"></i>
                                    Hapus Semua History
                                </button>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default AddQuotes;