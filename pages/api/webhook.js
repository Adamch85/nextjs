// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import {createClient} from "@supabase/supabase-js";

const supaclient = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
export default async function handler(req, res) {

  try {
    if (req.method === "POST") {

      let webhook_data = req.json()
      console.log(webhook_data)

      const { data, error } = await supaclient
        .from('txs')
        .upsert(webhook_data[0].transaction)
      res.status(200).json("success")

      console.log(data, error)

    };

  }

  catch (err) { console.log(err) }
}
