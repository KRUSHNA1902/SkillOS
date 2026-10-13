import { useMemo } from "react";
import { UserRound } from "lucide-react";

interface UserAvatarIconProps {
  name?: string;
  email?: string;
  size?: "sm" | "md" | "lg" | "xl";
  accentColor?: string;
  className?: string;
  showIconFallback?: boolean;
}

const colorThemes: Record<
  string,
  {
    bg: string;
    border: string;
    text: string;
    glow: string;
  }
> = {
  amber: {
    bg: "from-amber-500/20 via-zinc-900 to-amber-950/40",
    border: "border-amber-500/40 hover:border-amber-400/70",
    text: "text-amber-300",
    glow: "shadow-[0_0_15px_-3px_rgba(245,158,11,0.25)]",
  },
  emerald: {
    bg: "from-emerald-500/20 via-zinc-900 to-emerald-950/40",
    border: "border-emerald-500/40 hover:border-emerald-400/70",
    text: "text-emerald-300",
    glow: "shadow-[0_0_15px_-3px_rgba(16,185,129,0.25)]",
  },
  blue: {
    bg: "from-blue-500/20 via-zinc-900 to-blue-950/40",
    border: "border-blue-500/40 hover:border-blue-400/70",
    text: "text-blue-300",
    glow: "shadow-[0_0_15px_-3px_rgba(59,130,246,0.25)]",
  },
  purple: {
    bg: "from-purple-500/20 via-zinc-900 to-purple-950/40",
    border: "border-purple-500/40 hover:border-purple-400/70",
    text: "text-purple-300",
    glow: "shadow-[0_0_15px_-3px_rgba(168,85,247,0.25)]",
  },
  rose: {
    bg: "from-rose-500/20 via-zinc-900 to-rose-950/40",
    border: "border-rose-500/40 hover:border-rose-400/70",
    text: "text-rose-300",
    glow: "shadow-[0_0_15px_-3px_rgba(244,63,94,0.25)]",
  },
  zinc: {
    bg: "from-zinc-500/20 via-zinc-900 to-zinc-950/40",
    border: "border-zinc-500/40 hover:border-zinc-400/70",
    text: "text-zinc-200",
    glow: "shadow-[0_0_15px_-3px_rgba(161,161,170,0.2)]",
  },
};

const sizeClasses = {
  sm: {
    container: "size-7 rounded-lg text-xs",
    icon: "size-3.5",
  },
  md: {
    container: "size-8 rounded-xl text-xs",
    icon: "size-4",
  },
  lg: {
    container: "size-12 rounded-2xl text-base",
    icon: "size-6",
  },
  xl: {
    container: "size-16 rounded-3xl text-xl",
    icon: "size-8",
  },
};

export function UserAvatarIcon({
  name = "Developer",
  email,
  size = "md",
  accentColor = "amber",
  className = "",
  showIconFallback = false,
}: UserAvatarIconProps) {
  const initials = useMemo(() => {
    if (!name && email) {
      return email.charAt(0).toUpperCase();
    }
    const parts = (name || "Developer").trim().split(/\s+/);
    if (parts.length === 1) {
      return parts[0].slice(0, 2).toUpperCase();
    }
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }, [name, email]);

  const theme = colorThemes[accentColor] || colorThemes.amber;
  const currentSize = sizeClasses[size] || sizeClasses.md;

  return (
    <div
      aria-hidden="true"
      className={`relative grid shrink-0 place-items-center select-none font-semibold tracking-wider bg-gradient-to-br ${theme.bg} border ${theme.border} ${theme.text} ${theme.glow} transition-all duration-200 ${currentSize.container} ${className}`}
    >
      {showIconFallback ? (
        <UserRound className={currentSize.icon} />
      ) : (
        <span className="font-mono font-bold leading-none">{initials}</span>
      )}

      {/* Subtle top-left highlight sheen */}
      <span className="pointer-events-none absolute inset-x-0 top-0 h-1/2 rounded-t-[inherit] bg-gradient-to-b from-white/10 to-transparent" />
    </div>
  );
}
