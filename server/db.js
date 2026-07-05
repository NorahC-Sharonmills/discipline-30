import pg from "pg";

const { Pool } = pg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

pool.on("error", (error) => {
  console.error("PostgreSQL pool error", error);
});

export function query(text, params) {
  return pool.query(text, params);
}
