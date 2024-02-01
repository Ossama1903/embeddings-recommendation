const fs = require("fs");
const { ChromaClient } = require("chromadb");
const { OpenAIEmbeddingFunction } = require("chromadb");
const openai = require("openai");

// Read the text file
const filePath = "Scraped knowledgebase for mynextmove chatbot.txt";
const fileContent = fs.readFileSync(filePath, "utf-8");

// Split the content into individual profession sections
const professionSections = fileContent.split(
  "##############################################"
);

const OpenAI = new openai({
  apiKey: "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", // This is also the default, can be omitted
});

// Remove empty sections (if any)
const nonEmptySections = professionSections.filter(
  (section) => section.trim() !== ""
);

// Create an array of objects
const professions = nonEmptySections.map((section, index) => {
  const lines = section.split("\n");
  const title =
    index === 0
      ? lines[0].trim().replace("Title: ", "")
      : lines[1].trim().replace("Title: ", "");
  const information = lines
    .slice(2)
    .join("\n")
    .trim()
    .replace("Information:\n", "");

  return { title, information };
});

// Creating a client to communicate with the Chromadb instance.
const client = new ChromaClient();

// An embedder to create the embeddings
const embedder = new OpenAIEmbeddingFunction({
  openai_api_key: "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",
});

const createCollection = async (collectionName) => {
  const collection = await client.createCollection({
    name: collectionName,
    embeddingFunction: embedder,
  });

  await collection.add({
    ids: professions.map((profession) => profession.title),
    documents: professions.map(
      (profession) => `${profession.title} ${profession.information}`
    ),
  });

  return collection;
};

const getCollection = async (collectionName) => {
  const collection = await client.getCollection({
    name: collectionName,
    embeddingFunction: embedder,
  });

  await collection.add({
    ids: professions.map((profession) => profession.title),
    documents: professions.map(
      (profession) => `${profession.title} ${profession.information}`
    ),
  });

  return collection;
};

const main = async () => {
  let prompt =
    "I will tell you some things about myself and based on that I want you to recommend me 30 professions. Here they are: ";

  STRONGLY_DISLIKE = "strongly dislike to";
  DISLIKE = "moderately dislike to";
  UNSURE = "am unsure about whether I want to";
  LIKE = "like to";
  STRONGLY_LIKE = "love to";

  prompt += `I ${STRONGLY_DISLIKE} assemble electronic parts`;

  const chatCompletion = await OpenAI.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [{ role: "user", content: prompt }],
  });
  agentResponse = chatCompletion.choices[0].message.content;

  const collection = await getCollection("eleventh_proper_test_collection");

  const results = await collection.query({
    nResults: 10,
    queryTexts: [agentResponse],
  });

  console.log(results.ids[0]);
};

main();

// I HAVE SUCCESSFULLY GENERATED EMBEDDINGS -- NEED TO WRITE PROPER DOCUMENTATION FOR THIS
// I HAVE INTEGRATED OpenAI chatbot as well --
// NEXT create a prompt that allows us to pass all the questions and generate a response (No need for history here, this might be possible in just a single prompt) shouldn't take longer than 10-20 minutes
// Next step is to pass the embeddings to the chatbot (need to look up the syntax for this) with the generated prompt
