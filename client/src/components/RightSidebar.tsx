// DESIGN: Premium right sidebar — glassmorphism widgets, gradient CTAs, refined coach cards
import { teachers, editorPicks } from "@/lib/data";
import { useLocale } from "@/i18n/LocaleContext";
import { CREATE_CTA_IMAGE } from "@/lib/images";
import { Star, Bookmark, ChevronRight, Search, GraduationCap, Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { motion } from "framer-motion";

export default function RightSidebar() {
  const { t } = useLocale();
  return (
    <aside className="hidden xl:flex flex-col w-[300px] shrink-0 gap-5 py-5 pr-5">
      {/* Create CTA Card — gradient overlay with glass effect */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-lg"
        style={{
          background: "white",
          border: "1px solid rgba(27, 20, 100, 0.05)",
          boxShadow: "var(--shadow-card)",
        }}
      >
        <div className="relative h-28 overflow-hidden">
          <img
            src={CREATE_CTA_IMAGE}
            alt="Create a post"
            className="w-full h-full object-cover"
          />
          <div
            className="absolute inset-0"
            style={{
              background: "linear-gradient(180deg, rgba(27, 20, 100, 0.1) 0%, rgba(255, 255, 255, 0.6) 60%, white 100%)",
            }}
          />
        </div>
        <div className="px-4 pb-4 -mt-6 relative z-10">
          <p className="text-sm font-bold text-foreground mb-1">
            Share your learning journey
          </p>
          <p className="text-[11px] text-muted-foreground mb-3">
            Write, record, or ask the community
          </p>
          <Button
            onClick={() => toast("Feature coming soon")}
            className="w-full rounded-xl font-semibold text-sm text-white border-0 transition-all duration-300 hover:shadow-md active:scale-[0.97]"
            style={{
              background: "linear-gradient(135deg, #1B1464, #2D2580)",
              boxShadow: "0 2px 8px rgba(27, 20, 100, 0.15)",
            }}
          >
            <Sparkles className="w-3.5 h-3.5 mr-1.5" />
            Create Post
          </Button>
        </div>
      </motion.div>

      {/* Coaches Section — glass cards with avatar rings */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="rounded-2xl p-4"
        style={{
          background: "white",
          border: "1px solid rgba(27, 20, 100, 0.05)",
          boxShadow: "var(--shadow-card)",
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-bold uppercase tracking-[0.1em]" style={{ color: "rgba(27, 20, 100, 0.4)" }}>
            Recommended Coaches
          </h3>
          <button
            onClick={() => toast("Feature coming soon")}
            className="text-[10px] font-semibold transition-colors hover-underline"
            style={{ color: "#1B1464" }}
          >
            See all
          </button>
        </div>
        <div className="space-y-3">
          {teachers.slice(0, 4).map((teacher, i) => (
            <motion.div
              key={teacher.id}
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.3 + i * 0.05 }}
              className="flex items-center gap-3 group rounded-xl p-2 -mx-2 transition-all duration-200 cursor-pointer"
              style={{ background: "transparent" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(248, 247, 244, 0.8)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
              }}
            >
              <div className="avatar-ring">
                <img
                  src={teacher.avatar}
                  alt={teacher.name}
                  className="w-11 h-11 rounded-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-foreground truncate tracking-tight">
                  {teacher.name}
                </p>
                <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <Star className="w-3 h-3" style={{ fill: "#D4AF37", color: "#D4AF37" }} />
                  <span className="font-semibold" style={{ color: "#D4AF37" }}>{teacher.rating.toFixed(1)}</span>
                  <span className="mx-0.5 opacity-40">&middot;</span>
                  <span>{teacher.lessons.toLocaleString()} lessons</span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  From <span className="font-bold text-foreground">${teacher.priceFrom}</span>/session
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toast("Feature coming soon");
                }}
                className="p-1.5 rounded-lg hover:bg-white transition-all duration-200 opacity-0 group-hover:opacity-100"
              >
                <Bookmark className="w-4 h-4 text-muted-foreground" strokeWidth={1.8} />
              </button>
            </motion.div>
          ))}
        </div>
        <button
          onClick={() => toast("Feature coming soon")}
          className="flex items-center gap-2 mt-3 text-sm font-semibold w-full justify-center py-2 rounded-xl transition-all duration-200"
          style={{
            color: "#1B1464",
            background: "rgba(27, 20, 100, 0.03)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(27, 20, 100, 0.06)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(27, 20, 100, 0.03)";
          }}
        >
          <Search className="w-3.5 h-3.5" />
          Browse all coaches
        </button>
      </motion.div>

      {/* Editor's Pick — accent border with gradient */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="rounded-2xl p-4 relative overflow-hidden"
        style={{
          background: "white",
          border: "1px solid rgba(27, 20, 100, 0.05)",
          boxShadow: "var(--shadow-card)",
        }}
      >
        {/* Subtle accent line at top */}
        <div
          className="absolute top-0 left-4 right-4 h-[2px] rounded-full"
          style={{ background: "linear-gradient(90deg, #D4AF37, #E8CB6A, transparent)" }}
        />

        <div className="flex items-center justify-between mb-4 mt-1">
          <h3 className="text-xs font-bold uppercase tracking-[0.1em]" style={{ color: "rgba(212, 175, 55, 0.7)" }}>
            Editor's Pick
          </h3>
        </div>
        <div className="space-y-3">
          {editorPicks.map((pick, i) => (
            <motion.div
              key={pick.id}
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.4 + i * 0.05 }}
              className="flex items-start gap-3 group cursor-pointer rounded-lg p-1.5 -mx-1.5 transition-all duration-200"
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(248, 247, 244, 0.8)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
              }}
            >
              <div className="w-16 h-12 rounded-xl overflow-hidden shrink-0">
                <img
                  src={pick.image}
                  alt={pick.title}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-foreground leading-tight line-clamp-2 group-hover:text-[#1B1464] transition-colors">
                  {pick.title}
                </p>
                <p className="text-[11px] text-muted-foreground mt-1 font-medium">
                  {pick.likes} likes &middot; {pick.comments} comments
                </p>
              </div>
            </motion.div>
          ))}
        </div>
        <button
          onClick={() => toast("Feature coming soon")}
          className="flex items-center gap-1.5 text-sm font-semibold mt-3 w-full justify-center py-2 rounded-xl transition-all duration-200"
          style={{
            color: "#D4AF37",
            background: "rgba(212, 175, 55, 0.04)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(212, 175, 55, 0.08)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(212, 175, 55, 0.04)";
          }}
        >
          More articles
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </motion.div>

      {/* Visit RusingAcademy — premium gradient card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.4 }}
        className="rounded-2xl p-5 text-center relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, rgba(27, 20, 100, 0.03), rgba(212, 175, 55, 0.04))",
          border: "1px solid rgba(27, 20, 100, 0.05)",
          boxShadow: "var(--shadow-card)",
        }}
      >
        {/* Decorative gradient orb */}
        <div
          className="absolute -top-8 -right-8 w-24 h-24 rounded-full opacity-20 blur-2xl"
          style={{ background: "linear-gradient(135deg, #D4AF37, #1B1464)" }}
        />

        <div
          className="w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center"
          style={{
            background: "linear-gradient(135deg, rgba(27, 20, 100, 0.06), rgba(212, 175, 55, 0.06))",
            border: "1px solid rgba(27, 20, 100, 0.06)",
          }}
        >
          <GraduationCap className="w-6 h-6" style={{ color: "#1B1464" }} />
        </div>
        <h3 className="text-sm font-bold text-foreground mb-1">
          Explore RusingAcademy
        </h3>
        <p className="text-[11px] text-muted-foreground mb-4 leading-relaxed">
          Professional courses for bilingual excellence in Canada's public service.
        </p>
        <a
          href="https://www.rusingacademy.com"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs font-bold px-5 py-2.5 rounded-xl text-white transition-all duration-300 hover:shadow-md active:scale-[0.97]"
          style={{
            background: "linear-gradient(135deg, #D4AF37, #E8CB6A)",
            boxShadow: "0 2px 8px rgba(212, 175, 55, 0.2)",
          }}
        >
          Visit Website
          <ArrowRight className="w-3 h-3" />
        </a>
      </motion.div>
    </aside>
  );
}
