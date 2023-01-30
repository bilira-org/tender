const anchor = require("@coral-xyz/anchor");
const { setConfig, getConfig } = require('./config')
const { ConfirmOptions } =require("@solana/web3.js");
const { argv } = require("process");

const provider = anchor.AnchorProvider.env();
anchor.setProvider(provider);

const createAccount = () => {
  const accountSecret = anchor.web3.Keypair.generate();
  const account = anchor.web3.Keypair.fromSecretKey(accountSecret.secretKey)

  return account
}

const createTestAccounts = () => {
  console.log('Creating test accounts')
  ;['A', 'B', 'C', 'D', 'E'].forEach((letter) => {
    const account = createAccount()
    setConfig(letter, account.secretKey.toString() )
    console.log(letter, account.publicKey.toString() )
  })
}

function initProgram(){
  const idl = JSON.parse(
    require("fs").readFileSync("./app/idl.json", "utf8")
  );
  const programId = new anchor.web3.PublicKey("Esb1EUAFYCuUQmffqLmrMJT6kTExFHmrvjhCDV9AtZKs");
  const program = new anchor.Program(idl, programId)
  return program
}

const main = async () => {
  console.log(argv)
  if (argv[2] === 'createTestAccounts') {
    createTestAccounts()
  }
  if (argv[2] === 'initTender') {
    const program = initProgram()
    const account = anchor.web3.Keypair.fromSecretKey(new Uint8Array(getConfig(argv[3]).split(",").map(Number)));
    await initTender(program, account)
  }
  if (argv[2] === 'getTender') {
    const program = initProgram()
    const account = anchor.web3.Keypair.fromSecretKey(new Uint8Array(getConfig(argv[3]).split(",").map(Number)));
    await getTender(program, account)
  }
  if (argv[2] === 'getTime') {
    const program = initProgram()
    const account = anchor.web3.Keypair.fromSecretKey(new Uint8Array(getConfig(argv[3]).split(",").map(Number)));
    await getTime(program, account)
  }
  if (argv[2] === 'makeBid') {
    const program = initProgram()
    const account1 = anchor.web3.Keypair.fromSecretKey(new Uint8Array(getConfig(argv[3]).split(",").map(Number)));
    const account2 = anchor.web3.Keypair.fromSecretKey(new Uint8Array(getConfig(argv[4]).split(",").map(Number)));
    await makeBid(program, account1, account2)
  }
  if (argv[2] === 'validateBid') {
    const program = initProgram()
    const account1 = anchor.web3.Keypair.fromSecretKey(new Uint8Array(getConfig(argv[3]).split(",").map(Number)));
    const account2 = anchor.web3.Keypair.fromSecretKey(new Uint8Array(getConfig(argv[4]).split(",").map(Number)));
    await validateBid(program, account1, account2)
  }
  if (argv[2] === 'endTender') {
    const program = initProgram()
    const account = anchor.web3.Keypair.fromSecretKey(new Uint8Array(getConfig(argv[3]).split(",").map(Number)));
    await endTender(program, account)
  }
  if (argv[2] === 'getWinner') {
    const program = initProgram()
    const account = anchor.web3.Keypair.fromSecretKey(new Uint8Array(getConfig(argv[3]).split(",").map(Number)));
    await getWinner(program, account)
  }
};

async function getWinner(program, account){
  await program.methods.getWinner()
  .accounts({
    tender: account.publicKey,
  })
  .rpc();
}

async function makeBid(program, account1, account2){
  await program.methods.makeBid()
  .accounts({
    user: account2.publicKey,
    tender: account1.publicKey,
  })
  .signers([account2])
  .rpc();
}

async function getTime(program, account){
  const tx = await program.methods.getTime().accounts({
    tender: account.publicKey,
    user: account.publicKey,
  })
  .signers([account])
  .rpc(ConfirmOptions);
  console.log(tx)

  // Delay 2 seconds to allow the transaction to be confirmed.
  await new Promise((resolve) => setTimeout(resolve, 2000));
  let t = await provider.connection.getTransaction(tx, {
      commitment: "confirmed",
      maxSupportedTransactionVersion: 5,
  });
  console.log(t)
}

async function initTender(program, account){
  await program.methods.initTender("Tender 2", "This is a tender", new anchor.BN(1), new anchor.BN(1))
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
  console.log(tender)
}

async function validateBid(program, account1, account2){
  await program.methods.validateBid()
  .accounts({
    user: account2.publicKey,
    tender: account1.publicKey,
  })
  .signers([account2])
  .rpc();
}

async function endTender(program, account){
  await program.methods.endTender()
  .accounts({
    user: account.publicKey,
    tender: account.publicKey,
  })
  .signers([account])
  .rpc();
}
main()