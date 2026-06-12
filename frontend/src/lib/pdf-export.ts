import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export interface PdfOptions {
  paperSize: "a4" | "letter" | "legal";
  marginMode: "narrow" | "normal" | "wide";
  reportPeriod: string;
}

export const getWeekDateRange = (weekStr: string) => {
  if (!weekStr) return "";
  try {
    const [year, week] = weekStr.split("-W").map(Number);
    const date = new Date(year, 0, 1 + (week - 1) * 7);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    const start = new Date(date.setDate(diff));
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

function buildPayrollPdf(data: any[], options: PdfOptions): jsPDF {
  const { paperSize, marginMode, reportPeriod } = options;
  const margins = { narrow: 20, normal: 40, wide: 60 };
  const m = margins[marginMode];

  const doc = new jsPDF("l", "pt", paperSize);
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setTextColor(153, 0, 0);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("BEAM OF LIGHT BUILDERS OPC", m, m + 10);

  doc.setTextColor(100, 100, 100);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("Master Historical Ledger", m, m + 22);

  doc.setTextColor(40, 40, 40);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("PAYROLL REPORT", pageWidth - m, m + 10, { align: "right" });
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`Period: ${reportPeriod}`, pageWidth - m, m + 22, {
    align: "right",
  });
  doc.text(
    `Printed: ${new Date().toLocaleDateString()}`,
    pageWidth - m,
    m + 34,
    { align: "right" },
  );

  doc.setLineWidth(1);
  doc.setDrawColor(220, 220, 220);
  doc.line(m, m + 45, pageWidth - m, m + 45);

  const columns = [
    { header: "Week", dataKey: "Week (Date)" },
    { header: "Employee", dataKey: "Employee" },
    { header: "Role", dataKey: "Personal Experience" },
    { header: "Rate", dataKey: "Rate Per Day" },
    { header: "Hr Rate", dataKey: "Rate Per Hour" },
    { header: "Basic Sal", dataKey: "Basic Salary" },
    { header: "Allow", dataKey: "Allowance" },
    { header: "ND(Night)", dataKey: "ND (10PM-3AM)" },
    { header: "ND/Hr", dataKey: "ND (Per Hour)" },
    { header: "Earnings", dataKey: "Total Earnings" },
    { header: "Days(ND)", dataKey: "No. of Working Days (w/ ND)" },
    { header: "Days", dataKey: "No. of Working Days (w/o ND)" },
    { header: "+Pay", dataKey: "Additional Pay" },
    { header: "Gross", dataKey: "Weekly Gross" },
    { header: "OT Hrs", dataKey: "Total OT Hrs" },
    { header: "OT Pay", dataKey: "OT Pay" },
    { header: "OT(ND)", dataKey: "Overtime" },
    { header: "+Hr ND", dataKey: "Addit'l Working Hrs" },
    { header: "Deduct", dataKey: "Deduction" },
    { header: "NET PAY", dataKey: "Net Pay" },
  ];

  const sortedData = [...data].sort((a, b) =>
    b["Week (Date)"].localeCompare(a["Week (Date)"]),
  );
  const tableData: any[] = [];
  let currentWeek = "";

  // 1. Calculate Grand Totals across all numeric columns
  const totals = sortedData.reduce(
    (acc, curr) => {
      acc.basic += curr["Basic Salary"] || 0;
      acc.allow += curr["Allowance"] || 0;
      acc.nd += curr["ND (10PM-3AM)"] || 0;
      acc.earnings += curr["Total Earnings"] || 0;
      acc.addPay += curr["Additional Pay"] || 0;
      acc.gross += curr["Weekly Gross"] || 0;
      acc.otPay += curr["OT Pay"] || 0;
      acc.otNdPay += curr["Addit'l Working Hrs"] || 0;
      acc.deduct += curr["Deduction"] || 0;
      acc.net += curr["Net Pay"] || 0;
      return acc;
    },
    {
      basic: 0,
      allow: 0,
      nd: 0,
      earnings: 0,
      addPay: 0,
      gross: 0,
      otPay: 0,
      otNdPay: 0,
      deduct: 0,
      net: 0,
    },
  );

  sortedData.forEach((row) => {
    if (row["Week (Date)"] !== currentWeek) {
      currentWeek = row["Week (Date)"];
      tableData.push({
        isWeekHeader: true,
        "Week (Date)": ` PAY PERIOD: ${currentWeek}   |   COVERAGE: ${getWeekDateRange(currentWeek)}`,
      });
    }

    const formattedRow: any = { ...row };
    const currencyFields = [
      "Rate Per Day",
      "Rate Per Hour",
      "Basic Salary",
      "Allowance",
      "ND (10PM-3AM)",
      "ND (Per Hour)",
      "Total Earnings",
      "Additional Pay",
      "Weekly Gross",
      "OT Pay",
      "Deduction",
      "Net Pay",
    ];

    currencyFields.forEach((field) => {
      if (formattedRow[field] !== undefined) {
        formattedRow[field] =
          `P${Number(formattedRow[field]).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      }
    });
    tableData.push(formattedRow);
  });

  // 2. Append the Grand Totals Row to the end of the PDF Data Array
  tableData.push({
    isGrandTotal: true,
    "Week (Date)": "GRAND TOTALS",
    Employee: "",
    "Personal Experience": "",
    "Rate Per Day": "-",
    "Rate Per Hour": "-",
    "Basic Salary": `P${totals.basic.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
    Allowance: `P${totals.allow.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
    "ND (10PM-3AM)": `P${totals.nd.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
    "ND (Per Hour)": "-",
    "Total Earnings": `P${totals.earnings.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
    "No. of Working Days (w/ ND)": "-",
    "No. of Working Days (w/o ND)": "-",
    "Additional Pay": `P${totals.addPay.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
    "Weekly Gross": `P${totals.gross.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
    "Total OT Hrs": "-",
    "OT Pay": `P${totals.otPay.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
    Overtime: "-",
    "Addit'l Working Hrs": `P${totals.otNdPay.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
    Deduction: `-P${totals.deduct.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
    "Net Pay": `P${totals.net.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
  });

  autoTable(doc, {
    columns: columns,
    body: tableData,
    startY: m + 55,
    theme: "grid",
    headStyles: {
      fillColor: [153, 0, 0],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      halign: "center",
      fontSize: 6,
    },
    bodyStyles: { fontSize: 6, halign: "right" },
    columnStyles: {
      0: { halign: "left" },
      1: { fontStyle: "bold", halign: "left", cellWidth: "wrap" },
      2: { halign: "center" },
      19: { fontStyle: "bold", halign: "right" },
    },
    didParseCell: function (data) {
      const rawData = data.row.raw as any;

      // Gray Separator Rows
      if (rawData.isWeekHeader) {
        data.cell.styles.fillColor = [230, 230, 230];
        data.cell.styles.textColor = [0, 0, 0];
        data.cell.styles.fontStyle = "bold";
        data.cell.styles.halign = "left";
        if (data.column.dataKey === "Week (Date)") {
          data.cell.colSpan = Object.keys(columns).length;
        }
      }

      // Black Grand Total Row
      if (rawData.isGrandTotal) {
        data.cell.styles.fillColor = [0, 0, 0];
        data.cell.styles.textColor = [255, 255, 255];
        data.cell.styles.fontStyle = "bold";
        if (data.column.index === 0) {
          data.cell.colSpan = 3; // Merges Week, Employee, and Role
          data.cell.styles.halign = "right";
        }
      }
    },
    margin: { top: m + 55, right: m, bottom: m + 80, left: m },
    didDrawPage: function (data) {
      const pageHeight = doc.internal.pageSize.getHeight();
      doc.setFontSize(7);
      doc.setTextColor(150);
      doc.text(
        "BEAM OF LIGHT BUILDERS OPC - Confidential Payroll Data",
        m,
        pageHeight - m,
      );
      doc.text(
        "Page " + doc.getCurrentPageInfo().pageNumber,
        pageWidth - m,
        pageHeight - m,
        { align: "right" },
      );
    },
  });

  const finalY = (doc as any).lastAutoTable?.finalY || m + 55;
  const pageHeight = doc.internal.pageSize.getHeight();
  let sigY = finalY + 60;

  if (sigY + 40 > pageHeight - m) {
    doc.addPage();
    sigY = m + 40;
  }

  doc.setFontSize(9);
  doc.setTextColor(40, 40, 40);
  doc.text("Prepared By:", m, sigY);
  doc.setLineWidth(0.5);
  doc.setDrawColor(0, 0, 0);
  doc.line(m, sigY + 30, m + 140, sigY + 30);
  doc.text("Payroll Officer", m, sigY + 42);

  const centerX = pageWidth / 2 - 70;
  doc.text("Checked By:", centerX, sigY);
  doc.line(centerX, sigY + 30, centerX + 140, sigY + 30);
  doc.text("HR / Project Manager", centerX, sigY + 42);

  const rightX = pageWidth - m - 140;
  doc.text("Approved By:", rightX, sigY);
  doc.line(rightX, sigY + 30, rightX + 140, sigY + 30);
  doc.text("General Manager", rightX, sigY + 42);

  return doc;
}

export function getPdfBlobUrl(data: any[], options: PdfOptions): string {
  if (!data || data.length === 0) return "";
  const doc = buildPayrollPdf(data, options);
  return URL.createObjectURL(doc.output("blob"));
}

export function downloadPayrollPdf(data: any[], options: PdfOptions) {
  const doc = buildPayrollPdf(data, options);
  const cleanPeriod = options.reportPeriod.replace(/[^a-zA-Z0-9]/g, "_");
  doc.save(`BEAM_OF_LIGHTS_Payroll_${cleanPeriod}.pdf`);
}
