import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import {
  address,
  createSolanaClient,
  getExplorerLink,
  GetTokenAccountBalanceApi,
} from "gill";
import {
  getAssociatedTokenAccountAddress,
  TOKEN_2022_PROGRAM_ADDRESS,
  TOKEN_PROGRAM_ADDRESS,
} from "gill/programs/token";

// Define the token balance tool
export const tokenBalanceTool = createTool({
  id: "token-balance",
  description:
    "Get the token balance for a specific wallet address and token mint",
  inputSchema: z.object({
    walletAddress: z
      .string()
      .describe("The wallet address to check balance for"),
    mintAddress: z.string().describe("The token mint address"),
  }),
  outputSchema: z.object({
    balance: z.string(),
    decimals: z.number(),
    balanceFormatted: z.string(),
    walletAddress: z.string(),
    mintAddress: z.string(),
    tokenAccountAddress: z.string(),
    summary: z.string(),
  }),
  execute: async ({ context }) => {
    try {
      const { walletAddress, mintAddress } = context;

      // Create Solana client connection (using devnet for development)
      const { rpc } = createSolanaClient({
        urlOrMoniker: "devnet",
      });

      // Convert string addresses to Address type
      const walletAddr = address(walletAddress);
      const mintAddr = address(mintAddress);

      // Get mint info to get decimals
      const mintInfo = await rpc
        .getAccountInfo(mintAddr, { encoding: "base64" })
        .send();

      if (!mintInfo.value) {
        throw new Error("Token mint not found");
      }

      // Choose the appropriate token program
      const tokenProgram = TOKEN_2022_PROGRAM_ADDRESS;

      // Get the associated token account address
      const tokenAccountAddress = await getAssociatedTokenAccountAddress(
        mintAddr,
        walletAddr,
        tokenProgram
      );

      // Get token account info to check if it exists and get balance
      const tokenAccountInfo = await rpc
        .getAccountInfo(tokenAccountAddress, { encoding: "base64" })
        .send();

      if (!tokenAccountInfo.value) {
        return {
          balance: "0",
          decimals: 0,
          balanceFormatted: "0",
          walletAddress,
          mintAddress,
          tokenAccountAddress: tokenAccountAddress.toString(),
          summary: `No token account found for wallet ${walletAddress} and mint ${mintAddress}. Balance is 0.`,
        };
      }

      // Get token account balance
      const tokenBalance = await rpc
        .getTokenAccountBalance(tokenAccountAddress)
        .send();

      if (!tokenBalance.value) {
        throw new Error("Failed to retrieve token account balance");
      }

      const balance = tokenBalance.value.amount;
      const decimals = tokenBalance.value.decimals;
      const balanceFormatted = tokenBalance.value.uiAmountString || "0";

      // Generate explorer URLs for easy viewing
      const walletExplorerUrl = getExplorerLink({
        cluster: "devnet",
        address: walletAddress,
      });

      const mintExplorerUrl = getExplorerLink({
        cluster: "devnet",
        address: mintAddress,
      });

      const tokenAccountExplorerUrl = getExplorerLink({
        cluster: "devnet",
        address: tokenAccountAddress.toString(),
      });

      const summary =
        `Token balance for wallet ${walletAddress}: ${balanceFormatted} tokens. ` +
        `Raw balance: ${balance} (with ${decimals} decimals). ` +
        `Token mint: ${mintAddress}. Token account: ${tokenAccountAddress.toString()}. ` +
        `View wallet: ${walletExplorerUrl}. View mint: ${mintExplorerUrl}. View token account: ${tokenAccountExplorerUrl}`;

      return {
        balance,
        decimals,
        balanceFormatted,
        walletAddress,
        mintAddress,
        tokenAccountAddress: tokenAccountAddress.toString(),
        summary,
      };
    } catch (error) {
      throw new Error(
        `Failed to get token balance: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  },
});
