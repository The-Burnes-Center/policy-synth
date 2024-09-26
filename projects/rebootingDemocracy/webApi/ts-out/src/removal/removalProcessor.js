import { PsRagDocumentVectorStore } from "../vectorstore/ragDocument.js";
import { PsRagChunkVectorStore } from "../vectorstore/ragChunk.js";
export class RebootingDemocracyDeletionProcessor {
    weaviateUrl;
    weaviateApiKey;
    documentStore;
    chunkStore;
    constructor() {
        this.weaviateUrl = process.env.WEAVIATE_HOST || 'http://localhost:8080';
        this.weaviateApiKey = process.env.WEAVIATE_APIKEY || '';
        this.documentStore = new PsRagDocumentVectorStore();
        this.chunkStore = new PsRagChunkVectorStore();
    }
    async deleteDocumentAndChunks(documentUrl, dryRun = false) {
        // Step 1: Retrieve the document ID
        const documents = await this.documentStore.searchDocumentsByUrl(documentUrl);
        const docVals = documents?.data?.Get?.RagDocument;
        console.log("docVals:", docVals);
        if (!docVals || docVals.length === 0) {
            console.log('Document not found.');
            return;
        }
        const documentId = docVals[0]._additional.id;
        console.log(`Document ID: ${documentId}`);
        // Step 2: Retrieve chunks associated with the document
        const chunksResult = await this.chunkStore.getChunksByDocumentId(documentId);
        const chunks = chunksResult?.data?.Get?.RagDocumentChunk;
        if (!chunks || chunks.length === 0) {
            console.log('No chunks found for this document.');
        }
        else {
            console.log(`Chunks: ${JSON.stringify(chunks, null, 2)}`);
            const chunkIds = chunks.map((chunk) => chunk._additional.id);
            console.log(`Chunk IDs: ${chunkIds.join(', ')}`);
            // Step 3: Delete chunks using batch deleter
            await this.chunkStore.deleteChunksByIds(chunkIds, dryRun);
        }
        // Step 4: Delete the document (if not a dry run)
        // if (!dryRun) {
        //   const delDocResponse = await this.documentStore.deleteDocumentById(documentId);
        //   if (delDocResponse) {
        //     console.log(`Deleted document: ${documentId}`);
        //   } else {
        //     console.error(`Failed to delete document: ${documentId}`);
        //   }
        // } else {
        //   console.log(`Dry run complete. Document would be deleted: ID ${documentId}`);
        // }
    }
}
// Example usage:
(async () => {
    const deletionProcessor = new RebootingDemocracyDeletionProcessor();
    const documentUrl = process.env.REBOOT_DOCUMENT_URL;
    await deletionProcessor.deleteDocumentAndChunks(documentUrl);
})();
//# sourceMappingURL=removalProcessor.js.map