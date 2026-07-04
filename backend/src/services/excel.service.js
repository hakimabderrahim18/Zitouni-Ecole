const xlsx = require('xlsx');

/**
 * Parses an Excel spreadsheet buffer into a JSON array.
 * @param {Buffer} buffer The spreadsheet uploaded in memory
 * @returns {Array<object>} Array of parsed rows
 */
const parseExcel = (buffer) => {
  const workbook = xlsx.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  return xlsx.utils.sheet_to_json(sheet);
};

/**
 * Generates an Excel spreadsheet buffer from an array of flat row objects.
 * Column headers are inferred from the keys of the row objects.
 * @param {Array<object>} rows Array of flat objects (one per spreadsheet row)
 * @param {string} sheetName The name to give the worksheet
 * @returns {Buffer} The generated .xlsx file as a Buffer
 */
const generateExcel = (rows, sheetName = 'Sheet1') => {
  const workbook = xlsx.utils.book_new();
  const worksheet = xlsx.utils.json_to_sheet(rows && rows.length ? rows : [{}]);

  // Auto-size columns based on the longest value/header in each column
  const columnKeys = rows && rows.length ? Object.keys(rows[0]) : [];
  worksheet['!cols'] = columnKeys.map((key) => {
    const maxLength = Math.max(
      key.length,
      ...rows.map((row) => (row[key] != null ? String(row[key]).length : 0))
    );
    return { wch: Math.min(Math.max(maxLength + 2, 10), 50) };
  });

  // Worksheet names are limited to 31 characters by the Excel format
  xlsx.utils.book_append_sheet(workbook, worksheet, sheetName.substring(0, 31));
  return xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
};

module.exports = { parseExcel, generateExcel };
