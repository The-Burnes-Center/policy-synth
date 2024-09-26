import { PsRDChatbotAnswerVectorStore } from "../rdChatbotAnswer.js";

async function run() {
    const store = new PsRDChatbotAnswerVectorStore();
    await store.addSchema();
    process.exit(0);
}

run();
