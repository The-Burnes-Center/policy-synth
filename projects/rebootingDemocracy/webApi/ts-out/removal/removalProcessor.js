import { PsRagDocumentVectorStore } from "../vectorstore/ragDocument.js";
import { PsRagChunkVectorStore } from "../vectorstore/ragChunk.js";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from 'url';

// Define __filename and __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


export class RebootingDemocracyDeletionProcessor {
    weaviateUrl;
    weaviateApiKey;
    documentStore;
    chunkStore;
    fileMetadataPath;
    constructor() {
        this.weaviateUrl = process.env.WEAVIATE_HOST || 'http://localhost:8080';
        this.weaviateApiKey = process.env.WEAVIATE_APIKEY || '';
        this.documentUrl= process.env.REBOOT_DOCUMENT_URL;
        this.documentStore = new PsRagDocumentVectorStore();
        this.chunkStore = new PsRagChunkVectorStore();
          // Define the path to fileMetadata.json
        this.fileMetadataPath = path.join(__dirname, '../../src/ingestion/cache/fileMetadata.json');
 
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
       if (!dryRun) {
        const documentIds = [documentId];
        console.log("documentIds", documentIds);
        try {
          const delDocResponse = await this.documentStore.deleteDocumentsByIds(documentIds, dryRun);
          console.log(`Deleted document: ${documentId}`);
          console.log(`Deletion response: ${JSON.stringify(delDocResponse, null, 2)}`);
        } catch (err) {
          console.error(`Failed to delete document: ${documentId}`, err);
        }
      } else {
        console.log(`Dry run complete. Document would be deleted: ID ${documentId}`);
      }
         // Step 4: Remove the entry from fileMetadata.json
         await this.removeFromFileMetadata(documentUrl, dryRun);

    }
    async removeFromFileMetadata(documentUrl, dryRun = false) {
        try {
            // Read the existing fileMetadata.json
            const fileData = await fs.readFile(this.fileMetadataPath, 'utf8');
            const fileMetadata = JSON.parse(fileData);

            // Find the key associated with the given URL
            const keyToRemove = Object.keys(fileMetadata).find(key => fileMetadata[key].url === documentUrl);

            if (keyToRemove) {
                console.log(`Found key to remove: ${keyToRemove}`);

                if (dryRun) {
                    console.log(`Dry run enabled. The entry for key ${keyToRemove} would be removed.`);
                } else {
                    // Remove the entry
                    delete fileMetadata[keyToRemove];

                    // Write the updated object back to fileMetadata.json
                    await fs.writeFile(this.fileMetadataPath, JSON.stringify(fileMetadata, null, 2), 'utf8');
                    console.log(`Successfully removed entry for key ${keyToRemove} from fileMetadata.json`);
                }
            } else {
                console.log(`No entry found in fileMetadata.json for URL: ${documentUrl}`);
            }
        } catch (error) {
            console.error(`Error while removing entry from fileMetadata.json:`, error);
            throw error;
        }
    }
}
// Example usage:
(async () => {
    const deletionProcessor = new RebootingDemocracyDeletionProcessor();
    const documentUrl = process.env.REBOOT_DOCUMENT_URL;
    console.log(documentUrl)
    await deletionProcessor.deleteDocumentAndChunks(documentUrl);
})();


// (async () => {
//     const psRagDocumentVectorStore = new PsRagDocumentVectorStore();
//     const docUrl = process.env.REBOOT_DOCUMENT_URL;
//     try {
//         const documents = await psRagDocumentVectorStore.searchDocumentsByUrl(docUrl);

//         if (documents && documents.length > 0) {
//             const document = documents[0];
//             console.log('Retrieved Document:', JSON.stringify(document, null, 2));
//         } else {
//             console.log('No document found for the provided URL.');
//         }
//     } catch (error) {
//         console.error('An error occurred:', error);
//     }
// })();
//# sourceMappingURL=removalProcessor.js.map