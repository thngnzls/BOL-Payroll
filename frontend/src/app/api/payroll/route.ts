import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { ensureTables } from "@/lib/schema";

// GET /api/payroll?week_id=2026-W24 — List payroll records (optionally filtered by week)
export async function GET(request: NextRequest) {
  try {
    await ensureTables();
    const { searchParams } = new URL(request.url);
    const week_id = searchParams.get("week_id");

    let query = `SELECT id, employee_id, week_id, no_of_working_days, addtl_working_days,
                        total_ot_hours, overtime_nd_hours, allowance, additional_pay, deduction,
                        rate_per_day, rate_per_hour, basic_salary, nd_per_hour, nd_10pm_3am,
                        total_earnings, weekly_gross, ot_pay, addtl_working_hrs_nd, net_pay
                 FROM payrolls`;
    const values: string[] = [];

    if (week_id) {
      query += " WHERE week_id = $1";
      values.push(week_id);
    }

    query += " ORDER BY id DESC";
    const { rows } = await pool.query(query, values);
    return NextResponse.json(rows);
  } catch (error) {
    console.error("GET /api/payroll error:", error);
    return NextResponse.json({ error: "Failed to fetch payrolls" }, { status: 500 });
  }
}
