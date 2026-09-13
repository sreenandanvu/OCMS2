import React from "react";

export default function ErrorBox({
  message = "Something went wrong.",
  onRetry,
}) {
  return (
    <div className="error-box">
      <div className="error-box-icon">⚠️</div>

      <div className="error-box-content">
        <strong>Unable to load data</strong>
        <p>{message}</p>

        {onRetry && (
          <button
            type="button"
            className="secondary"
            onClick={onRetry}
          >
            Try Again
          </button>
        )}
      </div>
    </div>
  );
}