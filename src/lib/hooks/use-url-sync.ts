"use client";

import { useEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { TableParams } from "@/constants/types/table";
import { useNavigationStore } from "@/shared/stores/navigation-store";
import { useTableStore } from "@/shared/stores/table-store";

// Debounce function
function useDebounce<T extends (...args: Parameters<T>) => ReturnType<T>>(
  callback: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;

  return useCallback(
    (...args: Parameters<T>) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => callback(...args), delay);
    },
    [callback, delay]
  );
}

// Serialize table params to URL search params
function serializeParams(params: TableParams): URLSearchParams {
  const searchParams = new URLSearchParams();

  // Search
  if (params.search) {
    searchParams.set("search", params.search);
  }

  // Filters
  Object.entries(params.filters).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== "") {
      if (Array.isArray(value) && value.length > 0) {
        searchParams.set(`filter_${key}`, value.join(","));
      } else if (!Array.isArray(value)) {
        if (value instanceof Date) {
          searchParams.set(`filter_${key}`, value.toISOString());
        } else {
          searchParams.set(`filter_${key}`, String(value));
        }
      }
    }
  });

  // Sort
  if (params.sort) {
    searchParams.set("sort", `${params.sort.key}:${params.sort.direction}`);
  }

  // Pagination
  if (params.pagination.page > 1) {
    searchParams.set("page", String(params.pagination.page));
  }
  if (params.pagination.pageSize !== 10) {
    searchParams.set("pageSize", String(params.pagination.pageSize));
  }

  return searchParams;
}

// Parse URL search params to table params
function parseParams(searchParams: URLSearchParams): Partial<TableParams> {
  const params: Partial<TableParams> = {
    filters: {},
    pagination: {},
  };

  // Search
  const search = searchParams.get("search");
  if (search) {
    params.search = search;
  }

  // Filters
  const filters: Record<string, string | string[] | number | Date> = {};
  searchParams.forEach((value, key) => {
    if (key.startsWith("filter_")) {
      const filterKey = key.replace("filter_", "");

      // Try to parse as date
      if (value.includes("T") && value.includes("Z")) {
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
          filters[filterKey] = date;
          return;
        }
      }

      // Try to parse as number
      if (!isNaN(Number(value)) && value !== "") {
        filters[filterKey] = Number(value);
        return;
      }

      // Parse as array if contains comma
      if (value.includes(",")) {
        filters[filterKey] = value.split(",");
        return;
      }

      // Default to string
      filters[filterKey] = value;
    }
  });
  if (Object.keys(filters).length > 0) {
    params.filters = filters;
  }

  // Sort
  const sort = searchParams.get("sort");
  if (sort && sort.includes(":")) {
    const [key, direction] = sort.split(":");
    if (direction === "asc" || direction === "desc") {
      params.sort = { key, direction };
    }
  }

  // Pagination
  const page = searchParams.get("page");
  const pageSize = searchParams.get("pageSize");

  // Set defaults to ensure both page and pageSize are always numbers
  const defaultPage = 1;
  const defaultPageSize = 10;

  const parsedPage = page && !isNaN(Number(page)) ? Number(page) : defaultPage;
  const parsedPageSize =
    pageSize && !isNaN(Number(pageSize)) ? Number(pageSize) : defaultPageSize;

  params.pagination = { page: parsedPage, pageSize: parsedPageSize, total: 0 };

  return params;
}

export function useUrlSync() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { params, setSearch, setFilter, clearFilters, setSort, setPagination } =
    useTableStore();
  const { isNavigating } = useNavigationStore();

  // Track initialization state per page
  const isInitializedRef = useRef(false);
  const currentPathnameRef = useRef(pathname);

  // Debounced URL update - ONLY if not navigating
  const debouncedUpdateUrl = useDebounce((newParams: TableParams) => {
    // NEVER update URL if navigating
    if (isNavigating) {
      return;
    }

    const urlParams = serializeParams(newParams);
    const urlString = urlParams.toString();
    const newUrl = urlString ? `${pathname}?${urlString}` : pathname;

    const currentUrl = `${pathname}${
      searchParams.toString() ? `?${searchParams.toString()}` : ""
    }`;
    if (newUrl !== currentUrl) {
      router.replace(newUrl, { scroll: false });
    }
  }, 300);

  // Reset when pathname changes
  useEffect(() => {
    if (currentPathnameRef.current !== pathname) {
      currentPathnameRef.current = pathname;
      isInitializedRef.current = false;
    }
  }, [pathname]);

  // Initialize from URL only once per page
  useEffect(() => {
    if (!isInitializedRef.current && !isNavigating) {
      const urlParams = parseParams(searchParams);

      if (urlParams.search !== undefined) {
        setSearch(urlParams.search);
      }

      if (urlParams.filters && Object.keys(urlParams.filters).length > 0) {
        Object.entries(urlParams.filters).forEach(([key, value]) => {
          setFilter(key, value);
        });
      }

      if (urlParams.sort) {
        setSort(urlParams.sort);
      }

      if (urlParams.pagination) {
        setPagination(urlParams.pagination);
      }

      isInitializedRef.current = true;
    }
  }, [
    searchParams,
    isNavigating,
    setSearch,
    setFilter,
    setSort,
    setPagination,
  ]);

  // Update URL when params change - ONLY if initialized and not navigating
  useEffect(() => {
    if (isInitializedRef.current && !isNavigating) {
      debouncedUpdateUrl(params);
    }
  }, [params, isNavigating, debouncedUpdateUrl]);

  return {
    updateUrl: (newParams: TableParams) => {
      if (!isNavigating) {
        debouncedUpdateUrl(newParams);
      }
    },
    parseCurrentUrl: () => parseParams(searchParams),
    clearUrl: () => {
      if (!isNavigating) {
        router.replace(pathname, { scroll: false });
      }
    },
  };
}
