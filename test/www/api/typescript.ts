import * as express from "express";

function handler(req: express.Request, res: express.Response) {
  res.send("Hello TypeScript")
}
export default handler