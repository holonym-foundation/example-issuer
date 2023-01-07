// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import { v4 as uuidv4 } from "uuid";
import Issuer from "../../backend/issuer";
import type { IssuerResponse } from "../../types/types";

const issuer = new Issuer();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<IssuerResponse | any>
) {
  // Step 2. Issuer processes and stores user data
  if (req.method === "POST") {
    const { body } = req;
    // TODO: Either 1. store data, or 2. send data to your third-party identity provider API who stores it
    // 1. Store data
    // ...
    // 2. Send data to third-party identity provider API
    const response = await fetch("http://localhost:3000/api/mock-provider", {
      method: "POST",
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" },
    });

    return res.status(200).json({ data: "Form data received", userId: uuidv4() });
  }
  // Step 4. Holonym retrieves user data
  if (req.method === "GET") {
    return issuer.handleGetRequest(req, res);
  }
}
