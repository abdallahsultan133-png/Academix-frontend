import { useState } from "react";
import { useGetIdentity } from "@refinedev/core";
import { useQueryClient } from "@tanstack/react-query";
import { Navigate } from "react-router";
import { toast } from "sonner";
import { Download, ShieldAlert } from "lucide-react";

import { Breadcrumb } from "@/components/layout/breadcrumb.tsx";
import { Card } from "@/components/ui/card.tsx";
import { SearchInput } from "@/components/ui/search-input.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.tsx";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table.tsx";
import { BACKEND_BASE_URL } from "@/constants";
import { useApiQuery } from "@/hooks/use-api-query.ts";
import { useDebouncedValue } from "@/hooks/use-debounced-value.ts";
import { toCsv, downloadCsv } from "@/lib/csv.ts";
import { UserRole, type User } from "@/types";

type ManagedUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  image: string | null;
};

const ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.STUDENT]: "Student",
  [UserRole.TEACHER]: "Teacher",
  [UserRole.ADMIN]: "Admin",
  [UserRole.PARENT]: "Parent",
  [UserRole.SUPER_ADMIN]: "Super Admin",
};

const getInitials = (name = "") => name.trim().split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("");

const UsersList = () => {
  const { data: identity, isLoading: identityLoading } = useGetIdentity<User>();
  const isAdminLike = identity?.role === UserRole.ADMIN || identity?.role === UserRole.SUPER_ADMIN;
  const isSuperAdmin = identity?.role === UserRole.SUPER_ADMIN;

  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 300);
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [savingId, setSavingId] = useState<string | null>(null);

  const usersPath = isAdminLike
    ? (() => {
        const params = new URLSearchParams({ limit: "100" });
        if (debouncedSearch) params.set("search", debouncedSearch);
        if (roleFilter !== "all") params.set("role", roleFilter);
        return `/users?${params.toString()}`;
      })()
    : null;

  const { data, isLoading: loading, isFetching } = useApiQuery<{ data: ManagedUser[] }>(usersPath);
  const users = data?.data ?? [];

  const handleRoleChange = async (userId: string, role: UserRole) => {
    setSavingId(userId);
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/users/${userId}/role`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      if (!res.ok) throw new Error((await res.json())?.error ?? "Failed to update role");

      queryClient.setQueryData<{ data: ManagedUser[] }>([usersPath], (prev) =>
        prev ? { data: prev.data.map((u) => (u.id === userId ? { ...u, role } : u)) } : prev
      );
      toast.success("Role updated.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update role");
    } finally {
      setSavingId(null);
    }
  };

  if (!identityLoading && !isAdminLike) {
    return <Navigate to="/" replace />;
  }

  const handleExportCsv = () => {
    const csv = toCsv(users, [
      { key: "name", label: "Name" },
      { key: "email", label: "Email" },
      { key: "role", label: "Role" },
    ]);
    downloadCsv(`users-${new Date().toISOString().slice(0, 10)}.csv`, csv);
  };

  return (
    <div className="users-list space-y-6">
      <Breadcrumb />

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Manage Users</h1>
          <p className="text-sm text-muted-foreground">Search users and change their role.</p>
        </div>
        {users.length > 0 && (
          <Button variant="outline" size="sm" onClick={handleExportCsv}>
            <Download className="mr-1.5 h-4 w-4" /> Export CSV
          </Button>
        )}
      </div>

      {!isSuperAdmin && (
        <div className="flex items-center gap-2 rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
          <ShieldAlert className="h-4 w-4 shrink-0" />
          Only a super admin can grant admin-level roles. You can manage student/teacher/parent roles.
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <SearchInput
          placeholder="Search by name or email..."
          aria-label="Search users by name or email"
          containerClassName="min-w-[240px] flex-1"
          value={search}
          onChange={setSearch}
          loading={isFetching}
        />

        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All roles</SelectItem>
            {Object.values(UserRole).map((r) => (
              <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        {loading ? (
          <div className="space-y-3 p-4">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : users.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted-foreground">No users match your search.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="w-[200px]">Role</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => {
                const canEditThisRole = isSuperAdmin || (u.role !== UserRole.ADMIN && u.role !== UserRole.SUPER_ADMIN);
                return (
                  <TableRow key={u.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          {u.image && <AvatarImage src={u.image} />}
                          <AvatarFallback>{getInitials(u.name)}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{u.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{u.email}</TableCell>
                    <TableCell>
                      <Select
                        value={u.role}
                        onValueChange={(value) => handleRoleChange(u.id, value as UserRole)}
                        disabled={savingId === u.id || !canEditThisRole || u.id === identity?.id}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.values(UserRole).map((r) => {
                            const disallowed = (r === UserRole.ADMIN || r === UserRole.SUPER_ADMIN) && !isSuperAdmin;
                            return (
                              <SelectItem key={r} value={r} disabled={disallowed}>
                                {ROLE_LABELS[r]}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
};

export default UsersList;
