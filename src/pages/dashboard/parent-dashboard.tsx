import { Link } from "react-router";
import { GraduationCap, ClipboardCheck, ChevronRight, Users } from "lucide-react";
import { motion } from "framer-motion";
import { useGetIdentity } from "@refinedev/core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Progress } from "@/components/ui/progress.tsx";
import { EmptyState } from "@/components/ui/empty-state.tsx";
import { ErrorState } from "@/components/ui/error-state.tsx";
import { UpcomingEvents } from "@/components/dashboard/upcoming-events";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { useApiQuery } from "@/hooks/use-api-query.ts";
import type { User } from "@/types";

type Child = {
    id: string; name: string; email: string; image: string | null;
    profile: { registrationNumber: string | null } | null;
    enrolledClasses: { id: number; name: string }[];
    grades: { classId: number; finalGrade: number | null; letterGrade: string | null; gpa: string | null }[];
    attendanceSummary: { total: number; present: number; rate: number | null };
};

const getInitials = (name = "") => name.trim().split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("");

const ParentDashboard = () => {
    const { data: identity } = useGetIdentity<User>();
    const { data, isLoading, isError, refetch } = useApiQuery<{ data: Child[] }>("/profile/my-children");
    const children = data?.data ?? [];

    return (
        <div className="space-y-6">
            <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
            >
                <h1 className="font-display text-3xl font-bold tracking-tight">
                    Welcome back{identity?.name ? `, ${identity.name.split(" ")[0]}` : ""}
                </h1>
                <p className="text-muted-foreground">
                    Academic progress for your children, at a glance.
                </p>
            </motion.div>

            {isLoading ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-52 w-full rounded-xl" />)}
                </div>
            ) : isError ? (
                <ErrorState description="Unable to load your children's profiles." onRetry={refetch} />
            ) : children.length === 0 ? (
                <EmptyState
                    icon={GraduationCap}
                    title="No children linked yet"
                    description="Ask your child to add your email as their parent email in their Profile settings."
                />
            ) : (
                <>
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold">Your Children</h2>
                        <Link to="/parent" className="text-sm text-muted-foreground hover:text-foreground">
                            View full details →
                        </Link>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {children.map((child) => {
                            const avgGPA = child.grades.length > 0
                                ? (child.grades.reduce((s, g) => s + Number(g.gpa ?? 0), 0) / child.grades.length).toFixed(2)
                                : null;

                            return (
                                <Card key={child.id}>
                                    <CardHeader className="pb-3">
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-11 w-11">
                                                {child.image && <AvatarImage src={child.image} />}
                                                <AvatarFallback>{getInitials(child.name)}</AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 min-w-0">
                                                <CardTitle className="truncate text-base">{child.name}</CardTitle>
                                                {child.profile?.registrationNumber && (
                                                    <Badge variant="outline" className="mt-1 text-[10px]">#{child.profile.registrationNumber}</Badge>
                                                )}
                                            </div>
                                            <Link to={`/students/${child.id}`} className="text-muted-foreground hover:text-primary">
                                                <ChevronRight className="h-5 w-5" />
                                            </Link>
                                        </div>
                                    </CardHeader>

                                    <CardContent className="space-y-3">
                                        <div className="grid grid-cols-3 gap-2 text-center">
                                            <div className="rounded-lg border p-2">
                                                <p className="text-lg font-bold">{child.enrolledClasses.length}</p>
                                                <p className="text-[10px] text-muted-foreground">Classes</p>
                                            </div>
                                            <div className="rounded-lg border p-2">
                                                <p className="text-lg font-bold">{avgGPA ?? "—"}</p>
                                                <p className="text-[10px] text-muted-foreground">GPA</p>
                                            </div>
                                            <div className="rounded-lg border p-2">
                                                <p className="text-lg font-bold">{child.attendanceSummary.rate !== null ? `${child.attendanceSummary.rate}%` : "—"}</p>
                                                <p className="text-[10px] text-muted-foreground">Attendance</p>
                                            </div>
                                        </div>

                                        <div className="space-y-1">
                                            <div className="flex items-center gap-1.5 text-xs font-medium">
                                                <ClipboardCheck className="h-3.5 w-3.5" /> Attendance
                                            </div>
                                            <Progress value={child.attendanceSummary.rate ?? 0} className="h-1.5" />
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                </>
            )}

            <div className="grid gap-4 lg:grid-cols-2">
                <UpcomingEvents />
                <RecentActivity types={["announcement"]} />
            </div>

            {children.length > 0 && (
                <Link
                    to="/parent"
                    className="flex items-center gap-3 rounded-lg border p-4 text-sm font-medium transition-all duration-200 hover:bg-muted hover:-translate-y-0.5 hover:shadow-sm"
                >
                    <Users className="h-5 w-5" />
                    View full academic progress for all children
                    <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground" />
                </Link>
            )}
        </div>
    );
};

export default ParentDashboard;
