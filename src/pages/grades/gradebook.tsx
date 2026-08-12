import { useEffect, useState } from "react";
import { useGetIdentity, useList } from "@refinedev/core";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router";
import { toast } from "sonner";
import { BookOpenCheck, Download, Loader2, Printer, Save } from "lucide-react";
import { PDFDownloadLink } from "@react-pdf/renderer";

import { Breadcrumb } from "@/components/layout/breadcrumb.tsx";
import { Card } from "@/components/ui/card.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table.tsx";
import { GradebookDocument } from "@/components/pdf/gradebook-document.tsx";
import { BACKEND_BASE_URL } from "@/constants";
import { useApiQuery } from "@/hooks/use-api-query.ts";
import { UserRole, type User, type ClassDetails } from "@/types";

type GradebookRow = {
  studentId: string;
  name: string;
  email: string;
  assignmentAvg: number | null;
  examAvg: number | null;
  finalGrade: number | null;
  letterGrade: string | null;
  gpa: string | null;
  remarks: string | null;
  isOverridden: boolean;
};

const gradeColor = (grade: number | null) => {
  if (grade === null) return "";
  if (grade >= 90) return "text-emerald-600";
  if (grade >= 75) return "text-blue-600";
  if (grade >= 60) return "text-amber-600";
  return "text-red-600";
};

const Gradebook = () => {
  const { data: identity } = useGetIdentity<User>();
  const isTeacherOrAdmin = identity?.role === UserRole.TEACHER || identity?.role === UserRole.ADMIN || identity?.role === UserRole.SUPER_ADMIN;

  const queryClient = useQueryClient();
  const [classId, setClassId] = useState("");
  const [overrides, setOverrides] = useState<Record<string, { finalGrade: string; remarks: string }>>({});
  const [saving, setSaving] = useState(false);

  const { query: classesQuery } = useList<ClassDetails>({ resource: "classes", pagination: { pageSize: 100 } });
  const classes = classesQuery?.data?.data ?? [];

  useEffect(() => {
    if (!classId && classes.length > 0) setClassId(String(classes[0].id));
  }, [classes, classId]);

  const gradebookPath = classId ? `/grades/gradebook/${classId}` : null;
  const { data: gradebookData, isLoading: loading } = useApiQuery<{ data: GradebookRow[] }>(gradebookPath);
  const rows = gradebookData?.data ?? [];
  const selectedClassName = classes.find((c) => String(c.id) === classId)?.name ?? "";

  // Resets the editable override inputs whenever a fresh gradebook loads (class switch or after save).
  useEffect(() => {
    const init: typeof overrides = {};
    rows.forEach((r) => {
      init[r.studentId] = { finalGrade: r.finalGrade?.toString() ?? "", remarks: r.remarks ?? "" };
    });
    setOverrides(init);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gradebookData]);

  const handleSave = async () => {
    const records = rows
      .map((r) => ({
        studentId: r.studentId,
        finalGrade: Number(overrides[r.studentId]?.finalGrade ?? r.finalGrade ?? 0),
        remarks: overrides[r.studentId]?.remarks || undefined,
      }))
      .filter((r) => !isNaN(r.finalGrade));

    if (records.length === 0) return toast.error("Nothing to save.");
    setSaving(true);
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/grades/gradebook/${classId}/save`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ records }),
      });
      if (!res.ok) throw new Error((await res.json())?.error ?? "Failed to save grades");
      toast.success("Grades saved.");
      await queryClient.invalidateQueries({ queryKey: [gradebookPath] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save grades");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="gradebook space-y-6">
      <div className="print:hidden"><Breadcrumb /></div>

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Gradebook</h1>
          <p className="text-sm text-muted-foreground print:hidden">Assignment and exam averages, final grades and GPA per student.</p>
          <p className="hidden text-sm text-muted-foreground print:block">
            {selectedClassName} · Generated {new Date().toLocaleDateString()}
          </p>
        </div>

        <div className="flex items-center gap-3 print:hidden">
          <Link to="/grades/exams" className="inline-flex items-center gap-1.5 rounded-md border px-3 py-2 text-sm font-medium hover:bg-accent">
            <BookOpenCheck className="h-4 w-4" /> Manage Exams
          </Link>
          <Select value={classId} onValueChange={setClassId}>
            <SelectTrigger className="w-[220px]"><SelectValue placeholder="Select class" /></SelectTrigger>
            <SelectContent>
              {classes.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="mr-1.5 h-4 w-4" /> Print
          </Button>
          {!loading && rows.length > 0 && (
            <PDFDownloadLink
              document={<GradebookDocument className={selectedClassName} rows={rows} />}
              fileName={`gradebook-${selectedClassName.replace(/\s+/g, "-").toLowerCase() || classId}.pdf`}
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
          <div className="space-y-3 p-4">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
        ) : rows.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted-foreground">No students enrolled in this class yet.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead className="text-center">Assignment Avg</TableHead>
                <TableHead className="text-center">Exam Avg</TableHead>
                <TableHead className="w-24">Final Grade</TableHead>
                <TableHead className="text-center">Letter</TableHead>
                <TableHead className="text-center">GPA</TableHead>
                <TableHead>Remarks</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => {
                const ov = overrides[row.studentId] ?? { finalGrade: "", remarks: "" };
                const displayGrade = ov.finalGrade !== "" ? Number(ov.finalGrade) : row.finalGrade;
                const letter = displayGrade !== null && !isNaN(Number(displayGrade))
                  ? (Number(displayGrade) >= 90 ? "A" : Number(displayGrade) >= 80 ? "B" : Number(displayGrade) >= 70 ? "C" : Number(displayGrade) >= 60 ? "D" : "F")
                  : null;

                return (
                  <TableRow key={row.studentId}>
                    <TableCell>
                      <div className="font-medium">{row.name}</div>
                      <div className="text-xs text-muted-foreground">{row.email}</div>
                    </TableCell>
                    <TableCell className={`text-center font-medium ${gradeColor(row.assignmentAvg)}`}>
                      {row.assignmentAvg !== null ? `${row.assignmentAvg}%` : "—"}
                    </TableCell>
                    <TableCell className={`text-center font-medium ${gradeColor(row.examAvg)}`}>
                      {row.examAvg !== null ? `${row.examAvg}%` : "—"}
                    </TableCell>
                    <TableCell>
                      {isTeacherOrAdmin ? (
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          className="w-20"
                          value={ov.finalGrade}
                          placeholder={row.finalGrade?.toString() ?? "—"}
                          onChange={(e) => setOverrides((prev) => ({ ...prev, [row.studentId]: { ...prev[row.studentId], finalGrade: e.target.value } }))}
                        />
                      ) : (
                        <span className={`font-medium ${gradeColor(row.finalGrade)}`}>{row.finalGrade ?? "—"}</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {letter ? <Badge variant="outline">{letter}</Badge> : "—"}
                    </TableCell>
                    <TableCell className="text-center text-sm font-medium">
                      {letter ? (letter === "A" ? "4.0" : letter === "B" ? "3.0" : letter === "C" ? "2.0" : letter === "D" ? "1.0" : "0.0") : "—"}
                    </TableCell>
                    <TableCell>
                      {isTeacherOrAdmin ? (
                        <Input
                          className="w-40"
                          placeholder="Optional remarks"
                          value={ov.remarks}
                          onChange={(e) => setOverrides((prev) => ({ ...prev, [row.studentId]: { ...prev[row.studentId], remarks: e.target.value } }))}
                        />
                      ) : (
                        <span className="text-sm text-muted-foreground">{row.remarks ?? "—"}</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Card>

      {isTeacherOrAdmin && rows.length > 0 && (
        <div className="flex justify-end print:hidden">
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Save className="mr-1.5 h-4 w-4" />
            Save Grades
          </Button>
        </div>
      )}
    </div>
  );
};

export default Gradebook;
