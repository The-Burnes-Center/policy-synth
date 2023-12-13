import { OpenAI } from "openai";
const DEBUGGING = true;
const config = {
    apiKey: process.env.OPENAI_KEY,
};
export const renderSystemPrompt = (currentRealityTree, parentNode, currentUDE, parentNodes = undefined) => {
    const parentIsUDE = parentNode.type === "ude";
    const prompt = `
    You are a helpful Logical Thinking Process assistant.

    Context: ${currentRealityTree.context}

    Undesirable Effect (UDE): ${currentUDE}

    ${parentNodes
        ? parentNodes.slice(1).reverse().map((node, index) => `
      ${index === 0 ? `Direct cause of UDE` : `Intermediate cause of UDE`}:
      ${node.description}

    `)
        : ""}

    We're working on analysing Current Reality Tree direct cause and immediate for this ${parentIsUDE ? 'UDE' : 'cause'}: ${parentNode.description}

    The user will submit his idea for a direct cause to: ${parentNode.description} you will analyze it and give him feedback.

    You have access to the whole chat history of the user.

    Important: You MUST evaluate the 3 direct causes before you output them and check the following:
    • 1. Are the premises and the conclusion likely to be true?
    • 2. Are the premises and the conclusion clearly stated?
    • 3. Are the logical connections between the premises and the conclusion clear?
    • 4. Are the premises sufficient to lead to the conclusion, and if not, what additional premises are needed?
    • 5. Are there some other potential causes that might lead to the same conclusion?
    • 6. Will the conclusion still be valid if one or more of the premises are removed?
    • 7. Are there any intermediate steps needed for the premises to lead to the conclusion?
    • 8. Is it possible that cause and effect are reversed in the statement?
    • 9. Does the statement express circular logic?

    In addition to refining the users direct cause, if it is viable at all, you will also return a total of 3 direct causes for: ${parentNode.description}, including the users refined direct cause, if it is viable.

    If the user is asking for clarification on previous conversation then decide if you want to send more refined direct causes back but you can also send just [] back if needed for the refinedCauses, but only if the user is asking for clarifications.

    Please output JSON without any explanation:
      { feedback: string, refinedCauses: string[] }

    Each of the refinedCauses JSON should never be more than 11 words long and should not end with a period.

    Always return refinedCauses if the user asks for them even if the user doesn't provide a valid cause him/herself.

    In the feedback offer a short paragraph to explain the context of LTP and Current Reality Trees, if relevant.

    You can use markdown to format the feedback in a single line, but not the refinedCauses. The feedback should always be output as string.

    Please be helpful to the user if he/she is asking for clarifications, the CRT process is sometimes complicated.

    You must never offer explainations outside the JSON, only output JSON.
  `;
    return prompt;
};
export const getRefinedCauses = async (crt, parentNode, currentUDE, chatLog, parentNodes = undefined) => {
    let nodeType;
    if (!parentNode) {
        nodeType = "ude";
    }
    else if (parentNode.type == "ude") {
        nodeType = "directCause";
    }
    else {
        nodeType = "intermediateCause";
    }
    let messages = chatLog.map((message) => {
        return {
            role: message.sender,
            content: message.message,
        };
    });
    const systemMessage = {
        role: "system",
        content: renderSystemPrompt(crt, parentNode, currentUDE, parentNodes),
    };
    messages.unshift(systemMessage);
    const openai = new OpenAI(config);
    if (DEBUGGING) {
        console.log("DEBUGGING: crt", JSON.stringify(crt, null, 2));
        console.log("=====================");
        console.log(renderSystemPrompt(crt, parentNode, currentUDE, parentNodes));
        console.log("---------------------");
        console.log(JSON.stringify(messages, null, 2));
        console.log("=====================");
    }
    const response = await openai.chat.completions.create({
        model: "gpt-4-1106-preview",
        messages,
        max_tokens: 4000,
        temperature: 0.7,
    });
    let rawMessage = response.choices[0].message.content;
    if (DEBUGGING) {
        console.log("DEBUGGING: rawMessage", rawMessage);
    }
    rawMessage = rawMessage.trim().replace(/```json/g, "");
    rawMessage = rawMessage.replace(/```/g, "");
    const parsedMessage = JSON.parse(rawMessage);
    if (DEBUGGING) {
        console.log("DEBUGGING: parsedMessage", JSON.stringify(parsedMessage, null, 2));
    }
    let returnMessage = {
        message: parsedMessage.feedback,
        rawMessage: rawMessage,
        refinedCausesSuggestions: parsedMessage.refinedCauses,
    };
    if (DEBUGGING) {
        returnMessage = { ...returnMessage, ...{
                debug: {
                    systemPromptUsedForGeneration: renderSystemPrompt(crt, parentNode, currentUDE, parentNodes),
                    firstUserMessageUserForGeneration: messages[1].content
                }
            } };
        console.log("DEBUGGING: final nodes", JSON.stringify(returnMessage, null, 2));
    }
    return returnMessage;
};
