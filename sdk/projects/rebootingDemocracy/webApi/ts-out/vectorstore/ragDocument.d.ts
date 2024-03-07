import { WeaviateClient } from "weaviate-ts-client";
import { PolicySynthAgentBase } from "@policysynth/agents//baseAgent.js";
export declare class RagDocumentVectorStore extends PolicySynthAgentBase {
    static allFieldsToExtract: string;
    static client: WeaviateClient;
    addSchema(): Promise<void>;
    showScheme(): Promise<void>;
    deleteScheme(): Promise<void>;
    testQuery(): Promise<{
        data: any;
    }>;
    postDocument(document: PsRagDocumentSource): Promise<unknown>;
    updateDocument(id: string, documentData: PsRagDocumentSource, quiet?: boolean): Promise<unknown>;
    getDocument(id: string): Promise<PsRagDocumentSource>;
    searchDocuments(query: string): Promise<PsRagDocumentSourceGraphQlResponse>;
}
//# sourceMappingURL=ragDocument.d.ts.map