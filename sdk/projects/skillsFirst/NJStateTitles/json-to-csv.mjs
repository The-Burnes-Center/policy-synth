import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { createObjectCsvWriter } from 'csv-writer';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load the JSON object
const jobSpecsPath = path.join(__dirname, 'nj_titles_state_prompt-1.json');
let jobSpecs = JSON.parse(await fs.readFile(jobSpecsPath, 'utf-8'));

// Function to flatten the job spec object
function flattenJobSpec(jobSpec) {
  const flatJob = { ...jobSpec };
  if (flatJob['degree analysis']) {
    Object.keys(flatJob['degree analysis']).forEach(key => {
      flatJob[`degree_analysis_${key}`] = flatJob['degree analysis'][key];
    });
    delete flatJob['degree analysis'];
  }
  return flatJob;
}

// Convert job specs to CSV format
async function writeCsv(jobSpecs) {
  const flattenedJobs = jobSpecs.map(flattenJobSpec);
  const headers = Object.keys(flattenedJobs[0]).map(key => ({ id: key, title: key }));

  const csvWriter = createObjectCsvWriter({
    path: path.join(__dirname, 'nj_titles_state_prompt-1.csv'),
    header: headers
  });

  await csvWriter.writeRecords(flattenedJobs);
  console.log('CSV file written successfully');
}

// Main function
async function main() {
  await writeCsv(jobSpecs);
}

main().catch(console.error);
