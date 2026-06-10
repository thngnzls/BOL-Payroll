import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

export async function exportPayrollToExcel(data: any[], reportPeriod: string) {
  // Initialize a new Workbook and Worksheet
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Master Payroll");

  // ==========================================
  // 1. STYLED HEADER SECTION
  // ==========================================
  sheet.mergeCells("A1:T1");
  const titleCell = sheet.getCell("A1");
  titleCell.value = "BEAM OF LIGHT BUILDERS OPC - MASTER PAYROLL LEDGER";
  titleCell.font = {
    name: "Arial",
    size: 16,
    bold: true,
    color: { argb: "FFFFFFFF" },
  };
  titleCell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF990000" },
  };
  titleCell.alignment = { horizontal: "center", vertical: "middle" };

  sheet.mergeCells("A2:T2");
  const subtitleCell = sheet.getCell("A2");
  subtitleCell.value = `Coverage: ${reportPeriod}   |   Generated: ${new Date().toLocaleDateString()}`;
  subtitleCell.font = {
    name: "Arial",
    size: 10,
    italic: true,
    color: { argb: "FF555555" },
  };
  subtitleCell.alignment = { horizontal: "center", vertical: "middle" };

  // ==========================================
  // 2. COLUMN HEADERS
  // ==========================================
  const headers = [
    "Week (Date)",
    "Employee",
    "Role",
    "Rate Per Day",
    "Rate Per Hour",
    "Basic Salary",
    "Allowance",
    "ND (10PM-3AM)",
    "ND (Per Hour)",
    "Total Earnings",
    "Working Days",
    "Addt'l Days",
    "Additional Pay",
    "Weekly Gross",
    "Total OT Hrs",
    "OT Pay",
    "Overtime (ND)",
    "Addit'l Hrs (ND)",
    "Deduction",
    "Net Pay",
  ];

  const headerRow = sheet.addRow(headers);
  headerRow.height = 35;
  headerRow.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 10 };
  headerRow.alignment = {
    horizontal: "center",
    vertical: "middle",
    wrapText: true,
  };

  // Paint the headers red and add borders
  headerRow.eachCell((cell) => {
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF990000" },
    };
    cell.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };
  });

  // Set precise column widths so it's readable immediately upon opening
  sheet.columns = [
    { width: 14 },
    { width: 25 },
    { width: 18 },
    { width: 13 },
    { width: 13 },
    { width: 15 },
    { width: 13 },
    { width: 15 },
    { width: 13 },
    { width: 16 },
    { width: 12 },
    { width: 12 },
    { width: 15 },
    { width: 16 },
    { width: 12 },
    { width: 15 },
    { width: 15 },
    { width: 20 },
    { width: 15 },
    { width: 18 },
  ];

  // ==========================================
  // 3. DATA & EXCEL FORMULAS INJECTION
  // ==========================================
  let currentRow = 4; // Data starts on row 4

  data.forEach((row) => {
    // We map out exactly which columns contain static data vs which get LIVE formulas
    const rowData = [
      row["Week (Date)"], // A
      row["Employee"], // B
      row["Personal Experience"], // C
      row["Rate Per Day"], // D (Input)

      // E: Hourly Rate = Daily Rate / 8
      { formula: `D${currentRow}/8`, result: row["Rate Per Hour"] },

      // F: Basic Salary = Daily Rate * Working Days
      { formula: `D${currentRow}*K${currentRow}`, result: row["Basic Salary"] },

      row["Allowance"], // G (Input)
      row["ND (10PM-3AM)"], // H (Input)
      row["ND (Per Hour)"], // I (Input)

      // J: Total Earnings = Basic + Allowance + ND + Addt'l Pay
      {
        formula: `F${currentRow}+G${currentRow}+H${currentRow}+M${currentRow}`,
        result: row["Total Earnings"],
      },

      row["No. of Working Days"], // K (Input)
      row["Addt'l Working Days"], // L (Input)
      row["Additional Pay"], // M (Input)

      // N: Weekly Gross = Total Earnings + OT Pay + Addt'l Working Hrs ND
      {
        formula: `J${currentRow}+P${currentRow}+R${currentRow}`,
        result: row["Weekly Gross"],
      },

      row["Total OT Hrs"], // O (Input)
      row["OT Pay"], // P (Input)
      row["Overtime"], // Q (Input)
      row["Addit'l Working Hrs"], // R (Input)
      row["Deduction"], // S (Input)

      // T: Net Pay = Weekly Gross - Deduction
      { formula: `N${currentRow}-S${currentRow}`, result: row["Net Pay"] },
    ];

    const addedRow = sheet.addRow(rowData);

    // Apply strict Currency Formatting (₱#,##0.00) to financial columns
    const currencyFormat = "₱#,##0.00";
    const moneyColumns = [4, 5, 6, 7, 8, 9, 10, 13, 14, 16, 18, 19, 20];
    moneyColumns.forEach((colIdx) => {
      addedRow.getCell(colIdx).numFmt = currencyFormat;
    });

    // Subtly highlight the calculated formula columns to make them pop visually
    addedRow.getCell(10).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFFDF3F3" },
    }; // Earnings
    addedRow.getCell(14).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFFDF3F3" },
    }; // Gross

    // Make the Net Pay column bold and light red
    addedRow.getCell(20).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFFDE8E8" },
    };
    addedRow.getCell(20).font = { bold: true, color: { argb: "FF990000" } };

    // Align all numbers to the right
    addedRow.eachCell((cell, colNumber) => {
      if (colNumber > 3)
        cell.alignment = { horizontal: "right", vertical: "middle" };
      else cell.alignment = { horizontal: "left", vertical: "middle" };
    });

    currentRow++;
  });

  // ==========================================
  // 4. GRAND TOTAL ROW
  // ==========================================
  const totalRow = sheet.addRow([]);
  totalRow.getCell(2).value = "GRAND TOTALS";
  totalRow.getCell(2).font = { bold: true, size: 11 };

  // FIXED: Assign the formula structure to .value instead of .formula
  totalRow.getCell(20).value = {
    formula: `SUM(T4:T${currentRow - 1})`,
    result: 0, // Optional fallback initial result
  };

  totalRow.getCell(20).numFmt = "₱#,##0.00";
  totalRow.getCell(20).font = {
    bold: true,
    color: { argb: "FF990000" },
    size: 12,
  };
  totalRow.getCell(20).border = {
    top: { style: "double", color: { argb: "FF990000" } },
  };

  // ==========================================
  // 5. TRIGGER BROWSER DOWNLOAD
  // ==========================================
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  const cleanPeriod = reportPeriod.replace(/[^a-zA-Z0-9]/g, "_");
  saveAs(blob, `BEAM_OF_LIGHTS_Payroll_${cleanPeriod}.xlsx`);
}
