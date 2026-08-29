import { Link } from "react-router";
import { ArrowLeft, Activity } from "lucide-react";
import { RecentActivity } from "@/components/dashboard/recent-activity";

const ActivityPage = () => {
    return (
        <div className="space-y-6">
            <div>
                <Link
                    to="/"
                    className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Back to dashboard
                </Link>
                <div className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-muted-foreground" />
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight">All Activity</h1>
                        <p className="text-sm text-muted-foreground">
                            Every recent announcement, assignment, and submission across the school.
                        </p>
                    </div>
                </div>
            </div>

            <RecentActivity limit={100} showReadMore={false} />
        </div>
    );
};

export default ActivityPage;
