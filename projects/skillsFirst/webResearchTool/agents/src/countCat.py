import json

# Load the job descriptions JSON data from the file
with open('stateTitlesNJJobDescriptions.json', 'r') as file:
    job_data = json.load(file)

# Load the occupational categories JSON data from the file
with open('occupationalCategories.json', 'r') as file:
    category_data = json.load(file)

# Initialize dictionaries to hold the counts
main_category_counts = {}
sub_category_counts = {}

# Iterate through each job title in the dataset
for job in job_data:
    # Skip job titles with "404 Not Found" error
    if '404' in job.get('error', ''):
        continue
    
    # Get the occupational categories
    occupational_categories = job.get('occupationalCategory', [])
    
    for category in occupational_categories:
        main_category = category.get('mainCategory')
        sub_category = category.get('subCategory')
        
        # Count main categories
        if main_category:
            if main_category not in main_category_counts:
                main_category_counts[main_category] = 0
            main_category_counts[main_category] += 1
        
        # Count subcategories
        if sub_category:
            if sub_category not in sub_category_counts:
                sub_category_counts[sub_category] = 0
            sub_category_counts[sub_category] += 1

# Add counts to the occupational categories JSON data
for main_category in category_data:
    main_category_id = main_category['id']
    main_category['count'] = main_category_counts.get(main_category_id, 0)
    
    for sub_category in main_category['subCategories']:
        sub_category_id = sub_category['id']
        sub_category['count'] = sub_category_counts.get(sub_category_id, 0)

# Save the updated occupational categories JSON data back to the file
with open('occupationalCategories.json', 'w') as file:
    json.dump(category_data, file, indent=2)

print("Counts added to occupational categories JSON file.")