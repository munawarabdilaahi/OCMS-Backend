export function getPaginationParams(query) {
    const pageRaw = Number(query.page || 1);
    const page = Number.isFinite(pageRaw) ? Math.max(Math.trunc(pageRaw), 1) : 1;
    const requestedRaw = Number(query.limit ?? query.pageSize ?? query.page_size ?? 20);
    const requestedLimit = Number.isFinite(requestedRaw) ? Math.trunc(requestedRaw) : 20;
    const limit = Math.min(Math.max(requestedLimit, 1), 100);
    const skip = (page - 1) * limit;
    return { page, limit, skip };
}

export function buildPaginationMeta(page, limit, total) {
    return { page, limit, total, totalPages: Math.ceil(total / limit) };
}
