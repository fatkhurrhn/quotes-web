import React from "react";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";

export default function BottomAdd() {
    const navigate = useNavigate();

    return (
        <button
            type="button"
            onClick={() => navigate("/add")}
            className="fixed bottom-5 left-5 z-50 flex h-10 w-10 items-center justify-center bg-[#355485] text-white shadow-lg shadow-[#355485]/20 transition hover:bg-[#2a436c] active:scale-95 sm:bottom-6 sm:right-6"
            title="Tambah Quote"
            aria-label="Tambah Quote"
        >
            <Plus size={20} strokeWidth={2} />
        </button>
    );
}