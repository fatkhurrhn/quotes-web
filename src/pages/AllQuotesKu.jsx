import { useState, useEffect } from "react";
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

  if (diffYears > 0) return `${diffYears} tahun lalu`;
  if (diffMonths > 0) return `${diffMonths} bulan lalu`;
  if (diffWeeks > 0) return `${diffWeeks} minggu lalu`;
  if (diffDays > 0) return `${diffDays} hari lalu`;
  if (diffHours > 0) return `${diffHours} jam lalu`;
  if (diffMins > 0) return `${diffMins} menit lalu`;
  if (diffSecs > 10) return `${diffSecs} detik lalu`;
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
    if (found) {
      await deleteDoc(found.ref);
    }
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
      ctx.fillStyle = "#ffffff";      // teks putih
      ctx.strokeStyle = "#000000";    // outline hitam
      ctx.lineWidth = 8;              // ketebalan outline
      ctx.lineJoin = "round";         // sudut outline halus

      const wrapped = wrapText(ctx, quote, 650);
      const lineHeight = 65;
      const totalTextHeight = wrapped.length * lineHeight;
      const startY = (canvas.height - totalTextHeight) / 2 + lineHeight / 2;

      wrapped.forEach((line, i) => {
        const y = startY + i * lineHeight;
        ctx.strokeText(line, canvas.width / 2, y);  // outline dulu
        ctx.fillText(line, canvas.width / 2, y);    // baru isi putih
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
      ctx.fillStyle = "#ffffff";
      drawContent();
    };
  });
};

/* ---------- Helper: copy text ---------- */
async function copyToClipboard(text) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    // Fallback: textarea manual
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
  const [displayQuotes, setDisplayQuotes] = useState([]);
  const [filteredQuotes, setFilteredQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortType, setSortType] = useState("newest");

  const [quoteStates, setQuoteStates] = useState({});
  const [copiedId, setCopiedId] = useState(null);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState(null); // "reels" | "feed"
  const [modalQuote, setModalQuote] = useState(null);
  const [modalImage, setModalImage] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalCopied, setModalCopied] = useState(false);

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

  /* ---------- Salin teks dari card ---------- */
  const handleCopyFromCard = async (q) => {
    const ok = await copyToClipboard(q.text);
    if (ok) {
      setCopiedId(q.id);
      setTimeout(() => setCopiedId(null), 1500);
    } else {
      alert("Gagal menyalin teks");
    }
  };

  /* ---------- Salin teks dari modal ---------- */
  const handleCopyFromModal = async () => {
    if (!modalQuote) return;
    const ok = await copyToClipboard(modalQuote.text);
    if (ok) {
      setModalCopied(true);
      setTimeout(() => setModalCopied(false), 1500);
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
    setModalCopied(false);

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
    setModalCopied(false);

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
    setModalCopied(false);
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

  /* ---------- Filter & Sort ---------- */
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
          const dA = a.createdAt?.toDate
            ? a.createdAt.toDate()
            : new Date(a.createdAt);
          const dB = b.createdAt?.toDate
            ? b.createdAt.toDate()
            : new Date(b.createdAt);
          return dB - dA;
        });
        break;
      case "oldest":
        result.sort((a, b) => {
          const dA = a.createdAt?.toDate
            ? a.createdAt.toDate()
            : new Date(a.createdAt);
          const dB = b.createdAt?.toDate
            ? b.createdAt.toDate()
            : new Date(b.createdAt);
          return dA - dB;
        });
        break;
      case "random":
        result.sort(() => Math.random() - 0.5);
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

        const initialDisplay = applyFiltersAndSort(
          storythurQuotes,
          "",
          "newest"
        );
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
      if (searchTerm)
        return `Tidak ada quote yang mengandung kata "${searchTerm}"`;
      return "Tidak ada quote yang ditemukan";
    }
    if (searchTerm)
      return `Menampilkan ${filteredQuotes.length} hasil untuk "${searchTerm}"`;
    return `${filteredQuotes.length} quotes dari storythur`;
  };

  return (
    <div className="min-h-screen bg-[#f9fafb] pb-16">
      <BottomAdd />

      {/* Search Bar */}
      <div className="max-w-lg mx-auto px-5 pt-4">
        <div className="flex gap-2 items-center">
          <div className="relative flex-1">
            <i className="ri-search-line absolute left-4 top-1/2 transform -translate-y-1/2 text-[#9ca3af] text-lg"></i>
            <input
              type="text"
              placeholder="Cari quotes..."
              className="w-full p-3 pl-11 rounded-xl border border-[#e5e7eb] bg-white focus:outline-none focus:border-[#4f90c6] focus:ring-1 focus:ring-[#4f90c6] text-sm shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
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

      {/* Info */}
      <div className="max-w-lg mx-auto px-5 mt-3 mb-3">
        <p className="text-xs text-[#6b7280]">{getDisplayMessage()}</p>
      </div>

      {/* List */}
      <div className="max-w-lg mx-auto px-5 pb-8">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="bg-white rounded-xl p-4 shadow-sm border border-[#e5e7eb] animate-pulse"
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
                    className="bg-white rounded-xl p-4 shadow-sm border border-[#e5e7eb] hover:shadow-md transition-all"
                  >
                    {/* Header */}
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

                    {/* Status Indicators — SELALU TAMPIL */}
                    <div className="flex gap-1.5 mb-3">
                      <span
                        className={`text-[10px] px-2 py-1 rounded-full font-medium flex items-center gap-1 ${isReelsMarked
                            ? "bg-purple-100 text-purple-700"
                            : "bg-gray-100 text-gray-400"
                          }`}
                      >
                        <i
                          className={`${isReelsMarked
                              ? "ri-checkbox-circle-fill"
                              : "ri-checkbox-blank-circle-line"
                            } text-xs`}
                        ></i>
                        Reels {isReelsMarked ? "✓" : ""}
                      </span>
                      <span
                        className={`text-[10px] px-2 py-1 rounded-full font-medium flex items-center gap-1 ${isFeedMarked
                            ? "bg-pink-100 text-pink-700"
                            : "bg-gray-100 text-gray-400"
                          }`}
                      >
                        <i
                          className={`${isFeedMarked
                              ? "ri-checkbox-circle-fill"
                              : "ri-checkbox-blank-circle-line"
                            } text-xs`}
                        ></i>
                        Feed {isFeedMarked ? "✓" : ""}
                      </span>
                    </div>

                    {/* Text */}
                    <p className="text-gray-700 text-sm leading-relaxed mb-3">
                      {highlightText(q.text, searchTerm)}
                    </p>

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-2 border-t border-[#e5e7eb]">
                      <div className="flex items-center gap-3">
                        {/* Like */}
                        <button
                          onClick={() =>
                            handleLike(q.id, state.likesCount, state.isLiked)
                          }
                          disabled={state.isLiking}
                          className="flex items-center gap-1 group"
                        >
                          <i
                            className={`ri-heart-${state.isLiked ? "fill" : "line"
                              } text-lg ${state.isLiked
                                ? "text-red-500"
                                : "text-gray-500 group-hover:text-red-500"
                              }`}
                          ></i>
                          <span className="text-xs text-gray-600">
                            {state.likesCount}
                          </span>
                        </button>

                        {/* Copy Text */}
                        <button
                          onClick={() => handleCopyFromCard(q)}
                          className="group flex items-center gap-1"
                          title="Salin teks"
                        >
                          <i
                            className={`${isCopied
                                ? "ri-check-line text-emerald-500"
                                : "ri-file-copy-line text-gray-500 group-hover:text-emerald-500"
                              } text-lg transition-all`}
                          ></i>
                          {isCopied && (
                            <span className="text-[10px] text-emerald-600 font-medium">
                              Tersalin
                            </span>
                          )}
                        </button>

                        {/* Feed */}
                        <button
                          onClick={() => openFeedModal(q)}
                          className="group"
                          title="Preview Feed (1080x1080)"
                        >
                          <i className="ri-image-line text-lg text-gray-500 group-hover:text-pink-500"></i>
                        </button>

                        {/* Reels */}
                        <button
                          onClick={() => openReelsModal(q)}
                          className="group"
                          title="Preview Reels (1080x1920)"
                        >
                          <i className="ri-film-line text-lg text-gray-500 group-hover:text-purple-500"></i>
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
              </div>
            )}
          </div>
        )}
      </div>

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
        onCopyText={handleCopyFromModal}
        copied={modalCopied}
      />
    </div>
  );
}