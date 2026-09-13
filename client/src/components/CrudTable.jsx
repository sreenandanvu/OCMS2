import React from "react";
import Table from "./Table";
import Empty from "./Empty";
import Loading from "./Loading";
import ErrorBox from "./ErrorBox";

export default function CrudTable({
  columns = [],
  data = [],
  loading = false,
  error = "",
  onRetry,
  onEdit,
  onDelete,
  emptyTitle = "No records found",
  emptyMessage = "There are no records to display.",
  editLabel = "Edit",
  deleteLabel = "Delete",
}) {
  if (loading) {
    return <Loading message="Loading records..." />;
  }

  if (error) {
    return (
      <ErrorBox
        message={error}
        onRetry={onRetry}
      />
    );
  }

  if (!data.length) {
    return (
      <Empty
        title={emptyTitle}
        message={emptyMessage}
      />
    );
  }

  const headers = [
    ...columns.map((column) => column.label),
    "Actions",
  ];

  const rows = data.map((item) => [
    ...columns.map((column) => {
      if (typeof column.render === "function") {
        return column.render(item);
      }

      return item[column.key] ?? "-";
    }),

    <div className="table-actions" key={item._id || item.id}>
      {onEdit && (
        <button
          type="button"
          className="table-action edit"
          onClick={() => onEdit(item)}
        >
          {editLabel}
        </button>
      )}

      {onDelete && (
        <button
          type="button"
          className="table-action delete"
          onClick={() => onDelete(item)}
        >
          {deleteLabel}
        </button>
      )}
    </div>,
  ]);

  return <Table headers={headers} rows={rows} />;
}