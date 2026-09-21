import React from "react";

export default function Pagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
}) {
  const total = Number(totalItems) || 0;
  const pages = Math.max(Number(totalPages) || 0, 0);
  const current = Math.max(Number(currentPage) || 1, 1);
  const limit = Math.max(Number(itemsPerPage) || 25, 1);

  // No records
  if (total === 0) {
    return (
      <div className="commonPagination emptyPagination">
        <div className="paginationEmptyText">
          Total: 0
        </div>
      </div>
    );
  }

  const startItem = (current - 1) * limit + 1;

  const endItem = Math.min(
    current * limit,
    total
  );

  return (
    <div className="commonPagination">

      {/* LEFT */}
      <div className="paginationLeft">

        <select
          value={limit}
          onChange={(e) =>
            onItemsPerPageChange(
              Number(e.target.value)
            )
          }
          className="itemsPerPageSelect"
        >
          <option value={10}>
            10 items per page
          </option>

          <option value={25}>
            25 items per page
          </option>

          <option value={50}>
            50 items per page
          </option>

          <option value={100}>
            100 items per page
          </option>
        </select>

      </div>

      {/* CENTER */}
      <div className="paginationTotal">

        <strong>
          Total: {total}
        </strong>
      </div>

      {/* RIGHT */}
      <div className="paginationButtons">

        {/* PREVIOUS */}
        <button
          type="button"
          className="paginationArrow"
          disabled={current <= 1}
          onClick={() =>
            onPageChange(current - 1)
          }
        >
          ‹
        </button>

        {/* PAGE NUMBERS */}
        {Array.from(
          { length: pages },
          (_, index) => index + 1
        ).map((page) => (
          <button
            type="button"
            key={page}
            className={
              current === page
                ? "paginationPage active"
                : "paginationPage"
            }
            onClick={() =>
              onPageChange(page)
            }
          >
            {page}
          </button>
        ))}

        {/* NEXT */}
        <button
          type="button"
          className="paginationArrow"
          disabled={
            current >= pages
          }
          onClick={() =>
            onPageChange(current + 1)
          }
        >
          ›
        </button>

      </div>

    </div>
  );
}