import React from "react";

export default function Empty({
  title = "No records found",
  message = "There is nothing to display here yet.",
  actionText = "",
  onAction,
}) {
  return (
    <div className="empty-state">
      <div className="empty-icon">📭</div>

      <h3>{title}</h3>

      <p>{message}</p>

      {actionText && onAction && (
        <button
          type="button"
          className="primary"
          onClick={onAction}
        >
          {actionText}
        </button>
      )}
    </div>
  );
}