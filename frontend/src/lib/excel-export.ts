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

  // FIXED: Updated Headers
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
        formula: `F${currentRow}+G${currentRow}+H${currentRow}+M${currentRow}`,
        result: row["Total Earnings"],
      },

      // FIXED: Using exact new data keys mapped from your UI
      row["No. of Working Days (w/ ND)"],
      row["No. of Working Days (w/o ND)"],
      row["Additional Pay"],

      {
        formula: `J${currentRow}+P${currentRow}+R${currentRow}`,
        result: row["Weekly Gross"],
      },

      row["Total OT Hrs"],
      row["OT Pay"],
      row["Overtime"],
      row["Addit'l Working Hrs"],
      row["Deduction"],

      { formula: `N${currentRow}-S${currentRow}`, result: row["Net Pay"] },
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

  const totalRow = sheet.addRow([]);
  totalRow.getCell(2).value = "GRAND TOTALS";
  totalRow.getCell(2).font = { bold: true, size: 11 };

  totalRow.getCell(20).value = {
    formula: `SUM(T4:T${currentRow - 1})`,
    result: 0,
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

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  const cleanPeriod = reportPeriod.replace(/[^a-zA-Z0-9]/g, "_");
  saveAs(blob, `BEAM_OF_LIGHTS_Payroll_${cleanPeriod}.xlsx`);
}
