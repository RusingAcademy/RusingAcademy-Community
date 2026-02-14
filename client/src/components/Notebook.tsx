// DESIGN: Premium Notebook — paper texture, glass cards, branded correction highlights, refined typography
import { motion, AnimatePresence } from "framer-motion";
import { useLocale } from "@/i18n/LocaleContext";
import { PenLine, CheckCircle2, Clock, AlertCircle, Heart, MessageCircle, ArrowLeft, Globe, Sparkles, Send } from "lucide-react";
import { notebookEntries as mockEntries, type NotebookEntry, type Correction } from "@/lib/extendedData";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";

interface DisplayEntry {
  id: number;
  title: string;
  text: string;
  language: string;
  status: "pending" | "corrected" | "perfect";
  correctionCount: number;
  authorName: string;
  authorAvatar: string | null;
  nativeLanguage: string;
  date: string;
  likes: number;
  corrections: Correction[];
  correctedByName?: string;
  correctedByAvatar?: string;
}

const statusConfig: Record<string, { icon: typeof CheckCircle2; label: string; color: string; bg: string; border: string }> = {
  corrected: { icon: CheckCircle2, label: "Corrected", color: "#D4AF37", bg: "rgba(212, 175, 55, 0.06)", border: "rgba(212, 175, 55, 0.12)" },
  perfect: { icon: Sparkles, label: "Perfect!", color: "#16a34a", bg: "rgba(34, 197, 94, 0.06)", border: "rgba(34, 197, 94, 0.12)" },
  pending: { icon: Clock, label: "Awaiting Correction", color: "#94a3b8", bg: "rgba(148, 163, 184, 0.06)", border: "rgba(148, 163, 184, 0.12)" },
};

function CorrectionHighlight({ correction }: { correction: Correction }) {
  return (
    <div
      className="rounded-xl p-3.5 space-y-2"
      style={{
        background: "white",
        border: "1px solid rgba(27, 20, 100, 0.05)",
        boxShadow: "0 1px 4px rgba(27, 20, 100, 0.03)",
      }}
    >
      <div className="flex items-start gap-2.5">
        <div className="shrink-0 mt-0.5 w-5 h-5 rounded-md flex items-center justify-center" style={{ background: "rgba(239, 68, 68, 0.06)" }}>
          <AlertCircle className="w-3 h-3 text-red-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm leading-relaxed">
            <span className="line-through text-red-400 px-1 rounded" style={{ background: "rgba(239, 68, 68, 0.06)" }}>{correction.original}</span>
            <span className="mx-2 text-muted-foreground/40">→</span>
            <span className="font-semibold px-1 rounded" style={{ color: "#D4AF37", background: "rgba(212, 175, 55, 0.06)" }}>{correction.corrected}</span>
          </p>
          <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed italic">{correction.explanation}</p>
        </div>
      </div>
    </div>
  );
}

function EntryCard({ entry, onSelect }: { entry: DisplayEntry; onSelect: (e: DisplayEntry) => void }) {
  const config = statusConfig[entry.status];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2, boxShadow: "0 8px 24px rgba(27, 20, 100, 0.06)" }}
      className="rounded-2xl p-5 cursor-pointer transition-all duration-300"
      style={{
        background: "white",
        border: "1px solid rgba(27, 20, 100, 0.05)",
        boxShadow: "var(--shadow-card)",
      }}
      onClick={() => onSelect(entry)}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-xs"
            style={{ background: "linear-gradient(135deg, #1B1464, #2D2580)" }}
          >
            {(entry.authorName || "?").split(" ").map(n => n[0]).join("").slice(0, 2)}
          </div>
          <div>
            <p className="text-sm font-bold text-foreground tracking-tight">{entry.authorName}</p>
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <Globe className="w-3 h-3" />
              <span>Writing in {entry.language}</span>
            </div>
          </div>
        </div>
        <span
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider"
          style={{ background: config.bg, color: config.color, border: `1px solid ${config.border}` }}
        >
          <Icon className="w-3 h-3" /> {config.label}
        </span>
      </div>

      <h3 className="font-bold text-foreground text-sm mb-2 tracking-tight">{entry.title}</h3>
      <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed mb-3">{entry.text}</p>

      {entry.correctionCount > 0 && (
        <div className="flex items-center gap-2 mb-3 text-[11px]">
          <span className="px-2 py-0.5 rounded-lg font-bold" style={{ background: "rgba(239, 68, 68, 0.05)", color: "#ef4444" }}>
            {entry.correctionCount} correction{entry.correctionCount > 1 ? "s" : ""}
          </span>
          {entry.correctedByName && (
            <span className="flex items-center gap-1 text-muted-foreground">
              by <span className="font-bold text-foreground">{entry.correctedByName}</span>
            </span>
          )}
        </div>
      )}

      <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-3" style={{ borderTop: "1px solid rgba(27, 20, 100, 0.04)" }}>
        <span className="font-medium">{entry.date}</span>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1"><Heart className="w-3.5 h-3.5" />{entry.likes}</span>
          <span className="flex items-center gap-1"><MessageCircle className="w-3.5 h-3.5" />{entry.correctionCount}</span>
        </div>
      </div>
    </motion.div>
  );
}

function EntryDetail({ entry, onBack }: { entry: DisplayEntry; onBack: () => void }) {
  const config = statusConfig[entry.status];
  const Icon = config.icon;
  const { isAuthenticated } = useAuth();

  const entryDetail = trpc.notebook.get.useQuery({ id: entry.id });
  const addCorrectionMutation = trpc.notebook.addCorrection.useMutation({
    onSuccess: () => { toast.success("Correction submitted!"); entryDetail.refetch(); },
    onError: () => toast.error("Failed to submit correction"),
  });

  const [correctionText, setCorrectionText] = useState("");
  const [explanationText, setExplanationText] = useState("");
  const [showCorrectionForm, setShowCorrectionForm] = useState(false);

  const corrections = entryDetail.data?.corrections || [];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
      <button onClick={onBack} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors font-medium">
        <ArrowLeft className="w-4 h-4" /> Back to notebook
      </button>

      <div
        className="rounded-2xl p-6 relative overflow-hidden"
        style={{
          background: "white",
          border: "1px solid rgba(27, 20, 100, 0.05)",
          boxShadow: "var(--shadow-card)",
        }}
      >
        {/* Paper texture accent */}
        <div className="absolute top-0 left-0 right-0 h-1" style={{ background: "linear-gradient(90deg, #1B1464, #D4AF37)" }} />

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-sm" style={{ background: "linear-gradient(135deg, #1B1464, #2D2580)" }}>
              {(entry.authorName || "?").split(" ").map(n => n[0]).join("").slice(0, 2)}
            </div>
            <div>
              <p className="font-bold text-foreground tracking-tight">{entry.authorName}</p>
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <Globe className="w-3 h-3" />
                <span>Writing in {entry.language}</span>
              </div>
            </div>
          </div>
          <span
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider"
            style={{ background: config.bg, color: config.color, border: `1px solid ${config.border}` }}
          >
            <Icon className="w-3 h-3" /> {config.label}
          </span>
        </div>

        <h2 className="text-lg font-bold text-foreground mb-3 tracking-tight">{entry.title}</h2>
        <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap" style={{ fontFamily: "'Georgia', serif", lineHeight: "1.8" }}>{entry.text}</p>

        <div className="flex items-center gap-4 mt-4 pt-4 text-[11px] text-muted-foreground" style={{ borderTop: "1px solid rgba(27, 20, 100, 0.04)" }}>
          <span className="font-medium">{entry.date}</span>
          <span className="flex items-center gap-1"><Heart className="w-3.5 h-3.5" /> {entry.likes} likes</span>
        </div>
      </div>

      {/* DB Corrections */}
      {corrections.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-bold text-foreground flex items-center gap-2 text-sm">
            <PenLine className="w-4 h-4" style={{ color: "#D4AF37" }} /> Corrections ({corrections.length})
          </h3>
          {corrections.map((c: any) => (
            <div key={c.id} className="rounded-xl p-4 space-y-2" style={{ background: "white", border: "1px solid rgba(27, 20, 100, 0.05)", boxShadow: "0 1px 4px rgba(27, 20, 100, 0.03)" }}>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-lg flex items-center justify-center text-white font-bold text-[10px]" style={{ background: "linear-gradient(135deg, #D4AF37, #E8CB6A)" }}>
                  {(c.correctorName || "?")[0]}
                </div>
                <span className="text-xs font-bold text-foreground">{c.correctorName || "Anonymous"}</span>
              </div>
              <p className="text-sm text-foreground leading-relaxed">{c.correctedContent}</p>
              {c.explanation && <p className="text-xs text-muted-foreground italic">{c.explanation}</p>}
            </div>
          ))}
        </div>
      )}

      {/* Mock corrections fallback */}
      {corrections.length === 0 && entry.corrections.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-bold text-foreground flex items-center gap-2 text-sm">
            <PenLine className="w-4 h-4" style={{ color: "#D4AF37" }} /> Corrections ({entry.corrections.length})
          </h3>
          {entry.corrections.map((correction, i) => (
            <CorrectionHighlight key={i} correction={correction} />
          ))}
        </div>
      )}

      {entry.status === "perfect" && (
        <div className="rounded-2xl p-5 text-center" style={{ background: "rgba(34, 197, 94, 0.04)", border: "1px solid rgba(34, 197, 94, 0.08)" }}>
          <Sparkles className="w-8 h-8 mx-auto mb-2" style={{ color: "#16a34a" }} />
          <p className="font-bold text-foreground">No corrections needed!</p>
          <p className="text-xs text-muted-foreground mt-1">This writing is grammatically correct. Great job!</p>
        </div>
      )}

      {entry.status === "pending" && !showCorrectionForm && (
        <div className="rounded-2xl p-5 text-center" style={{ background: "rgba(27, 20, 100, 0.02)", border: "1px solid rgba(27, 20, 100, 0.04)" }}>
          <Clock className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-40" />
          <p className="font-bold text-foreground">Awaiting Corrections</p>
          <p className="text-xs text-muted-foreground mt-1">Be the first to help correct this writing!</p>
          <Button
            onClick={() => {
              if (!isAuthenticated) { window.location.href = getLoginUrl(); return; }
              setShowCorrectionForm(true);
            }}
            className="mt-3 rounded-xl text-sm font-bold text-white border-0"
            style={{ background: "linear-gradient(135deg, #D4AF37, #E8CB6A)", boxShadow: "0 2px 8px rgba(212, 175, 55, 0.2)" }}
          >
            Correct This Writing
          </Button>
        </div>
      )}

      {/* Correction Form */}
      {showCorrectionForm && (
        <div className="rounded-2xl p-5 space-y-3" style={{ background: "white", border: "1px solid rgba(27, 20, 100, 0.05)", boxShadow: "var(--shadow-card)" }}>
          <h3 className="font-bold text-foreground flex items-center gap-2 text-sm">
            <PenLine className="w-4 h-4" style={{ color: "#D4AF37" }} /> Submit Your Correction
          </h3>
          <textarea
            value={correctionText}
            onChange={(e) => setCorrectionText(e.target.value)}
            placeholder="Rewrite the corrected version here..."
            className="w-full h-32 p-3 rounded-xl text-sm resize-none transition-all duration-200"
            style={{ background: "rgba(27, 20, 100, 0.02)", border: "1px solid rgba(27, 20, 100, 0.06)", outline: "none" }}
            onFocus={(e) => { e.target.style.borderColor = "rgba(212, 175, 55, 0.3)"; e.target.style.boxShadow = "0 0 0 3px rgba(212, 175, 55, 0.08)"; }}
            onBlur={(e) => { e.target.style.borderColor = "rgba(27, 20, 100, 0.06)"; e.target.style.boxShadow = "none"; }}
          />
          <textarea
            value={explanationText}
            onChange={(e) => setExplanationText(e.target.value)}
            placeholder="Explain your corrections (optional)..."
            className="w-full h-20 p-3 rounded-xl text-sm resize-none transition-all duration-200"
            style={{ background: "rgba(27, 20, 100, 0.02)", border: "1px solid rgba(27, 20, 100, 0.06)", outline: "none" }}
            onFocus={(e) => { e.target.style.borderColor = "rgba(212, 175, 55, 0.3)"; e.target.style.boxShadow = "0 0 0 3px rgba(212, 175, 55, 0.08)"; }}
            onBlur={(e) => { e.target.style.borderColor = "rgba(27, 20, 100, 0.06)"; e.target.style.boxShadow = "none"; }}
          />
          <div className="flex gap-2">
            <Button
              onClick={() => {
                if (!correctionText.trim()) { toast.error("Please write a correction"); return; }
                addCorrectionMutation.mutate({ entryId: entry.id, correctedContent: correctionText, explanation: explanationText || undefined });
              }}
              disabled={addCorrectionMutation.isPending}
              className="rounded-xl text-sm flex-1 font-bold text-white border-0"
              style={{ background: "linear-gradient(135deg, #1B1464, #2D2580)", boxShadow: "0 2px 8px rgba(27, 20, 100, 0.15)" }}
            >
              <Send className="w-4 h-4 mr-2" />
              {addCorrectionMutation.isPending ? "Submitting..." : "Submit Correction"}
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowCorrectionForm(false)}
              className="rounded-xl text-sm font-medium"
              style={{ border: "1px solid rgba(27, 20, 100, 0.08)" }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {!showCorrectionForm && entry.status !== "pending" && (
        <Button
          onClick={() => {
            if (!isAuthenticated) { window.location.href = getLoginUrl(); return; }
            setShowCorrectionForm(true);
          }}
          variant="outline"
          className="w-full rounded-xl font-medium"
          style={{ border: "1px solid rgba(27, 20, 100, 0.08)" }}
        >
          <PenLine className="w-4 h-4 mr-2" /> Add Your Correction
        </Button>
      )}
    </motion.div>
  );
}

// ── Write New Entry Modal ──────────────────────────────────
function WriteEntryForm({ onClose }: { onClose: () => void }) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [language, setLanguage] = useState<"french" | "english">("french");

  const createMutation = trpc.notebook.create.useMutation({
    onSuccess: () => { toast.success("Entry published! Awaiting corrections."); onClose(); },
    onError: () => toast.error("Failed to publish entry"),
  });

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
      <button onClick={onClose} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors font-medium">
        <ArrowLeft className="w-4 h-4" /> Back to notebook
      </button>

      <div className="rounded-2xl p-6 space-y-4 relative overflow-hidden" style={{ background: "white", border: "1px solid rgba(27, 20, 100, 0.05)", boxShadow: "var(--shadow-card)" }}>
        <div className="absolute top-0 left-0 right-0 h-1" style={{ background: "linear-gradient(90deg, #1B1464, #D4AF37)" }} />
        <h2 className="text-lg font-bold text-foreground tracking-tight">Write a New Entry</h2>
        <p className="text-sm text-muted-foreground">Write in your target language and get corrections from the community.</p>

        <div className="flex gap-2">
          {(["french", "english"] as const).map((lang) => (
            <button
              key={lang}
              onClick={() => setLanguage(lang)}
              className="px-4 py-2 rounded-xl text-sm font-bold transition-all duration-200"
              style={{
                background: language === lang ? "linear-gradient(135deg, #1B1464, #2D2580)" : "rgba(27, 20, 100, 0.03)",
                color: language === lang ? "white" : undefined,
                boxShadow: language === lang ? "0 2px 8px rgba(27, 20, 100, 0.15)" : "none",
              }}
            >
              {lang === "french" ? "Français" : "English"}
            </button>
          ))}
        </div>

        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title of your entry..."
          className="w-full p-3 rounded-xl text-sm transition-all duration-200"
          style={{ background: "rgba(27, 20, 100, 0.02)", border: "1px solid rgba(27, 20, 100, 0.06)", outline: "none" }}
          onFocus={(e) => { e.target.style.borderColor = "rgba(212, 175, 55, 0.3)"; e.target.style.boxShadow = "0 0 0 3px rgba(212, 175, 55, 0.08)"; }}
          onBlur={(e) => { e.target.style.borderColor = "rgba(27, 20, 100, 0.06)"; e.target.style.boxShadow = "none"; }}
        />

        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={language === "french" ? "Écrivez votre texte en français ici..." : "Write your text in English here..."}
          className="w-full h-48 p-3 rounded-xl text-sm resize-none transition-all duration-200"
          style={{ background: "rgba(27, 20, 100, 0.02)", border: "1px solid rgba(27, 20, 100, 0.06)", outline: "none", fontFamily: "'Georgia', serif", lineHeight: "1.8" }}
          onFocus={(e) => { e.target.style.borderColor = "rgba(212, 175, 55, 0.3)"; e.target.style.boxShadow = "0 0 0 3px rgba(212, 175, 55, 0.08)"; }}
          onBlur={(e) => { e.target.style.borderColor = "rgba(27, 20, 100, 0.06)"; e.target.style.boxShadow = "none"; }}
        />

        <Button
          onClick={() => {
            if (!title.trim() || !content.trim()) { toast.error("Please fill in both title and content"); return; }
            createMutation.mutate({ title, content, language });
          }}
          disabled={createMutation.isPending}
          className="w-full rounded-xl font-bold text-white border-0"
          style={{ background: "linear-gradient(135deg, #1B1464, #2D2580)", boxShadow: "0 2px 8px rgba(27, 20, 100, 0.15)" }}
        >
          <Send className="w-4 h-4 mr-2" />
          {createMutation.isPending ? "Publishing..." : "Publish Entry"}
        </Button>
      </div>
    </motion.div>
  );
}

export default function Notebook() {
  const { t } = useLocale();
  const { isAuthenticated } = useAuth();
  const entriesQuery = trpc.notebook.list.useQuery({ limit: 20, offset: 0 });

  const [selectedEntry, setSelectedEntry] = useState<DisplayEntry | null>(null);
  const [showWriteForm, setShowWriteForm] = useState(false);
  const [filter, setFilter] = useState<string>("all");

  const displayEntries: DisplayEntry[] = useMemo(() => {
    if (!entriesQuery.data?.entries || entriesQuery.data.entries.length === 0) {
      return mockEntries.map((e) => ({
        id: parseInt(e.id), title: e.title, text: e.text, language: e.language,
        status: e.status as "pending" | "corrected" | "perfect",
        correctionCount: e.corrections.length, authorName: e.author.name,
        authorAvatar: e.author.avatar, nativeLanguage: e.author.nativeLanguage,
        date: e.date, likes: e.likes, corrections: e.corrections,
        correctedByName: e.correctedBy?.name, correctedByAvatar: e.correctedBy?.avatar,
      }));
    }
    return entriesQuery.data.entries.map((e) => ({
      id: e.id, title: e.title, text: e.content, language: e.language,
      status: (e.status === "archived" ? "corrected" : e.status) as "pending" | "corrected" | "perfect",
      correctionCount: e.correctionCount ?? 0, authorName: e.authorName || "Anonymous",
      authorAvatar: e.authorAvatar, nativeLanguage: "—",
      date: e.createdAt ? new Date(e.createdAt).toLocaleDateString() : "—",
      likes: 0, corrections: [],
    }));
  }, [entriesQuery.data]);

  if (showWriteForm) return <WriteEntryForm onClose={() => { setShowWriteForm(false); entriesQuery.refetch(); }} />;
  if (selectedEntry) return <EntryDetail entry={selectedEntry} onBack={() => setSelectedEntry(null)} />;

  const filtered = filter === "all" ? displayEntries : displayEntries.filter((e) => e.status === filter);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground tracking-tight">Notebook</h2>
          <p className="text-sm text-muted-foreground">Write in your target language and get corrections from native speakers</p>
        </div>
        <Button
          onClick={() => {
            if (!isAuthenticated) { window.location.href = getLoginUrl(); return; }
            setShowWriteForm(true);
          }}
          className="rounded-xl text-sm font-bold text-white border-0"
          style={{ background: "linear-gradient(135deg, #1B1464, #2D2580)", boxShadow: "0 2px 8px rgba(27, 20, 100, 0.15)" }}
        >
          <PenLine className="w-4 h-4 mr-2" /> Write Entry
        </Button>
      </div>

      <div className="flex items-center gap-1.5 p-0.5 rounded-xl w-fit" style={{ background: "rgba(27, 20, 100, 0.03)" }}>
        {["all", "pending", "corrected", "perfect"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="px-3.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all duration-200"
            style={{
              background: filter === f ? "linear-gradient(135deg, #1B1464, #2D2580)" : "transparent",
              color: filter === f ? "white" : undefined,
              boxShadow: filter === f ? "0 2px 6px rgba(27, 20, 100, 0.15)" : "none",
            }}
          >
            {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {entriesQuery.isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="rounded-2xl p-5 animate-pulse space-y-3" style={{ background: "white", border: "1px solid rgba(27, 20, 100, 0.05)" }}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl" style={{ background: "rgba(27, 20, 100, 0.04)" }} />
                <div className="space-y-1.5">
                  <div className="h-3 rounded w-24" style={{ background: "rgba(27, 20, 100, 0.04)" }} />
                  <div className="h-2 rounded w-32" style={{ background: "rgba(27, 20, 100, 0.04)" }} />
                </div>
              </div>
              <div className="h-4 rounded w-3/4" style={{ background: "rgba(27, 20, 100, 0.04)" }} />
              <div className="h-3 rounded w-full" style={{ background: "rgba(27, 20, 100, 0.04)" }} />
              <div className="h-3 rounded w-2/3" style={{ background: "rgba(27, 20, 100, 0.04)" }} />
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((entry) => (
            <EntryCard key={entry.id} entry={entry} onSelect={setSelectedEntry} />
          ))}
        </div>
      )}

      {!entriesQuery.isLoading && filtered.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-2xl mx-auto mb-3 flex items-center justify-center" style={{ background: "rgba(27, 20, 100, 0.03)" }}>
            <PenLine className="w-8 h-8 text-muted-foreground opacity-30" />
          </div>
          <p className="text-sm text-muted-foreground font-medium">No entries found</p>
        </div>
      )}
    </div>
  );
}
