/**
 * WebSocketStatus — Small indicator showing WS connection state and online user count
 * Used in the sidebar footer area
 */
import { useWebSocket } from "@/hooks/useWebSocket";
import { Wifi, WifiOff, Users } from "lucide-react";

interface WebSocketStatusProps {
  compact?: boolean;
}

export default function WebSocketStatus({ compact = false }: WebSocketStatusProps) {
  const { connected, onlineCount } = useWebSocket();

  if (compact) {
    return (
      <div className="flex items-center gap-1.5">
        <span
          className="w-2 h-2 rounded-full"
          style={{
            background: connected
              ? "linear-gradient(135deg, #22c55e, #16a34a)"
              : "linear-gradient(135deg, #ef4444, #dc2626)",
            boxShadow: connected
              ? "0 0 4px rgba(34, 197, 94, 0.3)"
              : "0 0 4px rgba(239, 68, 68, 0.3)",
          }}
        />
        {connected && onlineCount > 0 && (
          <span className="text-[10px] text-muted-foreground font-medium">
            {onlineCount} online
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs">
      {connected ? (
        <>
          <Wifi className="w-3.5 h-3.5 text-green-500" />
          <span className="text-muted-foreground font-medium">Connected</span>
          {onlineCount > 0 && (
            <span className="flex items-center gap-1 text-muted-foreground">
              <Users className="w-3 h-3" />
              {onlineCount}
            </span>
          )}
        </>
      ) : (
        <>
          <WifiOff className="w-3.5 h-3.5 text-red-400" />
          <span className="text-muted-foreground font-medium">Offline</span>
        </>
      )}
    </div>
  );
}
