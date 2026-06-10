import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { ensureTables } from "@/lib/schema";
import { calculatePayroll } from "@/lib/payroll-calc";

// POST /api/payroll/save — Calculate and save payroll record
export async function POST(request: NextRequest) {
  try {
    await ensureTables();
    const body = await request.json();
    const { employee_id, week_id, no_of_working_days, addtl_working_days, total_ot_hours, overtime_nd_hours, allowance, additional_pay, deduction } = body;

    // Fetch employee
    const empResult = await pool.query(
      "SELECT id, name, experience, daily_rate FROM employees WHERE id = $1",
      [employee_id]
    );

    if (empResult.rows.length === 0) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    const employee = empResult.rows[0];
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

    const { rows } = await pool.query(
      `INSERT INTO payrolls (
        employee_id, week_id, no_of_working_days, addtl_working_days,
        total_ot_hours, overtime_nd_hours, allowance, additional_pay, deduction,
        rate_per_day, rate_per_hour, basic_salary, nd_per_hour, nd_10pm_3am,
        total_earnings, weekly_gross, ot_pay, addtl_working_hrs_nd, net_pay
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)
      RETURNING *`,
      [
        employee_id, week_id,
        no_of_working_days || 0, addtl_working_days || 0,
        total_ot_hours || 0, overtime_nd_hours || 0,
        allowance || 0, additional_pay || 0, deduction || 0,
        calc.rate_per_day, calc.rate_per_hour, calc.basic_salary,
        calc.nd_per_hour, calc.nd_10pm_3am, calc.total_earnings,
        calc.weekly_gross, calc.ot_pay, calc.addtl_working_hrs_nd, calc.net_pay,
      ]
    );

    return NextResponse.json(rows[0], { status: 201 });
  } catch (error) {
    console.error("POST /api/payroll/save error:", error);
    return NextResponse.json({ error: "Failed to save payroll" }, { status: 500 });
  }
}
