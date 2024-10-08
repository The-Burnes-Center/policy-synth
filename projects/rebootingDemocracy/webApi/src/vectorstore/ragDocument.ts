import weaviate from "weaviate-ts-client";
import { WeaviateClient } from "weaviate-ts-client";
import { PolicySynthAgentBase} from "@policysynth/agents//baseAgent.js";

import { IEngineConstants } from "@policysynth/agents/constants.js";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export class PsRagDocumentVectorStore extends PolicySynthAgentBase{
  static allFieldsToExtract =
    "title url lastModified size \
       description shortDescription fullDescriptionOfAllContents \
      compressedFullDescriptionOfAllContents \
      contentType allReferencesWithUrls allOtherReferences \
      allImageUrls  documentMetaData\
     _additional { id, distance, confidence }";
     static urlField = `
     url
     _additional {
       id
     }
   `;

  static weaviateKey =  PsRagDocumentVectorStore.getWeaviateKey();

  static client: WeaviateClient = weaviate.client({
    scheme: process.env.WEAVIATE_HTTP_SCHEME || "http",
    host: process.env.WEAVIATE_HOST || "localhost:8080",
    apiKey: new weaviate.ApiKey(PsRagDocumentVectorStore.weaviateKey),
    headers: {
      'X-OpenAI-Api-Key': process.env.OPENAI_API_KEY,
    },
  });

  private static getWeaviateKey(): string {
    const key = process.env.WEAVIATE_APIKEY || "";  // Provide a default empty string if the key is undefined
    console.log(`Weaviate API Key: ${key ? 'Retrieved successfully' : 'Not found or is empty'}`);
    return key;
  }


  roughFastWordTokenRatio: number = 1.25;
  maxChunkTokenLength: number = 500;
  minQualityEloRatingForChunk = 920;

  getEstimateTokenLength(data: string): number {
    const words = data.split(" ");
    return words.length * this.roughFastWordTokenRatio;
  }

  async addSchema() {
    let classObj;
    try {
      const filePath = path.join(__dirname, "./schemas/RagDocument.json");
      const data = await fs.readFile(filePath, "utf8");
      classObj = JSON.parse(data);
    } catch (err) {
      console.error(`Error reading file from disk: ${err}`);
      return;
    }

    try {
      const res = await PsRagDocumentVectorStore.client.schema
        .classCreator()
        .withClass(classObj)
        .do();
      console.log(res);
    } catch (err) {
      console.error(`Error creating schema: ${err}`);
    }
  }

  async showScheme() {
    try {
      const res = await PsRagDocumentVectorStore.client.schema.getter().do();
      console.log(JSON.stringify(res, null, 2));
    } catch (err) {
      console.error(`Error creating schema: ${err}`);
    }
  }

  async deleteScheme() {
    try {
      const res = await PsRagDocumentVectorStore.client.schema
        .classDeleter()
        .withClassName("RagDocument")
        .do();
      console.log(res);
    } catch (err) {
      console.error(`Error creating schema: ${err}`);
    }
  }

  async deleteDocumentsByIds(documentIds: string[], dryRun: boolean = false): Promise<void> {
    try {
      const response = await PsRagDocumentVectorStore.client.batch
        .objectsBatchDeleter()
        .withClassName("RagDocument")
        .withWhere({
          path: ['id'],
          operator: 'ContainsAny',
          valueTextArray: documentIds,
        })
        .withDryRun(dryRun)
        .withOutput('verbose')
        .do();

      console.log(`Deletion response: ${JSON.stringify(response, null, 2)}`);

      if (dryRun) {
        console.log(`Dry run complete. Objects that would be deleted:`);
        response.matchingObjects.forEach((obj: any) => {
          console.log(`- ID: ${obj.id}, Status: ${obj.status}`);
        });
      } else {
        console.log(`Successfully deleted documents with IDs: ${documentIds.join(', ')}`);
      }
    } catch (err) {
      console.error(`Error deleting documents:`, err);
    }
  }

  async testQuery() {
    const where: any[] = [];

    const res = await PsRagDocumentVectorStore.client.graphql
      .get()
      .withClassName("RagDocument")
      .withFields(
        // TODO: confirm fields
        PsRagDocumentVectorStore.allFieldsToExtract
      )
      .withNearText({ concepts: ["case study"] })
      .withLimit(100)
      .do();

    console.log(JSON.stringify(res, null, 2));
    return res;
  }

  //TODO: Move to base class
  async retry<T>(fn: () => Promise<T>, retries = 10, delay = 5000): Promise<T> {
    try {
      return await fn();
    } catch (err) {
      if (retries > 1) {
        await new Promise((resolve) => setTimeout(resolve, delay));
        return this.retry(fn, retries - 1, delay);
      } else {
        throw err;
      }
    }
  }

  async postDocument(document: PsRagDocumentSource): Promise<string | undefined> {
    console.log(`Posting document ${JSON.stringify(document, null, 2)}`);
    return this.retry(async () => {
      try {
        const res = await PsRagDocumentVectorStore.client.data
        .creator()
        .withClassName("RagDocument")
        .withProperties(document as any)
        .do();

      this.logger.info(`Weaviate: Have saved document ${document.url} ${res.id}`);
      return res.id!;
      } catch (error) {
        console.error(`Error posting document: ${error}`);
      }
    }, 10, 5000);
  }

  async updateDocument(
    id: string,
    documentData: PsRagDocumentSource,
    quiet = false
  ) {
    return new Promise((resolve, reject) => {
      PsRagDocumentVectorStore.client.data
        .merger()
        .withId(id)
        .withClassName("RagDocument")
        .withProperties(documentData as any)
        .do()
        .then((res) => {
          if (!quiet)
            this.logger.info(`Weaviate: Have updated web solutions for ${id}`);
          resolve(res);
        })
        .catch((err) => {
          this.logger.error(err.stack || err);
          reject(err);
        });
    });
  }

  async getDocument(id: string): Promise<PsRagDocumentSource> {
    return new Promise((resolve, reject) => {
      PsRagDocumentVectorStore.client.data
        .getterById()
        .withId(id)
        .withClassName("RagDocument")
        .do()
        .then((res) => {
          this.logger.info(`Weaviate: Have got web page ${id}`);
          const webData = (res as PsWebPageGraphQlSingleResult)
            .properties as PsRagDocumentSource;
          resolve(webData);
        })
        .catch((err) => {
          reject(err);
        });
    });
  }

  async searchDocuments(
    query: string,
  ): Promise<PsRagDocumentSourceGraphQlResponse> {
    const where: any[] = [];

    let results;

    try {
      results = await PsRagDocumentVectorStore.client.graphql
        .get()
        .withClassName("RagDocument")
        .withNearText({ concepts: [query] })
        .withLimit(IEngineConstants.limits.webPageVectorResultsForNewSolutions)
        /*.withWhere({
          operator: "And",
          operands: where,
        })*/
        .withFields(PsRagDocumentVectorStore.allFieldsToExtract)
        .do();
    } catch (err) {
      throw err;
    }

    return results as PsRagDocumentSourceGraphQlResponse;
  }

async searchDocumentsByUrl(docUrl: string): Promise<PsRagDocumentSourceGraphQlResponse | undefined | null> {
    const where = {
      operator: "Equal",
      path: ["url"],
      valueString: docUrl,
    };
  
    try {
      const results = await PsRagDocumentVectorStore.client.graphql
        .get()
        .withClassName("RagDocument")
        .withWhere(where)
        .withFields(PsRagDocumentVectorStore.urlField)
        .do();
  
      if (!results || !results.data || !results.data.Get || !results.data.Get.RagDocument) {
        console.log('No documents found.');
        return null;
      }
  
      return results;
    } catch (err) {
      console.error('Error while querying documents:', err);
      throw err;
    }
  }

 async mergeUniqueById(arr1:any[], arr2:any[]) {
    // Helper function to filter duplicates within an array
    const mergedArray = [...arr1, ...arr2];

    // Step 2: Filter out duplicates from the merged array
    const unique = new Map();
    mergedArray.forEach(item => {
      const id = item._additional?.id;
      if (id) {
        unique.set(id, item);
      }
    });

    // Convert the Map back into an array
    return Array.from(unique.values());
  }


  async searchChunksWithReferences(
    query: string
  ): Promise<PsRagChunk[]> {
    let resultsNearText;
    let resultsBm25;

    const where: any[] = [
      {
        path: ['compressedContent'],
        operator: 'IsNull',
        valueBoolean: false
      }
    ];
    const searchFields=`
    title
    chunkIndex
    chapterIndex
    mainExternalUrlFound
    shortSummary
    fullSummary
    relevanceEloRating
    qualityEloRating
    substanceEloRating
    compressedContent
    _additional { id, distance, certainty }

    inDocument {
      ... on RagDocument {
        title
        url
        description
        shortDescription
        compressedFullDescriptionOfAllContents
        relevanceEloRating
        qualityEloRating
        substanceEloRating
        allReferencesWithUrls
        contentType
      }
    }

    mostRelevantSiblingChunks {
      ... on RagDocumentChunk {
        title
        chapterIndex
        chunkIndex
        fullSummary
        relevanceEloRating
        qualityEloRating
        substanceEloRating
        compressedContent
      }
    }

    allSiblingChunks {
      ... on RagDocumentChunk {
        title
        chapterIndex
        chunkIndex
        fullSummary
        relevanceEloRating
        qualityEloRating
        substanceEloRating
        compressedContent
      }
    }

    inChunk {
      ... on RagDocumentChunk {
        title
        chunkIndex
        chapterIndex
        mainExternalUrlFound
        shortSummary
        fullSummary
        relevanceEloRating
        qualityEloRating
        compressedContent

        inChunk {
          ... on RagDocumentChunk {
            title
            chunkIndex
            chapterIndex
            shortSummary
            fullSummary
            compressedContent

            inChunk {
              ... on RagDocumentChunk {
                title
                chunkIndex
                chapterIndex
                shortSummary
                fullSummary
                compressedContent

                inChunk {
                  ... on RagDocumentChunk {
                    title
                    chunkIndex
                    chapterIndex
                    shortSummary
                    fullSummary
                    compressedContent

                    inChunk {
                      ... on RagDocumentChunk {
                        title
                        chunkIndex
                        chapterIndex
                        shortSummary
                        fullSummary
                        compressedContent
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  `


try {
  // Start both promises simultaneously and wait for all to finish
  const [resultsNearText, resultsBm25] = await Promise.all([
    PsRagDocumentVectorStore.client.graphql
      .get()
      .withClassName("RagDocumentChunk")
      .withNearText({ concepts: [query] })
      .withLimit(12)
      .withWhere({
        operator: "And",
        operands: where,
      })
      .withFields(searchFields)
      .do(),
    PsRagDocumentVectorStore.client.graphql
      .get()
      .withClassName("RagDocumentChunk")
      .withBm25({ 'query': query })
      .withLimit(2)
      .withFields(searchFields)
      .do()
  ]);

  // Assuming mergeUniqueById is already defined and can be used here directly
  const resultsCombined = await this.mergeUniqueById(resultsBm25.data.Get.RagDocumentChunk, resultsNearText.data.Get.RagDocumentChunk);

  return resultsCombined as PsRagChunk[];
} catch (err) {
  console.error(err);
  throw err;
}

  }


}
