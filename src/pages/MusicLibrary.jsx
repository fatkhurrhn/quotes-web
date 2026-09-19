import React, { useState, useRef, useEffect } from 'react';
import {
    Play, Pause, SkipBack, SkipForward, Volume2, VolumeX,
    Share2, Heart, Music, Check, Link2, Copy, X, Video,
    Maximize, Download
} from 'lucide-react';

// ===== DATA LAGU =====
const TRACKS = [
    {
        id: 1,
        title: 'Track One',
        artist: 'Unknown Artist',
        cover: 'https://picsum.photos/seed/track1/300',
        url: 'https://videotourl.com/audio/1789833743155-2cf92225-e737-48e8-8a96-125cb8c908fb.mp3',
        duration: '3:45',
    },
    {
        id: 2,
        title: 'Track Two',
        artist: 'Unknown Artist',
        cover: 'https://picsum.photos/seed/track2/300',
        url: 'https://videotourl.com/audio/1789833743155-2cf92225-e737-48e8-8a96-125cb8c908fb.mp3',
        duration: '4:12',
    },
    {
        id: 3,
        title: 'Track Three',
        artist: 'Unknown Artist',
        cover: 'https://picsum.photos/seed/track3/300',
        url: 'https://videotourl.com/audio/1789833743155-2cf92225-e737-48e8-8a96-125cb8c908fb.mp3',
        duration: '2:58',
    },
];

// ===== DATA VIDEO =====
const VIDEOS = [
    {
        id: 1,
        title: 'Video Satu',
        author: 'Unknown Creator',
        thumbnail: 'https://picsum.photos/seed/video1/600/400',
        url: 'https://videotourl.com/videos/1789834218514-c61124cc-eb70-4a68-be83-3d63bbd459c8.mp4',
        duration: '0:30',
    },
    {
        id: 2,
        title: 'Video Dua',
        author: 'Unknown Creator',
        thumbnail: 'https://picsum.photos/seed/video2/600/400',
        url: 'https://videotourl.com/videos/1789834218514-c61124cc-eb70-4a68-be83-3d63bbd459c8.mp4',
        duration: '0:45',
    },
];

// ===== HELPER: SHARE LOGIC (dipakai bareng) =====
function useShare() {
    const [shareOpen, setShareOpen] = useState(false);
    const [shareData, setShareData] = useState({ url: '', title: '', text: '' });
    const [copied, setCopied] = useState(false);

    const openShare = async ({ url, title, text }) => {
        const payload = { url, title, text: text || title };
        if (navigator.share) {
            try {
                await navigator.share(payload);
                return;
            } catch (e) {
                return; // user cancel
            }
        }
        setShareData(payload);
        setShareOpen(true);
    };

    const copyLink = async () => {
        try {
            await navigator.clipboard.writeText(shareData.url);
        } catch (e) {
            const el = document.createElement('textarea');
            el.value = shareData.url;
            document.body.appendChild(el);
            el.select();
            document.execCommand('copy');
            document.body.removeChild(el);
        }
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const ShareModal = () => {
        if (!shareOpen) return null;
        return (
            <div
                className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
                onClick={() => setShareOpen(false)}
            >
                <div
                    className="bg-[#1a1830] border border-white/10 w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-bold text-white">Bagikan</h3>
                        <button
                            onClick={() => setShareOpen(false)}
                            className="p-1.5 hover:bg-white/10 rounded-full text-white/60"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="p-3 bg-white/5 rounded-2xl mb-4">
                        <p className="font-semibold text-white truncate">{shareData.title}</p>
                        <p className="text-sm text-white/50 truncate">{shareData.text}</p>
                    </div>

                    <div className="flex items-center gap-2 p-2 bg-white/5 rounded-2xl border border-white/10">
                        <Link2 className="w-5 h-5 text-white/40 ml-2 shrink-0" />
                        <input
                            type="text"
                            readOnly
                            value={shareData.url}
                            className="flex-1 bg-transparent text-sm text-white/70 outline-none truncate"
                        />
                        <button
                            onClick={copyLink}
                            className={`px-4 py-2 rounded-xl text-sm font-medium transition flex items-center gap-2 shrink-0 ${copied ? 'bg-green-500 text-white' : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:opacity-90'
                                }`}
                        >
                            {copied ? (
                                <>
                                    <Check className="w-4 h-4" /> Tersalin
                                </>
                            ) : (
                                <>
                                    <Copy className="w-4 h-4" /> Salin
                                </>
                            )}
                        </button>
                    </div>

                    <p className="text-xs text-white/40 text-center mt-4">
                        Link disalin! Tempel di WhatsApp, Instagram, Twitter, atau medsos lainnya.
                    </p>
                </div>
            </div>
        );
    };

    return { openShare, ShareModal };
}

// ===== KOMPONEN UTAMA =====
export default function MusicLibrary() {
    const [currentTrack, setCurrentTrack] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(0.8);
    const [isMuted, setIsMuted] = useState(false);
    const [liked, setLiked] = useState({});
    const [activeTab, setActiveTab] = useState('music'); // 'music' | 'video'

    const audioRef = useRef(null);
    const videoRef = useRef(null);

    const track = TRACKS[currentTrack];
    const { openShare, ShareModal } = useShare();

    // Play/pause audio
    useEffect(() => {
        if (!audioRef.current) return;
        if (isPlaying) {
            audioRef.current.play().catch(() => setIsPlaying(false));
        } else {
            audioRef.current.pause();
        }
    }, [isPlaying, currentTrack]);

    // Volume
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = isMuted ? 0 : volume;
        }
    }, [volume, isMuted]);

    const handleTimeUpdate = () => {
        if (audioRef.current) setProgress(audioRef.current.currentTime);
    };

    const handleLoadedMetadata = () => {
        if (audioRef.current) setDuration(audioRef.current.duration);
    };

    const handleSeek = (e) => {
        const time = Number(e.target.value);
        if (audioRef.current) {
            audioRef.current.currentTime = time;
            setProgress(time);
        }
    };

    const nextTrack = () => {
        setCurrentTrack((prev) => (prev + 1) % TRACKS.length);
        setIsPlaying(true);
    };

    const prevTrack = () => {
        setCurrentTrack((prev) => (prev - 1 + TRACKS.length) % TRACKS.length);
        setIsPlaying(true);
    };

    const selectTrack = (idx) => {
        setCurrentTrack(idx);
        setIsPlaying(true);
    };

    const formatTime = (s) => {
        if (!s || isNaN(s)) return '0:00';
        const m = Math.floor(s / 60);
        const sec = Math.floor(s % 60).toString().padStart(2, '0');
        return `${m}:${sec}`;
    };

    const toggleLike = (id) => {
        setLiked((prev) => ({ ...prev, [id]: !prev[id] }));
    };

    // ===== SHARE LAGU =====
    const shareTrack = (idx = currentTrack) => {
        const t = TRACKS[idx];
        openShare({
            url: t.url,
            title: t.title,
            text: `Dengarkan "${t.title}" oleh ${t.artist}`,
        });
    };

    // ===== SHARE VIDEO =====
    const shareVideo = (v) => {
        openShare({
            url: v.url,
            title: v.title,
            text: `Tonton "${v.title}" oleh ${v.author}`,
        });
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] text-white p-4 sm:p-8">
            <audio
                ref={audioRef}
                src={track.url}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onEnded={nextTrack}
            />

            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl shadow-lg">
                            <Music className="w-7 h-7" />
                        </div>
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold">Media Library</h1>
                            <p className="text-sm text-white/60">Musik & Video</p>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-6 bg-white/5 p-1.5 rounded-2xl w-fit backdrop-blur-xl border border-white/10">
                    <button
                        onClick={() => setActiveTab('music')}
                        className={`px-5 py-2.5 rounded-xl font-medium transition flex items-center gap-2 ${activeTab === 'music'
                                ? 'bg-gradient-to-r from-purple-500 to-pink-500 shadow-lg'
                                : 'hover:bg-white/10 text-white/70'
                            }`}
                    >
                        <Music className="w-4 h-4" /> Musik
                    </button>
                    <button
                        onClick={() => setActiveTab('video')}
                        className={`px-5 py-2.5 rounded-xl font-medium transition flex items-center gap-2 ${activeTab === 'video'
                                ? 'bg-gradient-to-r from-purple-500 to-pink-500 shadow-lg'
                                : 'hover:bg-white/10 text-white/70'
                            }`}
                    >
                        <Video className="w-4 h-4" /> Video
                    </button>
                </div>

                {/* ================= MUSIC TAB ================= */}
                {activeTab === 'music' && (
                    <>
                        {/* Now Playing Card */}
                        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 sm:p-8 mb-8 shadow-2xl">
                            <div className="flex flex-col sm:flex-row gap-6 items-center">
                                <div className="relative">
                                    <img
                                        src={track.cover}
                                        alt={track.title}
                                        className={`w-48 h-48 rounded-2xl object-cover shadow-2xl transition-transform duration-500 ${isPlaying ? 'scale-105' : ''
                                            }`}
                                    />
                                    {isPlaying && (
                                        <div className="absolute inset-0 rounded-2xl ring-2 ring-purple-400/50 animate-pulse" />
                                    )}
                                </div>

                                <div className="flex-1 text-center sm:text-left w-full">
                                    <p className="text-sm text-purple-300 font-medium mb-1">SEKARANG DIPUTAR</p>
                                    <h2 className="text-2xl sm:text-3xl font-bold mb-1">{track.title}</h2>
                                    <p className="text-white/60 mb-6">{track.artist}</p>

                                    {/* Progress */}
                                    <div className="mb-4">
                                        <input
                                            type="range"
                                            min={0}
                                            max={duration || 0}
                                            value={progress}
                                            onChange={handleSeek}
                                            className="w-full h-1.5 bg-white/20 rounded-full appearance-none cursor-pointer accent-purple-400"
                                        />
                                        <div className="flex justify-between text-xs text-white/50 mt-1">
                                            <span>{formatTime(progress)}</span>
                                            <span>{formatTime(duration)}</span>
                                        </div>
                                    </div>

                                    {/* Controls */}
                                    <div className="flex items-center justify-center sm:justify-start gap-4 flex-wrap">
                                        <button onClick={prevTrack} className="p-2 hover:bg-white/10 rounded-full transition">
                                            <SkipBack className="w-6 h-6" />
                                        </button>
                                        <button
                                            onClick={() => setIsPlaying(!isPlaying)}
                                            className="p-4 bg-gradient-to-br from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-full shadow-lg transition transform hover:scale-105"
                                        >
                                            {isPlaying ? <Pause className="w-7 h-7" /> : <Play className="w-7 h-7 ml-1" />}
                                        </button>
                                        <button onClick={nextTrack} className="p-2 hover:bg-white/10 rounded-full transition">
                                            <SkipForward className="w-6 h-6" />
                                        </button>

                                        <div className="flex items-center gap-2 ml-2">
                                            <button onClick={() => setIsMuted(!isMuted)} className="p-2 hover:bg-white/10 rounded-full">
                                                {isMuted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                                            </button>
                                            <input
                                                type="range"
                                                min={0}
                                                max={1}
                                                step={0.01}
                                                value={isMuted ? 0 : volume}
                                                onChange={(e) => {
                                                    setVolume(Number(e.target.value));
                                                    setIsMuted(false);
                                                }}
                                                className="w-20 h-1 bg-white/20 rounded-full appearance-none accent-purple-400"
                                            />
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center justify-center sm:justify-start gap-3 mt-6">
                                        <button
                                            onClick={() => toggleLike(track.id)}
                                            className={`p-2.5 rounded-full transition ${liked[track.id] ? 'bg-pink-500 text-white' : 'bg-white/10 hover:bg-white/20'
                                                }`}
                                        >
                                            <Heart className={`w-5 h-5 ${liked[track.id] ? 'fill-current' : ''}`} />
                                        </button>
                                        <button
                                            onClick={() => shareTrack()}
                                            className="px-5 py-2.5 bg-white/10 hover:bg-white/20 rounded-full flex items-center gap-2 transition font-medium"
                                        >
                                            <Share2 className="w-5 h-5" />
                                            Bagikan
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Playlist */}
                        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-4 sm:p-6">
                            <h3 className="text-lg font-bold mb-4 px-2">Daftar Lagu</h3>
                            <div className="space-y-2">
                                {TRACKS.map((t, idx) => (
                                    <div
                                        key={t.id}
                                        onClick={() => selectTrack(idx)}
                                        className={`flex items-center gap-4 p-3 rounded-2xl cursor-pointer transition group ${idx === currentTrack ? 'bg-purple-500/20 border border-purple-400/30' : 'hover:bg-white/10'
                                            }`}
                                    >
                                        <div className="relative shrink-0">
                                            <img src={t.cover} alt={t.title} className="w-14 h-14 rounded-xl object-cover" />
                                            {idx === currentTrack && isPlaying && (
                                                <div className="absolute inset-0 bg-black/50 rounded-xl flex items-center justify-center">
                                                    <div className="flex gap-0.5 items-end h-4">
                                                        <span className="w-1 bg-purple-300 rounded animate-[bounce_1s_infinite]" style={{ height: '60%' }} />
                                                        <span className="w-1 bg-purple-300 rounded animate-[bounce_1s_infinite_0.2s]" style={{ height: '100%' }} />
                                                        <span className="w-1 bg-purple-300 rounded animate-[bounce_1s_infinite_0.4s]" style={{ height: '40%' }} />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className={`font-semibold truncate ${idx === currentTrack ? 'text-purple-300' : ''}`}>{t.title}</p>
                                            <p className="text-sm text-white/50 truncate">{t.artist}</p>
                                        </div>
                                        <span className="text-sm text-white/40 hidden sm:block">{t.duration}</span>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                toggleLike(t.id);
                                            }}
                                            className="p-2 sm:opacity-0 group-hover:opacity-100 transition"
                                        >
                                            <Heart className={`w-4 h-4 ${liked[t.id] ? 'fill-pink-500 text-pink-500' : ''}`} />
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                shareTrack(idx);
                                            }}
                                            className="p-2 sm:opacity-0 group-hover:opacity-100 transition"
                                            title="Bagikan lagu ini"
                                        >
                                            <Share2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                )}

                {/* ================= VIDEO TAB ================= */}
                {activeTab === 'video' && (
                    <VideoGallery onShare={shareVideo} />
                )}
            </div>

            {/* Share Modal */}
            <ShareModal />

            <style>{`
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: linear-gradient(135deg, #a855f7, #ec4899);
          cursor: pointer;
          box-shadow: 0 0 10px rgba(168, 85, 247, 0.5);
        }
        input[type="range"]::-moz-range-thumb {
          width: 14px;
          height: 14px;
          border: none;
          border-radius: 50%;
          background: linear-gradient(135deg, #a855f7, #ec4899);
          cursor: pointer;
        }
      `}</style>
        </div>
    );
}

// ================= VIDEO GALLERY =================
function VideoGallery({ onShare }) {
    const [activeVideo, setActiveVideo] = useState(VIDEOS[0]);
    const [likedVideos, setLikedVideos] = useState({});
    const videoRef = useRef(null);

    const toggleLike = (id) => {
        setLikedVideos((prev) => ({ ...prev, [id]: !prev[id] }));
    };

    // Reset & autoplay saat ganti video
    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.load();
            videoRef.current.play().catch(() => { });
        }
    }, [activeVideo]);

    const goFullscreen = () => {
        if (videoRef.current) {
            if (videoRef.current.requestFullscreen) {
                videoRef.current.requestFullscreen();
            } else if (videoRef.current.webkitRequestFullscreen) {
                videoRef.current.webkitRequestFullscreen();
            }
        }
    };

    const downloadVideo = () => {
        const a = document.createElement('a');
        a.href = activeVideo.url;
        a.download = `${activeVideo.title}.mp4`;
        a.target = '_blank';
        a.rel = 'noopener';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    return (
        <div>
            {/* Main Video Player */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden mb-8 shadow-2xl">
                <div className="relative bg-black aspect-video">
                    <video
                        ref={videoRef}
                        src={activeVideo.url}
                        poster={activeVideo.thumbnail}
                        controls
                        playsInline
                        className="w-full h-full"
                    />
                </div>

                <div className="p-5 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                        <div className="flex-1 min-w-0">
                            <h2 className="text-xl sm:text-2xl font-bold mb-1">{activeVideo.title}</h2>
                            <p className="text-white/60 text-sm">{activeVideo.author}</p>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                            <button
                                onClick={() => toggleLike(activeVideo.id)}
                                className={`p-2.5 rounded-full transition flex items-center gap-2 ${likedVideos[activeVideo.id]
                                        ? 'bg-pink-500 text-white'
                                        : 'bg-white/10 hover:bg-white/20'
                                    }`}
                                title="Suka"
                            >
                                <Heart className={`w-5 h-5 ${likedVideos[activeVideo.id] ? 'fill-current' : ''}`} />
                            </button>

                            <button
                                onClick={goFullscreen}
                                className="p-2.5 bg-white/10 hover:bg-white/20 rounded-full transition"
                                title="Layar penuh"
                            >
                                <Maximize className="w-5 h-5" />
                            </button>

                            <button
                                onClick={downloadVideo}
                                className="p-2.5 bg-white/10 hover:bg-white/20 rounded-full transition"
                                title="Unduh"
                            >
                                <Download className="w-5 h-5" />
                            </button>

                            <button
                                onClick={() => onShare(activeVideo)}
                                className="px-5 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 hover:opacity-90 rounded-full flex items-center gap-2 transition font-medium"
                            >
                                <Share2 className="w-5 h-5" />
                                Bagikan
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Video Grid */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-4 sm:p-6">
                <h3 className="text-lg font-bold mb-4 px-2">Video Lainnya</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {VIDEOS.map((v) => (
                        <div
                            key={v.id}
                            className={`rounded-2xl overflow-hidden cursor-pointer transition group border ${activeVideo.id === v.id
                                    ? 'border-purple-400/50 bg-purple-500/10'
                                    : 'border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10'
                                }`}
                            onClick={() => setActiveVideo(v)}
                        >
                            <div className="relative aspect-video">
                                <img
                                    src={v.thumbnail}
                                    alt={v.title}
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition flex items-center justify-center">
                                    <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center shadow-lg transform group-hover:scale-110 transition">
                                        <Play className="w-5 h-5 text-black ml-0.5" />
                                    </div>
                                </div>
                                <span className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/80 rounded text-xs font-medium">
                                    {v.duration}
                                </span>
                            </div>
                            <div className="p-3">
                                <p className="font-semibold truncate">{v.title}</p>
                                <p className="text-sm text-white/50 truncate">{v.author}</p>
                                <div className="flex items-center gap-2 mt-3">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            toggleLike(v.id);
                                        }}
                                        className={`p-1.5 rounded-lg transition ${likedVideos[v.id] ? 'bg-pink-500/20 text-pink-400' : 'hover:bg-white/10 text-white/60'
                                            }`}
                                    >
                                        <Heart className={`w-4 h-4 ${likedVideos[v.id] ? 'fill-current' : ''}`} />
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onShare(v);
                                        }}
                                        className="p-1.5 rounded-lg hover:bg-white/10 text-white/60 transition"
                                        title="Bagikan"
                                    >
                                        <Share2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}