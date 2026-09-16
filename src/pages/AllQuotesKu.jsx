import { useState, useEffect, useRef } from "react";
import {
  myQuotesCollection,
  usedBackgroundsCollection,
} from "../firebase";
import {
  getDocs,
  query,
  orderBy,
  doc,
  updateDoc,
  increment,
  where,
  addDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import BottomAdd from "../components/BottomAdd";
import PreviewModal from "../components/PreviewModal";

/* ---------- Konfigurasi Background ---------- */
const BG_START = 21;
const BG_END = 60;
const BG_FOLDER = "/background";
const BG_EXT = ".png";

const ALL_BACKGROUNDS = Array.from(
  { length: BG_END - BG_START + 1 },
  (_, i) => `${BG_FOLDER}/${BG_START + i}${BG_EXT}`
);

/* ---------- Helpers ---------- */
const highlightText = (text, highlight) => {
  if (!highlight.trim()) return text;
  const regex = new RegExp(`(${highlight})`, "gi");
  return text.split(regex).map((part, i) =>
    part.toLowerCase() === highlight.toLowerCase() ? (
      <mark key={i} className="bg-yellow-200 px-1 rounded">
        {part}
      </mark>
    ) : (
      part
    )
  );
};

const getRelativeTime = (timestamp) => {
  if (!timestamp) return "";
  let date;
  if (timestamp?.toDate) date = timestamp.toDate();
  else if (timestamp?.seconds) date = new Date(timestamp.seconds * 1000);
  else date = new Date(timestamp);

  const now = new Date();
  const diffMs = now - date;
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);

  if (diffYears > 0) return `${diffYears} thn lalu`;
  if (diffMonths > 0) return `${diffMonths} bln lalu`;
  if (diffWeeks > 0) return `${diffWeeks} mgg lalu`;
  if (diffDays > 0) return `${diffDays} hr lalu`;
  if (diffHours > 0) return `${diffHours} jam lalu`;
  if (diffMins > 0) return `${diffMins} mnt lalu`;
  if (diffSecs > 10) return `${diffSecs} dtk lalu`;
  return "baru saja";
};

function wrapText(ctx, text, maxWidth) {
  const words = text.split(" ");
  let line = "";
  const lines = [];
  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + " ";
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && n > 0) {
      lines.push(line.trim());
      line = words[n] + " ";
    } else {
      line = testLine;
    }
  }
  lines.push(line.trim());
  return lines;
}

/* ---------- Background Firestore ---------- */
async function getUsedBackgrounds() {
  try {
    const snap = await getDocs(usedBackgroundsCollection);
    return snap.docs.map((d) => d.data().path);
  } catch (err) {
    console.error("Error get used backgrounds:", err);
    return [];
  }
}

async function markBackgroundAsUsed(path, quoteId) {
  try {
    await addDoc(usedBackgroundsCollection, {
      path,
      quoteId,
      usedAt: serverTimestamp(),
    });
  } catch (err) {
    console.error("Error mark bg used:", err);
  }
}

async function releaseBackground(path) {
  try {
    const snap = await getDocs(usedBackgroundsCollection);
    const found = snap.docs.find((d) => d.data().path === path);
    if (found) await deleteDoc(found.ref);
  } catch (err) {
    console.error("Error release bg:", err);
  }
}

async function getRandomUnusedBackground() {
  const used = await getUsedBackgrounds();
  let available = ALL_BACKGROUNDS.filter((bg) => !used.includes(bg));
  if (available.length === 0) {
    console.warn("Semua bg terpakai. Reset otomatis.");
    available = [...ALL_BACKGROUNDS];
  }
  const randomIndex = Math.floor(Math.random() * available.length);
  return available[randomIndex];
}

/* ---------- Generate Feed (1080x1080) ---------- */
const generateFeedImage = async (quote, bgPath = "/img/bg-storythur.png") => {
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    canvas.width = 1080;
    canvas.height = 1080;

    const bgImage = new Image();
    bgImage.crossOrigin = "Anonymous";
    bgImage.src = bgPath;

    const drawContent = () => {
      ctx.fillStyle = "#000000";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = "52px Arial";

      const wrapped = wrapText(ctx, quote, 900);
      const lineHeight = 70;
      const totalTextHeight = wrapped.length * lineHeight;
      const startY = (canvas.height - totalTextHeight) / 2 + lineHeight / 2;

      wrapped.forEach((line, i) => {
        ctx.fillText(line, canvas.width / 2, startY + i * lineHeight);
      });

      resolve(canvas.toDataURL("image/png"));
    };

    bgImage.onload = () => {
      ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);
      drawContent();
    };
    bgImage.onerror = () => {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      drawContent();
    };
  });
};

/* ---------- Generate Reels (1080x1920) — teks putih + outline hitam ---------- */
const generateReelsImage = async (quote, bgPath) => {
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    canvas.width = 1080;
    canvas.height = 1920;

    const bgImage = new Image();
    bgImage.crossOrigin = "Anonymous";
    bgImage.src = bgPath;

    const drawContent = () => {
      ctx.font = "52px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#ffffff";
      ctx.strokeStyle = "#000000";
      ctx.lineWidth = 8;
      ctx.lineJoin = "round";

      const wrapped = wrapText(ctx, quote, 650);
      const lineHeight = 65;
      const totalTextHeight = wrapped.length * lineHeight;
      const startY = (canvas.height - totalTextHeight) / 2 + lineHeight / 2;

      wrapped.forEach((line, i) => {
        const y = startY + i * lineHeight;
        ctx.strokeText(line, canvas.width / 2, y);
        ctx.fillText(line, canvas.width / 2, y);
      });

      resolve(canvas.toDataURL("image/png"));
    };

    bgImage.onload = () => {
      ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);
      drawContent();
    };
    bgImage.onerror = () => {
      ctx.fillStyle = "#1a1a2e";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      drawContent();
    };
  });
};

/* ---------- Helper: share or download ---------- */
async function shareOrDownload(dataUrl, filename, title, text) {
  const blob = await (await fetch(dataUrl)).blob();
  const file = new File([blob], filename, { type: "image/png" });

  if (navigator.share && navigator.canShare({ files: [file] })) {
    await navigator.share({ files: [file], title, text });
  } else {
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = filename;
    link.click();
  }
}

/* ---------- Helper: copy text ---------- */
async function copyToClipboard(text) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.left = "-9999px";
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
    return true;
  } catch (err) {
    console.error("Copy failed:", err);
    return false;
  }
}

/* ---------- Main Component ---------- */
export default function QuotesKu() {
  const [allQuotes, setAllQuotes] = useState([]);
  const [filteredQuotes, setFilteredQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [quoteStates, setQuoteStates] = useState({});
  const [copiedId, setCopiedId] = useState(null);

  // Search visibility (auto hide on scroll)
  const [showSearch, setShowSearch] = useState(true);
  const lastScrollY = useRef(0);

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState(null);
  const [modalQuote, setModalQuote] = useState(null);
  const [modalImage, setModalImage] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalSharing, setModalSharing] = useState(false);

  /* ---------- Scroll listener: hide search on scroll down ---------- */
  useEffect(() => {
    const onScroll = () => {
      const currentY = window.scrollY;
      // Kalau scroll ke atas (currentY < lastScrollY) & sudah lewat 100px → tampilkan
      // Kalau scroll ke bawah & sudah lewat 100px → sembunyikan
      if (currentY > lastScrollY.current && currentY > 100) {
        setShowSearch(false);
      } else if (currentY < lastScrollY.current) {
        setShowSearch(true);
      }
      lastScrollY.current = currentY;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* ---------- Like ---------- */
  const handleLike = async (id, currentLikes, currentLikeStatus) => {
    setQuoteStates((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        isLiking: true,
        isLiked: !currentLikeStatus,
        likesCount: currentLikeStatus ? currentLikes - 1 : currentLikes + 1,
      },
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
          likesCount: currentLikes,
        },
      }));
    } finally {
      setQuoteStates((prev) => ({
        ...prev,
        [id]: { ...prev[id], isLiking: false },
      }));
    }
  };

  /* ---------- Copy text dari card ---------- */
  const handleCopyFromCard = async (q) => {
    const ok = await copyToClipboard(q.text);
    if (ok) {
      setCopiedId(q.id);
      setTimeout(() => setCopiedId(null), 1500);
    } else {
      alert("Gagal menyalin teks");
    }
  };

  /* ---------- Buka Modal Reels ---------- */
  const openReelsModal = async (q) => {
    setModalQuote(q);
    setModalType("reels");
    setModalOpen(true);
    setModalLoading(true);
    setModalImage(null);

    try {
      let bgPath = q.reelsBg;
      if (!bgPath) {
        bgPath = await getRandomUnusedBackground();
        const ref = doc(myQuotesCollection, q.id);
        await updateDoc(ref, { reelsBg: bgPath });
        const updateFn = (prev) =>
          prev.map((x) => (x.id === q.id ? { ...x, reelsBg: bgPath } : x));
        setAllQuotes(updateFn);
        setFilteredQuotes(updateFn);
        setModalQuote((prev) => ({ ...prev, reelsBg: bgPath }));
      }
      const dataUrl = await generateReelsImage(q.text, bgPath);
      setModalImage(dataUrl);
    } catch (err) {
      console.error("Error generate reels:", err);
    } finally {
      setModalLoading(false);
    }
  };

  /* ---------- Buka Modal Feed ---------- */
  const openFeedModal = async (q) => {
    setModalQuote(q);
    setModalType("feed");
    setModalOpen(true);
    setModalLoading(true);
    setModalImage(null);

    try {
      const dataUrl = await generateFeedImage(q.text);
      setModalImage(dataUrl);
    } catch (err) {
      console.error("Error generate feed:", err);
    } finally {
      setModalLoading(false);
    }
  };

  const closeModal = () => {
    setModalOpen(false);
    setModalType(null);
    setModalQuote(null);
    setModalImage(null);
  };

  /* ---------- Share dari Modal ---------- */
  const handleModalShare = async () => {
    if (!modalImage || !modalQuote) return;
    setModalSharing(true);
    try {
      const isReels = modalType === "reels";
      const filename = isReels ? "quote-reels.png" : "quote-feed.png";
      const title = isReels ? "Quote Reels" : "Quote Feed";
      await shareOrDownload(modalImage, filename, title, modalQuote.text);
    } catch (err) {
      if (err.name !== "AbortError") {
        console.error("Error sharing:", err);
        alert("Gagal membagikan, silakan coba lagi");
      }
    } finally {
      setModalSharing(false);
    }
  };

  /* ---------- Toggle Mark Reels / Feed ---------- */
  const handleToggleReelsMark = async () => {
    if (!modalQuote) return;
    const q = modalQuote;
    const current = q.reelsStatus === "marked";
    const newStatus = current ? "approved" : "marked";

    try {
      const ref = doc(myQuotesCollection, q.id);
      await updateDoc(ref, { reelsStatus: newStatus, updatedAt: new Date() });

      if (newStatus === "marked" && q.reelsBg) {
        await markBackgroundAsUsed(q.reelsBg, q.id);
      }
      if (newStatus === "approved" && q.reelsBg) {
        await releaseBackground(q.reelsBg);
      }

      const updateFn = (prev) =>
        prev.map((x) =>
          x.id === q.id ? { ...x, reelsStatus: newStatus } : x
        );
      setAllQuotes(updateFn);
      setFilteredQuotes(updateFn);
      setModalQuote((prev) => ({ ...prev, reelsStatus: newStatus }));
    } catch (err) {
      console.error("Error toggle reels mark:", err);
      alert("Gagal mengubah status tandai reels");
    }
  };

  const handleToggleFeedMark = async () => {
    if (!modalQuote) return;
    const q = modalQuote;
    const current = q.feedStatus === "marked";
    const newStatus = current ? "approved" : "marked";

    try {
      const ref = doc(myQuotesCollection, q.id);
      await updateDoc(ref, { feedStatus: newStatus, updatedAt: new Date() });

      const updateFn = (prev) =>
        prev.map((x) =>
          x.id === q.id ? { ...x, feedStatus: newStatus } : x
        );
      setAllQuotes(updateFn);
      setFilteredQuotes(updateFn);
      setModalQuote((prev) => ({ ...prev, feedStatus: newStatus }));
    } catch (err) {
      console.error("Error toggle feed mark:", err);
      alert("Gagal mengubah status tandai feed");
    }
  };

  /* ---------- Apply Filter & Sort ---------- */
  const applyFiltersAndSort = (quotes, search) => {
    let result = [...quotes];
    if (search.trim()) {
      const keyword = search.toLowerCase();
      result = result.filter(
        (q) =>
          q.text.toLowerCase().includes(keyword) ||
          q.author?.toLowerCase().includes(keyword)
      );
    }
    // Default: terbaru
    result.sort((a, b) => {
      const dA = a.createdAt?.toDate
        ? a.createdAt.toDate()
        : new Date(a.createdAt);
      const dB = b.createdAt?.toDate
        ? b.createdAt.toDate()
        : new Date(b.createdAt);
      return dB - dA;
    });
    return result;
  };

  useEffect(() => {
    if (allQuotes.length > 0) {
      const filtered = applyFiltersAndSort(allQuotes, searchTerm);
      setFilteredQuotes(filtered);
    }
  }, [searchTerm, allQuotes]);

  /* ---------- Shuffle (FAB) ---------- */
  const handleShuffle = () => {
    setFilteredQuotes((prev) => {
      const arr = [...prev];
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    });
  };

  /* ---------- Fetch Quotes ---------- */
  useEffect(() => {
    const fetchQuotes = async () => {
      try {
        const q = query(
          myQuotesCollection,
          where("status", "in", ["approved", "marked"]),
          orderBy("createdAt", "desc")
        );
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
          likes: d.data().likes || 0,
        }));

        const storythurQuotes = data.filter(
          (quote) => quote.author?.toLowerCase() === "storythur"
        );

        setAllQuotes(storythurQuotes);

        const initialStates = {};
        storythurQuotes.forEach((quote) => {
          initialStates[quote.id] = {
            isLiked: false,
            isLiking: false,
            likesCount: quote.likes || 0,
          };
        });
        setQuoteStates(initialStates);

        setFilteredQuotes(applyFiltersAndSort(storythurQuotes, ""));
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
      if (searchTerm)
        return `Tidak ada quote yang mengandung kata "${searchTerm}"`;
      return "Tidak ada quote yang ditemukan";
    }
    if (searchTerm)
      return `${filteredQuotes.length} hasil untuk "${searchTerm}"`;
    return `${filteredQuotes.length} quotes`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f0f4f8] to-[#f9fafb] pb-24">
      <BottomAdd />

      {/* Header + Search (sticky, auto-hide) */}
      <div
        className={`sticky top-0 z-40 transition-transform duration-300 ${showSearch ? "translate-y-0" : "-translate-y-full"
          }`}
      >
        <div className="bg-white/80 backdrop-blur-lg border-b border-gray-100 shadow-sm">
          {/* Title */}
          <div className="max-w-lg mx-auto px-5 pt-4 pb-2 flex items-center gap-2">
            <div className="w-9 h-9 bg-gradient-to-tr from-[#355485] to-[#4f90c6] rounded-xl flex items-center justify-center shadow-md shadow-[#4f90c6]/30">
              <i className="ri-quill-pen-fill text-white text-lg"></i>
            </div>
            <div>
              <h1 className="text-base font-bold text-gray-800 leading-tight">
                Quotes
              </h1>
              <p className="text-[10px] text-gray-500">
                {getDisplayMessage()}
              </p>
            </div>
          </div>

          {/* Search */}
          <div className="max-w-lg mx-auto px-5 pb-3">
            <div className="relative">
              <i className="ri-search-line absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-base"></i>
              <input
                type="text"
                placeholder="Cari quotes..."
                className="w-full py-2.5 pl-11 pr-10 rounded-2xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:border-[#4f90c6] focus:ring-2 focus:ring-[#4f90c6]/20 text-sm transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-200 transition"
                >
                  <i className="ri-close-line text-base text-gray-500"></i>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* List */}
      <div className="max-w-lg mx-auto px-4 pt-4 pb-8">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 animate-pulse"
              >
                <div className="h-4 bg-gray-200 rounded w-24 mb-3"></div>
                <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-10/12"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredQuotes.length > 0 ? (
              filteredQuotes.map((q) => {
                const state = quoteStates[q.id] || {
                  isLiked: false,
                  isLiking: false,
                  likesCount: 0,
                };
                const isReelsMarked = q.reelsStatus === "marked";
                const isFeedMarked = q.feedStatus === "marked";
                const isCopied = copiedId === q.id;

                return (
                  <div
                    key={q.id}
                    className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 hover:shadow-md active:scale-[0.99] transition-all"
                  >
                    {/* Header */}
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 bg-gradient-to-tr from-[#355485] to-[#4f90c6] rounded-2xl flex items-center justify-center shadow-sm">
                          <i className="ri-user-fill text-white text-sm"></i>
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-gray-800 leading-tight">
                            {q.author}
                          </h3>
                          <p className="text-[11px] text-gray-400">
                            {getRelativeTime(q.createdAt)}
                          </p>
                        </div>
                      </div>

                      {/* Status badges */}
                      <div className="flex gap-1.5">
                        <span
                          className={`text-[10px] px-2 py-1 rounded-full font-semibold flex items-center gap-1 transition-all ${isReelsMarked
                              ? "bg-purple-100 text-purple-700"
                              : "bg-gray-100 text-gray-400"
                            }`}
                          title={isReelsMarked ? "Reels sudah" : "Reels belum"}
                        >
                          <i
                            className={`${isReelsMarked
                                ? "ri-checkbox-circle-fill"
                                : "ri-film-line"
                              } text-xs`}
                          ></i>
                          Reels
                        </span>
                        <span
                          className={`text-[10px] px-2 py-1 rounded-full font-semibold flex items-center gap-1 transition-all ${isFeedMarked
                              ? "bg-pink-100 text-pink-700"
                              : "bg-gray-100 text-gray-400"
                            }`}
                          title={isFeedMarked ? "Feed sudah" : "Feed belum"}
                        >
                          <i
                            className={`${isFeedMarked
                                ? "ri-checkbox-circle-fill"
                                : "ri-image-line"
                              } text-xs`}
                          ></i>
                          Feed
                        </span>
                      </div>
                    </div>

                    {/* Text */}
                    <p className="text-gray-700 text-[15px] leading-relaxed mb-4 font-[450]">
                      {highlightText(q.text, searchTerm)}
                    </p>

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                      <div className="flex items-center gap-1">
                        {/* Like */}
                        <button
                          onClick={() =>
                            handleLike(q.id, state.likesCount, state.isLiked)
                          }
                          disabled={state.isLiking}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl hover:bg-gray-50 active:scale-95 transition"
                        >
                          <i
                            className={`ri-heart-${state.isLiked ? "fill" : "line"
                              } text-lg ${state.isLiked
                                ? "text-red-500"
                                : "text-gray-500"
                              }`}
                          ></i>
                          <span className="text-xs font-medium text-gray-600">
                            {state.likesCount}
                          </span>
                        </button>

                        {/* Copy */}
                        <button
                          onClick={() => handleCopyFromCard(q)}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl hover:bg-gray-50 active:scale-95 transition"
                          title="Salin teks"
                        >
                          <i
                            className={`${isCopied
                                ? "ri-check-line text-emerald-500"
                                : "ri-file-copy-line text-gray-500"
                              } text-lg`}
                          ></i>
                          {isCopied && (
                            <span className="text-[11px] font-medium text-emerald-600">
                              Tersalin
                            </span>
                          )}
                        </button>
                      </div>

                      {/* Preview buttons */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openFeedModal(q)}
                          className="w-9 h-9 flex items-center justify-center rounded-xl bg-pink-50 hover:bg-pink-100 active:scale-95 transition"
                          title="Preview Feed"
                        >
                          <i className="ri-image-line text-base text-pink-600"></i>
                        </button>
                        <button
                          onClick={() => openReelsModal(q)}
                          className="w-9 h-9 flex items-center justify-center rounded-xl bg-purple-50 hover:bg-purple-100 active:scale-95 transition"
                          title="Preview Reels"
                        >
                          <i className="ri-film-line text-base text-purple-600"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-16 bg-white rounded-3xl border border-gray-100">
                <i className="ri-inbox-line text-5xl text-gray-300 mb-3"></i>
                <p className="text-gray-500 text-sm">
                  {searchTerm
                    ? `Tidak ada quote dengan kata "${searchTerm}"`
                    : "Tidak ada quote yang ditemukan"}
                </p>
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="mt-3 text-[#4f90c6] text-xs font-medium"
                  >
                    Hapus pencarian
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* FAB Acak — kiri bawah */}
      <button
        onClick={handleShuffle}
        className="fixed bottom-24 left-5 z-40 w-14 h-14 rounded-full bg-gradient-to-tr from-[#355485] to-[#4f90c6] text-white shadow-lg shadow-[#4f90c6]/40 flex items-center justify-center hover:scale-105 active:scale-95 transition-all"
        title="Acak quotes"
      >
        <i className="ri-shuffle-line text-2xl"></i>
      </button>

      {/* Modal Preview */}
      <PreviewModal
        isOpen={modalOpen}
        onClose={closeModal}
        title={modalType === "reels" ? "Preview Reels" : "Preview Feed"}
        imageUrl={modalImage}
        loading={modalLoading}
        isMarked={
          modalType === "reels"
            ? modalQuote?.reelsStatus === "marked"
            : modalQuote?.feedStatus === "marked"
        }
        onToggleMark={
          modalType === "reels" ? handleToggleReelsMark : handleToggleFeedMark
        }
        onShare={handleModalShare}
        sharing={modalSharing}
      />
    </div>
  );
}