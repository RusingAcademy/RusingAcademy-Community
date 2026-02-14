import { usePWAInstall } from "@/hooks/usePWAInstall";
import { Button } from "@/components/ui/button";
import { Download, X, Share, Plus, Smartphone } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * PWA Install Banner
 * - Chrome/Edge/Samsung: Shows "Install" CTA that triggers the native prompt
 * - iOS Safari: Shows step-by-step A2HS instructions
 * - Already installed or dismissed: Hidden
 */
export default function PWAInstallBanner() {
  const {
    isInstallable,
    isInstalled,
    isIOS,
    showIOSPrompt,
    promptInstall,
    dismissIOSPrompt,
  } = usePWAInstall();

  const [dismissed, setDismissed] = useState(false);
  const [showIOSSteps, setShowIOSSteps] = useState(false);

  // Don't show if already installed or user dismissed
  if (isInstalled || dismissed) return null;

  // Chrome/Edge install prompt
  if (isInstallable) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-[380px] z-50"
        >
          <div className="bg-card border border-border rounded-2xl shadow-xl p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#0D7377]/10 flex items-center justify-center shrink-0">
                <Smartphone className="w-5 h-5 text-[#0D7377]" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm text-foreground">
                  Install RA Community
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Get quick access from your home screen with offline support.
                </p>
                <div className="flex items-center gap-2 mt-3">
                  <Button
                    onClick={promptInstall}
                    size="sm"
                    className="rounded-full text-xs font-semibold px-4"
                    style={{ backgroundColor: "#0D7377" }}
                  >
                    <Download className="w-3.5 h-3.5 mr-1.5" />
                    Install
                  </Button>
                  <button
                    onClick={() => setDismissed(true)}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Not now
                  </button>
                </div>
              </div>
              <button
                onClick={() => setDismissed(true)}
                className="text-muted-foreground hover:text-foreground transition-colors p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  // iOS Safari A2HS instructions
  if (isIOS && showIOSPrompt && !showIOSSteps) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-[380px] z-50"
        >
          <div className="bg-card border border-border rounded-2xl shadow-xl p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#0D7377]/10 flex items-center justify-center shrink-0">
                <Smartphone className="w-5 h-5 text-[#0D7377]" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm text-foreground">
                  Add to Home Screen
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Install RA Community on your iPhone for the best experience.
                </p>
                <div className="flex items-center gap-2 mt-3">
                  <Button
                    onClick={() => setShowIOSSteps(true)}
                    size="sm"
                    className="rounded-full text-xs font-semibold px-4"
                    style={{ backgroundColor: "#0D7377" }}
                  >
                    Show me how
                  </Button>
                  <button
                    onClick={() => {
                      dismissIOSPrompt();
                      setDismissed(true);
                    }}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Not now
                  </button>
                </div>
              </div>
              <button
                onClick={() => {
                  dismissIOSPrompt();
                  setDismissed(true);
                }}
                className="text-muted-foreground hover:text-foreground transition-colors p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  // iOS A2HS step-by-step instructions
  if (isIOS && showIOSSteps) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-[380px] z-50"
        >
          <div className="bg-card border border-border rounded-2xl shadow-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-sm text-foreground">
                Add to Home Screen
              </h3>
              <button
                onClick={() => {
                  dismissIOSPrompt();
                  setDismissed(true);
                }}
                className="text-muted-foreground hover:text-foreground transition-colors p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Step 1 */}
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-[#0D7377]/10 flex items-center justify-center shrink-0 text-xs font-bold text-[#0D7377]">
                  1
                </div>
                <div>
                  <p className="text-sm text-foreground font-medium">
                    Tap the Share button
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                    Find the
                    <Share className="w-3.5 h-3.5 inline" />
                    icon at the bottom of Safari
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-[#0D7377]/10 flex items-center justify-center shrink-0 text-xs font-bold text-[#0D7377]">
                  2
                </div>
                <div>
                  <p className="text-sm text-foreground font-medium">
                    Scroll and tap "Add to Home Screen"
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                    Look for the
                    <Plus className="w-3.5 h-3.5 inline" />
                    icon in the share sheet
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-[#0D7377]/10 flex items-center justify-center shrink-0 text-xs font-bold text-[#0D7377]">
                  3
                </div>
                <div>
                  <p className="text-sm text-foreground font-medium">
                    Tap "Add" to confirm
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    The app will appear on your home screen
                  </p>
                </div>
              </div>
            </div>

            <Button
              onClick={() => {
                dismissIOSPrompt();
                setDismissed(true);
              }}
              variant="outline"
              size="sm"
              className="w-full mt-4 rounded-full text-xs"
            >
              Got it
            </Button>
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  return null;
}
