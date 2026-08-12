import { useEffect, useMemo, useState } from "react";
import { useList } from "@refinedev/core";
import { Link } from "react-router";
import { toast } from "sonner";
import { BarChart3, Check, Clock, FileText, Loader2, QrCode, X } from "lucide-react";

import { Breadcrumb } from "@/components/layout/breadcrumb.tsx";
import { Card } from "@/components/ui/card.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar.tsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { cn } from "@/lib/utils.ts";
import { BACKEND_BASE_URL } from "@/constants";
import type { ClassDetails } from "@/types";

type AttendanceStatus = "present" | "absent" | "late" | "excused";

type RosterRow = {
  studentId: string;
  name: string;
  email: string;
  image: string | null;
  attendanceId: number | null;
  status: AttendanceStatus | null;
  notes: string | null;
};

const STATUS_CONFIG: Record<AttendanceStatus, { label: string; icon: typeof Check; className: string }> = {
  present: { label: "Present", icon: Check, className: "data-[active=true]:bg-emerald-600 data-[active=true]:text-white data-[active=true]:border-emerald-600" },
  absent: { label: "Absent", icon: X, className: "data-[active=true]:bg-red-600 data-[active=true]:text-white data-[active=true]:border-red-600" },
  late: { label: "Late", icon: Clock, className: "data-[active=true]:bg-amber-500 data-[active=true]:text-white data-[active=true]:border-amber-500" },
  excused: { label: "Excused", icon: FileText, className: "data-[active=true]:bg-blue-600 data-[active=true]:text-white data-[active=true]:border-blue-600" },
};

const getInitials = (name = "") =>
  name.trim().split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("");

const todayISO = () => new Date().toISOString().slice(0, 10);

const MarkAttendance = () => {
  const [classId, setClassId] = useState<string>("");
  const [date, setDate] = useState<string>(todayISO());
  const [roster, setRoster] = useState<RosterRow[]>([]);
  const [pendingStatus, setPendingStatus] = useState<Record<string, AttendanceStatus>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const { query: classesQuery } = useList<ClassDetails>({
    resource: "classes",
    pagination: { pageSize: 100 },
  });
  const classes = classesQuery?.data?.data ?? [];

  useEffect(() => {
    if (!classId && classes.length > 0) setClassId(String(classes[0].id));
  }, [classes, classId]);

  useEffect(() => {
    if (!classId || !date) return;

    const controller = new AbortController();
    setLoading(true);

    fetch(`${BACKEND_BASE_URL}/attendance/class/${classId}?date=${date}`, {
      credentials: "include",
      signal: controller.signal,
    })
      .then(async (res) => {
        if (!res.ok) throw new Error((await res.json())?.message ?? "Failed to load roster");
        return res.json();
      })
      .then((json: { data: RosterRow[] }) => {
        setRoster(json.data);
        setPendingStatus({});
      })
      .catch((e) => {
        if (e.name !== "AbortError") toast.error(e.message ?? "Failed to load attendance roster");
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [classId, date]);

  const setStatus = (studentId: string, status: AttendanceStatus) => {
    setPendingStatus((prev) => ({ ...prev, [studentId]: status }));
  };

  const effectiveStatus = (row: RosterRow): AttendanceStatus | null =>
    pendingStatus[row.studentId] ?? row.status;

  const markAllPresent = () => {
    const next: Record<string, AttendanceStatus> = { ...pendingStatus };
    roster.forEach((r) => { next[r.studentId] = "present"; });
    setPendingStatus(next);
  };

  const summary = useMemo(() => {
    const counts: Record<AttendanceStatus, number> = { present: 0, absent: 0, late: 0, excused: 0 };
    roster.forEach((r) => {
      const s = effectiveStatus(r);
      if (s) counts[s] += 1;
    });
    return counts;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roster, pendingStatus]);

  const unmarkedCount = roster.length - (summary.present + summary.absent + summary.late + summary.excused);

  const handleSave = async () => {
    const records = roster
      .map((r) => ({ studentId: r.studentId, status: effectiveStatus(r) }))
      .filter((r): r is { studentId: string; status: AttendanceStatus } => Boolean(r.status));

    if (records.length === 0) {
      toast.error("Mark at least one student before saving.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/attendance`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ classId: Number(classId), date, records }),
      });

      if (!res.ok) throw new Error((await res.json())?.message ?? "Failed to save attendance");

      toast.success(`Attendance saved for ${records.length} student${records.length === 1 ? "" : "s"}.`);
      setPendingStatus({});
      // refresh roster to reflect saved state
      const refreshed = await fetch(`${BACKEND_BASE_URL}/attendance/class/${classId}?date=${date}`, { credentials: "include" });
      if (refreshed.ok) setRoster((await refreshed.json()).data);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save attendance");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="attendance-mark space-y-6">
      <Breadcrumb />

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Mark Attendance</h1>
          <p className="text-sm text-muted-foreground">Select a class and date, then mark each student.</p>
        </div>

        <div className="flex flex-wrap items-end gap-3">
        <Link to="/attendance/report" className="inline-flex h-9 items-center gap-1.5 self-end rounded-md border px-3 text-sm font-medium text-muted-foreground hover:bg-accent">
          <BarChart3 className="h-4 w-4" />
          View Report
        </Link>
        <Link to="/attendance/qr" className="inline-flex h-9 items-center gap-1.5 self-end rounded-md border px-3 text-sm font-medium text-muted-foreground hover:bg-accent">
          <QrCode className="h-4 w-4" />
          QR Attendance
        </Link>
          <Select value={classId} onValueChange={setClassId}>
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Select a class" />
            </SelectTrigger>
            <SelectContent>
              {classes.map((c) => (
                <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <input
            type="date"
            value={date}
            max={todayISO()}
            onChange={(e) => setDate(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm shadow-xs"
          />
        </div>
      </div>

      {!loading && roster.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {(Object.keys(STATUS_CONFIG) as AttendanceStatus[]).map((s) => (
            <div key={s} className="flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium text-muted-foreground">
              <span className={cn("h-2 w-2 rounded-full", {
                "bg-emerald-500": s === "present",
                "bg-red-500": s === "absent",
                "bg-amber-500": s === "late",
                "bg-blue-500": s === "excused",
              })} />
              {STATUS_CONFIG[s].label}: {summary[s]}
            </div>
          ))}
          {unmarkedCount > 0 && (
            <div className="rounded-full border border-dashed px-3 py-1 text-xs font-medium text-muted-foreground">
              Unmarked: {unmarkedCount}
            </div>
          )}
          <Button size="sm" variant="outline" className="ml-auto" onClick={markAllPresent}>
            Mark all present
          </Button>
        </div>
      )}

      <Card className="divide-y">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-28" />
              </div>
              <Skeleton className="h-8 w-64" />
            </div>
          ))
        ) : roster.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted-foreground">
            {classId ? "No students are enrolled in this class yet." : "Select a class to mark attendance."}
          </div>
        ) : (
          roster.map((row) => {
            const active = effectiveStatus(row);
            const isDirty = pendingStatus[row.studentId] !== undefined && pendingStatus[row.studentId] !== row.status;

            return (
              <div key={row.studentId} className="flex flex-wrap items-center gap-4 p-4">
                <Avatar className="h-10 w-10">
                  {row.image && <AvatarImage src={row.image} alt={row.name} />}
                  <AvatarFallback>{getInitials(row.name)}</AvatarFallback>
                </Avatar>

                <div className="min-w-[160px] flex-1">
                  <p className="text-sm font-medium leading-none">
                    {row.name}
                    {isDirty && <span className="ml-2 text-xs font-normal text-amber-600">unsaved</span>}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">{row.email}</p>
                </div>

                <div className="flex flex-wrap gap-2" role="group" aria-label={`Attendance status for ${row.name}`}>
                  {(Object.keys(STATUS_CONFIG) as AttendanceStatus[]).map((s) => {
                    const { label, icon: Icon, className } = STATUS_CONFIG[s];
                    return (
                      <button
                        key={s}
                        type="button"
                        data-active={active === s}
                        aria-pressed={active === s}
                        onClick={() => setStatus(row.studentId, s)}
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent",
                          className
                        )}
                      >
                        <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </Card>

      {roster.length > 0 && (
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving || loading}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Attendance
          </Button>
        </div>
      )}
    </div>
  );
};

export default MarkAttendance;
