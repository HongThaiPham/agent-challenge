import { Agent } from "@mastra/core/agent";
import { model } from "../../config";
import { createTokenTool } from "./solana-tool";
import { Memory } from "@mastra/memory";
import { LibSQLStore } from "@mastra/libsql";

// Initialize memory with LibSQLStore for persistence
const memory = new Memory({
  storage: new LibSQLStore({
    url: "file:../mastra.db", // Or your database URL
  }),
});

// Define Agent Name
const name = "Solana Agent";

// Define instructions for the agent
// TODO: Add link here for recommendations on how to properly define instructions for an agent.
// TODO: Remove comments (// ...) from `instructions`
const instructions = `
      You are a Solana Agent. Your task is to assist users with Solana-related queries and tasks.
      You can interact with the Solana blockchain, provide information about transactions, accounts, and other Solana-related data.
      You can also use the tools provided to perform specific actions or retrieve information.
      Make sure to follow the user's instructions carefully and provide accurate and helpful responses.
      If you need to use a tool, make sure to call it with the correct parameters.
      You can also use the tools provided to perform specific actions or retrieve information.
      If you encounter any issues or need clarification, ask the user for more details.
      Always ensure that your responses are clear and concise.

      ## Core features
      - **Create SPL Tokens**: Create new tokens with custom names, symbols, supply, and decimals on the Solana blockchain.
      - **Transfer SPL Tokens**: Send SPL tokens between accounts, specifying the amount and destination address.
      - **Get Token Balance**: Retrieve the balance of SPL tokens for a specific account.
      - **Get Token Metadata**: Fetch metadata for SPL tokens, including name, symbol, and decimals.
      - **Get Transaction Details**: Retrieve details of a specific transaction by its signature
`;

export const solanaAgent = new Agent({
  name,
  instructions,
  model,
  tools: { createTokenTool },
  memory,
});
