import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;

// Single shared pool. Reused across all route handlers.
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.on("error", (err) => {
  // Don't crash the whole API on an idle client error — log and move on.
  console.error("[pg pool] unexpected error on idle client", err);
});

export async function query(text, params) {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  if (process.env.NODE_ENV !== "production") {
    console.log("[db]", { text, duration, rows: res.rowCount });
  }
  return res;
}
