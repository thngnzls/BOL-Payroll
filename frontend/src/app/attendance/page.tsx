"use client";

import { useState, useEffect } from "react";
import { endpoints, Employee, Attendance } from "@/lib/api";
import {
  CalendarDays,
  Search,
  Check,
  Calendar as CalendarIcon,
  ClipboardList,
  LayoutList,
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

const getCurrentMonthStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

const getDatesFromUSWeek = (weekStr: string) => {
  if (!weekStr) return [];
  try {
    const [yearStr, weekStrNum] = weekStr.split("-W");
    const year = parseInt(yearStr, 10);
    const week = parseInt(weekStrNum, 10);

    const startOfYear = new Date(year, 0, 1);
    const firstSunday = new Date(startOfYear);
    firstSunday.setDate(firstSunday.getDate() - firstSunday.getDay());

    const targetSunday = new Date(firstSunday);
    targetSunday.setDate(firstSunday.getDate() + (week - 1) * 7);

    const dates = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(targetSunday);
      d.setDate(targetSunday.getDate() + i);
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      dates.push({
        dateStr,
        dayName: d.toLocaleDateString("en-US", { weekday: "short" }),
        dayNum: d.getDate(),
      });
    }
    return dates;
  } catch (e) {
    return [];
  }
};

export default function AttendancePage() {
  const [activeTab, setActiveTab] = useState<"weekly" | "monthly">("weekly");
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const [weekId, setWeekId] = useState(() => {
    if (typeof window !== "undefined")
      return localStorage.getItem("payroll_attendance_week") || getUSWeekId();
    return getUSWeekId();
  });

  const [weeklyAttendances, setWeeklyAttendances] = useState<Attendance[]>([]);
  const weekDates = getDatesFromUSWeek(weekId);

  const [monthStr, setMonthStr] = useState(getCurrentMonthStr());
  const [allAttendances, setAllAttendances] = useState<Attendance[]>([]);

  useEffect(() => {
    localStorage.setItem("payroll_attendance_week", weekId);
  }, [weekId]);

  useEffect(() => {
    endpoints
      .getEmployees()
      .then(setEmployees)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (activeTab === "weekly" && weekId) {
      endpoints
        .getAttendances(weekId)
        .then(setWeeklyAttendances)
        .catch(console.error);
    } else if (activeTab === "monthly" && monthStr) {
      endpoints.getAttendances().then(setAllAttendances).catch(console.error);
    }
  }, [activeTab, weekId, monthStr]);

  const toggleAttendance = async (
    empId: number,
    dateStr: string,
    currentStatus: string,
  ) => {
    const newStatus = currentStatus === "Present" ? "Absent" : "Present";
    setWeeklyAttendances((prev) => {
      const filtered = prev.filter(
        (a) => !(a.employee_id === empId && a.date.split("T")[0] === dateStr),
      );
      return [
        ...filtered,
        {
          employee_id: empId,
          week_id: weekId,
          date: dateStr,
          status: newStatus,
        } as Attendance,
      ];
    });

    try {
      await endpoints.createAttendance({
        employee_id: empId,
        week_id: weekId,
        date: dateStr,
        status: newStatus,
      });
    } catch (err) {
      console.error(err);
      endpoints.getAttendances(weekId).then(setWeeklyAttendances);
    }
  };

  const getStatus = (employeeId: number, dateStr: string) => {
    const record = weeklyAttendances.find(
      (a) => a.employee_id === employeeId && a.date.split("T")[0] === dateStr,
    );
    return record?.status || "Absent";
  };

  const filteredEmployees = employees
    .filter((emp) => emp.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name));

  const currentRangeStr =
    weekDates.length > 0
      ? `${weekDates[0].dateStr} to ${weekDates[6].dateStr}`
      : "";

  return (
    <div className="max-w-[1400px] mx-auto p-6 space-y-6">
      <div className="border-b border-gray-200 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="bg-[#990000] p-2.5 rounded-xl shadow-sm">
            <CalendarDays className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
              Attendance Checker
            </h1>
            <p className="text-gray-500 mt-1 text-sm">
              Log daily timesheets or generate monthly audit reports.
            </p>
          </div>
        </div>

        <div className="flex bg-gray-100 p-1 rounded-xl shadow-inner border border-gray-200">
          <button
            onClick={() => setActiveTab("weekly")}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === "weekly" ? "bg-white text-[#990000] shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
          >
            <ClipboardList className="w-4 h-4" /> Weekly Entry
          </button>
          <button
            onClick={() => setActiveTab("monthly")}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === "monthly" ? "bg-white text-[#990000] shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
          >
            <LayoutList className="w-4 h-4" /> Monthly Report
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-3 space-y-5 bg-white p-5 rounded-2xl shadow-sm border border-gray-200 h-fit">
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider border-b pb-2">
            Control Station
          </h2>

          {activeTab === "weekly" ? (
            <>
              <div>
                <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wide mb-1.5 flex items-center gap-1">
                  <CalendarIcon className="w-3.5 h-3.5 text-gray-400" /> Target
                  Pay Week (Select any day)
                </label>
                <input
                  type="date"
                  value={getPickerDateFromUSWeek(weekId)}
                  onChange={(e) => {
                    if (e.target.value) setWeekId(getUSWeekId(e.target.value));
                  }}
                  className="w-full rounded-lg border border-gray-300 p-2.5 text-sm outline-none focus:ring-2 focus:ring-[#990000]/20 font-medium cursor-pointer bg-gray-50"
                />
              </div>
              <div className="bg-red-50/50 rounded-xl p-3 border border-red-100 text-center">
                <span className="block text-[10px] uppercase tracking-wider text-red-800 font-bold">
                  Coverage Period
                </span>
                <span className="block text-xs font-black text-[#990000] font-mono mt-1">
                  {currentRangeStr || "Processing..."}
                </span>
              </div>
            </>
          ) : (
            <div>
              <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wide mb-1.5 flex items-center gap-1">
                <CalendarIcon className="w-3.5 h-3.5 text-gray-400" /> Target
                Month
              </label>
              <input
                type="month"
                value={monthStr}
                onChange={(e) => setMonthStr(e.target.value)}
                className="w-full rounded-lg border border-gray-300 p-2.5 text-sm outline-none focus:ring-2 focus:ring-[#990000]/20 font-medium cursor-pointer bg-gray-50"
              />
            </div>
          )}

          <div>
            <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wide mb-1.5 flex items-center gap-1">
              <Search className="w-3.5 h-3.5 text-gray-400" /> Filter Directory
            </label>
            <input
              type="text"
              placeholder="Search personnel..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-3 pr-4 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#990000]/20 shadow-sm"
            />
          </div>
        </div>

        <div className="lg:col-span-9 bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden flex flex-col">
          {activeTab === "weekly" && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-[#990000] text-white border-b-2 border-[#7a0000]">
                  <tr>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider min-w-[220px]">
                      Employee Name
                    </th>
                    {weekDates.map((day) => (
                      <th
                        key={day.dateStr}
                        className="px-1 py-3 text-center border-x border-[#b30000]"
                      >
                        <div className="text-[9px] font-semibold text-red-200 uppercase tracking-widest">
                          {day.dayName}
                        </div>
                        <div className="text-sm font-black mt-0.5 font-mono">
                          {day.dayNum}
                        </div>
                      </th>
                    ))}
                    <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-center bg-[#800000]">
                      Days Present
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loading ? (
                    <tr>
                      <td
                        colSpan={9}
                        className="px-6 py-12 text-center text-gray-500 animate-pulse"
                      >
                        Loading timesheet...
                      </td>
                    </tr>
                  ) : (
                    filteredEmployees.map((emp) => {
                      const weeklyPresent = weeklyAttendances.filter(
                        (a) =>
                          a.employee_id === emp.id && a.status === "Present",
                      ).length;
                      return (
                        <tr
                          key={emp.id}
                          className="hover:bg-red-50/30 transition-all border-b"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="font-bold text-gray-900">
                              {emp.name}
                            </div>
                            <div className="text-[11px] text-gray-500 font-medium mt-0.5">
                              {emp.experience}
                            </div>
                          </td>
                          {weekDates.map((day) => {
                            const status = getStatus(emp.id, day.dateStr);
                            const isPresent = status === "Present";
                            return (
                              <td
                                key={day.dateStr}
                                className="px-1 py-3 text-center border-x border-gray-100"
                              >
                                <button
                                  onClick={() =>
                                    toggleAttendance(
                                      emp.id,
                                      day.dateStr,
                                      status,
                                    )
                                  }
                                  className={`w-9 h-9 mx-auto rounded-lg flex items-center justify-center transition-all duration-150 outline-none ${
                                    isPresent
                                      ? "bg-[#990000] text-white shadow shadow-red-900/40"
                                      : "bg-gray-50 text-transparent hover:bg-gray-200 border border-gray-200"
                                  }`}
                                >
                                  <Check
                                    className={`w-4 h-4 font-black transition-transform ${isPresent ? "scale-100" : "scale-50 opacity-0"}`}
                                  />
                                </button>
                              </td>
                            );
                          })}
                          <td className="px-5 py-4 whitespace-nowrap text-center bg-gray-50/50">
                            <div className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-red-100 text-[#990000] font-black text-base border border-red-200 font-mono">
                              {weeklyPresent}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "monthly" && (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-[#2d3748] text-white border-b-2 border-gray-900">
                  <tr>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider w-1/4">
                      Employee
                    </th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-center w-32">
                      Total Days
                    </th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider">
                      Exact Dates Logged (Present)
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loading ? (
                    <tr>
                      <td
                        colSpan={3}
                        className="px-6 py-12 text-center text-gray-500 animate-pulse"
                      >
                        Analyzing monthly data...
                      </td>
                    </tr>
                  ) : (
                    filteredEmployees.map((emp) => {
                      const employeeMonthlyRecords = allAttendances.filter(
                        (a) =>
                          a.employee_id === emp.id &&
                          a.date.startsWith(monthStr) &&
                          a.status === "Present",
                      );

                      employeeMonthlyRecords.sort((a, b) =>
                        a.date.localeCompare(b.date),
                      );

                      const formattedDates = employeeMonthlyRecords
                        .map((a) => {
                          const dateOnly = a.date.split("T")[0];
                          const d = new Date(dateOnly);
                          return `${d.toLocaleDateString("en-US", { weekday: "short" })} ${d.getDate()}`;
                        })
                        .join(", ");

                      return (
                        <tr
                          key={emp.id}
                          className="hover:bg-gray-50 transition-colors group"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="font-bold text-gray-900">
                              {emp.name}
                            </div>
                            <div className="text-xs text-gray-500 mt-0.5">
                              {emp.experience}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100 text-gray-800 font-bold text-sm border border-gray-200">
                              {employeeMonthlyRecords.length}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600 leading-relaxed font-mono">
                            {formattedDates || (
                              <span className="text-gray-400 italic">
                                No attendance logged for this month.
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
