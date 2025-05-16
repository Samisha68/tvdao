import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Tvdao } from "../target/types/tvdao";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";

// Load the keypair
function loadKeypair(pathStr: string): anchor.web3.Keypair {
  const fullPath = pathStr.replace("~", os.homedir());
  const secretKey = new Uint8Array(JSON.parse(fs.readFileSync(fullPath, "utf-8")));
  return anchor.web3.Keypair.fromSecretKey(secretKey);
}

async function main() {
  // Get the dao state public key from command line arguments
  const daoStatePubkey = new PublicKey(process.argv[2]);
  console.log("Using DAO State account:", daoStatePubkey.toBase58());
  
  // Initialize anchor provider - this will use the ANCHOR_* env vars
  anchor.setProvider(anchor.AnchorProvider.env());
  const provider = anchor.getProvider() as anchor.AnchorProvider;
  
  // Get the program from the workspace
  const program = anchor.workspace.Tvdao as Program<Tvdao>;
  console.log("Program ID:", program.programId.toBase58());
  
  // Load the dao state keypair from the saved file
  const daoStateKeypair = loadKeypair("~/.config/solana/tvdao-state-keypair.json");
  console.log("DAO State Keypair:", daoStateKeypair.publicKey.toBase58());
  
  // Ensure the keypair's public key matches the provided pubkey
  if (!daoStateKeypair.publicKey.equals(daoStatePubkey)) {
    throw new Error(
      `Provided public key ${daoStatePubkey.toBase58()} doesn't match loaded keypair ${daoStateKeypair.publicKey.toBase58()}`
    );
  }
  
  // Initialize the DAO state
  try {
    const txSignature = await program.methods
      .initializeDaoState()
      .accounts({
        daoState: daoStateKeypair.publicKey,
        authority: provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      } as any)
      .signers([daoStateKeypair])
      .rpc({ skipPreflight: true });
    
    console.log("Transaction signature:", txSignature);
    console.log("✅ DAO State initialized successfully");
    
    // Fetch and display the initialized state
    const daoState = await program.account.daoState.fetch(daoStateKeypair.publicKey);
    console.log("DAO State:", daoState);
    
  } catch (e) {
    console.error("❌ Failed to initialize DAO State:", e);
  }
}

main().then(
  () => process.exit(0),
  (err) => {
    console.error(err);
    process.exit(1);
  }
); 