"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Loader2, Plus, User, Users, X } from "lucide-react";

interface AddPersonModalProps {
  isOpen: boolean;
  libraryId: number;
  entryPaths: string[];
  onClose: () => void;
  onSuccess: (personName: string, affectedCount: number) => void;
}

function AddPersonDialogContent({
  libraryId,
  entryPaths,
  onClose,
  onSuccess,
}: Omit<AddPersonModalProps, "isOpen">) {
  const [personName, setPersonName] = useState("");
  const [suggestions, setSuggestions] = useState<{ id: number; name: string }[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    fetch(`/api/gallery/people?libraryId=${libraryId}`, { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data: { people?: { id: number; name: string }[] }) => {
        setSuggestions(data.people ?? []);
      })
      .catch(() => {
        // ignore suggestions error
      });

    return () => controller.abort();
  }, [libraryId]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const clean = personName.trim();
    if (!clean) return;

    setSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/gallery/people", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          libraryId,
          entryPaths,
          personName: clean,
          action: "batch-add",
        }),
      });

      const data = (await response.json()) as {
        success?: boolean;
        affected?: number;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error || "Failed to tag person.");
      }

      onSuccess(clean, data.affected ?? entryPaths.length);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to tag person.");
    } finally {
      setSubmitting(false);
    }
  }

  const filteredSuggestions = suggestions
    .filter((s) =>
      personName.trim()
        ? s.name.toLowerCase().includes(personName.trim().toLowerCase())
        : true,
    )
    .slice(0, 8);

  return (
    <div className="relative w-full max-w-sm rounded-3xl border border-[#2e2e2e] bg-[#161616] p-6 shadow-2xl backdrop-blur-xl animate-in zoom-in-95 duration-150">
      <div className="flex items-center justify-between border-b border-[#262626] pb-3">
        <div className="flex items-center gap-2 text-zinc-100 font-semibold text-sm">
          <Users size={16} className="text-[#8ab4f8]" />
          <span>Tag Person</span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full p-1 text-zinc-400 hover:bg-[#242424] hover:text-white transition cursor-pointer"
        >
          <X size={15} />
        </button>
      </div>

      <p className="mt-3 text-xs text-zinc-400">
        Tag a person in{" "}
        <span className="font-semibold text-zinc-200">
          {entryPaths.length} selected photo{entryPaths.length === 1 ? "" : "s"}
        </span>
        .
      </p>

      {error && (
        <div className="mt-3 rounded-xl border border-rose-500/20 bg-rose-500/10 p-2.5 text-xs text-rose-400">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        <div>
          <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
            Person Name
          </label>
          <div className="relative">
            <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              required
              autoFocus
              value={personName}
              onChange={(e) => setPersonName(e.target.value)}
              placeholder="e.g. John Doe, Sarah..."
              className="h-10 w-full rounded-xl border border-[#2e2e2e] bg-[#1a1a1a] pl-8 pr-3 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition focus:border-[#8ab4f8] focus:ring-1 focus:ring-[#8ab4f8]/30"
            />
          </div>
        </div>

        {/* Autocomplete / Suggested list */}
        {filteredSuggestions.length > 0 && (
          <div>
            <span className="block text-[10px] text-zinc-500 uppercase tracking-wider mb-1.5">
              Existing People
            </span>
            <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
              {filteredSuggestions.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setPersonName(s.name)}
                  className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-medium transition cursor-pointer ${
                    personName.toLowerCase() === s.name.toLowerCase()
                      ? "border-[#8ab4f8] bg-[#8ab4f8]/15 text-[#8ab4f8]"
                      : "border-[#262626] bg-[#212121] text-zinc-300 hover:border-zinc-500 hover:text-white"
                  }`}
                >
                  <Plus size={11} />
                  <span>{s.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#262626]">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-4 py-2 text-xs font-semibold text-zinc-400 hover:bg-[#222] hover:text-zinc-200 transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting || !personName.trim()}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#8ab4f8] px-4 py-2 text-xs font-semibold text-zinc-950 transition hover:bg-[#a8c7fa] disabled:opacity-40 cursor-pointer"
          >
            {submitting ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <Plus size={13} />
            )}
            <span>Add Person</span>
          </button>
        </div>
      </form>
    </div>
  );
}

export function AddPersonModal({
  isOpen,
  libraryId,
  entryPaths,
  onClose,
  onSuccess,
}: AddPersonModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-100">
      <AddPersonDialogContent
        libraryId={libraryId}
        entryPaths={entryPaths}
        onClose={onClose}
        onSuccess={onSuccess}
      />
    </div>
  );
}
