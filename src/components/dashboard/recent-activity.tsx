import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Megaphone, FileText, CheckCircle2 } from "lucide-react";
import { useApiQuery } from "@/hooks/use-api-query.ts";

type ActivityItem = {
  type: "announcement" | "assignment" | "submission";
  id: number;
  title: string;
  description: string;
  time: string;
};

const ICONS = {
  announcement: Megaphone,
  assignment: FileText,
  submission: CheckCircle2,
} as const;

const timeAgo = (iso: string) => {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
};

export function RecentActivity() {
  const { data, isLoading } = useApiQuery<{ data: ActivityItem[] }>("/dashboard/recent-activity");
  const activities = data?.data ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-start gap-3">
              <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3.5 w-40" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          ))
        ) : activities.length === 0 ? (
          <p className="text-sm text-muted-foreground">No recent activity yet.</p>
        ) : (
          activities.map((activity, index) => {
            const Icon = ICONS[activity.type];
            return (
              <motion.div
                key={`${activity.type}-${activity.id}`}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05, ease: "easeOut" }}
                className="flex items-start gap-3"
              >
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex flex-col">
                  <p className="text-sm font-medium leading-snug">{activity.title}</p>
                  <p className="text-sm text-muted-foreground">{activity.description}</p>
                  <span className="text-xs text-muted-foreground">{timeAgo(activity.time)}</span>
                </div>
              </motion.div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
