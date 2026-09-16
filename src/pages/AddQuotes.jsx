import { useState, useEffect } from "react";
import {
    X,
    History,
    Quote,
    Info,
    Send,
    LoaderCircle,
    CheckCircle2,
    AlertCircle,
    Trash2,
    Inbox,
    Clock3,
} from "lucide-react";
import { myQuotesCollection } from "../firebase";
import { addDoc, serverTimestamp } from "firebase/firestore";
import { Link } from "react-router-dom";

const DEFAULT_AUTHOR = "storythur";
const DEFAULT_CATEGORY = "";

const AddQuotes = () => {
    const [quote, setQuote] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const [showNotification, setShowNotification] = useState(false);
    const [notificationMessage, setNotificationMessage] = useState("");
    const [notificationType, setNotificationType] = useState("success");

    const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState(false);
    const [quoteHistory, setQuoteHistory] = useState([]);

    // Load quote history from localStorage
    useEffect(() => {
        const savedHistory = localStorage.getItem("quoteHistory");

        if (savedHistory) {
            try {
                setQuoteHistory(JSON.parse(savedHistory));
            } catch (error) {
                console.error("Failed to load quote history:", error);
            }
        }
    }, []);

    // Save quote to history
    const saveToHistory = (newQuote) => {
        const updatedHistory = [newQuote, ...quoteHistory].slice(0, 10);

        setQuoteHistory(updatedHistory);
        localStorage.setItem(
            "quoteHistory",
            JSON.stringify(updatedHistory)
        );
    };

    // Show notification
    const showPopupNotification = (message, isError = false) => {
        setNotificationMessage(message);
        setNotificationType(isError ? "error" : "success");
        setShowNotification(true);

        setTimeout(() => {
            setShowNotification(false);
        }, 2500);
    };

    // Handle submit
    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!quote.trim()) {
            showPopupNotification(
                "Isi quote terlebih dahulu",
                true
            );
            return;
        }

        setIsLoading(true);

        try {
            const newQuote = {
                text: quote.trim(),
                author: DEFAULT_AUTHOR,
                category: DEFAULT_CATEGORY,
                status: "pending",
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                likes: 0,
                views: 0,
            };

            await addDoc(myQuotesCollection, newQuote);

            // Send Telegram notification
            try {
                await fetch("/api/send-telegram", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        type: "new_quote",
                        author: DEFAULT_AUTHOR,
                        quoteText: quote.trim(),
                    }),
                });

                console.log("Telegram notification sent");
            } catch (telegramError) {
                console.error(
                    "Failed to send Telegram notification:",
                    telegramError
                );
            }

            // Save quote history
            saveToHistory({
                text: quote.trim(),
                author: DEFAULT_AUTHOR,
                category: DEFAULT_CATEGORY,
                timestamp: new Date().toISOString(),
            });

            // Reset form
            setQuote("");

            showPopupNotification(
                "Quote berhasil ditambahkan! Menunggu persetujuan admin."
            );
        } catch (error) {
            console.error("Error adding quote:", error);

            showPopupNotification(
                "Terjadi kesalahan saat menambahkan quote",
                true
            );
        } finally {
            setIsLoading(false);
        }
    };

    // Load history item into form
    const loadHistoryItem = (item) => {
        setQuote(item.text || "");
        setIsHistoryDrawerOpen(false);
    };

    // Clear all quote history
    const clearHistory = () => {
        if (window.confirm("Hapus semua history quote?")) {
            setQuoteHistory([]);
            localStorage.removeItem("quoteHistory");
            showPopupNotification("History quote berhasil dihapus");
        }
    };

    return (
        <div className="min-h-screen bg-[#f7f8fa] pb-10">
            {/* Header */}
            <header className="border-b border-gray-100 bg-white">
                <div className="mx-auto max-w-2xl px-5 pb-7 pt-8 sm:px-6 sm:pb-8 sm:pt-10">
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <Link
                                to="/"
                                className="group inline-flex items-center gap-2"
                            >
                                <span className="flex h-8 w-8 items-center justify-center bg-[#355485] text-white">
                                    <Quote
                                        size={16}
                                        strokeWidth={1.8}
                                    />
                                </span>

                                <span className="text-sm font-semibold tracking-tight text-gray-900">
                                    QuotesKu
                                </span>
                            </Link>

                            <div className="mt-7">
                                <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#4f90c6]">
                                    Contribution
                                </p>

                                <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                                    Tambah Quotes
                                </h1>

                                <p className="mt-2 max-w-sm text-sm leading-relaxed text-gray-500">
                                    Bagikan kata-kata bijak, pengalaman, atau
                                    pengingat yang bermakna.
                                </p>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={() => setIsHistoryDrawerOpen(true)}
                            className="flex h-10 w-10 shrink-0 items-center justify-center border border-gray-200 bg-white text-gray-500 transition hover:border-[#4f90c6] hover:text-[#355485] active:scale-95"
                            title="Lihat history"
                            aria-label="Lihat history"
                        >
                            <History
                                size={19}
                                strokeWidth={1.8}
                            />
                        </button>
                    </div>
                </div>
            </header>

            {/* Notification */}
            {showNotification && (
                <div className="fixed left-1/2 top-5 z-[70] w-[calc(100%-2rem)] max-w-sm -translate-x-1/2">
                    <div
                        className={`flex items-start gap-3 border px-4 py-3.5 shadow-xl ${notificationType === "error"
                                ? "border-red-100 bg-white text-red-700"
                                : "border-green-100 bg-white text-green-700"
                            }`}
                    >
                        <div
                            className={`mt-0.5 shrink-0 ${notificationType === "error"
                                    ? "text-red-500"
                                    : "text-green-500"
                                }`}
                        >
                            {notificationType === "error" ? (
                                <AlertCircle
                                    size={18}
                                    strokeWidth={1.9}
                                />
                            ) : (
                                <CheckCircle2
                                    size={18}
                                    strokeWidth={1.9}
                                />
                            )}
                        </div>

                        <p className="text-xs font-medium leading-relaxed">
                            {notificationMessage}
                        </p>
                    </div>
                </div>
            )}

            {/* Main Form */}
            <main className="mx-auto max-w-2xl px-5 pt-6 sm:px-6 sm:pt-8">
                <div className="border border-gray-200 bg-white shadow-sm">
                    <form
                        onSubmit={handleSubmit}
                        className="space-y-6 p-5 sm:p-7"
                    >
                        {/* Quote */}
                        <div>
                            <div className="mb-2.5 flex items-center justify-between gap-3">
                                <label
                                    htmlFor="quote"
                                    className="flex items-center gap-2 text-sm font-semibold text-gray-800"
                                >
                                    <Quote
                                        size={16}
                                        strokeWidth={1.8}
                                        className="text-[#355485]"
                                    />
                                    Isi Quote
                                </label>

                                <span className="text-[10px] font-medium uppercase tracking-wider text-gray-400">
                                    {quote.length} karakter
                                </span>
                            </div>

                            <textarea
                                id="quote"
                                name="quote"
                                placeholder="Tulis quote-mu di sini..."
                                rows={7}
                                value={quote}
                                onChange={(event) =>
                                    setQuote(event.target.value)
                                }
                                required
                                className="w-full resize-none border border-gray-200 bg-white px-4 py-3.5 text-sm leading-relaxed text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-[#4f90c6] focus:ring-2 focus:ring-[#4f90c6]/10"
                            />
                        </div>

                        {/* Default Author Information */}
                        {/* <div className="flex items-center justify-between border border-gray-200 bg-[#fafbfc] px-4 py-3">
                            <div>
                                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-400">
                                    Author
                                </p>

                                <p className="mt-1 text-sm font-semibold text-gray-700">
                                    @{DEFAULT_AUTHOR}
                                </p>
                            </div>

                            <p className="text-[10px] text-gray-400">
                                Otomatis
                            </p>
                        </div> */}

                        {/* Information Box */}
                        <div className="flex items-start gap-3 border border-[#dceaf4] bg-[#f3f8fc] px-4 py-3.5">
                            <Info
                                size={17}
                                strokeWidth={1.8}
                                className="mt-0.5 shrink-0 text-[#4f90c6]"
                            />

                            <div>
                                <p className="text-xs font-semibold text-[#355485]">
                                    Proses moderasi
                                </p>

                                <p className="mt-1 text-xs leading-relaxed text-[#58738a]">
                                    Quote yang kamu kirim akan masuk ke antrian
                                    persetujuan admin terlebih dahulu. Setelah
                                    disetujui, quote akan tampil di halaman
                                    QuotesKu.
                                </p>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="flex w-full items-center justify-center gap-2 bg-[#355485] px-5 py-3.5 text-sm font-semibold text-white shadow-sm shadow-[#355485]/15 transition hover:bg-[#2a436c] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {isLoading ? (
                                <>
                                    <LoaderCircle
                                        size={17}
                                        strokeWidth={1.9}
                                        className="animate-spin"
                                    />
                                    Menambahkan...
                                </>
                            ) : (
                                <>
                                    <Send
                                        size={17}
                                        strokeWidth={1.9}
                                    />
                                    Kirim Quote
                                </>
                            )}
                        </button>
                    </form>
                </div>

                {/* <p className="mt-5 text-center text-[11px] leading-relaxed text-gray-400">
                    Quote akan dikirim menggunakan author default{" "}
                    <span className="font-medium text-gray-500">
                        @{DEFAULT_AUTHOR}
                    </span>
                    .
                </p> */}
            </main>

            {/* History Drawer */}
            {isHistoryDrawerOpen && (
                <>
                    {/* Overlay */}
                    <div
                        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-[2px]"
                        onClick={() => setIsHistoryDrawerOpen(false)}
                    />

                    {/* Drawer */}
                    <div className="fixed inset-x-0 bottom-0 z-50 flex max-h-[78vh] flex-col overflow-hidden border-t border-gray-200 bg-white shadow-2xl sm:inset-x-auto sm:left-1/2 sm:w-full sm:max-w-2xl sm:-translate-x-1/2 sm:rounded-t-2xl">
                        {/* Drag Handle */}
                        <div className="flex justify-center pb-1 pt-3 sm:hidden">
                            <div className="h-1 w-9 rounded-full bg-gray-300" />
                        </div>

                        {/* Drawer Header */}
                        <div className="flex items-center justify-between gap-4 border-b border-gray-100 px-5 py-4">
                            <div>
                                <div className="flex items-center gap-2">
                                    <History
                                        size={18}
                                        strokeWidth={1.8}
                                        className="text-[#355485]"
                                    />

                                    <h2 className="text-base font-semibold text-gray-900">
                                        History Quote
                                    </h2>
                                </div>

                                <p className="mt-1 pl-6 text-xs text-gray-400">
                                    Pilih quote untuk mengisi form kembali
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() =>
                                    setIsHistoryDrawerOpen(false)
                                }
                                className="flex h-8 w-8 items-center justify-center border border-gray-200 text-gray-500 transition hover:border-gray-300 hover:bg-gray-50 hover:text-gray-900 active:scale-95"
                                aria-label="Tutup history"
                            >
                                <X
                                    size={17}
                                    strokeWidth={1.8}
                                />
                            </button>
                        </div>

                        {/* Drawer Content */}
                        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
                            {quoteHistory.length > 0 ? (
                                <div className="space-y-2.5">
                                    {quoteHistory.map((item, index) => (
                                        <button
                                            key={`${item.timestamp}-${index}`}
                                            type="button"
                                            onClick={() =>
                                                loadHistoryItem(item)
                                            }
                                            className="group w-full border border-gray-200 bg-white p-4 text-left transition hover:border-[#b8d2e5] hover:bg-[#f8fbfd]"
                                        >
                                            <div className="mb-3 flex items-start justify-between gap-3">
                                                <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
                                                    <Clock3
                                                        size={12}
                                                        strokeWidth={1.8}
                                                    />

                                                    {new Date(
                                                        item.timestamp
                                                    ).toLocaleString(
                                                        "id-ID"
                                                    )}
                                                </div>
                                            </div>

                                            <p className="line-clamp-3 text-sm leading-relaxed text-gray-700">
                                                “{item.text}”
                                            </p>

                                            {/* <p className="mt-3 text-xs text-gray-400">
                                                — @{DEFAULT_AUTHOR}
                                            </p> */}
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
                                    <div className="mb-4 flex h-12 w-12 items-center justify-center border border-gray-200 bg-gray-50 text-gray-300">
                                        <Inbox
                                            size={24}
                                            strokeWidth={1.6}
                                        />
                                    </div>

                                    <p className="text-sm font-semibold text-gray-600">
                                        Belum ada history quote
                                    </p>

                                    <p className="mt-1 text-xs text-gray-400">
                                        Quote yang pernah kamu kirim akan
                                        muncul di sini.
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Drawer Footer */}
                        {quoteHistory.length > 0 && (
                            <div className="border-t border-gray-100 p-4">
                                <button
                                    type="button"
                                    onClick={clearHistory}
                                    className="flex w-full items-center justify-center gap-2 border border-red-100 bg-red-50 px-4 py-3 text-xs font-semibold text-red-600 transition hover:bg-red-100 active:scale-[0.99]"
                                >
                                    <Trash2
                                        size={15}
                                        strokeWidth={1.8}
                                    />
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