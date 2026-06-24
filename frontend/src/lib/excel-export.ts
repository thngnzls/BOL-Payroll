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

  // Sort by Week descending, Role ascending
  const sortedData = [...data].sort((a, b) => {
    const weekCmp = b["Week (Date)"].localeCompare(a["Week (Date)"]);
    if (weekCmp !== 0) return weekCmp;
    const roleA = a["Personal Experience"] || "";
    const roleB = b["Personal Experience"] || "";
    return roleA.localeCompare(roleB);
  });

  let currentRow = 4;
  let currentRole = "";

  sortedData.forEach((row) => {
    // Role sorting flag for styling
    let isNewRole = false;
    if (currentRole !== "" && currentRole !== row["Personal Experience"]) {
      isNewRole = true;
    }
    currentRole = row["Personal Experience"];

    const rowData = [
      row["Week (Date)"],
      row["Employee"],
      row["Personal Experience"],
      row["Rate Per Day"],
      { formula: `D${currentRow}/8`, result: row["Rate Per Hour"] },
      { formula: `D${currentRow}*K${currentRow}`, result: row["Basic Salary"] },
      row["Allowance"],
      row["ND (10PM-3AM)"],
      row["ND (Per Hour)"],
      {
        formula: `F${currentRow}+G${currentRow}+H${currentRow}`,
        result: row["Total Earnings"],
      },
      row["No. of Working Days (w/ ND)"],
      row["No. of Working Days (w/o ND)"],
      row["Additional Pay"],
      { formula: `J${currentRow}+M${currentRow}`, result: row["Weekly Gross"] },
      row["Total OT Hrs"],
      row["OT Pay"],
      row["Overtime"],
      row["Addit'l Working Hrs"],
      row["Deduction"],
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

      // Inject thick top border for visual separation of roles
      if (isNewRole) {
        cell.border = {
          top: { style: "medium", color: { argb: "FFAAAAAA" } },
          bottom: { style: "thin", color: { argb: "FFDDDDDD" } },
          left: { style: "thin", color: { argb: "FFDDDDDD" } },
          right: { style: "thin", color: { argb: "FFDDDDDD" } },
        };
      }
    });

    currentRow++;
  });

  const totalRow = sheet.addRow([]);
  totalRow.height = 25;

  sheet.mergeCells(`A${currentRow}:C${currentRow}`);
  const gtCell = totalRow.getCell(1);
  gtCell.value = "GRAND TOTALS";

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

  totalRow.eachCell((cell, colNumber) => {
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF000000" },
    };
    cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
    cell.alignment = { horizontal: "right", vertical: "middle" };
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  const cleanPeriod = reportPeriod.replace(/[^a-zA-Z0-9]/g, "_");
  saveAs(blob, `BEAM_OF_LIGHTS_Payroll_${cleanPeriod}.xlsx`);
}
