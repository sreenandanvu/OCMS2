# OCMS 2

A modular Online College Management System.

## Structure

- `client/src/admin` — administrator modules
- `client/src/faculty` — faculty modules
- `client/src/student` — student modules
- `client/src/components` — shared UI components
- `client/src/services` — API services
- `server` — Express API

The application uses a drill-down attendance flow: **Student → Date → Full day attendance**.
