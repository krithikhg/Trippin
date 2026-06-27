type RateCache = { [key: string]: number };

// Cache rates in-memory for the lifetime of the request
let ratesCache: RateCache | null = null;

export async function convertAmount(
    amount: number,
    fromCurrency: string,
    toCurrency: string,
): Promise<number> {
    if (fromCurrency === toCurrency) return amount;

    const rate = await getRate(fromCurrency, toCurrency);
    return Math.round(amount * rate * 100) / 100;
}

async function getRate(from: string, to: string): Promise<number> {
    const key = `${from}-${to}`;
    if (ratesCache?.[key]) return ratesCache[key];

    // We use the frankfurter API for currency conversion
    const res = await fetch(
        `https://api.frankfurter.app/latest?from=${from}&to=${to}`,
    );
    const data = await res.json();
    const rate = data.rates?.[to];
    if (!rate)
        throw new Error(`Could not get exchange rate from ${from} to ${to}`);

    if (!ratesCache) ratesCache = {};
    ratesCache[key] = rate;
    return rate;
}
