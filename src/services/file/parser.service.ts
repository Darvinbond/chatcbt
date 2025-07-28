import * as XLSX from "xlsx";

/**
 * Parses an Excel file and extracts student names from the first column.
 * @param file The .xls or .xlsx file to parse.
 * @returns A promise that resolves to an array of student names.
 */
export async function parseStudentData(file: File): Promise<string[]> {
  if (
    file.type !== "application/vnd.ms-excel" &&
    file.type !== "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  ) {
    throw new Error("Unsupported file type. Please upload an Excel file (.xls, .xlsx).");
  }

  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  
  // Convert sheet to JSON, but only extract the first column
  const data: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

  // Filter out empty rows and map to get the first cell of each row
  const studentNames = data
    .map((row) => row[0])
    .filter((name) => name && typeof name === 'string' && name.trim() !== '');

  return studentNames;
}
