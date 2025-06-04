import { TokenInfoStrategy } from "./token-info.strategy";

export class BinanceStrategy implements TokenInfoStrategy {
    readonly url: string = "some-binance-url";
    async getTokenInfo(coinName: string): Promise<string> {
        return `Response from binance for token=${coinName}.`
    }
}