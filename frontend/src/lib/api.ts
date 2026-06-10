/**
 * Frontend API client — calls internal Next.js API routes.
 * No more external FastAPI server needed.
 */

// Employee types
export interface Employee {
  id: number;
  name: string;
  experience: string;
  daily_rate: number;
}

export interface EmployeeCreate {
  name: string;
  experience: string;
  daily_rate: number;
}

// Attendance types
export interface Attendance {
  id: number;
  employee_id: number;
  week_id: string;
  date: string;
  status: string;
}

export interface AttendanceCreate {
  employee_id: number;
  week_id: string;
  date: string;
  status: string;
}

// Payroll types
export interface PayrollCalculateRequest {
  employee_id: number;
  week_id: string;
  no_of_working_days: number;
  addtl_working_days: number;
  total_ot_hours: number;
  overtime_nd_hours: number;
  allowance: number;
  additional_pay: number;
  deduction: number;
}

export interface PayrollResponse extends PayrollCalculateRequest {
  id?: number;
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

// ---- Generic fetch helper ----

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`API error ${res.status}: ${errorBody}`);
  }
  return res.json() as Promise<T>;
}

// ---- Endpoints ----

export const endpoints = {
  // Employees
  getEmployees: () => apiFetch<Employee[]>("/api/employees"),
  createEmployee: (data: EmployeeCreate) =>
    apiFetch<Employee>("/api/employees", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  getEmployee: (id: number) => apiFetch<Employee>(`/api/employees/${id}`),

  // Employee CRUD Updates
  updateEmployee: (id: number, data: EmployeeCreate) =>
    apiFetch<Employee>(`/api/employees/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  deleteEmployee: (id: number) =>
    apiFetch<{ success: boolean }>(`/api/employees/${id}`, {
      method: "DELETE",
    }),

  // Attendance
  getAttendances: (week_id?: string) => {
    const params = week_id ? `?week_id=${encodeURIComponent(week_id)}` : "";
    return apiFetch<Attendance[]>(`/api/attendance${params}`);
  },
  createAttendance: (data: AttendanceCreate) =>
    apiFetch<Attendance>("/api/attendance", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Payroll
  previewPayroll: (data: PayrollCalculateRequest) =>
    apiFetch<PayrollResponse>("/api/payroll/calculate", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  savePayroll: (data: PayrollCalculateRequest) =>
    apiFetch<PayrollResponse>("/api/payroll/save", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  getPayrolls: (week_id?: string) => {
    const params = week_id ? `?week_id=${encodeURIComponent(week_id)}` : "";
    return apiFetch<PayrollResponse[]>(`/api/payroll${params}`);
  },

  // NEW: Delete Payroll Endpoint
  deletePayroll: (id: number) =>
    apiFetch<{ success: boolean }>(`/api/payroll/${id}`, {
      method: "DELETE",
    }),
};
