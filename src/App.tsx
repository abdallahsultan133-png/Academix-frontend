import { Refine, Authenticated } from "@refinedev/core";
import { DevtoolsPanel, DevtoolsProvider } from "@refinedev/devtools";
import { RefineKbarProvider } from "@refinedev/kbar";
import { CommandPalette } from "@/components/layout/command-palette.tsx";
import {Layout} from "@/components/layout/layout.tsx";
import routerProvider, {
  DocumentTitleHandler,
  UnsavedChangesNotifier,
} from "@refinedev/react-router";

import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Outlet, Route, Routes } from "react-router";
import "./App.css";
import { Toaster } from "./components/refine-ui/notification/toaster";
import { useNotificationProvider } from "./components/refine-ui/notification/use-notification-provider";
import { ThemeProvider } from "./components/refine-ui/theme/theme-provider";
import { dataProvider } from "./providers/data";
import {BookOpen, GraduationCap, Home, School, ClipboardCheck, FileText, Megaphone, BarChart3, Calendar, MessageSquare} from "lucide-react";
import { NotFoundPage, UnauthorizedPage } from "@/pages/errors/index.tsx";
import { authProvider } from "@/providers/auth";
import { RequireRole } from "@/components/layout/require-role.tsx";
import { ErrorBoundary } from "@/components/layout/error-boundary.tsx";
import { PageLoader } from "@/components/layout/page-loader.tsx";
import { UserRole } from "@/types";

// Route-level code splitting: each page is fetched only when its route is
// visited instead of all ~30 pages shipping in a single bundle up front.
const Dashboard = lazy(() => import("@/pages/dashboard.tsx"));
const SubjectsList = lazy(() => import("@/pages/subjects/list.tsx"));
const SubjectsCreate = lazy(() => import("@/pages/subjects/create.tsx"));
const SubjectsEdit = lazy(() => import("@/pages/subjects/edit.tsx"));
const ClassesList = lazy(() => import("@/pages/classes/list.tsx"));
const ClassesCreate = lazy(() => import("@/pages/classes/create.tsx"));
const ClassesEdit = lazy(() => import("@/pages/classes/edit.tsx"));
const ClassesShow = lazy(() => import("@/pages/classes/show.tsx"));
const DepartmentsPage = lazy(() => import("@/pages/admin/departments.tsx"));
const AttendanceIndex = lazy(() => import("@/pages/attendance/index.tsx"));
const AttendanceReport = lazy(() => import("@/pages/attendance/report.tsx"));
const QrAttendancePage = lazy(() => import("@/pages/attendance/qr.tsx"));
const AssignmentsList = lazy(() => import("@/pages/assignments/list.tsx"));
const AssignmentsCreate = lazy(() => import("@/pages/assignments/create.tsx"));
const AssignmentShow = lazy(() => import("@/pages/assignments/show.tsx"));
const AnnouncementsList = lazy(() => import("@/pages/announcements/list.tsx"));
const AnnouncementsCreate = lazy(() => import("@/pages/announcements/create.tsx"));
const UsersList = lazy(() => import("@/pages/users/list.tsx"));
const Gradebook = lazy(() => import("@/pages/grades/gradebook.tsx"));
const ExamsPage = lazy(() => import("@/pages/grades/exams.tsx"));
const ReportCard = lazy(() => import("@/pages/grades/report-card.tsx"));
const CalendarPage = lazy(() => import("@/pages/calendar/index.tsx"));
const ProfilePage = lazy(() => import("@/pages/profile/index.tsx"));
const StudentProfilePage = lazy(() => import("@/pages/profile/student.tsx"));
const ParentDashboard = lazy(() => import("@/pages/parent/dashboard.tsx"));
const MessagesPage = lazy(() => import("@/pages/messages/index.tsx"));
const AiAssistantPage = lazy(() => import("@/pages/ai-assistant/index.tsx"));
const EnrollStudents = lazy(() => import("@/pages/classes/enroll.tsx"));
const AuditLogsPage = lazy(() => import("@/pages/admin/audit-logs.tsx"));
const Login = lazy(() => import("@/pages/auth/login"));
const Register = lazy(() => import("@/pages/auth/register"));

const STAFF_ROLES = [UserRole.TEACHER, UserRole.ADMIN, UserRole.SUPER_ADMIN];
const ADMIN_ROLES = [UserRole.ADMIN, UserRole.SUPER_ADMIN];

function App() {
  return (
    <ErrorBoundary>
    <BrowserRouter>
      <RefineKbarProvider>
        <ThemeProvider>
          <DevtoolsProvider>
              <Refine
                  dataProvider={dataProvider}
                  authProvider={authProvider}
                  notificationProvider={useNotificationProvider()}
                  routerProvider={routerProvider}

                  options={{
                  syncWithLocation: true,
                  warnWhenUnsavedChanges: true,
                  projectId: "9sZQll-ZrhvSP-k4lkA8",
                  title: {
                      text: "ClassroomMS",
                      icon: <School />,
                  },
              }}
              resources={[
                      { name: 'dashboard',
                          list: '/',
                          meta: { label: 'Home', icon: <Home />}
                      }, {
                      name: 'subjects',
                      list: '/subjects',
                      create: '/subjects/create',
                      edit: '/subjects/edit/:id',
                      meta: { label: 'Subjects', icon: <BookOpen />}
                  }, {
                      name: 'classes',
                      list: '/classes',
                      create: '/classes/create',
                      show: '/classes/show/:id',
                      edit: '/classes/edit/:id',
                      meta: { label: 'Classes', icon: <GraduationCap />}
                  }, {
                      name: 'attendance',
                      list: '/attendance',
                      meta: { label: 'Attendance', icon: <ClipboardCheck />}
                  }, {
                      name: 'assignments',
                      list: '/assignments',
                      create: '/assignments/create',
                      show: '/assignments/:id',
                      meta: { label: 'Assignments', icon: <FileText />}
                  }, {
                      name: 'announcements',
                      list: '/announcements',
                      create: '/announcements/create',
                      meta: { label: 'Announcements', icon: <Megaphone />}
                  }, {
                      name: 'grades',
                      list: '/grades',
                      meta: { label: 'Grades', icon: <BarChart3 />}
                  }, {
                      name: 'calendar',
                      list: '/calendar',
                      meta: { label: 'Calendar', icon: <Calendar />}
                  }, {
                      name: 'messages',
                      list: '/messages',
                      meta: { label: 'Messages', icon: <MessageSquare />}
                  }
              ]}
            >
                  <Suspense fallback={<PageLoader />}>
                  <Routes>

                      <Route path="/login" element={<Login />} />
                      <Route path="/register" element={<Register />} />

                      <Route
                          element={
                              <Authenticated
                                  key="authenticated-layout"
                                  fallback={<Navigate to="/login" />}
                              >
                                  <Layout>
                                      <Outlet />
                                  </Layout>
                              </Authenticated>
                          }
                      >

                          <Route path="/" element={<Dashboard />} />

                          <Route path="subjects">
                              <Route index element={<SubjectsList />} />
                              <Route path="create" element={<RequireRole roles={STAFF_ROLES}><SubjectsCreate /></RequireRole>} />
                              <Route path="edit/:id" element={<RequireRole roles={STAFF_ROLES}><SubjectsEdit /></RequireRole>} />
                          </Route>

                          <Route path="classes">
                              <Route index element={<ClassesList />} />
                              <Route path="create" element={<RequireRole roles={STAFF_ROLES}><ClassesCreate /></RequireRole>} />
                              <Route path="show/:id" element={<ClassesShow />} />
                              <Route path="edit/:id" element={<RequireRole roles={STAFF_ROLES}><ClassesEdit /></RequireRole>} />
                              <Route path=":id/enroll" element={<RequireRole roles={STAFF_ROLES}><EnrollStudents /></RequireRole>} />
                          </Route>

                          <Route path="attendance">
                              <Route index element={<AttendanceIndex />} />
                              <Route path="report" element={<AttendanceReport />} />
                              <Route path="qr" element={<QrAttendancePage />} />
                              <Route path="qr/scan/:token" element={<QrAttendancePage />} />
                          </Route>

                          <Route path="assignments">
                              <Route index element={<AssignmentsList />} />
                              <Route path="create" element={<RequireRole roles={STAFF_ROLES}><AssignmentsCreate /></RequireRole>} />
                              <Route path=":id" element={<AssignmentShow />} />
                          </Route>

                          <Route path="announcements">
                              <Route index element={<AnnouncementsList />} />
                              <Route path="create" element={<RequireRole roles={STAFF_ROLES}><AnnouncementsCreate /></RequireRole>} />
                          </Route>

                          <Route path="users" element={<RequireRole roles={ADMIN_ROLES}><UsersList /></RequireRole>} />

                          <Route path="grades">
                              <Route index element={<Gradebook />} />
                              <Route path="exams" element={<ExamsPage />} />
                              <Route path="report-card" element={<ReportCard />} />
                              <Route path="report-card/:id" element={<ReportCard />} />
                          </Route>

                          <Route path="calendar" element={<CalendarPage />} />
                          <Route path="profile" element={<ProfilePage />} />
                          <Route path="students/:id" element={<StudentProfilePage />} />
                          <Route path="parent" element={<RequireRole roles={[UserRole.PARENT, ...ADMIN_ROLES]}><ParentDashboard /></RequireRole>} />
                          <Route path="messages" element={<MessagesPage />} />
                          <Route path="ai-assistant" element={<RequireRole roles={STAFF_ROLES}><AiAssistantPage /></RequireRole>} />
                          <Route path="unauthorized" element={<UnauthorizedPage />} />
                          <Route path="admin/audit-logs" element={<RequireRole roles={ADMIN_ROLES}><AuditLogsPage /></RequireRole>} />
                          <Route path="admin/departments" element={<RequireRole roles={ADMIN_ROLES}><DepartmentsPage /></RequireRole>} />
                          <Route path="*" element={<NotFoundPage />} />

                      </Route>

                  </Routes>
                  </Suspense>
              <Toaster />
              <CommandPalette />
              <UnsavedChangesNotifier />
              <DocumentTitleHandler />
            </Refine>
            <DevtoolsPanel />
          </DevtoolsProvider>
        </ThemeProvider>
      </RefineKbarProvider>
    </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
