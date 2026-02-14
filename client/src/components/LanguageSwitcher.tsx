import { useLocale } from "@/i18n/LocaleContext";
import { Button } from "@/components/ui/button";
import { Globe } from "lucide-react";

interface LanguageSwitcherProps {
  variant?: "icon" | "full" | "compact";
  className?: string;
}

export default function LanguageSwitcher({ variant = "compact", className = "" }: LanguageSwitcherProps) {
  const { locale, toggleLocale } = useLocale();

  if (variant === "icon") {
    return (
      <button
        onClick={toggleLocale}
        className={`flex items-center justify-center w-9 h-9 rounded-full hover:bg-accent transition-colors ${className}`}
        title={locale === "en" ? "Passer au français" : "Switch to English"}
        aria-label={locale === "en" ? "Switch to French" : "Switch to English"}
      >
        <span className="text-sm font-bold uppercase">{locale === "en" ? "FR" : "EN"}</span>
      </button>
    );
  }

  if (variant === "full") {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={toggleLocale}
        className={`gap-2 rounded-full ${className}`}
      >
        <Globe className="w-4 h-4" />
        {locale === "en" ? "Français" : "English"}
      </Button>
    );
  }

  // compact (default)
  return (
    <button
      onClick={toggleLocale}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border text-sm font-medium hover:bg-accent transition-colors ${className}`}
      title={locale === "en" ? "Passer au français" : "Switch to English"}
    >
      <Globe className="w-3.5 h-3.5" />
      <span>{locale === "en" ? "FR" : "EN"}</span>
    </button>
  );
}
