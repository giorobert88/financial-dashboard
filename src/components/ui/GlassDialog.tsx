"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Info, CheckCircle2, AlertTriangle, XCircle, X } from "lucide-react";

interface GlassDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  title: string;
  message: string;
  type?: "success" | "error" | "info" | "warning";
  confirmText?: string;
  cancelText?: string;
}

export function GlassDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  type = "info",
  confirmText = "Confirm",
  cancelText = "Cancel",
}: GlassDialogProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (active) setMounted(true);
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Handle ESC key to close
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!isOpen || !mounted) return null;

  const icons = {
    success: <CheckCircle2 className="w-8 h-8 text-emerald-400" />,
    error: <XCircle className="w-8 h-8 text-rose-400" />,
    warning: <AlertTriangle className="w-8 h-8 text-amber-400" />,
    info: <Info className="w-8 h-8 text-sky-400" />,
  };

  const ringColor = {
    success: "border-emerald-500/20 shadow-emerald-500/5",
    error: "border-rose-500/20 shadow-rose-500/5",
    warning: "border-amber-500/20 shadow-amber-500/5",
    info: "border-sky-500/20 shadow-sky-500/5",
  };

  return createPortal(
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-[4px] transition-opacity duration-300 animate-drawer-backdrop"
        onClick={onClose}
      />

      {/* Dialog container */}
      <div
        className={`relative z-10 w-full max-w-sm rounded-[2rem] border bg-zinc-950/80 p-6 backdrop-blur-xl shadow-2xl flex flex-col items-center text-center animate-drawer-slide border-zinc-800/80 ${ringColor[type]}`}
        role="dialog"
        aria-modal="true"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-200 transition-colors p-1 rounded-full hover:bg-zinc-800/50"
          aria-label="Close dialog"
        >
          <X size={16} />
        </button>

        {/* Icon */}
        <div className="mb-4 p-3 bg-zinc-900/60 rounded-2xl border border-zinc-800/50 shadow-inner">
          {icons[type]}
        </div>

        {/* Title */}
        <h3 className="text-lg font-semibold text-zinc-100 mb-2 leading-tight">
          {title}
        </h3>

        {/* Message */}
        <p className="text-sm text-zinc-400 mb-6 leading-relaxed">
          {message}
        </p>

        {/* Action Buttons */}
        <div className="flex gap-3 w-full">
          {onConfirm ? (
            <>
              <button
                onClick={onClose}
                className="flex-1 py-3 px-4 rounded-xl border border-zinc-800/80 text-sm font-medium text-zinc-300 bg-zinc-900/40 hover:bg-zinc-900/80 active:scale-[0.98] transition-all"
              >
                {cancelText}
              </button>
              <button
                onClick={() => {
                  onConfirm();
                  onClose();
                }}
                className={`flex-1 py-3 px-4 rounded-xl text-sm font-semibold text-pure-white active:scale-[0.98] transition-all shadow-lg ${
                  type === "error"
                    ? "bg-rose-500/80 hover:bg-rose-500 shadow-rose-500/10"
                    : type === "success"
                    ? "bg-emerald-500/80 hover:bg-emerald-500 shadow-emerald-500/10"
                    : type === "warning"
                    ? "bg-amber-500/80 hover:bg-amber-500 shadow-amber-500/10"
                    : "bg-sky-500/80 hover:bg-sky-500 shadow-sky-500/10"
                }`}
              >
                {confirmText}
              </button>
            </>
          ) : (
            <button
              onClick={onClose}
              className="w-full py-3 px-4 rounded-xl border border-zinc-800/80 text-sm font-semibold text-zinc-200 bg-zinc-900 hover:bg-zinc-850 active:scale-[0.98] transition-all"
            >
              OK
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
