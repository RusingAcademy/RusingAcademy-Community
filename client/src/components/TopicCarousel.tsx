// DESIGN: Premium topic carousel — glass overlay, branded gradients, refined arrows
import { topics } from "@/lib/data";
import { TOPIC_IMAGES } from "@/lib/images";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRef } from "react";

export default function TopicCarousel() {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const amount = direction === "left" ? -240 : 240;
      scrollRef.current.scrollBy({ left: amount, behavior: "smooth" });
    }
  };

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3 px-1">
        <h3 className="text-xs font-bold uppercase tracking-[0.12em]" style={{ color: "rgba(27, 20, 100, 0.4)" }}>
          Topics for You
        </h3>
        <button className="text-[11px] font-semibold hover-underline transition-colors" style={{ color: "#1B1464" }}>
          See all
        </button>
      </div>
      <div className="relative group">
        {/* Left arrow */}
        <button
          onClick={() => scroll("left")}
          className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-105 active:scale-95"
          style={{
            background: "rgba(255, 255, 255, 0.9)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(255, 255, 255, 0.5)",
            boxShadow: "0 4px 12px rgba(15, 10, 60, 0.08)",
          }}
        >
          <ChevronLeft className="w-4 h-4" style={{ color: "#1B1464" }} />
        </button>

        {/* Scrollable container */}
        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto pb-1"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {topics.map((topic) => (
            <button
              key={topic.id}
              className="relative shrink-0 w-[190px] h-[110px] rounded-2xl overflow-hidden transition-all duration-300 hover:scale-[1.03] hover:shadow-lg active:scale-[0.98]"
              style={{
                boxShadow: "var(--shadow-sm)",
              }}
            >
              <img
                src={TOPIC_IMAGES[topic.image] || ""}
                alt={topic.name}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              {/* Premium gradient overlay */}
              <div
                className="absolute inset-0"
                style={{
                  background: "linear-gradient(180deg, rgba(27, 20, 100, 0.05) 0%, rgba(27, 20, 100, 0.55) 60%, rgba(27, 20, 100, 0.8) 100%)",
                }}
              />
              {/* Glass label at bottom */}
              <div className="absolute bottom-0 left-0 right-0 p-3">
                <span className="text-white text-sm font-bold drop-shadow-lg block leading-tight">
                  {topic.name}
                </span>
              </div>
            </button>
          ))}
        </div>

        {/* Right arrow */}
        <button
          onClick={() => scroll("right")}
          className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-105 active:scale-95"
          style={{
            background: "rgba(255, 255, 255, 0.9)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(255, 255, 255, 0.5)",
            boxShadow: "0 4px 12px rgba(15, 10, 60, 0.08)",
          }}
        >
          <ChevronRight className="w-4 h-4" style={{ color: "#1B1464" }} />
        </button>
      </div>
    </div>
  );
}
