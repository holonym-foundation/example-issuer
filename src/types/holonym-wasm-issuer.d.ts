import { HolonymIssuerReturnValue } from "./types";

declare module "holonym-wasm-issuer" {
  export function issue(
    privateKey: string,
    customInput1: string,
    customInput2: string
  ): HolonymIssuerReturnValue;
}
