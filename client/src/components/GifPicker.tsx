/**
 * GifPicker — Tenor GIF search & browse component
 * Uses the Tenor v2 public API (free tier, no key required for limited usage)
 * Falls back to a curated set of popular GIF categories
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { Search, X, Loader2, TrendingUp, Smile } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface GifPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (gifUrl: string) => void;
}

interface TenorGif {
  id: string;
  title: string;
  media_formats: {
    gif?: { url: string; dims: number[] };
    tinygif?: { url: string; dims: number[] };
    mediumgif?: { url: string; dims: number[] };
    nanogif?: { url: string; dims: number[] };
  };
}

interface TenorResponse {
  results: TenorGif[];
  next: string;
}

// Tenor v2 API key (free public key for limited usage)
const TENOR_API_KEY = "AIzaSyAyimkuYQYF_FXVALexPuGQctUWRURdCYQ";
const TENOR_BASE = "https://tenor.googleapis.com/v2";

const CATEGORIES = [
  { label: "Trending", emoji: "🔥", query: "" },
  { label: "Reactions", emoji: "😂", query: "reaction" },
  { label: "Celebrate", emoji: "🎉", query: "celebrate" },
  { label: "Thumbs Up", emoji: "👍", query: "thumbs up" },
  { label: "High Five", emoji: "🙌", query: "high five" },
  { label: "Applause", emoji: "👏", query: "applause" },
  { label: "Mind Blown", emoji: "🤯", query: "mind blown" },
  { label: "Study", emoji: "📚", query: "studying" },
  { label: "Thank You", emoji: "🙏", query: "thank you" },
  { label: "Hello", emoji: "👋", query: "hello wave" },
];

async function fetchGifs(
  query: string,
  limit: number = 20,
  pos?: string
): Promise<TenorResponse> {
  const endpoint = query ? "search" : "featured";
  const params = new URLSearchParams({
    key: TENOR_API_KEY,
    client_key: "rusingacademy_community",
    limit: String(limit),
    media_filter: "gif,tinygif,mediumgif",
    contentfilter: "medium",
  });
  if (query) params.set("q", query);
  if (pos) params.set("pos", pos);

  const res = await fetch(`${TENOR_BASE}/${endpoint}?${params}`);
  if (!res.ok) throw new Error("Failed to fetch GIFs");
  return res.json();
}

export default function GifPicker({ isOpen, onClose, onSelect }: GifPickerProps) {
  const [query, setQuery] = useState("");
  const [gifs, setGifs] = useState<TenorGif[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nextPos, setNextPos] = useState<string | undefined>();
  const [activeCategory, setActiveCategory] = useState<string>("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Load GIFs on open or category/query change
  const loadGifs = useCallback(async (searchQuery: string, append = false) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchGifs(searchQuery, 20, append ? nextPos : undefined);
      setGifs((prev) => (append ? [...prev, ...data.results] : data.results));
      setNextPos(data.next);
    } catch {
      setError("Failed to load GIFs. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [nextPos]);

  useEffect(() => {
    if (isOpen) {
      loadGifs(activeCategory);
      setTimeout(() => searchInputRef.current?.focus(), 100);
    } else {
      setGifs([]);
      setQuery("");
      setActiveCategory("");
    }
  }, [isOpen]);

  // Debounced search
  useEffect(() => {
    if (!isOpen) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (query.trim()) {
        setActiveCategory("");
        loadGifs(query.trim());
      }
    }, 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const handleCategoryClick = (cat: typeof CATEGORIES[0]) => {
    setQuery("");
    setActiveCategory(cat.query);
    loadGifs(cat.query);
  };

  const handleLoadMore = () => {
    if (nextPos && !loading) {
      loadGifs(query.trim() || activeCategory, true);
    }
  };

  const getGifUrl = (gif: TenorGif): string => {
    return (
      gif.media_formats.mediumgif?.url ||
      gif.media_formats.gif?.url ||
      gif.media_formats.tinygif?.url ||
      ""
    );
  };

  const getPreviewUrl = (gif: TenorGif): string => {
    return (
      gif.media_formats.tinygif?.url ||
      gif.media_formats.nanogif?.url ||
      gif.media_formats.mediumgif?.url ||
      ""
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="absolute bottom-full left-0 mb-2 w-[360px] max-w-[calc(100vw-2rem)] bg-card rounded-2xl shadow-2xl border border-border z-50 overflow-hidden"
          style={{
            boxShadow: "0 12px 40px rgba(15, 10, 60, 0.12), 0 4px 12px rgba(15, 10, 60, 0.06)",
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <div className="flex items-center gap-2">
              <Smile className="w-4 h-4 text-[#D4AF37]" />
              <span className="text-sm font-bold text-foreground">GIF Picker</span>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-accent transition-colors"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          {/* Search */}
          <div className="px-3 py-2">
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border bg-muted/30">
              <Search className="w-4 h-4 text-muted-foreground shrink-0" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search GIFs..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="bg-transparent text-sm outline-none w-full placeholder:text-muted-foreground/60"
              />
              {query && (
                <button
                  onClick={() => {
                    setQuery("");
                    loadGifs(activeCategory);
                  }}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Categories */}
          {!query && (
            <div className="flex gap-1 px-3 pb-2 overflow-x-auto scrollbar-hide">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.label}
                  onClick={() => handleCategoryClick(cat)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                    activeCategory === cat.query
                      ? "bg-[#1B1464] text-white"
                      : "bg-muted/50 text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <span>{cat.emoji}</span>
                  <span>{cat.label}</span>
                </button>
              ))}
            </div>
          )}

          {/* GIF Grid */}
          <div
            ref={scrollRef}
            className="h-[280px] overflow-y-auto px-3 pb-3"
            onScroll={(e) => {
              const el = e.currentTarget;
              if (el.scrollTop + el.clientHeight >= el.scrollHeight - 50) {
                handleLoadMore();
              }
            }}
          >
            {error ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <p className="text-sm text-red-500">{error}</p>
                <button
                  onClick={() => loadGifs(query.trim() || activeCategory)}
                  className="mt-2 text-xs text-[#1B1464] font-semibold hover:underline"
                >
                  Try again
                </button>
              </div>
            ) : gifs.length === 0 && !loading ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <TrendingUp className="w-8 h-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  {query ? "No GIFs found" : "Loading trending GIFs..."}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {gifs.map((gif) => (
                  <button
                    key={gif.id}
                    onClick={() => {
                      onSelect(getGifUrl(gif));
                      onClose();
                    }}
                    className="relative rounded-xl overflow-hidden bg-muted/30 hover:ring-2 hover:ring-[#D4AF37] transition-all group aspect-video"
                  >
                    <img
                      src={getPreviewUrl(gif)}
                      alt={gif.title || "GIF"}
                      className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                  </button>
                ))}
              </div>
            )}

            {loading && (
              <div className="flex justify-center py-4">
                <Loader2 className="w-5 h-5 animate-spin text-[#1B1464]" />
              </div>
            )}
          </div>

          {/* Tenor attribution */}
          <div className="px-3 py-2 border-t border-border flex items-center justify-center">
            <span className="text-[10px] text-muted-foreground/60 font-medium">
              Powered by Tenor
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
