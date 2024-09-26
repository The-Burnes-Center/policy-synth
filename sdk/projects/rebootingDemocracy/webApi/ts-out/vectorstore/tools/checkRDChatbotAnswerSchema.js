import weaviate from "weaviate-ts-client";

const client = weaviate.client({
  scheme: process.env.WEAVIATE_HTTP_SCHEME || "http",
  host: process.env.WEAVIATE_HOST || "localhost:8080",
  apiKey: new weaviate.ApiKey(process.env.WEAVIATE_APIKEY),
  headers: {
    'X-OpenAI-Api-Key': process.env.OPENAI_API_KEY,
  },
});

async function checkSchema() {
  try {
    const schema = await client.schema.getter().do();
    const rdChatbotAnswerClass = schema.classes.find(c => c.class === 'RDChatbotAnswer');

    if (rdChatbotAnswerClass) {
      console.log('RDChatbotAnswer schema exists:');
      console.log(JSON.stringify(rdChatbotAnswerClass, null, 2));
    } else {
      console.log('RDChatbotAnswer schema does not exist.');
    }
  } catch (error) {
    console.error('Error checking schema:', error.message);
  }
}

checkSchema();
