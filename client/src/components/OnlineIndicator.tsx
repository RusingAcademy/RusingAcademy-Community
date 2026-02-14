/**
 * OnlineIndicator — Green dot overlay for avatars showing real-time online status
 */
import { useWebSocket } from "@/hooks/useWebSocket";

interface OnlineIndicatorProps {
  userId: string | number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeMap = {
  sm: "w-2 h-2",
  md: "w-2.5 h-2.5",
  lg: "w-3 h-3",
};

const positionMap = {
  sm: "-bottom-0 -right-0",
  md: "-bottom-0.5 -right-0.5",
  lg: "-bottom-0.5 -right-0.5",
};

export default function OnlineIndicator({
  userId,
  size = "md",
  className = "",
}: OnlineIndicatorProps) {
  const { isOnline } = useWebSocket();
  const online = isOnline(String(userId));

  if (!online) return null;

  return (
    <span
      className={`absolute ${positionMap[size]} ${sizeMap[size]} rounded-full border-2 border-white dark:border-gray-900 ${className}`}
      style={{
        background: "linear-gradient(135deg, #22c55e, #16a34a)",
        boxShadow: "0 0 6px rgba(34, 197, 94, 0.4)",
      }}
      aria-label="Online"
    />
  );
}

/**
 * TypingIndicator — Animated dots showing someone is typing
 */
export function TypingIndicator({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-1 px-3 py-2 ${className}`}>
      <span className="text-xs text-muted-foreground italic mr-1">typing</span>
      <span className="flex gap-0.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50"
            style={{
              animation: `typing-bounce 1.4s ease-in-out ${i * 0.2}s infinite`,
            }}
          />
        ))}
      </span>
    </div>
  );
}
