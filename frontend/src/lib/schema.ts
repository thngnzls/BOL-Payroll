import pool from "@/lib/db";

/**
 * Ensures all required tables exist in the Supabase PostgreSQL database.
 * Called lazily on first API request.
 */
let initialized = false;

export async function ensureTables() {
  if (initialized) return;

  await pool.query(`
    CREATE TABLE IF NOT EXISTS employees (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      experience VARCHAR(100) NOT NULL,
      daily_rate DOUBLE PRECISION NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS attendances (
      id SERIAL PRIMARY KEY,
      employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
      week_id VARCHAR(20) NOT NULL,
      date DATE NOT NULL,
      status VARCHAR(20) NOT NULL DEFAULT 'Absent',
      UNIQUE(employee_id, date)
    );

    CREATE TABLE IF NOT EXISTS payrolls (
      id SERIAL PRIMARY KEY,
      employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
      week_id VARCHAR(20) NOT NULL,
      no_of_working_days DOUBLE PRECISION DEFAULT 0,
      addtl_working_days DOUBLE PRECISION DEFAULT 0,
      total_ot_hours DOUBLE PRECISION DEFAULT 0,
      overtime_nd_hours DOUBLE PRECISION DEFAULT 0,
      allowance DOUBLE PRECISION DEFAULT 0,
      additional_pay DOUBLE PRECISION DEFAULT 0,
      deduction DOUBLE PRECISION DEFAULT 0,
      rate_per_day DOUBLE PRECISION DEFAULT 0,
      rate_per_hour DOUBLE PRECISION DEFAULT 0,
      basic_salary DOUBLE PRECISION DEFAULT 0,
      nd_per_hour DOUBLE PRECISION DEFAULT 0,
      nd_10pm_3am DOUBLE PRECISION DEFAULT 0,
      total_earnings DOUBLE PRECISION DEFAULT 0,
      weekly_gross DOUBLE PRECISION DEFAULT 0,
      ot_pay DOUBLE PRECISION DEFAULT 0,
      addtl_working_hrs_nd DOUBLE PRECISION DEFAULT 0,
      net_pay DOUBLE PRECISION DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  initialized = true;
}
