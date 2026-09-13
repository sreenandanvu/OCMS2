import React from "react";

/*
|--------------------------------------------------------------------------
| Reusable Confirmation Modal
|--------------------------------------------------------------------------
|
| Used before destructive actions such as:
| - Delete student
| - Delete faculty
| - Delete assignment
| - Delete timetable entry
| - Remove academic records
|
|--------------------------------------------------------------------------
*/

export default function ConfirmModal({
  open = false,
  title = "Confirm Action",
  message = "Are you sure you want to continue?",
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  loading = false,
  danger = true,
}) {
  if (!open) {
    return null;
  }

  function handleBackdropClick(event) {
    if (event.target === event.currentTarget && !loading) {
      onCancel?.();
    }
  }

  return (
    <div
      className="modal-backdrop"
      onMouseDown={handleBackdropClick}
      role="presentation"
    >
      <div
        className="modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
      >
        <div className="modal-icon">
          {danger ? "⚠️" : "❓"}
        </div>

        <div className="modal-content">
          <h2 id="confirm-modal-title">{title}</h2>
          <p>{message}</p>
        </div>

        <div className="modal-actions">
          <button
            type="button"
            className="secondary"
            onClick={onCancel}
            disabled={loading}
          >
            {cancelText}
          </button>

          <button
            type="button"
            className={danger ? "danger-button" : "primary"}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "Please wait..." : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}