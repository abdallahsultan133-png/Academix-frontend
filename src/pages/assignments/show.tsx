import { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router";
import { useGetIdentity } from "@refinedev/core";
import { toast } from "sonner";
import { CalendarClock, CheckCircle2, File as FileIcon, Loader2, Sparkles } from "lucide-react";

import { Breadcrumb } from "@/components/layout/breadcrumb.tsx";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Separator } from "@/components/ui/separator.tsx";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import FileUploadWidget, { type FileUploadValue } from "@/components/file-upload-widget.tsx";
import { BACKEND_BASE_URL } from "@/constants";
import type { User } from "@/types";

type Submission = {
  id: number;
  assignmentId: number;
  studentId: string;
  content: string | null;
  fileUrl: string | null;
  fileName: string | null;
  status: "submitted" | "late" | "graded";
  score: number | null;
  feedback: string | null;
  submittedAt: string;
  aiScore: number | null;
  aiSummary: string | null;
  student?: { id: string; name: string; email: string; image: string | null };
};

const aiScoreBadge = (score: number, summary: string | null) => {
  const tone = score >= 70
    ? "bg-red-100 text-red-700"
    : score >= 30
      ? "bg-amber-100 text-amber-700"
      : "bg-emerald-100 text-emerald-700";
  return (
    <span title={summary ?? undefined} className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${tone}`}>
      <Sparkles className="h-3 w-3" /> {score}% likely AI-written
    </span>
  );
};

type AssignmentDetail = {
  id: number;
  title: string;
  description: string | null;
  dueAt: string | null;
  maxScore: number;
  attachmentUrl: string | null;
  attachmentName: string | null;
  class: { id: number; name: string };
  creator: { id: string; name: string };
  mySubmission: Submission | null;
};

const getInitials = (name = "") => name.trim().split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("");

const statusBadge = (status: Submission["status"]) => {
  const map = {
    submitted: { label: "Submitted", className: "bg-blue-100 text-blue-700" },
    late: { label: "Submitted late", className: "bg-amber-100 text-amber-700" },
    graded: { label: "Graded", className: "bg-emerald-100 text-emerald-700" },
  } as const;
  const { label, className } = map[status];
  return <Badge className={className}>{label}</Badge>;
};

const AssignmentShow = () => {
  const { id } = useParams();
  const { data: identity } = useGetIdentity<User>();
  const isTeacherOrAdmin = identity?.role === "teacher" || identity?.role === "admin" || identity?.role === "super_admin";

  const [assignment, setAssignment] = useState<AssignmentDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const [content, setContent] = useState("");
  const [file, setFile] = useState<FileUploadValue | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [submissions, setSubmissions] = useState<Submission[] | null>(null);
  const [gradeDrafts, setGradeDrafts] = useState<Record<number, { score: string; feedback: string }>>({});
  const [savingGradeFor, setSavingGradeFor] = useState<number | null>(null);

  const loadAssignment = useCallback(() => {
    setLoading(true);
    return fetch(`${BACKEND_BASE_URL}/assignments/${id}`, { credentials: "include" })
      .then(async (res) => {
        if (!res.ok) throw new Error((await res.json())?.message ?? "Failed to load assignment");
        return res.json();
      })
      .then((json: { data: AssignmentDetail }) => {
        setAssignment(json.data);
        if (json.data.mySubmission) {
          setContent(json.data.mySubmission.content ?? "");
          if (json.data.mySubmission.fileUrl) {
            setFile({ url: json.data.mySubmission.fileUrl, publicId: "", fileName: json.data.mySubmission.fileName ?? "Attachment" });
          }
        }
      })
      .catch((e) => toast.error(e.message ?? "Failed to load assignment"))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => { loadAssignment(); }, [loadAssignment]);

  useEffect(() => {
    if (!isTeacherOrAdmin || !id) return;
    fetch(`${BACKEND_BASE_URL}/assignments/${id}/submissions`, { credentials: "include" })
      .then(async (res) => {
        if (!res.ok) throw new Error((await res.json())?.message ?? "Failed to load submissions");
        return res.json();
      })
      .then((json: { data: Submission[] }) => {
        setSubmissions(json.data);
        const drafts: Record<number, { score: string; feedback: string }> = {};
        json.data.forEach((s) => {
          drafts[s.id] = { score: s.score?.toString() ?? "", feedback: s.feedback ?? "" };
        });
        setGradeDrafts(drafts);
      })
      .catch((e) => toast.error(e.message ?? "Failed to load submissions"));
  }, [isTeacherOrAdmin, id]);

  const handleSubmit = async () => {
    if (!content.trim() && !file) return toast.error("Add some text or attach a file before submitting.");

    setSubmitting(true);
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/assignments/${id}/submit`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: content.trim() || undefined,
          fileUrl: file?.url,
          fileCldPubId: file?.publicId,
          fileName: file?.fileName,
        }),
      });
      if (!res.ok) throw new Error((await res.json())?.message ?? "Failed to submit");

      toast.success("Submitted!");
      loadAssignment();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to submit");
    } finally {
      setSubmitting(false);
    }
  };

  const handleGrade = async (submissionId: number) => {
    const draft = gradeDrafts[submissionId];
    if (!draft?.score.trim()) return toast.error("Enter a score first.");

    setSavingGradeFor(submissionId);
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/assignments/submissions/${submissionId}/grade`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ score: Number(draft.score), feedback: draft.feedback || undefined }),
      });
      if (!res.ok) throw new Error((await res.json())?.message ?? "Failed to save grade");

      const { data } = await res.json();
      setSubmissions((prev) => prev?.map((s) => (s.id === submissionId ? { ...s, ...data } : s)) ?? prev);
      toast.success("Grade saved.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save grade");
    } finally {
      setSavingGradeFor(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Breadcrumb />
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="space-y-6">
        <Breadcrumb />
        <p className="text-sm text-muted-foreground">Assignment not found.</p>
      </div>
    );
  }

  const deadlinePassed = !!assignment.dueAt && new Date() > new Date(assignment.dueAt);

  return (
    <div className="assignment-show space-y-6">
      <Breadcrumb />

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle className="text-2xl">{assignment.title}</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">{assignment.class.name} · by {assignment.creator.name}</p>
            </div>
            <Badge variant="outline">{assignment.maxScore} pts</Badge>
          </div>
        </CardHeader>
        <Separator />
        <CardContent className="mt-4 space-y-4">
          {assignment.description && <p className="whitespace-pre-wrap text-sm">{assignment.description}</p>}

          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <CalendarClock className="h-4 w-4" />
            {assignment.dueAt ? `Due ${new Date(assignment.dueAt).toLocaleString()}` : "No due date set"}
          </div>

          {assignment.attachmentUrl && (
            <a
              href={assignment.attachmentUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium hover:bg-accent"
            >
              <FileIcon className="h-4 w-4" />
              {assignment.attachmentName ?? "Download attachment"}
            </a>
          )}
        </CardContent>
      </Card>

      {!isTeacherOrAdmin && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Your submission</CardTitle>
              {assignment.mySubmission && statusBadge(assignment.mySubmission.status)}
            </div>
          </CardHeader>
          <Separator />
          <CardContent className="mt-4 space-y-4">
            {assignment.mySubmission?.status === "graded" && (
              <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm">
                <div className="flex items-center gap-1.5 font-medium text-emerald-700">
                  <CheckCircle2 className="h-4 w-4" />
                  Score: {assignment.mySubmission.score} / {assignment.maxScore}
                </div>
                {assignment.mySubmission.feedback && (
                  <p className="mt-1 text-emerald-700">{assignment.mySubmission.feedback}</p>
                )}
              </div>
            )}

            {deadlinePassed ? (
              <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                The deadline for this assignment has passed. You can no longer submit.
              </p>
            ) : (
              <>
                <Textarea
                  placeholder="Write your answer here..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={6}
                />

                <FileUploadWidget value={file} onChange={setFile} />

                <Button onClick={handleSubmit} disabled={submitting}>
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {assignment.mySubmission ? "Resubmit" : "Submit"}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {isTeacherOrAdmin && (
        <Card>
          <CardHeader>
            <CardTitle>Submissions {submissions ? `(${submissions.length})` : ""}</CardTitle>
          </CardHeader>
          <Separator />
          <CardContent className="mt-4 divide-y p-0">
            {!submissions ? (
              <div className="space-y-3 p-4">
                {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
              </div>
            ) : submissions.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground">No submissions yet.</p>
            ) : (
              submissions.map((s) => (
                <div key={s.id} className="flex flex-wrap items-center gap-4 py-4">
                  <Avatar className="h-9 w-9">
                    {s.student?.image && <AvatarImage src={s.student.image} />}
                    <AvatarFallback>{getInitials(s.student?.name)}</AvatarFallback>
                  </Avatar>

                  <div className="min-w-[160px] flex-1">
                    <p className="text-sm font-medium">{s.student?.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Submitted {new Date(s.submittedAt).toLocaleString()}
                    </p>
                    {s.fileUrl && (
                      <a href={s.fileUrl} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
                        <FileIcon className="h-3 w-3" /> {s.fileName ?? "Attachment"}
                      </a>
                    )}
                    {s.content && <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{s.content}</p>}
                    {s.aiScore !== null && <div className="mt-1.5">{aiScoreBadge(s.aiScore, s.aiSummary)}</div>}
                  </div>

                  {statusBadge(s.status)}

                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      className="w-20"
                      placeholder="Score"
                      value={gradeDrafts[s.id]?.score ?? ""}
                      onChange={(e) => setGradeDrafts((prev) => ({ ...prev, [s.id]: { ...prev[s.id], score: e.target.value, feedback: prev[s.id]?.feedback ?? "" } }))}
                    />
                    <Input
                      className="w-40"
                      placeholder="Feedback (optional)"
                      value={gradeDrafts[s.id]?.feedback ?? ""}
                      onChange={(e) => setGradeDrafts((prev) => ({ ...prev, [s.id]: { ...prev[s.id], feedback: e.target.value, score: prev[s.id]?.score ?? "" } }))}
                    />
                    <Button size="sm" onClick={() => handleGrade(s.id)} disabled={savingGradeFor === s.id}>
                      {savingGradeFor === s.id ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AssignmentShow;
