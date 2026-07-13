import type { BookingStatus } from "../types";

const config: Record<BookingStatus, { label: string; cls: string }> = {
  pending:        { label: "Pending",        cls: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
  accepted:       { label: "Driver Coming",  cls: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  driver_arrived: { label: "Driver Arrived", cls: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30" },
  in_progress:    { label: "In Progress",    cls: "bg-violet-500/20 text-violet-400 border-violet-500/30" },
  completed:      { label: "Completed",      cls: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
  cancelled:      { label: "Cancelled",      cls: "bg-red-500/20 text-red-400 border-red-500/30" },
};

export default function StatusBadge({ status }: { status: BookingStatus }) {
  const { label, cls } = config[status];
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${cls}`}>
      {status !== "completed" && status !== "cancelled" && (
        <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 animate-pulse" />
      )}
      {label}
    </span>
  );
}
