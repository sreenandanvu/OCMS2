import React from "react";


export default function Form({
  title,
  description,
  fields = [],
  values = {},
  onChange,
  onSubmit,
  submitText = "Save",
  cancelText = "Cancel",
  onCancel,
  loading = false,
  error = "",
}) {
  function handleChange(event) {
    const { name, value, type, checked } = event.target;

    if (typeof onChange === "function") {
      onChange(name, type === "checkbox" ? checked : value);
    }
  }

  return (
    <div className="form-card">
      {(title || description) && (
        <div className="form-header">
          {title && <h2>{title}</h2>}
          {description && <p>{description}</p>}
        </div>
      )}

      {error && (
        <div className="error form-error">
          {error}
        </div>
      )}

      <form onSubmit={onSubmit}>
        <div className="form-grid">
          {fields.map((field) => {
            const {
              name,
              label,
              type = "text",
              placeholder = "",
              options = [],
              required = false,
              disabled = false,
              min,
              max,
              step,
              rows = 4,
            } = field;

            const value = values[name] ?? "";

            return (
              <div
                className={
                  type === "textarea" || type === "checkbox"
                    ? "form-group full-width"
                    : "form-group"
                }
                key={name}
              >
                {type === "checkbox" ? (
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name={name}
                      checked={Boolean(value)}
                      onChange={handleChange}
                      disabled={disabled || loading}
                    />
                    <span>{label}</span>
                  </label>
                ) : (
                  <>
                    <label htmlFor={name}>
                      {label}
                      {required && <span className="required">*</span>}
                    </label>

                    {type === "select" ? (
                      <select
                        id={name}
                        name={name}
                        value={value}
                        onChange={handleChange}
                        required={required}
                        disabled={disabled || loading}
                      >
                        <option value="">
                          {placeholder || `Select ${label}`}
                        </option>

                        {options.map((option) => {
                          const optionValue =
                            typeof option === "object"
                              ? option.value
                              : option;

                          const optionLabel =
                            typeof option === "object"
                              ? option.label
                              : option;

                          return (
                            <option
                              key={optionValue}
                              value={optionValue}
                            >
                              {optionLabel}
                            </option>
                          );
                        })}
                      </select>
                    ) : type === "textarea" ? (
                      <textarea
                        id={name}
                        name={name}
                        value={value}
                        onChange={handleChange}
                        placeholder={placeholder}
                        required={required}
                        disabled={disabled || loading}
                        rows={rows}
                      />
                    ) : (
                      <input
                        id={name}
                        name={name}
                        type={type}
                        value={value}
                        onChange={handleChange}
                        placeholder={placeholder}
                        required={required}
                        disabled={disabled || loading}
                        min={min}
                        max={max}
                        step={step}
                      />
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>

        <div className="form-actions">
          {onCancel && (
            <button
              type="button"
              className="secondary"
              onClick={onCancel}
              disabled={loading}
            >
              {cancelText}
            </button>
          )}

          <button
            type="submit"
            className="primary"
            disabled={loading}
          >
            {loading ? "Saving..." : submitText}
          </button>
        </div>
      </form>
    </div>
  );
}