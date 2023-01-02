// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import Issuer from "../../backend/issuer";
import type { IssuerResponse } from "../../types/types";

const issuer = new Issuer();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<IssuerResponse | { error: string }>
) {
  return issuer.handleGetRequest(req, res);
}
