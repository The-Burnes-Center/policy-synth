import { OpenAIClient, AzureKeyCredential } from "@azure/openai";
import { BaseChatModel } from "./baseChatModel";
import { encoding_for_model } from "tiktoken";
export class AzureOpenAiChat extends BaseChatModel {
    client;
    deploymentName;
    constructor(endpoint, apiKey, deploymentName, modelName = "gpt-4o") {
        super(modelName);
        this.client = new OpenAIClient(endpoint, new AzureKeyCredential(apiKey));
        this.deploymentName = deploymentName;
    }
    async generate(messages, streaming, streamingCallback) {
        const chatMessages = messages.map((msg) => ({
            role: msg.role,
            content: msg.message,
        }));
        if (streaming) {
            const events = await this.client.streamChatCompletions(this.deploymentName, chatMessages, { maxTokens: 128 });
            for await (const event of events) {
                for (const choice of event.choices) {
                    const delta = choice.delta?.content;
                    if (delta !== undefined && streamingCallback) {
                        streamingCallback(delta);
                    }
                }
            }
        }
        else {
            const result = await this.client.getChatCompletions(this.deploymentName, chatMessages, { maxTokens: 128 });
            return result.choices.map((choice) => choice.message?.content).join("");
        }
    }
    async getNumTokensFromMessages(messages) {
        const encoder = encoding_for_model(this.modelName);
        const chatMessages = messages.map((msg) => ({
            role: msg.role,
            content: msg.message,
        }));
        const tokenCounts = chatMessages.map((msg) => encoder.encode(msg.content).length);
        return tokenCounts.reduce((acc, count) => acc + count, 0);
    }
}
//# sourceMappingURL=azureOpenAiChat.js.map