import ExcelJS from 'exceljs';
import path from 'path';

async function analyze() {
  const fastMovingFile = path.resolve('./public/FORMAT STOK MATERIAL FAST MOVING.xlsx');
  const essentialFile = path.resolve('./public/FORMAT STOK MATERIAL ESSENTIAL.xlsx');

  async function printSheetInfo(filePath, name) {
    console.log(`\n--- Analyzing: ${name} ---`);
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);
    workbook.eachSheet((worksheet, sheetId) => {
      console.log(`Sheet: ${worksheet.name}`);
      let rows = [];
      worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
        if (rowNumber <= 5) {
          rows.push(`Row ${rowNumber}: ` + JSON.stringify(row.values));
        }
      });
      console.log(rows.join('\n'));
    });
  }

  await printSheetInfo(fastMovingFile, 'Fast Moving');
  await printSheetInfo(essentialFile, 'Essential');
}

analyze().catch(console.error);
