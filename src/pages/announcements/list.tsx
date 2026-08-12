import { useEffect, useState } from "react";
import { Link } from "react-router";
import { useGetIdentity } from "@refinedev/core";
import { toast } from "sonner";
import { Megaphone, Pin, Plus, Trash2 } from "lucide-react";

import { Breadcrumb } from "@/components/layout/breadcrumb.tsx";
import { Card } from "@/components/ui/card.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog.tsx";
import { BACKEND_BASE_URL } from "@/constants";
import type { User } from "@/types";

type AnnouncementItem = {
  id: number;
  title: string;
  content: string;
  pinned: boolean;
  createdAt: string;
  class: { id: number; name: string } | null;
  author: { id: string; name: string; image: string | null };
};

const getInitials = (name = "") => name.trim().split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("");

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

const AnnouncementsList = () => {
  const { data: identity } = useGetIdentity<User>();
  const isTeacherOrAdmin = identity?.role === "teacher" || identity?.role === "admin" || identity?.role === "super_admin";

  const [items, setItems] = useState<AnnouncementItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const load = () => {
    setLoading(true);
    fetch(`${BACKEND_BASE_URL}/announcements`, { credentials: "include" })
      .then(async (res) => {
        if (!res.ok) throw new Error((await res.json())?.message ?? "Failed to load announcements");
        return res.json();
      })
      .then((json: { data: AnnouncementItem[] }) => setItems(json.data))
      .catch((e) => toast.error(e.message ?? "Failed to load announcements"))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleDelete = async (id: number) => {
    setDeletingId(id);
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/announcements/${id}`, { method: "DELETE", credentials: "include" });
      if (!res.ok) throw new Error((await res.json())?.message ?? "Failed to delete");
      setItems((prev) => prev.filter((i) => i.id !== id));
      toast.success("Announcement deleted.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to delete announcement");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="announcements-list space-y-6">
      <Breadcrumb />

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Announcements</h1>
          <p className="text-sm text-muted-foreground">School-wide and class updates, newest first.</p>
        </div>

        {isTeacherOrAdmin && (
          <Button asChild>
            <Link to="/announcements/create">
              <Plus className="mr-1.5 h-4 w-4" />
              New Announcement
            </Link>
          </Button>
        )}
      </div>

      <div className="space-y-4">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28 w-full rounded-xl" />)
        ) : items.length === 0 ? (
          <Card className="p-10 text-center text-sm text-muted-foreground">
            <Megaphone className="mx-auto mb-2 h-6 w-6 text-muted-foreground" />
            No announcements yet.
          </Card>
        ) : (
          items.map((a) => (
            <Card key={a.id} className={a.pinned ? "border-amber-300 bg-amber-50/40 p-5" : "p-5"}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <Avatar className="h-9 w-9">
                    {a.author.image && <AvatarImage src={a.author.image} />}
                    <AvatarFallback>{getInitials(a.author.name)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold leading-snug">{a.title}</h3>
                      {a.pinned && <Pin className="h-3.5 w-3.5 text-amber-600" />}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {a.author.name} · {a.class ? a.class.name : "School-wide"} · {timeAgo(a.createdAt)}
                    </p>
                  </div>
                </div>

                {isTeacherOrAdmin && (a.author.id === identity?.id || identity?.role === "admin") && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" aria-label={`Delete announcement: ${a.title}`} disabled={deletingId === a.id}>
                        <Trash2 className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete this announcement?</AlertDialogTitle>
                        <AlertDialogDescription>This can't be undone.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(a.id)}>Delete</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>

              <p className="mt-3 whitespace-pre-wrap text-sm text-muted-foreground">{a.content}</p>

              {a.class && <Badge variant="outline" className="mt-3">{a.class.name}</Badge>}
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default AnnouncementsList;
