/// <reference types="mocha" />
import * as anchor from "@coral-xyz/anchor";
import { Program as AnchorProgram } from "@coral-xyz/anchor";
import { Tvdao as LocalProgram } from "../target/types/tvdao";

describe("program", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.program as AnchorProgram<LocalProgram>;

  it("Is initialized!", async () => {
    // Add your test here.
    const tx = await program.methods.initializeDaoState().rpc();
    console.log("Your transaction signature", tx);
  });
});
