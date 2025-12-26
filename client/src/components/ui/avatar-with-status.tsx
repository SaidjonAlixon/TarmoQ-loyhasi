import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface AvatarWithStatusProps {
  src: string | null;
  name: string;
  isOnline?: boolean;
  size?: "xs" | "sm" | "md" | "lg";
}

export function AvatarWithStatus({ src, name, isOnline = false, size = "md" }: AvatarWithStatusProps) {
  const sizeClasses = {
    xs: "h-6 w-6",
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-12 w-12"
  };

  const statusSizeClasses = {
    xs: "h-2 w-2 right-0 bottom-0 border-[1px]",
    sm: "h-3 w-3 right-0 bottom-0 border-[1.5px]",
    md: "h-3 w-3 right-0 bottom-0 border-2",
    lg: "h-3.5 w-3.5 right-0 bottom-0 border-2"
  };

  const getInitials = (name: string) => {
    if (!name) return "";
    return name
      .split(" ")
      .map(part => part.charAt(0))
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div className="relative flex-shrink-0">
      <Avatar className={`${sizeClasses[size]} bg-[#5288c1]`}>
        <AvatarImage 
          src={src || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=5288c1&color=fff&bold=true`} 
          alt={name} 
        />
        <AvatarFallback className="bg-[#5288c1] text-white font-medium">
          {getInitials(name)}
        </AvatarFallback>
      </Avatar>
      {isOnline && (
        <span 
          className={`absolute ${statusSizeClasses[size]} bg-[#4ade80] rounded-full border-[#17212b] avatar-status`}
          aria-label="Online"
        ></span>
      )}
    </div>
  );
}
