import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { useApiQuery } from "@/hooks/use-api-query.ts";

type GradeBucket = { grade: string; count: number };

const GRADE_COLORS: Record<string, string> = {
    A: "#16a34a",
    B: "#2563eb",
    C: "#d97706",
    D: "#ea580c",
    F: "#dc2626",
};

export function GradeDistributionChart() {
    const { data, isLoading } = useApiQuery<{ data: GradeBucket[] }>("/dashboard/grade-distribution");
    const buckets = data?.data ?? [];

    const total = buckets.reduce((s, b) => s + b.count, 0);

    return (
        <div className="rounded-xl border p-6">
            <h2 className="mb-4 text-xl font-semibold">Student Performance</h2>

            {isLoading ? (
                <Skeleton className="h-[260px] w-full" />
            ) : total === 0 ? (
                <div className="flex h-[260px] items-center justify-center text-sm text-muted-foreground">
                    No final grades saved yet — grade distribution will appear here.
                </div>
            ) : (
                <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={buckets}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="grade" />
                        <YAxis allowDecimals={false} />
                        <Tooltip formatter={(value: number) => [value, "Students"]} />
                        <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                            {buckets.map((b) => (
                                <Cell key={b.grade} fill={GRADE_COLORS[b.grade] ?? "#64748b"} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            )}
        </div>
    );
}
