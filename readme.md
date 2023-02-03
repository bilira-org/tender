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

## About

This repository is created as support material of "Open Tendering with Solana" workshop, presented at Solana [Istanbul Hacker House](https://solana.com/events/istanbulhh). You can find a complete version of open tendering implementation using Ethereum with detailed thesis there: [open-tendering-in-ethereum](https://github.com/urtuba/open-tendering-in-ethereum).


## Licence

MIT License

Copyright (c) 2023 BiLira

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.


 
