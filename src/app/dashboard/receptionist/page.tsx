"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import {
    Users,
    UserCheck,
    CheckCircle2,
    Clock,
    ChevronRight,
    ChevronDown,
    UserPlus,
    Zap,
    ArrowDown,
    Loader2,
    X,
    Keyboard,
    Hash,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type TokenStatus = "waiting" | "in_consultation" | "completed";

interface Token {
    id: string;
    token_number: number;
    patient_name: string;
    status: TokenStatus;
    created_at: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function formatTokenNumber(n: number): string {
    return `A-${String(n).padStart(3, "0")}`;
}

function formatTime(iso: string): string {
    return new Date(iso).toLocaleTimeString("en-PK", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
    });
}

function formatRelativeTime(iso: string): string {
    const diffMs = Date.now() - new Date(iso).getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return "Just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    return `${Math.floor(diffMin / 60)}h ${diffMin % 60}m ago`;
}

// ---------------------------------------------------------------------------
// Status badge
// ---------------------------------------------------------------------------
const STATUS_CONFIG: Record<
    TokenStatus,
    { label: string; classes: string; dot: string }
> = {
    waiting: {
        label: "Waiting",
        classes: "bg-amber-500/15 text-amber-300 border-amber-500/25",
        dot: "bg-amber-400",
    },
    in_consultation: {
        label: "In Consultation",
        classes: "bg-emerald-500/15 text-emerald-300 border-emerald-500/25",
        dot: "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]",
    },
    completed: {
        label: "Completed",
        classes: "bg-slate-500/15 text-slate-400 border-slate-500/20",
        dot: "bg-slate-500",
    },
};

function StatusBadge({ status }: { status: TokenStatus }) {
    const cfg = STATUS_CONFIG[status];
    return (
        <span
            className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
                cfg.classes
            )}
        >
            <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", cfg.dot)} />
            {cfg.label}
        </span>
    );
}

// ---------------------------------------------------------------------------
// Token row — used in the Active Queue list
// ---------------------------------------------------------------------------
interface TokenRowProps {
    token: Token;
    index: number;
    isTop: boolean;
}

function TokenRow({ token, index, isTop }: TokenRowProps) {
    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -24, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
            className={cn(
                "group relative flex items-center gap-4 rounded-2xl border px-5 py-4",
                "transition-colors duration-200",
                isTop
                    ? "border-emerald-500/30 bg-gradient-to-r from-emerald-500/10 to-teal-500/5 shadow-[0_0_16px_rgba(16,185,129,0.08)]"
                    : "border-slate-700/50 bg-slate-800/40 hover:border-slate-600/60 hover:bg-slate-800/60"
            )}
        >
            {/* Position indicator */}
            <div
                className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-bold",
                    isTop
                        ? "bg-emerald-500/20 text-emerald-300"
                        : "bg-slate-700/60 text-slate-400"
                )}
            >
                {index + 1}
            </div>

            {/* Token number — large for readability */}
            <div className="flex flex-col leading-none">
                <span
                    className={cn(
                        "text-xl font-extrabold tracking-tight",
                        isTop ? "text-emerald-300" : "text-slate-100"
                    )}
                >
                    {formatTokenNumber(token.token_number)}
                </span>
                <span className="mt-0.5 text-xs text-slate-500">
                    {formatTime(token.created_at)}
                </span>
            </div>

            {/* Patient name */}
            <div className="flex-1 min-w-0">
                <p
                    className={cn(
                        "truncate text-lg font-semibold",
                        isTop ? "text-white" : "text-slate-200"
                    )}
                >
                    {token.patient_name}
                </p>
                <p className="text-xs text-slate-500">
                    {formatRelativeTime(token.created_at)}
                </p>
            </div>

            {/* Status */}
            <StatusBadge status={token.status} />

            {/* Next indicator for top item */}
            {isTop && (
                <span className="ml-1 flex items-center gap-1 rounded-lg bg-emerald-500/20 px-2 py-1 text-xs font-semibold text-emerald-300">
                    <Zap className="h-3 w-3" />
                    Next
                </span>
            )}
        </motion.div>
    );
}

// ---------------------------------------------------------------------------
// "Currently Called" card
// ---------------------------------------------------------------------------
function CalledCard({ token }: { token: Token }) {
    return (
        <motion.div
            key={token.id}
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.94 }}
            transition={{ type: "spring", stiffness: 340, damping: 28 }}
            className="relative overflow-hidden rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent p-6 shadow-[0_0_32px_rgba(16,185,129,0.12)]"
        >
            {/* Pulse ring */}
            <motion.div
                animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0, 0.3] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                className="absolute inset-0 rounded-2xl border-2 border-emerald-500/40 pointer-events-none"
            />

            <div className="flex items-start gap-4">
                {/* Avatar */}
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/30">
                    <UserCheck className="h-7 w-7" strokeWidth={1.75} />
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold uppercase tracking-widest text-emerald-500">
                            Now Serving
                        </span>
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.9)]" />
                    </div>
                    <p className="text-3xl font-extrabold tracking-tight text-white">
                        {formatTokenNumber(token.token_number)}
                    </p>
                    <p className="mt-1 truncate text-xl font-semibold text-slate-200">
                        {token.patient_name}
                    </p>
                    <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
                        <Clock className="h-3 w-3" />
                        Called at {formatTime(token.created_at)}
                    </p>
                </div>
            </div>
        </motion.div>
    );
}

// ---------------------------------------------------------------------------
// Completed row (compact)
// ---------------------------------------------------------------------------
function CompletedRow({ token }: { token: Token }) {
    return (
        <motion.div
            layout
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex items-center gap-3 rounded-xl border border-slate-700/40 bg-slate-800/30 px-4 py-2.5"
        >
            <CheckCircle2 className="h-4 w-4 shrink-0 text-slate-600" />
            <span className="text-sm font-bold text-slate-400 tabular-nums">
                {formatTokenNumber(token.token_number)}
            </span>
            <span className="flex-1 truncate text-sm text-slate-500">
                {token.patient_name}
            </span>
            <span className="text-xs text-slate-600">{formatTime(token.created_at)}</span>
        </motion.div>
    );
}

// ---------------------------------------------------------------------------
// Manual Add Modal
// ---------------------------------------------------------------------------
function ManualAddModal({
    isOpen,
    onClose,
    onSubmit,
    loading,
}: {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (name: string) => void;
    loading: boolean;
}) {
    const [name, setName] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            setName("");
            setTimeout(() => inputRef.current?.focus(), 80);
        }
    }, [isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = name.trim();
        if (!trimmed) return;
        onSubmit(trimmed);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm"
                        onClick={onClose}
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, y: 32, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 24, scale: 0.96 }}
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                        className="fixed inset-x-0 top-1/3 z-50 mx-auto max-w-md px-4"
                    >
                        <div className="rounded-3xl border border-slate-700/60 bg-slate-900/95 p-8 shadow-[0_32px_80px_rgba(0,0,0,0.7)] backdrop-blur-2xl">
                            {/* Header */}
                            <div className="mb-6 flex items-center justify-between">
                                <div>
                                    <h2 className="text-xl font-bold text-white">
                                        Add Walk-in Patient
                                    </h2>
                                    <p className="mt-0.5 text-sm text-slate-500">
                                        Assign the next available token number.
                                    </p>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-800 hover:text-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-600"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                                <div className="relative">
                                    <UserPlus className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
                                    <input
                                        ref={inputRef}
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="Patient full name"
                                        className="w-full rounded-2xl border border-slate-700/60 bg-slate-800/60 py-3.5 pl-12 pr-4 text-base text-white placeholder:text-slate-600 outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                                        autoComplete="off"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={!name.trim() || loading}
                                    className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 py-3.5 text-base font-semibold text-white shadow-lg transition-all hover:from-emerald-500 hover:to-teal-500 disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/60"
                                >
                                    {loading ? (
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                    ) : (
                                        <>
                                            <UserPlus className="h-5 w-5" />
                                            Add to Queue
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

// ---------------------------------------------------------------------------
// Hotkey hint pill
// ---------------------------------------------------------------------------
function HotkeyPill({
    keys,
    label,
}: {
    keys: string[];
    label: string;
}) {
    return (
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
            {keys.map((k) => (
                <kbd
                    key={k}
                    className="inline-flex min-w-[1.5rem] items-center justify-center rounded-md border border-slate-700/70 bg-slate-800/80 px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 shadow-sm"
                >
                    {k}
                </kbd>
            ))}
            <span>{label}</span>
        </div>
    );
}

// ---------------------------------------------------------------------------
// Main Receptionist Dashboard Page
// ---------------------------------------------------------------------------


export default function ReceptionistDashboardPage() {
    const supabaseRef = useRef(createClient());
    const supabase = supabaseRef.current;

    const [tokens, setTokens] = useState<Token[]>([]);
    const [loading, setLoading] = useState(true);
    const [addingPatient, setAddingPatient] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [actionPending, setActionPending] = useState(false);
    const [toast, setToast] = useState<{
        message: string;
        type: "success" | "error";
    } | null>(null);

    // Keep a ref so hotkey handlers always see fresh state
    const tokensRef = useRef<Token[]>([]);
    tokensRef.current = tokens;

    // ── Toast helper ──────────────────────────────────────────────────────────
    const showToast = useCallback(
        (message: string, type: "success" | "error" = "success") => {
            setToast({ message, type });
            setTimeout(() => setToast(null), 3000);
        },
        []
    );

    // ── Initial fetch ─────────────────────────────────────────────────────────
    useEffect(() => {
        const fetchTokens = async () => {
            setLoading(true);
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const { data, error } = await supabase
                .from("tokens")
                .select("id, token_number, patient_name, status, created_at")
                .gte("created_at", today.toISOString())
                .order("token_number", { ascending: true });

            if (error) {
                console.error("Fetch error:", error);
                showToast("Failed to load queue data.", "error");
            } else {
                setTokens(data ?? []);
            }
            setLoading(false);
        };

        fetchTokens();
    }, [supabase, showToast]);

    // ── Realtime channel ──────────────────────────────────────────────────────
    useEffect(() => {
        const channel = supabase
            .channel("receptionist-queue")
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "tokens",
                },
                (payload) => {
                    const newToken = payload.new as Token;
                    setTokens((prev) => {
                        if (prev.find((t) => t.id === newToken.id)) return prev;
                        return [...prev, newToken].sort(
                            (a, b) => a.token_number - b.token_number
                        );
                    });
                }
            )
            .on(
                "postgres_changes",
                {
                    event: "UPDATE",
                    schema: "public",
                    table: "tokens",
                },
                (payload) => {
                    const updated = payload.new as Token;
                    setTokens((prev) =>
                        prev
                            .map((t) => (t.id === updated.id ? updated : t))
                            .sort((a, b) => a.token_number - b.token_number)
                    );
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [supabase]);

    // ── Derived queues ────────────────────────────────────────────────────────
    const waitingQueue = tokens.filter((t) => t.status === "waiting");
    const calledToken = tokens.find((t) => t.status === "in_consultation") ?? null;
    const completedToday = tokens.filter((t) => t.status === "completed");

    // ── Call Next Patient (Spacebar) ──────────────────────────────────────────
    const callNext = useCallback(async () => {
        if (actionPending) return;
        const current = tokensRef.current;
        const next = current.find((t) => t.status === "waiting");
        if (!next) {
            showToast("No patients waiting in queue.", "error");
            return;
        }

        setActionPending(true);
        const currentCalled = current.find((t) => t.status === "in_consultation");

        // ── Optimistic UI update — apply immediately before DB round-trip ──
        const snapshot = tokensRef.current; // keep snapshot for rollback
        setTokens((prev) =>
            prev.map((t) => {
                if (t.id === next.id) return { ...t, status: "in_consultation" as const };
                if (currentCalled && t.id === currentCalled.id) return { ...t, status: "completed" as const };
                return t;
            })
        );

        // ── Persist to DB ─────────────────────────────────────────────────
        let dbError = false;

        // Mark previous in_consultation patient as completed in DB
        if (currentCalled) {
            const { error: completeError } = await supabase
                .from("tokens")
                .update({ status: "completed" })
                .eq("id", currentCalled.id);
            if (completeError) dbError = true;
        }

        // Move the next waiting patient to in_consultation in DB
        const { error } = await supabase
            .from("tokens")
            .update({ status: "in_consultation" })
            .eq("id", next.id);

        if (error || dbError) {
            // Roll back the optimistic update on failure
            setTokens(snapshot);
            showToast("Failed to call next patient.", "error");
        } else {
            showToast(
                `Now calling ${formatTokenNumber(next.token_number)} — ${next.patient_name}`
            );
        }

        setActionPending(false);
    }, [actionPending, supabase, showToast]);

    // ── Bump Down (B) ─────────────────────────────────────────────────────────
    const bumpDown = useCallback(async () => {
        if (actionPending) return;
        const current = tokensRef.current;
        const queue = current.filter((t) => t.status === "waiting");
        if (queue.length < 2) {
            showToast("Not enough patients to bump down.", "error");
            return;
        }

        setActionPending(true);
        const top = queue[0];
        const second = queue[1];

        // Swap token numbers
        const { error } = await supabase.rpc("swap_token_numbers", {
            id_a: top.id,
            num_a: second.token_number,
            id_b: second.id,
            num_b: top.token_number,
        });

        if (error) {
            // Fallback: simple optimistic local swap if RPC doesn't exist yet
            setTokens((prev) =>
                prev
                    .map((t) => {
                        if (t.id === top.id) return { ...t, token_number: second.token_number };
                        if (t.id === second.id) return { ...t, token_number: top.token_number };
                        return t;
                    })
                    .sort((a, b) => a.token_number - b.token_number)
            );
            showToast(`Bumped ${top.patient_name} down (local only).`);
        } else {
            showToast(`Bumped ${top.patient_name} down the queue.`);
        }

        setActionPending(false);
    }, [actionPending, supabase, showToast]);

    // ── Manual Add (M) ───────────────────────────────────────────────────────
    const handleManualAdd = useCallback(
        async (name: string) => {
            setAddingPatient(true);
            const current = tokensRef.current;
            const maxToken =
                current.length > 0
                    ? Math.max(...current.map((t) => t.token_number))
                    : 0;
            const nextNumber = maxToken + 1;

            const { error } = await supabase.from("tokens").insert({
                patient_name: name,
                status: "waiting",
                token_number: nextNumber,
            });

            if (error) {
                showToast("Failed to add patient.", "error");
            } else {
                showToast(`Added ${name} as ${formatTokenNumber(nextNumber)}.`);
                setShowModal(false);
            }
            setAddingPatient(false);
        },
        [supabase, showToast]
    );

    // ── Keyboard hotkeys ──────────────────────────────────────────────────────
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            // Ignore when typing in an input / modal textarea
            const target = e.target as HTMLElement;
            if (
                target.tagName === "INPUT" ||
                target.tagName === "TEXTAREA" ||
                target.isContentEditable
            )
                return;

            if (e.code === "Space") {
                e.preventDefault();
                callNext();
            } else if (e.key === "b" || e.key === "B") {
                bumpDown();
            } else if (e.key === "m" || e.key === "M") {
                setShowModal(true);
            }
        };

        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [callNext, bumpDown]);

    // ── Loading state ─────────────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="flex h-[60vh] flex-col items-center justify-center gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-emerald-500" />
                <p className="text-sm text-slate-500">Loading queue data…</p>
            </div>
        );
    }

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <>
            {/* Manual Add Modal */}
            <ManualAddModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                onSubmit={handleManualAdd}
                loading={addingPatient}
            />

            {/* Toast notification */}
            <AnimatePresence>
                {toast && (
                    <motion.div
                        key="toast"
                        initial={{ opacity: 0, y: -16, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.96 }}
                        transition={{ type: "spring", stiffness: 400, damping: 28 }}
                        className={cn(
                            "fixed right-6 top-20 z-[60] flex items-center gap-3 rounded-2xl border px-5 py-3.5 shadow-xl backdrop-blur-md",
                            toast.type === "success"
                                ? "border-emerald-500/30 bg-emerald-950/80 text-emerald-300"
                                : "border-red-500/30 bg-red-950/80 text-red-300"
                        )}
                    >
                        {toast.type === "success" ? (
                            <CheckCircle2 className="h-4 w-4 shrink-0" />
                        ) : (
                            <X className="h-4 w-4 shrink-0" />
                        )}
                        <span className="text-sm font-medium">{toast.message}</span>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="flex h-full flex-col gap-6">
                {/* ── Page header ── */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-white">
                            Receptionist Dashboard
                        </h1>
                        <p className="mt-0.5 text-sm text-slate-500">
                            Today &apos;s queue · {tokens.length} total patients registered
                        </p>
                    </div>

                    {/* Quick-action buttons */}
                    <div className="flex items-center gap-2">
                        <button
                            id="btn-call-next"
                            onClick={callNext}
                            disabled={actionPending || waitingQueue.length === 0}
                            className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-sm font-semibold text-emerald-300 transition-all hover:bg-emerald-500/20 disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/60"
                        >
                            {actionPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <ChevronRight className="h-4 w-4" />
                            )}
                            Call Next
                        </button>
                        <button
                            id="btn-bump-down"
                            onClick={bumpDown}
                            disabled={actionPending || waitingQueue.length < 2}
                            className="flex items-center gap-2 rounded-xl border border-slate-700/60 bg-slate-800/50 px-4 py-2.5 text-sm font-semibold text-slate-300 transition-all hover:border-slate-600/80 hover:bg-slate-800/80 disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-600"
                        >
                            <ArrowDown className="h-4 w-4" />
                            Bump Down
                        </button>
                        <button
                            id="btn-manual-add"
                            onClick={() => setShowModal(true)}
                            className="flex items-center gap-2 rounded-xl border border-slate-700/60 bg-slate-800/50 px-4 py-2.5 text-sm font-semibold text-slate-300 transition-all hover:border-slate-600/80 hover:bg-slate-800/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-600"
                        >
                            <UserPlus className="h-4 w-4" />
                            Walk-in
                        </button>
                    </div>
                </div>

                {/* ── Stats strip ── */}
                <div className="grid grid-cols-3 gap-4">
                    {[
                        {
                            label: "Waiting",
                            value: waitingQueue.length,
                            icon: Clock,
                            color: "amber",
                        },
                        {
                            label: "In Consultation",
                            value: calledToken ? 1 : 0,
                            icon: UserCheck,
                            color: "emerald",
                        },
                        {
                            label: "Completed Today",
                            value: completedToday.length,
                            icon: CheckCircle2,
                            color: "slate",
                        },
                    ].map(({ label, value, icon: Icon, color }) => (
                        <div
                            key={label}
                            className={cn(
                                "flex items-center gap-4 rounded-2xl border px-5 py-4",
                                color === "amber" &&
                                "border-amber-500/20 bg-amber-500/5",
                                color === "emerald" &&
                                "border-emerald-500/20 bg-emerald-500/5",
                                color === "slate" && "border-slate-700/50 bg-slate-800/30"
                            )}
                        >
                            <div
                                className={cn(
                                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                                    color === "amber" && "bg-amber-500/15 text-amber-400",
                                    color === "emerald" &&
                                    "bg-emerald-500/15 text-emerald-400",
                                    color === "slate" && "bg-slate-700/60 text-slate-400"
                                )}
                            >
                                <Icon className="h-5 w-5" strokeWidth={1.75} />
                            </div>
                            <div>
                                <p className="text-2xl font-extrabold text-white tabular-nums">
                                    {value}
                                </p>
                                <p className="text-xs text-slate-500">{label}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* ── Main split layout ── */}
                <div className="grid flex-1 grid-cols-[1fr_380px] gap-6 overflow-hidden">
                    {/* Left: Active Queue */}
                    <div className="flex flex-col overflow-hidden rounded-2xl border border-slate-700/50 bg-slate-900/40">
                        {/* Column header */}
                        <div className="flex shrink-0 items-center justify-between border-b border-slate-700/50 px-5 py-4">
                            <div className="flex items-center gap-2.5">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/15 text-amber-400">
                                    <Users className="h-4 w-4" strokeWidth={1.75} />
                                </div>
                                <div>
                                    <h2 className="text-base font-bold text-white">
                                        Active Queue
                                    </h2>
                                    <p className="text-xs text-slate-500">
                                        {waitingQueue.length} waiting
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 rounded-lg border border-slate-700/50 bg-slate-800/50 px-3 py-1.5">
                                <Hash className="h-3.5 w-3.5 text-slate-500" />
                                <span className="text-xs font-medium text-slate-400">
                                    Token Order
                                </span>
                            </div>
                        </div>

                        {/* Queue list */}
                        <div className="flex-1 overflow-y-auto p-4">
                            {waitingQueue.length === 0 ? (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="flex h-full flex-col items-center justify-center gap-3 text-center"
                                >
                                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-700/50 bg-slate-800/50">
                                        <Users className="h-8 w-8 text-slate-600" />
                                    </div>
                                    <p className="text-base font-semibold text-slate-400">
                                        Queue is currently empty
                                    </p>
                                    <p className="text-sm text-slate-600">
                                        Press{" "}
                                        <kbd className="rounded border border-slate-700 bg-slate-800 px-1.5 py-0.5 text-xs font-semibold text-slate-400">
                                            M
                                        </kbd>{" "}
                                        to add a walk-in patient.
                                    </p>
                                </motion.div>
                            ) : (
                                <motion.div className="flex flex-col gap-2" layout>
                                    <AnimatePresence initial={false}>
                                        {waitingQueue.map((token, i) => (
                                            <TokenRow
                                                key={token.id}
                                                token={token}
                                                index={i}
                                                isTop={i === 0}
                                            />
                                        ))}
                                    </AnimatePresence>
                                </motion.div>
                            )}
                        </div>
                    </div>

                    {/* Right column */}
                    <div className="flex flex-col gap-4 overflow-hidden">
                        {/* Currently Called */}
                        <div className="shrink-0">
                            <div className="mb-3 flex items-center gap-2">
                                <UserCheck className="h-4 w-4 text-emerald-400" />
                                <h2 className="text-sm font-bold uppercase tracking-wider text-emerald-400">
                                    Currently Called
                                </h2>
                            </div>
                            <AnimatePresence mode="wait">
                                {calledToken ? (
                                    <CalledCard key={calledToken.id} token={calledToken} />
                                ) : (
                                    <motion.div
                                        key="empty-called"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-slate-700/40 bg-slate-800/30 py-8 text-center"
                                    >
                                        <UserCheck className="h-8 w-8 text-slate-600" />
                                        <p className="text-sm text-slate-500">
                                            No patient called yet
                                        </p>
                                        <p className="text-xs text-slate-600">
                                            Press{" "}
                                            <kbd className="rounded border border-slate-700 bg-slate-800 px-1.5 py-0.5 text-[10px] font-semibold">
                                                Space
                                            </kbd>{" "}
                                            to call next
                                        </p>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Completed today */}
                        <div className="flex flex-1 flex-col overflow-hidden rounded-2xl border border-slate-700/50 bg-slate-900/40">
                            <div className="flex shrink-0 items-center justify-between border-b border-slate-700/50 px-5 py-3.5">
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-slate-500" />
                                    <h2 className="text-sm font-bold text-slate-300">
                                        Completed Today
                                    </h2>
                                </div>
                                <span className="rounded-full bg-slate-800 px-2 py-0.5 text-xs font-semibold text-slate-400">
                                    {completedToday.length}
                                </span>
                            </div>

                            <div className="flex-1 overflow-y-auto p-3">
                                {completedToday.length === 0 ? (
                                    <div className="flex h-full items-center justify-center">
                                        <p className="text-sm text-slate-600">
                                            No completed consultations yet.
                                        </p>
                                    </div>
                                ) : (
                                    <motion.div className="flex flex-col gap-1.5" layout>
                                        <AnimatePresence initial={false}>
                                            {[...completedToday]
                                                .sort(
                                                    (a, b) =>
                                                        new Date(b.created_at).getTime() -
                                                        new Date(a.created_at).getTime()
                                                )
                                                .map((token) => (
                                                    <CompletedRow key={token.id} token={token} />
                                                ))}
                                        </AnimatePresence>
                                    </motion.div>
                                )}
                            </div>
                        </div>

                        {/* Hotkey legend */}
                        <div className="shrink-0 rounded-2xl border border-slate-700/40 bg-slate-800/30 px-4 py-3.5">
                            <div className="mb-2.5 flex items-center gap-2">
                                <Keyboard className="h-3.5 w-3.5 text-slate-500" />
                                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                                    Keyboard Shortcuts
                                </span>
                            </div>
                            <div className="flex flex-col gap-2">
                                <HotkeyPill keys={["Space"]} label="Call next patient" />
                                <HotkeyPill keys={["B"]} label="Bump top patient down" />
                                <HotkeyPill keys={["M"]} label="Manual walk-in add" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
