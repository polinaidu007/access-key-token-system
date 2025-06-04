import { PlatformName } from "../enum/platformName.enum";
import { BinanceStrategy } from "./binance.strategy";
import { CoingeckoStrategy } from "./coingecko.strategy";
import { TokenInfoStrategy } from "./token-info.strategy";

const strategyClassMapper = {
    [PlatformName.BINANCE] : BinanceStrategy,
    [PlatformName.COINGECKO] : CoingeckoStrategy
}

export class StrategyFactory {
    getTokenStrategy(platform : PlatformName) : TokenInfoStrategy {
        const StrategyClass = strategyClassMapper[platform];
        if (!StrategyClass) throw new Error(`Unsupported source: ${platform}`);
        return new StrategyClass();
    }
}