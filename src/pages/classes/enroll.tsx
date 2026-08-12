import { useEffect, useRef, useState } from "react";
import { useParams, Link } from "react-router";
import { toast } from "sonner";
import { UserMinus, UserPlus, ArrowLeft, Upload, Loader2 } from "lucide-react";
import { Breadcrumb } from "@/components/layout/breadcrumb.tsx";
import { Card } from "@/components/ui/card.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog.tsx";
import { BACKEND_BASE_URL } from "@/constants";
import { parseSingleColumnCsv } from "@/lib/csv.ts";

type Student = { id: string; name: string; email: string; image: string | null };

const getInitials = (name = "") => name.trim().split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("");

const EnrollStudents = () => {
    const { id: classId } = useParams();
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [enrollEmail, setEnrollEmail] = useState("");
    const [enrolling, setEnrolling] = useState(false);
    const [bulkImporting, setBulkImporting] = useState(false);
    const [bulkProgress, setBulkProgress] = useState<{ done: number; total: number } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const load = () => {
        setLoading(true);
        fetch(`${BACKEND_BASE_URL}/classes/${classId}/students`, { credentials: "include" })
            .then(async (r) => r.ok ? r.json() : { data: [] })
            .then((j) => setStudents(j.data ?? []))
            .catch(() => toast.error("Failed to load students"))
            .finally(() => setLoading(false));
    };

    useEffect(() => { load(); }, [classId]);

    const handleEnroll = async () => {
        if (!enrollEmail.trim()) return toast.error("Enter an email address.");
        setEnrolling(true);
        try {
            const res = await fetch(`${BACKEND_BASE_URL}/classes/${classId}/enroll`, {
                method: "POST", credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: enrollEmail.trim() }),
            });
            if (!res.ok) throw new Error((await res.json())?.error ?? "Failed");
            toast.success("Student enrolled.");
            setEnrollEmail("");
            load();
        } catch (e) { toast.error(e instanceof Error ? e.message : "Failed to enroll"); }
        finally { setEnrolling(false); }
    };

    const handleBulkImport = async (file: File) => {
        const text = await file.text();
        const emails = Array.from(new Set(parseSingleColumnCsv(text, ["email", "emails", "student email"]).map((e) => e.toLowerCase())));

        if (emails.length === 0) {
            toast.error("No email addresses found in that file.");
            return;
        }

        setBulkImporting(true);
        setBulkProgress({ done: 0, total: emails.length });

        let succeeded = 0;
        const failed: string[] = [];

        for (const email of emails) {
            try {
                const res = await fetch(`${BACKEND_BASE_URL}/classes/${classId}/enroll`, {
                    method: "POST", credentials: "include",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email }),
                });
                if (res.ok) succeeded++;
                else failed.push(email);
            } catch {
                failed.push(email);
            }
            setBulkProgress((prev) => (prev ? { ...prev, done: prev.done + 1 } : prev));
        }

        setBulkImporting(false);
        setBulkProgress(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        load();

        if (failed.length === 0) {
            toast.success(`Enrolled ${succeeded} student${succeeded === 1 ? "" : "s"}.`);
        } else {
            toast.warning(
                `Enrolled ${succeeded} of ${emails.length}. Failed: ${failed.slice(0, 5).join(", ")}${failed.length > 5 ? ` and ${failed.length - 5} more` : ""}`,
                { duration: 8000 }
            );
        }
    };

    const handleRemove = async (studentId: string) => {
        const res = await fetch(`${BACKEND_BASE_URL}/classes/${classId}/enroll/${studentId}`, { method: "DELETE", credentials: "include" });
        if (res.ok) { setStudents((prev) => prev.filter((s) => s.id !== studentId)); toast.success("Student removed."); }
        else toast.error("Failed to remove student.");
    };

    return (
        <div className="enroll-students space-y-6">
            <Breadcrumb />

            <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">Manage Students</h1>
                    <p className="text-sm text-muted-foreground">Enroll or remove students from this class.</p>
                </div>
                <Button asChild variant="outline">
                    <Link to={`/classes/show/${classId}`}><ArrowLeft className="mr-1.5 h-4 w-4" />Back to Class</Link>
                </Button>
            </div>

            <Card className="p-4">
                <p className="text-sm font-medium mb-3">Enroll a student</p>
                <div className="flex gap-2">
                    <Input
                        placeholder="Student's email address"
                        value={enrollEmail}
                        onChange={(e) => setEnrollEmail(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleEnroll(); } }}
                    />
                    <Button onClick={handleEnroll} disabled={enrolling}>
                        <UserPlus className="mr-1.5 h-4 w-4" />{enrolling ? "Enrolling..." : "Enroll"}
                    </Button>
                </div>

                <div className="mt-4 border-t pt-4">
                    <p className="text-sm font-medium mb-1">Bulk import via CSV</p>
                    <p className="text-xs text-muted-foreground mb-3">
                        A file with one email per line (or a single "email" column, with or without a header row).
                    </p>
                    <div className="flex items-center gap-2">
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".csv,.txt,text/csv,text/plain"
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleBulkImport(file);
                            }}
                            disabled={bulkImporting}
                            className="hidden"
                            id="bulk-enroll-csv"
                        />
                        <Button variant="outline" disabled={bulkImporting} onClick={() => fileInputRef.current?.click()}>
                            {bulkImporting ? (
                                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                            ) : (
                                <Upload className="mr-1.5 h-4 w-4" />
                            )}
                            {bulkImporting ? "Importing..." : "Choose CSV file"}
                        </Button>
                        {bulkProgress && (
                            <span className="text-xs text-muted-foreground">
                                {bulkProgress.done} / {bulkProgress.total} processed
                            </span>
                        )}
                    </div>
                </div>
            </Card>

            <Card className="divide-y">
                <div className="flex items-center justify-between px-4 py-3 bg-muted/30">
                    <p className="text-sm font-medium">Enrolled Students ({students.length})</p>
                </div>

                {loading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="flex items-center gap-3 p-4">
                            <Skeleton className="h-9 w-9 rounded-full" />
                            <div className="flex-1 space-y-1.5"><Skeleton className="h-4 w-40" /><Skeleton className="h-3 w-28" /></div>
                        </div>
                    ))
                ) : students.length === 0 ? (
                    <p className="p-8 text-center text-sm text-muted-foreground">No students enrolled yet. Use the form above to add the first one.</p>
                ) : (
                    students.map((s) => (
                        <div key={s.id} className="flex items-center gap-3 p-4">
                            <Avatar className="h-9 w-9">
                                {s.image && <AvatarImage src={s.image} />}
                                <AvatarFallback>{getInitials(s.name)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                                <Link to={`/students/${s.id}`} className="text-sm font-medium hover:underline">{s.name}</Link>
                                <p className="text-xs text-muted-foreground">{s.email}</p>
                            </div>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="icon" aria-label={`Remove ${s.name} from class`} className="text-muted-foreground hover:text-destructive">
                                        <UserMinus className="h-4 w-4" aria-hidden="true" />
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Remove {s.name}?</AlertDialogTitle>
                                        <AlertDialogDescription>They will be unenrolled from this class. This cannot be undone.</AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleRemove(s.id)}>Remove</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    ))
                )}
            </Card>
        </div>
    );
};

export default EnrollStudents;
