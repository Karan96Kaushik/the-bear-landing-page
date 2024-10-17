import axios from 'axios';

async function getDataFromYahoo(sym, days = 70, interval = '1d') {
    try {
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${sym}.NS`;
      
      const today = new Date();
      const period1Date = new Date(today.getTime() - days * 24 * 60 * 60 * 1000);
      
      const period1 = Math.floor(period1Date.getTime() / 1000);
      const period2 = Math.floor(today.getTime() / 1000);
      
      const params = {
        period1,
        period2,
        interval,
        includePrePost: 'true',
        events: 'div|split|earn',
        lang: 'en-US',
        region: 'US'
      };
      
      const headers = {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:127.0) Gecko/20100101 Firefox/127.0',
        'Accept': '*/*',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br, zstd',
        'Referer': 'https://finance.yahoo.com/quote/TATAMOTORS.NS/chart/?guccounter=1',
        'Origin': 'https://finance.yahoo.com',
        'Connection': 'keep-alive'
      };
      
      const response = await axios.get(url, { params, headers });
      return response.data;
    } catch (error) {
      console.error(`Error fetching data from Yahoo Finance for ${sym}:`, error.message);
      throw error;
    }
  }

export { getDataFromYahoo };