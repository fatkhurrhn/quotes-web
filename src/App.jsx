import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AutoToTop from './components/AutoToTop';
import Home from './pages/Home';
import AddQuotes from './pages/AddQuotes';
import ManageQuotes2 from './pages/ManageQuotes2';
import Saluran from './pages/SSaluran';
import Search from './pages/Search';
import QuotesVid from './pages/QuotesVid';
import ManageQuotes from './pages/ManageQuotes';
import GenerateQuotes from './pages/GenerateQuotes';
import BahanReels from './pages/BahanReels';
import InstagramKu from './pages/InstagramKu';
import AllQuotes from './pages/AllQuotesKu';
import Testing from './pages/Testing';

function App() {
  return (
    <Router>
      <AutoToTop />
      <Routes>
        {/* <Route path="/" element={<Home />} /> */}
        <Route path="/" element={<AllQuotes />} />
        <Route path="/tes" element={<Testing />} />
        <Route path="/add" element={<AddQuotes />} />
        <Route path="/manage" element={<ManageQuotes2 />} />
        <Route path="/quotesku" element={<AllQuotes />} />
        <Route path="/saluran" element={<Saluran />} />
        <Route path="/instagramku" element={<InstagramKu />} />
        <Route path="/search" element={<Search />} />
        <Route path="/bahan-reels" element={<BahanReels />} />

        
        <Route path="/quotes-vid" element={<QuotesVid />} />
        <Route path="/manage-quotes" element={<ManageQuotes />} />
        <Route path="/generate/:id" element={<GenerateQuotes />} />
      </Routes>
    </Router>
  );
}

export default App;
