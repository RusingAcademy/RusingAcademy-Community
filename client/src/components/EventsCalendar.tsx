// DESIGN: Premium Events — glass cards, branded gradients, refined RSVP, elevated styling
import { motion } from "framer-motion";
import { useLocale } from "@/i18n/LocaleContext";
import { Calendar, Clock, Users, Video, Mic, MessageCircle, Radio, CheckCircle2, Loader2, Sparkles } from "lucide-react";
import { events as mockEvents, type CommunityEvent } from "@/lib/extendedData";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";

const IMG_MAP: Record<string, string> = {
  EVENT_WEBINAR: "https://private-us-east-1.manuscdn.com/sessionFile/LTn86di5yD7drJbPezQA9r/sandbox/TkPtAuDRR1LzWFTX49vzzi-img-4_1771014662000_na1fn_ZXZlbnQtd2ViaW5hcg.jpg?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvTFRuODZkaTV5RDdkckpiUGV6UUE5ci9zYW5kYm94L1RrUHRBdURSUjFMeldGVFg0OXZ6emktaW1nLTRfMTc3MTAxNDY2MjAwMF9uYTFmbl9aWFpsYm5RdGQyVmlhVzVoY2cuanBnP3gtb3NzLXByb2Nlc3M9aW1hZ2UvcmVzaXplLHdfMTkyMCxoXzE5MjAvZm9ybWF0LHdlYnAvcXVhbGl0eSxxXzgwIiwiQ29uZGl0aW9uIjp7IkRhdGVMZXNzVGhhbiI6eyJBV1M6RXBvY2hUaW1lIjoxNzk4NzYxNjAwfX19XX0_&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=JfyKxBpjgZFU6i5f-J35U67Bj8b7R6kSBrNAforjJXRrAtHoNseavyZUUYW1CKgFhveUjuqrcRyUXllK9djEJa1yeaU4laS3~MVcMD4luQ3WXv4QyjbzwZXoE358AHlqvVkuQls3F1NlrPJLlcJfvTbUUM~dhfXY3JXrcTvOqT4In3urzv24XSRIcMJDVxVZQwngMycvv5unxSMX7tPtCFmINpi578Poy3raxhkRgoHQhKinRY14axapcOgmF5qgwD6uIhlKMEww3sK6R9CyZQo-ZtrKLbzONAcSJwpX~puSuSFjwcp8r7BmS37KxrhtdgZFORUYE~23u0yXGQ6qpg__",
  COURSE_IELTS: "https://private-us-east-1.manuscdn.com/sessionFile/LTn86di5yD7drJbPezQA9r/sandbox/TkPtAuDRR1LzWFTX49vzzi-img-5_1771014678000_na1fn_Y291cnNlLWllbHRzLXByZXA.jpg?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvTFRuODZkaTV5RDdkckpiUGV6UUE5ci9zYW5kYm94L1RrUHRBdURSUjFMeldGVFg0OXZ6emktaW1nLTVfMTc3MTAxNDY3ODAwMF9uYTFmbl9ZMjkxY25ObExXbGxiSFJ6TFhCeVpYQS5qcGc~eC1vc3MtcHJvY2Vzcz1pbWFnZS9yZXNpemUsd18xOTIwLGhfMTkyMC9mb3JtYXQsd2VicC9xdWFsaXR5LHFfODAiLCJDb25kaXRpb24iOnsiRGF0ZUxlc3NUaGFuIjp7IkFXUzpFcG9jaFRpbWUiOjE3OTg3NjE2MDB9fX1dfQ__&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=I~iKfQx0E2yl1HBXa1yF9Xmls~ibCCRRJ2FT9llquB~PXQu9qAxu3-OzposjIdeUeaJJ0YDlQ~WgUAWvPYHisnm0~EcW6cUusKyITpgYb1h-4grBdbvfPUBa8Q9hUCLQR9ox7AywHoQ54yVFAuvUwQtzgnH9lRaaCU0LRvnqwC6qAD1H9YpLR6qFTyHcIpSIO~7fnbr823MDO-Qf7JPphfobkWiSc3-ExdRMQiKs-Gb1hGZbQaBNA6ZaQWuvzB3oKvqF9DrEZy8lre0NUj2mpv5wxgfSKoA7NCwr9C1fqY7Jb627TRVPzQa5zc7frnqwB9A7pDTcumXncYt7~iEfpA__",
  COURSE_BUSINESS: "https://private-us-east-1.manuscdn.com/sessionFile/LTn86di5yD7drJbPezQA9r/sandbox/TkPtAuDRR1LzWFTX49vzzi-img-2_1771014665000_na1fn_Y291cnNlLWJ1c2luZXNzLWVuZ2xpc2g.jpg?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvTFRuODZkaTV5RDdkckpiUGV6UUE5ci9zYW5kYm94L1RrUHRBdURSUjFMeldGVFg0OXZ6emktaW1nLTJfMTc3MTAxNDY2NTAwMF9uYTFmbl9ZMjkxY25ObExXSjFjMmx1WlhOekxXVnVaMnhwYzJnLmpwZz94LW9zcy1wcm9jZXNzPWltYWdlL3Jlc2l6ZSx3XzE5MjAsaF8xOTIwL2Zvcm1hdCx3ZWJwL3F1YWxpdHkscV84MCIsIkNvbmRpdGlvbiI6eyJEYXRlTGVzc1RoYW4iOnsiQVdTOkVwb2NoVGltZSI6MTc5ODc2MTYwMH19fV19&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=G81pTGtld8RcUNoV8m71f2XgyrKodQXauNzCGTyotkuiNoKAFlb9f11bY7SrqepQhFqjlwivV~7YVpzC-B8IlysX3TedGp1VuLIaqJGRVaSsZ6J5lohWhn6RfTftAKz~-kVKrllICK62~rZy6udztYqQjEIh5qCWuzVV3LJxiwMX7OJdq59bdvbYk~QPxvcEiYhEndA107dC-RKzC3GITn0GjPuhb569jNO9nTxGKRfJq1nfm7WnPgc74KEDxcU9ZN7wbGYQY~jgihOwJH504bOwiDGG3T~bsYpND2hxfJfnmQBps4KCyJ831ned2Jr2z-G5sl1A9S5v5ZIszjJaww__",
};

function resolveImage(key: string) { return IMG_MAP[key] || key; }

const typeConfig: Record<string, { icon: typeof Video; label: string; color: string; bg: string }> = {
  webinar: { icon: Video, label: "Webinar", color: "#3b82f6", bg: "rgba(59, 130, 246, 0.06)" },
  workshop: { icon: Mic, label: "Workshop", color: "#8b5cf6", bg: "rgba(139, 92, 246, 0.06)" },
  meetup: { icon: Users, label: "Meetup", color: "#2EC4B6", bg: "rgba(46, 196, 182, 0.06)" },
  livestream: { icon: Radio, label: "Livestream", color: "#ef4444", bg: "rgba(239, 68, 68, 0.06)" },
  "qa-session": { icon: MessageCircle, label: "Q&A Session", color: "#f59e0b", bg: "rgba(245, 158, 11, 0.06)" },
};

function EventCard({ event }: { event: CommunityEvent }) {
  const { isAuthenticated } = useAuth();
  const utils = trpc.useUtils();
  const registerMutation = trpc.events.register.useMutation({
    onSuccess: () => { utils.events.list.invalidate(); toast.success("You're registered!"); },
    onError: () => toast.error("Registration failed"),
  });

  const [registered, setRegistered] = useState(event.isRegistered);
  const config = typeConfig[event.type] || typeConfig.webinar;
  const Icon = config.icon;
  const spotsLeft = event.maxAttendees - event.attendees;
  const fillPercent = (event.attendees / event.maxAttendees) * 100;

  const handleRegister = () => {
    if (!isAuthenticated) { window.location.href = getLoginUrl(); return; }
    setRegistered(true);
    const numId = Number(event.id);
    if (!isNaN(numId) && numId > 0) registerMutation.mutate({ eventId: numId });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3, boxShadow: "0 12px 32px rgba(27, 20, 100, 0.08)" }}
      className="rounded-2xl overflow-hidden transition-all duration-300"
      style={{ background: "white", border: "1px solid rgba(27, 20, 100, 0.05)", boxShadow: "var(--shadow-card)" }}
    >
      <div className="relative h-40 overflow-hidden">
        <img src={resolveImage(event.image)} alt={event.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
        <div
          className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider text-white"
          style={{ backgroundColor: config.color, boxShadow: `0 2px 8px ${config.color}40` }}
        >
          <Icon className="w-3 h-3" /> {config.label}
        </div>
        {event.recurring && (
          <div className="absolute top-3 right-3 px-2.5 py-1 rounded-lg text-[10px] font-bold" style={{ background: "rgba(255,255,255,0.95)", backdropFilter: "blur(8px)", color: "#1B1464" }}>
            {event.recurring}
          </div>
        )}
        <div className="absolute bottom-3 left-3 flex items-center gap-2 text-white text-[11px] font-medium">
          <Calendar className="w-3.5 h-3.5" />
          <span>{event.date}</span>
          <span className="opacity-50">·</span>
          <Clock className="w-3.5 h-3.5" />
          <span>{event.time} {event.timezone}</span>
        </div>
      </div>

      <div className="p-4">
        <h3 className="font-bold text-foreground text-sm mb-2 line-clamp-2 tracking-tight">{event.title}</h3>
        <p className="text-xs text-muted-foreground mb-3 line-clamp-2 leading-relaxed">{event.description}</p>

        <div className="flex items-center gap-2 mb-3">
          <img src={event.host.avatar} alt={event.host.name} className="w-6 h-6 rounded-lg object-cover" style={{ border: "1px solid rgba(27, 20, 100, 0.05)" }} />
          <span className="text-[11px] text-muted-foreground">Hosted by <span className="font-bold text-foreground">{event.host.name}</span></span>
        </div>

        <div className="mb-3">
          <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1.5">
            <span className="flex items-center gap-1 font-medium"><Users className="w-3 h-3" />{event.attendees} attending</span>
            <span className="font-medium" style={{ color: spotsLeft < 10 ? "#ef4444" : undefined }}>{spotsLeft} spots left</span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(27, 20, 100, 0.04)" }}>
            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${fillPercent}%`, background: fillPercent > 80 ? "linear-gradient(90deg, #ef4444, #f87171)" : `linear-gradient(90deg, ${config.color}, ${config.color}80)` }} />
          </div>
        </div>

        {event.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {event.tags.map((tag) => (
              <span key={tag} className="px-2 py-0.5 rounded-md text-[10px] font-medium" style={{ background: "rgba(27, 20, 100, 0.03)", color: "var(--muted-foreground)" }}>{tag}</span>
            ))}
          </div>
        )}

        {registered ? (
          <Button disabled className="w-full rounded-xl text-sm font-bold" style={{ background: "rgba(34, 197, 94, 0.06)", color: "#16a34a", border: "1px solid rgba(34, 197, 94, 0.12)" }}>
            <CheckCircle2 className="w-4 h-4 mr-2" /> Registered
          </Button>
        ) : (
          <Button
            onClick={handleRegister}
            className="w-full rounded-xl text-sm font-bold text-white border-0"
            style={{ background: `linear-gradient(135deg, ${config.color}, ${config.color}cc)`, boxShadow: `0 2px 8px ${config.color}30` }}
          >
            Register — Free
          </Button>
        )}
      </div>
    </motion.div>
  );
}

export default function EventsCalendar() {
  const { t } = useLocale();
  const [filter, setFilter] = useState<string>("all");
  const { data: dbEvents, isLoading } = trpc.events.list.useQuery({ limit: 20, offset: 0 }, { staleTime: 60_000 });

  const displayEvents: CommunityEvent[] = useMemo(() => {
    if (dbEvents && dbEvents.events.length > 0) {
      return dbEvents.events.map((e: any) => ({
        id: String(e.id), title: e.title, description: e.description ?? "",
        type: e.eventType ?? "webinar",
        date: e.startDate ? new Date(e.startDate).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }) : "",
        time: e.startDate ? new Date(e.startDate).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }) : "",
        timezone: "EST",
        host: { name: e.hostName ?? "Host", avatar: e.hostAvatar ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=${e.hostId}` },
        image: e.thumbnailUrl ?? "EVENT_WEBINAR",
        attendees: e.attendeeCount ?? 0, maxAttendees: e.maxAttendees ?? 100,
        isRegistered: false, tags: [], recurring: e.isRecurring ? "Recurring" : undefined,
      }));
    }
    return mockEvents;
  }, [dbEvents]);

  const types = ["all", ...Object.keys(typeConfig)];
  const filtered = filter === "all" ? displayEvents : displayEvents.filter((e) => e.type === filter);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground tracking-tight">Events</h2>
          <p className="text-sm text-muted-foreground">Live sessions, workshops, and community meetups</p>
        </div>
        <Button
          onClick={() => toast("Feature coming soon")}
          className="rounded-xl text-sm font-bold text-white border-0"
          style={{ background: "linear-gradient(135deg, #1B1464, #2D2580)", boxShadow: "0 2px 8px rgba(27, 20, 100, 0.15)" }}
        >
          <Sparkles className="w-3.5 h-3.5 mr-1.5" /> Create Event
        </Button>
      </div>

      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide p-0.5 rounded-xl w-fit" style={{ background: "rgba(27, 20, 100, 0.03)" }}>
        {types.map((type) => {
          const isActive = filter === type;
          const config = typeConfig[type];
          return (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className="shrink-0 px-3.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all duration-200"
              style={{
                background: isActive ? (config?.color || "linear-gradient(135deg, #1B1464, #2D2580)") : "transparent",
                color: isActive ? "white" : undefined,
                boxShadow: isActive ? `0 2px 6px ${config?.color || "#1B1464"}30` : "none",
              }}
            >
              {type === "all" ? "All Events" : config?.label || type}
            </button>
          );
        })}
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="rounded-2xl overflow-hidden animate-pulse" style={{ background: "white", border: "1px solid rgba(27, 20, 100, 0.05)" }}>
              <div className="h-40" style={{ background: "rgba(27, 20, 100, 0.04)" }} />
              <div className="p-4 space-y-2">
                <div className="h-4 rounded w-3/4" style={{ background: "rgba(27, 20, 100, 0.04)" }} />
                <div className="h-3 rounded w-full" style={{ background: "rgba(27, 20, 100, 0.04)" }} />
                <div className="h-8 rounded-xl w-full mt-2" style={{ background: "rgba(27, 20, 100, 0.04)" }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {!isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filtered.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}

      {!isLoading && filtered.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-2xl mx-auto mb-3 flex items-center justify-center" style={{ background: "rgba(27, 20, 100, 0.03)" }}>
            <Calendar className="w-8 h-8 text-muted-foreground opacity-30" />
          </div>
          <p className="text-sm text-muted-foreground font-medium">No events found for this category</p>
        </div>
      )}
    </div>
  );
}
