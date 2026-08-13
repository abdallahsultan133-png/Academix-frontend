import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
    title: string;
    value: string;
    icon: LucideIcon;
    description?: string;
    trend?: "up" | "down" | "neutral";
    color?: "blue" | "green" | "amber" | "red" | "purple";
    index?: number;
    /** When set (0-100), renders a progress bar under the value — for percentage-based stats. */
    percent?: number;
}

const COLOR_MAP = {
    blue:   { bg: "bg-blue-50 dark:bg-blue-950/30",   icon: "text-blue-600 dark:text-blue-400",   ring: "bg-blue-100 dark:bg-blue-900/50" },
    green:  { bg: "bg-emerald-50 dark:bg-emerald-950/30", icon: "text-emerald-600 dark:text-emerald-400", ring: "bg-emerald-100 dark:bg-emerald-900/50" },
    amber:  { bg: "bg-amber-50 dark:bg-amber-950/30", icon: "text-amber-600 dark:text-amber-400",  ring: "bg-amber-100 dark:bg-amber-900/50" },
    red:    { bg: "bg-red-50 dark:bg-red-950/30",     icon: "text-red-600 dark:text-red-400",      ring: "bg-red-100 dark:bg-red-900/50" },
    purple: { bg: "bg-purple-50 dark:bg-purple-950/30", icon: "text-purple-600 dark:text-purple-400", ring: "bg-purple-100 dark:bg-purple-900/50" },
};

export function StatCard({ title, value, icon: Icon, description, color = "blue", index = 0, percent }: StatCardProps) {
    const colors = COLOR_MAP[color];

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: index * 0.06, ease: "easeOut" }}
            whileHover={{ y: -2 }}
        >
            <Card className={cn("relative overflow-hidden border-0 shadow-sm transition-shadow hover:shadow-md", colors.bg)}>
                <CardContent className="flex items-center justify-between p-6">
                    <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">{title}</p>
                        <motion.h2
                            key={value}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.25 }}
                            className="text-3xl font-bold tracking-tight"
                        >
                            {value}
                        </motion.h2>
                        {description && <p className="text-xs text-muted-foreground">{description}</p>}
                        {percent !== undefined && (
                            <Progress value={percent} className="mt-2 h-1.5 w-32 min-w-0" />
                        )}
                    </div>
                    <div className={cn("flex h-12 w-12 items-center justify-center rounded-full", colors.ring)}>
                        <Icon className={cn("h-6 w-6", colors.icon)} />
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}
