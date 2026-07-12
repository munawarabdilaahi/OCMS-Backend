import bcrypt from 'bcryptjs';
import prisma from '../config/db.js';
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
        const hashedPassword = await bcrypt.hash(password, 12);
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
        const [totalStudents, activeStudents, totalUsers, totalDepartments] = await Promise.all([
            studentDelegate().count(),
            studentDelegate().count({ where: { status: 'ACTIVE' } }),
            userDelegate().count(),
            prisma.department.count(),
        ]);
        return res.status(200).json({
            success: true,
            data: { totalStudents, activeStudents, totalUsers, totalDepartments },
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
            if (name || email || phone || status) {
                await tx.user.update({
                    where: { id: existingStudent.user_id },
                    data: {
                        ...(name ? { name } : {}),
                        ...(email ? { email } : {}),
                        ...(phone ? { phone } : {}),
                        ...(status ? { status } : {}),
                    },
                });
            }
            return tx.student.update({
                where: { id: studentId },
                data: {
                    ...(department_id || departmentId ? { department_id: Number(department_id || departmentId) } : {}),
                    ...(admission_no || admissionNo ? { admission_no: admission_no || admissionNo } : {}),
                    ...(date_of_birth || dateOfBirth ? { date_of_birth: new Date(date_of_birth || dateOfBirth) } : {}),
                    ...(gender ? { gender } : {}),
                    ...(address ? { address } : {}),
                    ...(status ? { status } : {}),
                },
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
