import { useState, useMemo, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocale } from "@/i18n/LocaleContext";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useRoute, Link } from "wouter";
import { Streamdown } from "streamdown";
import {
  BookOpen,
  Clock,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Circle,
  Play,
  FileText,
  Headphones,
  HelpCircle,
  Award,
  Loader2,
  GraduationCap,
  BarChart3,
  Lock,
} from "lucide-react";

const CONTENT_ICONS: Record<string, React.ReactNode> = {
  video: <Play className="w-4 h-4" />,
  text: <FileText className="w-4 h-4" />,
  audio: <Headphones className="w-4 h-4" />,
  quiz: <HelpCircle className="w-4 h-4" />,
  pdf: <FileText className="w-4 h-4" />,
  assignment: <FileText className="w-4 h-4" />,
};

export default function CoursePlayer() {
  const { t, locale } = useLocale();
  const { user, isAuthenticated } = useAuth();
  const [, params] = useRoute("/courses/:id");
  const courseId = params?.id ? parseInt(params.id, 10) : 0;

  const [activeLessonId, setActiveLessonId] = useState<number | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const { data: courseData, isLoading: courseLoading } = trpc.coursePlayer.courseDetail.useQuery(
    { courseId },
    { enabled: courseId > 0 }
  );

  const { data: progressData, refetch: refetchProgress } =
    trpc.coursePlayer.courseProgress.useQuery({ courseId }, { enabled: isAuthenticated && courseId > 0 });

  const { data: nextLesson } = trpc.coursePlayer.nextLesson.useQuery(
    { courseId },
    { enabled: isAuthenticated && courseId > 0 }
  );

  const { data: lessonData, isLoading: lessonLoading } = trpc.coursePlayer.lessonContent.useQuery(
    { lessonId: activeLessonId!, courseId },
    { enabled: isAuthenticated && !!activeLessonId && courseId > 0 }
  );

  const enrollMutation = trpc.coursePlayer.enroll.useMutation({
    onSuccess: () => {
      toast.success(t.coursePlayer.enrollSuccess);
      refetchProgress();
    },
  });

  const completeMutation = trpc.coursePlayer.completeLesson.useMutation({
    onSuccess: (data) => {
      refetchProgress();
      if (data.courseCompleted) {
        toast.success(t.coursePlayer.completionCongrats);
        toast.success(t.coursePlayer.certificateIssued);
      } else {
        toast.success(t.coursePlayer.complete);
      }
    },
  });

  // Auto-select next lesson
  useEffect(() => {
    if (!activeLessonId && nextLesson) {
      setActiveLessonId(nextLesson.id);
    } else if (!activeLessonId && courseData?.modules?.[0]?.lessons?.[0]) {
      setActiveLessonId(courseData.modules[0].lessons[0].id);
    }
  }, [nextLesson, courseData, activeLessonId]);

  const completedLessonIds = useMemo(
    () =>
      new Set(
        progressData?.lessonProgress
          ?.filter((p) => p.status === "completed")
          .map((p) => p.lessonId) ?? []
      ),
    [progressData]
  );

  // Flatten lessons for prev/next navigation
  const allLessons = useMemo(
    () => courseData?.modules?.flatMap((m) => m.lessons) ?? [],
    [courseData]
  );

  const currentIndex = allLessons.findIndex((l) => l.id === activeLessonId);
  const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
  const nextLessonNav = currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;

  if (courseLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-[#1B1464]" />
      </div>
    );
  }

  if (!courseData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <BookOpen className="w-16 h-16 text-muted-foreground" />
        <p className="text-muted-foreground">Course not found</p>
        <Link href="/courses">
          <Button variant="outline">Back to Catalog</Button>
        </Link>
      </div>
    );
  }

  const { course, modules } = courseData;
  const courseTitle = locale === "fr" && course.titleFr ? course.titleFr : course.title;
  const isEnrolled = !!progressData;
  const activeLesson = lessonData?.lesson;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Bar */}
      <header className="sticky top-0 z-30 bg-card border-b border-border px-4 py-3 flex items-center gap-4">
        <Link href="/courses">
          <button className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ChevronLeft className="w-4 h-4" />
            {t.coursePlayer.catalog}
          </button>
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-sm font-bold text-foreground truncate">{courseTitle}</h1>
        </div>
        {isEnrolled && (
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground">
              <BarChart3 className="w-3.5 h-3.5" />
              {progressData?.completedLessons ?? 0}/{progressData?.totalLessons ?? 0}{" "}
              {t.coursePlayer.lessonsCompleted}
            </div>
            <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${progressData?.enrollment.progressPercent ?? 0}%`,
                  backgroundColor:
                    (progressData?.enrollment.progressPercent ?? 0) >= 100 ? "#2EC4B6" : "#1B1464",
                }}
              />
            </div>
          </div>
        )}
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - Syllabus */}
        <aside
          className={`${
            sidebarOpen ? "w-80" : "w-0"
          } transition-all duration-300 border-r border-border bg-card overflow-y-auto flex-shrink-0 hidden lg:block`}
        >
          <div className="p-4">
            <h2 className="font-bold text-sm text-foreground mb-4 uppercase tracking-wider">
              {t.coursePlayer.syllabus}
            </h2>

            {modules.map((mod, mi) => {
              const modTitle = locale === "fr" && mod.titleFr ? mod.titleFr : mod.title;
              const modLessons = mod.lessons;
              const completedInMod = modLessons.filter((l) => completedLessonIds.has(l.id)).length;

              return (
                <div key={mod.id} className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      {t.coursePlayer.module} {mi + 1}: {modTitle}
                    </h3>
                    <span className="text-xs text-muted-foreground">
                      {completedInMod}/{modLessons.length}
                    </span>
                  </div>

                  {modLessons.map((lesson, li) => {
                    const isCompleted = completedLessonIds.has(lesson.id);
                    const isActive = activeLessonId === lesson.id;
                    const lessonTitle =
                      locale === "fr" && lesson.titleFr ? lesson.titleFr : lesson.title;

                    return (
                      <button
                        key={lesson.id}
                        onClick={() => {
                          if (!isEnrolled) {
                            toast.error("Please enroll first");
                            return;
                          }
                          setActiveLessonId(lesson.id);
                        }}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-sm transition-colors mb-1 ${
                          isActive
                            ? "bg-[#1B1464]/10 text-[#1B1464] font-medium"
                            : "hover:bg-muted text-foreground"
                        }`}
                      >
                        {isCompleted ? (
                          <CheckCircle2 className="w-4 h-4 text-[#2EC4B6] flex-shrink-0" />
                        ) : isActive ? (
                          <Play className="w-4 h-4 text-[#1B1464] flex-shrink-0" />
                        ) : (
                          <Circle className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="truncate">{lessonTitle}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                            {CONTENT_ICONS[lesson.contentType ?? "text"]}
                            <span>{lesson.estimatedMinutes ?? 10} {t.coursePlayer.minutes}</span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto">
          {!isEnrolled ? (
            /* Enrollment CTA */
            <div className="max-w-3xl mx-auto px-6 py-12">
              <div className="text-center mb-8">
                <GraduationCap className="w-16 h-16 text-[#1B1464] mx-auto mb-4" />
                <h2 className="text-3xl font-extrabold text-foreground mb-3">{courseTitle}</h2>
                <p className="text-muted-foreground max-w-xl mx-auto">
                  {locale === "fr" && course.descriptionFr
                    ? course.descriptionFr
                    : course.description}
                </p>
              </div>

              <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground mb-8">
                <span className="flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4" />
                  {course.totalLessons ?? 0} lessons
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  {course.totalDurationMinutes ?? 0} min
                </span>
                {course.hasCertificate && (
                  <span className="flex items-center gap-1.5 text-[#2EC4B6]">
                    <Award className="w-4 h-4" />
                    {t.coursePlayer.certificate}
                  </span>
                )}
              </div>

              <div className="flex justify-center">
                <Button
                  size="lg"
                  className="rounded-xl px-8 font-bold text-base"
                  style={{ backgroundColor: "#FF4B2B" }}
                  onClick={() => enrollMutation.mutate({ courseId })}
                  disabled={enrollMutation.isPending || !isAuthenticated}
                >
                  {enrollMutation.isPending ? (
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  ) : (
                    <GraduationCap className="w-5 h-5 mr-2" />
                  )}
                  {t.coursePlayer.enrollNow}
                </Button>
              </div>

              {/* Course syllabus preview */}
              <div className="mt-12">
                <h3 className="text-lg font-bold mb-4">{t.coursePlayer.syllabus}</h3>
                {modules.map((mod, mi) => (
                  <div key={mod.id} className="mb-4 bg-card rounded-xl border p-4">
                    <h4 className="font-semibold text-foreground mb-2">
                      {t.coursePlayer.module} {mi + 1}:{" "}
                      {locale === "fr" && mod.titleFr ? mod.titleFr : mod.title}
                    </h4>
                    <div className="space-y-1">
                      {mod.lessons.map((lesson) => (
                        <div
                          key={lesson.id}
                          className="flex items-center gap-2 text-sm text-muted-foreground py-1"
                        >
                          <Lock className="w-3.5 h-3.5" />
                          <span>
                            {locale === "fr" && lesson.titleFr ? lesson.titleFr : lesson.title}
                          </span>
                          <span className="ml-auto text-xs">
                            {lesson.estimatedMinutes ?? 10} {t.coursePlayer.minutes}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : activeLesson ? (
            /* Lesson Content */
            <div className="max-w-4xl mx-auto px-6 py-8">
              {/* Lesson Header */}
              <div className="mb-6">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                  {CONTENT_ICONS[activeLesson.contentType ?? "text"]}
                  <span className="capitalize">{activeLesson.contentType}</span>
                  <span>·</span>
                  <span>
                    {activeLesson.estimatedMinutes ?? 10} {t.coursePlayer.minutes}
                  </span>
                </div>
                <h2 className="text-2xl font-bold text-foreground">
                  {locale === "fr" && activeLesson.titleFr
                    ? activeLesson.titleFr
                    : activeLesson.title}
                </h2>
              </div>

              {/* Video Content */}
              {activeLesson.contentType === "video" && activeLesson.videoUrl && (
                <div className="mb-8 rounded-xl overflow-hidden bg-black aspect-video">
                  <video
                    src={activeLesson.videoUrl}
                    controls
                    className="w-full h-full"
                    controlsList="nodownload"
                  />
                </div>
              )}

              {/* Audio Content */}
              {activeLesson.contentType === "audio" && activeLesson.audioUrl && (
                <div className="mb-8 p-6 bg-gradient-to-r from-[#1B1464]/10 to-[#2EC4B6]/10 rounded-xl">
                  <div className="flex items-center gap-4 mb-4">
                    <Headphones className="w-8 h-8 text-[#1B1464]" />
                    <span className="font-medium text-foreground">Audio Lesson</span>
                  </div>
                  <audio src={activeLesson.audioUrl} controls className="w-full" />
                </div>
              )}

              {/* Text Content */}
              {activeLesson.textContent && (
                <div className="prose prose-sm max-w-none mb-8">
                  <Streamdown>{activeLesson.textContent}</Streamdown>
                </div>
              )}

              {/* Description */}
              {activeLesson.description && !activeLesson.textContent && (
                <div className="prose prose-sm max-w-none mb-8">
                  <Streamdown>{activeLesson.description}</Streamdown>
                </div>
              )}

              {/* Complete / Navigation */}
              <div className="flex items-center justify-between pt-6 border-t border-border">
                {prevLesson ? (
                  <Button
                    variant="outline"
                    onClick={() => setActiveLessonId(prevLesson.id)}
                    className="rounded-xl"
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    {t.coursePlayer.previousLesson}
                  </Button>
                ) : (
                  <div />
                )}

                <div className="flex items-center gap-3">
                  {!completedLessonIds.has(activeLessonId!) && (
                    <Button
                      onClick={() =>
                        completeMutation.mutate({
                          lessonId: activeLessonId!,
                          courseId,
                        })
                      }
                      disabled={completeMutation.isPending}
                      className="rounded-xl font-semibold"
                      style={{ backgroundColor: "#2EC4B6" }}
                    >
                      {completeMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                      )}
                      {t.coursePlayer.markComplete}
                    </Button>
                  )}

                  {completedLessonIds.has(activeLessonId!) && (
                    <span className="flex items-center gap-1.5 text-sm text-[#2EC4B6] font-medium">
                      <CheckCircle2 className="w-4 h-4" />
                      {t.coursePlayer.completed}
                    </span>
                  )}
                </div>

                {nextLessonNav ? (
                  <Button
                    onClick={() => setActiveLessonId(nextLessonNav.id)}
                    className="rounded-xl font-semibold"
                    style={{ backgroundColor: "#1B1464" }}
                  >
                    {t.coursePlayer.nextLesson}
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                ) : (
                  <div />
                )}
              </div>
            </div>
          ) : lessonLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-[#1B1464]" />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <BookOpen className="w-12 h-12 text-muted-foreground" />
              <p className="text-muted-foreground">Select a lesson to begin</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
