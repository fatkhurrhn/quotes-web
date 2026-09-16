import { useState, useEffect } from "react";
import { myQuotesCollection } from "../firebase";
import { getDocs, query, orderBy, doc, updateDoc, increment, where } from "firebase/firestore";
import BottomAdd from "../components/BottomAdd";

/* ---------- Helpers ---------- */
const highlightText = (text, highlight) => {
  if (!highlight.trim()) return text;
  const regex = new RegExp(`(${highlight})`, "gi");
  return text.split(regex).map((part, i) =>
    part.toLowerCase() === highlight.toLowerCase() ? (
      <mark key={i} className="bg-yellow-200 px-1 rounded">{part}</mark>
    ) : (
      part
    )
  );
};

// Fungsi untuk menghitung waktu relatif
const getRelativeTime = (timestamp) => {
  if (!timestamp) return "";

  let date;
  if (timestamp?.toDate) {
    date = timestamp.toDate();
  } else if (timestamp?.seconds) {
    date = new Date(timestamp.seconds * 1000);
  } else {
    date = new Date(timestamp);
  }

  const now = new Date();
  const diffMs = now - date;
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);

  if (diffYears > 0) return `${diffYears} tahun lalu`;
  if (diffMonths > 0) return `${diffMonths} bulan lalu`;
  if (diffWeeks > 0) return `${diffWeeks} minggu lalu`;
  if (diffDays > 0) return `${diffDays} hari lalu`;
  if (diffHours > 0) return `${diffHours} jam lalu`;
  if (diffMins > 0) return `${diffMins} menit lalu`;
  if (diffSecs > 10) return `${diffSecs} detik lalu`;
  return "baru saja";
};

// Fungsi untuk wrap text di canvas
function wrapText(ctx, text, maxWidth) {
  const words = text.split(" ");
  let line = "";
  const lines = [];
  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + " ";
    const metrics = ctx.measureText(testLine);
    const testWidth = metrics.width;
    if (testWidth > maxWidth && n > 0) {
      lines.push(line.trim());
      line = words[n] + " ";
    } else {
      line = testLine;
    }
  }
  lines.push(line.trim());
  return lines;
}

// Fungsi generate gambar quote untuk FEED (1080x1080)
const generateFeedImage = async (quote) => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    canvas.width = 1080;
    canvas.height = 1080;

    let bgImage = new Image();
    bgImage.crossOrigin = "Anonymous";
    bgImage.src = "/img/bg-storythur.png";

    bgImage.onload = () => {
      ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);

      ctx.fillStyle = "#000000";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = "52px Arial";

      const maxWidth = 900;
      const wrapped = wrapText(ctx, quote, maxWidth);
      const lineHeight = 70;

      const totalTextHeight = wrapped.length * lineHeight;
      const startY = (canvas.height - totalTextHeight) / 2 + (lineHeight / 2);

      wrapped.forEach((line, i) => {
        ctx.fillText(line, canvas.width / 2, startY + i * lineHeight);
      });

      resolve(canvas.toDataURL("image/png"));
    };

    bgImage.onerror = () => {
      // Fallback jika gambar tidak bisa dimuat
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = "#000000";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = "52px Arial";

      const maxWidth = 900;
      const wrapped = wrapText(ctx, quote, maxWidth);
      const lineHeight = 70;
      const totalTextHeight = wrapped.length * lineHeight;
      const startY = (canvas.height - totalTextHeight) / 2 + (lineHeight / 2);

      wrapped.forEach((line, i) => {
        ctx.fillText(line, canvas.width / 2, startY + i * lineHeight);
      });

      resolve(canvas.toDataURL("image/png"));
    };
  });
};

// Fungsi generate gambar quote untuk REELS (1080x1920)
const generateReelsImage = async (quote) => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    canvas.width = 1080;
    canvas.height = 1920;

    let bgImage = new Image();
    bgImage.crossOrigin = "Anonymous";
    bgImage.src = "/img/bg-reels.png";

    bgImage.onload = () => {
      ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);

      ctx.fillStyle = "#000000";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = "52px Arial";

      const maxWidth = 650;
      const wrapped = wrapText(ctx, quote, maxWidth);
      const lineHeight = 65;

      const totalTextHeight = wrapped.length * lineHeight;
      const startY = (canvas.height - totalTextHeight) / 2 + (lineHeight / 2);

      wrapped.forEach((line, i) => {
        ctx.fillText(line, canvas.width / 2, startY + i * lineHeight);
      });

      resolve(canvas.toDataURL("image/png"));
    };

    bgImage.onerror = () => {
      // Fallback jika gambar tidak bisa dimuat
      ctx.fillStyle = "#1a1a2e";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = "64px Arial";

      const maxWidth = 900;
      const wrapped = wrapText(ctx, quote, maxWidth);
      const lineHeight = 80;
      const totalTextHeight = wrapped.length * lineHeight;
      const startY = (canvas.height - totalTextHeight) / 2 + (lineHeight / 2);

      wrapped.forEach((line, i) => {
        ctx.fillText(line, canvas.width / 2, startY + i * lineHeight);
      });

      resolve(canvas.toDataURL("image/png"));
    };
  });
};

/* ---------- Main Component ---------- */
export default function QuotesKu() {
  const [allQuotes, setAllQuotes] = useState([]);
  const [displayQuotes, setDisplayQuotes] = useState([]);
  const [filteredQuotes, setFilteredQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sharingTextId, setSharingTextId] = useState(null);
  const [sharingFeedId, setSharingFeedId] = useState(null);
  const [sharingReelsId, setSharingReelsId] = useState(null);
  const [quoteStates, setQuoteStates] = useState({});
  const [sortType, setSortType] = useState("newest");
  const [togglingMark, setTogglingMark] = useState({});

  // Like handler
  const handleLike = async (id, currentLikes, currentLikeStatus) => {
    setQuoteStates((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        isLiking: true,
        isLiked: !currentLikeStatus,
        likesCount: currentLikeStatus ? currentLikes - 1 : currentLikes + 1
      }
    }));

    try {
      const ref = doc(myQuotesCollection, id);
      await updateDoc(ref, { likes: increment(currentLikeStatus ? -1 : 1) });
    } catch (err) {
      console.error("Error like:", err);
      setQuoteStates((prev) => ({
        ...prev,
        [id]: {
          ...prev[id],
          isLiked: currentLikeStatus,
          likesCount: currentLikes
        }
      }));
    } finally {
      setQuoteStates((prev) => ({
        ...prev,
        [id]: { ...prev[id], isLiking: false }
      }));
    }
  };

  // Toggle mark status - LANGSUNG KE FIREBASE
  const handleToggleMark = async (quoteId, currentStatus) => {
    setTogglingMark(prev => ({ ...prev, [quoteId]: true }));

    try {
      const newStatus = currentStatus === 'marked' ? 'approved' : 'marked';
      const ref = doc(myQuotesCollection, quoteId);
      await updateDoc(ref, {
        status: newStatus,
        updatedAt: new Date()
      });

      // Update state lokal
      setAllQuotes(prev =>
        prev.map(q => q.id === quoteId ? { ...q, status: newStatus } : q)
      );
      setFilteredQuotes(prev =>
        prev.map(q => q.id === quoteId ? { ...q, status: newStatus } : q)
      );
      setDisplayQuotes(prev =>
        prev.map(q => q.id === quoteId ? { ...q, status: newStatus } : q)
      );
    } catch (err) {
      console.error("Error toggling mark:", err);
      alert("Gagal mengubah status tandai");
    } finally {
      setTogglingMark(prev => ({ ...prev, [quoteId]: false }));
    }
  };

  // Share text handler - Format tanpa tanda kutip
  const handleShareText = async (q) => {
    setSharingTextId(q.id);
    try {
      const shareText = `${q.text}`;

      if (navigator.share) {
        await navigator.share({
          title: "Quote",
          text: shareText,
        });
      } else {
        await navigator.clipboard.writeText(shareText);
        alert("Share tidak support di browser ini, teks sudah disalin ke clipboard!");
      }
    } catch (err) {
      if (err.name !== "AbortError") {
        console.error("Error sharing:", err);
        alert("Gagal membagikan quote, silakan coba lagi");
      }
    } finally {
      setSharingTextId(null);
    }
  };

  // Share Feed image handler (1080x1080)
  const handleShareFeed = async (q) => {
    setSharingFeedId(q.id);
    try {
      const dataUrl = await generateFeedImage(q.text);
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], "quote-feed.png", { type: "image/png" });

      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: "Quote Feed",
          text: q.text,
        });
      } else {
        const link = document.createElement("a");
        link.href = dataUrl;
        link.download = "quote-feed.png";
        link.click();
      }
    } catch (err) {
      if (err.name !== "AbortError") {
        console.error("Error sharing feed:", err);
        alert("Gagal membuat gambar feed, silakan coba lagi");
      }
    } finally {
      setSharingFeedId(null);
    }
  };

  // Share Reels image handler (1080x1920)
  const handleShareReels = async (q) => {
    setSharingReelsId(q.id);
    try {
      const dataUrl = await generateReelsImage(q.text);
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], "quote-reels.png", { type: "image/png" });

      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: "Quote Reels",
          text: q.text,
        });
      } else {
        const link = document.createElement("a");
        link.href = dataUrl;
        link.download = "quote-reels.png";
        link.click();
      }
    } catch (err) {
      if (err.name !== "AbortError") {
        console.error("Error sharing reels:", err);
        alert("Gagal membuat gambar reels, silakan coba lagi");
      }
    } finally {
      setSharingReelsId(null);
    }
  };

  // Apply filters and sorting
  const applyFiltersAndSort = (quotes, search, sort) => {
    let result = [...quotes];

    if (search.trim()) {
      const keyword = search.toLowerCase();
      result = result.filter(
        (q) =>
          q.text.toLowerCase().includes(keyword) ||
          q.author?.toLowerCase().includes(keyword)
      );
    }

    switch (sort) {
      case "newest":
        result.sort((a, b) => {
          const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
          const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
          return dateB - dateA;
        });
        break;
      case "oldest":
        result.sort((a, b) => {
          const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
          const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
          return dateA - dateB;
        });
        break;
      case "random":
        result.sort(() => Math.random() - 0.5);
        break;
      default:
        break;
    }

    return result;
  };

  useEffect(() => {
    if (allQuotes.length > 0) {
      const filtered = applyFiltersAndSort(allQuotes, searchTerm, sortType);
      setFilteredQuotes(filtered);
      setDisplayQuotes(filtered);
    }
  }, [searchTerm, sortType, allQuotes]);

  const onSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
  };

  const clearSearch = () => {
    setSearchTerm("");
  };

  // fetch quotes
  useEffect(() => {
    const fetchQuotes = async () => {
      try {
        const q = query(
          myQuotesCollection,
          where("status", "in", ["approved", "marked"]),
          orderBy("createdAt", "desc")
        );
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          likes: doc.data().likes || 0
        }));

        // Hanya ambil quotes dengan author storythur
        const storythurQuotes = data.filter(
          (quote) => quote.author?.toLowerCase() === "storythur"
        );

        setAllQuotes(storythurQuotes);

        const initialStates = {};
        storythurQuotes.forEach(quote => {
          initialStates[quote.id] = {
            isLiked: false,
            isLiking: false,
            likesCount: quote.likes || 0
          };
        });
        setQuoteStates(initialStates);

        const initialDisplay = applyFiltersAndSort(storythurQuotes, "", "newest");
        setDisplayQuotes(initialDisplay);
        setFilteredQuotes(initialDisplay);
      } catch (err) {
        console.error("Error fetch quotes:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchQuotes();
  }, []);

  const getDisplayMessage = () => {
    if (loading) return "Memuat quotes...";
    if (filteredQuotes.length === 0) {
      if (searchTerm) {
        return `Tidak ada quote yang mengandung kata "${searchTerm}"`;
      }
      return "Tidak ada quote yang ditemukan";
    }
    if (searchTerm) {
      return `Menampilkan ${filteredQuotes.length} hasil untuk "${searchTerm}"`;
    }
    return `${filteredQuotes.length} quotes dari storythur`;
  };

  return (
    <div className="min-h-screen bg-[#f9fafb] pb-16">
<BottomAdd />
      {/* Search Bar & Filter Dropdown */}
      <div className="max-w-lg mx-auto px-5 pt-4">
        <div className="flex gap-2 items-center">
          <div className="relative flex-1">
            <i className="ri-search-line absolute left-4 top-1/2 transform -translate-y-1/2 text-[#9ca3af] text-lg"></i>
            <input
              type="text"
              placeholder="Cari quotes..."
              className="w-full p-3 pl-11 rounded-xl border border-[#e5e7eb] bg-white focus:outline-none focus:border-[#4f90c6] focus:ring-1 focus:ring-[#4f90c6] text-sm shadow-sm"
              value={searchTerm}
              onChange={onSearchChange}
            />
            {searchTerm && (
              <button
                onClick={clearSearch}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#9ca3af] hover:text-gray-600"
              >
                <i className="ri-close-line text-lg"></i>
              </button>
            )}
          </div>

          <div className="relative">
            <select
              value={sortType}
              onChange={(e) => setSortType(e.target.value)}
              className="appearance-none bg-white border border-[#e5e7eb] rounded-xl px-3 py-2.5 pr-8 text-xs font-medium text-gray-700 focus:outline-none focus:border-[#4f90c6] focus:ring-1 focus:ring-[#4f90c6] shadow-sm cursor-pointer"
            >
              <option value="newest">Terbaru</option>
              <option value="oldest">Terlama</option>
              <option value="random">Acak</option>
            </select>
            <i className="ri-arrow-down-s-line absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none text-sm"></i>
          </div>
        </div>
      </div>

      {/* Info Count */}
      <div className="max-w-lg mx-auto px-5 mt-3 mb-3">
        <p className="text-xs text-[#6b7280]">{getDisplayMessage()}</p>
      </div>

      {/* Content */}
      <div className="max-w-lg mx-auto px-5 pb-8">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((item) => (
              <div key={item} className="bg-white rounded-xl p-4 shadow-sm border border-[#e5e7eb] animate-pulse">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                    <div className="h-4 bg-gray-200 rounded w-24"></div>
                  </div>
                  <div className="h-5 w-5 bg-gray-200 rounded"></div>
                </div>
                <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-11/12 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-10/12"></div>
                <div className="flex gap-4 mt-3">
                  <div className="h-5 w-12 bg-gray-200 rounded"></div>
                  <div className="h-5 w-12 bg-gray-200 rounded"></div>
                  <div className="h-5 w-12 bg-gray-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredQuotes.length > 0 ? (
              filteredQuotes.map((q) => {
                const state = quoteStates[q.id] || { isLiked: false, isLiking: false, likesCount: 0 };
                const isMarked = q.status === "marked";
                const isToggling = togglingMark[q.id] || false;

                return (
                  <div
                    key={q.id}
                    className={`bg-white rounded-xl p-4 shadow-sm border transition-all ${isMarked
                      ? "border-green-300 bg-green-50/30"
                      : "border-[#e5e7eb] hover:shadow-md"
                      }`}
                  >
                    {/* Header Card */}
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-tr from-[#355485] to-[#4f90c6] rounded-full flex items-center justify-center">
                          <i className="ri-user-fill text-white text-sm"></i>
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-gray-800">
                            {q.author}
                          </h3>
                          <p className="text-xs text-[#9ca3af]">
                            {getRelativeTime(q.createdAt)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Quote Text - Tanpa tanda kutip */}
                    <p className="text-gray-700 text-sm leading-relaxed mb-3">
                      {highlightText(q.text, searchTerm)}
                    </p>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-between pt-2 border-t border-[#e5e7eb]">
                      <div className="flex items-center gap-3">
                        {/* Like Button */}
                        <button
                          onClick={() => handleLike(q.id, state.likesCount, state.isLiked)}
                          disabled={state.isLiking}
                          className="flex items-center gap-1 group transition-all"
                        >
                          <i
                            className={`ri-heart-${state.isLiked ? "fill" : "line"} text-lg ${state.isLiked ? "text-red-500" : "text-gray-500 group-hover:text-red-500"
                              } transition-all`}
                          ></i>
                          <span className="text-xs text-gray-600">{state.likesCount}</span>
                        </button>

                        {/* Share Text Button */}
                        <button
                          onClick={() => handleShareText(q)}
                          disabled={sharingTextId === q.id}
                          className="flex items-center gap-1 group"
                          title="Bagikan teks"
                        >
                          {sharingTextId === q.id ? (
                            <i className="ri-loader-4-line animate-spin text-lg text-gray-500"></i>
                          ) : (
                            <i className="ri-share-forward-line text-lg text-gray-500 group-hover:text-[#355485] transition-all"></i>
                          )}
                        </button>

                        {/* Share Feed Button - 1080x1080 */}
                        <button
                          onClick={() => handleShareFeed(q)}
                          disabled={sharingFeedId === q.id}
                          className="flex items-center gap-1 group"
                          title="Posting sebagai feed (1080x1080)"
                        >
                          {sharingFeedId === q.id ? (
                            <i className="ri-loader-4-line animate-spin text-lg text-gray-500"></i>
                          ) : (
                            <i className="ri-image-line text-lg text-gray-500 group-hover:text-[#355485] transition-all"></i>
                          )}
                        </button>

                        {/* Share Reels Button - 1080x1920 */}
                        <button
                          onClick={() => handleShareReels(q)}
                          disabled={sharingReelsId === q.id}
                          className="flex items-center gap-1 group"
                          title="Posting sebagai reels (1080x1920)"
                        >
                          {sharingReelsId === q.id ? (
                            <i className="ri-loader-4-line animate-spin text-lg text-gray-500"></i>
                          ) : (
                            <i className="ri-film-line text-lg text-gray-500 group-hover:text-[#355485] transition-all"></i>
                          )}
                        </button>
                      </div>

                      {/* Status Badge */}
                      <div className="text-xs px-2 py-0.5">
                        <button
                          onClick={() => handleToggleMark(q.id, q.status)}
                          disabled={isToggling}
                          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition ${isMarked
                            ? "bg-green-100 text-green-700 hover:bg-green-200"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                            }`}
                          title={isMarked ? "Batalkan tandai" : "Tandai sudah dibaca"}
                        >
                          {isToggling ? (
                            <i className="ri-loader-4-line animate-spin text-xs"></i>
                          ) : (
                            <i className={`${isMarked ? "ri-check-double-fill" : "ri-check-line"} text-sm`}></i>
                          )}
                          <span>{isMarked ? "Selesai" : "Tandai"}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-12 bg-white rounded-xl border border-[#e5e7eb]">
                <i className="ri-inbox-line text-5xl text-[#cbdde9] mb-3"></i>
                <p className="text-[#6b7280] text-sm">
                  {searchTerm
                    ? `Tidak ada quote yang mengandung kata "${searchTerm}"`
                    : "Tidak ada quote yang ditemukan"}
                </p>
                {searchTerm && (
                  <button
                    onClick={clearSearch}
                    className="mt-3 text-[#4f90c6] text-xs"
                  >
                    Hapus pencarian
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}