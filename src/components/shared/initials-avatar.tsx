import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

const GRADIENTS = [
  "from-[#3D5AFE] to-[#2FA8F0]",
  "from-[#10B7BE] to-[#3D5AFE]",
  "from-[#8B7BFF] to-[#10B7BE]",
  "from-[#2FA8F0] to-[#8B7BFF]",
  "from-[#F0A020] to-[#F0475F]",
  "from-[#16A672] to-[#2FA8F0]",
];

function hashString(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function InitialsAvatar({
  name,
  className,
  size = "size-9",
}: {
  name: string;
  className?: string;
  size?: string;
}) {
  const gradient = GRADIENTS[hashString(name) % GRADIENTS.length];
  return (
    <Avatar className={cn(size, className)}>
      <AvatarFallback className={cn("bg-gradient-to-br text-white", gradient)}>
        {initials(name)}
      </AvatarFallback>
    </Avatar>
  );
}

export function ProductThumb({
  name,
  className,
  size = "size-11",
}: {
  name: string;
  className?: string;
  size?: string;
}) {
  const gradient = GRADIENTS[hashString(name) % GRADIENTS.length];
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-xs font-semibold text-white",
        gradient,
        size,
        className,
      )}
    >
      {initials(name)}
    </div>
  );
}
