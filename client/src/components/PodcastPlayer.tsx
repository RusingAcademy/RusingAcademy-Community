import { useState, useRef, useEffect, createContext, useContext, useCallback } from "react";
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  VolumeX,
  X,
  Maximize2,
  Minimize2,
} from "lucide-react";

export interface PodcastTrack {
  id: string;
  title: string;
  author: string;
  audioUrl: string;
  thumbnailUrl?: string;
  duration?: number;
}

// Global podcast player state — allows any component to trigger playback
interface PodcastPlayerContextType {
  playTrack: (track: PodcastTrack, playlist?: PodcastTrack[]) => void;
  currentTrack: PodcastTrack | null;
  isPlaying: boolean;
}

const PodcastPlayerContext = createContext<PodcastPlayerContextType>({
  playTrack: () => {},
  currentTrack: null,
  isPlaying: false,
});

export function usePodcastPlayer() {
  return useContext(PodcastPlayerContext);
}

function formatTime(seconds: number): string {
  if (isNaN(seconds)) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function PodcastPlayerProvider({ children }: { children: React.ReactNode }) {
  const [track, setTrack] = useState<PodcastTrack | null>(null);
  const [playlist, setPlaylist] = useState<PodcastTrack[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);

  const playTrack = useCallback((t: PodcastTrack, pl?: PodcastTrack[]) => {
    setTrack(t);
    if (pl) setPlaylist(pl);
    setIsPlaying(true);
  }, []);

  return (
    <PodcastPlayerContext.Provider value={{ playTrack, currentTrack: track, isPlaying }}>
      {children}
      <PodcastPlayerUI
        track={track}
        playlist={playlist}
        isPlaying={isPlaying}
        setIsPlaying={setIsPlaying}
        onClose={() => { setTrack(null); setIsPlaying(false); }}
        onTrackChange={(t) => { setTrack(t); setIsPlaying(true); }}
      />
    </PodcastPlayerContext.Provider>
  );
}

interface PodcastPlayerUIProps {
  track: PodcastTrack | null;
  playlist: PodcastTrack[];
  isPlaying: boolean;
  setIsPlaying: (v: boolean) => void;
  onClose: () => void;
  onTrackChange: (t: PodcastTrack) => void;
}

function PodcastPlayerUI({
  track,
  playlist,
  isPlaying,
  setIsPlaying,
  onClose,
  onTrackChange,
}: PodcastPlayerUIProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const progressRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (track && audioRef.current) {
      audioRef.current.src = track.audioUrl;
      audioRef.current.play().catch(() => {});
    }
  }, [track?.id]);

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(() => {});
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressRef.current || !audioRef.current) return;
    const rect = progressRef.current.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    audioRef.current.currentTime = percent * duration;
  };

  const skipForward = () => {
    if (!playlist.length || !track) return;
    const idx = playlist.findIndex((t) => t.id === track.id);
    if (idx < playlist.length - 1) {
      onTrackChange(playlist[idx + 1]);
    }
  };

  const skipBack = () => {
    if (!playlist.length || !track) return;
    const idx = playlist.findIndex((t) => t.id === track.id);
    if (idx > 0) {
      onTrackChange(playlist[idx - 1]);
    }
  };

  if (!track) return null;

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <>
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={skipForward}
      />

      {/* Mini Player — fixed bottom */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 bg-[#1B1464] text-white shadow-2xl transition-all ${
          isExpanded ? "h-[280px]" : "h-[72px]"
        }`}
      >
        {/* Progress bar */}
        <div
          ref={progressRef}
          onClick={handleProgressClick}
          className="absolute top-0 left-0 right-0 h-1 bg-white/20 cursor-pointer group"
        >
          <div
            className="h-full bg-[#D4AF37] transition-all relative"
            style={{ width: `${progress}%` }}
          >
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-[#D4AF37] opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>

        {/* Main controls */}
        <div className="flex items-center gap-4 px-4 h-[72px]">
          {/* Thumbnail */}
          {track.thumbnailUrl ? (
            <img
              src={track.thumbnailUrl}
              alt={track.title}
              className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
            />
          ) : (
            <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
              <Volume2 className="w-5 h-5 text-white/60" />
            </div>
          )}

          {/* Track info */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{track.title}</p>
            <p className="text-xs text-white/60 truncate">{track.author}</p>
          </div>

          {/* Time */}
          <span className="text-xs text-white/60 hidden sm:block">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>

          {/* Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={skipBack}
              className="p-1.5 hover:bg-white/10 rounded-full transition-colors"
              aria-label="Previous track"
            >
              <SkipBack className="w-4 h-4" />
            </button>
            <button
              onClick={togglePlay}
              className="p-2.5 bg-[#D4AF37] hover:bg-[#c9a432] rounded-full transition-colors"
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? (
                <Pause className="w-5 h-5" />
              ) : (
                <Play className="w-5 h-5 ml-0.5" />
              )}
            </button>
            <button
              onClick={skipForward}
              className="p-1.5 hover:bg-white/10 rounded-full transition-colors"
              aria-label="Next track"
            >
              <SkipForward className="w-4 h-4" />
            </button>
          </div>

          {/* Volume */}
          <div className="hidden md:flex items-center gap-2">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="p-1.5 hover:bg-white/10 rounded-full transition-colors"
              aria-label={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? (
                <VolumeX className="w-4 h-4" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={isMuted ? 0 : volume}
              onChange={(e) => {
                setVolume(parseFloat(e.target.value));
                setIsMuted(false);
              }}
              className="w-20 accent-[#D4AF37]"
            />
          </div>

          {/* Expand/Close */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 hover:bg-white/10 rounded-full transition-colors hidden md:block"
            aria-label={isExpanded ? "Minimize" : "Expand"}
          >
            {isExpanded ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </button>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white/10 rounded-full transition-colors"
            aria-label="Close player"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Expanded: Playlist */}
        {isExpanded && playlist.length > 0 && (
          <div className="px-4 pb-4 overflow-y-auto max-h-[200px]">
            <p className="text-xs font-semibold text-white/60 uppercase mb-2">
              Up Next
            </p>
            <div className="space-y-1">
              {playlist
                .filter((t) => t.id !== track.id)
                .map((t) => (
                  <button
                    key={t.id}
                    onClick={() => onTrackChange(t)}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/10 transition-colors text-left"
                  >
                    {t.thumbnailUrl ? (
                      <img
                        src={t.thumbnailUrl}
                        alt={t.title}
                        className="w-8 h-8 rounded object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded bg-white/10 flex items-center justify-center">
                        <Volume2 className="w-3 h-3 text-white/40" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{t.title}</p>
                      <p className="text-xs text-white/50 truncate">{t.author}</p>
                    </div>
                  </button>
                ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// Default export for backward compatibility — renders nothing, use PodcastPlayerProvider instead
export default function PodcastPlayer() {
  return null;
}
