# Open Procedure Tendering in Solana

## Pre-requisites

- [Node](https://nodejs.org)
- [Yarn](https://yarnpkg.com)
- [Anchor-cli](https://www.anchor-lang.com/docs/installation)
- [Solana-cli](https://docs.solana.com/getstarted/local)

## Development

### Set ANCHOR_PROVIDER_URL
```sh
export ANCHOR_PROVIDER_URL=http://127.0.0.1:8899
```
### Set ANCHOR_WALLET
```sh
export ANCHOR_WALLET=~/.config/solana/id.json
```
### Build
```sh
yarn build
```
### Deploy
```sh
yarn deploy
```

After deployment make sure declare_id and the tender id inside Anchor.toml are the same with the deployed program id.
```sh
Deploying workspace: http://localhost:8899
Upgrade authority: /Users/user/.config/solana/id.json
Deploying program "tender"...
Program path: /Users/user/target/deploy/tender.so...
Program Id: Esb1EUAFYCuUQmffqLmrMJT6kTExFHmrvjhCDV9AtZKs
```

### Note 

After every deploy new idl.json is copied to the app folder. Since Anchor does not support nested structs and HashMaps we should delete "timer" and "bids" fields from the tender struct. Simply delete the lines shown below:
```
{
  "name": "timer",
  "type": {
    "defined": "timer::Timer"
  }
},
{
  "name": "bids",
  "type": {
    "defined": "HashMap<Pubkey,[u8;32]>"
  }
}
```
 