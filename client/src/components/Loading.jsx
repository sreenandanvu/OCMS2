import React from "react";

export default function Loading({
  message = "Loading...",
  fullPage = false,
}) {
  return (
    <div className={fullPage ? "loading full-page" : "loading"}>
      <div className="loading-spinner" />
      <span>{message}</span>
    </div>
  );
}