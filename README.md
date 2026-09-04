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


## Questions

- How did you approach the problem before writing any code? What did you look at first, and why?
I split up the work into a few sections, first I created the repo locally with boilerplate code, pushed that to main then created a secondary developement branch to work on the actual project to not interfere with production.
I then deligated tasks to a cordinator to give accurate prompts to sub agents to create the normalization, api route, and frontend react component
- Did you use any AI tools? If so, which ones, what did you use them for, and what (if anything) did you change, reject, or double-check from what they gave you?
Yes I did, I used cursor as my IDE, and claude code for my agents. I used them to streamline the process of creating the repo, creating the functions with deliberate instructions like "create a normalization function for this json data, so fields that are missing data, or written differently for example date being something like 20260815, aug 15th 2006, 08-15-2006 all get normalized to the same type of date output yyyy-mm-dd" and auditing the code with a review agent running unit tests.
- What's one trade-off or assumption you made, and what would you do differently with more time?
I was quick delegating tasks
- How to run what you built.