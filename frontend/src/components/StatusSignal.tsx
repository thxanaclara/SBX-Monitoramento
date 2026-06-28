import { cn } from "@/lib/utils";
import { statusLabels, type ValidationStatus } from "@/lib/utils";

const config: Record<ValidationStatus, { dot: string; text: string; ring: string }> = {
  validado: { dot: "bg-signal-green", text: "text-signal-green", ring: "shadow-[0_0_0_3px_rgba(46,204,113,0.18)]" },
  em_validacao: { dot: "bg-signal-yellow", text: "text-signal-yellow", ring: "shadow-[0_0_0_3px_rgba(245,197,24,0.18)]" },
  nao_validado: { dot: "bg-signal-red", text: "text-signal-red", ring: "shadow-[0_0_0_3px_rgba(239,68,68,0.18)]" },
};

export function StatusSignal({ status, className }: { status: ValidationStatus; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span className="relative flex h-2.5 w-2.5">
        {status === "validado" && (
          <span className={cn("absolute inline-flex h-full w-full rounded-full opacity-60 animate-ping", config[status].dot)} />
        )}
        <span className={cn("relative inline-flex h-2.5 w-2.5 rounded-full", config[status].dot, config[status].ring)} />
      </span>
      <span className={cn("text-xs font-medium", config[status].text)}>{statusLabels[status]}</span>
    </span>
  );
}
