import { WeaviateClient } from "weaviate-ts-client";
import { PolicySynthAgentBase } from "@policysynth/agents//baseAgent.js";
export declare class RagChunk extends PolicySynthAgentBase {
    static allFieldsToExtract: string;
    static client: WeaviateClient;
    addSchema(): Promise<void>;
    showScheme(): Promise<void>;
    deleteScheme(): Promise<void>;
    testQuery(): Promise<{
        data: any;
    }>;
    postChunk(chunkData: PsRagChunk): Promise<unknown>;
    updateChunk(id: string, chunkData: PsRagChunk, quiet?: boolean): Promise<unknown>;
    getChunk(id: string): Promise<PsRagChunk>;
    searchChunks(query: string): Promise<PsRagChunkGraphQlResponse>;
    searchChunksWithReferences(query: string, minRelevanceEloRating?: number, minSubstanceEloRating?: number): Promise<PsRagChunkGraphQlResponse>;
}
//# sourceMappingURL=ragChunk.d.ts.map