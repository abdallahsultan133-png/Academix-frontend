import {
    Users,
    Building2,
    BookOpen,
    ClipboardCheck,
    CheckCircle2,
    FileText,
    Megaphone,
    BarChart3,
    Sparkles,
} from "lucide-react";
import { motion } from "framer-motion";
import { useGetIdentity } from "@refinedev/core";
import { AttendanceOverviewChart } from "@/components/dashboard/attendance-overview-chart";
import { PerformanceChart } from "@/components/dashboard/performance-chart";
import { UpcomingEvents } from "@/components/dashboard/upcoming-events";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { StatCard } from "@/components/dashboard/stat-card";
import { QuickActions, type QuickAction } from "@/components/dashboard/quick-actions";
import { Skeleton } from "@/components/ui/skeleton";
import { useApiQuery } from "@/hooks/use-api-query.ts";
import type { User } from "@/types";

type TeacherStats = {
    students: number;
    classes: number;
    subjects: number;
    attendanceRate: number | null;
    pendingGrading: number;
    assignmentCompletionRate: number | null;
    trends: {
        classes?: number | null;
        subjects?: number | null;
        attendanceRate?: number | null;
    };
};

const QUICK_ACTIONS: QuickAction[] = [
    { label: "Mark Attendance", href: "/attendance", icon: ClipboardCheck },
    { label: "Create Assignment", href: "/assignments/create", icon: FileText },
    { label: "Gradebook", href: "/grades", icon: BarChart3 },
    { label: "Post Announcement", href: "/announcements/create", icon: Megaphone },
    { label: "AI Student Assistant", href: "/ai-assistant", icon: Sparkles },
];

const TeacherDashboard = () => {
    const { data: identity } = useGetIdentity<User>();
    const { data: stats, isLoading } = useApiQuery<TeacherStats>("/dashboard/stats");

    const hasAttendanceRate = stats?.attendanceRate !== null && stats?.attendanceRate !== undefined;
    const hasCompletionRate = stats?.assignmentCompletionRate !== null && stats?.assignmentCompletionRate !== undefined;

    const statCards = [
        { title: "My Students", value: stats?.students ?? 0, icon: Users, color: "blue" as const, description: "Enrolled in your classes" },
        { title: "My Classes", value: stats?.classes ?? 0, icon: Building2, color: "purple" as const, description: "You teach", trendValue: stats?.trends.classes },
        { title: "My Subjects", value: stats?.subjects ?? 0, icon: BookOpen, color: "green" as const, description: "Across your classes", trendValue: stats?.trends.subjects },
        {
            title: "Assignment Completion",
            value: hasCompletionRate ? `${stats!.assignmentCompletionRate}%` : "—",
            icon: CheckCircle2,
            color: "amber" as const,
            description: "Submitted vs. expected",
            percent: hasCompletionRate ? stats!.assignmentCompletionRate! : undefined,
        },
        {
            title: "Attendance (30d)",
            value: hasAttendanceRate ? `${stats!.attendanceRate}%` : "—",
            icon: ClipboardCheck,
            color: (hasAttendanceRate && (stats?.attendanceRate ?? 0) >= 75 ? "green" : "amber") as "green" | "amber",
            description: "Average across your classes",
            percent: hasAttendanceRate ? stats!.attendanceRate! : undefined,
            trendValue: stats?.trends.attendanceRate,
        },
    ];

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
                    Here's how your classes are doing.
                </p>
            </motion.div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                {isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                        <Skeleton key={i} className="h-[92px] w-full rounded-xl" />
                    ))
                ) : (
                    statCards.map((item, index) => (
                        <StatCard
                            key={item.title}
                            title={item.title}
                            value={String(item.value)}
                            icon={item.icon}
                            color={item.color}
                            description={item.description}
                            index={index}
                            percent={"percent" in item ? item.percent : undefined}
                            trendValue={item.trendValue}
                        />
                    ))
                )}
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
                <AttendanceOverviewChart />
                <PerformanceChart showClassRanking />
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
                <RecentActivity />
                <UpcomingEvents />
            </div>

            <QuickActions
                actions={QUICK_ACTIONS}
                description="Mark attendance, create assignments, and keep your classes moving."
                highlight={
                    !isLoading && stats && stats.pendingGrading > 0
                        ? { message: `${stats.pendingGrading} submission${stats.pendingGrading === 1 ? "" : "s"} waiting to be graded`, href: "/assignments" }
                        : undefined
                }
            />
        </div>
    );
};

export default TeacherDashboard;
