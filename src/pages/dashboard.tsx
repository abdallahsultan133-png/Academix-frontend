import {
    Users,
    UserRoundCheck,
    Building2,
    ClipboardCheck,
    UserPlus,
    School,
    BookOpen,
    Megaphone,
    BarChart3,
    Shield,
    Sparkles,
} from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router";
import { useGetIdentity } from "@refinedev/core";
import { AnalyticsChart } from "@/components/dashboard/analytics-chart";
import { GradeDistributionChart } from "@/components/dashboard/grade-distribution-chart";
import { UpcomingEvents } from "@/components/dashboard/upcoming-events";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { StatCard } from "@/components/dashboard/stat-card";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useApiQuery } from "@/hooks/use-api-query.ts";
import { UserRole, type User } from "@/types";

type DashboardStats = {
    students: number;
    teachers?: number;
    classes: number;
    subjects?: number;
    attendanceRate: number | null;
    pendingGrading: number;
};

const QUICK_ACTIONS = [
    { label: "Create Class", href: "/classes/create", icon: School },
    { label: "Add Subject", href: "/subjects/create", icon: BookOpen },
    { label: "Mark Attendance", href: "/attendance", icon: ClipboardCheck },
    { label: "Post Announcement", href: "/announcements/create", icon: Megaphone },
    { label: "Gradebook", href: "/grades", icon: BarChart3 },
];

const Dashboard = () => {
    const { data: identity } = useGetIdentity<User>();
    const isAdminLike = identity?.role === UserRole.ADMIN || identity?.role === UserRole.SUPER_ADMIN;
    const isTeacher = identity?.role === UserRole.TEACHER;
    const isStudent = identity?.role === UserRole.STUDENT;
    const isStaffLike = isAdminLike || isTeacher;

    const { data: stats, isLoading } = useApiQuery<DashboardStats>("/dashboard/stats");

    const hasAttendanceRate = stats?.attendanceRate !== null && stats?.attendanceRate !== undefined;

    const attendanceCard = {
        title: "Attendance (30d)",
        value: hasAttendanceRate ? `${stats!.attendanceRate}%` : "—",
        icon: ClipboardCheck,
        color: (hasAttendanceRate && (stats?.attendanceRate ?? 0) >= 75 ? "green" : "amber") as "green" | "amber",
        description: isTeacher ? "Average across your classes" : isStudent ? "Your attendance" : "Average across all classes",
        percent: hasAttendanceRate ? stats!.attendanceRate! : undefined,
    };

    const statCards = isTeacher
        ? [
            { title: "Students", value: stats?.students ?? 0, icon: Users, color: "blue" as const, description: "Enrolled in your classes" },
            { title: "Classes", value: stats?.classes ?? 0, icon: Building2, color: "purple" as const, description: "You teach" },
            { title: "Subjects", value: stats?.subjects ?? 0, icon: BookOpen, color: "green" as const, description: "Across your classes" },
            attendanceCard,
        ]
        : [
            { title: "Students", value: stats?.students ?? 0, icon: Users, color: "blue" as const, description: "Total enrolled" },
            { title: "Teachers", value: stats?.teachers ?? 0, icon: UserRoundCheck, color: "green" as const, description: "Active staff" },
            { title: "Classes", value: stats?.classes ?? 0, icon: Building2, color: "purple" as const, description: "Running classes" },
            attendanceCard,
        ];

    return (
        <div className="space-y-6">
            <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
            >
                <h1 className="font-display text-3xl font-bold tracking-tight">Dashboard</h1>
                <p className="text-muted-foreground">
                    Welcome back. Manage your classrooms and academic activities.
                </p>
            </motion.div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {isLoading ? (
                    Array.from({ length: 4 }).map((_, i) => (
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
                        />
                    ))
                )}
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
                <RecentActivity />

                <Card>
                    <CardContent className="space-y-4 p-6">
                        <h2 className="text-xl font-semibold">Quick Actions</h2>

                        <p className="text-muted-foreground">
                            Create classes, add students, and manage your classroom.
                        </p>

                        {!isLoading && stats && stats.pendingGrading > 0 && (
                            <Link
                                to="/assignments"
                                className="block rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm font-medium text-amber-800 transition hover:bg-amber-100"
                            >
                                {stats.pendingGrading} submission{stats.pendingGrading === 1 ? "" : "s"} waiting to be graded →
                            </Link>
                        )}

                        <div className="grid gap-3 sm:grid-cols-2">
                            {QUICK_ACTIONS.map((action) => (
                                <Link
                                    key={action.label}
                                    to={action.href}
                                    className="flex items-center gap-3 rounded-lg border p-3 text-left transition-all duration-200 hover:bg-muted hover:-translate-y-0.5 hover:shadow-sm"
                                >
                                    <action.icon className="h-5 w-5" />
                                    {action.label}
                                </Link>
                            ))}

                            {isStaffLike && (
                                <Link
                                    to="/ai-assistant"
                                    className="flex items-center gap-3 rounded-lg border p-3 text-left transition-all duration-200 hover:bg-muted hover:-translate-y-0.5 hover:shadow-sm"
                                >
                                    <Sparkles className="h-5 w-5" />
                                    AI Student Assistant
                                </Link>
                            )}
                            {isAdminLike && (
                                <Link
                                    to="/users"
                                    className="flex items-center gap-3 rounded-lg border p-3 text-left transition-all duration-200 hover:bg-muted hover:-translate-y-0.5 hover:shadow-sm"
                                >
                                    <UserPlus className="h-5 w-5" />
                                    Manage Users
                                </Link>
                            )}
                            {isAdminLike && (
                                <Link
                                    to="/admin/audit-logs"
                                    className="flex items-center gap-3 rounded-lg border p-3 text-left transition-all duration-200 hover:bg-muted hover:-translate-y-0.5 hover:shadow-sm"
                                >
                                    <Shield className="h-5 w-5" />
                                    Audit Logs
                                </Link>
                            )}
                            {isAdminLike && (
                                <Link
                                    to="/admin/departments"
                                    className="flex items-center gap-3 rounded-lg border p-3 text-left transition-all duration-200 hover:bg-muted hover:-translate-y-0.5 hover:shadow-sm"
                                >
                                    <Building2 className="h-5 w-5" />
                                    Departments
                                </Link>
                            )}
                            {identity?.role === UserRole.PARENT && (
                                <Link
                                    to="/parent"
                                    className="flex items-center gap-3 rounded-lg border p-3 text-left transition-all duration-200 hover:bg-muted hover:-translate-y-0.5 hover:shadow-sm"
                                >
                                    <Users className="h-5 w-5" />
                                    My Children
                                </Link>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <UpcomingEvents />
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
                <AnalyticsChart />
                <GradeDistributionChart />
            </div>
        </div>
    );
};

export default Dashboard;
