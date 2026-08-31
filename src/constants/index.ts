// Product name. The rest of the app (auth screens, PDFs, QR page, command
// palette) already says "Academix"; App.tsx and the sidebar were the two
// hold-outs still saying "ClassroomMS" / "Classroom Management".
export const APP_NAME = "Academix";
export const APP_TAGLINE = "School management";

// NOTE: this fixed list predates the `departments` DB table and is still used
// as the department filter on the subjects list. It should eventually be
// replaced by a fetch of the real departments — see subjects/list.tsx.
export const DEPARTMENTS = [
    "Computer Science",
    "Mathematics",
    "Physics",
    "Chemistry",
    "Biology",
    "English",
    "History",
    "Geography",
    "Economics",
    "Business Administration",
    "Engineering",
    "Psychology",
    "Sociology",
    "Political Science",
    "Philosophy",
    "Education",
    "Fine Arts",
    "Music",
    "Physical Education",
    "Law",
] as const;

export const DEPARTMENT_OPTIONS = DEPARTMENTS.map((dept) => ({
    value: dept,
    label: dept,
}));

export const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
export const CLOUDINARY_API_KEY = import.meta.env.VITE_CLOUDINARY_API_KEY;
export const BACKEND_BASE_URL = import.meta.env.VITE_BACKEND_BASE_URL;

// One-line context shown under the page title in the global header, keyed by
// Refine resource name (see the `resources` list in App.tsx). Routes with no
// matching resource (e.g. /profile) simply render without a description.
export const PAGE_META: Record<string, string> = {
    dashboard: "Your school at a glance.",
    subjects: "Manage the subjects taught across your school.",
    classes: "Browse and manage classes.",
    attendance: "Record and review attendance.",
    assignments: "Create and track assignments.",
    announcements: "Post and read school announcements.",
    grades: "Gradebook, exams, and report cards.",
    calendar: "Classes, exams, and deadlines on one timeline.",
    insights: "Attendance, performance, and activity trends.",
    messages: "Direct messages with your school community.",
};
