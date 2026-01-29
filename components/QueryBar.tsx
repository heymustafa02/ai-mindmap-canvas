"use client";

import React, { useEffect, useRef, useState } from "react";
import { useMindmapStore } from "@/store/mindmapStore";

import {
  Send,
  Paperclip,
  Mic,
  MicOff,
  Loader2,
  Plus,
  CornerDownRight,
} from "lucide-react";

import { motion, AnimatePresence } from "framer-motion";

export default function QueryBar() {
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  const {
    selectedNodeId,
    addNode,
    addEdge,
    deselectAll,
  } = useMindmapStore();

  /* ============================
     MIC SETUP (Web Speech API)
     ============================ */
  useEffect(() => {
    if (typeof window === "undefined") return;

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = true;
    recognition.continuous = false;

    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((r: any) => r[0].transcript)
        .join("");

      setQuery(transcript);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
  }, []);

  const toggleMic = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition not supported in this browser.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  /* ============================
     SUBMIT
     ============================ */
  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!query.trim() || isLoading) return;

    setIsLoading(true);

    try {
      const res = await fetch("/api/mindmap/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: query.trim(),
          parentId: selectedNodeId,
          model: "gemini",
        }),
      });

      if (!res.ok) throw new Error("Failed");

      const data = await res.json();

      addNode({
        id: data.node.id,
        type: "mindmap",
        position: data.node.position,
        data: {
          query: data.node.query,
          response: data.node.response,
        },
      });

      if (data.edge) addEdge(data.edge);

      setQuery("");
      deselectAll();
    } catch (err) {
      console.error(err);
      alert("Failed to create node.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[5000] w-full max-w-3xl px-4">
      <form onSubmit={handleSubmit}>
        <div className="relative bg-white/80 backdrop-blur-xl border border-slate-200 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] p-2.5 flex items-center gap-3">

          {/* ✅ UNIFIED INDICATOR (FIXED ALIGNMENT) */}
          <div className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl transition-all duration-200 whitespace-nowrap ${
            selectedNodeId
              ? 'bg-blue-50 text-blue-600'
              : 'bg-slate-50 text-slate-600'
          }`}>
            {selectedNodeId ? (
              <>
                <CornerDownRight size={18} />
                <span className="text-sm font-bold">
                  Branching
                </span>
              </>
            ) : (
              <>
                <Plus size={18} />
                <span className="text-sm font-bold">
                  New Thread
                </span>
              </>
            )}
          </div>

          {/* INPUT */}
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            placeholder={
              selectedNodeId
                ? "Ask a follow-up..."
                : "Start a new conversation..."
            }
            className="flex-1 bg-transparent border-none outline-none text-base font-medium text-slate-700 py-3.5 px-3 placeholder:text-slate-400"
          />

          {/* FILE */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2.5 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
          >
            <Paperclip size={20} />
          </button>
          <input ref={fileInputRef} type="file" hidden />

          {/* 🎤 MIC (FUNCTIONAL) */}
          <button
            type="button"
            onClick={toggleMic}
            className={`p-2.5 rounded-lg transition-colors ${
              isListening
                ? "bg-red-100 text-red-600"
                : "text-slate-500 hover:bg-slate-100"
            }`}
          >
            {isListening ? <MicOff size={20} /> : <Mic size={20} />}
          </button>

          {/* SEND */}
          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div
                key="loading"
                className="p-2.5 rounded-xl bg-slate-100 text-slate-400"
              >
                <Loader2 size={20} className="animate-spin" />
              </motion.div>
            ) : (
              <motion.button
                key="send"
                type="submit"
                disabled={!query.trim()}
                className={`p-2.5 rounded-xl transition-all ${
                  query.trim()
                    ? "bg-slate-900 text-white hover:bg-slate-800 shadow-lg shadow-slate-900/20"
                    : "bg-slate-100 text-slate-400"
                }`}
              >
                <Send size={20} />
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </form>
    </div>
  );
}
