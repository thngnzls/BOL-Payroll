import Link from "next/link";
import {
  Users,
  CalendarCheck,
  FileSpreadsheet,
  Calculator,
  ArrowRight,
} from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center py-16 sm:py-24 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
      <div className="max-w-3xl text-center space-y-6 mb-16">
        <div className="inline-flex items-center space-x-2 bg-[#990000]/10 text-[#990000] px-4 py-1.5 rounded-full text-sm font-medium mb-4 ring-1 ring-[#990000]/20">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#990000] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#990000]"></span>
          </span>
          <span>System Online</span>
        </div>
        <h1 className="text-5xl sm:text-6xl font-extrabold text-slate-900 tracking-tight font-[family-name:var(--font-outfit)] leading-tight">
          Modern Payroll for <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#990000] to-[#e60000]">
            BEAM OF LIGHTS BUILDERS
          </span>
        </h1>
        <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Manage your workforce, track daily attendance, and calculate complex
          payrolls seamlessly in one beautiful interface.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-5xl">
        <Link href="/employees" className="group block h-full">
          <div className="h-full bg-white/70 backdrop-blur-xl p-8 rounded-2xl border border-white/40 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(153,0,0,0.1)] transition-all duration-300 transform group-hover:-translate-y-1 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[#990000]/10 to-transparent rounded-bl-full -z-10 transition-transform duration-500 group-hover:scale-110" />
            <div className="flex items-center justify-between mb-6">
              <div className="bg-gradient-to-br from-slate-100 to-slate-200 p-4 rounded-xl group-hover:from-[#990000] group-hover:to-[#b30000] transition-colors duration-300 shadow-sm">
                <Users className="h-7 w-7 text-slate-700 group-hover:text-white transition-colors duration-300" />
              </div>
              <ArrowRight className="h-5 w-5 text-slate-400 group-hover:text-[#990000] group-hover:translate-x-1 transition-all duration-300" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-3 font-[family-name:var(--font-outfit)]">
              Employee Hub
            </h2>
            <p className="text-slate-600 leading-relaxed">
              Manage your entire workforce. Add new employees, assign experience
              levels, and set base daily rates easily.
            </p>
          </div>
        </Link>

        <Link href="/attendance" className="group block h-full">
          <div className="h-full bg-white/70 backdrop-blur-xl p-8 rounded-2xl border border-white/40 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(153,0,0,0.1)] transition-all duration-300 transform group-hover:-translate-y-1 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[#990000]/10 to-transparent rounded-bl-full -z-10 transition-transform duration-500 group-hover:scale-110" />
            <div className="flex items-center justify-between mb-6">
              <div className="bg-gradient-to-br from-slate-100 to-slate-200 p-4 rounded-xl group-hover:from-[#990000] group-hover:to-[#b30000] transition-colors duration-300 shadow-sm">
                <CalendarCheck className="h-7 w-7 text-slate-700 group-hover:text-white transition-colors duration-300" />
              </div>
              <ArrowRight className="h-5 w-5 text-slate-400 group-hover:text-[#990000] group-hover:translate-x-1 transition-all duration-300" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-3 font-[family-name:var(--font-outfit)]">
              Attendance Logger
            </h2>
            <p className="text-slate-600 leading-relaxed">
              Quickly mark daily presence. Automatically tallies total working
              days to be fed into the payroll engine.
            </p>
          </div>
        </Link>

        <Link href="/payroll" className="group block h-full">
          <div className="h-full bg-white/70 backdrop-blur-xl p-8 rounded-2xl border border-white/40 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(153,0,0,0.1)] transition-all duration-300 transform group-hover:-translate-y-1 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[#990000]/10 to-transparent rounded-bl-full -z-10 transition-transform duration-500 group-hover:scale-110" />
            <div className="flex items-center justify-between mb-6">
              <div className="bg-gradient-to-br from-slate-100 to-slate-200 p-4 rounded-xl group-hover:from-[#990000] group-hover:to-[#b30000] transition-colors duration-300 shadow-sm">
                <Calculator className="h-7 w-7 text-slate-700 group-hover:text-white transition-colors duration-300" />
              </div>
              <ArrowRight className="h-5 w-5 text-slate-400 group-hover:text-[#990000] group-hover:translate-x-1 transition-all duration-300" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-3 font-[family-name:var(--font-outfit)]">
              Run Payroll
            </h2>
            <p className="text-slate-600 leading-relaxed">
              Live calculations for Night Differentials, Overtimes, Allowances,
              and Deductions. Generate instant Cash Vouchers.
            </p>
          </div>
        </Link>

        <Link href="/master" className="group block h-full">
          <div className="h-full bg-white/70 backdrop-blur-xl p-8 rounded-2xl border border-white/40 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(153,0,0,0.1)] transition-all duration-300 transform group-hover:-translate-y-1 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[#990000]/10 to-transparent rounded-bl-full -z-10 transition-transform duration-500 group-hover:scale-110" />
            <div className="flex items-center justify-between mb-6">
              <div className="bg-gradient-to-br from-slate-100 to-slate-200 p-4 rounded-xl group-hover:from-[#990000] group-hover:to-[#b30000] transition-colors duration-300 shadow-sm">
                <FileSpreadsheet className="h-7 w-7 text-slate-700 group-hover:text-white transition-colors duration-300" />
              </div>
              <ArrowRight className="h-5 w-5 text-slate-400 group-hover:text-[#990000] group-hover:translate-x-1 transition-all duration-300" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-3 font-[family-name:var(--font-outfit)]">
              Master Database
            </h2>
            <p className="text-slate-600 leading-relaxed">
              A powerful spreadsheet view of all generated payrolls. Review
              historical data and export everything directly to XLSX.
            </p>
          </div>
        </Link>
      </div>
    </div>
  );
}
