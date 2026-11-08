// BE standardised every paginated endpoint on 1-based pages (PAGINATION_STANDARDIZATION_CONTRACT.md):
// request `?page=1` = first page, response `currentPage` / `pagination.page` = 1 on the first page.
// FE screens keep a 0-based page index internally, so convert only at the service boundary.

/** 0-based FE page index → 1-based BE `page` query param. */
export const toServerPage = (page?: number | null) => Math.max(0, page ?? 0) + 1;

/** 1-based BE page number → 0-based FE page index. */
export const fromServerPage = (page?: number | null) => Math.max(0, (page ?? 1) - 1);

/** Copy request params with `page` converted to the BE's 1-based index. */
export function withServerPage<P extends { page?: number }>(params?: P): P & { page: number } {
  return { ...(params ?? ({} as P)), page: toServerPage(params?.page) };
}
