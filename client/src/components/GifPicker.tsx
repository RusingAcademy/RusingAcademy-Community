/**
 * Authenticated Tenor GIF search. Provider credentials and upstream URLs stay
 * on the server; this component only calls the RusingAcademy tRPC proxy.
 */
import { useEffect, useRef, useState } from "react";
import { Loader2, Search, Smile, TrendingUp, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { trpc } from "@/lib/trpc";

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
] as const;

export default function GifPicker({
  isOpen,
  onClose,
  onSelect,
}: GifPickerProps) {
  const [query, setQuery] = useState("");
  const [gifs, setGifs] = useState<TenorGif[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nextPos, setNextPos] = useState<string | undefined>();
  const [activeCategory, setActiveCategory] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined
  );
  const gifSearch = trpc.gif.search.useMutation();

  async function loadGifs(searchQuery: string, append = false, pos?: string) {
    setLoading(true);
    setError(null);
    try {
      const data = await gifSearch.mutateAsync({
        query: searchQuery,
        limit: 20,
        pos,
      });
      setGifs(previous =>
        append ? [...previous, ...data.results] : data.results
      );
      setNextPos(data.next || undefined);
    } catch {
      setError("Failed to load GIFs. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (isOpen) {
      void loadGifs(activeCategory);
      setTimeout(() => searchInputRef.current?.focus(), 100);
    } else {
      setGifs([]);
      setQuery("");
      setActiveCategory("");
      setNextPos(undefined);
      setError(null);
    }
    // Opening is the only automatic trigger; searches and categories are explicit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (query.trim()) {
        setActiveCategory("");
        void loadGifs(query.trim());
      }
    }, 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // Query changes intentionally drive the debounced request.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, isOpen]);

  function handleCategoryClick(category: (typeof CATEGORIES)[number]) {
    setQuery("");
    setActiveCategory(category.query);
    void loadGifs(category.query);
  }

  function getGifUrl(gif: TenorGif) {
    return (
      gif.media_formats.mediumgif?.url ||
      gif.media_formats.gif?.url ||
      gif.media_formats.tinygif?.url ||
      ""
    );
  }

  function getPreviewUrl(gif: TenorGif) {
    return (
      gif.media_formats.tinygif?.url ||
      gif.media_formats.nanogif?.url ||
      gif.media_formats.mediumgif?.url ||
      ""
    );
  }

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
            boxShadow:
              "0 12px 40px rgba(15, 10, 60, 0.12), 0 4px 12px rgba(15, 10, 60, 0.06)",
          }}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <div className="flex items-center gap-2">
              <Smile className="w-4 h-4 text-[#D4AF37]" />
              <span className="text-sm font-bold text-foreground">
                GIF Picker
              </span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-accent transition-colors"
              aria-label="Close GIF picker"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          <div className="px-3 py-2">
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border bg-muted/30">
              <Search className="w-4 h-4 text-muted-foreground shrink-0" />
              <input
                ref={searchInputRef}
                type="search"
                placeholder="Search GIFs..."
                value={query}
                onChange={event => setQuery(event.target.value)}
                className="bg-transparent text-sm outline-none w-full placeholder:text-muted-foreground/60"
                aria-label="Search GIFs"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery("");
                    void loadGifs(activeCategory);
                  }}
                  className="text-muted-foreground hover:text-foreground"
                  aria-label="Clear GIF search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {!query && (
            <div className="flex gap-1 px-3 pb-2 overflow-x-auto scrollbar-hide">
              {CATEGORIES.map(category => (
                <button
                  type="button"
                  key={category.label}
                  onClick={() => handleCategoryClick(category)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                    activeCategory === category.query
                      ? "bg-[#1B1464] text-white"
                      : "bg-muted/50 text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <span aria-hidden="true">{category.emoji}</span>
                  <span>{category.label}</span>
                </button>
              ))}
            </div>
          )}

          <div
            className="h-[280px] overflow-y-auto px-3 pb-3"
            onScroll={event => {
              const element = event.currentTarget;
              if (
                nextPos &&
                !loading &&
                element.scrollTop + element.clientHeight >=
                  element.scrollHeight - 50
              ) {
                void loadGifs(query.trim() || activeCategory, true, nextPos);
              }
            }}
          >
            {error ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <p className="text-sm text-red-500" role="alert">
                  {error}
                </p>
                <button
                  type="button"
                  onClick={() => void loadGifs(query.trim() || activeCategory)}
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
                {gifs.map(gif => {
                  const gifUrl = getGifUrl(gif);
                  return (
                    <button
                      type="button"
                      key={gif.id}
                      onClick={() => {
                        if (gifUrl) onSelect(gifUrl);
                        onClose();
                      }}
                      className="relative rounded-xl overflow-hidden bg-muted/30 hover:ring-2 hover:ring-[#D4AF37] transition-all group aspect-video"
                      aria-label={`Select ${gif.title || "GIF"}`}
                      disabled={!gifUrl}
                    >
                      <img
                        src={getPreviewUrl(gif)}
                        alt={gif.title || "GIF"}
                        className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                    </button>
                  );
                })}
              </div>
            )}

            {loading && (
              <div
                className="flex justify-center py-4"
                aria-label="Loading GIFs"
              >
                <Loader2 className="w-5 h-5 animate-spin text-[#1B1464]" />
              </div>
            )}
          </div>

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
