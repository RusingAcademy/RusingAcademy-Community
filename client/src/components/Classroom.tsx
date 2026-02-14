// DESIGN: Premium Classroom — glass cards, branded gradients, refined course cards, elevated detail view
import { motion, AnimatePresence } from "framer-motion";
import { useLocale } from "@/i18n/LocaleContext";
import { Play, Lock, CheckCircle2, Clock, Users, Star, ChevronDown, ChevronRight, BookOpen, Video, FileText, CircleHelp, ArrowLeft, GraduationCap } from "lucide-react";
import { courses as mockCourses, type Course as MockCourse, type CourseModule } from "@/lib/extendedData";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

function LessonIcon({ type }: { type: string }) {
  const config: Record<string, { icon: typeof Video; color: string; bg: string }> = {
    video: { icon: Video, color: "#3b82f6", bg: "rgba(59, 130, 246, 0.08)" },
    quiz: { icon: CircleHelp, color: "#8b5cf6", bg: "rgba(139, 92, 246, 0.08)" },
    text: { icon: FileText, color: "#22c55e", bg: "rgba(34, 197, 94, 0.08)" },
  };
  const c = config[type] || config.text;
  const Icon = c.icon;
  return (
    <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: c.bg }}>
      <Icon className="w-3.5 h-3.5" style={{ color: c.color }} />
    </div>
  );
}

interface DisplayCourse {
  id: number; title: string; slug: string; shortDescription: string;
  thumbnailUrl: string | null; category: string | null; level: string | null;
  totalModules: number | null; totalLessons: number | null; totalDurationMinutes: number | null;
  totalEnrollments: number | null; averageRating: string | null; totalReviews: number | null;
  instructorName: string | null; hasCertificate: boolean | null; progress: number; isEnrolled: boolean;
}

function formatDuration(minutes: number | null): string {
  if (!minutes) return "—";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}min`;
}

function CourseCard({ course, onSelect }: { course: DisplayCourse; onSelect: (c: DisplayCourse) => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, boxShadow: "0 12px 32px rgba(27, 20, 100, 0.08)" }}
      className="rounded-2xl overflow-hidden cursor-pointer group transition-all duration-300"
      style={{ background: "white", border: "1px solid rgba(27, 20, 100, 0.05)", boxShadow: "var(--shadow-card)" }}
      onClick={() => onSelect(course)}
    >
      <div className="relative h-40 overflow-hidden flex items-center justify-center" style={{ background: "linear-gradient(135deg, #1B1464, #2D2580, rgba(212, 175, 55, 0.3))" }}>
        {course.thumbnailUrl ? (
          <img src={course.thumbnailUrl} alt={course.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
        ) : (
          <BookOpen className="w-12 h-12 text-white/30" />
        )}
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        
        {course.progress > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: "rgba(0,0,0,0.2)" }}>
            <div className="h-full transition-all duration-500" style={{ width: `${course.progress}%`, background: "linear-gradient(90deg, #D4AF37, #E8CB6A)" }} />
          </div>
        )}
        <div className="absolute top-3 right-3 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider" style={{ background: "rgba(255,255,255,0.95)", backdropFilter: "blur(8px)", color: "#1B1464" }}>
          {course.level || "All Levels"}
        </div>
        {course.hasCertificate && (
          <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1" style={{ background: "rgba(212, 175, 55, 0.95)", color: "white" }}>
            <GraduationCap className="w-3 h-3" /> Certificate
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-bold text-foreground text-sm mb-1 line-clamp-2 group-hover:text-[#1B1464] transition-colors tracking-tight">{course.title}</h3>
        <p className="text-xs text-muted-foreground mb-3 line-clamp-1 font-medium">{course.instructorName || "RusingAcademy"}</p>
        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1"><BookOpen className="w-3.5 h-3.5" />{course.totalLessons || 0} lessons</span>
          <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{(course.totalEnrollments || 0).toLocaleString()}</span>
          {course.averageRating && (
            <span className="flex items-center gap-1 font-bold" style={{ color: "#D4AF37" }}><Star className="w-3.5 h-3.5 fill-current" />{course.averageRating}</span>
          )}
        </div>
        {course.progress > 0 && (
          <div className="mt-3 flex items-center gap-2">
            <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(212, 175, 55, 0.1)" }}>
              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${course.progress}%`, background: "linear-gradient(90deg, #D4AF37, #E8CB6A)" }} />
            </div>
            <span className="text-[11px] font-bold" style={{ color: "#D4AF37" }}>{course.progress}%</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function CourseDetail({ course, onBack }: { course: DisplayCourse; onBack: () => void }) {
  const { isAuthenticated } = useAuth();
  const courseDetail = trpc.classroom.getCourse.useQuery({ id: course.id });
  const enrollMutation = trpc.classroom.enroll.useMutation({
    onSuccess: () => { toast.success("Successfully enrolled!"); courseDetail.refetch(); },
    onError: () => toast.error("Failed to enroll. Please try again."),
  });
  const [expandedModule, setExpandedModule] = useState<number | null>(null);
  const modules = courseDetail.data?.modules || [];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
      <button onClick={onBack} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors font-medium">
        <ArrowLeft className="w-4 h-4" /> Back to courses
      </button>

      {/* Course Header */}
      <div className="relative rounded-2xl overflow-hidden" style={{ boxShadow: "0 8px 32px rgba(27, 20, 100, 0.1)" }}>
        <div className="w-full h-52 flex items-center justify-center" style={{ background: "linear-gradient(135deg, #1B1464, #2D2580, rgba(212, 175, 55, 0.3))" }}>
          {course.thumbnailUrl ? (
            <img src={course.thumbnailUrl} alt={course.title} className="w-full h-full object-cover" />
          ) : (
            <BookOpen className="w-16 h-16 text-white/20" />
          )}
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        <div className="absolute bottom-5 left-5 right-5">
          <h2 className="text-white font-bold text-xl mb-2 tracking-tight">{course.title}</h2>
          <div className="flex items-center gap-3 text-white/70 text-xs font-medium">
            <span className="capitalize px-2 py-0.5 rounded-md" style={{ background: "rgba(255,255,255,0.1)" }}>{course.level}</span>
            <span>{formatDuration(course.totalDurationMinutes)}</span>
            <span>{course.totalLessons} lessons</span>
          </div>
        </div>
      </div>

      {/* Instructor + Stats */}
      <div className="flex items-center justify-between rounded-xl p-4" style={{ background: "white", border: "1px solid rgba(27, 20, 100, 0.05)", boxShadow: "var(--shadow-card)" }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm" style={{ background: "linear-gradient(135deg, #1B1464, #2D2580)" }}>
            {(course.instructorName || "RA").split(" ").map(n => n[0]).join("")}
          </div>
          <div>
            <p className="text-sm font-bold text-foreground tracking-tight">{course.instructorName || "RusingAcademy"}</p>
            <p className="text-[11px] text-muted-foreground">Instructor</p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div className="text-center">
            <p className="font-bold text-foreground">{(course.totalEnrollments || 0).toLocaleString()}</p>
            <p className="text-[11px] text-muted-foreground">Enrolled</p>
          </div>
          {course.averageRating && (
            <div className="text-center">
              <p className="font-bold flex items-center gap-1" style={{ color: "#D4AF37" }}><Star className="w-3.5 h-3.5 fill-current" />{course.averageRating}</p>
              <p className="text-[11px] text-muted-foreground">{course.totalReviews} reviews</p>
            </div>
          )}
        </div>
      </div>

      <p className="text-sm text-muted-foreground leading-relaxed">{courseDetail.data?.description || course.shortDescription}</p>

      {/* Progress */}
      {course.progress > 0 && (
        <div className="rounded-xl p-4" style={{ background: "rgba(212, 175, 55, 0.04)", border: "1px solid rgba(212, 175, 55, 0.08)" }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold text-foreground">Your Progress</span>
            <span className="text-sm font-bold" style={{ color: "#D4AF37" }}>{course.progress}%</span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(212, 175, 55, 0.1)" }}>
            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${course.progress}%`, background: "linear-gradient(90deg, #D4AF37, #E8CB6A)" }} />
          </div>
        </div>
      )}

      {!course.isEnrolled && (
        <Button
          onClick={() => {
            if (!isAuthenticated) { toast("Please log in to enroll"); return; }
            enrollMutation.mutate({ courseId: course.id });
          }}
          disabled={enrollMutation.isPending}
          className="w-full rounded-xl font-bold text-white border-0 h-12"
          style={{ background: "linear-gradient(135deg, #1B1464, #2D2580)", boxShadow: "0 4px 12px rgba(27, 20, 100, 0.2)" }}
        >
          {enrollMutation.isPending ? "Enrolling..." : "Enroll Now — Free"}
        </Button>
      )}

      {/* Modules */}
      {modules.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-bold text-foreground tracking-tight">Course Content</h3>
          {modules.map((mod, idx) => {
            const isExpanded = expandedModule === mod.id;
            return (
              <div key={mod.id} className="rounded-xl overflow-hidden transition-all duration-200" style={{ background: "white", border: "1px solid rgba(27, 20, 100, 0.05)", boxShadow: isExpanded ? "0 4px 16px rgba(27, 20, 100, 0.06)" : "none" }}>
                <button
                  onClick={() => setExpandedModule(isExpanded ? null : mod.id)}
                  className="w-full flex items-center justify-between px-4 py-3.5 transition-colors"
                  style={{ background: isExpanded ? "rgba(27, 20, 100, 0.02)" : "transparent" }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-bold" style={{ background: "rgba(27, 20, 100, 0.04)", color: "#1B1464" }}>
                      {idx + 1}
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-bold text-foreground tracking-tight">{mod.title}</p>
                      <p className="text-[11px] text-muted-foreground">{mod.totalLessons} lessons · {formatDuration(mod.totalDurationMinutes)}</p>
                    </div>
                  </div>
                  <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${isExpanded ? "rotate-90" : ""}`} />
                </button>
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
                      <div className="px-4 pb-3 space-y-1">
                        {(mod as any).lessons?.map((lesson: any) => (
                          <button
                            key={lesson.id}
                            onClick={() => toast("Lesson content coming soon")}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-200 cursor-pointer"
                            style={{ background: "transparent" }}
                            onMouseEnter={(e) => { (e.target as HTMLElement).style.background = "rgba(27, 20, 100, 0.02)"; }}
                            onMouseLeave={(e) => { (e.target as HTMLElement).style.background = "transparent"; }}
                          >
                            <LessonIcon type={lesson.contentType || "video"} />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-foreground truncate">{lesson.title}</p>
                            </div>
                            <span className="text-[11px] text-muted-foreground flex items-center gap-1 shrink-0">
                              <Clock className="w-3 h-3" />{lesson.estimatedMinutes || 60}min
                            </span>
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}

      {courseDetail.isLoading && modules.length === 0 && (
        <div className="space-y-3">
          <h3 className="font-bold text-foreground tracking-tight">Course Content</h3>
          {[1, 2, 3].map(i => (
            <div key={i} className="rounded-xl p-4 animate-pulse" style={{ background: "white", border: "1px solid rgba(27, 20, 100, 0.05)" }}>
              <div className="h-4 rounded w-3/4 mb-2" style={{ background: "rgba(27, 20, 100, 0.04)" }} />
              <div className="h-3 rounded w-1/2" style={{ background: "rgba(27, 20, 100, 0.04)" }} />
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

export default function Classroom() {
  const { t } = useLocale();
  const { isAuthenticated } = useAuth();
  const coursesQuery = trpc.classroom.listCourses.useQuery({ limit: 20, offset: 0 });
  const enrollmentsQuery = trpc.classroom.myEnrollments.useQuery(undefined, { enabled: isAuthenticated });
  const [selectedCourse, setSelectedCourse] = useState<DisplayCourse | null>(null);

  const displayCourses: DisplayCourse[] = useMemo(() => {
    if (!coursesQuery.data?.courses || coursesQuery.data.courses.length === 0) {
      return mockCourses.map((c, idx) => ({
        id: idx + 1, title: c.title, slug: c.id, shortDescription: c.description,
        thumbnailUrl: null, category: c.level, level: c.level,
        totalModules: c.modules.length, totalLessons: c.lessonsCount,
        totalDurationMinutes: null, totalEnrollments: c.enrolledCount,
        averageRating: String(c.rating), totalReviews: null,
        instructorName: c.instructor.name, hasCertificate: false,
        progress: c.progress, isEnrolled: c.progress > 0,
      }));
    }
    const enrollments = enrollmentsQuery.data || [];
    return coursesQuery.data.courses.map((c) => {
      const enrollment = enrollments.find((e) => e.courseId === c.id);
      return {
        id: c.id, title: c.title, slug: c.slug, shortDescription: c.shortDescription || "",
        thumbnailUrl: c.thumbnailUrl, category: c.category, level: c.level,
        totalModules: c.totalModules, totalLessons: c.totalLessons,
        totalDurationMinutes: c.totalDurationMinutes, totalEnrollments: c.totalEnrollments,
        averageRating: c.averageRating, totalReviews: c.totalReviews,
        instructorName: c.instructorName, hasCertificate: c.hasCertificate,
        progress: enrollment?.progressPercent ?? 0, isEnrolled: !!enrollment,
      };
    });
  }, [coursesQuery.data, enrollmentsQuery.data]);

  const enrolledCourses = displayCourses.filter(c => c.isEnrolled);

  if (selectedCourse) return <CourseDetail course={selectedCourse} onBack={() => setSelectedCourse(null)} />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground tracking-tight">Classroom</h2>
          <p className="text-sm text-muted-foreground">Structured courses to accelerate your learning</p>
        </div>
      </div>

      {enrolledCourses.length > 0 && (
        <div>
          <h3 className="font-bold text-foreground mb-3 tracking-tight">Continue Learning</h3>
          <div className="grid grid-cols-1 gap-4">
            {enrolledCourses.map((course) => (
              <CourseCard key={course.id} course={course} onSelect={setSelectedCourse} />
            ))}
          </div>
        </div>
      )}

      <div>
        <h3 className="font-bold text-foreground mb-3 tracking-tight">All Courses</h3>
        {coursesQuery.isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="rounded-2xl overflow-hidden animate-pulse" style={{ background: "white", border: "1px solid rgba(27, 20, 100, 0.05)" }}>
                <div className="h-40" style={{ background: "rgba(27, 20, 100, 0.04)" }} />
                <div className="p-4 space-y-2">
                  <div className="h-4 rounded w-3/4" style={{ background: "rgba(27, 20, 100, 0.04)" }} />
                  <div className="h-3 rounded w-1/2" style={{ background: "rgba(27, 20, 100, 0.04)" }} />
                  <div className="h-3 rounded w-full" style={{ background: "rgba(27, 20, 100, 0.04)" }} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {displayCourses.map((course) => (
              <CourseCard key={course.id} course={course} onSelect={setSelectedCourse} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
