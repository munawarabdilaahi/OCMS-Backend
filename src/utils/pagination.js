export function getPaginationParams(query) {
    const page = Math.max(Number(query.page || 1), 1);
    const requestedLimit = Number(query.limit ?? query.pageSize ?? query.page_size ?? 20);
    const limit = Math.min(Math.max(requestedLimit, 1), 100);
    const skip = (page - 1) * limit;
    return { page, limit, skip };
}

export function buildPaginationMeta(page, limit, total) {
    return { page, limit, total, totalPages: Math.ceil(total / limit) };
}
