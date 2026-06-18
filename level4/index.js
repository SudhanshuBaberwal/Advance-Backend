import { ChatGroq } from "@langchain/groq";
import {
  Annotation,
  MemorySaver,
  MessagesAnnotation,
  StateGraph,
} from "@langchain/langgraph";
import express, { response } from "express";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { TavilySearch } from "@langchain/tavily";

dotenv.config();
const app = express();
app.use(express.json());
const port = 5000;

// Without Langchain

// const ai = new GoogleGenAI({
//   apiKey: process.env.GEMINI_API_KEY,
// });

// app.post("/ai", async (req, res) => {
//   try {
//     const { input } = req.body;
//     const response = await ai.models.generateContent({
//       model: "gemini-2.5-flash",
//       contents: [
//         {
//           role: "system",
//           parts: [{ text: "you are a  assistant your name is Jarvis" }],
//         },
//         {
//           role: "user",
//           parts: [{ text: input }],
//         },
//       ],
//     });
//     return res.status(200).json({ ai: response.text });
//   } catch (error) {
//     return res.status(500).json({ message: error.message });
//     console.log(error.message);
//   }
// });

// const main = async () => {
//   try {
//     console.log(response.text);
//   } catch (error) {
//     console.log(error.message);
//   }
// };
// main()

// With Langchain

const tool = new TavilySearch({
  maxResults: 5,
  topic: "general",
});

const checkPointer = new MemorySaver();

// const State = Annotation.Root({
//   prompt: Annotation,
//   aiMsg: Annotation,
// });

const tools = [tool];
const toolNode = new ToolNode(tools);

const llm = new ChatGroq({
  model: "llama-3.3-70b-versatile",
  temperature: 0,
  maxTokens: 100,
  maxRetries: 2,
  // other params...
}).bindTools(tools);

const callLLM = async (state) => {
  try {
    console.log(state);
    const response = await llm.invoke([
      {
        role: "system",
        content: `You are Jarvis AI assistant

Use conversation memory first.

Only use tools when the answer requires
external real-time information like:
weather, news, web search, stock prices etc.

Do NOT call tools for simple conversation,
memory-based questions, greetings,
or personal context`,
      },
      ...state.messages,
    ]);

    return { messages: [response] };
  } catch (error) {
    console.log(error.message);
  }
};

const shouldContinue = async (state) => {
  const lastMessages = state.messages[state.messages.length - 1];
  if (lastMessages.tool_calls.length > 0) {
    return "tools";
  } else {
    return "__end__";
  }
};

const graph = new StateGraph(MessagesAnnotation)
  .addNode("agent", callLLM)
  .addNode("tools", toolNode)
  .addEdge("__start__", "agent")
  .addEdge("tools", "agent")
  .addConditionalEdges("agent", shouldContinue)
  .compile({ checkpointer: checkPointer });

app.post("/ai", async (req, res) => {
  try {
    const { input } = req.body;

    const response = await graph.invoke(
      {
        messages: [
          {
            role: "user",
            content: input,
          },
        ],
      },
      { configurable: { thread_id: "1" } },
    );
    console.log(response);
    return res
      .status(201)
      .json({ ai: response.messages[response.messages.length - 1].content });
  } catch (error) {
    return res.status(500).json({ message: error.message });
    console.log(error.message);
  }
});

app.get("/", (req, res) => {
  return res.status(200).json({ message: "Hello from level4" });
});

app.listen(port, () => {
  console.log("Server running on port : ", port);
});
