// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import Issuer from "../../backend/issuer";
import type { IssuerResponse } from "../../types/types";

const issuer = new Issuer();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<IssuerResponse | { error: string } | { data: string }>
) {
  if (req.method === "POST") {
    return res.status(200).json({ data: "Form data received" });
  }
  return issuer.handleGetRequest(req, res);
}
