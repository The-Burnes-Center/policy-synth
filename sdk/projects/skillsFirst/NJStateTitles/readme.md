# NJ Job Description Analyzer

This Node.js script analyzes job descriptions for degree requirements using OpenAI's GPT-4 model.

## Prerequisites

- Node.js (version 14 or later)
- npm (Node Package Manager)

## Installation

1. Clone this repository or download the script.
2. Navigate to the project directory in your terminal.
3. Run `npm install` to install the required dependencies.

## Environment Variables

Create a `.env` file in the root directory of the project and add the following:

OPENAI_API_KEY=your_openai_api_key_here

Replace `your_openai_api_key_here` with your actual OpenAI API key.

## File Structure

Ensure you have the following file structure:
```
project_root/
├── njStateTitleAnalysis.mjs
├── nj_titles_state_prompt-1.json
├── html/
│   ├── 21732.html
│   ├── 52341.html
│   └── ...
└── .env
```

- `njStateTitleAnalysis.mjs`: The main script file
- `nj_titles_state_prompt-1.json`: JSON file containing job specifications
- `html/`: Directory containing HTML files for each job description. The job descriptions have been downloaded as html files and [placed on the GoogleDrive](https://drive.google.com/drive/u/4/folders/1_wwTb-bedoUoHIQAIyEUxRm9lbMcCIN9) for the Skillsbased project. The originals can be found under [https://info.csc.state.nj.us/TItleList/StateList.aspx](https://info.csc.state.nj.us/TItleList/StateList.aspx)

## Usage

Run the script using the following command:
`node njStateTitleAnalysis.mjs`


## System Message and Prompt

The script uses the following system message and user prompt for the OpenAI API:

### System Message

```json
{
  "role": "system",
  "content": "You are a great job description analyzer and thorough! Reply in form of a JSON feed with the structure \n\n```json\n{\n  \"higher ed degree possible for eligibility\": true/false,\n  \"higher ed degree required for eligibility\": true/false\n}\n```"
}
```
### User Prompt
```json
{
  "role": "user",
  "content": "1. Does the job description include a higher education degree as a possible way to be eligible for the job?\n2. Does the job description include a higher education degree as a requirement to be eligible for the job?\nReply only with the JSON as provided in the System message. Be precise and thorough and do not make up information that do not exist. \n\n${textContent}"
}
```

## Output

The script will update the `nj_titles_state_prompt-1.json` file with the analyzed degree information for each job description. The updated JSON will include two new fields in the "degree analysis" object:

* `"higher ed degree possible for eligibility"`: boolean
* `"higher ed degree required for eligibility"`: boolean

## Rate Limiting

The script implements rate limiting to avoid exceeding OpenAI's API limits. It processes jobs in batches and includes a delay between batches.

## Error Handling

The script includes error handling for API rate limits and file reading errors. If a rate limit is encountered, it will retry the request after a specified delay.

# JSON to CSV Converter

This Node.js script converts a JSON file containing job specifications into a CSV file.

## Prerequisites

- Node.js (version 14 or later)
- npm (Node Package Manager)

## Installation

1. Clone this repository or download the script.
2. Navigate to the project directory in your terminal.
3. Run `npm install csv-writer` to install the required dependency.

## Usage

1. Ensure your JSON file is named `nj_titles_state_prompt-1.json` and is in the same directory as the script.
2. Run the script using the command: `node json-to-csv.mjs`

3. The script will generate a CSV file named `nj_titles_state_prompt-1.csv` in the same directory.

## Features

- Flattens nested 'degree analysis' object into top-level fields.
- Creates a CSV with all fields from the JSON, including flattened 'degree analysis' fields.
- Each JSON key becomes a column in the CSV.

## Note

Ensure you have write permissions in the directory where the script is located.

* Ensure you have sufficient API credits and comply with OpenAI's usage policies.
* The script may take a considerable amount of time to run, depending on the number of job descriptions to analyze.
