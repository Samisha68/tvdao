// @ts-check
// Force CommonJS module type
// @ts-ignore
// @packageDocumentation
import anchor from "@coral-xyz/anchor";
import {
  Keypair,
  SystemProgram,
  PublicKey,
  Connection,
  clusterApiUrl,
} from "@solana/web3.js";

// Destructure the needed types and classes
const { Program, AnchorProvider } = anchor;
// Define types 
type Wallet = anchor.Wallet;
type Idl = anchor.Idl;

// --- CONFIGURATION ---
const PROGRAM_ID = new PublicKey(
  process.env.PROGRAM_ID || "2HL7u9iKaj5BEJZ523WsLquPeMZKYMzLhZQ7et4HX7jA"
);
const AUTHORITY_WALLET_PATH =
  process.env.AUTHORITY_WALLET_PATH || "~/.config/solana/id.json";
const DAO_STATE_KEYPAIR_PATH =
  process.env.DAO_STATE_KEYPAIR_PATH ||
  "~/.config/solana/tvdao-state-keypair.json";

// A simple NodeWallet implementation for scripts
class NodeWallet implements Wallet {
  readonly payer: Keypair;

  constructor(payer: Keypair) {
    this.payer = payer;
  }

  get publicKey(): PublicKey {
    return this.payer.publicKey;
  }

  async signTransaction<T extends anchor.web3.Transaction | anchor.web3.VersionedTransaction>(
    tx: T
  ): Promise<T> {
    if (tx instanceof anchor.web3.Transaction) {
      tx.partialSign(this.payer);
    }
    return tx;
  }

  async signAllTransactions<T extends anchor.web3.Transaction | anchor.web3.VersionedTransaction>(
    txs: T[]
  ): Promise<T[]> {
    return txs.map((t) => {
      if (t instanceof anchor.web3.Transaction) {
        t.partialSign(this.payer);
      }
      return t;
    });
  }
}

// Helper to load keypair from a file path
function loadKeypair(keypairPath: string): Keypair {
  const fs = require("fs");
  const path = require("path");
  const homeDir = process.env.HOME || process.env.USERPROFILE;

  let pathToResolve = keypairPath;
  if (keypairPath.startsWith("~")) {
    if (!homeDir) {
      throw new Error(
        "Cannot resolve tilde path: HOME or USERPROFILE environment variable is not set."
      );
    }
    pathToResolve = keypairPath.replace("~", homeDir);
  }

  const resolvedPath = path.resolve(pathToResolve);
  if (!fs.existsSync(resolvedPath)) {
    throw new Error(
      `Keypair file not found at path: ${resolvedPath}. Please generate it first.`
    );
  }
  const keypairJson = fs.readFileSync(resolvedPath, "utf-8");
  return Keypair.fromSecretKey(Uint8Array.from(JSON.parse(keypairJson)));
}

async function main() {
  require("dotenv").config({
    path: require("path").resolve(__dirname, "../../.env"),
  });

  const connection = new Connection(
    process.env.SOLANA_RPC_URL || clusterApiUrl("devnet"),
    "confirmed"
  );

  let authorityKeypair: Keypair;
  let daoStateKeypair: Keypair;

  try {
    authorityKeypair = loadKeypair(AUTHORITY_WALLET_PATH);
    daoStateKeypair = loadKeypair(DAO_STATE_KEYPAIR_PATH);

    console.log(
      "✅ Authority wallet loaded:",
      authorityKeypair.publicKey.toBase58()
    );
    console.log(
      "📌 DAO State Keypair loaded:",
      daoStateKeypair.publicKey.toBase58()
    );
  } catch (error: any) {
    console.error("❌ Failed to load keypairs:", error.message);
    return;
  }

  const wallet = new NodeWallet(authorityKeypair);
  const provider = new AnchorProvider(connection, wallet, {
    commitment: "confirmed",
  });
  anchor.setProvider(provider);

  let idlJson: Idl;
  try {
    const fs = require("fs");
    const path = require("path");
    idlJson = JSON.parse(
      fs.readFileSync(
        path.resolve(__dirname, "../src/idl/tvdao.json"),
        "utf-8"
      )
    ) as Idl;
  } catch (e) {
    console.error(
      "❌ Failed to load IDL from src/idl/tvdao.json. Did you copy it from target/idl/tvdao.json?",
      e
    );
    return;
  }

  // Create program using anchor.Program constructor with correct argument order
  // @ts-ignore - TypeScript type inconsistencies in the anchor.Program constructor
  const program = new anchor.Program(idlJson, PROGRAM_ID, provider);
  
  console.log("✅ Program loaded. Program ID:", program.programId.toBase58());

  try {
    // @ts-ignore - TypeScript doesn't know about daoState 
    const existingDaoState = await program.account.daoState.fetch(
      daoStateKeypair.publicKey
    );
    console.log(
      "⚠️ DaoState already exists at:",
      daoStateKeypair.publicKey.toBase58()
    );
    console.log("Existing state:", existingDaoState);
    return;
  } catch (e) {
    console.log("✅ DaoState not found — proceeding with initialization...");
  }

  try {
    // @ts-ignore - TypeScript type issues with program.methods
    const txSignature = await program.methods
      .initializeDaoState()
      .accounts({
        daoState: daoStateKeypair.publicKey,
        authority: authorityKeypair.publicKey,
        system_program: SystemProgram.programId, // Using snake_case to match Rust
      })
      .signers([daoStateKeypair, authorityKeypair])
      .rpc({ skipPreflight: true });

    const { blockhash, lastValidBlockHeight } =
      await connection.getLatestBlockhash();
    await connection.confirmTransaction(
      {
        signature: txSignature,
        blockhash,
        lastValidBlockHeight,
      },
      "confirmed"
    );

    console.log("✅ Transaction confirmed:", txSignature);
    console.log(
      "🎉 --- DAO STATE INITIALIZED SUCCESSFULLY ---",
      daoStateKeypair.publicKey.toBase58()
    );

    // @ts-ignore - TypeScript doesn't know about daoState
    const fetched = await program.account.daoState.fetch(
      daoStateKeypair.publicKey
    );
    console.log("📦 DAO State:", fetched);
  } catch (error: any) {
    console.error("❌ Error initializing DAO State:", error.message);
    if (error instanceof anchor.AnchorError) {
      console.error("AnchorError Code:", error.error.errorCode.code);
      console.error("Message:", error.error.errorMessage);
      console.error("Logs:", error.logs);
    }
  }
}

main().then(
  () => console.log("🏁 Script complete."),
  (err) => console.error("❌ Script failed:", err)
);
 