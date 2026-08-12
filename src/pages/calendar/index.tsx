import { useState } from "react";
import { useGetIdentity } from "@refinedev/core";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AnimatePresence, motion } from "framer-motion";
import {
    ChevronLeft, ChevronRight, Plus, X,
    BookOpenCheck, CalendarDays, Flag, Clock, Repeat, Sparkles, CalendarRange,
} from "lucide-react";

import { Breadcrumb } from "@/components/layout/breadcrumb.tsx";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
import { Separator } from "@/components/ui/separator.tsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.tsx";
import { Switch } from "@/components/ui/switch.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog.tsx";
import { StatCard } from "@/components/dashboard/stat-card.tsx";
import { BACKEND_BASE_URL } from "@/constants";
import { useApiQuery } from "@/hooks/use-api-query.ts";
import { UserRole, type User } from "@/types";
import { cn } from "@/lib/utils.ts";

type CalendarEventType = "class" | "exam" | "holiday" | "event" | "deadline";
type EventSource = "manual" | "exam" | "assignment";
type RecurrenceFreq = "none" | "daily" | "weekly" | "monthly";

type CalendarEvent = {
    id: number;
    title: string;
    type: CalendarEventType;
    startAt: string;
    endAt: string | null;
    allDay: boolean;
    description: string | null;
    class: { id: number; name: string } | null;
    source: EventSource;
    recurrenceFreq?: RecurrenceFreq;
    isRecurrenceInstance?: boolean;
    recurrenceParentId?: number | null;
};

const RECURRENCE_LABELS: Record<RecurrenceFreq, string> = {
    none: "Does not repeat",
    daily: "Repeats daily",
    weekly: "Repeats weekly",
    monthly: "Repeats monthly",
};

const TYPE_CONFIG: Record<CalendarEventType, {
    label: string;
    icon: typeof Flag;
    dot: string;
    chip: string;
    iconWrap: string;
}> = {
    class: {
        label: "Class",
        icon: CalendarDays,
        dot: "bg-blue-500",
        chip: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300",
        iconWrap: "bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400",
    },
    exam: {
        label: "Exam",
        icon: BookOpenCheck,
        dot: "bg-red-500",
        chip: "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300",
        iconWrap: "bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400",
    },
    holiday: {
        label: "Holiday",
        icon: Flag,
        dot: "bg-emerald-500",
        chip: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300",
        iconWrap: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400",
    },
    event: {
        label: "Event",
        icon: Sparkles,
        dot: "bg-violet-500",
        chip: "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900 dark:bg-violet-950/40 dark:text-violet-300",
        iconWrap: "bg-violet-100 text-violet-600 dark:bg-violet-900/40 dark:text-violet-400",
    },
    deadline: {
        label: "Deadline",
        icon: Clock,
        dot: "bg-amber-500",
        chip: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300",
        iconWrap: "bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400",
    },
};

const EVENT_TYPES: CalendarEventType[] = ["class", "exam", "holiday", "event", "deadline"];

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

const isoDate = (d: Date) => d.toISOString().slice(0, 10);

const gridVariants = {
    enter: (dir: number) => ({ opacity: 0, x: dir === 0 ? 0 : dir * 28 }),
    center: { opacity: 1, x: 0 },
    exit: (dir: number) => ({ opacity: 0, x: dir === 0 ? 0 : -dir * 28 }),
};

const CalendarPage = () => {
    const { data: identity } = useGetIdentity<User>();
    const isTeacherOrAdmin = identity?.role === UserRole.TEACHER || identity?.role === UserRole.ADMIN || identity?.role === UserRole.SUPER_ADMIN;

    const queryClient = useQueryClient();
    const [today] = useState(new Date());
    const [current, setCurrent] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
    const [direction, setDirection] = useState(0);
    const [selectedDay, setSelectedDay] = useState<Date | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [visibleTypes, setVisibleTypes] = useState<Set<CalendarEventType>>(new Set(EVENT_TYPES));

    // Form state
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [type, setType] = useState<CalendarEventType>("event");
    const [startAt, setStartAt] = useState("");
    const [endAt, setEndAt] = useState("");
    const [allDay, setAllDay] = useState(false);
    const [recurrenceFreq, setRecurrenceFreq] = useState<RecurrenceFreq>("none");
    const [recurrenceEndAt, setRecurrenceEndAt] = useState("");
    const [creating, setCreating] = useState(false);

    const year = current.getFullYear();
    const month = current.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7;

    const from = isoDate(new Date(year, month, 1));
    const to = isoDate(new Date(year, month + 1, 0));

    const calendarPath = `/calendar?from=${from}&to=${to}`;
    const { data, isLoading: loading } = useApiQuery<{ data: CalendarEvent[] }>(calendarPath);
    const allEvents = data?.data ?? [];
    const events = allEvents.filter((e) => visibleTypes.has(e.type));

    const goToMonth = (offset: number) => {
        setDirection(offset);
        setCurrent(new Date(year, month + offset, 1));
    };
    const goToToday = () => {
        setDirection(0);
        setCurrent(new Date(today.getFullYear(), today.getMonth(), 1));
    };

    const toggleType = (t: CalendarEventType) => {
        setVisibleTypes((prev) => {
            const next = new Set(prev);
            if (next.has(t)) next.delete(t); else next.add(t);
            return next;
        });
    };

    const eventsOnDay = (day: number) => {
        const d = isoDate(new Date(year, month, day));
        return events.filter((e) => e.startAt.slice(0, 10) === d);
    };

    const selectedEvents = selectedDay ? eventsOnDay(selectedDay.getDate()) : [];

    const now = new Date();
    const nextUp = [...events]
        .filter((e) => new Date(e.startAt).getTime() >= now.getTime())
        .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())[0];
    const examOrDeadlineCount = events.filter((e) => e.type === "exam" || e.type === "deadline").length;

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) return toast.error("Title is required.");
        if (!startAt) return toast.error("Start date/time is required.");
        setCreating(true);
        try {
            const res = await fetch(`${BACKEND_BASE_URL}/calendar`, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: title.trim(), description: description || undefined, type, startAt, endAt: endAt || undefined, allDay,
                    recurrenceFreq, recurrenceEndAt: recurrenceFreq !== "none" && recurrenceEndAt ? recurrenceEndAt : undefined,
                }),
            });
            if (!res.ok) throw new Error((await res.json())?.error ?? "Failed");
            toast.success("Event created.");
            setTitle(""); setDescription(""); setStartAt(""); setEndAt(""); setType("event"); setAllDay(false);
            setRecurrenceFreq("none"); setRecurrenceEndAt("");
            setShowForm(false);
            queryClient.invalidateQueries({ queryKey: [calendarPath] });
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Failed to create event");
        } finally {
            setCreating(false);
        }
    };

    const handleDelete = async (eventId: number) => {
        const res = await fetch(`${BACKEND_BASE_URL}/calendar/${eventId}`, { method: "DELETE", credentials: "include" });
        if (res.ok) {
            queryClient.invalidateQueries({ queryKey: [calendarPath] });
            setSelectedDay(null);
            toast.success("Event deleted.");
        } else toast.error("Failed to delete event.");
    };

    return (
        <div className="calendar-page space-y-6">
            <Breadcrumb />

            <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className="flex flex-wrap items-end justify-between gap-4"
            >
                <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-500 text-white shadow-sm">
                        <CalendarRange className="h-5 w-5" />
                    </div>
                    <div>
                        <h1 className="font-display text-2xl font-bold tracking-tight">Calendar</h1>
                        <p className="text-sm text-muted-foreground">Classes, exams, deadlines, and school events.</p>
                    </div>
                </div>
                {isTeacherOrAdmin && (
                    <Dialog open={showForm} onOpenChange={setShowForm}>
                        <DialogTrigger asChild>
                            <Button className="bg-gradient-to-r from-violet-500 to-indigo-500 text-white shadow-sm hover:opacity-90">
                                <Plus className="mr-1.5 h-4 w-4" />Add Event
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-xl">
                            <DialogHeader>
                                <DialogTitle>New Event</DialogTitle>
                                <DialogDescription>Add a class, exam, holiday, deadline, or general event to the calendar.</DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleCreate} className="space-y-4">
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="space-y-2 sm:col-span-2">
                                        <Label>Title *</Label>
                                        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Sports Day" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Type</Label>
                                        <Select value={type} onValueChange={(v) => setType(v as CalendarEventType)}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                {EVENT_TYPES.map((t) => {
                                                    const { label, icon: Icon, dot } = TYPE_CONFIG[t];
                                                    return (
                                                        <SelectItem key={t} value={t}>
                                                            <span className="flex items-center gap-2">
                                                                <span className={cn("h-2 w-2 rounded-full", dot)} />
                                                                <Icon className="h-3.5 w-3.5" />
                                                                {label}
                                                            </span>
                                                        </SelectItem>
                                                    );
                                                })}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="flex items-center gap-2 pt-7">
                                        <Switch checked={allDay} onCheckedChange={setAllDay} id="allDay" />
                                        <Label htmlFor="allDay">All day</Label>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>{allDay ? "Start date" : "Start"} *</Label>
                                        <Input type={allDay ? "date" : "datetime-local"} value={startAt} onChange={(e) => setStartAt(e.target.value)} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>{allDay ? "End date" : "End"}</Label>
                                        <Input type={allDay ? "date" : "datetime-local"} value={endAt} onChange={(e) => setEndAt(e.target.value)} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="flex items-center gap-1.5"><Repeat className="h-3.5 w-3.5" /> Repeat</Label>
                                        <Select value={recurrenceFreq} onValueChange={(v) => setRecurrenceFreq(v as RecurrenceFreq)}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                {(Object.keys(RECURRENCE_LABELS) as RecurrenceFreq[]).map((f) => (
                                                    <SelectItem key={f} value={f}>{RECURRENCE_LABELS[f]}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    {recurrenceFreq !== "none" && (
                                        <div className="space-y-2">
                                            <Label>Repeat until (optional)</Label>
                                            <Input type="date" value={recurrenceEndAt} onChange={(e) => setRecurrenceEndAt(e.target.value)} />
                                        </div>
                                    )}
                                    <div className="space-y-2 sm:col-span-2">
                                        <Label>Description</Label>
                                        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button type="submit" className="w-full bg-gradient-to-r from-violet-500 to-indigo-500 text-white hover:opacity-90 sm:w-auto" disabled={creating}>
                                        {creating ? "Creating..." : "Create Event"}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                )}
            </motion.div>

            {/* Stats */}
            <div className="grid gap-4 sm:grid-cols-3">
                <StatCard
                    title="Events this month"
                    value={String(events.length)}
                    icon={CalendarDays}
                    color="blue"
                    description={`${MONTHS[month]} ${year}`}
                    index={0}
                />
                <StatCard
                    title="Exams & deadlines"
                    value={String(examOrDeadlineCount)}
                    icon={BookOpenCheck}
                    color={examOrDeadlineCount > 0 ? "red" : "green"}
                    description="Requiring preparation"
                    index={1}
                />
                <StatCard
                    title="Next up"
                    value={nextUp ? nextUp.title : "—"}
                    icon={Sparkles}
                    color="purple"
                    description={nextUp
                        ? new Date(nextUp.startAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })
                        : "Nothing scheduled"}
                    index={2}
                />
            </div>

            {/* Filterable legend */}
            <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-medium text-muted-foreground">Filter:</span>
                {EVENT_TYPES.map((t) => {
                    const { label, icon: Icon, chip } = TYPE_CONFIG[t];
                    const active = visibleTypes.has(t);
                    return (
                        <motion.button
                            key={t}
                            type="button"
                            whileTap={{ scale: 0.94 }}
                            onClick={() => toggleType(t)}
                            aria-pressed={active}
                            className={cn(
                                "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
                                active ? chip : "border-transparent bg-muted text-muted-foreground opacity-60 hover:opacity-100",
                            )}
                        >
                            <Icon className="h-3 w-3" />
                            {label}
                        </motion.button>
                    );
                })}
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Month grid */}
                <Card className={cn("overflow-hidden lg:col-span-2 transition-opacity", loading && "opacity-60")}>
                    {/* Navigation */}
                    <div className="flex items-center justify-between border-b bg-muted/20 px-5 py-3">
                        <h2 className="font-display text-lg font-semibold">{MONTHS[month]} {year}</h2>
                        <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" aria-label="Previous month" onClick={() => goToMonth(-1)}>
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm" onClick={goToToday}>
                                Today
                            </Button>
                            <Button variant="ghost" size="icon" aria-label="Next month" onClick={() => goToMonth(1)}>
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    {/* Day headers */}
                    <div className="grid grid-cols-7 border-b bg-muted/30">
                        {DAYS.map((d, i) => (
                            <div
                                key={d}
                                className={cn(
                                    "py-2 text-center text-xs font-medium text-muted-foreground",
                                    (i === 0 || i === 6) && "text-muted-foreground/70",
                                )}
                            >
                                {d}
                            </div>
                        ))}
                    </div>

                    {/* Calendar cells */}
                    <div className="overflow-hidden">
                        <AnimatePresence mode="wait" custom={direction}>
                            <motion.div
                                key={`${year}-${month}`}
                                custom={direction}
                                variants={gridVariants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                transition={{ duration: 0.22, ease: "easeOut" }}
                                className="grid grid-cols-7"
                            >
                                {Array.from({ length: totalCells }).map((_, i) => {
                                    const dayNum = i - firstDay + 1;
                                    const isValid = dayNum >= 1 && dayNum <= daysInMonth;
                                    const date = isValid ? new Date(year, month, dayNum) : null;
                                    const isToday = date && isoDate(date) === isoDate(today);
                                    const isSelected = date && selectedDay && isoDate(date) === isoDate(selectedDay);
                                    const isWeekend = i % 7 === 0 || i % 7 === 6;
                                    const dayEvents = isValid ? eventsOnDay(dayNum) : [];

                                    return (
                                        <div
                                            key={i}
                                            onClick={() => isValid && date && setSelectedDay(date)}
                                            className={cn(
                                                "min-h-[92px] border-b border-r p-1.5 transition-colors last:border-r-0",
                                                isValid ? "cursor-pointer hover:bg-muted/40" : "bg-muted/10",
                                                isWeekend && isValid && "bg-muted/[0.15]",
                                                isSelected && "bg-primary/[0.07] ring-1 ring-inset ring-primary/40",
                                            )}
                                        >
                                            {isValid && (
                                                <>
                                                    <div className={cn(
                                                        "mb-1 flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium transition-colors",
                                                        isToday && "bg-gradient-to-br from-violet-500 to-indigo-500 text-white shadow-sm",
                                                        !isToday && isSelected && "text-primary font-semibold",
                                                    )}>
                                                        {dayNum}
                                                    </div>
                                                    <div className="space-y-0.5">
                                                        {dayEvents.slice(0, 3).map((ev) => {
                                                            const { chip } = TYPE_CONFIG[ev.type];
                                                            return (
                                                                <div key={ev.id} className={cn("flex items-center gap-1 truncate rounded px-1 py-px text-[10px] font-medium border", chip)}>
                                                                    <span className="truncate">{ev.title}</span>
                                                                </div>
                                                            );
                                                        })}
                                                        {dayEvents.length > 3 && (
                                                            <div className="pl-1 text-[10px] font-medium text-muted-foreground">+{dayEvents.length - 3} more</div>
                                                        )}
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    );
                                })}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </Card>

                {/* Day detail panel */}
                <Card className="lg:sticky lg:top-4 lg:self-start">
                    <CardHeader className="flex-row items-center justify-between space-y-0">
                        <CardTitle className="text-base">
                            {selectedDay
                                ? selectedDay.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })
                                : "Select a day"}
                        </CardTitle>
                        {selectedDay && selectedEvents.length > 0 && (
                            <Badge variant="secondary" className="shrink-0">{selectedEvents.length}</Badge>
                        )}
                    </CardHeader>
                    <Separator />
                    <CardContent className="mt-3 space-y-3">
                        {!selectedDay ? (
                            <div className="flex flex-col items-center gap-2 py-8 text-center">
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                                    <CalendarRange className="h-5 w-5 text-muted-foreground" />
                                </div>
                                <p className="text-sm text-muted-foreground">Click a day to see its events.</p>
                            </div>
                        ) : selectedEvents.length === 0 ? (
                            <div className="flex flex-col items-center gap-2 py-8 text-center">
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                                    <CalendarDays className="h-5 w-5 text-muted-foreground" />
                                </div>
                                <p className="text-sm text-muted-foreground">No events on this day.</p>
                            </div>
                        ) : (
                            <div className="relative space-y-3">
                                {selectedEvents.map((ev, index) => {
                                    const { label, icon: Icon, chip, iconWrap } = TYPE_CONFIG[ev.type];
                                    return (
                                        <motion.div
                                            key={ev.id}
                                            initial={{ opacity: 0, x: -8 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ duration: 0.25, delay: index * 0.05, ease: "easeOut" }}
                                            className="flex gap-3"
                                        >
                                            <div className={cn("mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full", iconWrap)}>
                                                <Icon className="h-4 w-4" />
                                            </div>
                                            <div className="min-w-0 flex-1 space-y-1 rounded-lg border p-3">
                                                <div className="flex items-start justify-between gap-2">
                                                    <span className="text-sm font-medium leading-snug">{ev.title}</span>
                                                    {isTeacherOrAdmin && ev.source === "manual" && ev.id > 0 && !ev.isRecurrenceInstance && (
                                                        <button
                                                            onClick={() => handleDelete(ev.id)}
                                                            aria-label={`Delete event: ${ev.title}`}
                                                            title={ev.recurrenceFreq && ev.recurrenceFreq !== "none" ? "Delete this entire series" : "Delete event"}
                                                            className="shrink-0 text-muted-foreground hover:text-destructive"
                                                        >
                                                            <X className="h-3.5 w-3.5" aria-hidden="true" />
                                                        </button>
                                                    )}
                                                </div>
                                                <div className="flex flex-wrap items-center gap-1.5">
                                                    <Badge variant="outline" className={cn("text-[10px]", chip)}>{label}</Badge>
                                                    {ev.recurrenceFreq && ev.recurrenceFreq !== "none" && (
                                                        <Badge variant="outline" className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                                            <Repeat className="h-2.5 w-2.5" />
                                                            {RECURRENCE_LABELS[ev.recurrenceFreq].replace("Repeats ", "")}
                                                        </Badge>
                                                    )}
                                                </div>
                                                {ev.class && <p className="text-xs text-muted-foreground">{ev.class.name}</p>}
                                                {ev.description && <p className="text-xs text-muted-foreground">{ev.description}</p>}
                                                {ev.isRecurrenceInstance && (
                                                    <p className="text-[10px] italic text-muted-foreground">
                                                        Part of a recurring series — edit or delete the first occurrence to change it.
                                                    </p>
                                                )}
                                                {!ev.allDay && (
                                                    <p className="text-xs text-muted-foreground">
                                                        {new Date(ev.startAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                                        {ev.endAt && ` – ${new Date(ev.endAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`}
                                                    </p>
                                                )}
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default CalendarPage;
