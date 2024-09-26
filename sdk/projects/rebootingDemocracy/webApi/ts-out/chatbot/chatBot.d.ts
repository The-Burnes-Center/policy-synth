import { PsBaseChatBot } from "@policysynth/api/base/chat/baseChatBot.js";
import { OpenAI } from "openai";
import { Stream } from "openai/streaming.mjs";
export declare class RebootingDemocracyChatBot extends PsBaseChatBot {
    persistMemory: boolean;
    mainSreamingSystemPrompt: string;
    deepevaltestCase: {
        query: string;
        actual_output: string;
        retrieval_context: string;
        timestamp: string;
    };
    userRequestsFilePath: string;
    fileUserReqests: Record<string, any>;
    mainStreamingUserPrompt: (latestQuestion: string, context: string) => string;
    sendSourceDocuments(document: PsSimpleDocumentSource[]): void;
    streamWebSocketResponses(stream: Stream<OpenAI.Chat.Completions.ChatCompletionChunk>): Promise<void>;
    rebootingDemocracyConversation(chatLog: PsSimpleChatLog[], dataLayout: PsIngestionDataLayout): Promise<void>;
    loadFileUserReqests(): Promise<void>;
    deepEvaluateUserRequest(entryIndex: any): Promise<void>;
    saveFileUserData(): Promise<void>;
}
//# sourceMappingURL=chatBot.d.ts.map