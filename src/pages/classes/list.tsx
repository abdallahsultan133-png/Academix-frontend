import {ListView} from "@/components/refine-ui/views/list-view.tsx";
import {Breadcrumb} from "@/components/layout/breadcrumb.tsx";
import {Check, DoorOpen, Loader2} from "lucide-react";
import {Input} from "@/components/ui/input.tsx";
import {SearchInput} from "@/components/ui/search-input.tsx";
import {useCallback, useMemo, useState} from "react";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select.tsx";
import {CreateButton} from "@/components/refine-ui/buttons/create.tsx";
import {Button} from "@/components/ui/button.tsx";
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog.tsx";
import {DataTable} from "@/components/refine-ui/data-table/data-table.tsx";
import {useTable} from "@refinedev/react-table";
import {ClassDetails, Subject, User, UserRole} from "@/types";
import {ColumnDef} from "@tanstack/react-table";
import {Badge} from "@/components/ui/badge.tsx";
import {useGetIdentity, useInvalidate, useList} from "@refinedev/core";
import {useQueryClient} from "@tanstack/react-query";
import {useNavigate} from "react-router";
import {toast} from "sonner";
import {ShowButton} from "@/components/refine-ui/buttons/show.tsx";
import {EditButton} from "@/components/refine-ui/buttons/edit.tsx";
import {DeleteButton} from "@/components/refine-ui/buttons/delete.tsx";
import {BACKEND_BASE_URL} from "@/constants";
import {useApiQuery} from "@/hooks/use-api-query.ts";
import {useDebouncedValue} from "@/hooks/use-debounced-value.ts";

const JoinClassDialog = () => {
    const navigate = useNavigate();
    const invalidate = useInvalidate();
    const queryClient = useQueryClient();
    const [open, setOpen] = useState(false);
    const [inviteCode, setInviteCode] = useState('');
    const [joining, setJoining] = useState(false);

    const handleJoin = async () => {
        if (!inviteCode.trim()) return toast.error("Enter an invite code.");
        setJoining(true);
        try {
            const res = await fetch(`${BACKEND_BASE_URL}/classes/join`, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ inviteCode: inviteCode.trim() }),
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json?.error ?? "Failed to join class");
            toast.success(`Joined ${json.data.name}.`);
            setOpen(false);
            setInviteCode('');
            invalidate({ resource: "classes", invalidates: ["list"] });
            queryClient.invalidateQueries({ queryKey: ["/classes/enrolled-ids"] });
            navigate(`/classes/show/${json.data.id}`);
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Failed to join class");
        } finally {
            setJoining(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline">
                    <DoorOpen className="mr-1.5 h-4 w-4" /> Join a Class
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-sm">
                <DialogHeader>
                    <DialogTitle>Join a class</DialogTitle>
                    <DialogDescription>Enter the invite code your teacher gave you.</DialogDescription>
                </DialogHeader>
                <Input
                    placeholder="e.g. 7F3K9Q"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleJoin(); } }}
                    autoFocus
                />
                <DialogFooter>
                    <Button onClick={handleJoin} disabled={joining} className="w-full">
                        {joining && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {joining ? "Joining..." : "Join Class"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

const ClassesList = () => {
    const { data: identity } = useGetIdentity<User>();
    const isAdmin = identity?.role === UserRole.ADMIN || identity?.role === UserRole.SUPER_ADMIN;
    const isStudent = identity?.role === UserRole.STUDENT;
    const queryClient = useQueryClient();

    const [searchQuery, setSearchQuery] = useState('');
    const debouncedSearchQuery = useDebouncedValue(searchQuery, 300);
    const [selectedSubject, setSelectedSubject] = useState('all');
    const [selectedTeacher, setSelectedTeacher] = useState('all');
    const [joiningId, setJoiningId] = useState<number | null>(null);

    const { data: enrolledIdsData } = useApiQuery<{ data: number[] }>(isStudent ? "/classes/enrolled-ids" : null);
    const enrolledIds = useMemo(() => new Set(enrolledIdsData?.data ?? []), [enrolledIdsData]);

    const handleJoinRow = useCallback(async (classId: number, inviteCode: string | undefined, className: string) => {
        if (!inviteCode) return toast.error("This class has no invite code set.");
        setJoiningId(classId);
        try {
            const res = await fetch(`${BACKEND_BASE_URL}/classes/join`, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ inviteCode }),
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json?.error ?? "Failed to join class");
            toast.success(`Joined ${className}.`);
            queryClient.invalidateQueries({ queryKey: ["/classes/enrolled-ids"] });
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Failed to join class");
        } finally {
            setJoiningId(null);
        }
    }, [queryClient]);

    const { query: subjectsQuery } = useList<Subject>({
        resource: 'subjects',
        pagination: { pageSize: 100 }
    });

    const { query: teachersQuery } = useList<User>({
        resource: 'teachers',
        pagination: { pageSize: 100 }
    });

    const subjects = subjectsQuery?.data?.data || [];
    const teachers = teachersQuery?.data?.data || [];

    const subjectFilters = selectedSubject === 'all' ? [] : [
        { field: 'subject', operator: 'eq' as const, value: selectedSubject}
    ];
    const teacherFilters = selectedTeacher === 'all' ? [] : [
        { field: 'teacher', operator: 'eq' as const, value: selectedTeacher}
    ];
    const searchFilters = debouncedSearchQuery ? [
        { field: 'name', operator: 'contains' as const, value: debouncedSearchQuery }
    ] : [];

    const classColumns = useMemo<ColumnDef<ClassDetails>[]>(() => [
        {
            id: 'bannerUrl',
            accessorKey: 'bannerUrl',
            size: 80,
            header: () => <p className="column-title ml-2">Banner</p>,
            cell: ({ getValue }) => (
                <div className="flex items-center justify-center ml-2">
                    <img
                        src={getValue<string>() || '/placeholder-class.png'}
                        alt="Class Banner"
                        className="w-10 h-10 rounded object-cover"
                    />
                </div>
            )
        },
        {
            id: 'name',
            accessorKey: 'name',
            size: 200,
            header: () => <p className="column-title">Class Name</p>,
            cell: ({ getValue }) => <span className="text-foreground font-medium">{getValue<string>()}</span>,
        },
        {
            id: 'status',
            accessorKey: 'status',
            size: 100,
            header: () => <p className="column-title">Status</p>,
            cell: ({ getValue }) => {
                const status = getValue<string>();
                return (
                    <Badge variant={status === 'active' ? 'default' : 'secondary'}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                    </Badge>
                );
            }
        },
        {
            id: 'subject',
            accessorKey: 'subject.name',
            size: 150,
            header: () => <p className="column-title">Subject</p>,
            cell: ({ getValue }) => <span className="text-foreground">{getValue<string>()}</span>,
        },
        {
            id: 'teacher',
            accessorKey: 'teacher.name',
            size: 150,
            header: () => <p className="column-title">Teacher</p>,
            cell: ({ getValue }) => <span className="text-foreground">{getValue<string>()}</span>,
        },
        {
            id: 'capacity',
            accessorKey: 'capacity',
            size: 100,
            header: () => <p className="column-title">Capacity</p>,
            cell: ({ getValue }) => <span className="text-foreground">{getValue<number>()}</span>,
        },
        {
            id: 'details',
            size: isAdmin ? 220 : isStudent ? 200 : 140,
            header: () => <p className="column-title">Details</p>,
            cell: ({ row }) => {
                const canEdit = isAdmin || identity?.id === row.original.teacher?.id;
                const isEnrolled = enrolledIds.has(row.original.id);
                const isJoiningThisRow = joiningId === row.original.id;
                return (
                    <div className="flex gap-2">
                        <ShowButton resource="classes" recordItemId={row.original.id} variant="outline" size="sm">View</ShowButton>
                        {canEdit && <EditButton resource="classes" recordItemId={row.original.id} variant="outline" size="sm">Edit</EditButton>}
                        {isAdmin && <DeleteButton resource="classes" recordItemId={row.original.id} size="sm">Delete</DeleteButton>}
                        {isStudent && (
                            isEnrolled ? (
                                <Badge variant="outline" className="flex items-center gap-1 text-emerald-700">
                                    <Check className="h-3 w-3" /> Enrolled
                                </Badge>
                            ) : (
                                <Button
                                    size="sm"
                                    disabled={joiningId !== null}
                                    onClick={() => handleJoinRow(row.original.id, row.original.inviteCode, row.original.name)}
                                >
                                    {isJoiningThisRow ? (
                                        <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                                    ) : (
                                        <DoorOpen className="mr-1.5 h-3.5 w-3.5" />
                                    )}
                                    {isJoiningThisRow ? "Joining..." : "Join"}
                                </Button>
                            )
                        )}
                    </div>
                );
            }
        }
    ], [isAdmin, isStudent, identity?.id, enrolledIds, joiningId, handleJoinRow]);

    const classTable = useTable<ClassDetails>({
        columns: classColumns,
        refineCoreProps: {
            resource: 'classes',
            pagination: { pageSize: 10, mode: 'server' },
            filters: {
                permanent: [...subjectFilters, ...teacherFilters, ...searchFilters]
            },
            sorters: {
                initial: [
                    { field: 'id', order: 'desc' },
                ]
            },
        }
    });

    return (
        <ListView>
            <Breadcrumb />

            <h1 className="page-title">Classes</h1>

            <div className="intro-row">
                <p>Manage your classes, subjects, and teachers.</p>

                <div className="actions-row">
                    <SearchInput
                        placeholder="Search by name..."
                        aria-label="Search classes by name"
                        containerClassName="md:max-w-72"
                        value={searchQuery}
                        onChange={setSearchQuery}
                        loading={classTable.refineCore.tableQuery.isFetching}
                    />

                    <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                        <Select
                            value={selectedSubject} onValueChange={setSelectedSubject}
                        >
                            <SelectTrigger className="w-[180px]" aria-label="Filter by subject">
                                <SelectValue placeholder="Filter by subject" />
                            </SelectTrigger>

                            <SelectContent>
                                <SelectItem value="all">
                                    All Subjects
                                </SelectItem>
                                {subjects.map(subject => (
                                    <SelectItem key={subject.id} value={subject.name}>
                                        {subject.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select
                            value={selectedTeacher} onValueChange={setSelectedTeacher}
                        >
                            <SelectTrigger className="w-[180px]" aria-label="Filter by teacher">
                                <SelectValue placeholder="Filter by teacher" />
                            </SelectTrigger>

                            <SelectContent>
                                <SelectItem value="all">
                                    All Teachers
                                </SelectItem>
                                {teachers.map(teacher => (
                                    <SelectItem key={teacher.id} value={teacher.name}>
                                        {teacher.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {isStudent ? <JoinClassDialog /> : <CreateButton resource="classes" />}
                    </div>
                </div>
            </div>

            <DataTable table={classTable} />
        </ListView>
    )
}

export default ClassesList