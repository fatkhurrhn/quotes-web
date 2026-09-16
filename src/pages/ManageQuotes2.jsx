import React, { useEffect, useMemo, useState } from "react";
import {
  Check,
  ChevronDown,
  Download,
  Edit3,
  FileSpreadsheet,
  FileUp,
  History,
  Inbox,
  Loader2,
  Menu,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  UploadCloud,
  X,
  XCircle,
  CheckCircle2,
  Bookmark,
  BookmarkCheck,
  AlertTriangle,
  Clock3,
} from "lucide-react";

import { myQuotesCollection } from "../firebase";

import {
  getDocs,
  query,
  orderBy,
  doc,
  updateDoc,
  deleteDoc,
  where,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";

import * as XLSX from "xlsx";

const DEFAULT_AUTHOR = "storythur";

const ManageQuotes = () => {
  // =========================================================
  // Quotes State
  // =========================================================

  const [quotes, setQuotes] = useState([]);
  const [isQuotesLoading, setIsQuotesLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [editingQuote, setEditingQuote] = useState(null);

  // =========================================================
  // Add Quote State
  // =========================================================

  const [isAddPopupOpen, setIsAddPopupOpen] = useState(false);
  const [newQuote, setNewQuote] = useState({
    text: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState(null);

  // =========================================================
  // Import Excel State
  // =========================================================

  const [isImportPopupOpen, setIsImportPopupOpen] = useState(false);
  const [importPreview, setImportPreview] = useState([]);
  const [importFile, setImportFile] = useState(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importErrors, setImportErrors] = useState([]);

  // =========================================================
  // Export State
  // =========================================================

  const [isExporting, setIsExporting] = useState(false);

  // =========================================================
  // Delete All State
  // =========================================================

  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // =========================================================
  // History State
  // =========================================================

  const [history, setHistory] = useState([]);

  // =========================================================
  // Load History
  // =========================================================

  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem("quoteAddHistory");

      if (savedHistory) {
        setHistory(JSON.parse(savedHistory));
      }
    } catch (error) {
      console.error("Error loading history:", error);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("quoteAddHistory", JSON.stringify(history));
  }, [history]);

  // =========================================================
  // Notification
  // =========================================================

  const showNotificationMessage = (message, type = "success") => {
    setNotification({
      message,
      type,
    });

    setTimeout(() => {
      setNotification(null);
    }, 3500);
  };

  // =========================================================
  // Fetch Quotes
  // =========================================================

  const fetchQuotes = async () => {
    setIsQuotesLoading(true);

    try {
      let quotesQuery;

      if (statusFilter === "all") {
        quotesQuery = query(
          myQuotesCollection,
          orderBy("createdAt", "desc")
        );
      } else {
        quotesQuery = query(
          myQuotesCollection,
          where("status", "==", statusFilter),
          orderBy("createdAt", "desc")
        );
      }

      const querySnapshot = await getDocs(quotesQuery);

      const quotesData = querySnapshot.docs.map((quoteDoc) => ({
        id: quoteDoc.id,
        ...quoteDoc.data(),
      }));

      setQuotes(quotesData);
    } catch (error) {
      console.error("Error fetching quotes:", error);

      showNotificationMessage(
        "Gagal mengambil data quotes. Coba refresh kembali.",
        "error"
      );
    } finally {
      setIsQuotesLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotes();
  }, [statusFilter]);

  // =========================================================
  // Search Filter
  // =========================================================

  const filteredQuotes = useMemo(() => {
    const normalizedSearch = searchTerm.toLowerCase().trim();

    return quotes.filter((quote) => {
      if (!normalizedSearch) return true;

      return (
        quote.text?.toLowerCase().includes(normalizedSearch) ||
        quote.author?.toLowerCase().includes(normalizedSearch)
      );
    });
  }, [quotes, searchTerm]);

  // =========================================================
  // Status Helpers
  // =========================================================

  const getStatusLabel = (status) => {
    const labels = {
      pending: "Pending",
      approved: "Approved",
      rejected: "Rejected",
      marked: "Marked",
    };

    return labels[status] || "Pending";
  };

  const getStatusStyle = (status) => {
    const styles = {
      approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
      pending: "bg-amber-50 text-amber-700 border-amber-200",
      rejected: "bg-red-50 text-red-700 border-red-200",
      marked: "bg-blue-50 text-blue-700 border-blue-200",
    };

    return styles[status] || styles.pending;
  };

  const getStatusIcon = (status) => {
    if (status === "approved") {
      return <CheckCircle2 size={14} />;
    }

    if (status === "rejected") {
      return <XCircle size={14} />;
    }

    if (status === "marked") {
      return <BookmarkCheck size={14} />;
    }

    return <Clock3 size={14} />;
  };

  // =========================================================
  // Update Status
  // =========================================================

  const handleStatusChange = async (quoteId, newStatus) => {
    try {
      const quoteRef = doc(myQuotesCollection, quoteId);

      await updateDoc(quoteRef, {
        status: newStatus,
        updatedAt: serverTimestamp(),
      });

      setQuotes((prevQuotes) =>
        prevQuotes.map((quote) =>
          quote.id === quoteId
            ? {
              ...quote,
              status: newStatus,
            }
            : quote
        )
      );

      showNotificationMessage(
        `Status berhasil diubah menjadi ${getStatusLabel(newStatus)}.`,
        "success"
      );
    } catch (error) {
      console.error("Error updating quote status:", error);

      showNotificationMessage(
        "Gagal mengubah status quote.",
        "error"
      );
    }
  };

  // =========================================================
  // Quick Actions
  // =========================================================

  const handleApprove = (quoteId) => {
    handleStatusChange(quoteId, "approved");
  };

  const handleReject = (quoteId) => {
    handleStatusChange(quoteId, "rejected");
  };

  const handleMarkToggle = async (quoteId, currentStatus) => {
    const newStatus =
      currentStatus === "marked" ? "approved" : "marked";

    await handleStatusChange(quoteId, newStatus);
  };

  // =========================================================
  // Edit Quote
  // =========================================================

  const handleEdit = (quote) => {
    setEditingQuote({
      ...quote,
      text: quote.text || "",
      author: quote.author || DEFAULT_AUTHOR,
    });
  };

  const handleUpdate = async (event) => {
    event.preventDefault();

    if (!editingQuote?.text?.trim()) {
      showNotificationMessage(
        "Teks quote tidak boleh kosong.",
        "error"
      );

      return;
    }

    try {
      const quoteRef = doc(
        myQuotesCollection,
        editingQuote.id
      );

      await updateDoc(quoteRef, {
        text: editingQuote.text.trim(),
        author: editingQuote.author || DEFAULT_AUTHOR,
        updatedAt: serverTimestamp(),
      });

      setQuotes((prevQuotes) =>
        prevQuotes.map((quote) =>
          quote.id === editingQuote.id
            ? {
              ...quote,
              text: editingQuote.text.trim(),
              author:
                editingQuote.author || DEFAULT_AUTHOR,
            }
            : quote
        )
      );

      setEditingQuote(null);

      showNotificationMessage(
        "Quote berhasil diupdate.",
        "success"
      );
    } catch (error) {
      console.error("Error updating quote:", error);

      showNotificationMessage(
        "Gagal mengupdate quote.",
        "error"
      );
    }
  };

  // =========================================================
  // Delete Quote
  // =========================================================

  const handleDelete = async (quoteId) => {
    const isConfirmed = window.confirm(
      "Apakah Anda yakin ingin menghapus quote ini?"
    );

    if (!isConfirmed) return;

    try {
      await deleteDoc(doc(myQuotesCollection, quoteId));

      setQuotes((prevQuotes) =>
        prevQuotes.filter((quote) => quote.id !== quoteId)
      );

      showNotificationMessage(
        "Quote berhasil dihapus.",
        "success"
      );
    } catch (error) {
      console.error("Error deleting quote:", error);

      showNotificationMessage(
        "Gagal menghapus quote.",
        "error"
      );
    }
  };

  // =========================================================
  // Delete All Quotes
  // =========================================================

  const handleDeleteAll = async () => {
    setIsDeletingAll(true);

    try {
      const querySnapshot = await getDocs(myQuotesCollection);

      const deletePromises = querySnapshot.docs.map((quoteDoc) =>
        deleteDoc(quoteDoc.ref)
      );

      await Promise.all(deletePromises);

      setQuotes([]);
      setShowDeleteConfirm(false);

      showNotificationMessage(
        "Berhasil menghapus semua quotes.",
        "success"
      );
    } catch (error) {
      console.error("Error deleting all quotes:", error);

      showNotificationMessage(
        "Gagal menghapus semua quotes.",
        "error"
      );
    } finally {
      setIsDeletingAll(false);
    }
  };

  // =========================================================
  // Add Quote
  // =========================================================

  const handleAddQuote = async (event) => {
    event.preventDefault();

    if (!newQuote.text.trim()) {
      showNotificationMessage(
        "Teks quote harus diisi.",
        "error"
      );

      return;
    }

    setIsLoading(true);

    try {
      const quoteText = newQuote.text.trim();

      const docRef = await addDoc(myQuotesCollection, {
        text: quoteText,
        author: DEFAULT_AUTHOR,
        category: "",
        status: "approved",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        likes: 0,
        views: 0,
      });

      const historyEntry = {
        id: docRef.id,
        text: quoteText,
        author: DEFAULT_AUTHOR,
        timestamp: new Date().toISOString(),
      };

      setHistory((prevHistory) =>
        [historyEntry, ...prevHistory].slice(0, 20)
      );

      const newQuoteData = {
        id: docRef.id,
        text: quoteText,
        author: DEFAULT_AUTHOR,
        category: "",
        status: "approved",
        likes: 0,
        views: 0,
      };

      setQuotes((prevQuotes) => [
        newQuoteData,
        ...prevQuotes,
      ]);

      setNewQuote({
        text: "",
      });

      setIsAddPopupOpen(false);

      showNotificationMessage(
        "Quote berhasil ditambahkan.",
        "success"
      );
    } catch (error) {
      console.error("Error adding quote:", error);

      showNotificationMessage(
        "Gagal menambahkan quote.",
        "error"
      );
    } finally {
      setIsLoading(false);
    }
  };

  // =========================================================
  // Import Excel
  // =========================================================

  const handleFileUpload = (file) => {
    if (!file) return;

    setImportFile(file);
    setImportErrors([]);

    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target.result);

        const workbook = XLSX.read(data, {
          type: "array",
        });

        const firstSheet =
          workbook.Sheets[workbook.SheetNames[0]];

        const jsonData = XLSX.utils.sheet_to_json(firstSheet);

        const previewData = jsonData
          .map((row, index) => {
            const quoteKey = Object.keys(row).find((key) => {
              const normalizedKey = key.toLowerCase();

              return (
                normalizedKey.includes("quote") ||
                normalizedKey.includes("text") ||
                normalizedKey.includes("kutipan")
              );
            });

            const quoteText = quoteKey ? row[quoteKey] : "";

            return {
              id: `preview-${index}`,
              text: quoteText?.toString().trim() || "",
              author: DEFAULT_AUTHOR,
              originalRow: row,
            };
          })
          .filter((item) => item.text !== "");

        setImportPreview(previewData);

        if (previewData.length === 0) {
          setImportErrors([
            "Tidak ada quote valid yang ditemukan di file.",
          ]);
        }
      } catch (error) {
        console.error("Error parsing file:", error);

        setImportErrors([
          "Gagal membaca file. Pastikan format file benar.",
        ]);
      }
    };

    reader.readAsArrayBuffer(file);
  };

  // =========================================================
  // Download Sample Excel
  // =========================================================

  const downloadSampleExcel = () => {
    const sampleData = [
      {
        quote: "Hidup adalah perjuangan yang indah",
      },
      {
        quote: "Jangan pernah menyerah pada mimpi",
      },
      {
        quote: "Kesuksesan dimulai dari langkah kecil",
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(sampleData);
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      "Quotes"
    );

    XLSX.writeFile(workbook, "sample_quotes.xlsx");
  };

  // =========================================================
  // Export Quotes
  // =========================================================

  const handleExportQuotes = () => {
    if (filteredQuotes.length === 0) {
      showNotificationMessage(
        "Tidak ada quotes untuk diexport.",
        "error"
      );

      return;
    }

    setIsExporting(true);

    try {
      const exportData = filteredQuotes.map((quote, index) => ({
        No: index + 1,
        Quote: quote.text || "",
        Author: quote.author || DEFAULT_AUTHOR,
        Status: quote.status || "pending",
        Marked: quote.status === "marked" ? "Yes" : "No",
        Likes: quote.likes || 0,
        Views: quote.views || 0,
        "Created At": quote.createdAt?.toDate
          ? quote.createdAt.toDate().toLocaleString()
          : quote.createdAt
            ? new Date(quote.createdAt).toLocaleString()
            : "",
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);

      worksheet["!cols"] = [
        { wch: 5 },
        { wch: 60 },
        { wch: 20 },
        { wch: 14 },
        { wch: 10 },
        { wch: 10 },
        { wch: 10 },
        { wch: 24 },
      ];

      const workbook = XLSX.utils.book_new();

      XLSX.utils.book_append_sheet(
        workbook,
        worksheet,
        "Quotes"
      );

      const date = new Date();

      const dateString = `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, "0")}-${String(date.getDate()).padStart(
        2,
        "0"
      )}`;

      XLSX.writeFile(
        workbook,
        `quotes_export_${dateString}.xlsx`
      );

      showNotificationMessage(
        `Berhasil export ${filteredQuotes.length} quotes.`,
        "success"
      );
    } catch (error) {
      console.error("Error exporting quotes:", error);

      showNotificationMessage(
        "Gagal mengexport quotes.",
        "error"
      );
    } finally {
      setIsExporting(false);
    }
  };

  // =========================================================
  // Submit Import
  // =========================================================

  const handleImportSubmit = async () => {
    if (importPreview.length === 0) {
      showNotificationMessage(
        "Tidak ada quote valid untuk diimport.",
        "error"
      );

      return;
    }

    setIsImporting(true);

    let successCount = 0;
    let failCount = 0;

    const addedQuotes = [];
    const importedHistory = [];

    for (const quote of importPreview) {
      try {
        const docRef = await addDoc(myQuotesCollection, {
          text: quote.text,
          author: DEFAULT_AUTHOR,
          category: "",
          status: "approved",
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          likes: 0,
          views: 0,
        });

        addedQuotes.push({
          id: docRef.id,
          text: quote.text,
          author: DEFAULT_AUTHOR,
          category: "",
          status: "approved",
          likes: 0,
          views: 0,
        });

        importedHistory.push({
          id: docRef.id,
          text: quote.text,
          author: DEFAULT_AUTHOR,
          timestamp: new Date().toISOString(),
          imported: true,
        });

        successCount++;
      } catch (error) {
        console.error("Error importing quote:", error);
        failCount++;
      }
    }

    if (addedQuotes.length > 0) {
      setQuotes((prevQuotes) => [
        ...addedQuotes,
        ...prevQuotes,
      ]);

      setHistory((prevHistory) =>
        [...importedHistory, ...prevHistory].slice(0, 20)
      );
    }

    showNotificationMessage(
      `Berhasil import ${successCount} quotes${failCount > 0 ? `, ${failCount} gagal` : ""
      }.`,
      successCount > 0 ? "success" : "error"
    );

    closeImportPopup();
    setIsImporting(false);
  };

  // =========================================================
  // Close Import Popup
  // =========================================================

  const closeImportPopup = () => {
    setIsImportPopupOpen(false);
    setImportPreview([]);
    setImportFile(null);
    setImportErrors([]);
  };

  // =========================================================
  // Clear History
  // =========================================================

  const clearHistory = () => {
    const isConfirmed = window.confirm(
      "Hapus semua history?"
    );

    if (!isConfirmed) return;

    setHistory([]);
    localStorage.removeItem("quoteAddHistory");

    showNotificationMessage(
      "History berhasil dihapus.",
      "success"
    );
  };

  // =========================================================
  // Format Date
  // =========================================================

  const formatDate = (dateValue) => {
    if (!dateValue) return "-";

    try {
      if (dateValue?.toDate) {
        return dateValue.toDate().toLocaleDateString("id-ID", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        });
      }

      return new Date(dateValue).toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return "-";
    }
  };

  // =========================================================
  // Desktop Skeleton
  // =========================================================

  const renderDesktopSkeleton = () => {
    return Array.from({ length: 6 }).map((_, index) => (
      <tr key={`desktop-skeleton-${index}`}>
        <td className="px-5 py-5 align-top">
          <div className="h-4 w-5 animate-pulse bg-gray-200" />
        </td>

        <td className="px-4 py-5 align-top">
          <div className="space-y-2">
            <div className="h-3.5 w-[90%] animate-pulse bg-gray-200" />
            <div className="h-3.5 w-[75%] animate-pulse bg-gray-200" />
            <div className="h-3.5 w-[45%] animate-pulse bg-gray-200" />

            <div className="mt-3 h-3 w-32 animate-pulse bg-gray-100" />
          </div>
        </td>

        <td className="px-4 py-5 align-top">
          <div className="h-4 w-20 animate-pulse bg-gray-200" />
        </td>

        <td className="px-4 py-5 align-top">
          <div className="h-8 w-24 animate-pulse bg-gray-200" />
        </td>

        <td className="px-4 py-5 align-top">
          <div className="flex gap-2">
            <div className="h-8 w-20 animate-pulse bg-gray-200" />
            <div className="h-8 w-16 animate-pulse bg-gray-200" />
          </div>
        </td>

        <td className="px-4 py-5 align-top">
          <div className="flex justify-center gap-1">
            <div className="h-8 w-8 animate-pulse bg-gray-200" />
            <div className="h-8 w-8 animate-pulse bg-gray-200" />
          </div>
        </td>
      </tr>
    ));
  };

  // =========================================================
  // Mobile Skeleton
  // =========================================================

  const renderMobileSkeleton = () => {
    return Array.from({ length: 4 }).map((_, index) => (
      <div
        key={`mobile-skeleton-${index}`}
        className="border border-[#e5eaf0] bg-white shadow-sm"
      >
        <div className="flex items-center justify-between border-b border-[#edf0f4] px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 animate-pulse bg-gray-200" />
            <div className="h-3.5 w-20 animate-pulse bg-gray-200" />
          </div>

          <div className="h-6 w-20 animate-pulse bg-gray-200" />
        </div>

        <div className="space-y-2 px-4 py-4">
          <div className="h-3.5 w-full animate-pulse bg-gray-200" />
          <div className="h-3.5 w-[90%] animate-pulse bg-gray-200" />
          <div className="h-3.5 w-[65%] animate-pulse bg-gray-200" />

          <div className="mt-4 h-3 w-36 animate-pulse bg-gray-100" />
        </div>

        <div className="border-t border-[#edf0f4] bg-[#fbfcfe] p-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="h-10 animate-pulse bg-gray-200" />
            <div className="h-10 animate-pulse bg-gray-200" />
          </div>

          <div className="mt-2 grid grid-cols-3 gap-2">
            <div className="h-9 animate-pulse bg-gray-200" />
            <div className="h-9 animate-pulse bg-gray-200" />
            <div className="h-9 animate-pulse bg-gray-200" />
          </div>
        </div>
      </div>
    ));
  };

  // =========================================================
  // Render
  // =========================================================

  return (
    <div className="min-h-screen bg-[#f5f7fa] pb-10 text-[#1f2937]">
      {/* =====================================================
          Header
      ===================================================== */}

      <header className="border-b border-white/10 bg-[#355485]">
        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="mb-1 flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center bg-white/10 text-white">
                    <Menu size={19} />
                  </div>

                  <span className="text-xs font-medium uppercase tracking-[0.18em] text-blue-100">
                    Dashboard
                  </span>
                </div>

                <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                  Manage Quotes
                </h1>

                <p className="mt-1 text-sm text-blue-100">
                  Kelola, setujui, edit, dan hapus quotes dengan mudah.
                </p>
              </div>

              <button
                type="button"
                onClick={fetchQuotes}
                className="flex h-10 w-10 shrink-0 items-center justify-center border border-white/20 bg-white/10 text-white transition hover:bg-white/20 active:scale-95"
                title="Refresh data"
                aria-label="Refresh data"
              >
                <RefreshCw
                  size={17}
                  className={isQuotesLoading ? "animate-spin" : ""}
                />
              </button>
            </div>

            {/* Header Actions */}

            <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
              <button
                type="button"
                onClick={() => setIsAddPopupOpen(true)}
                className="flex min-h-10 items-center justify-center gap-2 bg-white px-3 py-2 text-sm font-semibold text-[#355485] transition hover:bg-blue-50 active:scale-[0.98]"
              >
                <Plus size={16} />
                Tambah
              </button>

              <button
                type="button"
                onClick={() => setIsImportPopupOpen(true)}
                className="flex min-h-10 items-center justify-center gap-2 border border-white/25 bg-white/10 px-3 py-2 text-sm font-medium text-white transition hover:bg-white/20 active:scale-[0.98]"
              >
                <UploadCloud size={16} />
                Import
              </button>

              <button
                type="button"
                onClick={handleExportQuotes}
                disabled={
                  isExporting ||
                  isQuotesLoading ||
                  filteredQuotes.length === 0
                }
                className="flex min-h-10 items-center justify-center gap-2 border border-white/25 bg-white/10 px-3 py-2 text-sm font-medium text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.98]"
              >
                {isExporting ? (
                  <Loader2
                    size={16}
                    className="animate-spin"
                  />
                ) : (
                  <Download size={16} />
                )}

                {isExporting ? "Export..." : "Export"}
              </button>

              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={
                  quotes.length === 0 ||
                  isQuotesLoading ||
                  isDeletingAll
                }
                className="flex min-h-10 items-center justify-center gap-2 border border-red-300/30 bg-red-500/20 px-3 py-2 text-sm font-medium text-red-50 transition hover:bg-red-500/30 disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.98]"
              >
                {isDeletingAll ? (
                  <Loader2
                    size={16}
                    className="animate-spin"
                  />
                ) : (
                  <Trash2 size={16} />
                )}

                {isDeletingAll
                  ? "Menghapus..."
                  : "Hapus Semua"}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* =====================================================
          Notification
      ===================================================== */}

      {notification && (
        <div
          className={`fixed left-4 right-4 top-4 z-[100] flex items-start gap-3 border px-4 py-3 shadow-xl sm:left-auto sm:max-w-sm ${notification.type === "error"
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-emerald-200 bg-emerald-50 text-emerald-700"
            }`}
        >
          {notification.type === "error" ? (
            <AlertTriangle
              size={18}
              className="mt-0.5 shrink-0"
            />
          ) : (
            <CheckCircle2
              size={18}
              className="mt-0.5 shrink-0"
            />
          )}

          <p className="flex-1 text-sm font-medium">
            {notification.message}
          </p>

          <button
            type="button"
            onClick={() => setNotification(null)}
            className="shrink-0 opacity-60 transition hover:opacity-100"
            aria-label="Tutup notifikasi"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* =====================================================
          Main Content
      ===================================================== */}

      <main className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
        {/* Search and Filter */}

        <section className="mb-5 border border-[#e5eaf0] bg-white p-3 shadow-sm sm:p-4">
          <div className="flex flex-col gap-3 lg:flex-row">
            <div className="relative flex-1">
              <Search
                size={18}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]"
              />

              <input
                type="search"
                value={searchTerm}
                onChange={(event) =>
                  setSearchTerm(event.target.value)
                }
                placeholder="Cari quote atau author..."
                className="h-11 w-full border border-[#e1e6ed] bg-[#fbfcfe] pl-10 pr-4 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-[#4f90c6] focus:bg-white"
              />
            </div>

            <div className="relative lg:w-52">
              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value)
                }
                className="h-11 w-full appearance-none border border-[#e1e6ed] bg-[#fbfcfe] px-3 pr-9 text-sm text-gray-700 outline-none transition focus:border-[#4f90c6] focus:bg-white"
              >
                <option value="all">Semua Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="marked">Marked</option>
              </select>

              <ChevronDown
                size={16}
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
            </div>
          </div>

          <div className="mt-3 flex flex-col gap-1 border-t border-[#edf0f4] pt-3 text-xs text-gray-500 sm:flex-row sm:items-center sm:justify-between">
            <p>
              Menampilkan{" "}
              <strong className="text-gray-700">
                {isQuotesLoading ? "..." : filteredQuotes.length}
              </strong>{" "}
              dari{" "}
              <strong className="text-gray-700">
                {isQuotesLoading ? "..." : quotes.length}
              </strong>{" "}
              quotes
            </p>

            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="flex w-fit items-center gap-1 text-[#355485] hover:underline"
              >
                <X size={13} />
                Reset pencarian
              </button>
            )}
          </div>
        </section>

        {/* ===================================================
            Desktop Table
        =================================================== */}

        <section className="hidden border border-[#e5eaf0] bg-white shadow-sm lg:block">
          <div className="flex items-center justify-between border-b border-[#e5eaf0] px-5 py-4">
            <div>
              <h2 className="text-base font-bold text-gray-800">
                Daftar Quotes
              </h2>

              <p className="mt-0.5 text-xs text-gray-500">
                Kelola status dan tindakan setiap quote.
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span className="h-2 w-2 bg-amber-400" />
              Pending perlu ditinjau
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left">
              <thead className="border-b border-[#e5eaf0] bg-[#f8fafc]">
                <tr>
                  <th className="w-14 px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-gray-500">
                    No
                  </th>

                  <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-gray-500">
                    Quote
                  </th>

                  <th className="w-36 px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-gray-500">
                    Author
                  </th>

                  <th className="w-36 px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-gray-500">
                    Status
                  </th>

                  <th className="w-40 px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-gray-500">
                    Aksi Cepat
                  </th>

                  <th className="w-24 px-4 py-3 text-center text-[11px] font-bold uppercase tracking-wider text-gray-500">
                    Kelola
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#edf0f4]">
                {isQuotesLoading ? (
                  renderDesktopSkeleton()
                ) : filteredQuotes.length > 0 ? (
                  filteredQuotes.map((quote, index) => (
                    <tr
                      key={quote.id}
                      className={`transition hover:bg-[#fbfcfe] ${quote.status === "pending"
                          ? "bg-amber-50/30"
                          : ""
                        }`}
                    >
                      <td className="px-5 py-4 align-top text-sm text-gray-400">
                        {index + 1}
                      </td>

                      <td className="max-w-[440px] px-4 py-4 align-top">
                        <p className="line-clamp-3 text-sm leading-6 text-gray-800">
                          “{quote.text}”
                        </p>

                        <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-gray-400">
                          <span>{quote.likes || 0} likes</span>
                          <span>{quote.views || 0} views</span>

                          {quote.createdAt && (
                            <span>
                              {formatDate(quote.createdAt)}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-4 align-top">
                        <span className="text-sm font-medium text-gray-600">
                          @{quote.author || DEFAULT_AUTHOR}
                        </span>
                      </td>

                      <td className="px-4 py-4 align-top">
                        <div className="relative w-fit">
                          <select
                            value={quote.status || "pending"}
                            onChange={(event) =>
                              handleStatusChange(
                                quote.id,
                                event.target.value
                              )
                            }
                            className={`h-8 appearance-none border py-1 pl-8 pr-7 text-xs font-semibold outline-none ${getStatusStyle(
                              quote.status
                            )}`}
                          >
                            <option value="pending">
                              Pending
                            </option>

                            <option value="approved">
                              Approved
                            </option>

                            <option value="rejected">
                              Rejected
                            </option>

                            <option value="marked">
                              Marked
                            </option>
                          </select>

                          <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2">
                            {getStatusIcon(quote.status)}
                          </span>

                          <ChevronDown
                            size={13}
                            className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2"
                          />
                        </div>
                      </td>

                      <td className="px-4 py-4 align-top">
                        <div className="flex flex-wrap gap-1.5">
                          {quote.status !== "approved" && (
                            <button
                              type="button"
                              onClick={() =>
                                handleApprove(quote.id)
                              }
                              className="flex h-8 items-center gap-1.5 border border-emerald-200 bg-emerald-50 px-2.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 active:scale-95"
                              title="Setujui quote"
                            >
                              <Check size={14} />
                              Setujui
                            </button>
                          )}

                          {quote.status !== "rejected" && (
                            <button
                              type="button"
                              onClick={() =>
                                handleReject(quote.id)
                              }
                              className="flex h-8 items-center gap-1.5 border border-red-200 bg-red-50 px-2.5 text-xs font-semibold text-red-700 transition hover:bg-red-100 active:scale-95"
                              title="Tolak quote"
                            >
                              <XCircle size={14} />
                              Tolak
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() =>
                              handleMarkToggle(
                                quote.id,
                                quote.status
                              )
                            }
                            className={`flex h-8 items-center gap-1.5 border px-2.5 text-xs font-semibold transition active:scale-95 ${quote.status === "marked"
                                ? "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
                                : "border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100"
                              }`}
                            title="Tandai quote"
                          >
                            {quote.status === "marked" ? (
                              <BookmarkCheck size={14} />
                            ) : (
                              <Bookmark size={14} />
                            )}

                            {quote.status === "marked"
                              ? "Ditandai"
                              : "Tandai"}
                          </button>
                        </div>
                      </td>

                      <td className="px-4 py-4 align-top">
                        <div className="flex justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleEdit(quote)}
                            className="flex h-8 w-8 items-center justify-center border border-gray-200 text-gray-500 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 active:scale-95"
                            title="Edit quote"
                            aria-label="Edit quote"
                          >
                            <Edit3 size={15} />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDelete(quote.id)}
                            className="flex h-8 w-8 items-center justify-center border border-gray-200 text-gray-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700 active:scale-95"
                            title="Hapus quote"
                            aria-label="Hapus quote"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-5 py-16 text-center"
                    >
                      <Inbox
                        size={42}
                        className="mx-auto mb-3 text-gray-300"
                      />

                      <p className="text-sm font-medium text-gray-500">
                        Tidak ada quotes yang ditemukan.
                      </p>

                      <button
                        type="button"
                        onClick={() => setIsAddPopupOpen(true)}
                        className="mt-3 text-sm font-semibold text-[#355485] hover:underline"
                      >
                        Tambah quote pertama
                      </button>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* ===================================================
            Mobile Quote Cards
        =================================================== */}

        <section className="space-y-3 lg:hidden">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-gray-800">
                Daftar Quotes
              </h2>

              <p className="mt-0.5 text-xs text-gray-500">
                Tekan tombol untuk mengelola quote.
              </p>
            </div>

            <span className="text-xs font-medium text-gray-400">
              {isQuotesLoading
                ? "Memuat..."
                : `${filteredQuotes.length} item`}
            </span>
          </div>

          {isQuotesLoading ? (
            renderMobileSkeleton()
          ) : filteredQuotes.length > 0 ? (
            filteredQuotes.map((quote, index) => (
              <article
                key={quote.id}
                className={`border bg-white shadow-sm ${quote.status === "pending"
                    ? "border-amber-200"
                    : "border-[#e5eaf0]"
                  }`}
              >
                {/* Card Header */}

                <div className="flex items-center justify-between gap-3 border-b border-[#edf0f4] px-4 py-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center bg-[#f1f5f9] text-xs font-bold text-gray-500">
                      {index + 1}
                    </span>

                    <span className="truncate text-xs font-medium text-gray-500">
                      @{quote.author || DEFAULT_AUTHOR}
                    </span>
                  </div>

                  <span
                    className={`flex shrink-0 items-center gap-1.5 border px-2 py-1 text-[10px] font-bold uppercase tracking-wide ${getStatusStyle(
                      quote.status
                    )}`}
                  >
                    {getStatusIcon(quote.status)}
                    {getStatusLabel(quote.status)}
                  </span>
                </div>

                {/* Quote Content */}

                <div className="px-4 py-4">
                  <p className="text-[15px] leading-7 text-gray-800">
                    “{quote.text}”
                  </p>

                  <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-gray-400">
                    <span>{quote.likes || 0} likes</span>
                    <span>{quote.views || 0} views</span>

                    {quote.createdAt && (
                      <span>
                        {formatDate(quote.createdAt)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Quick Actions */}

                <div className="border-t border-[#edf0f4] bg-[#fbfcfe] p-3">
                  <div className="grid grid-cols-2 gap-2">
                    {quote.status !== "approved" ? (
                      <button
                        type="button"
                        onClick={() =>
                          handleApprove(quote.id)
                        }
                        className="flex h-10 items-center justify-center gap-2 border border-emerald-200 bg-emerald-50 text-xs font-bold text-emerald-700 transition hover:bg-emerald-100 active:scale-[0.98]"
                      >
                        <Check size={16} />
                        Setujui
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() =>
                          handleStatusChange(
                            quote.id,
                            "pending"
                          )
                        }
                        className="flex h-10 items-center justify-center gap-2 border border-amber-200 bg-amber-50 text-xs font-bold text-amber-700 transition hover:bg-amber-100 active:scale-[0.98]"
                      >
                        <Clock3 size={16} />
                        Pending
                      </button>
                    )}

                    {quote.status !== "rejected" ? (
                      <button
                        type="button"
                        onClick={() =>
                          handleReject(quote.id)
                        }
                        className="flex h-10 items-center justify-center gap-2 border border-red-200 bg-red-50 text-xs font-bold text-red-700 transition hover:bg-red-100 active:scale-[0.98]"
                      >
                        <XCircle size={16} />
                        Tolak
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() =>
                          handleApprove(quote.id)
                        }
                        className="flex h-10 items-center justify-center gap-2 border border-emerald-200 bg-emerald-50 text-xs font-bold text-emerald-700 transition hover:bg-emerald-100 active:scale-[0.98]"
                      >
                        <Check size={16} />
                        Setujui
                      </button>
                    )}
                  </div>

                  <div className="mt-2 grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        handleMarkToggle(
                          quote.id,
                          quote.status
                        )
                      }
                      className={`flex h-9 items-center justify-center gap-1.5 border text-[11px] font-semibold transition active:scale-[0.98] ${quote.status === "marked"
                          ? "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
                          : "border-gray-200 bg-white text-gray-600 hover:bg-gray-100"
                        }`}
                    >
                      {quote.status === "marked" ? (
                        <BookmarkCheck size={14} />
                      ) : (
                        <Bookmark size={14} />
                      )}

                      Tandai
                    </button>

                    <button
                      type="button"
                      onClick={() => handleEdit(quote)}
                      className="flex h-9 items-center justify-center gap-1.5 border border-gray-200 bg-white text-[11px] font-semibold text-gray-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 active:scale-[0.98]"
                    >
                      <Edit3 size={14} />
                      Edit
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(quote.id)}
                      className="flex h-9 items-center justify-center gap-1.5 border border-gray-200 bg-white text-[11px] font-semibold text-gray-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700 active:scale-[0.98]"
                    >
                      <Trash2 size={14} />
                      Hapus
                    </button>
                  </div>
                </div>
              </article>
            ))
          ) : (
            <div className="border border-[#e5eaf0] bg-white px-5 py-16 text-center shadow-sm">
              <Inbox
                size={42}
                className="mx-auto mb-3 text-gray-300"
              />

              <p className="text-sm font-medium text-gray-500">
                Tidak ada quotes yang ditemukan.
              </p>

              <button
                type="button"
                onClick={() => setIsAddPopupOpen(true)}
                className="mt-3 text-sm font-semibold text-[#355485] hover:underline"
              >
                Tambah quote pertama
              </button>
            </div>
          )}
        </section>

        {/* ===================================================
            History
        =================================================== */}

        {history.length > 0 && (
          <section className="mt-6 border border-[#e5eaf0] bg-white shadow-sm">
            <div className="flex items-center justify-between gap-3 border-b border-[#e5eaf0] bg-[#f8fafc] px-4 py-3 sm:px-5">
              <div className="flex items-center gap-2">
                <History
                  size={17}
                  className="text-[#355485]"
                />

                <div>
                  <h3 className="text-sm font-bold text-gray-800">
                    History Tambahan
                  </h3>

                  <p className="text-[11px] text-gray-500">
                    {history.length} aktivitas terakhir
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={clearHistory}
                className="flex items-center gap-1.5 text-xs font-semibold text-red-500 transition hover:text-red-700"
              >
                <Trash2 size={14} />
                Hapus
              </button>
            </div>

            <div className="max-h-72 divide-y divide-[#edf0f4] overflow-y-auto">
              {history.map((item) => (
                <div
                  key={item.id}
                  className="px-4 py-3 transition hover:bg-[#fbfcfe] sm:px-5"
                >
                  <p className="line-clamp-2 text-sm leading-6 text-gray-700">
                    “{item.text}”
                  </p>

                  <div className="mt-1.5 flex flex-wrap items-center gap-3 text-[11px] text-gray-400">
                    <span>
                      @{item.author || DEFAULT_AUTHOR}
                    </span>

                    <span>
                      {formatDate(item.timestamp)}
                    </span>

                    {item.imported && (
                      <span className="flex items-center gap-1 text-blue-500">
                        <FileUp size={12} />
                        Imported
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* =====================================================
          Delete All Modal
      ===================================================== */}

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 p-4 backdrop-blur-[2px]">
          <div className="w-full max-w-md border border-gray-200 bg-white shadow-2xl">
            <div className="p-5 sm:p-6">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center bg-red-50 text-red-600">
                  <Trash2 size={21} />
                </div>

                <div>
                  <h2 className="text-lg font-bold text-gray-800">
                    Hapus Semua Quotes?
                  </h2>

                  <p className="mt-0.5 text-xs text-gray-500">
                    Tindakan ini tidak dapat dibatalkan.
                  </p>
                </div>
              </div>

              <p className="text-sm leading-6 text-gray-600">
                Anda akan menghapus{" "}
                <strong className="text-gray-800">
                  {quotes.length} quotes
                </strong>{" "}
                dari database secara permanen.
              </p>

              <div className="mt-6 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="h-11 border border-gray-200 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                >
                  Batal
                </button>

                <button
                  type="button"
                  onClick={handleDeleteAll}
                  disabled={isDeletingAll}
                  className="flex h-11 items-center justify-center gap-2 bg-red-600 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
                >
                  {isDeletingAll && (
                    <Loader2
                      size={16}
                      className="animate-spin"
                    />
                  )}

                  {isDeletingAll
                    ? "Menghapus..."
                    : "Ya, Hapus Semua"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================
          Add Quote Modal
      ===================================================== */}

      {isAddPopupOpen && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 p-4 backdrop-blur-[2px]">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto border border-gray-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#e5eaf0] px-4 py-4 sm:px-5">
              <div>
                <h2 className="text-lg font-bold text-gray-800">
                  Tambah Quote
                </h2>

                <p className="mt-0.5 text-xs text-gray-500">
                  Tambahkan quote baru ke dalam koleksi.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsAddPopupOpen(false)}
                className="flex h-9 w-9 items-center justify-center text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
                aria-label="Tutup"
              >
                <X size={19} />
              </button>
            </div>

            <form
              onSubmit={handleAddQuote}
              className="space-y-4 p-4 sm:p-5"
            >
              <div>
                <label
                  htmlFor="newQuoteText"
                  className="mb-2 block text-sm font-semibold text-gray-700"
                >
                  Teks Quote
                </label>

                <textarea
                  id="newQuoteText"
                  value={newQuote.text}
                  onChange={(event) =>
                    setNewQuote({
                      text: event.target.value,
                    })
                  }
                  placeholder="Tulis quote di sini..."
                  rows={7}
                  required
                  className="w-full resize-none border border-gray-200 bg-[#fbfcfe] px-4 py-3 text-sm leading-6 text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-[#4f90c6] focus:bg-white"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="flex h-11 w-full items-center justify-center gap-2 bg-[#355485] text-sm font-bold text-white transition hover:bg-[#2a436c] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoading && (
                  <Loader2
                    size={17}
                    className="animate-spin"
                  />
                )}

                {isLoading
                  ? "Memproses..."
                  : "Tambah Quote"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================
          Edit Quote Modal
      ===================================================== */}

      {editingQuote && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 p-4 backdrop-blur-[2px]">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto border border-gray-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#e5eaf0] px-4 py-4 sm:px-5">
              <div>
                <h2 className="text-lg font-bold text-gray-800">
                  Edit Quote
                </h2>

                <p className="mt-0.5 text-xs text-gray-500">
                  Perbarui teks quote yang dipilih.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setEditingQuote(null)}
                className="flex h-9 w-9 items-center justify-center text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
                aria-label="Tutup"
              >
                <X size={19} />
              </button>
            </div>

            <form
              onSubmit={handleUpdate}
              className="space-y-4 p-4 sm:p-5"
            >
              <div>
                <label
                  htmlFor="editingQuoteText"
                  className="mb-2 block text-sm font-semibold text-gray-700"
                >
                  Teks Quote
                </label>

                <textarea
                  id="editingQuoteText"
                  value={editingQuote.text}
                  onChange={(event) =>
                    setEditingQuote({
                      ...editingQuote,
                      text: event.target.value,
                    })
                  }
                  rows={7}
                  required
                  className="w-full resize-none border border-gray-200 bg-[#fbfcfe] px-4 py-3 text-sm leading-6 text-gray-800 outline-none transition focus:border-[#4f90c6] focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setEditingQuote(null)}
                  className="h-11 border border-gray-200 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  className="flex h-11 items-center justify-center gap-2 bg-[#355485] text-sm font-bold text-white transition hover:bg-[#2a436c]"
                >
                  <Check size={17} />
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================
          Import Excel Modal
      ===================================================== */}

      {isImportPopupOpen && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 p-4 backdrop-blur-[2px]">
          <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto border border-gray-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#e5eaf0] px-4 py-4 sm:px-5">
              <div>
                <h2 className="text-lg font-bold text-gray-800">
                  Import Quotes
                </h2>

                <p className="mt-0.5 text-xs text-gray-500">
                  Masukkan quotes dari file Excel atau CSV.
                </p>
              </div>

              <button
                type="button"
                onClick={closeImportPopup}
                className="flex h-9 w-9 items-center justify-center text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
                aria-label="Tutup"
              >
                <X size={19} />
              </button>
            </div>

            <div className="space-y-4 p-4 sm:p-5">
              {/* Upload Area */}

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Upload File
                </label>

                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  id="quoteFileUpload"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0];

                    if (file) {
                      handleFileUpload(file);
                    }
                  }}
                />

                <label
                  htmlFor="quoteFileUpload"
                  className="flex cursor-pointer flex-col items-center justify-center border-2 border-dashed border-gray-200 bg-[#fbfcfe] px-4 py-8 text-center transition hover:border-[#4f90c6] hover:bg-blue-50/30"
                >
                  <UploadCloud
                    size={32}
                    className="mb-2 text-gray-400"
                  />

                  <span className="text-sm font-semibold text-gray-600">
                    Klik untuk memilih file
                  </span>

                  <span className="mt-1 text-xs text-gray-400">
                    Mendukung .xlsx, .xls, dan .csv
                  </span>
                </label>

                {importFile && (
                  <div className="mt-2 flex items-center gap-2 border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
                    <FileSpreadsheet size={15} />

                    <span className="truncate">
                      {importFile.name}
                    </span>
                  </div>
                )}
              </div>

              {/* Sample Button */}

              <button
                type="button"
                onClick={downloadSampleExcel}
                className="flex h-10 w-full items-center justify-center gap-2 border border-blue-200 bg-blue-50 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
              >
                <Download size={16} />
                Download Sample Excel
              </button>

              {/* Import Errors */}

              {importErrors.length > 0 && (
                <div className="border border-red-200 bg-red-50 p-3">
                  <div className="flex items-center gap-2 text-sm font-semibold text-red-700">
                    <AlertTriangle size={16} />
                    Terjadi masalah
                  </div>

                  <ul className="mt-2 list-inside list-disc text-xs leading-5 text-red-600">
                    {importErrors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Preview */}

              {importPreview.length > 0 && (
                <div>
                  <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-gray-800">
                        Preview Data
                      </h3>

                      <p className="text-xs text-gray-500">
                        {importPreview.length} quotes ditemukan.
                      </p>
                    </div>

                    <span className="text-xs font-medium text-emerald-600">
                      Status: Approved
                    </span>
                  </div>

                  <div className="max-h-72 overflow-auto border border-gray-200">
                    <table className="w-full min-w-[500px] text-left">
                      <thead className="sticky top-0 border-b border-gray-200 bg-gray-50">
                        <tr>
                          <th className="w-12 px-3 py-2 text-[11px] font-bold uppercase text-gray-500">
                            No
                          </th>

                          <th className="px-3 py-2 text-[11px] font-bold uppercase text-gray-500">
                            Quote
                          </th>

                          <th className="w-36 px-3 py-2 text-[11px] font-bold uppercase text-gray-500">
                            Author
                          </th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-gray-100">
                        {importPreview.map((quote, index) => (
                          <tr key={quote.id}>
                            <td className="px-3 py-3 text-xs text-gray-400">
                              {index + 1}
                            </td>

                            <td className="px-3 py-3">
                              <p className="line-clamp-2 text-xs leading-5 text-gray-700">
                                “{quote.text}”
                              </p>
                            </td>

                            <td className="px-3 py-3 text-xs text-gray-500">
                              @{DEFAULT_AUTHOR}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={closeImportPopup}
                      className="h-11 border border-gray-200 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                    >
                      Batal
                    </button>

                    <button
                      type="button"
                      onClick={handleImportSubmit}
                      disabled={isImporting}
                      className="flex h-11 items-center justify-center gap-2 bg-[#355485] text-sm font-bold text-white transition hover:bg-[#2a436c] disabled:opacity-60"
                    >
                      {isImporting ? (
                        <Loader2
                          size={16}
                          className="animate-spin"
                        />
                      ) : (
                        <FileUp size={16} />
                      )}

                      {isImporting
                        ? "Import..."
                        : `Import ${importPreview.length}`}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =====================================================
          Custom CSS
      ===================================================== */}

      <style>{`
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .line-clamp-3 {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        input[type="search"]::-webkit-search-cancel-button {
          cursor: pointer;
        }

        @media (max-width: 640px) {
          input,
          textarea,
          select,
          button {
            -webkit-tap-highlight-color: transparent;
          }
        }
      `}</style>
    </div>
  );
};

export default ManageQuotes;