# My Day

A React + Vite calendar app with an Express API and MySQL database.

## Run locally

1. Copy `.env.example` to `.env` and set `DB_PASSWORD` to the password for your local MySQL user. Set `DB_USER`, `DB_HOST`, and `DB_PORT` too if your MySQL setup differs from the defaults. The MySQL user needs permission to create the `my_day` database and its tables.
2. In one terminal, run `npm run server` to start the API on port 3001.
3. In a second terminal, run `npm run dev` to start the Vite frontend.

The frontend initializes the database schema when the API is available. To check MySQL access directly, open `http://localhost:3001/api/test-connection`; a successful response reports `MySQL connection successful`. Schema setup is available at `http://localhost:3001/api/setup-database`.
