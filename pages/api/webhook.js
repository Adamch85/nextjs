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
const programID = new PublicKey("DfinCfYioVNG7UXFf1qxMS2Ycr9GrFBLBn9QPuHhnRUi");
const program = new anchor.Program(idl, programID, provider);
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
                        case "NewRaffleEvent":
                            const {data, error} = await supaclient
                                .from('raffles')
                                .upsert(event.data)
                    }
                }
            }

            res.status(200).json("success")

            // console.log(data, error)

        }

    } catch (err) { console.log(err) }
}
