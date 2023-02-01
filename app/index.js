const anchor = require("@coral-xyz/anchor");
const { setConfig, getConfig } = require('./config')
const { ConfirmOptions } =require("@solana/web3.js");
const { keccak256 } = require('js-sha3')
const { argv } = require("process");
const util = require('util');
const rl = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout,
});

const question = util.promisify(rl.question).bind(rl);

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
    setConfig(letter, account.secretKey.toString())
    console.log(letter, account.publicKey.toString())
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

async function createTender() {
  try {
    const tender = {}
    
    tender.name = await question('Tender name: ');
    tender.description = await question('Description: ');
    tender.minimum = await question('Minimum bid: ');
    tender.maximum = await question('Maximum bid: ');
    tender.estimated = await question('Estimated bid: ');
    tender.period1 = await question('Period 1: ');
    tender.period2 = await question('Period 2: ');
    tender.randomString = await question('Random string for hash: ');
    tender.hash = keccak256(
      tender.minimum.toString() + 
      tender.maximum.toString() + 
      tender.estimated.toString() +
      tender.randomString
    ).toString('hex')
    
    const accountName = await question('Account to create with: ["A", "B", "C", "D", "E"]');

    console.log(tender)
    console.log('Creating tender with account:', accountName)

    const valid = await question('Do you want to create this tender? (y/n) ');
    rl.close()
    
    if(valid === 'y'){
      // Save tender to config
      setConfig(`tender${accountName}`, tender)
      const program = initProgram()
      const account = anchor.web3.Keypair.fromSecretKey(new Uint8Array(getConfig(accountName).split(",").map(Number)));
      await initTender(program, account, tender)
    } else {
      console.log('Tender creation cancelled')
    }
  } catch (err) {
    console.error('Question rejected', err);
  }
}

async function getBidFromConsole(account1, account2) {
  const bid = {}
  bid.amount = await question('Bid Amount: ');
  bid.randomString = await question('Random string for hash: ');
  bid.hash = keccak256(
    bid.amount +
    bid.randomString
  ).toString('hex')

  //rl.pause()
  rl.close()
  // Save bid to config
  setConfig(`tender${account1}bidder${account2}`, bid)
  
  console.log('Creating bid with account:', account2)
  console.log('For tender account:', account1)

  return bid
}

const initEventListeners = async (program) => {
  await program.addEventListener("BidMade", (event, slot) => {
    console.log("BidMade", event, slot)
  });
}
const main = async () => {
  if(argv[2] === 'eventListeners'){
    const program = initProgram()
    await initEventListeners(program)
  }
  if(argv[2] === 'initTender'){
    await createTender()
  }
  if (argv[2] === 'createTestAccounts') {
    createTestAccounts()
  }
  // if (argv[2] === 'initTender') {
  //   const program = initProgram()
  //   const account = anchor.web3.Keypair.fromSecretKey(new Uint8Array(getConfig(argv[3]).split(",").map(Number)));
  //   await initTender(program, account)
  // }
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
    const bid = await getBidFromConsole(argv[3], argv[4])
    await makeBid(program, account1, account2, bid)
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

async function makeBid(program, account1, account2, bid){
  await program.methods.makeBid(bid.hash)
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

async function initTender(program, account, tender){
  await program.methods.initTender(
    tender.name, 
    tender.description, 
    new anchor.BN(tender.period1), 
    new anchor.BN(tender.period2),
    tender.hash
  ).accounts({
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