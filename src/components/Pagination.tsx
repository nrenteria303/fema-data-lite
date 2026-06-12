interface PaginationProps {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ currentPage, pageSize, totalItems, onPageChange }: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const isFirstPage = currentPage === 1;
  const isLastPage = currentPage >= totalPages;

  return (
    <nav style={{ display: "flex", justifyContent: "center", gap: "8px", marginTop: "24px" }}>
      <button type="button" onClick={() => onPageChange(currentPage - 1)} disabled={isFirstPage}>
        Previous
      </button>
      <span style={{ alignSelf: "center" }}>
        Page {currentPage} of {totalPages}
      </span>
      <button type="button" onClick={() => onPageChange(currentPage + 1)} disabled={isLastPage}>
        Next
      </button>
    </nav>
  );
}
