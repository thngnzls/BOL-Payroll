"use client";

import { useState, useEffect, Suspense } from "react";
import { endpoints, PayrollResponse, Employee } from "@/lib/api";
import { Printer, CheckSquare, Square, ArrowLeft } from "lucide-react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

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

function VoucherContent() {
  const searchParams = useSearchParams();
  const initialWeekId = searchParams.get("weekId") || "";
  const initialEmpId = searchParams.get("empId");

  const [weekId, setWeekId] = useState(initialWeekId);
  const [payrolls, setPayrolls] = useState<PayrollResponse[]>([]);
  const [employees, setEmployees] = useState<Record<number, Employee>>({});
  const [selectedPayrollIds, setSelectedPayrollIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    endpoints
      .getEmployees()
      .then((data) => {
        const empMap: Record<number, Employee> = {};
        data.forEach((e) => (empMap[e.id] = e));
        setEmployees(empMap);
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (weekId) {
      setLoading(true);
      endpoints
        .getPayrolls(weekId)
        .then((data) => {
          setPayrolls(data);
          if (initialEmpId && data.length > 0) {
            const targetPayroll = data.find(
              (p) => p.employee_id === Number(initialEmpId),
            );
            if (targetPayroll && targetPayroll.id)
              setSelectedPayrollIds([targetPayroll.id]);
          } else {
            setSelectedPayrollIds([]);
          }
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [weekId, initialEmpId]);

  const handleSelectAll = () => {
    if (selectedPayrollIds.length === payrolls.length) {
      setSelectedPayrollIds([]);
    } else {
      setSelectedPayrollIds(payrolls.map((p) => p.id as number));
    }
  };

  const toggleSelection = (id: number) => {
    setSelectedPayrollIds((prev) =>
      prev.includes(id) ? prev.filter((pid) => pid !== id) : [...prev, id],
    );
  };

  const handlePrint = () => {
    if (selectedPayrollIds.length === 0) {
      alert("Please select at least one employee to print.");
      return;
    }
    setTimeout(() => {
      window.print();
    }, 150);
  };

  const selectedPayrolls = payrolls.filter(
    (p) => p.id && selectedPayrollIds.includes(p.id),
  );
  const dateRangeStr = getWeekDateRange(weekId);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @media print {
          @page {
            size: portrait;
            margin: 0.15in;
          }
          body {
            background: white !important;
            color: black !important;
            padding: 0 !important;
            margin: 0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .print-hidden-elements {
            display: none !important;
          }
          .voucher-print-card {
            display: flex !important;
            height: auto !important; 
            min-height: 1.85in !important;
            border: 2px solid #000000 !important;
            margin-bottom: 0.08in !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            box-sizing: border-box !important;
          }
        }
      `,
        }}
      />

      {/* --- WEB UI (Hidden during Print) --- */}
      <div className="max-w-[1000px] mx-auto p-6 space-y-6 print:hidden">
        <div className="flex items-center justify-between">
          <div>
            <Link
              href="/payroll"
              className="text-[#990000] hover:underline flex items-center gap-1 text-sm font-medium mb-2"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Payroll Dashboard
            </Link>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
              Batch Print Vouchers
            </h1>
          </div>
          <button
            onClick={handlePrint}
            disabled={selectedPayrollIds.length === 0}
            className="flex items-center gap-2 bg-[#990000] hover:bg-[#7a0000] disabled:bg-gray-400 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-md"
          >
            <Printer className="w-5 h-5" />
            Open Print Dialog ({selectedPayrollIds.length})
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
            <div className="w-full sm:max-w-xs">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Select Pay Period
              </label>
              <input
                type="week"
                value={weekId}
                onChange={(e) => setWeekId(e.target.value)}
                className="w-full rounded-lg border border-gray-300 p-2.5 outline-none focus:ring-2 focus:ring-[#990000]/20"
              />
              <div className="text-xs text-gray-500 mt-1">{dateRangeStr}</div>
            </div>
            {payrolls.length > 0 && (
              <button
                onClick={handleSelectAll}
                className="text-sm font-medium text-[#990000] bg-red-50 hover:bg-red-100 px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
              >
                {selectedPayrollIds.length === payrolls.length ? (
                  <Square className="w-4 h-4" />
                ) : (
                  <CheckSquare className="w-4 h-4" />
                )}
                {selectedPayrollIds.length === payrolls.length
                  ? "Deselect All"
                  : "Select All"}
              </button>
            )}
          </div>

          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 w-12 text-center">Print</th>
                  <th className="px-4 py-3 font-semibold text-gray-600">
                    Employee Name
                  </th>
                  <th className="px-4 py-3 font-semibold text-gray-600">
                    Role
                  </th>
                  <th className="px-4 py-3 font-semibold text-gray-600 text-right">
                    Net Pay
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="p-8 text-center text-gray-500 animate-pulse"
                    >
                      Loading records...
                    </td>
                  </tr>
                ) : payrolls.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-gray-500">
                      No finalized payrolls found for this week.
                    </td>
                  </tr>
                ) : (
                  payrolls.map((p) => {
                    const emp = employees[p.employee_id];
                    const isSelected = selectedPayrollIds.includes(
                      p.id as number,
                    );
                    return (
                      <tr
                        key={p.id}
                        onClick={() => toggleSelection(p.id as number)}
                        className={`cursor-pointer transition-colors ${isSelected ? "bg-red-50/50" : "hover:bg-gray-50"}`}
                      >
                        <td className="px-4 py-3 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            readOnly
                            className="w-4 h-4 text-[#990000] rounded border-gray-300 focus:ring-[#990000]"
                          />
                        </td>
                        <td className="px-4 py-3 font-medium text-gray-900">
                          {emp?.name}
                        </td>
                        <td className="px-4 py-3 text-gray-500">
                          {emp?.experience}
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-[#990000]">
                          ₱
                          {p.net_pay.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                          })}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* --- PRINT UI: DYNAMIC HEIGHT CASH VOUCHERS --- */}
      <div className="hidden print:block print:w-full print:m-0 print:p-0">
        {selectedPayrolls.map((p) => {
          const emp = employees[p.employee_id];
          const totalDaysWorked =
            (Number(p.no_of_working_days) || 0) +
            (Number(p.addtl_working_days) || 0);

          return (
            <div
              key={p.id}
              className="voucher-print-card relative w-full flex border-[2px] border-black p-1 bg-white overflow-hidden"
            >
              <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none">
                <img
                  src="/BOL%20Logo.png"
                  alt="Company Logo"
                  className="w-[35%] max-h-[70%] object-contain grayscale opacity-[0.08]"
                  style={{ opacity: 0.08 }}
                />
              </div>

              {/* LEFT PANE - Removed h-full so it physically stretches via Flexbox */}
              <div className="relative z-10 w-1/3 pr-1.5 border-r-2 border-black flex flex-col justify-between bg-white/60">
                <div>
                  <h3 className="font-black text-[14px] mb-[2px] text-[#990000] uppercase tracking-tighter leading-none">
                    BEAM OF LIGHTS BUILDERS OPC
                  </h3>
                  <p className="text-[10px] text-justify leading-none font-medium text-gray-800">
                    I acknowledge to have received from BEAM OF LIGHTS BUILDERS
                    OPC the amount stated below and have no further claims for
                    services rendered.
                  </p>

                  <div className="mt-1.5 text-[11px] grid grid-cols-1 gap-[2px]">
                    <div className="font-bold border-b border-gray-400 pb-[1px]">
                      Pay Period:{" "}
                      <span className="font-normal ml-1 font-mono text-gray-800 text-[10px]">
                        {dateRangeStr || p.week_id}
                      </span>
                    </div>
                    <div className="font-bold border-b border-gray-400 pb-[1px]">
                      Name:{" "}
                      <span className="font-bold ml-1 uppercase text-gray-900">
                        {emp?.name}
                      </span>
                    </div>
                  </div>
                </div>

                {/* SIGNATURE AREA - mt-auto pushes it to bottom, pt-6 forces physical empty space for pen */}
                <div className="mt-auto pt-6 text-center w-full">
                  <div className="border-b border-black w-full mb-[2px]"></div>
                  <p className="text-[10px] text-gray-700 font-bold uppercase leading-none">
                    Received by: {emp?.name}
                  </p>
                </div>
              </div>

              {/* RIGHT PANE - Removed h-full so it dictates the stretch size */}
              <div className="relative z-10 w-2/3 pl-1.5 flex flex-col justify-between bg-white/60">
                <div>
                  <div className="flex justify-between items-end border-b border-black pb-0.5 mb-1">
                    <div>
                      <div className="text-[9px] uppercase font-bold text-gray-500 leading-none mb-[2px]">
                        Employee Name
                      </div>
                      <div className="text-[15px] font-black uppercase text-gray-900 leading-none">
                        {emp?.name}
                      </div>
                    </div>
                    <div className="text-right flex gap-4">
                      <div>
                        <div className="text-[9px] uppercase font-bold text-gray-500 leading-none mb-[2px]">
                          Days of Work
                        </div>
                        <div className="text-[12px] font-bold text-gray-900 leading-none">
                          {totalDaysWorked} Days
                        </div>
                      </div>
                      <div>
                        <div className="text-[9px] uppercase font-bold text-gray-500 leading-none mb-[2px]">
                          Pay Period
                        </div>
                        <div className="text-[12px] font-bold text-gray-900 leading-none">
                          {dateRangeStr || p.week_id}
                        </div>
                      </div>
                    </div>
                  </div>

                  <table className="w-full text-[11px] mb-0.5 leading-none">
                    <thead>
                      <tr className="border-b border-gray-400 text-gray-700 font-bold uppercase text-[10px]">
                        <th className="text-left pb-[2px] w-1/2">Earnings</th>
                        <th className="text-center pb-[2px] w-10">Days</th>
                        <th className="text-center pb-[2px] w-10">Hrs</th>
                        <th className="text-right pb-[2px] w-16">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      <tr>
                        <td className="py-[1px] font-bold">Basic / Reg</td>
                        <td className="text-center py-[1px]">
                          {totalDaysWorked}
                        </td>
                        <td className="text-center py-[1px]">-</td>
                        <td className="text-right py-[1px] font-bold text-gray-900">
                          ₱{p.basic_salary.toFixed(2)}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-[1px] text-gray-500 italic">
                          Hourly Rate (Info)
                        </td>
                        <td className="text-center py-[1px] text-gray-400">
                          -
                        </td>
                        <td className="text-center py-[1px] text-gray-400">
                          -
                        </td>
                        <td className="text-right py-[1px] text-gray-500 font-mono">
                          ₱{p.rate_per_hour.toFixed(2)}
                        </td>
                      </tr>
                      {p.ot_pay > 0 && (
                        <tr>
                          <td className="py-[1px] font-medium">Overtime</td>
                          <td className="text-center py-[1px]">-</td>
                          <td className="text-center py-[1px]">
                            {p.total_ot_hours}
                          </td>
                          <td className="text-right py-[1px]">
                            ₱{p.ot_pay.toFixed(2)}
                          </td>
                        </tr>
                      )}
                      {p.nd_10pm_3am > 0 && (
                        <tr>
                          <td className="py-[1px] font-medium">Night Diff</td>
                          <td className="text-center py-[1px]">-</td>
                          <td className="text-center py-[1px]">-</td>
                          <td className="text-right py-[1px]">
                            ₱{p.nd_10pm_3am.toFixed(2)}
                          </td>
                        </tr>
                      )}
                      {p.addtl_working_hrs_nd > 0 && (
                        <tr>
                          <td className="py-[1px] font-medium">
                            OT Night Diff
                          </td>
                          <td className="text-center py-[1px]">-</td>
                          <td className="text-center py-[1px]">
                            {p.overtime_nd_hours}
                          </td>
                          <td className="text-right py-[1px]">
                            ₱{p.addtl_working_hrs_nd.toFixed(2)}
                          </td>
                        </tr>
                      )}
                      {p.allowance > 0 && (
                        <tr>
                          <td className="py-[1px] font-medium">Allowance</td>
                          <td className="text-center py-[1px]">-</td>
                          <td className="text-center py-[1px]">-</td>
                          <td className="text-right py-[1px]">
                            ₱{p.allowance.toFixed(2)}
                          </td>
                        </tr>
                      )}
                      {p.additional_pay > 0 && (
                        <tr>
                          <td className="py-[1px] font-medium">Addt'l Pay</td>
                          <td className="text-center py-[1px]">
                            {p.addtl_working_days}
                          </td>
                          <td className="text-center py-[1px]">-</td>
                          <td className="text-right py-[1px]">
                            ₱{p.additional_pay.toFixed(2)}
                          </td>
                        </tr>
                      )}
                    </tbody>
                    <tfoot>
                      <tr className="border-t border-gray-400 font-bold bg-gray-50/50">
                        <td
                          colSpan={3}
                          className="py-[2px] text-right pr-2 uppercase text-[9px] text-gray-600"
                        >
                          Total Earnings:
                        </td>
                        <td className="py-[2px] text-right text-[11px]">
                          ₱{p.total_earnings.toFixed(2)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>

                  <table className="w-full text-[11px] mb-0.5 bg-white/50 leading-none">
                    <thead>
                      <tr className="border-b border-gray-400 text-red-800 font-bold uppercase text-[10px]">
                        <th className="text-left pb-[2px]">Deductions</th>
                        <th className="text-right pb-[2px] w-16">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      <tr>
                        <td className="py-[1px] font-medium text-red-700">
                          Cash Advance / Deduct
                        </td>
                        <td className="text-right py-[1px] font-mono text-red-700">
                          {p.deduction > 0
                            ? `- ₱${p.deduction.toFixed(2)}`
                            : "₱0.00"}
                        </td>
                      </tr>
                    </tbody>
                    <tfoot>
                      <tr className="border-t border-gray-400 font-bold bg-red-50/30">
                        <td className="py-[2px] text-right pr-2 uppercase text-[9px] text-red-700">
                          Total Deductions:
                        </td>
                        <td className="py-[2px] text-right text-red-700 text-[11px]">
                          {p.deduction > 0
                            ? `- ₱${p.deduction.toFixed(2)}`
                            : "₱0.00"}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                <div className="mt-1 border-t-2 border-black pt-1 pb-0.5 flex justify-between items-center bg-gray-100/80 px-2 rounded">
                  <div className="font-black text-[12px] tracking-widest text-gray-800 uppercase">
                    Final Net Pay
                  </div>
                  <div className="text-[18px] leading-none font-black font-mono text-[#990000]">
                    ₱
                    {p.net_pay.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                    })}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function VoucherPage() {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center text-gray-500">
          Loading vouchers...
        </div>
      }
    >
      <VoucherContent />
    </Suspense>
  );
}
