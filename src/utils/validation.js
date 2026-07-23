const INACTIVE_STATUSES = ['INACTIVE', 'SUSPENDED', 'DELETED', 'DISABLED'];

export function isInactive(status) {
    return INACTIVE_STATUSES.includes(String(status || '').toUpperCase());
}

export function isAllowedStatus(status, allowedStatuses) {
    return allowedStatuses.includes(status);
}
