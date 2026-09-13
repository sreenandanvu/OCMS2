import React from "react";

/*
|--------------------------------------------------------------------------
| Reusable Table Component
|--------------------------------------------------------------------------
|
| Usage:
|
| <Table
|   headers={["Name", "Email", "Course"]}
|   rows={[
|     ["Akhil Raj", "akhil@ocms.com", "MCA"],
|     ["Arjun Kumar", "arjun@ocms.com", "MCA"]
|   ]}
| />
|
|--------------------------------------------------------------------------
*/

export default function Table({
  headers = [],
  rows = [],
  emptyMessage = "No records found.",
  compact = false,
}) {
  return (
    <div className={compact ? "table-wrap compact" : "table-wrap"}>
      {rows.length === 0 ? (
        <div className="empty table-empty">
          {emptyMessage}
        </div>
      ) : (
        <table>
          <thead>
            <tr>
              {headers.map((header, index) => (
                <th key={index}>
                  {header}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex}>
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
