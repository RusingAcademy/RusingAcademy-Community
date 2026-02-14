import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useLocale } from "@/i18n/LocaleContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Sparkles, BookOpen, Target, TrendingUp, History, CheckCircle2, AlertCircle, PenLine } from "lucide-react";
import { useLocation } from "wouter";
import { useState } from "react";

type CorrectionResult = {
  correctedText: string;
  corrections: Array<{ original: string; corrected: string; type: string; explanation: string; explanationFr: string }>;
  grammarScore: number;
  styleScore: number;
  overallScore: number;
  detectedLevel: string;
  feedback: string;
  feedbackFr: string;
};

function ScoreCircle({ score, label, color }: { score: number; label: string; color: string }) {
  const circumference = 2 * Math.PI * 36;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-20 h-20">
        <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
          <circle cx="40" cy="40" r="36" fill="none" stroke="#e5e7eb" strokeWidth="6" />
          <circle cx="40" cy="40" r="36" fill="none" stroke={color} strokeWidth="6"
            strokeDasharray={circumference} strokeDashoffset={offset}
            strokeLinecap="round" className="transition-all duration-1000" />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-bold" style={{ color }}>{score}</span>
        </div>
      </div>
      <span className="text-xs text-muted-foreground mt-1">{label}</span>
    </div>
  );
}

export default function AIAssistant() {
  const { t } = useLocale();
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [text, setText] = useState("");
  const [language, setLanguage] = useState<"fr" | "en">("fr");
  const [result, setResult] = useState<CorrectionResult | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  const correctMutation = trpc.aiAssistant.correctWriting.useMutation({
    onSuccess: (data) => {
      setResult(data as CorrectionResult);
      toast.success(t.aiAssistant.correctedText + "!");
    },
    onError: (err) => toast.error(err.message),
  });

  const { data: progress } = trpc.aiAssistant.myProgress.useQuery(undefined, { enabled: isAuthenticated });
  const { data: history } = trpc.aiAssistant.myHistory.useQuery(undefined, { enabled: isAuthenticated && showHistory });

  const handleSubmit = () => {
    if (!text.trim()) return toast.error("Please enter some text to analyze");
    if (text.length < 10) return toast.error("Please write at least 10 characters");
    correctMutation.mutate({ text, language });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1B1464]/5 to-background">
      <div className="max-w-5xl mx-auto px-4 pt-8 pb-16">
        <button onClick={() => navigate("/")} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> {t.membership.backToCommunity}
        </button>

        {/* Header */}
        <div className="text-center mb-10">
          <div className="mx-auto w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ backgroundColor: "#8B5CF6" + "20" }}>
            <Sparkles className="w-8 h-8" style={{ color: "#8B5CF6" }} />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight mb-2" style={{ color: "#1B1464" }}>
            {t.aiAssistant.title}
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            {t.aiAssistant.subtitle}
          </p>
        </div>

        {/* Progress Stats */}
        {progress && progress.totalCorrections > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            {[
              { label: "Corrections", value: progress.totalCorrections, icon: CheckCircle2, color: "#22C55E" },
              { label: "Avg Grammar", value: `${progress.avgGrammarScore}%`, icon: BookOpen, color: "#1B1464" },
              { label: "Avg Style", value: `${progress.avgStyleScore}%`, icon: PenLine, color: "#D4AF37" },
              { label: "Level", value: progress.currentLevel, icon: Target, color: "#8B5CF6" },
            ].map((stat) => (
              <Card key={stat.label} className="border">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: stat.color + "15" }}>
                    <stat.icon className="w-4 h-4" style={{ color: stat.color }} />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                    <p className="text-lg font-bold" style={{ color: stat.color }}>{stat.value}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Input Panel */}
          <Card className="border-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <PenLine className="w-5 h-5" style={{ color: "#1B1464" }} />
                  Your Text
                </CardTitle>
                <div className="flex gap-1">
                  <Button
                    variant={language === "fr" ? "default" : "outline"}
                    size="sm"
                    className="rounded-lg text-xs"
                    style={language === "fr" ? { backgroundColor: "#1B1464" } : {}}
                    onClick={() => setLanguage("fr")}
                  >
                    Français
                  </Button>
                  <Button
                    variant={language === "en" ? "default" : "outline"}
                    size="sm"
                    className="rounded-lg text-xs"
                    style={language === "en" ? { backgroundColor: "#1B1464" } : {}}
                    onClick={() => setLanguage("en")}
                  >
                    English
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={language === "fr"
                  ? "Écrivez votre texte ici pour recevoir des corrections et des conseils..."
                  : "Write your text here to receive corrections and feedback..."}
                className="w-full h-48 p-4 rounded-xl border bg-muted/30 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#1B1464]/30"
              />
              <div className="flex items-center justify-between mt-3">
                <span className="text-xs text-muted-foreground">{text.length}/5000 characters</span>
                <Button
                  onClick={handleSubmit}
                  disabled={correctMutation.isPending || !text.trim()}
                  className="rounded-xl font-semibold"
                  style={{ backgroundColor: "#8B5CF6" }}
                >
                  {correctMutation.isPending ? (
                    <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Analyzing...</>
                  ) : (
                    <><Sparkles className="w-4 h-4 mr-2" /> Analyze</>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Results Panel */}
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Sparkles className="w-5 h-5" style={{ color: "#8B5CF6" }} />
                AI Feedback
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!result ? (
                <div className="flex flex-col items-center justify-center h-48 text-center">
                  <Sparkles className="w-12 h-12 text-muted-foreground/20 mb-3" />
                  <p className="text-muted-foreground text-sm">Submit your text to receive AI-powered feedback</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Scores */}
                  <div className="flex justify-center gap-6">
                    <ScoreCircle score={result.grammarScore} label="Grammar" color="#1B1464" />
                    <ScoreCircle score={result.styleScore} label="Style" color="#D4AF37" />
                    <ScoreCircle score={result.overallScore} label="Overall" color="#8B5CF6" />
                  </div>

                  {/* Level */}
                  <div className="text-center">
                    <Badge className="text-sm px-4 py-1" style={{ backgroundColor: "#1B1464" }}>
                      Level: {result.detectedLevel}
                    </Badge>
                  </div>

                  {/* Feedback */}
                  <div className="bg-muted/50 rounded-xl p-4">
                    <p className="text-sm font-medium mb-1">Feedback</p>
                    <p className="text-sm text-muted-foreground">{result.feedback}</p>
                    <p className="text-sm text-muted-foreground mt-2 italic">{result.feedbackFr}</p>
                  </div>

                  {/* Corrections */}
                  {result.corrections.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold mb-2 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-amber-500" />
                        {result.corrections.length} correction{result.corrections.length > 1 ? "s" : ""} found
                      </p>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {result.corrections.map((c, i) => (
                          <div key={i} className="bg-card rounded-lg p-3 border text-sm">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline" className="text-xs capitalize">{c.type}</Badge>
                            </div>
                            <p>
                              <span className="line-through text-red-500">{c.original}</span>
                              {" → "}
                              <span className="text-green-600 font-medium">{c.corrected}</span>
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">{c.explanation}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Corrected Text */}
                  <div>
                    <p className="text-sm font-semibold mb-2 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      Corrected Version
                    </p>
                    <div className="bg-green-50 rounded-xl p-4 text-sm border border-green-200">
                      {result.correctedText}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* History Toggle */}
        <div className="mt-8 text-center">
          <Button
            variant="outline"
            className="rounded-xl"
            onClick={() => setShowHistory(!showHistory)}
          >
            <History className="w-4 h-4 mr-2" />
            {showHistory ? t.common.showLess : t.aiAssistant.history}
          </Button>
        </div>

        {/* History */}
        {showHistory && history && (
          <div className="mt-6 space-y-3">
            {history.length === 0 ? (
              <p className="text-center text-muted-foreground text-sm py-4">No correction history yet.</p>
            ) : (
              history.map((item) => (
                <Card key={item.id} className="border">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">{item.language?.toUpperCase()}</Badge>
                        <Badge className="text-xs" style={{ backgroundColor: "#1B1464" }}>
                          {item.detectedLevel}
                        </Badge>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{item.originalText}</p>
                    <div className="flex gap-3 mt-2">
                      <span className="text-xs">Grammar: <strong>{item.grammarScore}%</strong></span>
                      <span className="text-xs">Style: <strong>{item.styleScore}%</strong></span>
                      <span className="text-xs">Overall: <strong>{item.overallScore}%</strong></span>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
