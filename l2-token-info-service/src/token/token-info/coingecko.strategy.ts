import { TokenInfoStrategy } from "./token-info.strategy";

export class CoingeckoStrategy implements TokenInfoStrategy {
    readonly url: string = 'some-coingecko-url';
    async getTokenInfo(coinName: string) : Promise<string> {
        return `Response from coingecko for token=${coinName}.`;
    }

}