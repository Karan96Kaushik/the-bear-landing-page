class ShortSellingSimulator {
    constructor(simulationParams) {
        const {
            stockSymbol, 
            sellPrice, 
            stopLossPrice, 
            targetPrice, 
            quantity, 
            updateStopLossFunction,
            startTime,
            endTime,
            yahooData
        } = simulationParams;

        console.log('simulationParams', simulationParams);

        this.stockSymbol = stockSymbol;
        this.sellPrice = sellPrice;
        this.stopLossPrice = stopLossPrice;
        this.targetPrice = targetPrice;
        this.quantity = quantity;
        this.updateStopLossFunction = updateStopLossFunction;
        this.startTime = startTime;
        this.endTime = endTime;
        this.pnl = 0; // Profit and Loss
        this.position = null;
        this.tradeActions = []; // To store actions taken during simulation
        this.yahooData = yahooData;
        this.isPositionOpen = false;
    }

    fetchData(data) {
        // try {
            // const data = await getDataFromYahoo(this.stockSymbol, 1, '1m', this.startTime, this.endTime);
            if (!data.chart.result[0].timestamp) {
                throw new Error('No data found for the given time range');
            }
            return {
                indicators: data.chart.result[0].indicators.quote[0],
                timestamps: data.chart.result[0].timestamp
            };
        // } catch (error) {
        //     console.error('Error fetching data:', error);
        //     throw error;
        // }
    }

    simulateTrading(data) {
        const { open, high, low, close } = data.indicators;
        const { timestamps } = data;

        for (let i = 0; i < open.length; i++) {
            
            if (!high[i] || !low[i] || !open[i] || !close[i]) {
                continue;
            }

            if (this.updateStopLossFunction) {
                // this.tradeActions.push({ time: timestamps[i], action: 'Attempting Stop loss updated', price: 0 });
                const newSL = this.updateStopLossFunction(timestamps, i, high, low, open, close, this.stopLossPrice);
                // console.log('newSL', newSL);
                if (newSL !== this.stopLossPrice) {
                    this.tradeActions.push({ time: timestamps[i], action: 'Stop loss updated', price: newSL });
                    this.stopLossPrice = newSL;
                }
            }

            if (!this.isPositionOpen && this.sellPrice === 'MKT') {
                this.position = open[i];
                this.isPositionOpen = true;
                this.tradeActions.push({ time: timestamps[i], action: 'Short at Market', price: open[i] });
            }

            if (!this.isPositionOpen && Number(this.sellPrice) && low[i] <= this.sellPrice) {
                this.position = this.sellPrice;
                this.isPositionOpen = true;
                this.tradeActions.push({ time: timestamps[i], action: 'Short at Limit', price: this.sellPrice });
            }

            if (this.isPositionOpen) {
                if (high[i] >= this.stopLossPrice) {
                    this.pnl -= (this.stopLossPrice - this.position) * this.quantity;
                    this.tradeActions.push({ time: timestamps[i], action: 'Stop Loss Hit', price: this.stopLossPrice });
                    this.isPositionOpen = false;
                    break;
                }

                if (low[i] <= this.targetPrice) {
                    this.pnl += (this.position - this.targetPrice) * this.quantity;
                    this.tradeActions.push({ time: timestamps[i], action: 'Target Hit', price: this.targetPrice });
                    this.isPositionOpen = false;
                    break;
                }
            }
        }

        if (this.isPositionOpen) {
            this.pnl += (this.position - close[close.length - 1]) * this.quantity;
            this.tradeActions.push({ time: timestamps[timestamps.length - 1], action: 'Auto Square-off', price: close[close.length - 1] });
            this.isPositionOpen = false;
        }

        this.indicators = data.indicators;
        this.timestamps = timestamps;
    }

    async run() {
        // console.log('this.yahooData', this.yahooData);
        const data = this.fetchData(this.yahooData);
        // console.log('data--', data);
        this.simulateTrading(data);
    }
}

export { ShortSellingSimulator };
