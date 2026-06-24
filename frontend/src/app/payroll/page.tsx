"use client";

import { useState, useEffect } from "react";
import {
  endpoints,
  Employee,
  PayrollCalculateRequest,
  PayrollResponse,
} from "@/lib/api";
import Link from "next/link";
import {
  Calculator,
  User,
  CalendarDays,
  DollarSign,
  Clock,
  MinusCircle,
  Save,
  Printer,
  Receipt,
  CheckCircle2,
  Trash2,
} from "lucide-react";

// --- Custom US Week Helpers (Sunday - Saturday) ---
const getUSWeekId = (dateStr?: string) => {
  const targetDate = dateStr ? new Date(dateStr + "T00:00:00") : new Date();
  targetDate.setHours(0, 0, 0, 0);

  targetDate.setDate(targetDate.getDate() - targetDate.getDay()); // Snap to Sunday

  const startOfYear = new Date(targetDate.getFullYear(), 0, 1);
  startOfYear.setDate(startOfYear.getDate() - startOfYear.getDay());

  const weekNum =
    Math.floor((targetDate.getTime() - startOfYear.getTime()) / 86400000 / 7) +
    1;
  return `${targetDate.getFullYear()}-W${String(weekNum).padStart(2, "0")}`;
};

const getPickerDateFromUSWeek = (weekStr: string) => {
  if (!weekStr) return "";
  try {
    const [year, week] = weekStr.split("-W").map(Number);
    const startOfYear = new Date(year, 0, 1);
    const firstSunday = new Date(startOfYear);
    firstSunday.setDate(firstSunday.getDate() - firstSunday.getDay());

    const targetSunday = new Date(firstSunday);
    targetSunday.setDate(firstSunday.getDate() + (week - 1) * 7);

    return `${targetSunday.getFullYear()}-${String(targetSunday.getMonth() + 1).padStart(2, "0")}-${String(targetSunday.getDate()).padStart(2, "0")}`;
  } catch (e) {
    return "";
  }
};

const getWeekDateRange = (weekStr: string) => {
  if (!weekStr) return "";
  try {
    const [year, week] = weekStr.split("-W").map(Number);
    const startOfYear = new Date(year, 0, 1);
    const firstSunday = new Date(startOfYear);
    firstSunday.setDate(firstSunday.getDate() - firstSunday.getDay());

    const start = new Date(firstSunday);
    start.setDate(firstSunday.getDate() + (week - 1) * 7);

    const end = new Date(start);
    end.setDate(end.getDate() + 6);

    const opts: Intl.DateTimeFormatOptions = {
      month: "short",
      day: "numeric",
      year: "numeric",
    };
    return `${start.toLocaleDateString("en-US", opts)} - ${end.toLocaleDateString("en-US", opts)}`;
  } catch (e) {
    return "";
  }
};

export default function PayrollPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmpId, setSelectedEmpId] = useState<number | "">("");
  const [weekId, setWeekId] = useState(getUSWeekId());

  const [existingPayrollId, setExistingPayrollId] = useState<number | null>(
    null,
  );
  const [weeklyPayrolls, setWeeklyPayrolls] = useState<PayrollResponse[]>([]);
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    no_of_working_days: "",
    addtl_working_days: "",
    total_ot_hours: "",
    overtime_nd_hours: "",
    allowance: "",
    additional_pay: "",
    deduction: "",
  });

  const [preview, setPreview] = useState<PayrollResponse | null>(null);

  useEffect(() => {
    endpoints
      .getEmployees()
      .then((data) => setEmployees(data))
      .catch(console.error);
  }, []);

  const fetchWeeklyPayrolls = () => {
    if (weekId) {
      endpoints
        .getPayrolls(weekId)
        .then(setWeeklyPayrolls)
        .catch(console.error);
    }
  };

  useEffect(() => {
    fetchWeeklyPayrolls();
  }, [weekId]);

  useEffect(() => {
    if (selectedEmpId && weekId) {
      const existingRecord = weeklyPayrolls.find(
        (p) => p.employee_id === Number(selectedEmpId),
      );

      if (existingRecord) {
        setExistingPayrollId(existingRecord.id || null);
        setFormData({
          no_of_working_days: existingRecord.no_of_working_days.toString(),
          addtl_working_days: existingRecord.addtl_working_days.toString(),
          total_ot_hours: existingRecord.total_ot_hours.toString(),
          overtime_nd_hours: existingRecord.overtime_nd_hours.toString(),
          allowance: existingRecord.allowance.toString(),
          additional_pay: existingRecord.additional_pay.toString(),
          deduction: existingRecord.deduction.toString(),
        });
        setIsSaved(true);
      } else {
        setExistingPayrollId(null);
        setIsSaved(false);
        setFormData({
          no_of_working_days: "",
          addtl_working_days: "",
          total_ot_hours: "",
          overtime_nd_hours: "",
          allowance: "",
          additional_pay: "",
          deduction: "",
        });

        endpoints
          .getAttendances(weekId)
          .then((data) => {
            const daysPresent = data.filter(
              (a) =>
                a.employee_id === Number(selectedEmpId) &&
                a.status === "Present",
            ).length;
            setFormData((prev) => ({
              ...prev,
              no_of_working_days: daysPresent.toString(),
            }));
          })
          .catch(console.error);
      }
    } else {
      setPreview(null);
      setExistingPayrollId(null);
    }
  }, [selectedEmpId, weekId, weeklyPayrolls]);

  useEffect(() => {
    if (selectedEmpId && weekId) {
      const payload: PayrollCalculateRequest = {
        employee_id: Number(selectedEmpId),
        week_id: weekId,
        no_of_working_days: parseFloat(formData.no_of_working_days) || 0,
        addtl_working_days: parseFloat(formData.addtl_working_days) || 0,
        total_ot_hours: parseFloat(formData.total_ot_hours) || 0,
        overtime_nd_hours: parseFloat(formData.overtime_nd_hours) || 0,
        allowance: parseFloat(formData.allowance) || 0,
        additional_pay: parseFloat(formData.additional_pay) || 0,
        deduction: parseFloat(formData.deduction) || 0,
      };
      endpoints
        .previewPayroll(payload)
        .then((data) => setPreview(data))
        .catch(console.error);
    }
  }, [selectedEmpId, weekId, formData]);

  const handleSave = async () => {
    if (!selectedEmpId || !weekId || isSaving) return;
    setIsSaving(true);
    try {
      const latestPayrolls = await endpoints.getPayrolls(weekId);
      const duplicates = latestPayrolls.filter(
        (p) => p.employee_id === Number(selectedEmpId),
      );

      await Promise.all(
        duplicates.map((dup) => endpoints.deletePayroll(dup.id as number)),
      );

      const payload: PayrollCalculateRequest = {
        employee_id: Number(selectedEmpId),
        week_id: weekId,
        no_of_working_days: parseFloat(formData.no_of_working_days) || 0,
        addtl_working_days: parseFloat(formData.addtl_working_days) || 0,
        total_ot_hours: parseFloat(formData.total_ot_hours) || 0,
        overtime_nd_hours: parseFloat(formData.overtime_nd_hours) || 0,
        allowance: parseFloat(formData.allowance) || 0,
        additional_pay: parseFloat(formData.additional_pay) || 0,
        deduction: parseFloat(formData.deduction) || 0,
      };

      const data = await endpoints.savePayroll(payload);
      setPreview(data);
      setExistingPayrollId(data.id || null);
      setIsSaved(true);
      fetchWeeklyPayrolls();
    } catch (err) {
      console.error(err);
      alert("Failed to save payroll.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!existingPayrollId) return;
    if (
      confirm(
        "Are you sure you want to permanently delete this payroll record?",
      )
    ) {
      try {
        await endpoints.deletePayroll(existingPayrollId);
        setExistingPayrollId(null);
        setIsSaved(false);
        setPreview(null);
        fetchWeeklyPayrolls();

        setFormData({
          no_of_working_days: "",
          addtl_working_days: "",
          total_ot_hours: "",
          overtime_nd_hours: "",
          allowance: "",
          additional_pay: "",
          deduction: "",
        });

        endpoints.getAttendances(weekId).then((data) => {
          const daysPresent = data.filter(
            (a) =>
              a.employee_id === Number(selectedEmpId) && a.status === "Present",
          ).length;
          setFormData((prev) => ({
            ...prev,
            no_of_working_days: daysPresent.toString(),
          }));
        });
      } catch (err) {
        console.error(err);
        alert("Failed to delete record.");
      }
    }
  };

  const selectedEmployee = employees.find(
    (e) => e.id === Number(selectedEmpId),
  );

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setIsSaved(false);
  };

  return (
    <div className="max-w-[1400px] mx-auto p-6 space-y-6">
      <div className="border-b border-gray-200 pb-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="bg-[#990000] p-2.5 rounded-xl shadow-sm">
            <Calculator className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
              Payroll Processing
            </h1>
            <p className="text-gray-500 mt-1 text-sm">
              Calculate wages, adjust allowances, and generate payslips.
            </p>
          </div>
        </div>

        {existingPayrollId && (
          <button
            onClick={handleDelete}
            className="flex items-center gap-2 bg-red-100 text-red-700 hover:bg-red-200 font-medium py-2 px-4 rounded-lg transition-colors border border-red-200"
          >
            <Trash2 className="w-4 h-4" /> Delete Record
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-[#990000]" /> Context Selection
              {existingPayrollId && (
                <span className="ml-auto text-xs font-bold text-green-600 bg-green-100 px-2 py-1 rounded-md border border-green-200">
                  RECORD EXISTS
                </span>
              )}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* SMART DATE PICKER IMPLEMENTATION */}
              <div>
                <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                  <CalendarDays className="w-4 h-4" /> Pay Period (Select any
                  day)
                </label>
                <input
                  type="date"
                  value={getPickerDateFromUSWeek(weekId)}
                  onChange={(e) => {
                    if (e.target.value) setWeekId(getUSWeekId(e.target.value));
                  }}
                  className="w-full rounded-lg border border-gray-300 p-2.5 outline-none focus:ring-2 focus:ring-[#990000]/20 focus:border-[#990000] shadow-sm transition-all cursor-pointer"
                />
                <div className="mt-1.5 text-xs font-semibold text-[#990000] bg-red-50 p-1.5 rounded text-center border border-red-100">
                  {getWeekDateRange(weekId)}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                  <User className="w-4 h-4" /> Select Employee
                </label>
                <select
                  value={selectedEmpId}
                  onChange={(e) =>
                    setSelectedEmpId(
                      e.target.value ? Number(e.target.value) : "",
                    )
                  }
                  className="w-full rounded-lg border border-gray-300 p-2.5 outline-none focus:ring-2 focus:ring-[#990000]/20 focus:border-[#990000] shadow-sm transition-all bg-white"
                >
                  <option value="">-- Choose Employee --</option>
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {selectedEmployee && (
              <div className="mt-5 bg-red-50 border border-red-100 p-4 rounded-xl flex flex-wrap gap-x-8 gap-y-2 text-sm text-[#990000]">
                <div className="flex flex-col">
                  <span className="text-red-800/70 text-xs font-semibold uppercase tracking-wider">
                    Role
                  </span>
                  <span className="font-bold">
                    {selectedEmployee.experience}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-red-800/70 text-xs font-semibold uppercase tracking-wider">
                    Daily Rate
                  </span>
                  <span className="font-bold font-mono">
                    ₱{selectedEmployee.daily_rate.toFixed(2)}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-red-800/70 text-xs font-semibold uppercase tracking-wider">
                    Hourly Rate
                  </span>
                  <span className="font-bold font-mono">
                    ₱{(selectedEmployee.daily_rate / 8).toFixed(2)}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-600" /> Earnings &
              Adjustments
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5 text-blue-600">
                  No. of Working Days (w/ND)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={formData.no_of_working_days}
                  onChange={(e) =>
                    handleInputChange("no_of_working_days", e.target.value)
                  }
                  className="w-full rounded-lg border border-blue-200 bg-blue-50 p-2.5 outline-none focus:ring-2 focus:ring-blue-500/20 shadow-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  No. of Working Days (w/o ND)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={formData.addtl_working_days}
                  onChange={(e) =>
                    handleInputChange("addtl_working_days", e.target.value)
                  }
                  className="w-full rounded-lg border border-gray-300 p-2.5 outline-none focus:ring-2 focus:ring-[#990000]/20 shadow-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Allowance (Food/Transpo) ₱
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.allowance}
                  onChange={(e) =>
                    handleInputChange("allowance", e.target.value)
                  }
                  className="w-full rounded-lg border border-gray-300 p-2.5 outline-none focus:ring-2 focus:ring-[#990000]/20 shadow-sm font-mono"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Additional Pay ₱
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.additional_pay}
                  onChange={(e) =>
                    handleInputChange("additional_pay", e.target.value)
                  }
                  className="w-full rounded-lg border border-gray-300 p-2.5 outline-none focus:ring-2 focus:ring-[#990000]/20 shadow-sm font-mono"
                />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-orange-500" /> Overtime &{" "}
              <MinusCircle className="w-5 h-5 text-red-500 ml-1" /> Deductions
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Total OT (Hours)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={formData.total_ot_hours}
                  onChange={(e) =>
                    handleInputChange("total_ot_hours", e.target.value)
                  }
                  className="w-full rounded-lg border border-gray-300 p-2.5 outline-none focus:ring-2 focus:ring-[#990000]/20 shadow-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  OT w/ Night Diff
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={formData.overtime_nd_hours}
                  onChange={(e) =>
                    handleInputChange("overtime_nd_hours", e.target.value)
                  }
                  className="w-full rounded-lg border border-gray-300 p-2.5 outline-none focus:ring-2 focus:ring-[#990000]/20 shadow-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-red-700 mb-1.5">
                  Total Deduction ₱
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.deduction}
                  onChange={(e) =>
                    handleInputChange("deduction", e.target.value)
                  }
                  className="w-full rounded-lg border border-red-300 bg-red-50 p-2.5 outline-none focus:ring-2 focus:ring-red-500/20 shadow-sm font-mono text-red-900"
                />
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT PANE: Live Payslip Preview */}
        <div className="lg:col-span-5 relative">
          <div className="sticky top-6">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="bg-[#2d3748] p-5 text-white flex items-center gap-3">
                <Receipt className="w-6 h-6 text-gray-300" />
                <div>
                  <h2 className="text-lg font-bold tracking-wider">
                    PAYSLIP SUMMARY
                  </h2>
                  <p className="text-xs text-gray-400 uppercase tracking-widest mt-0.5">
                    Live Preview
                  </p>
                </div>
              </div>

              {preview && selectedEmployee ? (
                <div className="p-6 space-y-6">
                  <div className="border-b-2 border-dashed border-gray-200 pb-4">
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                      Employee
                    </div>
                    <div className="text-xl font-bold text-gray-900">
                      {selectedEmployee.name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {selectedEmployee.experience} | {weekId}
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                      Earnings
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Basic Salary</span>
                      <span className="font-semibold font-mono">
                        ₱{preview.basic_salary.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">ND (10PM - 3AM)</span>
                      <span className="font-semibold font-mono">
                        ₱{preview.nd_10pm_3am.toFixed(2)}
                      </span>
                    </div>
                    {preview.allowance > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Allowance</span>
                        <span className="font-semibold font-mono">
                          ₱{preview.allowance.toFixed(2)}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm pt-2 border-t border-gray-100">
                      <span className="font-semibold text-gray-800">
                        Total Earnings
                      </span>
                      <span className="font-bold text-[#990000] font-mono">
                        ₱{preview.total_earnings.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                      Overtime & Additions
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Standard OT Pay</span>
                      <span className="font-semibold font-mono">
                        ₱{preview.ot_pay.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">
                        Addt&apos;l Hrs (w/ ND)
                      </span>
                      <span className="font-semibold font-mono">
                        ₱{preview.addtl_working_hrs_nd.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm pt-2 border-t border-gray-100">
                      <span className="font-semibold text-gray-800">
                        Weekly Gross
                      </span>
                      <span className="font-bold text-[#990000] font-mono">
                        ₱{preview.weekly_gross.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {preview.deduction > 0 && (
                    <div className="space-y-2.5 bg-red-50 p-3 rounded-lg border border-red-100">
                      <div className="flex justify-between text-sm text-red-800">
                        <span className="font-semibold">Deductions</span>
                        <span className="font-bold font-mono">
                          - ₱{preview.deduction.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="bg-[#990000] text-white p-5 rounded-xl shadow-inner mt-4">
                    <div className="text-sm font-semibold text-red-200 uppercase tracking-wider mb-1">
                      Total Net Pay
                    </div>
                    <div className="text-3xl font-black tracking-tight font-mono">
                      ₱
                      {preview.net_pay.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </div>
                  </div>

                  <div className="flex flex-col xl:flex-row gap-3 pt-2">
                    <button
                      onClick={handleSave}
                      disabled={isSaving}
                      className={`flex-1 flex justify-center items-center gap-2 font-bold py-3.5 px-4 rounded-xl transition-all shadow-sm ${
                        isSaved
                          ? "bg-green-600 hover:bg-green-700 text-white"
                          : "bg-gray-900 hover:bg-black text-white active:scale-[0.98]"
                      }`}
                    >
                      {isSaving ? (
                        "Saving..."
                      ) : isSaved ? (
                        <>
                          <CheckCircle2 className="w-5 h-5" /> Saved & Clean
                        </>
                      ) : (
                        <>
                          <Save className="w-5 h-5" />{" "}
                          {existingPayrollId ? "Update Record" : "Save Record"}
                        </>
                      )}
                    </button>

                    {existingPayrollId && (
                      <Link
                        href={`/payroll/voucher?empId=${selectedEmployee.id}&weekId=${weekId}`}
                        className="flex-1 flex justify-center items-center gap-2 bg-white border-2 border-[#990000] text-[#990000] hover:bg-red-50 font-bold py-3.5 px-4 rounded-xl transition-all"
                      >
                        <Printer className="w-5 h-5" /> Print Voucher
                      </Link>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-12 text-center flex flex-col items-center justify-center h-96 text-gray-400">
                  <Receipt className="w-16 h-16 mb-4 opacity-20" />
                  <p className="text-lg font-medium text-gray-500">
                    No Preview Available
                  </p>
                  <p className="text-sm mt-2 max-w-[200px] leading-relaxed">
                    Select a Pay Period and an Employee on the left to view or
                    edit.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
