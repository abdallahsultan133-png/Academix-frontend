import { motion } from "framer-motion";
import { Link } from "react-router";
import { CalendarClock, BookOpenCheck, FileText, PartyPopper, CalendarDays } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useApiQuery } from "@/hooks/use-api-query.ts";

type EventType = "class" | "exam" | "holiday" | "event" | "deadline";

type CalendarEvent = {
    id: number;
    title: string;
    type: EventType;
    startAt: string;
    class: { id: number; name: string } | null;
};

const TYPE_ICONS: Record<EventType, typeof CalendarClock> = {
    class: CalendarDays,
    exam: BookOpenCheck,
    deadline: FileText,
    event: PartyPopper,
    holiday: PartyPopper,
};

const formatWhen = (iso: string) => {
    const date = new Date(iso);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    const isTomorrow = date.toDateString() === tomorrow.toDateString();

    const time = date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
    if (isToday) return `Today, ${time}`;
    if (isTomorrow) return `Tomorrow, ${time}`;
    return date.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
};

export function UpcomingEvents() {
    // Stable within a calendar day, so this doesn't cause a new query key on every render.
    const from = new Date().toISOString().slice(0, 10);
    const to = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    const { data, isLoading } = useApiQuery<{ data: CalendarEvent[] }>(`/calendar?from=${from}&to=${to}`);
    const events = (data?.data ?? []).slice(0, 6);

    return (
        <Card>
            <CardContent className="space-y-4 p-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold">Upcoming</h2>
                    <Link to="/calendar" className="text-xs text-muted-foreground hover:text-foreground">
                        View calendar →
                    </Link>
                </div>

                {isLoading ? (
                    <div className="space-y-3">
                        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
                    </div>
                ) : events.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nothing scheduled in the next two weeks.</p>
                ) : (
                    <div className="space-y-1">
                        {events.map((e, index) => {
                            const Icon = TYPE_ICONS[e.type] ?? CalendarClock;
                            return (
                                <motion.div
                                    key={`${e.type}-${e.id}`}
                                    initial={{ opacity: 0, x: -8 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.3, delay: index * 0.05, ease: "easeOut" }}
                                    className="flex items-center gap-3 rounded-lg py-2"
                                >
                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                                        <Icon className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-medium">{e.title}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {formatWhen(e.startAt)}{e.class ? ` · ${e.class.name}` : ""}
                                        </p>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
