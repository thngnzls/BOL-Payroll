import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import {
  Users,
  CalendarCheck,
  FileSpreadsheet,
  Calculator,
} from "lucide-react";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BEAM of LIGHTS - Payroll System",
  description:
    "Attendance Checker and Payroll System for BEAM of LIGHTS Builders",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${outfit.variable} font-sans antialiased min-h-screen flex flex-col bg-slate-50 text-slate-900 relative overflow-x-hidden`}
      >
        {/* Decorative Background Elements */}
        <div className="absolute top-0 left-0 w-full h-[400px] bg-gradient-to-b from-[#990000]/5 to-transparent pointer-events-none -z-10" />
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-[#990000]/10 blur-[100px] pointer-events-none -z-10" />

        <header className="sticky top-0 z-50 backdrop-blur-md bg-white/80 border-b border-gray-200/50 shadow-sm print:hidden transition-all">
          <div className="container mx-auto px-6">
            <div className="flex h-16 items-center justify-between">
              {/* COMPANY BRAND LINK WITH UPGRADED LOGO */}
              <Link href="/" className="flex items-center space-x-3 group">
                <div className="bg-white p-1 w-9 h-9 rounded-xl shadow-sm border border-gray-200/80 flex items-center justify-center overflow-hidden group-hover:shadow-md transition-all duration-300 transform group-hover:-translate-y-0.5">
                  <img
                    src="/BOL%20Logo.png"
                    alt="BEAM OF LIGHTS Logo"
                    className="w-full h-full object-contain"
                  />
                </div>
                <span className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-[#990000] to-[#660000] font-[family-name:var(--font-outfit)]">
                  BEAM OF LIGHTS BUILDERS
                </span>
              </Link>

              <nav className="flex items-center space-x-1 sm:space-x-4 text-sm font-medium">
                <Link
                  href="/employees"
                  className="flex items-center space-x-1.5 px-3 py-2 rounded-md hover:bg-[#990000]/10 text-slate-600 hover:text-[#990000] transition-all duration-200"
                >
                  <Users className="h-4 w-4" />
                  <span className="hidden sm:inline">Employees</span>
                </Link>
                <Link
                  href="/attendance"
                  className="flex items-center space-x-1.5 px-3 py-2 rounded-md hover:bg-[#990000]/10 text-slate-600 hover:text-[#990000] transition-all duration-200"
                >
                  <CalendarCheck className="h-4 w-4" />
                  <span className="hidden sm:inline">Attendance</span>
                </Link>
                <Link
                  href="/payroll"
                  className="flex items-center space-x-1.5 px-3 py-2 rounded-md hover:bg-[#990000]/10 text-slate-600 hover:text-[#990000] transition-all duration-200"
                >
                  <Calculator className="h-4 w-4" />
                  <span className="hidden sm:inline">Payroll</span>
                </Link>
                <Link
                  href="/master"
                  className="flex items-center space-x-1.5 px-3 py-2 rounded-md bg-[#990000] text-white hover:bg-[#b30000] shadow-sm hover:shadow transition-all duration-200"
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  <span className="hidden sm:inline">Master View</span>
                </Link>
              </nav>
            </div>
          </div>
        </header>

        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-10">
          {children}
        </main>
      </body>
    </html>
  );
}
