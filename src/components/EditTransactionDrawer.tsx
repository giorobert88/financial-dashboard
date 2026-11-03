"use client";

import React, { useState } from "react";
import { useEditTransaction, TransactionDetails } from "./EditTransactionContext";
import { BottomSheetDrawer } from "./ui/BottomSheetDrawer";
import { GlassDialog } from "./ui/GlassDialog";
import { 
  Trash2, 
  Save, 
  Receipt, 
  Calendar, 
  Clock, 
  ArrowRightLeft, 
  TrendingUp, 
  Tag as TagIcon, 
  FileText, 
  X, 
  Loader2,
  FolderOpen
} from "lucide-react";

import { useCurrency } from "@/components/CurrencyContext";

export function EditTransactionDrawer() {
  const { symbol } = useCurrency();
  const { isOpen, transaction } = useEditTransaction();

  if (!isOpen || !transaction) return null;

  // React 19 Key-based state resetting pattern
  return <EditTransactionForm key={transaction.id} />;
}

function EditTransactionForm() {
  const { symbol } = useCurrency();
  const {
    isOpen,
    isLoading,
    isSaving,
    isDeleting,
    transaction,
    accounts,
    categories,
    closeEditTransaction,
    saveTransaction,
    deleteTransaction
  } = useEditTransaction();

  const tx = transaction!;

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Local form state initialized directly from transaction props
  const [description, setDescription] = useState(tx.description || "");
  const [amount, setAmount] = useState(String(tx.amount || ""));
  const [type, setType] = useState<"withdrawal" | "deposit" | "transfer">(tx.type || "withdrawal");
  const [date, setDate] = useState(tx.date || "");
  const [time, setTime] = useState(tx.time || "");
  const [sourceId, setSourceId] = useState(tx.sourceId || "");
  const [destinationId, setDestinationId] = useState(tx.destinationId || "");
  const [categoryName, setCategoryName] = useState(tx.categoryName || "");
  const [notes, setNotes] = useState(tx.notes || "");
  
  // Tag input state
  const [tags, setTags] = useState<string[]>(tx.tags || []);
  const [tagInput, setTagInput] = useState("");

  const handleSave = async () => {
    const updatedPayload: Partial<TransactionDetails> = {
      description,
      amount: parseFloat(amount) || 0,
      type,
      date,
      time,
      sourceId,
      destinationId,
      categoryName,
      tags,
      notes
    };
    await saveTransaction(updatedPayload);
  };

  const handleDelete = () => {
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    await deleteTransaction();
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && tagInput.trim()) {
      e.preventDefault();
      if (!tags.includes(tagInput.trim())) {
        setTags([...tags, tagInput.trim()]);
      }
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const swapAccounts = () => {
    const temp = sourceId;
    setSourceId(destinationId);
    setDestinationId(temp);
  };

  // Header actions (Back, Delete, Save)
  const headerAction = (
    <div className="flex items-center gap-3">
      <button
        onClick={handleDelete}
        disabled={isDeleting || isSaving}
        className="w-8 h-8 rounded-full flex items-center justify-center bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 hover:text-rose-355 transition-all active:scale-95 disabled:opacity-50"
        title="Delete Transaction"
      >
        {isDeleting ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
      </button>
      <button
        onClick={handleSave}
        disabled={isSaving || isDeleting || isLoading}
        className="px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 text-xs font-semibold bg-emerald-500 hover:bg-emerald-600 text-pure-white active:scale-95 transition-all disabled:opacity-50"
      >
        {isSaving ? (
          <Loader2 size={14} className="animate-spin" />
        ) : (
          <>
            <Save size={14} />
            <span>Save</span>
          </>
        )}
      </button>
    </div>
  );

  return (
    <>
      <BottomSheetDrawer
        isOpen={isOpen}
        onClose={closeEditTransaction}
        title="Edit Transaction"
        headerAction={headerAction}
      >
        <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-4 space-y-5 no-scrollbar">
          {isLoading ? (
            // Skeleton Loader
            <div className="space-y-6 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-zinc-800" />
                <div className="flex-1 h-8 bg-zinc-800 rounded-lg" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="h-10 bg-zinc-800 rounded-lg" />
                <div className="h-10 bg-zinc-800 rounded-lg" />
              </div>
              <div className="space-y-3">
                <div className="h-12 bg-zinc-800 rounded-lg" />
                <div className="h-12 bg-zinc-800 rounded-lg" />
                <div className="h-12 bg-zinc-800 rounded-lg" />
              </div>
            </div>
          ) : (
            <>
              {/* Description / Name */}
              <div className="flex items-center gap-3 bg-zinc-900/30 border border-zinc-800/40 p-3 rounded-2xl">
                <div className="w-9 h-9 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-400">
                  <Receipt size={18} />
                </div>
                <div className="flex-1">
                  <label className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider block">Description</label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-transparent border-none text-zinc-100 text-[15px] font-semibold focus:ring-0 outline-none p-0"
                    placeholder="Enter transaction title..."
                  />
                </div>
              </div>

              {/* Type selector */}
              <div className="grid grid-cols-3 gap-2">
                {(["withdrawal", "deposit", "transfer"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold uppercase tracking-wider transition-all text-center ${
                      type === t
                        ? t === "withdrawal"
                          ? "bg-rose-500/10 border-rose-500/30 text-rose-400"
                          : t === "deposit"
                          ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                          : "bg-indigo-500/10 border-indigo-500/30 text-indigo-400"
                        : "bg-zinc-900/20 border-zinc-800/50 text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              {/* Amount, Date, Time Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Amount */}
                <div className="flex items-center gap-2.5 bg-zinc-900/30 border border-zinc-800/40 p-3 rounded-2xl">
                  <div className="w-8 h-8 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-400">
                    <span className="font-semibold text-sm">{symbol}</span>
                  </div>
                  <div className="flex-1">
                    <label className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider block">Amount</label>
                    <input
                      type="number"
                      step="0.01"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full bg-transparent border-none text-zinc-100 text-sm font-semibold focus:ring-0 outline-none p-0"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                {/* Date */}
                <div className="flex items-center gap-2.5 bg-zinc-900/30 border border-zinc-800/40 p-3 rounded-2xl">
                  <div className="w-8 h-8 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-400">
                    <Calendar size={15} />
                  </div>
                  <div className="flex-1">
                    <label className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider block">Date</label>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full bg-transparent border-none text-zinc-100 text-sm font-semibold focus:ring-0 outline-none p-0 cursor-pointer [color-scheme:dark]"
                    />
                  </div>
                </div>

                {/* Time */}
                <div className="flex items-center gap-2.5 bg-zinc-900/30 border border-zinc-800/40 p-3 rounded-2xl">
                  <div className="w-8 h-8 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-400">
                    <Clock size={15} />
                  </div>
                  <div className="flex-1">
                    <label className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider block">Time</label>
                    <input
                      type="time"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      className="w-full bg-transparent border-none text-zinc-100 text-sm font-semibold focus:ring-0 outline-none p-0 cursor-pointer [color-scheme:dark]"
                    />
                  </div>
                </div>
              </div>

              {/* Accounts Selectors */}
              <div className="space-y-3">
                {/* Source Account (Show for withdrawal and transfer) */}
                {type !== "deposit" && (
                  <div className="flex items-center gap-3 bg-zinc-900/30 border border-zinc-800/40 p-3 rounded-2xl relative">
                    <div className="w-8 h-8 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                      <TrendingUp size={14} className="rotate-180" />
                    </div>
                    <div className="flex-1">
                      <label className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider block">Source Account</label>
                      <select
                        value={sourceId}
                        onChange={(e) => setSourceId(e.target.value)}
                        className="w-full bg-transparent border-none text-zinc-200 text-sm font-medium focus:ring-0 outline-none p-0 cursor-pointer"
                      >
                        <option value="" className="bg-zinc-950">Select Source...</option>
                        {accounts.map((acc) => (
                          <option key={acc.id} value={acc.id} className="bg-zinc-950 text-zinc-200">
                            {acc.name} ({acc.type})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {/* Swap Button for Transfer */}
                {type === "transfer" && (
                  <div className="flex justify-center -my-1.5 relative z-10">
                    <button
                      type="button"
                      onClick={swapAccounts}
                      className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-850 flex items-center justify-center text-zinc-400 hover:text-zinc-200 active:scale-95 transition-all shadow-md"
                    >
                      <ArrowRightLeft size={14} className="rotate-90" />
                    </button>
                  </div>
                )}

                {/* Destination Account (Show for deposit and transfer) */}
                {type !== "withdrawal" && (
                  <div className="flex items-center gap-3 bg-zinc-900/30 border border-zinc-800/40 p-3 rounded-2xl">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                      <TrendingUp size={14} />
                    </div>
                    <div className="flex-1">
                      <label className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider block">Destination Account</label>
                      <select
                        value={destinationId}
                        onChange={(e) => setDestinationId(e.target.value)}
                        className="w-full bg-transparent border-none text-zinc-200 text-sm font-medium focus:ring-0 outline-none p-0 cursor-pointer"
                      >
                        <option value="" className="bg-zinc-950">Select Destination...</option>
                        {accounts.map((acc) => (
                          <option key={acc.id} value={acc.id} className="bg-zinc-950 text-zinc-200">
                            {acc.name} ({acc.type})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* Category Selector */}
              <div className="flex items-center gap-3 bg-zinc-900/30 border border-zinc-800/40 p-3 rounded-2xl">
                <div className="w-8 h-8 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-400">
                  <FolderOpen size={15} />
                </div>
                <div className="flex-1">
                  <label className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider block">Category</label>
                  <select
                    value={categoryName}
                    onChange={(e) => setCategoryName(e.target.value)}
                    className="w-full bg-transparent border-none text-zinc-200 text-sm font-medium focus:ring-0 outline-none p-0 cursor-pointer"
                  >
                    <option value="" className="bg-zinc-950">Uncategorized</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat} className="bg-zinc-950 text-zinc-200">
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Tags UI */}
              <div className="space-y-2">
                <div className="flex items-center gap-3 bg-zinc-900/30 border border-zinc-800/40 p-3 rounded-2xl">
                  <div className="w-8 h-8 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-400">
                    <TagIcon size={14} />
                  </div>
                  <div className="flex-1">
                    <label className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider block">Add Tag</label>
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={handleAddTag}
                      className="w-full bg-transparent border-none text-zinc-200 text-sm font-medium focus:ring-0 outline-none p-0"
                      placeholder="Press enter to add tag..."
                    />
                  </div>
                </div>

                {/* Tag Chips list */}
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 px-1">
                    {tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold bg-zinc-900 border border-zinc-800 text-zinc-300 rounded-full px-2.5 py-1"
                      >
                        <span>{tag}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="text-zinc-500 hover:text-zinc-300 transition-colors"
                        >
                          <X size={10} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Notes Textarea */}
              <div className="flex items-start gap-3 bg-zinc-900/30 border border-zinc-800/40 p-3 rounded-2xl">
                <div className="w-8 h-8 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-400 mt-1 flex-shrink-0">
                  <FileText size={15} />
                </div>
                <div className="flex-1">
                  <label className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider block">Notes</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full bg-transparent border-none text-zinc-200 text-sm focus:ring-0 outline-none p-0 resize-none min-h-[70px]"
                    placeholder="Add details/notes about this transaction..."
                  />
                </div>
              </div>
            </>
          )}
        </div>
      </BottomSheetDrawer>

      <GlassDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Transaction"
        message="Are you sure you want to delete this transaction? This action cannot be undone."
        type="error"
        confirmText="Delete"
        cancelText="Cancel"
      />
    </>
  );
}
