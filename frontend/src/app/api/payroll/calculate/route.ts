import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { ensureTables } from "@/lib/schema";
import { calculatePayroll } from "@/lib/payroll-calc";

// POST /api/payroll/calculate — Preview payroll calculation (no save)
export async function POST(request: NextRequest) {
  try {
    await ensureTables();
    const body = await request.json();
    const { employee_id, week_id, no_of_working_days, addtl_working_days, total_ot_hours, overtime_nd_hours, allowance, additional_pay, deduction } = body;

    // Fetch employee to get daily_rate
    const { rows } = await pool.query(
      "SELECT id, name, experience, daily_rate FROM employees WHERE id = $1",
      [employee_id]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    const employee = rows[0];
    const calc = calculatePayroll({
      rate_per_day: employee.daily_rate,
      no_of_working_days: no_of_working_days || 0,
      addtl_working_days: addtl_working_days || 0,
      total_ot_hours: total_ot_hours || 0,
      overtime_nd_hours: overtime_nd_hours || 0,
      allowance: allowance || 0,
      additional_pay: additional_pay || 0,
      deduction: deduction || 0,
    });

    return NextResponse.json({
      employee_id,
      week_id,
      no_of_working_days: no_of_working_days || 0,
      addtl_working_days: addtl_working_days || 0,
      total_ot_hours: total_ot_hours || 0,
      overtime_nd_hours: overtime_nd_hours || 0,
      allowance: allowance || 0,
      additional_pay: additional_pay || 0,
      deduction: deduction || 0,
      ...calc,
    });
  } catch (error) {
    console.error("POST /api/payroll/calculate error:", error);
    return NextResponse.json({ error: "Calculation failed" }, { status: 500 });
  }
}
