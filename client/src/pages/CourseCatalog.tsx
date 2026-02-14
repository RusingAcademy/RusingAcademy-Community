import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocale } from "@/i18n/LocaleContext";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Link } from "wouter";
import {
  BookOpen,
  Clock,
  Users,
  Star,
  Award,
  Play,
  ChevronRight,
  GraduationCap,
  Loader2,
  Filter,
} from "lucide-react";

const CATEGORY_LABELS: Record<string, string> = {
  sle_oral: "SLE Oral",
  sle_written: "SLE Written",
  sle_reading: "SLE Reading",
  sle_complete: "SLE Complete",
  business_french: "Business French",
  business_english: "Business English",
  exam_prep: "Exam Prep",
  conversation: "Conversation",
  grammar: "Grammar",
  vocabulary: "Vocabulary",
};

const LEVEL_LABELS: Record<string, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
  all_levels: "All Levels",
};

export default function CourseCatalog() {
  const { t, locale } = useLocale();
  const { user, isAuthenticated } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
  const [selectedLevel, setSelectedLevel] = useState<string | undefined>();

  const { data: courses, isLoading } = trpc.coursePlayer.catalog.useQuery({
    category: selectedCategory,
    level: selectedLevel,
  });

  const { data: enrollments } = trpc.coursePlayer.myEnrollments.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const enrolledCourseIds = new Set(enrollments?.map((e) => e.enrollment.courseId) ?? []);

  const enrollMutation = trpc.coursePlayer.enroll.useMutation({
    onSuccess: (data) => {
      if (data.alreadyEnrolled) {
        toast.info("You're already enrolled in this course.");
      } else {
        toast.success(t.coursePlayer.enrollSuccess);
      }
    },
    onError: () => toast.error("Failed to enroll. Please try again."),
  });

  const categories = Array.from(new Set(courses?.map((c) => c.category).filter(Boolean) ?? []));

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div
        className="relative overflow-hidden py-16 px-4"
        style={{
          background: "linear-gradient(135deg, #1B1464 0%, #2EC4B6 50%, #FF4B2B 100%)",
        }}
      >
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <GraduationCap className="w-12 h-12 text-white/80 mx-auto mb-4" />
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4 tracking-tight">
            {t.coursePlayer.catalog}
          </h1>
          <p className="text-lg text-white/80 max-w-2xl mx-auto">
            {t.coursePlayer.catalogSubtitle}
          </p>
        </div>
        {/* Decorative orbs */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-white/5 rounded-full -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/5 rounded-full translate-x-1/3 translate-y-1/3" />
      </div>

      {/* Filters */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex items-center gap-3 flex-wrap mb-8">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <button
            onClick={() => setSelectedCategory(undefined)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              !selectedCategory
                ? "bg-[#1B1464] text-white"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat === selectedCategory ? undefined : cat!)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === cat
                  ? "bg-[#1B1464] text-white"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {CATEGORY_LABELS[cat!] ?? cat}
            </button>
          ))}
        </div>

        {/* Course Grid */}
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-[#1B1464]" />
          </div>
        ) : !courses?.length ? (
          <div className="text-center py-16">
            <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground text-lg">{t.coursePlayer.noCourses}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => {
              const isEnrolled = enrolledCourseIds.has(course.id);
              const enrollment = enrollments?.find((e) => e.enrollment.courseId === course.id);
              const title = locale === "fr" && course.titleFr ? course.titleFr : course.title;
              const desc =
                locale === "fr" && course.descriptionFr
                  ? course.descriptionFr
                  : course.description;

              return (
                <div
                  key={course.id}
                  className="group bg-card rounded-2xl border border-border overflow-hidden hover:shadow-lg transition-all duration-300"
                >
                  {/* Thumbnail */}
                  <div className="relative h-48 bg-gradient-to-br from-[#1B1464]/20 to-[#2EC4B6]/20 overflow-hidden">
                    {course.thumbnailUrl ? (
                      <img
                        src={course.thumbnailUrl}
                        alt={title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <BookOpen className="w-16 h-16 text-[#1B1464]/30" />
                      </div>
                    )}
                    {/* Level badge */}
                    {course.level && (
                      <span className="absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-bold bg-white/90 text-[#1B1464] backdrop-blur-sm">
                        {LEVEL_LABELS[course.level] ?? course.level}
                      </span>
                    )}
                    {/* Price badge */}
                    <span
                      className="absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-bold backdrop-blur-sm"
                      style={{
                        backgroundColor:
                          course.price === 0 ? "rgba(46, 196, 182, 0.9)" : "rgba(255, 75, 43, 0.9)",
                        color: "white",
                      }}
                    >
                      {course.price === 0
                        ? t.coursePlayer.free
                        : `$${(course.price / 100).toFixed(2)}`}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                      {course.category && (
                        <span className="px-2 py-0.5 rounded bg-muted">
                          {CATEGORY_LABELS[course.category] ?? course.category}
                        </span>
                      )}
                    </div>

                    <h3 className="font-bold text-lg text-foreground mb-2 line-clamp-2 group-hover:text-[#1B1464] transition-colors">
                      {title}
                    </h3>

                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                      {desc || "No description available."}
                    </p>

                    {/* Stats */}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
                      <span className="flex items-center gap-1">
                        <BookOpen className="w-3.5 h-3.5" />
                        {course.totalLessons ?? 0} {t.coursePlayer.lesson}s
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {course.totalDurationMinutes ?? 0} {t.coursePlayer.minutes}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        {course.totalEnrollments ?? 0}
                      </span>
                    </div>

                    {/* Certificate badge */}
                    {course.hasCertificate && (
                      <div className="flex items-center gap-1.5 text-xs text-[#2EC4B6] font-medium mb-4">
                        <Award className="w-3.5 h-3.5" />
                        {t.coursePlayer.certificate}
                      </div>
                    )}

                    {/* Progress bar for enrolled courses */}
                    {isEnrolled && enrollment && (
                      <div className="mb-4">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-muted-foreground">{t.coursePlayer.progress}</span>
                          <span className="font-medium text-[#1B1464]">
                            {enrollment.enrollment.progressPercent ?? 0}%
                          </span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${enrollment.enrollment.progressPercent ?? 0}%`,
                              backgroundColor:
                                (enrollment.enrollment.progressPercent ?? 0) >= 100
                                  ? "#2EC4B6"
                                  : "#1B1464",
                            }}
                          />
                        </div>
                      </div>
                    )}

                    {/* CTA */}
                    {isEnrolled ? (
                      <Link href={`/courses/${course.id}`}>
                        <Button
                          className="w-full rounded-xl font-semibold"
                          style={{ backgroundColor: "#1B1464" }}
                        >
                          <Play className="w-4 h-4 mr-2" />
                          {t.coursePlayer.continueLearning}
                          <ChevronRight className="w-4 h-4 ml-auto" />
                        </Button>
                      </Link>
                    ) : (
                      <Button
                        className="w-full rounded-xl font-semibold"
                        style={{ backgroundColor: "#FF4B2B" }}
                        onClick={() => {
                          if (!isAuthenticated) {
                            toast.error("Please sign in to enroll.");
                            return;
                          }
                          enrollMutation.mutate({ courseId: course.id });
                        }}
                        disabled={enrollMutation.isPending}
                      >
                        {enrollMutation.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : (
                          <GraduationCap className="w-4 h-4 mr-2" />
                        )}
                        {t.coursePlayer.enrollNow}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
