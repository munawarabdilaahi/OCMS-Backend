export const PERMISSIONS = [
    {
        key: 'dashboard:view',
        label: 'View Dashboard',
        module: 'Dashboard',
        description: 'Open the main OCMS dashboard.',
    },
    {
        key: 'students:manage',
        label: 'Manage Students',
        module: 'Students',
        description: 'Create, update, delete, and view student records.',
    },
    {
        key: 'students:view',
        label: 'View Students',
        module: 'Students',
        description: 'View student records without changing them.',
    },
    {
        key: 'courses:manage',
        label: 'Manage Courses',
        module: 'Courses',
        description: 'Create, update, delete, and view course records.',
    },
    {
        key: 'courses:view',
        label: 'View Courses',
        module: 'Courses',
        description: 'View course catalog and course details.',
    },
    {
        key: 'attendance:manage',
        label: 'Manage Attendance',
        module: 'Attendance',
        description: 'Take attendance and review attendance reports.',
    },
    {
        key: 'attendance:view',
        label: 'View Attendance',
        module: 'Attendance',
        description: 'View attendance records without changing them.',
    },
    {
        key: 'results:manage',
        label: 'Manage Results',
        module: 'Results',
        description: 'Review and manage student result records.',
    },
    {
        key: 'results:view',
        label: 'View Results',
        module: 'Results',
        description: 'View published academic results.',
    },
    {
        key: 'payments:manage',
        label: 'Manage Payments',
        module: 'Payments',
        description: 'Review payments, invoices, and finance details.',
    },
    {
        key: 'payments:view',
        label: 'View Payments',
        module: 'Payments',
        description: 'View personal payment and invoice records.',
    },
    {
        key: 'settings:manage',
        label: 'Manage Settings',
        module: 'Settings',
        description: 'Manage users, roles, and permissions.',
    },
];

export const ROLE_PERMISSIONS_DEFAULTS = {
    Admin: ['*'],
    SuperAdmin: ['*'],
    Registrar: ['dashboard:view', 'students:manage', 'courses:manage', 'courses:view'],
    Teacher: ['dashboard:view', 'courses:view', 'attendance:manage', 'attendance:view', 'results:manage', 'results:view'],
    Accountant: ['dashboard:view', 'payments:manage', 'payments:view'],
    Student: ['dashboard:view', 'students:view', 'courses:view', 'attendance:view', 'results:view', 'payments:view'],
};

// resource:manage implies resource:view. Guard routes with the :view key and a
// manage user still passes. dashboard:view and settings:manage have no pair.
export const MANAGE_IMPLIES_VIEW = {
    'students:manage': 'students:view',
    'courses:manage': 'courses:view',
    'attendance:manage': 'attendance:view',
    'results:manage': 'results:view',
    'payments:manage': 'payments:view',
};

export const CANONICAL_ROLES = Object.keys(ROLE_PERMISSIONS_DEFAULTS);

export const ALL_PERMISSION_KEYS = PERMISSIONS.map((permission) => permission.key);

export function isKnownPermission(key) {
    return key === '*' || ALL_PERMISSION_KEYS.includes(key);
}
