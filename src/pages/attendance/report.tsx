import { useEffect, useState } from "react";
import { useList } from "@refinedev/core";
import { toast } from "sonner";
import { Download, Loader2, Printer } from "lucide-react";
import { PDFDownloadLink } from "@react-pdf/renderer";

import { Breadcrumb } from "@/components/layout/breadcrumb.tsx";
import { Card } from "@/components/ui/card.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Progress } from "@/components/ui/progress.tsx";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table.tsx";
import { AttendanceReportDocument } from "@/components/pdf/attendance-report-document.tsx";
import { BACKEND_BASE_URL } from "@/constants";
import type { ClassDetails } from "@/types";

type ReportRow = {
  studentId: string;
  name: string;
  email: string;
  totalMarked: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  excusedCount: number;
  attendanceRate: number | null;
};

const rateColor = (rate: number | null) => {
  if (rate === null) return "text-muted-foreground";
  if (rate >= 90) return "text-emerald-600";
  if (rate >= 75) return "text-amber-600";
  return "text-red-600";
};

const AttendanceReport = () => {
  const [classId, setClassId] = useState<string>("");
  const [rows, setRows] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(false);

  const { query: classesQuery } = useList<ClassDetails>({
    resource: "classes",
    pagination: { pageSize: 100 },
  });
  const classes = classesQuery?.data?.data ?? [];

  useEffect(() => {
    if (!classId && classes.length > 0) setClassId(String(classes[0].id));
  }, [classes, classId]);

  useEffect(() => {
    if (!classId) return;

    const controller = new AbortController();
    setLoading(true);

    fetch(`${BACKEND_BASE_URL}/attendance/class/${classId}/report`, {
      credentials: "include",
      signal: controller.signal,
    })
      .then(async (res) => {
        if (!res.ok) throw new Error((await res.json())?.message ?? "Failed to load report");
        return res.json();
      })
      .then((json: { data: ReportRow[] }) => setRows(json.data))
      .catch((e) => {
        if (e.name !== "AbortError") toast.error(e.message ?? "Failed to load attendance report");
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [classId]);

  const selectedClassName = classes.find((c) => String(c.id) === classId)?.name ?? "";

  return (
    <div className="attendance-report space-y-6">
      <div className="print:hidden"><Breadcrumb /></div>

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Attendance Report</h1>
          <p className="text-sm text-muted-foreground print:hidden">Per-student attendance rate for the selected class.</p>
          <p className="hidden text-sm text-muted-foreground print:block">
            {selectedClassName} · Generated {new Date().toLocaleDateString()}
          </p>
        </div>

        <div className="flex items-center gap-3 print:hidden">
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
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="mr-1.5 h-4 w-4" /> Print
          </Button>
          {!loading && rows.length > 0 && (
            <PDFDownloadLink
              document={<AttendanceReportDocument className={selectedClassName} rows={rows} />}
              fileName={`attendance-report-${selectedClassName.replace(/\s+/g, "-").toLowerCase() || classId}.pdf`}
            >
              {({ loading: pdfLoading }) => (
                <Button disabled={pdfLoading}>
                  {pdfLoading ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Download className="mr-1.5 h-4 w-4" />}
                  Download PDF
                </Button>
              )}
            </PDFDownloadLink>
          )}
        </div>
      </div>

      <Card>
        {loading ? (
          <div className="space-y-3 p-4">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
          </div>
        ) : rows.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted-foreground">
            No enrolled students to report on yet.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead className="text-center">Present</TableHead>
                <TableHead className="text-center">Absent</TableHead>
                <TableHead className="text-center">Late</TableHead>
                <TableHead className="text-center">Excused</TableHead>
                <TableHead className="w-[220px]">Attendance Rate</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.studentId}>
                  <TableCell>
                    <div className="font-medium">{row.name}</div>
                    <div className="text-xs text-muted-foreground">{row.email}</div>
                  </TableCell>
                  <TableCell className="text-center">{row.presentCount}</TableCell>
                  <TableCell className="text-center">{row.absentCount}</TableCell>
                  <TableCell className="text-center">{row.lateCount}</TableCell>
                  <TableCell className="text-center">{row.excusedCount}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress value={row.attendanceRate ?? 0} className="h-2" />
                      <span className={`w-12 text-right text-xs font-medium ${rateColor(row.attendanceRate)}`}>
                        {row.attendanceRate === null ? "—" : `${row.attendanceRate}%`}
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
};

export default AttendanceReport;
