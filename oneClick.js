import OpenAI from "openai";
import prompts from "./prompts/prompts.json" with { type: "json" };;
import dotenv from "dotenv";
dotenv.config();

const client = new OpenAI({
  apiKey: process.env.API_KEY,
});

async function callOpenaiApi(prompt) {
  try {
    console.log("PROMPT: ", prompt, "\n");
    const response = await client.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      temperature: 0,
    });
    return response.choices[0].message.content.trim();
  } catch (e) {
    console.error(`Error: ${e}`);
    return null;
  }
}

function interpolatePrompt(template, variables) {
  return Object.entries(variables).reduce(
    (str, [key, value]) => str.replace(new RegExp(`{{${key}}}`, "g"), value),
    template
  );
}

async function processPromptStep(promptKey, variables) {
  console.log(`\n\n${promptKey.toUpperCase()}\n`);
  const prompt = interpolatePrompt(prompts[promptKey], variables);
  const response = await callOpenaiApi(prompt);
  console.log(`OUTPUT: ${response}`);
  return response;
}

export async function oneClickSearch(patentText, date) {
  const responses = {};

  responses.response1 = await processPromptStep("prompt1", { patentText });
  responses.response2 = await processPromptStep("prompt2", {
    prompt1Response: responses.response1,
  });
  responses.response3 = await processPromptStep("prompt3a", {
    prompt2Response: responses.response2,
  });
  responses.response4 = await processPromptStep("prompt3b", {
    prompt3aResponse: responses.response3,
  });
  responses.response5 = await processPromptStep("prompt4", {
    prompt3bResponse: responses.response4,
    date,
  });

  const pattern = /~\[(.*?)\].*?\[(.*?)\].*?<([GN])>/g;
  let matches;
  const featureDict = {};

  while ((matches = pattern.exec(responses.response5)) !== null) {
    const element = matches[1].trim();
    const description = matches[2].trim();
    const classification = matches[3];

    featureDict[`${element}: ${description}`] = classification === "N" ? 1 : 0;
  }
  console.log("Feature Dictionary: ", featureDict);

  return {
    responses,
    featureAnalysis: featureDict,
  };
}
