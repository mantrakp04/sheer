import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export function Spinner({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("animate-spin", className)} {...props}>
      <Loader2 className="h-full w-full" />
    </div>
  );
} 