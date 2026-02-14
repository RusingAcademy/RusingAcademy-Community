import { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useLocation, useRoute } from "wouter";
import {
  ArrowLeft,
  ArrowRight,
  Plus,
  Trash2,
  GripVertical,
  BookOpen,
  FileText,
  Video,
  Headphones,
  Loader2,
  Check,
  Pencil,
  Eye,
  ChevronDown,
  ChevronUp,
  Rocket,
} from "lucide-react";
import { useLocale } from "@/i18n/LocaleContext";

// ─── Types ───────────────────────────────────────────────────────────
interface ModuleDraft {
  tempId: string;
  dbId?: number;
  title: string;
  titleFr: string;
  description: string;
  isPreview: boolean;
  lessons: LessonDraft[];
  expanded: boolean;
}

interface LessonDraft {
  tempId: string;
  dbId?: number;
  title: string;
  titleFr: string;
  description: string;
  contentType: string;
  videoUrl: string;
  textContent: string;
  audioUrl: string;
  estimatedMinutes: number;
  isPreview: boolean;
  isMandatory: boolean;
}

const CATEGORIES = [
  { value: "sle_oral", label: "SLE — Oral" },
  { value: "sle_written", label: "SLE — Written" },
  { value: "sle_reading", label: "SLE — Reading" },
  { value: "sle_complete", label: "SLE — Complete" },
  { value: "business_french", label: "Business French" },
  { value: "business_english", label: "Business English" },
  { value: "exam_prep", label: "Exam Prep" },
  { value: "conversation", label: "Conversation" },
  { value: "grammar", label: "Grammar" },
  { value: "vocabulary", label: "Vocabulary" },
];

const LEVELS = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
  { value: "all_levels", label: "All Levels" },
];

const CONTENT_TYPES = [
  { value: "video", label: "Video", icon: Video },
  { value: "text", label: "Text", icon: FileText },
  { value: "audio", label: "Audio", icon: Headphones },
  { value: "quiz", label: "Quiz", icon: BookOpen },
];

function genId() {
  return Math.random().toString(36).slice(2, 10);
}

// ─── Main Component ──────────────────────────────────────────────────
export default function CourseBuilder() {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const { t } = useLocale();
  const [, params] = useRoute("/admin/courses/:id/edit");
  const editId = params?.id ? Number(params.id) : null;

  const [step, setStep] = useState(1);
  const [courseId, setCourseId] = useState<number | null>(editId);

  // Step 1: Course details
  const [title, setTitle] = useState("");
  const [titleFr, setTitleFr] = useState("");
  const [description, setDescription] = useState("");
  const [descriptionFr, setDescriptionFr] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [category, setCategory] = useState("sle_oral");
  const [level, setLevel] = useState("all_levels");
  const [targetLanguage, setTargetLanguage] = useState("french");
  const [price, setPrice] = useState(0);
  const [accessType, setAccessType] = useState("free");
  const [hasCertificate, setHasCertificate] = useState(true);

  // Step 2: Modules & Lessons
  const [modules, setModules] = useState<ModuleDraft[]>([]);

  // Existing course data (edit mode)
  const existingCourse = trpc.courseAdmin.get.useQuery(
    { id: editId! },
    { enabled: !!editId }
  );

  useEffect(() => {
    if (existingCourse.data) {
      const c = existingCourse.data.course;
      setTitle(c.title);
      setTitleFr(c.titleFr ?? "");
      setDescription(c.description ?? "");
      setDescriptionFr(c.descriptionFr ?? "");
      setShortDescription(c.shortDescription ?? "");
      setCategory(c.category ?? "sle_oral");
      setLevel(c.level ?? "all_levels");
      setTargetLanguage(c.targetLanguage ?? "french");
      setPrice(c.price ?? 0);
      setAccessType(c.accessType ?? "free");
      setHasCertificate(c.hasCertificate ?? true);
      setCourseId(c.id);

      setModules(
        existingCourse.data.modules.map((m) => ({
          tempId: genId(),
          dbId: m.id,
          title: m.title,
          titleFr: m.titleFr ?? "",
          description: m.description ?? "",
          isPreview: m.isPreview ?? false,
          expanded: false,
          lessons: m.lessons.map((l) => ({
            tempId: genId(),
            dbId: l.id,
            title: l.title,
            titleFr: l.titleFr ?? "",
            description: l.description ?? "",
            contentType: l.contentType ?? "video",
            videoUrl: l.videoUrl ?? "",
            textContent: l.textContent ?? "",
            audioUrl: l.audioUrl ?? "",
            estimatedMinutes: l.estimatedMinutes ?? 10,
            isPreview: l.isPreview ?? false,
            isMandatory: l.isMandatory ?? true,
          })),
        }))
      );
    }
  }, [existingCourse.data]);

  // Mutations
  const createCourseMut = trpc.courseAdmin.createCourse.useMutation();
  const updateCourseMut = trpc.courseAdmin.updateCourse.useMutation();
  const addModuleMut = trpc.courseAdmin.addModule.useMutation();
  const addLessonMut = trpc.courseAdmin.addLesson.useMutation();
  const publishMut = trpc.courseAdmin.publishCourse.useMutation();

  // Course list for the listing view
  const courseList = trpc.courseAdmin.list.useQuery(undefined, {
    enabled: isAuthenticated && user?.role === "admin" && !editId,
  });

  // ─── Handlers ────────────────────────────────────────────────────
  const handleSaveCourseDetails = async () => {
    try {
      if (courseId) {
        await updateCourseMut.mutateAsync({
          id: courseId,
          title,
          titleFr: titleFr || undefined,
          description: description || undefined,
          descriptionFr: descriptionFr || undefined,
          shortDescription: shortDescription || undefined,
          category,
          level,
          targetLanguage,
          price,
          accessType,
          hasCertificate,
        });
        toast.success("Course details updated!");
      } else {
        const result = await createCourseMut.mutateAsync({
          title,
          titleFr: titleFr || undefined,
          description: description || undefined,
          descriptionFr: descriptionFr || undefined,
          shortDescription: shortDescription || undefined,
          category,
          level,
          targetLanguage,
          price,
          accessType,
          hasCertificate,
        });
        setCourseId(result.id);
        toast.success("Course created!");
      }
      setStep(2);
    } catch (err: any) {
      toast.error(err.message || "Failed to save course");
    }
  };

  const handleSaveModulesAndLessons = async () => {
    if (!courseId) return;
    try {
      for (let mi = 0; mi < modules.length; mi++) {
        const mod = modules[mi];
        let moduleId = mod.dbId;
        if (!moduleId) {
          const res = await addModuleMut.mutateAsync({
            courseId,
            title: mod.title,
            titleFr: mod.titleFr || undefined,
            description: mod.description || undefined,
            sortOrder: mi,
            isPreview: mod.isPreview,
          });
          moduleId = res.id;
          modules[mi].dbId = moduleId;
        }
        for (let li = 0; li < mod.lessons.length; li++) {
          const lesson = mod.lessons[li];
          if (!lesson.dbId) {
            const res = await addLessonMut.mutateAsync({
              moduleId: moduleId!,
              courseId,
              title: lesson.title,
              titleFr: lesson.titleFr || undefined,
              description: lesson.description || undefined,
              contentType: lesson.contentType,
              videoUrl: lesson.videoUrl || undefined,
              textContent: lesson.textContent || undefined,
              audioUrl: lesson.audioUrl || undefined,
              sortOrder: li,
              estimatedMinutes: lesson.estimatedMinutes,
              isPreview: lesson.isPreview,
              isMandatory: lesson.isMandatory,
            });
            modules[mi].lessons[li].dbId = res.id;
          }
        }
      }
      setModules([...modules]);
      toast.success("Modules and lessons saved!");
      setStep(3);
    } catch (err: any) {
      toast.error(err.message || "Failed to save modules");
    }
  };

  const handlePublish = async () => {
    if (!courseId) return;
    try {
      const res = await publishMut.mutateAsync({ id: courseId });
      toast.success(`Course published! ${res.totalModules} modules, ${res.totalLessons} lessons.`);
      navigate("/admin/courses");
    } catch (err: any) {
      toast.error(err.message || "Failed to publish");
    }
  };

  const addModule = () => {
    setModules([
      ...modules,
      {
        tempId: genId(),
        title: "",
        titleFr: "",
        description: "",
        isPreview: false,
        lessons: [],
        expanded: true,
      },
    ]);
  };

  const removeModule = (idx: number) => {
    setModules(modules.filter((_, i) => i !== idx));
  };

  const addLesson = (moduleIdx: number) => {
    const updated = [...modules];
    updated[moduleIdx].lessons.push({
      tempId: genId(),
      title: "",
      titleFr: "",
      description: "",
      contentType: "video",
      videoUrl: "",
      textContent: "",
      audioUrl: "",
      estimatedMinutes: 10,
      isPreview: false,
      isMandatory: true,
    });
    setModules(updated);
  };

  const removeLesson = (moduleIdx: number, lessonIdx: number) => {
    const updated = [...modules];
    updated[moduleIdx].lessons = updated[moduleIdx].lessons.filter((_, i) => i !== lessonIdx);
    setModules(updated);
  };

  const toggleModuleExpand = (idx: number) => {
    const updated = [...modules];
    updated[idx].expanded = !updated[idx].expanded;
    setModules(updated);
  };

  // Guard
  if (!isAuthenticated || user?.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <BookOpen className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-bold mb-2">Admin Access Required</h2>
            <p className="text-muted-foreground">You need admin privileges to access the Course Builder.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ─── Course List View ────────────────────────────────────────────
  if (!editId && step === 1 && !courseId) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#1B1464]/5 to-background">
        <div className="max-w-5xl mx-auto px-4 py-8">
          <button onClick={() => navigate("/")} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" /> {t.common.back}
          </button>

          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-extrabold" style={{ color: "#1B1464" }}>{t.courseBuilder.title}</h1>
              <p className="text-muted-foreground mt-1">{t.courseBuilder.subtitle}</p>
            </div>
            <Button
              onClick={() => { setCourseId(null); setStep(1); setTitle(""); setModules([]); navigate("/admin/courses/new"); }}
              className="rounded-xl font-semibold text-white gap-2"
              style={{ backgroundColor: "#1B1464" }}
            >
              <Plus className="w-4 h-4" /> {t.courseBuilder.newCourse}
            </Button>
          </div>

          {courseList.isLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-[#1B1464]" /></div>
          ) : (
            <div className="grid gap-4">
              {(courseList.data ?? []).map((course) => (
                <Card key={course.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="flex items-center justify-between p-5">
                    <div className="flex items-center gap-4">
                      {course.thumbnailUrl ? (
                        <img src={course.thumbnailUrl} alt="" className="w-16 h-16 rounded-lg object-cover" />
                      ) : (
                        <div className="w-16 h-16 rounded-lg bg-[#1B1464]/10 flex items-center justify-center">
                          <BookOpen className="w-7 h-7 text-[#1B1464]" />
                        </div>
                      )}
                      <div>
                        <h3 className="font-bold text-foreground">{course.title}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant={course.status === "published" ? "default" : "secondary"} className="text-xs">
                            {course.status}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {course.totalModules} modules · {course.totalLessons} lessons
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-lg gap-2"
                      onClick={() => navigate(`/admin/courses/${course.id}/edit`)}
                    >
                      <Pencil className="w-3.5 h-3.5" /> {t.common.edit}
                    </Button>
                  </CardContent>
                </Card>
              ))}
              {(courseList.data ?? []).length === 0 && (
                <div className="text-center py-16">
                  <BookOpen className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No courses yet. Create your first course!</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─── Wizard Steps ────────────────────────────────────────────────
  const isSaving = createCourseMut.isPending || updateCourseMut.isPending || addModuleMut.isPending || addLessonMut.isPending;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1B1464]/5 to-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <button onClick={() => navigate("/admin/courses")} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Courses
        </button>

        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-4 mb-10">
          {[
            { num: 1, label: t.courseBuilder.details },
            { num: 2, label: t.courseBuilder.content },
            { num: 3, label: t.courseBuilder.review },
          ].map((s, i) => (
            <div key={s.num} className="flex items-center gap-2">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                  step >= s.num ? "bg-[#1B1464] text-white" : "bg-muted text-muted-foreground"
                }`}
              >
                {step > s.num ? <Check className="w-4 h-4" /> : s.num}
              </div>
              <span className={`text-sm font-medium hidden sm:inline ${step >= s.num ? "text-foreground" : "text-muted-foreground"}`}>
                {s.label}
              </span>
              {i < 2 && <div className={`w-12 h-0.5 ${step > s.num ? "bg-[#1B1464]" : "bg-muted"}`} />}
            </div>
          ))}
        </div>

        {/* Step 1: Course Details */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">{courseId ? t.courseBuilder.editCourse : t.courseBuilder.newCourse}</CardTitle>
              <CardDescription>Fill in the course details. Bilingual fields (EN/FR) are supported.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Title (EN) *</label>
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. SLE Oral Exam Prep" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Titre (FR)</label>
                  <Input value={titleFr} onChange={(e) => setTitleFr(e.target.value)} placeholder="ex. Préparation ELS oral" />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Description (EN)</label>
                  <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Course description..." />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Description (FR)</label>
                  <Textarea value={descriptionFr} onChange={(e) => setDescriptionFr(e.target.value)} rows={3} placeholder="Description du cours..." />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-1.5 block">Short Description</label>
                <Input value={shortDescription} onChange={(e) => setShortDescription(e.target.value)} placeholder="One-line summary" />
              </div>

              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Category</label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => (
                        <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Level</label>
                  <Select value={level} onValueChange={setLevel}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {LEVELS.map((l) => (
                        <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Target Language</label>
                  <Select value={targetLanguage} onValueChange={setTargetLanguage}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="french">French</SelectItem>
                      <SelectItem value="english">English</SelectItem>
                      <SelectItem value="both">Both</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Access Type</label>
                  <Select value={accessType} onValueChange={setAccessType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="free">Free</SelectItem>
                      <SelectItem value="one_time">One-time Purchase</SelectItem>
                      <SelectItem value="subscription">Subscription Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Price ($)</label>
                  <Input type="number" value={price} onChange={(e) => setPrice(Number(e.target.value))} min={0} />
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={hasCertificate} onChange={(e) => setHasCertificate(e.target.checked)} className="w-4 h-4 rounded" />
                    <span className="text-sm font-medium">Issue Certificate</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button
                  onClick={handleSaveCourseDetails}
                  disabled={!title.trim() || isSaving}
                  className="rounded-xl font-semibold text-white gap-2 px-8"
                  style={{ backgroundColor: "#1B1464" }}
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                  {t.common.next}: {t.courseBuilder.content}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Modules & Lessons */}
        {step === 2 && (
          <div className="space-y-5">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">{t.courseBuilder.modules} & {t.courseBuilder.lessons}</CardTitle>
                <CardDescription>
                  Organize your course into modules and add lessons to each module.
                </CardDescription>
              </CardHeader>
            </Card>

            {modules.map((mod, mi) => (
              <Card key={mod.tempId} className="border-l-4" style={{ borderLeftColor: "#1B1464" }}>
                <CardContent className="p-5">
                  {/* Module Header */}
                  <div className="flex items-center gap-3 mb-3">
                    <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
                    <Badge variant="outline" className="text-xs">Module {mi + 1}</Badge>
                    <Input
                      value={mod.title}
                      onChange={(e) => {
                        const u = [...modules]; u[mi].title = e.target.value; setModules(u);
                      }}
                      placeholder="Module title (EN)"
                      className="flex-1 font-medium"
                    />
                    <button onClick={() => toggleModuleExpand(mi)} className="p-1.5 rounded hover:bg-accent">
                      {mod.expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                    <button onClick={() => removeModule(mi)} className="p-1.5 rounded hover:bg-red-50 text-red-500">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {mod.expanded && (
                    <div className="pl-7 space-y-4">
                      <Input
                        value={mod.titleFr}
                        onChange={(e) => {
                          const u = [...modules]; u[mi].titleFr = e.target.value; setModules(u);
                        }}
                        placeholder="Titre du module (FR)"
                        className="text-sm"
                      />
                      <Textarea
                        value={mod.description}
                        onChange={(e) => {
                          const u = [...modules]; u[mi].description = e.target.value; setModules(u);
                        }}
                        placeholder="Module description"
                        rows={2}
                        className="text-sm"
                      />

                      {/* Lessons */}
                      <div className="space-y-3">
                        {mod.lessons.map((lesson, li) => (
                          <div key={lesson.tempId} className="bg-accent/50 rounded-lg p-4 space-y-3">
                            <div className="flex items-center gap-2">
                              <GripVertical className="w-3.5 h-3.5 text-muted-foreground cursor-grab" />
                              <Badge variant="secondary" className="text-xs">Lesson {li + 1}</Badge>
                              <Input
                                value={lesson.title}
                                onChange={(e) => {
                                  const u = [...modules]; u[mi].lessons[li].title = e.target.value; setModules(u);
                                }}
                                placeholder="Lesson title (EN)"
                                className="flex-1 text-sm"
                              />
                              <button onClick={() => removeLesson(mi, li)} className="p-1 rounded hover:bg-red-50 text-red-500">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <Input
                              value={lesson.titleFr}
                              onChange={(e) => {
                                const u = [...modules]; u[mi].lessons[li].titleFr = e.target.value; setModules(u);
                              }}
                              placeholder="Titre de la leçon (FR)"
                              className="text-sm"
                            />
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                              <Select
                                value={lesson.contentType}
                                onValueChange={(v) => {
                                  const u = [...modules]; u[mi].lessons[li].contentType = v; setModules(u);
                                }}
                              >
                                <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  {CONTENT_TYPES.map((ct) => (
                                    <SelectItem key={ct.value} value={ct.value}>{ct.label}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Input
                                type="number"
                                value={lesson.estimatedMinutes}
                                onChange={(e) => {
                                  const u = [...modules]; u[mi].lessons[li].estimatedMinutes = Number(e.target.value); setModules(u);
                                }}
                                placeholder="Min"
                                className="text-xs"
                                min={1}
                              />
                              <label className="flex items-center gap-1.5 text-xs">
                                <input
                                  type="checkbox"
                                  checked={lesson.isPreview}
                                  onChange={(e) => {
                                    const u = [...modules]; u[mi].lessons[li].isPreview = e.target.checked; setModules(u);
                                  }}
                                  className="w-3.5 h-3.5 rounded"
                                />
                                <Eye className="w-3 h-3" /> Preview
                              </label>
                              <label className="flex items-center gap-1.5 text-xs">
                                <input
                                  type="checkbox"
                                  checked={lesson.isMandatory}
                                  onChange={(e) => {
                                    const u = [...modules]; u[mi].lessons[li].isMandatory = e.target.checked; setModules(u);
                                  }}
                                  className="w-3.5 h-3.5 rounded"
                                />
                                Mandatory
                              </label>
                            </div>
                            {lesson.contentType === "video" && (
                              <Input
                                value={lesson.videoUrl}
                                onChange={(e) => {
                                  const u = [...modules]; u[mi].lessons[li].videoUrl = e.target.value; setModules(u);
                                }}
                                placeholder="Video URL"
                                className="text-sm"
                              />
                            )}
                            {lesson.contentType === "text" && (
                              <Textarea
                                value={lesson.textContent}
                                onChange={(e) => {
                                  const u = [...modules]; u[mi].lessons[li].textContent = e.target.value; setModules(u);
                                }}
                                placeholder="Lesson text content (supports Markdown)"
                                rows={4}
                                className="text-sm"
                              />
                            )}
                            {lesson.contentType === "audio" && (
                              <Input
                                value={lesson.audioUrl}
                                onChange={(e) => {
                                  const u = [...modules]; u[mi].lessons[li].audioUrl = e.target.value; setModules(u);
                                }}
                                placeholder="Audio URL"
                                className="text-sm"
                              />
                            )}
                          </div>
                        ))}
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-lg gap-2 text-xs"
                        onClick={() => addLesson(mi)}
                      >
                        <Plus className="w-3.5 h-3.5" /> {t.courseBuilder.addLesson}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}

            <Button
              variant="outline"
              className="w-full rounded-xl gap-2 border-dashed border-2 py-6"
              onClick={addModule}
            >
              <Plus className="w-4 h-4" /> {t.courseBuilder.addModule}
            </Button>

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setStep(1)} className="rounded-xl gap-2">
                <ArrowLeft className="w-4 h-4" /> {t.common.back}
              </Button>
              <Button
                onClick={handleSaveModulesAndLessons}
                disabled={modules.length === 0 || isSaving}
                className="rounded-xl font-semibold text-white gap-2 px-8"
                style={{ backgroundColor: "#1B1464" }}
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                {t.common.next}: {t.courseBuilder.review}
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Review & Publish */}
        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <Rocket className="w-5 h-5 text-[#D4AF37]" />
                {t.courseBuilder.review}
              </CardTitle>
              <CardDescription>Review your course before publishing.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Course summary */}
              <div className="bg-accent/50 rounded-xl p-5 space-y-3">
                <h3 className="text-lg font-bold">{title}</h3>
                {titleFr && <p className="text-sm text-muted-foreground italic">{titleFr}</p>}
                <p className="text-sm">{description || shortDescription || "No description"}</p>
                <div className="flex flex-wrap gap-2">
                  <Badge>{CATEGORIES.find((c) => c.value === category)?.label ?? category}</Badge>
                  <Badge variant="outline">{LEVELS.find((l) => l.value === level)?.label ?? level}</Badge>
                  <Badge variant="outline">{targetLanguage}</Badge>
                  <Badge variant="outline">{accessType === "free" ? "Free" : `$${price}`}</Badge>
                  {hasCertificate && <Badge className="bg-green-100 text-green-700 border-green-300">Certificate</Badge>}
                </div>
              </div>

              {/* Modules summary */}
              <div className="space-y-3">
                <h4 className="font-semibold">Structure: {modules.length} modules, {modules.reduce((a, m) => a + m.lessons.length, 0)} lessons</h4>
                {modules.map((mod, mi) => (
                  <div key={mod.tempId} className="bg-card border rounded-lg p-4">
                    <p className="font-medium">Module {mi + 1}: {mod.title}</p>
                    <ul className="mt-2 space-y-1">
                      {mod.lessons.map((l, li) => (
                        <li key={l.tempId} className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span className="w-5 text-center text-xs">{li + 1}.</span>
                          {l.title || "Untitled Lesson"}
                          <Badge variant="secondary" className="text-[10px] ml-auto">{l.contentType}</Badge>
                          <span className="text-xs">{l.estimatedMinutes}min</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={() => setStep(2)} className="rounded-xl gap-2">
                  <ArrowLeft className="w-4 h-4" /> {t.common.back}
                </Button>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      toast.success("Course saved as draft!");
                      navigate("/admin/courses");
                    }}
                    className="rounded-xl gap-2"
                  >
                    <FileText className="w-4 h-4" /> {t.courseBuilder.saveDraft}
                  </Button>
                  <Button
                    onClick={handlePublish}
                    disabled={publishMut.isPending}
                    className="rounded-xl font-semibold text-white gap-2 px-8"
                    style={{ backgroundColor: "#D4AF37" }}
                  >
                    {publishMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Rocket className="w-4 h-4" />}
                    {t.courseBuilder.publish}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
