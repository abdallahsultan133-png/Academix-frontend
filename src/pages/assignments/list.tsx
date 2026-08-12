import { useEffect, useState } from "react";
import { Link } from "react-router";
import { useGetIdentity, useList } from "@refinedev/core";
import { toast } from "sonner";
import { CalendarClock, Plus } from "lucide-react";

import { Breadcrumb } from "@/components/layout/breadcrumb.tsx";
import { Card } from "@/components/ui/card.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { BACKEND_BASE_URL } from "@/constants";
import type { ClassDetails, User } from "@/types";

type AssignmentListItem = {
  id: number;
  title: string;
  description: string | null;
  dueAt: string | null;
  maxScore: number;
  class: { id: number; name: string };
  creator: { id: string; name: string };
};

const formatDue = (dueAt: string | null) => {
  if (!dueAt) return "No due date";
  const d = new Date(dueAt);
  const isPast = d.getTime() < Date.now();
  return `${isPast ? "Was due" : "Due"} ${d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}`;
};

const AssignmentsList = () => {
  const { data: identity } = useGetIdentity<User>();
  const isTeacherOrAdmin = identity?.role === "teacher" || identity?.role === "admin" || identity?.role === "super_admin";

  const [classId, setClassId] = useState<string>("");
  const [assignmentsList, setAssignmentsList] = useState<AssignmentListItem[]>([]);
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
    const controller = new AbortController();
    setLoading(true);

    const url = new URL(`${BACKEND_BASE_URL}/assignments`);
    if (classId) url.searchParams.set("classId", classId);

    fetch(url.toString(), { credentials: "include", signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) throw new Error((await res.json())?.message ?? "Failed to load assignments");
        return res.json();
      })
      .then((json: { data: AssignmentListItem[] }) => setAssignmentsList(json.data))
      .catch((e) => { if (e.name !== "AbortError") toast.error(e.message ?? "Failed to load assignments"); })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [classId]);

  return (
    <div className="assignments-list space-y-6">
      <Breadcrumb />

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Assignments</h1>
          <p className="text-sm text-muted-foreground">
            {isTeacherOrAdmin ? "Create and manage assignments for your classes." : "View and submit your assignments."}
          </p>
        </div>

        <div className="flex items-end gap-3">
          <Select value={classId} onValueChange={setClassId}>
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="All classes" />
            </SelectTrigger>
            <SelectContent>
              {classes.map((c) => (
                <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {isTeacherOrAdmin && (
            <Button asChild>
              <Link to="/assignments/create">
                <Plus className="mr-1.5 h-4 w-4" />
                New Assignment
              </Link>
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-40 w-full rounded-xl" />)
        ) : assignmentsList.length === 0 ? (
          <Card className="col-span-full p-10 text-center text-sm text-muted-foreground">
            No assignments yet{isTeacherOrAdmin ? " — create the first one." : "."}
          </Card>
        ) : (
          assignmentsList.map((a) => (
            <Link key={a.id} to={`/assignments/${a.id}`}>
              <Card className="h-full space-y-3 p-5 transition-shadow hover:shadow-md">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold leading-snug">{a.title}</h3>
                  <Badge variant="outline" className="shrink-0">{a.maxScore} pts</Badge>
                </div>
                <p className="line-clamp-2 text-sm text-muted-foreground">{a.description || "No description provided."}</p>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <CalendarClock className="h-3.5 w-3.5" />
                  {formatDue(a.dueAt)}
                </div>
                <div className="text-xs text-muted-foreground">{a.class.name}</div>
              </Card>
            </Link>
          ))
        )}
      </div>
    </div>
  );
};

export default AssignmentsList;
