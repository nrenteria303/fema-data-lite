import { useState, useMemo, useEffect, useRef } from "react";
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
  const [localValue, setLocalValue] = useState(currentPage.toString());

  const debouncedHandler = useMemo(
    () =>
      debounce((value) => {
        const num = Number(value);
        onPageChange(num);
      }, 1500),
    [onPageChange],
  );

  useEffect(() => {
    return () => debouncedHandler.cancel();
  }, [debouncedHandler]);

  // Keep local input value synchronized when the current page or total pages change
  const isInputFocused = useRef(false);

  useEffect(() => {
    if (isInputFocused.current) return;

    const newVal = currentPage.toString();
    setLocalValue((prev) => (prev !== newVal ? newVal : prev));
  }, [currentPage, totalPages]);

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
          onFocus={() => (isInputFocused.current = true)}
          onBlur={() => {
            isInputFocused.current = false;
            debouncedHandler.flush();
            setLocalValue(currentPage.toString());
          }}
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
