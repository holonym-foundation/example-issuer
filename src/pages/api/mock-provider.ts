// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse<any>) {
  if (req.method === "GET") {
    const response = {
      firstName: "Alice",
      middleName: "Bob",
      lastName: "Charlieson",
      birthdate: "1990-01-01",
      country: "US",
      city: "New York",
      state: "NY",
      zip: "10001",
    };
    return res.status(200).json(response);
  }
  if (req.method === "POST") {
    // provider stores data in database
    // ...
    return res.status(200).json({ data: "Data received" });
  }
}
