import fs from 'fs/promises';
import path from 'path';
import xlsx from 'xlsx';
import { fileURLToPath } from 'url';

// Define __filename and __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

(async () => {
  try {
    // Define the path to your fileMetadata.json
    const fileMetadataPath = path.join(__dirname, '../src/ingestion/cache/fileMetadata.json');

    // Read the fileMetadata.json file
    const fileData = await fs.readFile(fileMetadataPath, 'utf8');
    const fileMetadata = JSON.parse(fileData);

    // Extract the data and format it for CSV
    const records = Object.values(fileMetadata).map(entry => ({
      url: entry.url || '',
      title: entry.title || '',
      excerpt: entry.shortDescription || '',
    }));

    // Convert the records to a worksheet
    const worksheet = xlsx.utils.json_to_sheet(records);

    // Create a new workbook and append the worksheet
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Data');

    // Write the workbook to a CSV file
    xlsx.writeFile(workbook, 'output.csv', { bookType: 'csv' });

    console.log('CSV file generated successfully.');
  } catch (error) {
    console.error('Error while exporting data to CSV:', error);
  }
})();