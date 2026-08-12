import { useEffect, useState } from "react";
import { useGetIdentity } from "@refinedev/core";
import { useNavigate } from "react-router";
import { Shield } from "lucide-react";
import { Breadcrumb } from "@/components/layout/breadcrumb.tsx";
import { Card } from "@/components/ui/card.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table.tsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.tsx";
import { useApiQuery } from "@/hooks/use-api-query.ts";
import { UserRole, type User } from "@/types";

type AuditLog = {
    id: number;
    action: string;
    resource: string;
    resourceId: string | null;
    details: string | null;
    createdAt: string;
    user: { id: string; name: string; email: string } | null;
};

const actionColor = (action: string) => {
    if (action.includes("create")) return "bg-emerald-100 text-emerald-700";
    if (action.includes("delete")) return "bg-red-100 text-red-700";
    if (action.includes("update") || action.includes("grade")) return "bg-blue-100 text-blue-700";
    if (action.includes("enroll")) return "bg-purple-100 text-purple-700";
    return "bg-gray-100 text-gray-700";
};

const AuditLogsPage = () => {
    const { data: identity } = useGetIdentity<User>();
    const navigate = useNavigate();
    const [limit, setLimit] = useState("50");

    useEffect(() => {
        if (identity && identity.role !== UserRole.ADMIN && identity.role !== UserRole.SUPER_ADMIN) {
            navigate("/unauthorized");
        }
    }, [identity]);

    const { data, isLoading: loading } = useApiQuery<{ data: AuditLog[] }>(`/audit-logs?limit=${limit}`);
    const logs = data?.data ?? [];

    return (
        <div className="audit-logs space-y-6">
            <Breadcrumb />

            <div className="flex flex-wrap items-end justify-between gap-4">
                <div className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-muted-foreground" />
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight">Audit Logs</h1>
                        <p className="text-sm text-muted-foreground">System activity log. Admin only.</p>
                    </div>
                </div>
                <Select value={limit} onValueChange={setLimit}>
                    <SelectTrigger className="w-36">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="25">Last 25</SelectItem>
                        <SelectItem value="50">Last 50</SelectItem>
                        <SelectItem value="100">Last 100</SelectItem>
                        <SelectItem value="200">Last 200</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <Card>
                {loading ? (
                    <div className="space-y-3 p-4">
                        {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
                    </div>
                ) : logs.length === 0 ? (
                    <div className="p-10 text-center text-sm text-muted-foreground">
                        <Shield className="mx-auto mb-2 h-6 w-6" />
                        No audit logs yet.
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Action</TableHead>
                                <TableHead>Resource</TableHead>
                                <TableHead>User</TableHead>
                                <TableHead>Details</TableHead>
                                <TableHead>Time</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {logs.map((log) => (
                                <TableRow key={log.id}>
                                    <TableCell>
                                        <Badge className={actionColor(log.action)}>{log.action}</Badge>
                                    </TableCell>
                                    <TableCell className="text-sm">
                                        <span className="font-medium">{log.resource}</span>
                                        {log.resourceId && <span className="text-muted-foreground"> #{log.resourceId}</span>}
                                    </TableCell>
                                    <TableCell className="text-sm">
                                        {log.user ? (
                                            <div>
                                                <p className="font-medium">{log.user.name}</p>
                                                <p className="text-xs text-muted-foreground">{log.user.email}</p>
                                            </div>
                                        ) : <span className="text-muted-foreground">System</span>}
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground max-w-xs truncate">{log.details ?? "—"}</TableCell>
                                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                                        {new Date(log.createdAt).toLocaleString()}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </Card>
        </div>
    );
};

export default AuditLogsPage;
