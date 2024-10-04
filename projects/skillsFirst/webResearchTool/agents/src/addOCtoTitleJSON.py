import csv
import json

# File paths
csv_file_path = 'master_sheet_skillsbased_StateTitle_Analysis.csv'
json_file_path = 'stateTitlesNJJobDescriptions.json'
categories_file_path = 'occupationalCategories.json'


# Load the JSON data from the file
with open(json_file_path, 'r') as file:
    job_data = json.load(file)

# Load the occupational categories JSON data from the file
with open(categories_file_path, 'r') as file:
    category_data = json.load(file)

# Create a dictionary to map subcategory IDs to main categories
subcategory_to_maincategory = {}
for main_category in category_data:
    main_category_id = main_category['id']
    for sub_category in main_category['subCategories']:
        sub_category_id = sub_category['id']
        subcategory_to_maincategory[sub_category_id] = main_category_id

# Read the CSV file and create a dictionary to map title codes to data from CSV
title_data = {}
valid_rows_count = 0
with open(csv_file_path, 'r', newline='', encoding='utf-8') as csvfile:
    reader = csv.DictReader(csvfile)
    for row in reader:
        # Normalize the title code by removing leading zeros
        title_code = row['TITLE CODE'].lstrip('0')
        sub_category_id = row['Occupational Sub Category ID']
        multi_level_job = row['Multilevel Job?']
        csc_revised = row['CSC revised']

        # Convert 'Yes'/'No' to boolean values
        multi_level_job_bool = multi_level_job.strip().lower() == 'yes'
        csc_revised_bool = csc_revised.strip().lower() == 'yes'

        # Get main category ID if subcategory ID is valid
        if sub_category_id != '#N/A' and sub_category_id != '':
            main_category_id = subcategory_to_maincategory.get(sub_category_id)
            if main_category_id:
                occupational_category = {
                    "mainCategory": main_category_id,
                    "subCategory": sub_category_id
                }
                valid_rows_count += 1
            else:
                occupational_category = None
        else:
            occupational_category = None

        # Store all the relevant data for the title code
        title_data[title_code] = {
            "occupationalCategory": occupational_category,
            "multiLevelJob": multi_level_job_bool,
            "cscRevised": csc_revised_bool
        }

# Update the JSON data with the data from the CSV
for job in job_data:
    # Normalize the title code by removing leading zeros
    title_code = job.get('titleCode', '').lstrip('0')
    job_error = job.get('error', '').strip()

    # Leave the occupationalCategory empty if the job has a 404 error
    if job_error == "404 Not Found":
        job['occupationalCategory'] = []
        continue  # Skip updating other fields for this job

    # Get the data from the CSV
    title_info = title_data.get(title_code)

    if title_info:
        # Update the occupationalCategory if present
        if title_info['occupationalCategory']:
            job['occupationalCategory'] = [title_info['occupationalCategory']]
        else:
            job['occupationalCategory'] = []

        # Update multiLevelJob and cscRevised
        job['multiLevelJob'] = title_info['multiLevelJob']
        job['cscRevised'] = title_info['cscRevised']
    else:
        # No matching title code found in CSV; set fields to default values
        job['occupationalCategory'] = []
        job['multiLevelJob'] = False
        job['cscRevised'] = False

# Save the updated JSON data back to the file
with open(json_file_path, 'w', encoding='utf-8') as file:
    json.dump(job_data, file, indent=2)

# Print the number of valid rows processed
print(f"Number of valid rows with occupational subcategory: {valid_rows_count}")
print("JSON data updated with data from CSV.")