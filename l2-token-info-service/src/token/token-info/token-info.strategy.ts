export interface TokenInfoStrategy {
    readonly url : string;
    getTokenInfo(coinName : string) : Promise<string>;
}