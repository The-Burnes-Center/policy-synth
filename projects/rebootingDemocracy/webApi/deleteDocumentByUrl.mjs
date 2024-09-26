import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();

const weaviateUrl = process.env.WEAVIATE_URL || 'http://localhost:8080';
const weaviateApiKey = process.env.WEAVIATE_APIKEY || ''; // Provide your API key if needed

// Replace with the URL of the document you want to delete
const documentUrl = 'https://rebootdemocracy.ai/blog/experimenting-with-nootebooklm';

async function deleteDocumentAndChunks() {
  // Step 1: Retrieve the document ID
  const docQuery = `
  {
    Get {
      RagDocument(
        where: {
          path: ["url"]
          operator: Equal
          valueString: "${documentUrl}"
        }
      ) {
        title
        url
        _additional {
          id
        }
      }
    }
  }
  `;

  const docResponse = await fetch(`${weaviateUrl}/v1/graphql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(weaviateApiKey && { 'Authorization': `Bearer ${weaviateApiKey}` }),
    },
    body: JSON.stringify({ query: docQuery }),
  });

  const docResult = await docResponse.json();

  const documents = docResult.data?.Get?.RagDocument;
  if (!documents || documents.length === 0) {
    console.log('Document not found.');
    return;
  }

  const documentId = documents[0]._additional.id;
  console.log(`docResult : ${JSON.stringify(documents)}`);
  console.log(`Document ID: ${documentId}`);

  // Step 2: Retrieve chunks associated with the document
  const chunksQuery = `
  {
    Get {
      RagDocumentChunk(
        where: {
          path: ["inDocument", "RagDocument", "_id"]
          operator: Equal
          valueString: "${documentId}"
        }
        limit: 100  # Adjust limit if you expect more chunks
      ) {
        title
        _additional {
          id
        }
      }
    }
  }
  `;


  const chunksResponse = await fetch(`${weaviateUrl}/v1/graphql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(weaviateApiKey && { 'Authorization': `Bearer ${weaviateApiKey}` }),
    },
    body: JSON.stringify({ query: chunksQuery }),
  });

  const chunksResult = await chunksResponse.json();

  const chunks = chunksResult.data?.Get?.RagDocumentChunk;
  if (!chunks || chunks.length === 0) {
    console.log('No chunks found for this document.');
  } else {
    console.log(`Chuns : ${JSON.stringify(chunks)}`);
    const chunkIds = chunks.map(chunk => chunk._additional.id);
    console.log(`Chunk IDs: ${chunkIds.join(', ')}`);

    // Step 3: Delete chunks
    // for (const chunkId of chunkIds) {
    //   const delChunkResponse = await fetch(`${weaviateUrl}/v1/objects/RagDocumentChunk/${chunkId}`, {
    //     method: 'DELETE',
    //     headers: {
    //       'Content-Type': 'application/json',
    //       ...(weaviateApiKey && { 'Authorization': `Bearer ${weaviateApiKey}` }),
    //     },
    //   });

    //   if (delChunkResponse.ok) {
    //     console.log(`Deleted chunk: ${chunkId}`);
    //   } else {
    //     console.error(`Failed to delete chunk: ${chunkId}`);
    //     const errorText = await delChunkResponse.text();
    //     console.error(`Error: ${errorText}`);
    //   }
    // }
  }

  // Step 4: Delete the document
  // const delDocResponse = await fetch(`${weaviateUrl}/v1/objects/RagDocument/${documentId}`, {
  //   method: 'DELETE',
  //   headers: {
  //     'Content-Type': 'application/json',
  //     ...(weaviateApiKey && { 'Authorization': `Bearer ${weaviateApiKey}` }),
  //   },
  // });

  // if (delDocResponse.ok) {
  //   console.log(`Deleted document: ${documentId}`);
  // } else {
  //   console.error(`Failed to delete document: ${documentId}`);
  //   const errorText = await delDocResponse.text();
  //   console.error(`Error: ${errorText}`);
  // }
}

deleteDocumentAndChunks().catch(err => console.error(err));