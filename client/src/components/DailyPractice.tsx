// DESIGN: Premium Daily Practice — glass overlay cards, branded gradients, refined navigation
import { dailyPracticePrompts } from "@/lib/data";
import { useRef } from "react";
import { ChevronLeft, ChevronRight, Pen } from "lucide-react";

const gradients = [
  "linear-gradient(135deg, #1B1464, #2D2580)",
  "linear-gradient(135deg, #D4AF37, #B8962E)",
  "linear-gradient(135deg, #2C2494, #1B1464)",
  "linear-gradient(135deg, #8B7425, #D4AF37)",
  "linear-gradient(135deg, #3D35B5, #2C2494)",
  "linear-gradient(135deg, #1B1464, #3D35B5)",
];

export default function DailyPractice() {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const amount = direction === "left" ? -220 : 220;
      scrollRef.current.scrollBy({ left: amount, behavior: "smooth" });
    }
  };

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3 px-1">
        <Pen className="w-3.5 h-3.5" style={{ color: "#D4AF37" }} />
        <h3 className="text-xs font-bold uppercase tracking-[0.1em]" style={{ color: "rgba(27, 20, 100, 0.4)" }}>
          Daily Practice
        </h3>
      </div>
      <div className="relative group">
        <button
          onClick={() => scroll("left")}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200"
          style={{
            background: "rgba(255, 255, 255, 0.95)",
            backdropFilter: "blur(8px)",
            boxShadow: "0 2px 12px rgba(27, 20, 100, 0.1)",
            border: "1px solid rgba(27, 20, 100, 0.05)",
          }}
        >
          <ChevronLeft className="w-4 h-4 text-foreground" />
        </button>

        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto pb-1"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {dailyPracticePrompts.map((prompt, i) => (
            <button
              key={i}
              className="relative shrink-0 w-[200px] h-[110px] rounded-2xl overflow-hidden p-4 text-left transition-all duration-300 hover:scale-[1.02] hover:shadow-lg active:scale-[0.98]"
              style={{
                background: gradients[i % gradients.length],
                boxShadow: "0 4px 16px rgba(27, 20, 100, 0.12)",
              }}
            >
              {/* Glass overlay pattern */}
              <div
                className="absolute inset-0 opacity-10"
                style={{
                  background: "radial-gradient(circle at 80% 20%, rgba(255,255,255,0.3), transparent 60%)",
                }}
              />
              <p className="relative text-white text-sm font-semibold leading-snug line-clamp-3 tracking-tight">
                {prompt}
              </p>
              <div className="absolute bottom-3 right-3 opacity-20">
                <Pen className="w-4 h-4 text-white" />
              </div>
            </button>
          ))}
        </div>

        <button
          onClick={() => scroll("right")}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200"
          style={{
            background: "rgba(255, 255, 255, 0.95)",
            backdropFilter: "blur(8px)",
            boxShadow: "0 2px 12px rgba(27, 20, 100, 0.1)",
            border: "1px solid rgba(27, 20, 100, 0.05)",
          }}
        >
          <ChevronRight className="w-4 h-4 text-foreground" />
        </button>
      </div>
    </div>
  );
}
