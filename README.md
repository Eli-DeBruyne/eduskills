# EduSkills

A small student-data project: an Express API that serves student records from a JSON file, plus a React (Vite) frontend.

## Structure

- `server/` — Node.js Express API. `GET /api/students` returns the records stored in `server/db/students.json`.
- `client/` — React frontend scaffolded with Vite.

## Running the server

```
cd server
npm install
npm start
```

The API listens on http://localhost:3001. Try http://localhost:3001/api/students.

## Running the client

```
cd client
npm install
npm run dev
```

Vite serves the app on http://localhost:5173 by default.
