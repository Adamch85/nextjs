// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import * as anchor from "@coral-xyz/anchor";
import {Connection, Keypair, PublicKey} from '@solana/web3.js';
import {createClient} from "@supabase/supabase-js";
const bs58 = require('bs58')
const idl = require('./idl.json')
const rpc = "https://devnet.helius-rpc.com/?api-key=42cac9b9-6eed-4413-8589-3ee3e2fbe321";
const connection = new Connection(rpc);
const keypair = Keypair.fromSecretKey(bs58.decode(process.env.SECRET_KEY))
const wallet = new anchor.Wallet(keypair);
const provider = new anchor.AnchorProvider(connection, wallet, {preflightCommitment: "processed"});
const programId = new PublicKey("DfinCfYioVNG7UXFf1qxMS2Ycr9GrFBLBn9QPuHhnRUi");
const program = new anchor.Program(idl, programId, provider);
const eventParser = new anchor.EventParser(
    program.programId,
    program.coder
);


const supaclient = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
export default async function handler(req, res) {

    try {
        if (req.method === "POST") {

            let webhook_data = req.body

            for (const tx of webhook_data) {
                let events = eventParser.parseLogs(tx.meta?.logMessages)
                for (let event of events) {
                    switch (event.name) {
                        case "NewRaffleEvent": {
                            let {data, error} = await supaclient
                                .from('raffles')
                                .upsert({
                                    raffle: event.data.raffle,
                                    status: 0,
                                })
                            break
                        }
                    }
                }
            }

            for (const tx of webhook_data) {
                let accounts = tx.transaction.message.accountKeys;
                let programIdIndex = accounts.findIndex((element) => (element == programId.toBase58()))
                let instructions = tx.transaction.message.instructions.filter((ix) => ix.programIdIndex == programIdIndex)
                for (const ix of instructions) {
                    let ixData = bs58.decode(ix.data, 'hex')
                    let ixDisc = Buffer.from(ixData.slice(0,8)).toString('hex')
                    let isBuyTicket = ixDisc == "0b1811c1a874a4a9"
                    if (isBuyTicket) {
                        let entry = accounts[ix.accounts[0]]
                        let raffle = accounts[ix.accounts[1]]
                        let user = accounts[ix.accounts[9]]
                        let count = Number.parseInt(Buffer.from(ixData.slice(8,12).reverse()).toString('hex'), 16)
                        console.log(count)
                        console.log("here2")
                        console.log({
                                    entry:entry,
                                    raffle:raffle,
                                    user:user,
                                    count: count, 
                                })
                        console.log("here")
                        let {data, error} = await supaclient
                                .from('tickets')
                                .upsert({
                                    entry:entry,
                                    raffle:raffle,
                                    user:user,
                                    count: count, 
                                    txid: tx.transaction.signatures[0]
                                })
                    }
                }
            }

            res.status(200).json("success")

        }

    } catch (err) { console.log(err) }
}
