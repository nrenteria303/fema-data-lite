import { useState, useMemo, useEffect } from "react";
import {debounce} from "lodash";
import "./Pagination.css";

interface PaginationProps {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  isLoading: boolean;
  inputId: string;
  onPageChange: (page: number) => void;
}

export function Pagination({
  currentPage,
  pageSize,
  totalItems,
  isLoading,
  inputId,
  onPageChange,
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const isFirstPage = currentPage === 1;
  const isLastPage = currentPage >= totalPages;
  const [localValue, setLocalValue] = useState("1");

  const debouncedHandler = useMemo(
    () =>
      debounce((value) => {
        const num = Number(value);
        onPageChange(num);
      }, 1500),
    [],
  );

  useEffect(() => {
    return () => debouncedHandler.cancel();
  }, [debouncedHandler]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = parseInt(e.target.value);
    if (!value || isNaN(value) || value < 1) value = 1;
    else if (value > totalPages) value = totalPages;
    setLocalValue(value.toString());
    debouncedHandler(value);
  };

  const clickHandler = (value: number) => {
    setLocalValue(value.toString());
    onPageChange(value);
  };

  return (
    <nav className="pagination-nav">
      <button
        type="button"
        onClick={() => clickHandler(currentPage - 1)}
        disabled={isFirstPage || isLoading}
      >
        Previous
      </button>
      <span style={{ alignSelf: "center" }}>
        <label htmlFor={`page-input-${inputId}`}>Page</label>
        <input
          id={`page-input-${inputId}`}
          type="number"
          value={localValue}
          onChange={handleChange}
          disabled={isLoading || totalPages == 1}
          className="pagination-input"
        />
        of {totalPages}
      </span>
      <button
        type="button"
        onClick={() => clickHandler(currentPage + 1)}
        disabled={isLastPage || isLoading}
      >
        Next
      </button>
    </nav>
  );
}
