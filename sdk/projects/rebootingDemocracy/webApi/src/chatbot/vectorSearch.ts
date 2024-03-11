import { PolicySynthAgentBase } from "@policysynth/agents/baseAgent.js";
import { PsRagDocumentVectorStore } from "../vectorstore/ragDocument.js";

export class PsRagVectorSearch extends PolicySynthAgentBase {
  getChunkId(chunk: PsRagChunk, documentUrl: string): string {
    return `${documentUrl}#${chunk.chunkIndex}#${chunk.chapterIndex}`;
  }

  async search(
    userQuestion: string,
    routingData: any,
    dataLayout: any
  ): Promise<string> {
    const vectorStore = new PsRagDocumentVectorStore();
    const chunkResults: PsRagChunk[] =
      await vectorStore.searchChunksWithReferences(userQuestion);

    console.log(
      "Initial chunk results received:",
      JSON.stringify(chunkResults, null, 2)
    );

    const documentsMap: Map<
      string,
      PsRagDocumentSource
    > = new Map();
    const chunksMap: Map<string, PsRagChunk> =
      new Map();
    const addedChunkIdsMap: Map<string, Set<string>> = new Map(); // Tracks added chunk IDs for each document

    // Go through all the chunks and subChunks recursively and do cunk.id = this.getChunkId(chunk, documentUrl)
    let documentUrl: string | undefined;

    const recursiveChunkId = (chunk: PsRagChunk, documentUrl: string) => {
      chunk.id = this.getChunkId(chunk, documentUrl);
      if (chunk.inChunk) {
        chunk.inChunk.forEach((subChunk) => {
          recursiveChunkId(subChunk, documentUrl);
        });
      }
    };

    chunkResults.forEach((chunk) => {
      if (chunk.inDocument && chunk.inDocument.length) {
        documentUrl = chunk.inDocument[0].url;
        recursiveChunkId(chunk, documentUrl);
      }
    });

    const recursiveProcessChunkResults = (chunkResults: PsRagChunk[]) => {
      chunkResults.forEach((chunk) => {
        console.log(`Processing chunk ${chunk.compressedContent ? "Content" : "Summary"}: ${chunk.id} `);
        if (!chunksMap.has(chunk.id!)) {
          chunksMap.set(chunk.id!, { ...chunk, subChunks: [] });
        }
        if (chunk.inDocument && chunk.inDocument.length) {
          const doc = chunk.inDocument[0];
          if (!documentsMap.has(doc.url)) {
            documentsMap.set(doc.url, { ...doc, chunks: [] });
            addedChunkIdsMap.set(doc.url, new Set());
            console.log(`Document initialized: ${doc.url}`);
          }
        }
        if (chunk.inChunk) {
          console.log("----------------------------> RECURSIVE CALL ---------------------->");
          recursiveProcessChunkResults(chunk.inChunk);
        }
      });
    };

    recursiveProcessChunkResults(chunkResults);

    chunkResults.forEach((chunk) => {
      if (chunk._additional) {
        console.log(`\n\n${chunk.title}`);
        console.log(`C: ${(chunk.compressedContent && chunk.compressedContent!="") ? "Content" : "Summary"}`);
        console.log(
          `\nChunk info: ${chunk._additional.id} with distance: ${chunk._additional.distance} and confidence: ${chunk._additional.certainty}`
        );
        console.log(
          `Chunk info: ${chunk._additional.id} with relevance: ${chunk.relevanceEloRating}} and substance: ${chunk.substanceEloRating} and quality: ${chunk.qualityEloRating}\n\n`
        );
      }
      this.processChunk(chunk, chunksMap, documentsMap, addedChunkIdsMap);
    });

    const recursiveSortChunks = (chunk: PsRagChunk) => {
      if (chunk.subChunks && chunk.subChunks.length) {
        chunk.subChunks.sort((a, b) => a.chapterIndex - b.chapterIndex);
        chunk.subChunks.forEach((subChunk) => {
          recursiveSortChunks(subChunk);
        });
      }
    };

    chunkResults.forEach((chunk) => {
      recursiveSortChunks(chunk);
    });

    console.log("Processed chunk assignments complete.");
    return this.formatOutput(Array.from(documentsMap.values()));
  }

  processChunk(
    chunk: PsRagChunk,
    chunksMap: Map<string, PsRagChunk>,
    documentsMap: Map<string, PsRagDocumentSource>,
    addedChunkIdsMap: Map<string, Set<string>>
  ) {
    console.log(
      `Processing chunk: ${chunk.compressedContent ? "Content" : "Summary"} ${chunk.inChunk ? chunk.inChunk[0].id! : ""}`
    );
    const parentChunk =
      chunk.inChunk && chunk.inChunk.length
        ? chunksMap.get(chunk.inChunk[0].id!)
        : null;

    const doc =
      chunk.inDocument && chunk.inDocument.length
        ? documentsMap.get(chunk.inDocument[0].url)
        : null;
    const addedChunkIds = doc
      ? addedChunkIdsMap.get(chunk.inDocument![0].url)
      : null;

    if (!addedChunkIds || addedChunkIds.has(chunk.id!)) return; // Skip if already processed

    if (parentChunk) {
      // Add chunk to parentChunk's subChunks
      parentChunk.subChunks!.push(chunk);
      console.log(`Chunk assigned to chunk parent: ${chunk.compressedContent ? "Content" : "Summary"} ${chunk.title} in ${parentChunk.title}`);
      if (!parentChunk.inChunk) {
        doc!.chunks!.push(parentChunk);
      }
      // Note: Recursively calling processChunk here may not be necessary or should be carefully managed to avoid redundant processing
  } else if (doc) {
      doc.chunks!.push(chunk);
      console.log(`Chunk assigned to document: ${chunk.compressedContent ? "Content" : "Summary"} ${chunk.title} in ${doc.title}`);
      // Since we're directly modifying the doc object which is a reference in documentsMap, this change is reflected automatically
  }

    addedChunkIds.add(chunk.id!); // Mark as processed
  }

  formatOutput(
    documents: PsRagDocumentSource[]
  ): string {
    let output = "";

    documents.forEach((doc) => {
      if (!doc.title && !doc.url) return; // Skip empty DocumentSource
      console.log(`Formatting document: ${doc.shortDescription || doc.title}`);
      output += `Document: ${doc.shortDescription || doc.title}\nURL: ${
        doc.url
      }\n\n`;
      output += this.appendChunks(doc.chunks!, 1);
    });

    console.log("Final output:", output);
    return output.trim(); // Remove trailing new lines
  }

  appendChunks(chunks: PsRagChunk[], level: number): string {
    let chunkOutput = "";

    chunks.forEach((chunk) => {
      const prefix = `${" ".repeat(level * 2)}Chapter (${
        chunk.compressedContent ? "Content" : "Summary"
      }): `;
      console.log(`${prefix}${chunk.title}`);
      chunkOutput += `${prefix}${chunk.title}\n${" ".repeat(level * 2)}${
        chunk.compressedContent || chunk.fullSummary
      }\n\n`;
      if (chunk.subChunks && chunk.subChunks.length) {
        chunkOutput += this.appendChunks(chunk.subChunks, level + 1);
      }
    });

    return chunkOutput;
  }
}
