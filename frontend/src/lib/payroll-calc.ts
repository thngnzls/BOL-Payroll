/**
 * Pure payroll calculation engine.
 * All formulas match the spec exactly.
 */

export interface PayrollInput {
  rate_per_day: number;
  no_of_working_days: number;
  addtl_working_days: number;
  total_ot_hours: number;
  overtime_nd_hours: number;
  allowance: number;
  additional_pay: number;
  deduction: number;
}

export interface PayrollCalcResult {
  rate_per_day: number;
  rate_per_hour: number;
  basic_salary: number;
  nd_per_hour: number;
  nd_10pm_3am: number;
  total_earnings: number;
  weekly_gross: number;
  ot_pay: number;
  addtl_working_hrs_nd: number;
  net_pay: number;
}

export function calculatePayroll(input: PayrollInput): PayrollCalcResult {
  const rate_per_day = input.rate_per_day;

  // Rate Per Hour = Rate Per Day / 8
  const rate_per_hour = rate_per_day / 8;

  // Basic Salary = Rate Per Day
  const basic_salary = rate_per_day;

  // ND (Per Hour) = Rate Per Hour * 0.10
  const nd_per_hour = rate_per_hour * 0.10;

  // ND (10PM-3AM) = ND (Per Hour) * 5
  const nd_10pm_3am = nd_per_hour * 5;

  // Total Earnings = Basic Salary + Allowance (Food/Transpo) + ND (10PM-3AM)
  const total_earnings = basic_salary + input.allowance + nd_10pm_3am;

  // Weekly Gross = (Additional Pay + (No. of Working Days * Total Earnings))
  //              + (Additional Working Days * (Basic Salary + Allowance))
  const weekly_gross =
    (input.additional_pay + input.no_of_working_days * total_earnings) +
    (input.addtl_working_days * (basic_salary + input.allowance));

  // OT Pay = Rate Per Hour * Total OT Hours
  const ot_pay = rate_per_hour * input.total_ot_hours;

  // Addit'l Working Hrs (W/ ND) = ND Per Hour * Overtime (Hour with ND)
  const addtl_working_hrs_nd = nd_per_hour * input.overtime_nd_hours;

  // Net Pay = (Weekly Gross + OT Pay + Addit'l Working Hrs (W/ ND)) - Deduction
  const net_pay = (weekly_gross + ot_pay + addtl_working_hrs_nd) - input.deduction;

  return {
    rate_per_day,
    rate_per_hour,
    basic_salary,
    nd_per_hour,
    nd_10pm_3am,
    total_earnings,
    weekly_gross,
    ot_pay,
    addtl_working_hrs_nd,
    net_pay,
  };
}
