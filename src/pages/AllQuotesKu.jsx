import { useState, useEffect } from "react";
import {
  Search,
  X,
  Check,
  CheckCircle2,
  Film,
  Image as ImageIcon,
  Heart,
  Send,
  Inbox,
  Shuffle,
} from "lucide-react";
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

const BG_START = 1;
const BG_END = 100;
const BG_FOLDER = "/background";
const BG_EXT = ".png";

const ALL_BACKGROUNDS = Array.from(
  { length: BG_END - BG_START + 1 },
  (_, i) => `${BG_FOLDER}/${BG_START + i}${BG_EXT}`
);

/* ---------- Helpers ---------- */

const highlightText = (text, highlight) => {
  if (!highlight.trim()) return text;

  const escapedHighlight = highlight.replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&"
  );

  const regex = new RegExp(`(${escapedHighlight})`, "gi");

  return text.split(regex).map((part, index) =>
    part.toLowerCase() === highlight.toLowerCase() ? (
      <mark
        key={index}
        className="rounded bg-yellow-200 px-0.5 text-gray-900"
      >
        {part}
      </mark>
    ) : (
      part
    )
  );
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
    const snapshot = await getDocs(usedBackgroundsCollection);
    return snapshot.docs.map((item) => item.data().path);
  } catch (error) {
    console.error("Error get used backgrounds:", error);
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
  } catch (error) {
    console.error("Error mark bg used:", error);
  }
}

async function releaseBackground(path) {
  try {
    const snapshot = await getDocs(usedBackgroundsCollection);
    const found = snapshot.docs.find(
      (item) => item.data().path === path
    );

    if (found) {
      await deleteDoc(found.ref);
    }
  } catch (error) {
    console.error("Error release bg:", error);
  }
}

async function getRandomUnusedBackground() {
  const usedBackgrounds = await getUsedBackgrounds();

  let availableBackgrounds = ALL_BACKGROUNDS.filter(
    (background) => !usedBackgrounds.includes(background)
  );

  if (availableBackgrounds.length === 0) {
    console.warn("Semua background terpakai. Reset otomatis.");
    availableBackgrounds = [...ALL_BACKGROUNDS];
  }

  const randomIndex = Math.floor(
    Math.random() * availableBackgrounds.length
  );

  return availableBackgrounds[randomIndex];
}

/* ---------- Generate Feed 1080x1080 ---------- */

const generateFeedImage = async (
  quote,
  bgPath = "/img/bg-storythur.png"
) => {
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    canvas.width = 1080;
    canvas.height = 1080;

    const backgroundImage = new Image();
    backgroundImage.crossOrigin = "Anonymous";
    backgroundImage.src = bgPath;

    const drawContent = () => {
      ctx.fillStyle = "#000000";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = "52px Arial";

      const wrappedText = wrapText(ctx, quote, 900);
      const lineHeight = 70;
      const totalTextHeight = wrappedText.length * lineHeight;
      const startY =
        (canvas.height - totalTextHeight) / 2 + lineHeight / 2;

      wrappedText.forEach((line, index) => {
        ctx.fillText(
          line,
          canvas.width / 2,
          startY + index * lineHeight
        );
      });

      resolve(canvas.toDataURL("image/png"));
    };

    backgroundImage.onload = () => {
      ctx.drawImage(
        backgroundImage,
        0,
        0,
        canvas.width,
        canvas.height
      );

      drawContent();
    };

    backgroundImage.onerror = () => {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      drawContent();
    };
  });
};

/* ---------- Generate Reels 1080x1920 ---------- */

const generateReelsImage = async (quote, bgPath) => {
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    canvas.width = 1080;
    canvas.height = 1920;

    const backgroundImage = new Image();
    backgroundImage.crossOrigin = "Anonymous";
    backgroundImage.src = bgPath;

    const drawContent = () => {
      ctx.font = "52px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#ffffff";
      ctx.strokeStyle = "#000000";
      ctx.lineWidth = 8;
      ctx.lineJoin = "round";

      const wrappedText = wrapText(ctx, quote, 650);
      const lineHeight = 65;
      const totalTextHeight = wrappedText.length * lineHeight;
      const startY =
        (canvas.height - totalTextHeight) / 2 + lineHeight / 2;

      wrappedText.forEach((line, index) => {
        const y = startY + index * lineHeight;

        ctx.strokeText(line, canvas.width / 2, y);
        ctx.fillText(line, canvas.width / 2, y);
      });

      resolve(canvas.toDataURL("image/png"));
    };

    backgroundImage.onload = () => {
      ctx.drawImage(
        backgroundImage,
        0,
        0,
        canvas.width,
        canvas.height
      );

      drawContent();
    };

    backgroundImage.onerror = () => {
      ctx.fillStyle = "#1a1a2e";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      drawContent();
    };
  });
};

/* ---------- Share or Download ---------- */

async function shareOrDownload(dataUrl, filename, title, text) {
  const blob = await (await fetch(dataUrl)).blob();
  const file = new File([blob], filename, {
    type: "image/png",
  });

  if (
    navigator.share &&
    navigator.canShare &&
    navigator.canShare({ files: [file] })
  ) {
    await navigator.share({
      files: [file],
      title,
      text,
    });
  } else {
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = filename;
    link.click();
  }
}

/* ---------- Copy Text ---------- */

async function copyToClipboard(text) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }

    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    textarea.style.top = "0";

    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();

    const success = document.execCommand("copy");
    document.body.removeChild(textarea);

    return success;
  } catch (error) {
    console.error("Copy failed:", error);
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

  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState(null);
  const [modalQuote, setModalQuote] = useState(null);
  const [modalImage, setModalImage] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalSharing, setModalSharing] = useState(false);

  /* ---------- Like ---------- */

  const handleLike = async (
    id,
    currentLikes,
    currentLikeStatus
  ) => {
    const nextLikeStatus = !currentLikeStatus;
    const nextLikesCount = currentLikeStatus
      ? Math.max(0, currentLikes - 1)
      : currentLikes + 1;

    setQuoteStates((previous) => ({
      ...previous,
      [id]: {
        ...previous[id],
        isLiked: nextLikeStatus,
        isLiking: true,
        likesCount: nextLikesCount,
      },
    }));

    try {
      const quoteRef = doc(myQuotesCollection, id);

      await updateDoc(quoteRef, {
        likes: increment(currentLikeStatus ? -1 : 1),
      });
    } catch (error) {
      console.error("Error like:", error);

      setQuoteStates((previous) => ({
        ...previous,
        [id]: {
          ...previous[id],
          isLiked: currentLikeStatus,
          likesCount: currentLikes,
        },
      }));
    } finally {
      setQuoteStates((previous) => ({
        ...previous,
        [id]: {
          ...previous[id],
          isLiking: false,
        },
      }));
    }
  };

  /* ---------- Share From Card ---------- */

  const handleShareFromCard = async (quote) => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: "Quote",
          text: quote.text,
        });
      } else {
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(quote.text)}`;
        window.open(whatsappUrl, "_blank", "noopener,noreferrer");
      }
    } catch (error) {
      if (error.name !== "AbortError") {
        console.error("Error sharing quote:", error);
        alert("Gagal membagikan quote");
      }
    }
  };

  /* ---------- Open Reels Modal ---------- */

  const openReelsModal = async (quote) => {
    setModalQuote(quote);
    setModalType("reels");
    setModalOpen(true);
    setModalLoading(true);
    setModalImage(null);

    try {
      let backgroundPath = quote.reelsBg;

      if (!backgroundPath) {
        backgroundPath = await getRandomUnusedBackground();

        const quoteRef = doc(myQuotesCollection, quote.id);

        await updateDoc(quoteRef, {
          reelsBg: backgroundPath,
        });

        const updateQuotes = (previous) =>
          previous.map((item) =>
            item.id === quote.id
              ? {
                ...item,
                reelsBg: backgroundPath,
              }
              : item
          );

        setAllQuotes(updateQuotes);
        setFilteredQuotes(updateQuotes);

        setModalQuote((previous) => ({
          ...previous,
          reelsBg: backgroundPath,
        }));
      }

      const imageDataUrl = await generateReelsImage(
        quote.text,
        backgroundPath
      );

      setModalImage(imageDataUrl);
    } catch (error) {
      console.error("Error generate reels:", error);
    } finally {
      setModalLoading(false);
    }
  };

  /* ---------- Open Feed Modal ---------- */

  const openFeedModal = async (quote) => {
    setModalQuote(quote);
    setModalType("feed");
    setModalOpen(true);
    setModalLoading(true);
    setModalImage(null);

    try {
      const imageDataUrl = await generateFeedImage(quote.text);
      setModalImage(imageDataUrl);
    } catch (error) {
      console.error("Error generate feed:", error);
    } finally {
      setModalLoading(false);
    }
  };

  /* ---------- Close Modal ---------- */

  const closeModal = () => {
    setModalOpen(false);
    setModalType(null);
    setModalQuote(null);
    setModalImage(null);
    setModalLoading(false);
    setModalSharing(false);
  };

  /* ---------- Share From Modal ---------- */

  const handleModalShare = async () => {
    if (!modalImage || !modalQuote) return;

    setModalSharing(true);

    try {
      const isReels = modalType === "reels";
      const filename = isReels
        ? "quote-reels.png"
        : "quote-feed.png";
      const title = isReels ? "Quote Reels" : "Quote Feed";

      await shareOrDownload(
        modalImage,
        filename,
        title,
        modalQuote.text
      );
    } catch (error) {
      if (error.name !== "AbortError") {
        console.error("Error sharing:", error);
        alert("Gagal membagikan, silakan coba lagi");
      }
    } finally {
      setModalSharing(false);
    }
  };

  /* ---------- Toggle Mark Reels ---------- */

  const handleToggleReelsMark = async () => {
    if (!modalQuote) return;

    const currentQuote = modalQuote;
    const isCurrentlyMarked =
      currentQuote.reelsStatus === "marked";
    const nextStatus = isCurrentlyMarked
      ? "approved"
      : "marked";

    try {
      const quoteRef = doc(
        myQuotesCollection,
        currentQuote.id
      );

      await updateDoc(quoteRef, {
        reelsStatus: nextStatus,
        updatedAt: new Date(),
      });

      if (
        nextStatus === "marked" &&
        currentQuote.reelsBg
      ) {
        await markBackgroundAsUsed(
          currentQuote.reelsBg,
          currentQuote.id
        );
      }

      if (
        nextStatus === "approved" &&
        currentQuote.reelsBg
      ) {
        await releaseBackground(currentQuote.reelsBg);
      }

      const updateQuotes = (previous) =>
        previous.map((item) =>
          item.id === currentQuote.id
            ? {
              ...item,
              reelsStatus: nextStatus,
            }
            : item
        );

      setAllQuotes(updateQuotes);
      setFilteredQuotes(updateQuotes);

      setModalQuote((previous) => ({
        ...previous,
        reelsStatus: nextStatus,
      }));
    } catch (error) {
      console.error("Error toggle reels mark:", error);
      alert("Gagal mengubah status tandai reels");
    }
  };

  /* ---------- Toggle Mark Feed ---------- */

  const handleToggleFeedMark = async () => {
    if (!modalQuote) return;

    const currentQuote = modalQuote;
    const isCurrentlyMarked =
      currentQuote.feedStatus === "marked";
    const nextStatus = isCurrentlyMarked
      ? "approved"
      : "marked";

    try {
      const quoteRef = doc(
        myQuotesCollection,
        currentQuote.id
      );

      await updateDoc(quoteRef, {
        feedStatus: nextStatus,
        updatedAt: new Date(),
      });

      const updateQuotes = (previous) =>
        previous.map((item) =>
          item.id === currentQuote.id
            ? {
              ...item,
              feedStatus: nextStatus,
            }
            : item
        );

      setAllQuotes(updateQuotes);
      setFilteredQuotes(updateQuotes);

      setModalQuote((previous) => ({
        ...previous,
        feedStatus: nextStatus,
      }));
    } catch (error) {
      console.error("Error toggle feed mark:", error);
      alert("Gagal mengubah status tandai feed");
    }
  };

  /* ---------- Apply Search & Sort ---------- */

  const applyFiltersAndSort = (quotes, search) => {
    let result = [...quotes];

    if (search.trim()) {
      const keyword = search.toLowerCase();

      result = result.filter((quote) =>
        quote.text?.toLowerCase().includes(keyword)
      );
    }

    result.sort((first, second) => {
      const firstDate = first.createdAt?.toDate
        ? first.createdAt.toDate()
        : new Date(first.createdAt || 0);

      const secondDate = second.createdAt?.toDate
        ? second.createdAt.toDate()
        : new Date(second.createdAt || 0);

      return secondDate - firstDate;
    });

    return result;
  };

  useEffect(() => {
    const filtered = applyFiltersAndSort(
      allQuotes,
      searchTerm
    );

    setFilteredQuotes(filtered);
  }, [searchTerm, allQuotes]);

  /* ---------- Shuffle ---------- */

  const handleShuffle = () => {
    setFilteredQuotes((previous) => {
      const shuffled = [...previous];

      for (let index = shuffled.length - 1; index > 0; index--) {
        const randomIndex = Math.floor(
          Math.random() * (index + 1)
        );

        [shuffled[index], shuffled[randomIndex]] = [
          shuffled[randomIndex],
          shuffled[index],
        ];
      }

      return shuffled;
    });
  };

  /* ---------- Fetch Quotes ---------- */

  useEffect(() => {
    const fetchQuotes = async () => {
      try {
        const quotesQuery = query(
          myQuotesCollection,
          where("status", "in", ["approved", "marked"]),
          orderBy("createdAt", "desc")
        );

        const snapshot = await getDocs(quotesQuery);

        const data = snapshot.docs.map((quoteDocument) => ({
          id: quoteDocument.id,
          ...quoteDocument.data(),
          likes: quoteDocument.data().likes || 0,
        }));

        const storythurQuotes = data.filter(
          (quote) =>
            quote.author?.toLowerCase() === "storythur"
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

        setFilteredQuotes(
          applyFiltersAndSort(storythurQuotes, "")
        );
      } catch (error) {
        console.error("Error fetch quotes:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchQuotes();
  }, []);

  /* ---------- Search Placeholder ---------- */

  const getSearchPlaceholder = () => {
    if (loading) {
      return "Memuat quotes...";
    }

    return `Cari dari ${allQuotes.length} quotes...`;
  };

  return (
    <div className="min-h-screen bg-[#f7f8fa] pb-24 text-gray-900">
      <BottomAdd />

      {/* Search Header */}
      <header className="fixed left-0 right-0 top-0 z-40">
        <div className="border-b border-gray-200/80 bg-white/95 px-4 py-3 backdrop-blur-md sm:px-6">
          <div className="mx-auto max-w-2xl">
            <div className="relative">
              <Search
                size={17}
                strokeWidth={1.8}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                type="text"
                value={searchTerm}
                onChange={(event) =>
                  setSearchTerm(event.target.value)
                }
                placeholder={getSearchPlaceholder()}
                className="h-10 w-full border border-gray-200 bg-gray-50 pl-10 pr-10 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-[#4f90c6] focus:bg-white focus:ring-2 focus:ring-[#4f90c6]/10"
              />

              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center text-gray-400 transition hover:text-gray-700"
                  aria-label="Hapus pencarian"
                >
                  <X size={16} strokeWidth={1.8} />
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Quotes List */}
      <main className="mx-auto max-w-2xl px-4 pt-20 sm:px-6 sm:pt-24">
        {loading ? (
          <div className="divide-y divide-gray-200 border-y border-gray-200 bg-white">
            {[1, 2, 3, 4, 5].map((item) => (
              <div
                key={item}
                className="animate-pulse px-4 py-5 sm:px-5"
              >
                <div className="mb-3 h-4 w-full bg-gray-100" />
                <div className="mb-2 h-4 w-11/12 bg-gray-100" />
                <div className="h-4 w-8/12 bg-gray-100" />

                <div className="mt-5 flex justify-between">
                  <div className="h-7 w-20 bg-gray-100" />
                  <div className="flex gap-2">
                    <div className="h-7 w-7 bg-gray-100" />
                    <div className="h-7 w-7 bg-gray-100" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredQuotes.length > 0 ? (
          <div className="divide-y divide-gray-200 border-y border-gray-200 bg-white">
            {filteredQuotes.map((quote) => {
              const state = quoteStates[quote.id] || {
                isLiked: false,
                isLiking: false,
                likesCount: quote.likes || 0,
              };

              const isReelsMarked =
                quote.reelsStatus === "marked";
              const isFeedMarked =
                quote.feedStatus === "marked";
              return (
                <article
                  key={quote.id}
                  className="px-4 py-5 transition-colors hover:bg-gray-50/70 sm:px-5"
                >
                  {/* Quote Text */}
                  <div className="relative">
                    <span className="pointer-events-none absolute -left-1 -top-3 select-none font-serif text-4xl leading-none text-gray-200">
                      “
                    </span>

                    <p className="relative pl-3 text-[15px] font-normal leading-7 tracking-[-0.01em] text-gray-700 sm:text-base">
                      {highlightText(
                        quote.text || "",
                        searchTerm
                      )}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="mt-5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() =>
                          handleLike(
                            quote.id,
                            state.likesCount,
                            state.isLiked
                          )
                        }
                        disabled={state.isLiking}
                        className={`inline-flex h-8 items-center gap-1.5 px-2 text-xs transition ${state.isLiked
                          ? "text-red-500"
                          : "text-gray-500 hover:text-gray-800"
                          }`}
                        title="Sukai quote"
                      >
                        <Heart
                          size={16}
                          strokeWidth={1.8}
                          fill={
                            state.isLiked
                              ? "currentColor"
                              : "none"
                          }
                        />

                        <span className="tabular-nums">
                          {state.likesCount}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleShareFromCard(quote)}
                        className="inline-flex h-8 items-center gap-1.5 px-2 text-xs text-gray-500 transition hover:text-gray-800"
                        title="Bagikan quote"
                      >
                        <Send size={16} strokeWidth={1.8} />
                        <span className="hidden sm:inline">Bagikan</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => openFeedModal(quote)}
                        className={`relative flex h-8 w-8 items-center justify-center border transition ${isFeedMarked
                          ? "border-pink-200 bg-pink-50 text-pink-600"
                          : "border-gray-200 bg-white text-gray-500 hover:border-pink-200 hover:bg-pink-50 hover:text-pink-600"
                          }`}
                        title={
                          isFeedMarked
                            ? "Feed sudah ditandai"
                            : "Preview Feed"
                        }
                      >
                        {isFeedMarked ? (
                          <CheckCircle2
                            size={16}
                            strokeWidth={1.8}
                          />
                        ) : (
                          <ImageIcon
                            size={16}
                            strokeWidth={1.8}
                          />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => openReelsModal(quote)}
                        className={`relative flex h-8 w-8 items-center justify-center border transition ${isReelsMarked
                          ? "border-violet-200 bg-violet-50 text-violet-600"
                          : "border-gray-200 bg-white text-gray-500 hover:border-violet-200 hover:bg-violet-50 hover:text-violet-600"
                          }`}
                        title={
                          isReelsMarked
                            ? "Reels sudah ditandai"
                            : "Preview Reels"
                        }
                      >
                        {isReelsMarked ? (
                          <CheckCircle2
                            size={16}
                            strokeWidth={1.8}
                          />
                        ) : (
                          <Film
                            size={16}
                            strokeWidth={1.8}
                          />
                        )}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="border-y border-gray-200 bg-white px-5 py-16 text-center">
            <Inbox
              size={34}
              strokeWidth={1.3}
              className="mx-auto mb-4 text-gray-300"
            />

            <p className="text-sm text-gray-500">
              {searchTerm
                ? `Tidak ada quote yang mengandung kata "${searchTerm}"`
                : "Tidak ada quote yang ditemukan"}
            </p>

            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="mt-4 text-xs font-medium text-[#4f90c6] hover:underline"
              >
                Hapus pencarian
              </button>
            )}
          </div>
        )}
      </main>

      {/* Shuffle Button */}
      <button
        type="button"
        onClick={handleShuffle}
        className="fixed bottom-5 right-5 z-50 flex h-10 w-10 items-center justify-center bg-[#355485] text-white shadow-lg shadow-[#355485]/20 transition hover:bg-[#2a436c] active:scale-95 sm:bottom-6 sm:right-6"
        title="Acak quotes"
        aria-label="Acak quotes"
      >
        <Shuffle
          size={18}
          strokeWidth={1.9}
        />
      </button>

      {/* Preview Modal */}
      <PreviewModal
        isOpen={modalOpen}
        onClose={closeModal}
        title={
          modalType === "reels"
            ? "Preview Reels"
            : "Preview Feed"
        }
        imageUrl={modalImage}
        loading={modalLoading}
        isMarked={
          modalType === "reels"
            ? modalQuote?.reelsStatus === "marked"
            : modalQuote?.feedStatus === "marked"
        }
        onToggleMark={
          modalType === "reels"
            ? handleToggleReelsMark
            : handleToggleFeedMark
        }
        onShare={handleModalShare}
        sharing={modalSharing}
      />
    </div>
  );
}