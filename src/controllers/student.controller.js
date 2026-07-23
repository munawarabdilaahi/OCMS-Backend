import prisma from '../config/db.js';
import { hashPassword } from '../utils/password.js';
const userDelegate = () => prisma.user;
const roleDelegate = () => prisma.role;
const studentDelegate = () => prisma.student;
const studentInclude = {
    user: {
        select: {
            name: true,
            email: true,
            phone: true,
        },
    },
    department: {
        select: {
            name: true,
        },
    },
};
function serializeStudent(student) {
    if (!student)
        return null;
    return {
        id: student.id,
        name: student.user?.name || '',
        email: student.user?.email || '',
        phone: student.user?.phone || '',
        gender: student.gender || '',
        department: student.department?.name || '',
        department_id: student.department_id,
        status: student.status || '',
        admission_no: student.admission_no || '',
        date_of_birth: student.date_of_birth || null,
        address: student.address || '',
    };
}
async function getStudentRoleId() {
    const role = await roleDelegate().findFirst({ where: { name: 'Student' } });
    if (role) return role.id;
    const created = await roleDelegate().create({ data: { name: 'Student', permissions: '{}' } });
    return created.id;
}
const studentDetailInclude = {
    user: {
        select: {
            name: true,
            email: true,
            phone: true,
        },
    },
    department: true,
};
export async function createStudent(req, res, next) {
    try {
        const { name, email, password, phone, department_id, departmentId, admission_no, admissionNo, date_of_birth, dateOfBirth, gender, address, status = 'ACTIVE', } = req.body;
        if (!name || !email || !password || !(department_id || departmentId)) {
            return res.status(400).json({
                success: false,
                message: 'Name, email, password, and department_id are required.',
            });
        }
        const existingUser = await userDelegate().findUnique({ where: { email } });
        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: 'A user with this email already exists.',
            });
        }
        const roleId = await getStudentRoleId();
        const hashedPassword = await hashPassword(password);
        const student = await prisma.$transaction(async (tx) => {
            const user = await tx.user.create({
                data: {
                    name,
                    email,
                    password: hashedPassword,
                    phone,
                    status,
                    role_id: roleId,
                },
            });
            return tx.student.create({
                data: {
                    user_id: user.id,
                    department_id: Number(department_id || departmentId),
                    admission_no: admission_no || admissionNo,
                    date_of_birth: date_of_birth || dateOfBirth ? new Date(date_of_birth || dateOfBirth) : null,
                    gender,
                    address,
                    status,
                },
                include: studentInclude,
            });
        });
        return res.status(201).json({
            success: true,
            message: 'Student created successfully.',
            data: serializeStudent(student),
        });
    }
    catch (error) {
        next(error);
    }
}
export async function getStats(req, res, next) {
    try {
        const [
            totalStudents,
            activeStudents,
            inactiveStudents,
            totalUsers,
            totalDepartments,
            departmentBreakdown,
            genderBreakdown,
            recentStudents,
            totalExamSchedules,
            totalExamResults,
        ] = await Promise.all([
            studentDelegate().count(),
            studentDelegate().count({ where: { status: 'ACTIVE' } }),
            studentDelegate().count({ where: { status: { not: 'ACTIVE' } } }),
            userDelegate().count(),
            prisma.department.count(),
            prisma.department.findMany({
                select: {
                    name: true,
                    _count: { select: { students: true } },
                },
            }),
            studentDelegate().groupBy({
                by: ['gender'],
                _count: { id: true },
                where: { gender: { not: null } },
            }),
            studentDelegate().findMany({
                take: 5,
                orderBy: { created_at: 'desc' },
                select: {
                    id: true,
                    status: true,
                    created_at: true,
                    user: { select: { name: true, email: true } },
                    department: { select: { name: true } },
                },
            }),
            prisma.examSchedule.count(),
            prisma.examResult.count(),
        ]);
        return res.status(200).json({
            success: true,
            data: {
                totalStudents,
                activeStudents,
                inactiveStudents,
                totalUsers,
                totalDepartments,
                totalExamSchedules,
                totalExamResults,
                departmentBreakdown: departmentBreakdown.map((d) => ({
                    name: d.name,
                    count: d._count.students,
                })),
                genderBreakdown: genderBreakdown.map((g) => ({
                    name: g.gender || 'Unspecified',
                    value: g._count.id,
                })),
                recentStudents: recentStudents.map((s) => ({
                    id: s.id,
                    name: s.user?.name || '',
                    email: s.user?.email || '',
                    department: s.department?.name || '',
                    status: s.status,
                    created_at: s.created_at,
                })),
            },
        });
    }
    catch (error) {
        next(error);
    }
}
export async function getStudents(req, res, next) {
    try {
        const page = Math.max(Number(req.query.page || 1), 1);
        const limit = Math.min(Math.max(Number(req.query.limit || 20), 1), 100);
        const search = req.query.search?.trim();
        const status = req.query.status?.trim();
        const skip = (page - 1) * limit;
        const where = {
            ...(status ? { status } : {}),
            ...(search
                ? {
                    OR: [
                        { admission_no: { contains: search, mode: 'insensitive' } },
                        { user: { name: { contains: search, mode: 'insensitive' } } },
                        { user: { email: { contains: search, mode: 'insensitive' } } },
                        { department: { name: { contains: search, mode: 'insensitive' } } },
                    ],
                }
                : {}),
        };
        const [students, total] = await Promise.all([
            studentDelegate().findMany({
                where,
                include: studentInclude,
                skip,
                take: limit,
                orderBy: { created_at: 'desc' },
            }),
            studentDelegate().count({ where }),
        ]);
        return res.status(200).json({
            success: true,
            message: 'Students retrieved successfully.',
            data: students.map(serializeStudent),
            meta: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    }
    catch (error) {
        next(error);
    }
}
export async function getStudentById(req, res, next) {
    try {
        const student = await studentDelegate().findUnique({
            where: { id: Number(req.params.id) },
            include: studentDetailInclude,
        });
        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Student not found.',
            });
        }
        return res.status(200).json({
            success: true,
            message: 'Student retrieved successfully.',
            data: {
                id: student.id,
                name: student.user?.name || '',
                email: student.user?.email || '',
                phone: student.user?.phone || '',
                gender: student.gender || '',
                department: student.department?.name || '',
                department_id: student.department_id,
                status: student.status || '',
                admission_no: student.admission_no || '',
                date_of_birth: student.date_of_birth || null,
                address: student.address || '',
                created_at: student.created_at,
            },
        });
    }
    catch (error) {
        next(error);
    }
}
export async function updateStudent(req, res, next) {
    try {
        const studentId = Number(req.params.id);
        const existingStudent = await studentDelegate().findUnique({
            where: { id: studentId },
            include: { user: true },
        });
        if (!existingStudent) {
            return res.status(404).json({
                success: false,
                message: 'Student not found.',
            });
        }
        const { name, email, phone, department_id, departmentId, admission_no, admissionNo, date_of_birth, dateOfBirth, gender, address, status, } = req.body;
        const student = await prisma.$transaction(async (tx) => {
            const userUpdate = {};
            if (name !== undefined) userUpdate.name = name;
            if (email !== undefined) userUpdate.email = email;
            if (phone !== undefined) userUpdate.phone = phone;
            if (status !== undefined) userUpdate.status = status;

            if (Object.keys(userUpdate).length > 0) {
                await tx.user.update({ where: { id: existingStudent.user_id }, data: userUpdate });
            }

            const studentUpdate = {};
            if (department_id !== undefined || departmentId !== undefined) {
                studentUpdate.department_id = Number(department_id || departmentId);
            }
            if (admission_no !== undefined || admissionNo !== undefined) {
                studentUpdate.admission_no = admission_no || admissionNo;
            }
            if (date_of_birth !== undefined || dateOfBirth !== undefined) {
                studentUpdate.date_of_birth = (date_of_birth || dateOfBirth) ? new Date(date_of_birth || dateOfBirth) : null;
            }
            if (gender !== undefined) studentUpdate.gender = gender;
            if (address !== undefined) studentUpdate.address = address;
            if (status !== undefined) studentUpdate.status = status;

            return tx.student.update({
                where: { id: studentId },
                data: studentUpdate,
                include: studentInclude,
            });
        });
        return res.status(200).json({
            success: true,
            message: 'Student updated successfully.',
            data: serializeStudent(student),
        });
    }
    catch (error) {
        next(error);
    }
}
export async function updateStudentStatus(req, res, next) {
    try {
        const studentId = Number(req.params.id);
        const { status = 'INACTIVE' } = req.body;
        const existingStudent = await studentDelegate().findUnique({
            where: { id: studentId },
        });
        if (!existingStudent) {
            return res.status(404).json({
                success: false,
                message: 'Student not found.',
            });
        }
        const student = await prisma.$transaction(async (tx) => {
            await tx.user.update({
                where: { id: existingStudent.user_id },
                data: { status },
            });
            return tx.student.update({
                where: { id: studentId },
                data: { status },
                include: studentInclude,
            });
        });
        return res.status(200).json({
            success: true,
            message: 'Student status updated successfully.',
            data: serializeStudent(student),
        });
    }
    catch (error) {
        next(error);
    }
}
export async function deleteStudent(req, res, next) {
  try {
    const studentId = Number(req.params.id);
    const existingStudent = await studentDelegate().findUnique({
      where: { id: studentId },
    });
    if (!existingStudent) {
      return res.status(404).json({
        success: false,
        message: 'Student not found.',
      });
    }

    const student = await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: existingStudent.user_id },
        data: { status: 'DELETED' },
      });
      return tx.student.update({
        where: { id: studentId },
        data: { status: 'DELETED' },
        include: studentInclude,
      });
    });

    return res.status(200).json({
      success: true,
      message: 'Student deleted successfully.',
      data: serializeStudent(student),
    });
  } catch (error) {
    next(error);
  }
}
