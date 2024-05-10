import pytest
from deepeval import assert_test
from deepeval.metrics import ContextualRelevancyMetric
from deepeval.metrics import AnswerRelevancyMetric
from deepeval.metrics import FaithfulnessMetric
from deepeval.test_case import LLMTestCase
import os
import json

print("Current Working Directory: ", os.getcwd())

# Load the data from a JSON file
with open('../webApp/deepeval/userRequestsFile.json', 'r') as file:
    data = json.load(file)

# Assuming you want to process the entry with key "1"
entry_key = "19"
entry = data[entry_key]

metricARM = AnswerRelevancyMetric(
    threshold=0.7,
    model="gpt-4-turbo",
    include_reason=True
)


metricCRM = ContextualRelevancyMetric(
    threshold=0.7,
    model="gpt-4-turbo",
    include_reason=True
)

metricFM = FaithfulnessMetric(
    threshold=0.7,
    model="gpt-4-turbo",
    include_reason=True
)


# Setup the test case using data from the JSON file
test_case = LLMTestCase(
    input=entry["query"],
    actual_output=entry["actual_output"],
    retrieval_context=[entry["retrieval_context"]],
)

# Setup and evaluate the metric
resultCRM = metricCRM.measure(test_case)
resultFM = metricFM.measure(test_case)
resultARM = metricARM.measure(test_case)


# Prepare the results to be added to the original entry
results = {
    "ContextualRelevancy":{
    "score":  metricCRM.score,
    "reason": metricCRM.reason
},
    "Faithfulness":{
    "score":  metricFM.score,
    "reason": metricFM.reason
},
    "AnswerRelevancyMetric":{
    "score":  metricARM.score,
    "reason": metricARM.reason
}
}

# Add the evaluation results to the original entry
entry["evaluation_results"] = results

# Save the updated data back to the same JSON file
with open('../webApp/deepeval/userRequestsFile.json', 'w') as outfile:
    json.dump(data, outfile, indent=4)

# Optionally, print the updated entry for verification
print(json.dumps(data[entry_key], indent=4))
