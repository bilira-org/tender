const anchor = require("@coral-xyz/anchor");

const createAccount = () => {
  const accountSecret = anchor.web3.Keypair.generate();
  const account = anchor.web3.Keypair.fromSecretKey(accountSecret.secretKey)

  return account
}

const test = async () => {
  anchor.setProvider(anchor.AnchorProvider.env());
  
  // Read the generated IDL.
  const idl = JSON.parse(
    require("fs").readFileSync("./app/idl.json", "utf8")
  );

  //Address of the deployed program
  const programId = new anchor.web3.PublicKey("Esb1EUAFYCuUQmffqLmrMJT6kTExFHmrvjhCDV9AtZKs");
  
  //Generate the program client from IDL
  const program = new anchor.Program(idl, programId);

  const myAccount = anchor.web3.Keypair.fromSecretKey(createAccount().secretKey);
  
  console.log('PublicKey: ' ,myAccount.publicKey.toString())
  console.log('Program ID: ' , programId.toString())

  await initTender(program, myAccount)
  
  await getTender(program, myAccount)
};

async function initTender(program, account){
  await program.methods.initTender("Tender 2", "This is a tender")
  .accounts({
    tender: account.publicKey,
    user: program.provider.wallet.publicKey,
    systemProgram: anchor.web3.SystemProgram.programId,
  })
  .signers([account])
  .rpc();
}

async function getTender(program, account){
  // Fetch the tender account from the network.
  const tender = await program.account.tender.fetch(account.publicKey);
  
  const tenderName = tender.name;
  const tenderDesc = tender.description;

  console.log('Tender: ', tenderName)
  console.log('Description: ', tenderDesc)
}

test()