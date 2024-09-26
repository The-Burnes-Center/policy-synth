import weaviate from "weaviate-ts-client";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export class PsRDChatbotAnswerVectorStore {
static client = weaviate.client({
    scheme: process.env.WEAVIATE_HTTP_SCHEME || "http",
    host: process.env.WEAVIATE_HOST || "localhost:8080",
    apiKey: new weaviate.ApiKey(process.env.WEAVIATE_APIKEY),
    headers: {
        'X-OpenAI-Api-Key': process.env.OPENAI_API_KEY,
    },
});
    async addSchema() {
        let classObj;
        try {
            const filePath = path.join(__dirname, "./schemas/RDChatbotAnswer.json");
            const data = await fs.readFile(filePath, "utf8");
            classObj = JSON.parse(data);
        } catch (err) {
            console.error(`Error reading file from disk: ${err}`);
            return;
        }

        try {
            const res = await PsRDChatbotAnswerVectorStore.client.schema
                .classCreator()
                .withClass(classObj)
                .do();
            console.log(res);
        } catch (err) {
            console.error(`Error creating schema: ${err}`);
        }
    }
}
