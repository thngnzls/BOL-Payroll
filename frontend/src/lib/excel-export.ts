import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

export async function exportPayrollToExcel(data: any[], reportPeriod: string) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Master Payroll");

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
    "Days (ND)",
    "Days",
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

  let currentRow = 4;

  data.forEach((row) => {
    // FIXED: Adjusted formulas so math accurately mirrors the column layout left-to-right
    const rowData = [
      row["Week (Date)"], // A (1)
      row["Employee"], // B (2)
      row["Personal Experience"], // C (3)
      row["Rate Per Day"], // D (4)

      { formula: `D${currentRow}/8`, result: row["Rate Per Hour"] }, // E (5)
      { formula: `D${currentRow}*K${currentRow}`, result: row["Basic Salary"] }, // F (6)

      row["Allowance"], // G (7)
      row["ND (10PM-3AM)"], // H (8)
      row["ND (Per Hour)"], // I (9)

      // J (10) Earnings = Basic + Allow + ND
      {
        formula: `F${currentRow}+G${currentRow}+H${currentRow}`,
        result: row["Total Earnings"],
      },

      row["No. of Working Days (w/ ND)"], // K (11)
      row["No. of Working Days (w/o ND)"], // L (12)
      row["Additional Pay"], // M (13)

      // N (14) Gross = Earnings + Additional Pay
      { formula: `J${currentRow}+M${currentRow}`, result: row["Weekly Gross"] },

      row["Total OT Hrs"], // O (15)
      row["OT Pay"], // P (16)
      row["Overtime"], // Q (17)
      row["Addit'l Working Hrs"], // R (18)
      row["Deduction"], // S (19)

      // T (20) Net Pay = Gross + OT + OT(ND) - Deduct
      {
        formula: `N${currentRow}+P${currentRow}+R${currentRow}-S${currentRow}`,
        result: row["Net Pay"],
      },
    ];

    const addedRow = sheet.addRow(rowData);

    const currencyFormat = "₱#,##0.00";
    const moneyColumns = [4, 5, 6, 7, 8, 9, 10, 13, 14, 16, 18, 19, 20];
    moneyColumns.forEach((colIdx) => {
      addedRow.getCell(colIdx).numFmt = currencyFormat;
    });

    addedRow.getCell(10).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFFDF3F3" },
    };
    addedRow.getCell(14).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFFDF3F3" },
    };
    addedRow.getCell(20).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFFDE8E8" },
    };
    addedRow.getCell(20).font = { bold: true, color: { argb: "FF990000" } };

    addedRow.eachCell((cell, colNumber) => {
      if (colNumber > 3)
        cell.alignment = { horizontal: "right", vertical: "middle" };
      else cell.alignment = { horizontal: "left", vertical: "middle" };
    });

    currentRow++;
  });

  // ==========================================
  // GRAND TOTALS ROW (Black with White Text)
  // ==========================================
  const totalRow = sheet.addRow([]);
  totalRow.height = 25;

  sheet.mergeCells(`A${currentRow}:C${currentRow}`);
  const gtCell = totalRow.getCell(1);
  gtCell.value = "GRAND TOTALS";

  // Inject SUM formulas across all financial columns
  const totalColumns = [
    { col: 6, letter: "F" },
    { col: 7, letter: "G" },
    { col: 8, letter: "H" },
    { col: 10, letter: "J" },
    { col: 13, letter: "M" },
    { col: 14, letter: "N" },
    { col: 16, letter: "P" },
    { col: 18, letter: "R" },
    { col: 19, letter: "S" },
    { col: 20, letter: "T" },
  ];

  totalColumns.forEach(({ col, letter }) => {
    totalRow.getCell(col).value = {
      formula: `SUM(${letter}4:${letter}${currentRow - 1})`,
      result: 0,
    };
    totalRow.getCell(col).numFmt = "₱#,##0.00";
  });

  // Style the entire row Black
  totalRow.eachCell((cell, colNumber) => {
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF000000" },
    };
    cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };

    // Set text alignment
    if (colNumber <= 3) {
      cell.alignment = { horizontal: "right", vertical: "middle" };
    } else {
      cell.alignment = { horizontal: "right", vertical: "middle" };
    }
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  const cleanPeriod = reportPeriod.replace(/[^a-zA-Z0-9]/g, "_");
  saveAs(blob, `BEAM_OF_LIGHTS_Payroll_${cleanPeriod}.xlsx`);
}
