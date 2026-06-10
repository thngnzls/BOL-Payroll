"use client";

import { useEffect, useState, Fragment } from "react";
import { endpoints, PayrollResponse, Employee } from "@/lib/api";
import {
  FileText,
  FileSpreadsheet,
  X,
  Settings2,
  Calendar,
  Filter,
  Download,
} from "lucide-react";
import { exportPayrollToExcel } from "../../lib/excel-export";
import {
  getPdfBlobUrl,
  downloadPayrollPdf,
  getWeekDateRange,
  PdfOptions,
} from "../../lib/pdf-export";

// Helper to extract a YYYY-MM string from a YYYY-WXX string for monthly filtering
const getMonthFromWeek = (weekStr: string) => {
  if (!weekStr) return "";
  const [year, week] = weekStr.split("-W").map(Number);
  const date = new Date(year, 0, 1 + (week - 1) * 7);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
};

export default function MasterPayrollPage() {
  const [payrolls, setPayrolls] = useState<PayrollResponse[]>([]);
  const [employees, setEmployees] = useState<Record<number, Employee>>({});
  const [loading, setLoading] = useState(true);

  // --- Export Hub State ---
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<"pdf" | "excel">("pdf");

  // Filtering Options
  const [filterMode, setFilterMode] = useState<"all" | "month" | "week">("all");
  const [filterMonth, setFilterMonth] = useState(
    new Date().toISOString().slice(0, 7),
  ); // YYYY-MM
  const [filterWeek, setFilterWeek] = useState("");

  // PDF Specific Options
  const [pdfConfig, setPdfConfig] = useState<PdfOptions>({
    paperSize: "legal",
    marginMode: "normal",
    reportPeriod: "All Master Records",
  });

  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string>("");

  useEffect(() => {
    Promise.all([endpoints.getPayrolls(), endpoints.getEmployees()])
      .then(([payData, empData]) => {
        const sorted = [...payData].sort((a, b) =>
          b.week_id.localeCompare(a.week_id),
        );
        setPayrolls(sorted);
        if (sorted.length > 0) setFilterWeek(sorted[0].week_id); // Default week filter

        const empMap: Record<number, Employee> = {};
        empData.forEach((e) => (empMap[e.id] = e));
        setEmployees(empMap);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Function to filter the exact data we want to export based on user selection
  const getFilteredPayrolls = () => {
    if (filterMode === "month") {
      return payrolls.filter(
        (p) => getMonthFromWeek(p.week_id) === filterMonth,
      );
    }
    if (filterMode === "week") {
      return payrolls.filter((p) => p.week_id === filterWeek);
    }
    return payrolls; // 'all'
  };

  // Convert the raw DB response into the flat format the PDF/Excel scripts expect
  const getMappedData = (dataToMap: PayrollResponse[]) => {
    return dataToMap.map((p) => {
      const emp = employees[p.employee_id];
      return {
        "Week (Date)": p.week_id,
        Employee: emp?.name || "Unknown",
        "Personal Experience": emp?.experience || "Unknown",
        "Rate Per Day": p.rate_per_day,
        "Rate Per Hour": p.rate_per_hour,
        "Basic Salary": p.basic_salary,
        Allowance: p.allowance,
        "ND (10PM-3AM)": p.nd_10pm_3am,
        "ND (Per Hour)": p.nd_per_hour,
        "Total Earnings": p.total_earnings,
        "No. of Working Days": p.no_of_working_days,
        "Addt'l Working Days": p.addtl_working_days,
        "Additional Pay": p.additional_pay,
        "Weekly Gross": p.weekly_gross,
        "Total OT Hrs": p.total_ot_hours,
        "OT Pay": p.ot_pay,
        Overtime: p.overtime_nd_hours,
        "Addit'l Working Hrs": p.addtl_working_hrs_nd,
        Deduction: p.deduction,
        "Net Pay": p.net_pay,
      };
    });
  };

  // Auto-update the "Report Period" string in the PDF config when filters change
  useEffect(() => {
    if (filterMode === "all")
      setPdfConfig((prev) => ({ ...prev, reportPeriod: "All Master Records" }));
    if (filterMode === "month")
      setPdfConfig((prev) => ({
        ...prev,
        reportPeriod: `Month: ${filterMonth}`,
      }));
    if (filterMode === "week")
      setPdfConfig((prev) => ({
        ...prev,
        reportPeriod: `Week: ${filterWeek}`,
      }));
  }, [filterMode, filterMonth, filterWeek]);

  // LIVE PDF PREVIEW RENDERER
  useEffect(() => {
    if (isExportModalOpen && exportFormat === "pdf") {
      const activeData = getMappedData(getFilteredPayrolls());

      // Debounce the PDF rendering slightly so it doesn't freeze the UI while typing
      const timer = setTimeout(() => {
        if (activeData.length > 0) {
          const url = getPdfBlobUrl(activeData, pdfConfig);
          setPdfPreviewUrl(url);
        } else {
          setPdfPreviewUrl("");
        }
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [
    isExportModalOpen,
    exportFormat,
    filterMode,
    filterMonth,
    filterWeek,
    pdfConfig,
    payrolls,
    employees,
  ]);

  // Clean up Blob URLs to prevent browser memory leaks
  useEffect(() => {
    if (pdfPreviewUrl) return () => URL.revokeObjectURL(pdfPreviewUrl);
  }, [pdfPreviewUrl]);

  // Handle the final execution of the Export button
  const handleExecuteExport = () => {
    const activeData = getMappedData(getFilteredPayrolls());
    if (activeData.length === 0) {
      alert("No data available for the selected filters.");
      return;
    }

    if (exportFormat === "excel") {
      exportPayrollToExcel(activeData, pdfConfig.reportPeriod);
    } else {
      downloadPayrollPdf(activeData, pdfConfig);
    }
    setIsExportModalOpen(false);
  };

  let lastWeekId = "";

  return (
    <div className="max-w-[1400px] mx-auto space-y-6 p-6 relative">
      {/* ========================================================
          THE EXPORT HUB MODAL
          ======================================================== */}
      {isExportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-6xl h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-[#990000] p-4 flex justify-between items-center text-white shrink-0">
              <h3 className="font-bold flex items-center gap-2 text-lg">
                <Download className="w-5 h-5" /> Export & Print Hub
              </h3>
              <button
                onClick={() => setIsExportModalOpen(false)}
                className="text-white/80 hover:text-white p-1 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
              {/* Left Column: Settings Panel */}
              <div className="w-full lg:w-1/3 bg-gray-50 border-r border-gray-200 p-6 flex flex-col gap-8 overflow-y-auto">
                {/* File Format */}
                <div>
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                    1. Select Format
                  </h4>
                  <div className="flex bg-white p-1 rounded-xl shadow-sm border border-gray-200">
                    <button
                      onClick={() => setExportFormat("pdf")}
                      className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold rounded-lg transition-all ${exportFormat === "pdf" ? "bg-red-50 text-[#990000] border border-red-100" : "text-gray-500 hover:bg-gray-50"}`}
                    >
                      <FileText className="w-4 h-4" /> PDF
                    </button>
                    <button
                      onClick={() => setExportFormat("excel")}
                      className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold rounded-lg transition-all ${exportFormat === "excel" ? "bg-green-50 text-green-700 border border-green-100" : "text-gray-500 hover:bg-gray-50"}`}
                    >
                      <FileSpreadsheet className="w-4 h-4" /> Excel
                    </button>
                  </div>
                </div>

                {/* Data Filtering */}
                <div>
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <Filter className="w-3.5 h-3.5" /> 2. Select Coverage
                  </h4>
                  <div className="space-y-3 bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                    <select
                      value={filterMode}
                      onChange={(e) => setFilterMode(e.target.value as any)}
                      className="w-full rounded-lg border border-gray-300 p-2.5 text-sm outline-none focus:ring-2 focus:ring-[#990000]/20 font-medium"
                    >
                      <option value="all">Export All Master Records</option>
                      <option value="month">Export by Specific Month</option>
                      <option value="week">Export by Specific Week</option>
                    </select>

                    {filterMode === "month" && (
                      <div className="animate-in fade-in slide-in-from-top-1">
                        <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">
                          Select Month
                        </label>
                        <input
                          type="month"
                          value={filterMonth}
                          onChange={(e) => setFilterMonth(e.target.value)}
                          className="w-full rounded-lg border border-gray-300 p-2 text-sm outline-none focus:ring-2 focus:ring-[#990000]/20"
                        />
                      </div>
                    )}
                    {filterMode === "week" && (
                      <div className="animate-in fade-in slide-in-from-top-1">
                        <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">
                          Select Week
                        </label>
                        <input
                          type="week"
                          value={filterWeek}
                          onChange={(e) => setFilterWeek(e.target.value)}
                          className="w-full rounded-lg border border-gray-300 p-2 text-sm outline-none focus:ring-2 focus:ring-[#990000]/20"
                        />
                        <div className="text-xs text-[#990000] mt-1.5 font-medium">
                          {getWeekDateRange(filterWeek)}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* PDF Specific Settings */}
                {exportFormat === "pdf" && (
                  <div className="animate-in fade-in duration-300">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                      <Settings2 className="w-3.5 h-3.5" /> 3. PDF Settings
                    </h4>
                    <div className="space-y-4 bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                      <div>
                        <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">
                          Report Title / Coverage Text
                        </label>
                        <input
                          type="text"
                          value={pdfConfig.reportPeriod}
                          onChange={(e) =>
                            setPdfConfig({
                              ...pdfConfig,
                              reportPeriod: e.target.value,
                            })
                          }
                          className="w-full rounded-lg border border-gray-300 p-2 text-sm outline-none focus:ring-2 focus:ring-[#990000]/20"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">
                            Paper Size
                          </label>
                          <select
                            value={pdfConfig.paperSize}
                            onChange={(e) =>
                              setPdfConfig({
                                ...pdfConfig,
                                paperSize: e.target.value as any,
                              })
                            }
                            className="w-full rounded-lg border border-gray-300 p-2 text-sm outline-none focus:ring-2 focus:ring-[#990000]/20"
                          >
                            <option value="a4">A4</option>
                            <option value="letter">Letter</option>
                            <option value="legal">Legal (Recommended)</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">
                            Margins
                          </label>
                          <select
                            value={pdfConfig.marginMode}
                            onChange={(e) =>
                              setPdfConfig({
                                ...pdfConfig,
                                marginMode: e.target.value as any,
                              })
                            }
                            className="w-full rounded-lg border border-gray-300 p-2 text-sm outline-none focus:ring-2 focus:ring-[#990000]/20"
                          >
                            <option value="narrow">Narrow</option>
                            <option value="normal">Normal</option>
                            <option value="wide">Wide</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="mt-auto pt-4">
                  <button
                    onClick={handleExecuteExport}
                    className="w-full py-3.5 rounded-xl bg-gray-900 hover:bg-black text-white font-bold shadow-md flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                  >
                    <Download className="w-5 h-5" />{" "}
                    {exportFormat === "pdf"
                      ? "Download PDF Document"
                      : "Download Excel Workbook"}
                  </button>
                </div>
              </div>

              {/* Right Column: LIVE PREVIEW PANEL */}
              <div className="w-full lg:w-2/3 bg-gray-200/50 p-6 flex flex-col relative overflow-hidden">
                <div className="bg-white w-full h-full rounded-xl shadow-inner border border-gray-300 flex flex-col overflow-hidden relative">
                  {/* Status Banner */}
                  <div className="bg-gray-100 text-gray-500 text-xs font-bold uppercase tracking-widest p-2 text-center border-b border-gray-200 shrink-0">
                    {exportFormat === "pdf"
                      ? "Live Document Preview"
                      : "Data Export Summary"}
                  </div>

                  {/* Preview Render Area */}
                  <div className="flex-1 w-full h-full relative">
                    {getFilteredPayrolls().length === 0 ? (
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 p-8 text-center">
                        <Filter className="w-12 h-12 mb-3 opacity-20" />
                        <p className="text-lg font-bold text-gray-500">
                          No Data Matches Filter
                        </p>
                        <p className="text-sm">
                          There are no payroll records saved for the selected
                          timeframe.
                        </p>
                      </div>
                    ) : exportFormat === "excel" ? (
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 p-8 text-center bg-green-50/30">
                        <FileSpreadsheet className="w-16 h-16 mb-4 text-green-600/30" />
                        <p className="text-lg font-bold text-gray-700">
                          Excel Export Ready
                        </p>
                        <p className="text-sm mt-1 text-gray-500">
                          The spreadsheet will contain{" "}
                          <span className="font-bold text-green-700">
                            {getFilteredPayrolls().length} rows
                          </span>{" "}
                          based on your current filters.
                        </p>
                      </div>
                    ) : pdfPreviewUrl ? (
                      <iframe
                        src={`${pdfPreviewUrl}#toolbar=0&navpanes=0&view=FitH`}
                        className="w-full h-full bg-gray-50 border-none"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-gray-400 animate-pulse">
                        Rendering PDF Preview...
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* ======================================================== */}

      {/* --- STANDARD MASTER PAGE BEHIND THE MODAL --- */}
      <div className="flex flex-col sm:flex-row justify-between items-center border-b border-gray-200 pb-4 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
            Master Payroll Ledger
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            Review visual breakdown histories separated structurally by work
            week entries.
          </p>
        </div>
        <button
          onClick={() => setIsExportModalOpen(true)}
          className="flex items-center space-x-2 bg-[#990000] hover:bg-[#7a0000] text-white font-bold py-3 px-6 rounded-xl transition-all shadow-md active:scale-95"
        >
          <Download className="w-5 h-5" /> <span>Export Center Hub</span>
        </button>
      </div>

      {/* Main Data Table */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-x-auto">
        <table className="w-full whitespace-nowrap text-sm">
          <thead>
            <tr className="bg-[#990000] text-white">
              <th
                colSpan={20}
                className="py-4 text-center text-lg font-bold uppercase tracking-wider"
              >
                BEAM OF LIGHT BUILDERS OPC - MASTER HISTORICAL LEDGER
              </th>
            </tr>
            <tr className="bg-gray-100 text-gray-700 border-b border-gray-300 divide-x divide-gray-300 text-[11px] uppercase tracking-wider">
              <th className="px-4 py-3 font-bold text-left">Week / Period</th>
              <th className="px-4 py-3 font-bold text-left">Employee</th>
              <th className="px-4 py-3 font-bold text-left">Role</th>
              <th className="px-4 py-3 font-bold text-right">Daily Rate</th>
              <th className="px-4 py-3 font-bold text-right">Hr Rate</th>
              <th className="px-4 py-3 font-bold text-right">Basic Sal</th>
              <th className="px-4 py-3 font-bold text-right">Allow</th>
              <th className="px-4 py-3 font-bold text-right">ND (Night)</th>
              <th className="px-4 py-3 font-bold text-right">ND/Hr</th>
              <th className="px-4 py-3 font-bold text-right bg-red-50 text-[#990000]">
                Earnings
              </th>
              <th className="px-4 py-3 font-bold text-right">Days</th>
              <th className="px-4 py-3 font-bold text-right">+Days</th>
              <th className="px-4 py-3 font-bold text-right">+Pay</th>
              <th className="px-4 py-3 font-bold text-right bg-red-50 text-[#990000]">
                Gross
              </th>
              <th className="px-4 py-3 font-bold text-right">OT Hrs</th>
              <th className="px-4 py-3 font-bold text-right">OT Pay</th>
              <th className="px-4 py-3 font-bold text-right">OT (ND)</th>
              <th className="px-4 py-3 font-bold text-right">+Hr ND</th>
              <th className="px-4 py-3 font-bold text-right text-red-600">
                Deduct
              </th>
              <th className="px-4 py-3 font-black text-right bg-[#990000] text-white">
                NET PAY
              </th>
            </tr>
          </thead>
          <tbody className="bg-white">
            {loading ? (
              <tr>
                <td
                  colSpan={20}
                  className="px-6 py-8 text-center text-gray-500"
                >
                  Loading master records...
                </td>
              </tr>
            ) : payrolls.length === 0 ? (
              <tr>
                <td
                  colSpan={20}
                  className="px-6 py-8 text-center text-gray-500"
                >
                  No payroll records located.
                </td>
              </tr>
            ) : (
              payrolls.map((p, i) => {
                const emp = employees[p.employee_id];
                const showWeekHeading = p.week_id !== lastWeekId;
                if (showWeekHeading) lastWeekId = p.week_id;

                return (
                  <Fragment key={p.id || i}>
                    {showWeekHeading && (
                      <tr className="bg-gray-100/80 border-y-2 border-gray-300">
                        <td
                          colSpan={20}
                          className="px-4 py-2.5 text-xs font-black text-gray-700 tracking-wider text-left uppercase"
                        >
                          <span className="inline-flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-md border shadow-sm text-gray-900">
                            <Calendar className="w-4 h-4 text-[#990000]" />
                            PAY PERIOD: {p.week_id}{" "}
                            <span className="text-gray-300 mx-2">|</span>{" "}
                            COVERAGE: {getWeekDateRange(p.week_id)}
                          </span>
                        </td>
                      </tr>
                    )}

                    <tr className="hover:bg-red-50/30 transition-colors divide-x divide-gray-100 border-b border-gray-200">
                      <td className="px-4 py-3 font-medium text-gray-500">
                        <div>{p.week_id}</div>
                      </td>
                      <td className="px-4 py-3 font-bold text-gray-900">
                        {emp?.name || `Emp #${p.employee_id}`}
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        {emp?.experience}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-500 font-mono">
                        {p.rate_per_day.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-400 font-mono">
                        {p.rate_per_hour.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-600 font-mono">
                        {p.basic_salary.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-600 font-mono">
                        {p.allowance.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-600 font-mono">
                        {p.nd_10pm_3am.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-400 font-mono">
                        {p.nd_per_hour.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-[#990000] bg-red-50/20 font-mono">
                        ₱{p.total_earnings.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-600">
                        {p.no_of_working_days}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-400">
                        {p.addtl_working_days}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-600 font-mono">
                        {p.additional_pay.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-[#990000] bg-red-50/20 font-mono">
                        ₱{p.weekly_gross.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-400">
                        {p.total_ot_hours}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-600 font-mono">
                        {p.ot_pay.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-400">
                        {p.overtime_nd_hours}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-600 font-mono">
                        {p.addtl_working_hrs_nd.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right text-red-600 font-mono font-medium">
                        -{p.deduction.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right font-black bg-red-50/40 text-[#990000] text-[13px] font-mono">
                        ₱
                        {p.net_pay.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                        })}
                      </td>
                    </tr>
                  </Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
