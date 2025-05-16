// CommonJS script to initialize the DAO state
const anchor = require("@coral-xyz/anchor");
const web3 = require("@solana/web3.js");
const fs = require("fs");
const path = require("path");
const os = require("os");

// Extract what we need from anchor and web3
const { PublicKey, Keypair, SystemProgram, Connection, clusterApiUrl } = web3;
const { Program, AnchorProvider } = anchor;

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
class NodeWallet {
  constructor(payer) {
    this.payer = payer;
  }

  get publicKey() {
    return this.payer.publicKey;
  }

  async signTransaction(tx) {
    if (tx instanceof anchor.web3.Transaction) {
      tx.partialSign(this.payer);
    }
    return tx;
  }

  async signAllTransactions(txs) {
    return txs.map((t) => {
      if (t instanceof anchor.web3.Transaction) {
        t.partialSign(this.payer);
      }
      return t;
    });
  }
}

// Helper to load keypair from a file path
function loadKeypair(keypairPath) {
  const homeDir = os.homedir();

  let pathToResolve = keypairPath;
  if (keypairPath.startsWith("~")) {
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
  try {
    // Load environment variables if any
    require("dotenv").config({
      path: path.resolve(__dirname, "../.env"),
    });

    const connection = new Connection(
      process.env.SOLANA_RPC_URL || clusterApiUrl("devnet"),
      "confirmed"
    );

    // Load keypairs
    console.log(`Loading authority from ${AUTHORITY_WALLET_PATH}...`);
    console.log(`Loading DAO state keypair from ${DAO_STATE_KEYPAIR_PATH}...`);
    
    const authorityKeypair = loadKeypair(AUTHORITY_WALLET_PATH);
    const daoStateKeypair = loadKeypair(DAO_STATE_KEYPAIR_PATH);

    console.log(
      "✅ Authority wallet loaded:",
      authorityKeypair.publicKey.toString()
    );
    console.log(
      "📌 DAO State Keypair loaded:",
      daoStateKeypair.publicKey.toString()
    );

    // Setup provider and program
    const wallet = new NodeWallet(authorityKeypair);
    const provider = new AnchorProvider(connection, wallet, {
      commitment: "confirmed",
    });
    anchor.setProvider(provider);

    // Load IDL
    console.log(`Loading IDL from ${path.resolve(__dirname, "../src/idl/tvdao.json")}...`);
    const idlJson = JSON.parse(
      fs.readFileSync(
        path.resolve(__dirname, "../src/idl/tvdao.json"),
        "utf-8"
      )
    );
    
    console.log('IDL loaded, metadata:', idlJson.metadata);
    console.log('Instruction count:', idlJson.instructions?.length);
    
    // Fix the IDL by adding more information to the accounts section
    if (idlJson.accounts && idlJson.types) {
      // For each account in the accounts section, add size and type from the types section
      for (let i = 0; i < idlJson.accounts.length; i++) {
        const accountName = idlJson.accounts[i].name;
        
        // Find the corresponding type definition
        const typeIndex = idlJson.types.findIndex(t => t.name === accountName);
        if (typeIndex !== -1) {
          // Add the type fields to the account
          idlJson.accounts[i].type = idlJson.types[typeIndex].type;
          
          // Estimate account size (very rough estimate)
          let size = 8; // account discriminator
          // Add the field sizes (rough estimate)
          if (idlJson.types[typeIndex].type.fields) {
            for (const field of idlJson.types[typeIndex].type.fields) {
              if (field.type === 'u8') size += 1;
              else if (field.type === 'u32') size += 4;
              else if (field.type === 'u64' || field.type === 'i64') size += 8;
              else if (field.type === 'pubkey') size += 32;
              else if (field.type === 'bool') size += 1;
              else if (field.type === 'string') size += 100; // arbitrary length for string
            }
          }
          idlJson.accounts[i].size = size;
          
          console.log(`Added size ${size} to account ${accountName}`);
        }
      }
    }
    
    // We need to extract the types section for anchor.Program
    console.log('Creating program instance...');
    
    // Create program using modified IDL
    const program = new anchor.Program(idlJson, PROGRAM_ID, provider);
    console.log("✅ Program loaded. Program ID:", program.programId.toString());

    // Check if DAO state already exists
    try {
      const existingDaoState = await program.account.daoState.fetch(
        daoStateKeypair.publicKey
      );
      console.log(
        "⚠️ DaoState already exists at:",
        daoStateKeypair.publicKey.toString()
      );
      console.log("Existing state:", existingDaoState);
      return;
    } catch (e) {
      console.log("✅ DaoState not found — proceeding with initialization...");
    }

    // Initialize DAO state
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
      daoStateKeypair.publicKey.toString()
    );

    // Fetch the initialized state
    const fetched = await program.account.daoState.fetch(
      daoStateKeypair.publicKey
    );
    console.log("📦 DAO State:", fetched);
  } catch (error) {
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