const { Keypair, Connection, PublicKey, SystemProgram, Transaction, sendAndConfirmTransaction } = require("@solana/web3.js");
const borsh = require("borsh");
const fs = require("fs");
const os = require("os");
const path = require("path");

// Load the IDL
const idl = require("../target/idl/tvdao.json");

// Load keypair from a file
function loadKeypair(keypairPath) {
  const expandedPath = keypairPath.replace("~", os.homedir());
  const keypairData = fs.readFileSync(expandedPath, "utf8");
  return Keypair.fromSecretKey(new Uint8Array(JSON.parse(keypairData)));
}

async function main() {
  // Parse the dao state public key from command line
  if (process.argv.length < 3) {
    console.error("Please provide the DAO state public key as an argument");
    process.exit(1);
  }
  const daoStatePubkey = new PublicKey(process.argv[2]);
  
  // Load authority keypair (your wallet)
  const authorityKeypair = loadKeypair("~/.config/solana/id.json");
  console.log("Authority:", authorityKeypair.publicKey.toString());
  
  // Load the dao state keypair
  const daoStateKeypair = loadKeypair("~/.config/solana/tvdao-state-keypair.json");
  console.log("DAO State Keypair:", daoStateKeypair.publicKey.toString());
  
  // Verify that the keypair's pubkey matches the provided pubkey
  if (!daoStateKeypair.publicKey.equals(daoStatePubkey)) {
    console.error(`Key mismatch: Expected ${daoStatePubkey}, got ${daoStateKeypair.publicKey}`);
    process.exit(1);
  }
  
  // Create a Solana connection
  const connection = new Connection(process.env.ANCHOR_PROVIDER_URL || "https://api.devnet.solana.com", "confirmed");
  console.log("Connected to:", process.env.ANCHOR_PROVIDER_URL || "https://api.devnet.solana.com");

  try {
    // Create a new account for the DAO state
    const lamports = await connection.getMinimumBalanceForRentExemption(8 + 32 + 32);  // Rough size for DaoState
    
    // Create the account
    const transaction = new Transaction();
    
    // Add create account instruction
    transaction.add(
      SystemProgram.createAccount({
        fromPubkey: authorityKeypair.publicKey,
        newAccountPubkey: daoStateKeypair.publicKey,
        lamports,
        space: 8 + 32 + 32,  // Discriminator + treasury pubkey + authority pubkey
        programId: new PublicKey("2HL7u9iKaj5BEJZ523WsLquPeMZKYMzLhZQ7et4HX7jA")
      })
    );
    
    console.log("Sending transaction...");
    const signature = await sendAndConfirmTransaction(connection, transaction, [authorityKeypair, daoStateKeypair]);
    console.log("Transaction signature:", signature);
    console.log("✅ DAO State account created successfully");
    console.log("NOTE: The account has been created, but you still need to initialize it using the smart contract");
    
  } catch (error) {
    console.error("Failed to create DAO state account:", error);
  }
}

main().then(
  () => process.exit(0),
  (err) => {
    console.error("Unhandled error:", err);
    process.exit(1);
  }
); 