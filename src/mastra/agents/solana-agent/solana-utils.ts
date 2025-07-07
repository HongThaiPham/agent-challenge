import { createSolanaClient } from "gill";

export const SOLNA_RPC =
  process.env.SOLANA_RPC_URL || "https://api.devnet.solana.com";
export const { rpc, sendAndConfirmTransaction } = createSolanaClient({
  urlOrMoniker: "devnet",
});
