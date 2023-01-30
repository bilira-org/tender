import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { Tender } from "../target/types/tender";

describe("tender", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.Tender as Program<Tender>;

  it("Is initialized!", async () => {
    // Add your test here.
    const tx = await program.methods.initialize().rpc();
    console.log("Your transaction signature", tx);
  });
});
