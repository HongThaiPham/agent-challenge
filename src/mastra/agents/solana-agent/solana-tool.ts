import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import {
  createSolanaClient,
  generateKeyPairSigner,
  getExplorerLink,
  getSignatureFromTransaction,
  signTransactionMessageWithSigners,
  address,
} from "gill";
import {
  loadKeypairSignerFromEnvironment,
  loadKeypairSignerFromEnvironmentBase58,
} from "gill/node";
import {
  buildCreateTokenTransaction,
  buildMintTokensTransaction,
  getAssociatedTokenAccountAddress,
  TOKEN_2022_PROGRAM_ADDRESS,
} from "gill/programs/token";

// Define your tool using the `createtool`
export const createTokenTool = createTool({
  id: "create-token",
  description: "Create a new token on the Solana blockchain using Token 2022",
  inputSchema: z.object({
    name: z.string(),
    symbol: z.string(),
    decimals: z.number().optional().default(6),
    uri: z.string(),
    initialSupply: z.number(),
  }),
  outputSchema: z.object({
    mintAddress: z.string(),
    tokenAccount: z.string(),
    summary: z.string(),
  }),
  execute: async ({ context }) => {
    try {
      const { name, symbol, initialSupply, decimals, uri } = context;

      // Create Solana client connection (using devnet for development)
      const { rpc, sendAndConfirmTransaction } = createSolanaClient({
        urlOrMoniker: "devnet",
      });

      // Load the signer from the default Solana CLI keyfile
      const signer = await loadKeypairSignerFromEnvironmentBase58(
        "SOLANA_SECRET_KEY"
      );

      // Get the latest blockhash for transaction lifetime
      const { value: latestBlockhash } = await rpc.getLatestBlockhash().send();

      // Generate a new keypair for the token mint
      const mint = await generateKeyPairSigner();

      // Use Token 2022 program for advanced features
      const tokenProgram = TOKEN_2022_PROGRAM_ADDRESS;

      // Step 1: Create the token mint with metadata
      const createTokenTx = await buildCreateTokenTransaction({
        feePayer: signer,
        latestBlockhash,
        mint,
        tokenProgram,
        decimals: decimals ?? 6,
        metadata: {
          isMutable: true,
          name,
          symbol,
          uri,
        },
        metadataAddress: mint.address,
      });

      // Sign and send the create token transaction
      const signedCreateTx = await signTransactionMessageWithSigners(
        createTokenTx
      );
      const createSignature = getSignatureFromTransaction(signedCreateTx);
      await sendAndConfirmTransaction(signedCreateTx);

      // Step 2: Get the associated token account for the signer
      const ownerTokenAccount = await getAssociatedTokenAccountAddress(
        mint.address,
        signer.address,
        tokenProgram
      );

      // Step 3: Mint the initial supply to the signer's token account
      const mintTokensTx = await buildMintTokensTransaction({
        feePayer: signer,
        latestBlockhash: (await rpc.getLatestBlockhash().send()).value,
        mint: mint.address,
        mintAuthority: signer,
        destination: signer.address,
        amount: BigInt(initialSupply * Math.pow(10, decimals ?? 6)), // Adjust for decimals
        tokenProgram,
      });

      // Sign and send the mint tokens transaction
      const signedMintTx = await signTransactionMessageWithSigners(
        mintTokensTx
      );
      const mintSignature = getSignatureFromTransaction(signedMintTx);
      await sendAndConfirmTransaction(signedMintTx);

      // Generate explorer URLs for easy viewing

      const createTxExplorerUrl = getExplorerLink({
        cluster: "devnet",
        transaction: createSignature,
      });

      const mintTxExplorerUrl = getExplorerLink({
        cluster: "devnet",
        transaction: mintSignature,
      });

      const summary =
        `Successfully created token "${name}" (${symbol}) with ${initialSupply} initial supply. ` +
        `Mint address: ${mint.address}. Token account: ${ownerTokenAccount}. ` +
        `Create transaction: ${createTxExplorerUrl}. Mint transaction: ${mintTxExplorerUrl}`;

      return {
        mintAddress: mint.address,
        tokenAccount: ownerTokenAccount,
        summary,
      };
    } catch (error) {
      throw new Error(
        `Failed to create token: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  },
});
