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

I split up the work into a few sections. First I created the repo locally with boilerplate code, pushed that to main, then created a secondary development branch to work on the actual project so I wouldn't interfere with production.
I then delegated tasks to a coordinator to give accurate prompts to sub-agents to create the normalization function, API route, and frontend React component.

- Did you use any AI tools? If so, which ones, what did you use them for, and what (if anything) did you change, reject, or double-check from what they gave you?

Yes I did. I used Cursor as my IDE and Claude Code for my agents. I used them to streamline the process of creating the repo, creating the functions with deliberate instructions like "create a normalization function for this json data, so fields that are missing data, or written differently for example date being something like 20260815, aug 15th 2006, 08-15-2006 all get normalized to the same type of date output yyyy-mm-dd", and auditing the code with review agents running unit tests. I didn't accept everything as-is: the audits surfaced findings I reviewed myself and made the call on — for example I replaced the normalizer's hardcoded valid-year range (1000–9999) with bounds I chose (1800 through next year, to allow pre-registration dates), and the audit reports flagged real bugs like the grade-level column sorting "10, 11, 12, 2, 3...".

- What's one trade-off or assumption you made, and what would you do differently with more time?

The biggest assumption is that ambiguous numeric dates like 08-15-2006 are US month-first (mm-dd-yyyy); if the data ever came from a day-first source that would silently produce wrong dates, so with more time I'd detect or configure the expected format per district. The trade-off was moving fast by delegating to parallel agents and catching problems with audits afterward rather than reviewing every line up front — it worked (the audits found the sorting bug and some date edge cases), but with more time I'd fix all the audit findings, add end-to-end tests against the running app, and make the client's API URL configurable instead of hardcoded to localhost:3001.

- How to run what you built.

Two terminals, using the sections above: `cd server && npm install && npm start` (API on http://localhost:3001, data at /api/students), then `cd client && npm install && npm run dev` (table UI on http://localhost:5173). Unit tests: `cd server && npm test`. CI runs the same tests plus lint/build/security checks via the GitHub Actions in `.github/workflows/`.
