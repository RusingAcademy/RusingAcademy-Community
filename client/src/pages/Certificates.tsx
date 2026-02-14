import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useLocale } from "@/i18n/LocaleContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Award, Loader2, ExternalLink } from "lucide-react";
import { useLocation } from "wouter";

const RA_LOGO = "https://files.manuscdn.com/user_upload_by_module/session_file/310519663049070748/mRLHZFARZiUVtNTg.png";

export default function Certificates() {
  const { t } = useLocale();
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  const { data: certs, isLoading } = trpc.certificate.myCertificates.useQuery(undefined, { enabled: isAuthenticated });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Please log in to view your certificates.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#D4AF37]/5 to-background">
      <div className="max-w-4xl mx-auto px-4 pt-8 pb-16">
        <button onClick={() => navigate("/")} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> {t.membership.backToCommunity}
        </button>

        <div className="text-center mb-10">
          <div className="mx-auto w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ backgroundColor: "#D4AF37" + "20" }}>
            <Award className="w-8 h-8" style={{ color: "#D4AF37" }} />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight mb-2" style={{ color: "#1B1464" }}>
            {t.certificates.title}
          </h1>
          <p className="text-muted-foreground">
            {t.certificates.subtitle}
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-[#1B1464]" />
          </div>
        ) : !certs || certs.length === 0 ? (
          <div className="text-center py-16">
            <Award className="w-20 h-20 text-muted-foreground/20 mx-auto mb-4" />
            <p className="text-muted-foreground text-lg mb-2">No certificates yet</p>
            <p className="text-sm text-muted-foreground">Complete a course to earn your first certificate.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {certs.map(({ certificate, course }) => (
              <Card key={certificate.id} className="border-2 overflow-hidden hover:shadow-lg transition-shadow" style={{ borderColor: "#D4AF37" + "30" }}>
                <CardContent className="p-0">
                  {/* Certificate Preview */}
                  <div className="bg-gradient-to-br from-[#1B1464] to-[#2D2380] p-8 text-white text-center relative overflow-hidden">
                    {/* Decorative border */}
                    <div className="absolute inset-2 border-2 border-[#D4AF37]/30 rounded-lg pointer-events-none" />

                    <img src={RA_LOGO} alt="RusingAcademy" className="w-12 h-12 mx-auto mb-3 rounded-lg" />
                    <p className="text-xs uppercase tracking-widest text-[#D4AF37] font-bold mb-2">Certificate of Completion</p>
                    <h3 className="text-xl font-bold mb-1">{certificate.title}</h3>
                    <p className="text-sm text-white/70 mb-3">Awarded to <strong className="text-white">{certificate.recipientName}</strong></p>
                    <div className="flex items-center justify-center gap-4 text-xs text-white/60">
                      <span>Certificate #{certificate.certificateNumber}</span>
                      <span>·</span>
                      <span>{new Date(certificate.completedAt).toLocaleDateString("en-CA", { year: "numeric", month: "long", day: "numeric" })}</span>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="p-5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {course.thumbnailUrl && (
                        <img src={course.thumbnailUrl} alt="" className="w-10 h-10 rounded-lg object-cover" />
                      )}
                      <div>
                        <p className="text-sm font-medium">{course.title}</p>
                        <p className="text-xs text-muted-foreground">
                          Completed {new Date(certificate.completedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs font-mono">{certificate.certificateNumber}</Badge>
                      {certificate.certificateUrl && (
                        <a href={certificate.certificateUrl} target="_blank" rel="noopener noreferrer" className="text-[#1B1464] hover:text-[#D4AF37] transition-colors">
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
