import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { useApiQuery } from "@/hooks/use-api-query.ts";

type TrendPoint = {
    date: string;
    attendanceRate: number;
};

const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });

export function AnalyticsChart() {
    const { data, isLoading } = useApiQuery<{ data: TrendPoint[] }>("/dashboard/attendance-trend");
    const points = (data?.data ?? []).map((p) => ({ ...p, label: formatDate(p.date) }));

    return (
        <div className="rounded-xl border p-6">
            <h2 className="mb-4 text-xl font-semibold">Attendance Trend (last 14 days)</h2>

            {isLoading ? (
                <Skeleton className="h-[300px] w-full" />
            ) : points.length === 0 ? (
                <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
                    No attendance recorded yet — mark some to see the trend here.
                </div>
            ) : (
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={points}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="label" />
                        <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                        <Tooltip formatter={(value: number) => [`${value}%`, "Attendance rate"]} />
                        <Line
                            type="monotone"
                            dataKey="attendanceRate"
                            strokeWidth={3}
                            dot={false}
                        />
                    </LineChart>
                </ResponsiveContainer>
            )}
        </div>
    );
}
