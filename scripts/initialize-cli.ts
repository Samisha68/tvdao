#!/usr/bin/env ts-node

// This script initializes the DAO state for your project
// Run it like: anchor run initialize-state

import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Keypair, PublicKey } from "@solana/web3.js";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";

// Load the keypair
function loadKeypair(pathStr: string): Keypair {
  const fullPath = pathStr.replace("~", os.homedir());
  const secretKey = new Uint8Array(JSON.parse(fs.readFileSync(fullPath, "utf-8")));
  return Keypair.fromSecretKey(secretKey);
}


async function main() {
  // Initialize anchor provider
  anchor.setProvider(anchor.AnchorProvider.env());
  const provider = anchor.getProvider() as anchor.AnchorProvider;
  
  // Load the dao state keypair
  const daoStateKeypair = loadKeypair("~/.config/solana/tvdao-state-keypair.json");
  console.log("DAO State Public Key:", daoStateKeypair.publicKey.toBase58());
  
  // Create a CLI command to run with anchor
  const cliCommand = `cd program && anchor run initialize-state -- ${daoStateKeypair.publicKey.toBase58()}`;
  console.log("Run this command to initialize the state using the CLI:");
  console.log(cliCommand);
}

main().then(
  () => process.exit(0),
  (err) => {
    console.error(err);
    process.exit(1);
  }
); 