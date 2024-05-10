
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

import { PsBaseChatBot } from "@policysynth/api/base/chat/baseChatBot.js";
import { OpenAI } from "openai";
import { Stream } from "openai/streaming.mjs";
import { PsRagRouter } from "./router.js";
import { PsRagVectorSearch } from "./vectorSearch.js";
import { spawn } from 'child_process';



export class RebootingDemocracyChatBot extends PsBaseChatBot {
  persistMemory = true;

  mainSreamingSystemPrompt = `You are the Rebooting Democracy chatbot a friendly AI that helps users find information from a large database of documents.

Instructions:
- The user will ask a question, we will search a large database in a vector store and bring information connected to the user question into your <CONTEXT_TO_ANSWER_USERS_QUESTION_FROM> to provide a thoughtful answer from.
- If not enough information is available, you can ask the user for more information.
- Never provide information that is not backed by your context or is common knowledge.
- Look carefully at all in your context before you present the information to the user.
- Be optimistic and cheerful but keep a professional nordic style of voice.
- For longer outputs use bullet points and markdown to make the information easy to read.
- Do not reference your contexts and the different document sources just provide the information based on those sources.
- For all document sources we will provide the user with those you do not need to link or reference them.
- If there are inline links in the actual document chunks, you can provide those to the user in a markdown link format.
- Use markdown to format your answers, always use formatting so the response comes alive to the user.
- Keep your answers short and to the point except when the user asks for detail.
`;

  // Needed for the evaluation in Deepval
  deepevaltestCase ={
    query:'',
    actual_output:'', 
    retrieval_context:'',
    timestamp:''
  };

  userRequestsFilePath: string = "./webApps/deepeval/userRequestsFile.json";
  fileUserReqests:Record<string, any> ={};
 
  

  mainStreamingUserPrompt = (
    latestQuestion: string,
    context: string
  ) => `<LATEST_USER_QUESTION>
${latestQuestion}</LATEST_USER_QUESTION>

<CONTEXT_TO_ANSWER_USERS_QUESTION_FROM>
${context}
</CONTEXT_TO_ANSWER_USERS_QUESTION_FROM>

Your thoughtful answer in markdown:
`;


  sendSourceDocuments(document: PsSimpleDocumentSource[]) {
    const botMessage = {
      sender: "bot",
      type: "info",
      data: {
        name: "sourceDocuments",
        message: document,
      } as PsAgentStartWsOptions,
    } as PsAiChatWsMessage;

    if (this.wsClientSocket) {
      this.wsClientSocket.send(JSON.stringify(botMessage));
    } else {
      console.error("No wsClientSocket found");
    }
  }

  async streamWebSocketResponses(
    //@ts-ignore
    stream: Stream<OpenAI.Chat.Completions.ChatCompletionChunk>

  ) {
    console.log('in stream!~')
    return new Promise<void>(async (resolve, reject) => {
      this.sendToClient("bot", "", "start");
      try {
        let botMessage = "";
        for await (const part of stream) {
          this.sendToClient("bot", part.choices[0].delta.content!);
          botMessage += part.choices[0].delta.content!;
          this.addToExternalSolutionsMemoryCosts(
            part.choices[0].delta.content!,
            "out"
          );
          if (part.choices[0].finish_reason == "stop") {
            this.memory.chatLog!.push({
              sender: "bot",
              message: botMessage,
            } as PsSimpleChatLog);

            await this.saveMemoryIfNeeded();
          }
        }
        this.deepevaltestCase.actual_output= botMessage;


      } catch (error) {
        console.error(error);
        this.sendToClient(
          "bot",
          "There has been an error, please retry",
          "error"
        );
        reject();
      } finally {
        this.sendToClient("bot", "", "end");
      }
      resolve();
    });
  }

  async rebootingDemocracyConversation(
    chatLog: PsSimpleChatLog[],
    dataLayout: PsIngestionDataLayout
  ) {

    
    this.setChatLog(chatLog);

    const userLastMessage = chatLog[chatLog.length - 1].message;
    console.log(`userLastMessage: ${userLastMessage}`);

    const chatLogWithoutLastUserMessage = chatLog.slice(0, -1);
    console.log(
      `chatLogWithoutLastUserMessage: ${JSON.stringify(
        chatLogWithoutLastUserMessage,
        null,
        2
      )}`
    );

    this.sendAgentStart("Thinking...");
    const router = new PsRagRouter();
    const routingData = await router.getRoutingData(
      userLastMessage,
      dataLayout,
      JSON.stringify(chatLogWithoutLastUserMessage)
    );

    this.sendAgentStart("Searching Rebooting Democracy...");
    const vectorSearch = new PsRagVectorSearch();
    const searchContext = await vectorSearch.search(
      userLastMessage,
      routingData,
      dataLayout
    );

    console.log("In Rebooting Democracy conversation");
    let messages: any[] = chatLogWithoutLastUserMessage.map(
      (message: PsSimpleChatLog) => {
        return {
          role: message.sender,
          content: message.message,
        };
      }
    );

    const systemMessage = {
      role: "system",
      content: this.mainSreamingSystemPrompt,
    };

    messages.unshift(systemMessage);

    const finalUserQuestionText = `Original user question: ${userLastMessage} \nRewritten user question (for vector search): ${routingData.rewrittenUserQuestionVectorDatabaseSearch}`;

    const userMessage = {
      role: "user",
      content: this.mainStreamingUserPrompt(
        finalUserQuestionText,
        searchContext.responseText
      ),
    };

    messages.push(userMessage);

    // Eval vars need for evaluation
    this.deepevaltestCase.query = userLastMessage;
    this.deepevaltestCase.retrieval_context = `${searchContext.responseText}`;

    // console.log(`Messages to chatbot: ${JSON.stringify(messages, null, 2)}`);

    try {
      const stream = await this.openaiClient.chat.completions.create({
        model: "gpt-4-turbo",
        messages,
        max_tokens: 4000,
        temperature: 0.0,
        stream: true,
      });

      this.sendSourceDocuments(searchContext.documents);

     await this.streamWebSocketResponses(stream);
     
     await this.loadFileUserReqests();     
     // Prepare the evaluation data Object
     this.deepevaltestCase.timestamp= new Date().toISOString();
     const entryIndex =  Object.keys(this.fileUserReqests).length +1

     console.log("fileUserReqests",this.fileUserReqests);
     console.log("entryIndex: ", Object.keys(this.fileUserReqests), entryIndex)
      console.log("before adding to the json")
     this.fileUserReqests[entryIndex] = this.deepevaltestCase;
   console.log("after adding to the json")
      console.log(this.deepevaltestCase, "this.deepevaltestCase")
     
// Save evaluation Data in the file
   console.log("before saving file json")


     await this.saveFileUserData();
     // run the Deepeval over the entries
     console.log( this.deepevaltestCase, "after saving json and before sending webhook") 
     await this.deepEvaluateUserRequest(entryIndex);
    console.log("after sending webhook")

    } catch (err) {
      console.error(`Error in Rebooting Democracy chatbot: ${err}`);
    }
  }

  async loadFileUserReqests(): Promise<void> {
    try {
      const userdataJson = await fs.readFile(this.userRequestsFilePath, "utf-8");
      
      this.fileUserReqests = JSON.parse(userdataJson);
      
    } catch (error) {
      // First, check if the error is an instance of Error and has a 'code' property
      if (error instanceof Error && "code" in error) {
        const readError = error as { code: string }; // Type assertion
        if (readError.code === "ENOENT") {
          console.log("File does not exist, initializing empty metadata.");
          this.fileUserReqests = {}; // Initialize as empty object
        } else {
          // Handle other types of errors that might have occurred during readFile
          throw error;
        }
      } else {
        console.error("Error loading userReqeusts: " + error);
        process.exit(1); // Consider if this is the desired behavior
      }
    }
  }
  async deepEvaluateUserRequest(entryIndex) {
   // Path to the deepeval executable in the virtual environment
    const webhookUrl = 'https://policy-synth-chat-dev.thegovlab.com/webhook/hooks/eval-users'; // Replace with your actual webhook URL
    const data = {
	entry_key: entryIndex,
        message:'message send' 
    };

    try {
        const response = await fetch(webhookUrl, {
            method: 'POST',
            body: JSON.stringify(data),
            headers: { 'Content-Type': 'application/json' },
        });

        if (!response.ok) { // Check if response status code is not OK (200-299)
            throw new Error('Network response was not ok: ' + response.statusText);
        }

        const responseData = await response.json(); // Assuming the server responds with JSON
        console.log('Webhook triggered successfully:', responseData);
    } catch (error) {
        console.error('Error triggering webhook:', error);
    }

}
  async saveFileUserData(): Promise<void> {
    await fs.writeFile(
      this.userRequestsFilePath,
      JSON.stringify(this.fileUserReqests, null, 2)
    );
  }
  
}
