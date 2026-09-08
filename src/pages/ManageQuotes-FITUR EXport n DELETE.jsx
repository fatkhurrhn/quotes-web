// ManageQuotes.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { myQuotesCollection } from '../firebase';
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
  collection,
  getDocs as getDocsFirestore
} from 'firebase/firestore';
import * as XLSX from 'xlsx';

const ManageQuotes = () => {
  // Quotes state
  const [quotes, setQuotes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [editingQuote, setEditingQuote] = useState(null);

  // Add quote popup state
  const [isAddPopupOpen, setIsAddPopupOpen] = useState(false);
  const [newQuote, setNewQuote] = useState({ text: '', author: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState(null);

  // Import Excel state
  const [isImportPopupOpen, setIsImportPopupOpen] = useState(false);
  const [importPreview, setImportPreview] = useState([]);
  const [importFile, setImportFile] = useState(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importErrors, setImportErrors] = useState([]);

  // Export state
  const [isExporting, setIsExporting] = useState(false);

  // Delete all state
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // History state
  const [history, setHistory] = useState([]);
  const [selectedAuthor, setSelectedAuthor] = useState('');

  // Load history from localStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem('quoteAddHistory');
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('quoteAddHistory', JSON.stringify(history));
  }, [history]);

  // Fetch quotes from Firestore
  useEffect(() => {
    const fetchQuotes = async () => {
      try {
        let q;
        if (statusFilter === 'all') {
          q = query(myQuotesCollection, orderBy('createdAt', 'desc'));
        } else {
          q = query(
            myQuotesCollection,
            where('status', '==', statusFilter),
            orderBy('createdAt', 'desc')
          );
        }
        const querySnapshot = await getDocs(q);
        const quotesData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setQuotes(quotesData);
      } catch (error) {
        console.error("Error fetching quotes: ", error);
      }
    };
    fetchQuotes();
  }, [statusFilter]);

  const filteredQuotes = quotes.filter(quote => {
    const matchesSearch = searchTerm === '' ||
      quote.text?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quote.author?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  // Handle status change
  const handleStatusChange = async (quoteId, newStatus) => {
    try {
      const quoteRef = doc(myQuotesCollection, quoteId);
      await updateDoc(quoteRef, { status: newStatus, updatedAt: new Date() });

      setQuotes(quotes.map(quote =>
        quote.id === quoteId ? { ...quote, status: newStatus } : quote
      ));

      showNotificationMessage(`Status berhasil diubah menjadi ${newStatus}!`, 'success');
    } catch (error) {
      console.error("Error updating quote status: ", error);
      showNotificationMessage('Gagal mengubah status', 'error');
    }
  };

  const handleEdit = (quote) => setEditingQuote(quote);

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const quoteRef = doc(myQuotesCollection, editingQuote.id);
      await updateDoc(quoteRef, {
        text: editingQuote.text,
        author: editingQuote.author,
        updatedAt: new Date()
      });
      setQuotes(quotes.map(quote =>
        quote.id === editingQuote.id ? editingQuote : quote
      ));
      setEditingQuote(null);
      showNotificationMessage('Quote berhasil diupdate!', 'success');
    } catch (error) {
      console.error("Error updating quote: ", error);
      showNotificationMessage('Gagal mengupdate quote', 'error');
    }
  };

  const handleDelete = async (quoteId) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus quote ini?")) {
      try {
        await deleteDoc(doc(myQuotesCollection, quoteId));
        setQuotes(quotes.filter(quote => quote.id !== quoteId));
        showNotificationMessage('Quote berhasil dihapus!', 'success');
      } catch (error) {
        console.error("Error deleting quote: ", error);
        showNotificationMessage('Gagal menghapus quote', 'error');
      }
    }
  };

  // Delete all quotes
  const handleDeleteAll = async () => {
    setIsDeletingAll(true);
    try {
      // Get all quotes
      const querySnapshot = await getDocs(myQuotesCollection);
      const deletePromises = querySnapshot.docs.map(doc =>
        deleteDoc(doc.ref)
      );

      await Promise.all(deletePromises);

      setQuotes([]);
      setShowDeleteConfirm(false);
      showNotificationMessage(`Berhasil menghapus semua quotes!`, 'success');
    } catch (error) {
      console.error("Error deleting all quotes: ", error);
      showNotificationMessage('Gagal menghapus semua quotes', 'error');
    } finally {
      setIsDeletingAll(false);
    }
  };

  const handleAddQuote = async (e) => {
    e.preventDefault();
    if (!newQuote.text.trim() || !newQuote.author.trim()) {
      showNotificationMessage('Text dan Author harus diisi!', 'error');
      return;
    }

    setIsLoading(true);
    try {
      const docRef = await addDoc(myQuotesCollection, {
        text: newQuote.text.trim(),
        author: newQuote.author.trim(),
        status: "approved",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        likes: 0,
        views: 0,
      });

      const historyEntry = {
        id: docRef.id,
        text: newQuote.text.trim(),
        author: newQuote.author.trim(),
        timestamp: new Date().toISOString()
      };
      setHistory(prev => [historyEntry, ...prev].slice(0, 20));

      const newQuoteData = {
        id: docRef.id,
        text: newQuote.text.trim(),
        author: newQuote.author.trim(),
        status: "approved"
      };
      setQuotes(prev => [newQuoteData, ...prev]);

      setNewQuote({ text: '', author: '' });
      setSelectedAuthor('');
      setIsAddPopupOpen(false);
      showNotificationMessage('Quote berhasil ditambahkan!', 'success');
    } catch (error) {
      console.error("Error adding quote: ", error);
      showNotificationMessage('Gagal menambahkan quote', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = (file) => {
    setImportFile(file);
    setImportErrors([]);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet);

        const previewData = jsonData.map((row, index) => {
          const quoteKey = Object.keys(row).find(key =>
            key.toLowerCase().includes('quote') || key.toLowerCase().includes('text')
          );
          const authorKey = Object.keys(row).find(key =>
            key.toLowerCase().includes('author') || key.toLowerCase().includes('penulis')
          );

          const quoteText = quoteKey ? row[quoteKey] : '';
          const author = authorKey ? row[authorKey] : 'Anonymous';

          return {
            id: `preview-${index}`,
            text: quoteText?.toString().trim() || '',
            author: author?.toString().trim() || 'Anonymous',
            originalRow: row,
          };
        }).filter(item => item.text !== '');

        setImportPreview(previewData);
        if (previewData.length === 0) {
          setImportErrors(['Tidak ada quote valid yang ditemukan di file.']);
        }
      } catch (error) {
        console.error("Error parsing file: ", error);
        setImportErrors(['Gagal membaca file. Pastikan format file benar.']);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Download sample Excel
  const downloadSampleExcel = () => {
    const sampleData = [
      { quote: "Hidup adalah perjuangan yang indah", author: "storythur" },
      { quote: "Jangan pernah menyerah pada mimpi", author: "fatkhurrhn" },
      { quote: "Kesuksesan dimulai dari langkah kecil", author: "motivasi_quran" }
    ];

    const ws = XLSX.utils.json_to_sheet(sampleData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Quotes");
    XLSX.writeFile(wb, "sample_quotes.xlsx");
  };

  // Export quotes to Excel
  const handleExportQuotes = () => {
    if (filteredQuotes.length === 0) {
      showNotificationMessage('Tidak ada quotes untuk diexport!', 'error');
      return;
    }

    setIsExporting(true);
    try {
      // Prepare data for export
      const exportData = filteredQuotes.map((quote, index) => ({
        'No': index + 1,
        'Quote': quote.text || '',
        'Author': quote.author || 'Anonymous',
        'Status': quote.status || 'pending',
        'Likes': quote.likes || 0,
        'Views': quote.views || 0,
        'Created At': quote.createdAt?.toDate ?
          quote.createdAt.toDate().toLocaleString() :
          (quote.createdAt ? new Date(quote.createdAt).toLocaleString() : ''),
        'Updated At': quote.updatedAt?.toDate ?
          quote.updatedAt.toDate().toLocaleString() :
          (quote.updatedAt ? new Date(quote.updatedAt).toLocaleString() : '')
      }));

      // Create worksheet
      const ws = XLSX.utils.json_to_sheet(exportData);

      // Set column widths
      ws['!cols'] = [
        { wch: 5 },   // No
        { wch: 50 },  // Quote
        { wch: 20 },  // Author
        { wch: 12 },  // Status
        { wch: 8 },   // Likes
        { wch: 8 },   // Views
        { wch: 22 },  // Created At
        { wch: 22 }   // Updated At
      ];

      // Create workbook
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Quotes");

      // Generate filename with date
      const date = new Date();
      const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      const filename = `quotes_export_${dateStr}.xlsx`;

      // Download file
      XLSX.writeFile(wb, filename);

      showNotificationMessage(`Berhasil export ${filteredQuotes.length} quotes!`, 'success');
    } catch (error) {
      console.error("Error exporting quotes: ", error);
      showNotificationMessage('Gagal mengexport quotes', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportSubmit = async () => {
    if (importPreview.length === 0) {
      showNotificationMessage('Tidak ada quote valid untuk diimport', 'error');
      return;
    }

    setIsImporting(true);
    let successCount = 0;
    let failCount = 0;
    const addedQuotes = [];

    for (const quote of importPreview) {
      try {
        const docRef = await addDoc(myQuotesCollection, {
          text: quote.text,
          author: quote.author,
          status: "approved",
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          likes: 0,
          views: 0,
        });

        const historyEntry = {
          id: docRef.id,
          text: quote.text,
          author: quote.author,
          timestamp: new Date().toISOString(),
          imported: true
        };
        setHistory(prev => [historyEntry, ...prev].slice(0, 20));

        addedQuotes.push({
          id: docRef.id,
          text: quote.text,
          author: quote.author,
          status: "approved"
        });

        successCount++;
      } catch (error) {
        console.error("Error adding quote: ", error);
        failCount++;
      }
    }

    if (addedQuotes.length > 0) {
      setQuotes(prev => [...addedQuotes, ...prev]);
    }

    showNotificationMessage(`Berhasil import ${successCount} quotes${failCount > 0 ? `, ${failCount} gagal` : ''}`, successCount > 0 ? 'success' : 'error');

    setIsImportPopupOpen(false);
    setImportPreview([]);
    setImportFile(null);
    setImportErrors([]);
    setIsImporting(false);
  };

  const showNotificationMessage = (message, type) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleAuthorSelect = (authorName) => {
    setSelectedAuthor(authorName);
    setNewQuote(prev => ({ ...prev, author: authorName }));
  };

  const clearHistory = () => {
    if (window.confirm('Hapus semua history?')) {
      setHistory([]);
      localStorage.removeItem('quoteAddHistory');
      showNotificationMessage('History berhasil dihapus!', 'success');
    }
  };

  const getStatusStyle = (status) => {
    const styles = {
      approved: 'bg-green-100 text-green-700',
      pending: 'bg-yellow-100 text-yellow-700',
      rejected: 'bg-red-100 text-red-700',
      marked: 'bg-blue-100 text-blue-700'
    };
    return styles[status] || styles.pending;
  };

  return (
    <div className="min-h-screen bg-[#f9fafb] pb-16">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1e3a5f] via-[#2a436c] to-[#355485] pt-10 pb-6 rounded-b-3xl shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white mb-0.5">Manage Quotes</h1>
              <p className="text-[#cbdde9] text-xs">Kelola semua quotes di aplikasi</p>
            </div>
            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
              <button
                onClick={() => setShowDeleteConfirm(true)}
                disabled={quotes.length === 0 || isDeletingAll}
                className="flex-1 sm:flex-none items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition disabled:opacity-50 flex"
              >
                {isDeletingAll ? (
                  <><i className="ri-loader-4-line animate-spin"></i> Menghapus...</>
                ) : (
                  <><i className="ri-delete-bin-2-line"></i> Hapus Semua</>
                )}
              </button>
              <button
                onClick={handleExportQuotes}
                disabled={isExporting || filteredQuotes.length === 0}
                className="flex-1 sm:flex-none items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-white bg-green-600 hover:bg-green-700 transition disabled:opacity-50 flex"
              >
                {isExporting ? (
                  <><i className="ri-loader-4-line animate-spin"></i> Exporting...</>
                ) : (
                  <><i className="ri-download-2-line"></i> Export</>
                )}
              </button>
              <button
                onClick={() => setIsImportPopupOpen(true)}
                className="flex-1 sm:flex-none items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-white bg-white/10 backdrop-blur-sm hover:bg-white/20 border border-white/20 transition flex"
              >
                <i className="ri-upload-2-line"></i>
                Import
              </button>
              <button
                onClick={() => setIsAddPopupOpen(true)}
                className="flex-1 sm:flex-none items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-[#355485] bg-white hover:bg-gray-100 shadow-md transition flex"
              >
                <i className="ri-add-line"></i>
                Tambah
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Notification */}
      {notification && (
        <div className={`fixed top-20 left-4 right-4 sm:right-4 sm:left-auto z-50 px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 transition-all animate-slide-down ${notification.type === 'error' ? 'bg-red-500 text-white' : 'bg-green-500 text-white'
          }`}>
          <i className={`${notification.type === 'error' ? 'ri-error-warning-line' : 'ri-checkbox-circle-line'} text-xl`}></i>
          <span className="text-sm">{notification.message}</span>
        </div>
      )}

      {/* Delete All Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center justify-center mb-4">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                  <i className="ri-delete-bin-2-line text-3xl text-red-600"></i>
                </div>
              </div>
              <h2 className="text-xl font-bold text-center text-gray-800 mb-2">Hapus Semua Quotes?</h2>
              <p className="text-sm text-gray-600 text-center mb-6">
                Anda yakin ingin menghapus semua <strong>{quotes.length}</strong> quotes?
                <br />
                <span className="text-red-500">Tindakan ini tidak dapat dibatalkan!</span>
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 px-4 py-2.5 border rounded-xl text-gray-700 hover:bg-gray-50 text-sm font-medium transition"
                >
                  Batal
                </button>
                <button
                  onClick={handleDeleteAll}
                  disabled={isDeletingAll}
                  className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 text-sm font-medium transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isDeletingAll ? (
                    <><i className="ri-loader-4-line animate-spin"></i> Menghapus...</>
                  ) : (
                    'Ya, Hapus Semua'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4">
        {/* Filters - Mobile Friendly */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <i className="ri-search-line absolute left-3 top-1/2 transform -translate-y-1/2 text-[#9ca3af] text-lg"></i>
            <input
              type="text"
              placeholder="Cari quote atau author..."
              className="w-full p-2.5 pl-10 rounded-xl border border-[#e5e7eb] bg-white text-gray-800 focus:outline-none focus:border-[#4f90c6] focus:ring-1 focus:ring-[#4f90c6] text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="w-full sm:w-auto p-2.5 rounded-xl border border-[#e5e7eb] bg-white text-gray-800 focus:outline-none focus:border-[#4f90c6] focus:ring-1 focus:ring-[#4f90c6] text-sm cursor-pointer"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">Semua Status</option>
            <option value="pending">⏳ Pending</option>
            <option value="approved">✅ Approved</option>
            <option value="rejected">❌ Rejected</option>
            <option value="marked">📌 Marked</option>
          </select>
        </div>

        {/* Info Bar */}
        <div className="flex justify-between items-center mb-4 px-1">
          <p className="text-sm text-gray-600">
            Menampilkan <strong>{filteredQuotes.length}</strong> dari <strong>{quotes.length}</strong> quotes
          </p>
          {quotes.length > 0 && (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1 transition"
            >
              <i className="ri-delete-bin-line"></i>
              Hapus Semua
            </button>
          )}
        </div>

        {/* Quotes Grid - Desktop Grid, Mobile Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredQuotes.length > 0 ? (
            filteredQuotes.map((quote) => (
              <div key={quote.id} className="bg-white rounded-xl shadow-sm border border-[#e5e7eb] overflow-hidden hover:shadow-lg transition-all duration-200 flex flex-col">
                <div className="p-4 flex-1 flex flex-col">
                  {/* Header: Status Badge */}
                  <div className="flex justify-between items-start gap-2 mb-2">
                    <p className="text-sm text-gray-800 leading-relaxed flex-1 line-clamp-3">
                      "{quote.text}"
                    </p>
                  </div>

                  {/* Author */}
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-6 h-6 bg-gradient-to-r from-blue-700 to-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <i className="ri-user-fill text-white text-xs"></i>
                    </div>
                    <span className="text-xs font-medium text-gray-700 truncate">
                      @{quote.author || 'Anonymous'}
                    </span>
                  </div>

                  {/* Status & Actions */}
                  <div className="flex flex-wrap items-center justify-between gap-2 mt-3 pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-1.5">
                      <select
                        className={`text-xs px-2 py-1 rounded-lg border cursor-pointer ${getStatusStyle(quote.status)} border-transparent focus:outline-none focus:ring-1 focus:ring-blue-500`}
                        value={quote.status || 'pending'}
                        onChange={(e) => handleStatusChange(quote.id, e.target.value)}
                      >
                        <option value="pending">⏳ Pending</option>
                        <option value="approved">✅ Approved</option>
                        <option value="rejected">❌ Rejected</option>
                        <option value="marked">📌 Marked</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleEdit(quote)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition"
                        title="Edit"
                      >
                        <i className="ri-edit-line text-sm"></i>
                      </button>
                      <button
                        onClick={() => handleDelete(quote.id)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition"
                        title="Hapus"
                      >
                        <i className="ri-delete-bin-line text-sm"></i>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-12 bg-white rounded-xl border border-[#e5e7eb]">
              <i className="ri-inbox-line text-5xl text-gray-300 mb-3 block"></i>
              <p className="text-gray-500 text-sm">Tidak ada quotes yang ditemukan</p>
              <button
                onClick={() => setIsAddPopupOpen(true)}
                className="mt-3 text-[#4f90c6] text-sm font-medium hover:underline"
              >
                Tambah quote pertama
              </button>
            </div>
          )}
        </div>

        {/* History Section - Mobile Friendly */}
        {history.length > 0 && (
          <div className="mt-6 bg-white rounded-xl shadow-sm border border-[#e5e7eb] overflow-hidden">
            <div className="flex justify-between items-center p-4 bg-gray-50 border-b border-[#e5e7eb]">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2 text-sm">
                <i className="ri-history-line text-[#355485]"></i>
                History ({history.length})
              </h3>
              <button onClick={clearHistory} className="text-red-500 hover:text-red-700 text-xs flex items-center gap-1 transition">
                <i className="ri-delete-bin-line"></i>
                Hapus
              </button>
            </div>
            <div className="divide-y divide-gray-100 max-h-64 overflow-y-auto">
              {history.map((item) => (
                <div key={item.id} className="p-3 hover:bg-gray-50 transition">
                  <p className="text-gray-800 text-sm">"{item.text.substring(0, 60)}{item.text.length > 60 ? '...' : ''}"</p>
                  <div className="flex flex-wrap gap-2 mt-1 text-xs text-gray-500">
                    <span><i className="ri-user-line"></i> {item.author}</span>
                    <span><i className="ri-time-line"></i> {new Date(item.timestamp).toLocaleDateString()}</span>
                    {item.imported && <span className="text-blue-500"><i className="ri-upload-2-line"></i> Imported</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Add Quote Popup - Mobile Friendly */}
      {isAddPopupOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-5">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-gray-800">Tambah Quote Baru</h2>
                <button onClick={() => setIsAddPopupOpen(false)} className="text-gray-500 hover:text-gray-700 p-1">
                  <i className="ri-close-line text-2xl"></i>
                </button>
              </div>
              <form onSubmit={handleAddQuote} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Teks Quote *</label>
                  <textarea
                    placeholder="Tulis quote di sini..."
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#4f90c6] focus:border-transparent resize-none"
                    value={newQuote.text}
                    onChange={(e) => setNewQuote({ ...newQuote, text: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Author *</label>
                  <input
                    placeholder="Nama author"
                    type="text"
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#4f90c6] focus:border-transparent"
                    value={newQuote.author}
                    onChange={(e) => {
                      setNewQuote({ ...newQuote, author: e.target.value });
                      setSelectedAuthor('');
                    }}
                    required
                  />
                  <div className="flex gap-3 mt-2">
                    <label className="flex items-center gap-1.5 cursor-pointer text-sm">
                      <input
                        type="radio"
                        name="authorRadio"
                        checked={selectedAuthor === 'storythur'}
                        onChange={() => handleAuthorSelect('storythur')}
                        className="w-4 h-4 text-[#355485]"
                      />
                      <span>storythur</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer text-sm">
                      <input
                        type="radio"
                        name="authorRadio"
                        checked={selectedAuthor === 'fatkhurrhn'}
                        onChange={() => handleAuthorSelect('fatkhurrhn')}
                        className="w-4 h-4 text-[#355485]"
                      />
                      <span>fatkhurrhn</span>
                    </label>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 bg-[#355485] text-white rounded-xl font-medium flex items-center justify-center disabled:opacity-70 hover:bg-[#2a436c] transition"
                >
                  {isLoading ? (
                    <><i className="ri-loader-4-line animate-spin mr-2"></i>Memproses...</>
                  ) : (
                    'Tambah Quote'
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Quote Modal - Mobile Friendly */}
      {editingQuote && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-5">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-gray-800">Edit Quote</h2>
                <button onClick={() => setEditingQuote(null)} className="text-gray-500 hover:text-gray-700 p-1">
                  <i className="ri-close-line text-2xl"></i>
                </button>
              </div>
              <form onSubmit={handleUpdate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Teks Quote *</label>
                  <textarea
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#4f90c6] focus:border-transparent resize-none"
                    rows={4}
                    value={editingQuote.text}
                    onChange={(e) => setEditingQuote({ ...editingQuote, text: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Author *</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#4f90c6] focus:border-transparent"
                    value={editingQuote.author}
                    onChange={(e) => setEditingQuote({ ...editingQuote, author: e.target.value })}
                    required
                  />
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={() => setEditingQuote(null)} className="px-4 py-2 border rounded-xl text-gray-700 hover:bg-gray-50 text-sm">Batal</button>
                  <button type="submit" className="px-4 py-2 bg-[#355485] text-white rounded-xl hover:bg-[#2a436c] text-sm">Simpan</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Import Excel Popup - Mobile Friendly */}
      {isImportPopupOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-5">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-gray-800">Import Quotes dari Excel</h2>
                <button onClick={() => {
                  setIsImportPopupOpen(false);
                  setImportPreview([]);
                  setImportFile(null);
                  setImportErrors([]);
                }} className="text-gray-500 hover:text-gray-700 p-1">
                  <i className="ri-close-line text-2xl"></i>
                </button>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload File (Excel/CSV)
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-[#4f90c6] transition">
                  <input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={(e) => {
                      if (e.target.files[0]) {
                        handleFileUpload(e.target.files[0]);
                      }
                    }}
                    className="hidden"
                    id="fileUpload"
                  />
                  <label htmlFor="fileUpload" className="cursor-pointer block">
                    <i className="ri-upload-cloud-2-line text-4xl text-gray-400 mb-2 block"></i>
                    <p className="text-gray-600 text-sm">Klik untuk upload</p>
                    <p className="text-xs text-gray-400 mt-1">Support .xlsx, .xls, .csv</p>
                  </label>
                </div>
                {importFile && (
                  <div className="mt-2 flex items-center gap-2 text-sm text-green-600">
                    <i className="ri-file-excel-line"></i>
                    <span>{importFile.name}</span>
                  </div>
                )}
              </div>

              {/* Download Sample Excel Button */}
              <button
                onClick={downloadSampleExcel}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 transition border border-blue-200 mb-4"
              >
                <i className="ri-download-line"></i>
                Download Sample Excel (format: quote & author)
              </button>

              {importErrors.length > 0 && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <h3 className="text-red-800 font-medium mb-1 text-sm">Error:</h3>
                  <ul className="list-disc list-inside text-sm text-red-600">
                    {importErrors.map((error, idx) => (
                      <li key={idx}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}

              {importPreview.length > 0 && (
                <>
                  <div className="mb-3">
                    <h3 className="font-medium text-gray-800 text-sm mb-1">
                      Preview ({importPreview.length} quotes ditemukan)
                    </h3>
                    <p className="text-xs text-gray-500">File akan diimport dengan status "Approved"</p>
                  </div>

                  <div className="overflow-x-auto mb-4 max-h-64 overflow-y-auto border border-gray-200 rounded-xl">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">No</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Quote</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Author</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {importPreview.map((quote, idx) => (
                          <tr key={quote.id} className="hover:bg-gray-50">
                            <td className="px-3 py-2 text-sm text-gray-600">{idx + 1}</td>
                            <td className="px-3 py-2 text-sm text-gray-800 max-w-xs">
                              <div className="line-clamp-2">"{quote.text}"</div>
                            </td>
                            <td className="px-3 py-2 text-sm text-gray-600">{quote.author}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex flex-col sm:flex-row justify-end gap-2">
                    <button
                      onClick={() => {
                        setIsImportPopupOpen(false);
                        setImportPreview([]);
                        setImportFile(null);
                      }}
                      className="px-4 py-2 border rounded-xl text-gray-700 hover:bg-gray-50 text-sm"
                    >
                      Batal
                    </button>
                    <button
                      onClick={handleImportSubmit}
                      disabled={isImporting}
                      className="px-4 py-2 bg-[#355485] text-white rounded-xl hover:bg-[#2a436c] disabled:opacity-70 flex items-center justify-center gap-2 text-sm"
                    >
                      {isImporting ? (
                        <>
                          <i className="ri-loader-4-line animate-spin"></i>
                          Importing...
                        </>
                      ) : (
                        <>
                          <i className="ri-database-2-line"></i>
                          Import {importPreview.length} Quotes
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CSS for animation */}
      <style jsx>{`
        @keyframes slide-down {
          from {
            transform: translateY(-20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .animate-slide-down {
          animation: slide-down 0.3s ease-out;
        }
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
      `}</style>
    </div>
  );
};

export default ManageQuotes;