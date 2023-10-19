// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import {createClient} from "@supabase/supabase-js";
import {LAMPORTS_PER_SOL, SystemProgram} from "@solana/web3.js";
const bs58 = require('bs58')


const supaclient = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
export default async function handler(req, res) {
    try {
         if (req.method === "POST") {
            let webhook_data = req.body
            for (const tx of webhook_data) {
                let accounts = tx.transaction.message.accountKeys;
                let programIdIndex = accounts.findIndex((element) => (element == SystemProgram.programId.toBase58()))
                let instructions = tx.transaction.message.instructions.filter((ix) => ix.programIdIndex == programIdIndex)
                for (const ix of instructions) {
                    let ixData = bs58.decode(ix.data, 'hex')
                    let ixDisc = Buffer.from(ixData.slice(0, 4)).toString('hex')
                    let isTransfer = ixDisc == "02000000"
                    if (isTransfer) {
                        let count = Number.parseInt(Buffer.from(ixData.slice(4, 12).reverse()).toString('hex'), 16)
                        if (count == 0.1 * LAMPORTS_PER_SOL) {

                            let from = accounts[ix.accounts[0]]

                            let {data, error} = await supaclient
                                .from('register')
                                .upsert({
                                    address: from,
                                    txid: tx.transaction.signatures[0]
                                })
                        }
                    }
                }
            }

            res.status(200).json("success")

        }

    } catch (err) {
        console.log(err)
        
    }
}
