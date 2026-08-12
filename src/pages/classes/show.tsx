import React from 'react'
import { useShow } from "@refinedev/core";
import { Link } from "react-router";
import { ClassDetails } from "@/types";
import { ShowView, ShowViewHeader } from "@/components/refine-ui/views/show-view.tsx";
import { Card } from "@/components/ui/card.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Separator } from "@/components/ui/separator.tsx";
import { Button } from "@/components/ui/button.tsx";
import { AdvancedImage } from "@cloudinary/react";
import { bannerPhoto } from '@/lib/cloudinary.ts';

const Show = () => {
    const { query } = useShow<ClassDetails>({ resource: 'classes' });
    const classDetails = query.data?.data;
    const { isLoading, isError } = query;

    if (isLoading || isError || !classDetails) {
        return (
            <ShowView className="class-view class-show">
                <ShowViewHeader resource="classes" title="Class Details" />
                <p className={`state-message${isError ? ' is-error' : ''}`}>
                    {isLoading ? 'Loading class details...'
                        : isError ? 'Failed to load class details.'
                            : 'Class not found.'}
                </p>
            </ShowView>
        );
    }

    return (
        <ShowView className="class-view class-show">
            <ShowViewHeader resource="classes" title={classDetails.name} />

            {/* Banner */}
            {classDetails.bannerUrl && (
                <div className="banner">
                    <AdvancedImage
                        cldImg={bannerPhoto(classDetails.bannerCldPubId ?? classDetails.bannerUrl, classDetails.name)}
                    />
                </div>
            )}

            {/* Main details card */}
            <Card className="details-card">
                <div className="details-header">
                    <div>
                        <h1>{classDetails.name}</h1>
                        {classDetails.description && <p>{classDetails.description}</p>}
                    </div>
                    <div>
                        <Badge data-status={classDetails.status}>{classDetails.status}</Badge>
                        <Button asChild variant="outline">
                            <Link to={`/classes/${classDetails.id}/enroll`}>Manage Students</Link>
                        </Button>
                    </div>
                </div>

                <Separator />

                <div className="details-grid">
                    {/* Instructor */}
                    {classDetails.teacher && (
                        <div className="instructor">
                            <p>Instructor</p>
                            <div>
                                <div>
                                    <p>{classDetails.teacher.name}</p>
                                    <p>{classDetails.teacher.email ?? ''}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Department */}
                    {classDetails.department && (
                        <div className="department">
                            <p>Department</p>
                            <div>
                                <p>{classDetails.department.name}</p>
                                {classDetails.department.description && (
                                    <p>{classDetails.department.description}</p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Subject */}
                    {classDetails.subject && (
                        <div className="subject">
                            <p>Subject</p>
                            <div>
                                <p>
                                    <span>{classDetails.subject.code}</span> — {classDetails.subject.name}
                                </p>
                                {classDetails.subject.description && (
                                    <p>{classDetails.subject.description}</p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Join / Invite code */}
                    {classDetails.inviteCode && (
                        <div className="join">
                            <h2>Join this class</h2>
                            <ol>
                                <li>Open the classroom app</li>
                                <li>Go to Classes → Join</li>
                                <li>Enter code: <strong>{classDetails.inviteCode}</strong></li>
                            </ol>
                        </div>
                    )}
                </div>
            </Card>

            {/* Schedule */}
            {classDetails.schedules?.length > 0 && (
                <>
                    <Separator />
                    <div className="space-y-3">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Schedule</h3>
                        <div className="flex flex-wrap gap-3">
                            {classDetails.schedules.map((schedule, index) => (
                                <Card key={index} className="px-4 py-3 text-sm">
                                    <p className="font-bold">{schedule.day}</p>
                                    <p className="text-muted-foreground">{schedule.startTime} – {schedule.endTime}</p>
                                </Card>
                            ))}
                        </div>
                    </div>
                </>
            )}

            {/* Quick links */}
            <div className="flex flex-wrap gap-2 pt-2">
                <Button asChild variant="outline" size="sm">
                    <Link to={`/attendance?classId=${classDetails.id}`}>Mark Attendance</Link>
                </Button>
                <Button asChild variant="outline" size="sm">
                    <Link to={`/assignments?classId=${classDetails.id}`}>Assignments</Link>
                </Button>
                <Button asChild variant="outline" size="sm">
                    <Link to={`/grades?classId=${classDetails.id}`}>Gradebook</Link>
                </Button>
                <Button asChild variant="outline" size="sm">
                    <Link to={`/grades/exams?classId=${classDetails.id}`}>Exams</Link>
                </Button>
            </div>
        </ShowView>
    );
};

export default Show;
