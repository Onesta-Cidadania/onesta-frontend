import { useMemo, useState } from "react";

export const usePaginatedQuery = (initialPageSize = 10) => {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSizeState] = useState(initialPageSize);
  const [total, setTotal] = useState(0);

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const setPageSize = (nextPageSize: number) => {
    setPageSizeState(nextPageSize);
    setPage(1);
  };

  const resetPage = () => setPage(1);

  return useMemo(
    () => ({
      page,
      pageSize,
      total,
      totalPages,
      from,
      to,
      setPage,
      setPageSize,
      setTotal,
      resetPage,
    }),
    [from, page, pageSize, to, total, totalPages],
  );
};
