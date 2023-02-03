const moment = require('moment')
const crypto = require('crypto')
const util = require('util')
const anchor = require('@coral-xyz/anchor')
const { keccak256 } = require('js-sha3')
const { setConfig, getConfig } = require('./config')
const { argv } = require('process')

const provider = anchor.AnchorProvider.env()
anchor.setProvider(provider)

const arrayBufferToHash = (arrayBuffer) => {
  const hash = keccak256.create()
  hash.update(Buffer.from(arrayBuffer))
  const result = hash.digest('hex')
  return result
}

const createAccount = () => {
  const accountSecret = anchor.web3.Keypair.generate()
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

function initProgram() {
  const idl = JSON.parse(require('fs').readFileSync('./app/idl.json', 'utf8'))
  const programId = new anchor.web3.PublicKey('Esb1EUAFYCuUQmffqLmrMJT6kTExFHmrvjhCDV9AtZKs')
  const program = new anchor.Program(idl, programId)
  return program
}

async function createTender() {
  try {
    const rl = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout,
    })

    const question = util.promisify(rl.question).bind(rl)

    const tender = {}

    tender.name = await question('Tender name: ')
    tender.description = await question('Description: ')
    tender.minimum = await question('Minimum bid: ')
    tender.maximum = await question('Maximum bid: ')
    tender.estimated = await question('Estimated bid: ')
    tender.period1 = await question('Period 1: ')
    tender.period2 = await question('Period 2: ')
    tender.randomString = crypto.randomBytes(20).toString('hex')
    tender.hash = keccak256(
      tender.minimum.toString() +
        '-' +
        tender.maximum.toString() +
        '-' +
        tender.estimated.toString() +
        '-' +
        tender.randomString
    ).toString('hex')

    const accountName = await question('Account to create with: ["A", "B", "C", "D", "E"]')

    console.log(tender)
    console.log('Creating tender with account:', accountName)

    console.log('KEEP THESE SAFE:')
    console.log({ min: tender.minimum, max: tender.maximum, hash: tender.estimated, salt: tender.randomString })

    const valid = await question('Do you want to create this tender? (y/n) ')
    rl.close()

    if (valid === 'y') {
      // Save tender to config
      setConfig(`tender${accountName}`, tender)
      const program = initProgram()
      const account = anchor.web3.Keypair.fromSecretKey(new Uint8Array(getConfig(accountName).split(',').map(Number)))
      await initTender(program, account, tender)
    } else {
      console.log('Tender creation cancelled')
    }
  } catch (err) {
    console.error('Question rejected', err)
  }
}

async function getBidFromConsole(account1, account2) {
  const rl = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout,
  })

  const question = util.promisify(rl.question).bind(rl)

  const bid = {}
  bid.amount = await question('Bid Amount: ')
  bid.randomString = crypto.randomBytes(20).toString('hex')
  bid.hash = keccak256(bid.amount + '-' + bid.randomString).toString('hex')

  rl.close()
  // Save bid to config
  setConfig(`tender${account1}bidder${account2}`, bid)

  console.log('Creating bid with account:', account2)
  console.log('For tender account:', account1)

  console.log('KEEP THESE SAFE:')
  console.log({ amount: bid.amount, salt: bid.randomString, hash: bid.hash })

  return bid
}

const initEventListeners = async (program) => {
  program.addEventListener('BidMade', (event) => {
    console.log('** New Bid Made **')
    console.log('User: ', event.account.toString())
    console.log('Hash: ', event.bidHash.toString())
  })
  program.addEventListener('NewWinner', (event) => {
    console.log('** There is a new WINNER! **')
    console.log('User: ', event.account.toString())
    console.log('Amount: ', event.amount.toString())
  })
  program.addEventListener('TenderEnded', (event) => {
    console.log('** Tender has been ended! **')
    console.log('Minimum: ', event.min.toString())
    console.log('Maximum: ', event.max.toString())
    console.log('Estimated: ', event.estimated.toString())
    console.log('Tender Status: ', event.tenderStatus.toString())
  })
}

const main = async () => {
  if (argv[2] === 'eventListeners') {
    const program = initProgram()
    await initEventListeners(program)
  }
  if (argv[2] === 'initTender') {
    await createTender()
  }
  if (argv[2] === 'createTestAccounts') {
    createTestAccounts()
  }
  if (argv[2] === 'getTender') {
    const program = initProgram()
    const account = anchor.web3.Keypair.fromSecretKey(new Uint8Array(getConfig(argv[3]).split(',').map(Number)))
    await getTender(program, account)
  }
  if (argv[2] === 'getTime') {
    const program = initProgram()
    const account = anchor.web3.Keypair.fromSecretKey(new Uint8Array(getConfig(argv[3]).split(',').map(Number)))
    await getTime(program, account)
  }
  if (argv[2] === 'makeBid') {
    const program = initProgram()
    const account1 = anchor.web3.Keypair.fromSecretKey(new Uint8Array(getConfig(argv[3]).split(',').map(Number)))
    const account2 = anchor.web3.Keypair.fromSecretKey(new Uint8Array(getConfig(argv[4]).split(',').map(Number)))
    const bid = await getBidFromConsole(argv[3], argv[4])
    await makeBid(program, account1, account2, bid)
  }
  if (argv[2] === 'validateBid') {
    const program = initProgram()
    const account1 = anchor.web3.Keypair.fromSecretKey(new Uint8Array(getConfig(argv[3]).split(',').map(Number)))
    const account2 = anchor.web3.Keypair.fromSecretKey(new Uint8Array(getConfig(argv[4]).split(',').map(Number)))
    const account1Bid = getConfig(`tender${argv[3]}bidder${argv[4]}`)
    await validateBid(program, account1, account2, account1Bid)
  }
  if (argv[2] === 'endTender') {
    const program = initProgram()
    const account = anchor.web3.Keypair.fromSecretKey(new Uint8Array(getConfig(argv[3]).split(',').map(Number)))
    const accountTender = getConfig(`tender${argv[3]}`)
    await endTender(program, account, accountTender)
  }
  if (argv[2] === 'getWinner') {
    const program = initProgram()
    const account = anchor.web3.Keypair.fromSecretKey(new Uint8Array(getConfig(argv[3]).split(',').map(Number)))
    await getWinner(program, account)
  }
}

async function getWinner(program, account) {
  const tx = await program.methods
    .getWinner()
    .accounts({
      tender: account.publicKey,
    })
    .rpc()

  // Delay 2 seconds to allow the transaction to be confirmed.
  await new Promise((resolve) => setTimeout(resolve, 1000))
  let t = await provider.connection.getTransaction(tx, {
    commitment: 'confirmed',
    maxSupportedTransactionVersion: 5,
  })

  const winner = t.meta.logMessages[2].substring(t.meta.logMessages[2].indexOf('Winner: '), t.meta.logMessages[2].length)
  const bestBid = t.meta.logMessages[3].substring(t.meta.logMessages[3].indexOf('Best bid: '), t.meta.logMessages[2].length)
  const tenderStatus = t.meta.logMessages[4].substring(
    t.meta.logMessages[4].indexOf('Tender status: '),
    t.meta.logMessages[2].length
  )

  console.log(winner)
  console.log(bestBid)
  console.log(tenderStatus)
}

async function makeBid(program, account1, account2, bid) {
  await program.methods
    .makeBid(bid.hash)
    .accounts({
      user: account2.publicKey,
      tender: account1.publicKey,
    })
    .signers([account2])
    .rpc()
}

async function getTime(program, account) {
  const tx = await program.methods
    .getTime()
    .accounts({
      tender: account.publicKey,
      user: account.publicKey,
    })
    .rpc()

  await new Promise((resolve) => setTimeout(resolve, 1000))
  let t = await provider.connection.getTransaction(tx, {
    commitment: 'confirmed',
    maxSupportedTransactionVersion: 5,
  })
  const t1 = t.meta.logMessages[2].substring(t.meta.logMessages[2].indexOf('t1: ') + 4, t.meta.logMessages[2].length)
  const t2 = t.meta.logMessages[3].substring(t.meta.logMessages[3].indexOf('t2: ') + 4, t.meta.logMessages[2].length)

  console.log('Period 1 Ends:', moment.unix(t1).format('DD/MM/YYYY HH:mm:ss'))
  console.log('Period 2 Ends:', moment.unix(t2).format('DD/MM/YYYY HH:mm:ss'))
}

async function initTender(program, account, tender) {
  await program.methods
    .initTender(tender.name, tender.description, new anchor.BN(tender.period1), new anchor.BN(tender.period2), tender.hash)
    .accounts({
      tender: account.publicKey,
      user: program.provider.wallet.publicKey,
      systemProgram: anchor.web3.SystemProgram.programId,
    })
    .signers([account])
    .rpc()
}

async function getTender(program, account) {
  // Fetch the tender account from the network.
  const tender = await program.account.tender.fetch(account.publicKey)

  console.log('Name:', tender.name)
  console.log('Description:', tender.description)
  console.log('Authority:', tender.authority.toString())
  console.log('Minimum:', tender.minimum.toString())
  console.log('Maximum:', tender.maximum.toString())
  console.log('Estimated:', tender.estimated.toString())
  console.log('Best Bid:', tender.bestBid.toString())
  console.log('Tender Hash:', arrayBufferToHash(tender.hash))
  console.log('Finished:', tender.finished)
  console.log('Winner:', tender.winner.toString())
  // console.log(tender)
}

async function validateBid(program, account1, account2, account1Bid) {
  await program.methods
    .validateBid(new anchor.BN(account1Bid.amount), account1Bid.randomString)
    .accounts({
      user: account2.publicKey,
      tender: account1.publicKey,
    })
    .signers([account2])
    .rpc()
}

async function endTender(program, account, tender) {
  await program.methods
    .endTender(
      new anchor.BN(tender.minimum),
      new anchor.BN(tender.maximum),
      new anchor.BN(tender.estimated),
      tender.randomString
    )
    .accounts({
      user: account.publicKey,
      tender: account.publicKey,
    })
    .signers([account])
    .rpc()
}
main()
