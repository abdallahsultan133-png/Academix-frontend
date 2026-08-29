import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { useGetIdentity, useList } from "@refinedev/core";
import { toast } from "sonner";
import { Plus } from "lucide-react";

import { Breadcrumb } from "@/components/layout/breadcrumb.tsx";
import { DeadlineCountdown } from "@/components/deadline-countdown.tsx";
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

const ALL = "all";

const AssignmentsList = () => {
  const { data: identity } = useGetIdentity<User>();
  const isTeacherOrAdmin = identity?.role === "teacher" || identity?.role === "admin" || identity?.role === "super_admin";

  const [classId, setClassId] = useState<string>(""); // "" = all classes
  const [assignmentsList, setAssignmentsList] = useState<AssignmentListItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Staff pick a class to manage; the school-wide class list is only meaningful
  // for them. A student's dropdown is derived from their own assignments below.
  const { query: classesQuery } = useList<ClassDetails>({
    resource: "classes",
    pagination: { pageSize: 100 },
    queryOptions: { enabled: !!isTeacherOrAdmin },
  });
  const staffClasses = useMemo(() => classesQuery?.data?.data ?? [], [classesQuery?.data?.data]);

  useEffect(() => {
    if (isTeacherOrAdmin && !classId && staffClasses.length > 0) {
      setClassId(String(staffClasses[0].id));
    }
  }, [staffClasses, classId, isTeacherOrAdmin]);

  // Staff fetch per selected class (server-side, paginated). A student fetches
  // once — the backend already scopes them to their enrolled classes — and the
  // class filter below is applied client-side over that full set.
  const fetchClassId = isTeacherOrAdmin ? classId : "";

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);

    const url = new URL(`${BACKEND_BASE_URL}/assignments`);
    if (fetchClassId) url.searchParams.set("classId", fetchClassId);

    fetch(url.toString(), { credentials: "include", signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) throw new Error((await res.json())?.message ?? "Failed to load assignments");
        return res.json();
      })
      .then((json: { data: AssignmentListItem[] }) => setAssignmentsList(json.data))
      .catch((e) => { if (e.name !== "AbortError") toast.error(e.message ?? "Failed to load assignments"); })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [fetchClassId]);

  const classOptions = useMemo(() => {
    if (isTeacherOrAdmin) return staffClasses.map((c) => ({ id: String(c.id), name: c.name }));
    const seen = new Map<string, string>();
    for (const a of assignmentsList) seen.set(String(a.class.id), a.class.name);
    return [...seen.entries()].map(([id, name]) => ({ id, name }));
  }, [isTeacherOrAdmin, staffClasses, assignmentsList]);

  const visibleAssignments = isTeacherOrAdmin || !classId
    ? assignmentsList
    : assignmentsList.filter((a) => String(a.class.id) === classId);

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
          {(isTeacherOrAdmin ? staffClasses.length > 0 : classOptions.length > 1) && (
            <Select
              value={classId || ALL}
              onValueChange={(v) => setClassId(v === ALL ? "" : v)}
            >
              <SelectTrigger className="w-[220px]">
                <SelectValue placeholder="All classes" />
              </SelectTrigger>
              <SelectContent>
                {!isTeacherOrAdmin && <SelectItem value={ALL}>All classes</SelectItem>}
                {classOptions.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

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
        ) : visibleAssignments.length === 0 ? (
          <Card className="col-span-full p-10 text-center text-sm text-muted-foreground">
            {isTeacherOrAdmin
              ? "No assignments yet — create the first one."
              : "You have no assignments in your classes yet."}
          </Card>
        ) : (
          visibleAssignments.map((a) => (
            <Link key={a.id} to={`/assignments/${a.id}`}>
              <Card className="h-full space-y-3 p-5 transition-shadow hover:shadow-md">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold leading-snug">{a.title}</h3>
                  <Badge variant="outline" className="shrink-0">{a.maxScore} pts</Badge>
                </div>
                <p className="line-clamp-2 text-sm text-muted-foreground">{a.description || "No description provided."}</p>
                <DeadlineCountdown dueAt={a.dueAt} variant="inline" />
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
