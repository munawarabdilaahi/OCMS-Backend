import prisma from '../config/db.js';
import { getTeacherInfo } from '../utils/rbac.js';

export async function getAdminDashboard() {
    const [
        totalStudents,
        activeStudents,
        totalTeachers,
        totalCourses,
        totalDepartments,
        attendanceCounts,
        examSchedules,
        examResults,
        invoiceStats,
        paymentThisMonth,
        recentStudents,
    ] = await Promise.all([
        prisma.student.count(),
        prisma.student.count({ where: { status: 'ACTIVE' } }),
        prisma.teacher.count(),
        prisma.course.count(),
        prisma.department.count(),
        prisma.attendance.groupBy({
            by: ['status'],
            _count: { id: true },
        }),
        prisma.examSchedule.count(),
        prisma.examResult.count(),
        prisma.invoice.aggregate({
            _sum: { amount: true, balance: true },
            _count: { id: true },
            where: { status: { in: ['Pending', 'Partial', 'Overdue'] } },
        }),
        prisma.payment.aggregate({
            _sum: { amount: true },
            where: {
                status: 'Completed',
                created_at: {
                    gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
                },
            },
        }),
        prisma.student.findMany({
            take: 5,
            orderBy: { created_at: 'desc' },
            select: {
                id: true,
                admission_no: true,
                status: true,
                created_at: true,
                user: { select: { name: true, email: true } },
                department: { select: { name: true } },
            },
        }),
    ]);

    const attendanceBreakdown = { PRESENT: 0, ABSENT: 0, LATE: 0 };
    let attendanceTotal = 0;
    for (const row of attendanceCounts) {
        attendanceBreakdown[row.status] = row._count.id;
        attendanceTotal += row._count.id;
    }

    return {
        students: {
            total: totalStudents,
            active: activeStudents,
            inactive: totalStudents - activeStudents,
        },
        teachers: { total: totalTeachers },
        courses: { total: totalCourses },
        departments: { total: totalDepartments },
        attendance: {
            total: attendanceTotal,
            present: attendanceBreakdown.PRESENT,
            absent: attendanceBreakdown.ABSENT,
            late: attendanceBreakdown.LATE,
            rate: attendanceTotal > 0
                ? Math.round(((attendanceBreakdown.PRESENT + attendanceBreakdown.LATE) / attendanceTotal) * 100)
                : 0,
        },
        exams: {
            schedules: examSchedules,
            results: examResults,
        },
        finance: {
            total_invoiced: invoiceStats._sum.amount || 0,
            outstanding: invoiceStats._sum.balance || 0,
            open_invoices: invoiceStats._count.id || 0,
            total_received: paymentThisMonth._sum.amount || 0,
        },
        recentStudents: recentStudents.map((s) => ({
            id: s.id,
            name: s.user?.name || '',
            email: s.user?.email || '',
            department: s.department?.name || '',
            admission_no: s.admission_no || '',
            status: s.status,
            created_at: s.created_at,
        })),
    };
}

export async function getTeacherDashboard(user) {
    const teacherInfo = await getTeacherInfo(user);
    if (!teacherInfo || !teacherInfo.teacherId) {
        return null;
    }

    const teacher = await prisma.teacher.findUnique({
        where: { id: teacherInfo.teacherId },
        select: {
            id: true,
            employee_no: true,
            user: { select: { name: true, email: true } },
            department: { select: { name: true } },
            courses: {
                where: { status: 'ACTIVE' },
                select: {
                    id: true,
                    code: true,
                    title: true,
                },
            },
        },
    });

    if (!teacher) return null;

    const courseIds = teacher.courses.map((c) => c.id);

    const [enrollmentCounts, attendanceCounts, upcomingExams, recentResults] = await Promise.all([
        prisma.enrollment.groupBy({
            by: ['course_id'],
            _count: { student_id: true },
            where: { course_id: { in: courseIds } },
        }),
        prisma.attendance.groupBy({
            by: ['status'],
            _count: { id: true },
            where: { course_id: { in: courseIds } },
        }),
        prisma.examSchedule.findMany({
            where: {
                course_id: { in: courseIds },
                exam_date: { gte: new Date() },
                status: { not: 'CANCELLED' },
            },
            orderBy: { exam_date: 'asc' },
            take: 5,
            select: {
                id: true,
                title: true,
                exam_date: true,
                exam_type: true,
                course: { select: { code: true, title: true } },
            },
        }),
        prisma.examResult.findMany({
            where: { course_id: { in: courseIds } },
            orderBy: { created_at: 'desc' },
            take: 5,
            select: {
                id: true,
                total_score: true,
                status: true,
                created_at: true,
                student: { select: { user: { select: { name: true } }, admission_no: true } },
                course: { select: { code: true, title: true } },
            },
        }),
    ]);

    const enrollmentMap = {};
    let totalStudents = 0;
    for (const e of enrollmentCounts) {
        enrollmentMap[e.course_id] = e._count.student_id;
        totalStudents += e._count.student_id;
    }

    const attendanceBreakdown = { PRESENT: 0, ABSENT: 0, LATE: 0 };
    let attendanceTotal = 0;
    for (const row of attendanceCounts) {
        attendanceBreakdown[row.status] = row._count.id;
        attendanceTotal += row._count.id;
    }

    return {
        profile: {
            name: teacher.user?.name || '',
            email: teacher.user?.email || '',
            employee_no: teacher.employee_no || '',
            department: teacher.department?.name || '',
        },
        courses: teacher.courses.map((c) => ({
            id: c.id,
            code: c.code || '',
            title: c.title,
            studentCount: enrollmentMap[c.id] || 0,
        })),
        totalStudents,
        attendance: {
            total: attendanceTotal,
            present: attendanceBreakdown.PRESENT,
            absent: attendanceBreakdown.ABSENT,
            late: attendanceBreakdown.LATE,
            rate: attendanceTotal > 0
                ? Math.round(((attendanceBreakdown.PRESENT + attendanceBreakdown.LATE) / attendanceTotal) * 100)
                : 0,
        },
        upcomingExams: upcomingExams.map((e) => ({
            id: e.id,
            title: e.title,
            type: e.exam_type || '',
            course: e.course?.title || '',
            courseCode: e.course?.code || '',
            date: e.exam_date,
        })),
        recentResults: recentResults.map((r) => ({
            id: r.id,
            studentName: r.student?.user?.name || '',
            admission_no: r.student?.admission_no || '',
            course: r.course?.title || '',
            courseCode: r.course?.code || '',
            score: Number(r.total_score),
            status: r.status,
            date: r.created_at,
        })),
    };
}

export async function getStudentDashboard(user) {
    const student = await prisma.student.findUnique({
        where: { user_id: user.id },
        select: {
            id: true,
            admission_no: true,
            date_of_birth: true,
            gender: true,
            user: { select: { name: true, email: true, phone: true } },
            department: { select: { name: true } },
            enrollments: {
                where: { status: 'ACTIVE' },
                select: {
                    course_id: true,
                    course: {
                        select: {
                            id: true,
                            code: true,
                            title: true,
                            teacher: { select: { user: { select: { name: true } } } },
                        },
                    },
                },
            },
        },
    });

    if (!student) return null;

    const courseIds = student.enrollments.map((e) => e.course_id);

    const [attendanceCounts, results, upcomingExams, attendanceByCourse] = await Promise.all([
        prisma.attendance.groupBy({
            by: ['status'],
            _count: { id: true },
            where: { student_id: student.id, course_id: { in: courseIds } },
        }),
        prisma.examResult.findMany({
            where: { student_id: student.id, course_id: { in: courseIds } },
            orderBy: { created_at: 'desc' },
            take: 5,
            select: {
                id: true,
                total_score: true,
                midterm_score: true,
                final_score: true,
                activity_score: true,
                status: true,
                created_at: true,
                course: { select: { code: true, title: true } },
            },
        }),
        prisma.examSchedule.findMany({
            where: {
                course_id: { in: courseIds },
                exam_date: { gte: new Date() },
                status: { not: 'CANCELLED' },
            },
            orderBy: { exam_date: 'asc' },
            take: 5,
            select: {
                id: true,
                title: true,
                exam_date: true,
                exam_type: true,
                course: { select: { code: true, title: true } },
            },
        }),
        prisma.attendance.groupBy({
            by: ['course_id', 'status'],
            _count: { id: true },
            where: { student_id: student.id, course_id: { in: courseIds } },
        }),
    ]);

    const attendanceBreakdown = { PRESENT: 0, ABSENT: 0, LATE: 0 };
    let attendanceTotal = 0;
    for (const row of attendanceCounts) {
        attendanceBreakdown[row.status] = row._count.id;
        attendanceTotal += row._count.id;
    }

    const courseAttendanceMap = {};
    for (const row of attendanceByCourse) {
        if (!courseAttendanceMap[row.course_id]) {
            courseAttendanceMap[row.course_id] = { PRESENT: 0, ABSENT: 0, LATE: 0, total: 0 };
        }
        courseAttendanceMap[row.course_id][row.status] = row._count.id;
        courseAttendanceMap[row.course_id].total += row._count.id;
    }

    let totalScore = 0;
    for (const r of results) {
        totalScore += Number(r.total_score);
    }

    return {
        profile: {
            name: student.user?.name || '',
            email: student.user?.email || '',
            phone: student.user?.phone || '',
            admission_no: student.admission_no || '',
            department: student.department?.name || '',
        },
        courses: student.enrollments.map((e) => {
            const ca = courseAttendanceMap[e.course_id] || { PRESENT: 0, ABSENT: 0, LATE: 0, total: 0 };
            return {
                id: e.course.id,
                code: e.course.code || '',
                title: e.course.title,
                teacher: e.course.teacher?.user?.name || '',
                attendanceRate: ca.total > 0
                    ? Math.round(((ca.PRESENT + ca.LATE) / ca.total) * 100)
                    : null,
            };
        }),
        attendance: {
            total: attendanceTotal,
            present: attendanceBreakdown.PRESENT,
            absent: attendanceBreakdown.ABSENT,
            late: attendanceBreakdown.LATE,
            rate: attendanceTotal > 0
                ? Math.round(((attendanceBreakdown.PRESENT + attendanceBreakdown.LATE) / attendanceTotal) * 100)
                : 0,
        },
        recentResults: results.map((r) => ({
            id: r.id,
            course: r.course?.title || '',
            courseCode: r.course?.code || '',
            total_score: Number(r.total_score),
            midterm_score: Number(r.midterm_score),
            final_score: Number(r.final_score),
            activity_score: Number(r.activity_score),
            status: r.status,
            date: r.created_at,
        })),
        upcomingExams: upcomingExams.map((e) => ({
            id: e.id,
            title: e.title,
            type: e.exam_type || '',
            course: e.course?.title || '',
            courseCode: e.course?.code || '',
            date: e.exam_date,
        })),
        progress: {
            enrolledCourses: student.enrollments.length,
            resultsCount: results.length,
            totalScore,
            averageScore: results.length > 0 ? Math.round(totalScore / results.length) : 0,
        },
    };
}
