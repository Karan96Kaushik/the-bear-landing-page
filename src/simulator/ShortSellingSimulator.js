class ShortSellingSimulator {
    constructor(simulationParams) {
        const {
            stockSymbol, 
            triggerPrice, 
            stopLossPrice, 
            targetPrice, 
            quantity, 
            updateStopLossFunction,
            updateTriggerPriceFunction,
            startTime,
            endTime,
            yahooData
        } = simulationParams;

        console.log('simulationParams', simulationParams);

        this.stockSymbol = stockSymbol;
        this.triggerPrice = triggerPrice;
        this.stopLossPrice = stopLossPrice;
        this.targetPrice = targetPrice;
        this.quantity = quantity;
        this.updateStopLossFunction = updateStopLossFunction;
        this.updateTriggerPriceFunction = updateTriggerPriceFunction;
        this.startTime = startTime;
        this.endTime = endTime;
        this.pnl = 0; // Profit and Loss
        this.position = null;
        this.tradeActions = []; // To store actions taken during simulation
        this.yahooData = yahooData;
        this.isPositionOpen = false;
        this.logAction = this.logAction.bind(this);
    }

    // fetchData(data) {
    //     // try {
    //         // const data = await getDataFromYahoo(this.stockSymbol, 1, '1m', this.startTime, this.endTime);
    //         if (!data.chart.result[0].timestamp) {
    //             throw new Error('No data found for the given time range');
    //         }
    //         return {
    //             indicators: data.chart.result[0].indicators.quote[0],
    //             timestamps: data.chart.result[0].timestamp
    //         };
    //     // } catch (error) {
    //     //     console.error('Error fetching data:', error);
    //     //     throw error;
    //     // }
    // }

    logAction(time, action, price=0) {
        console.log(action);
        
        this.tradeActions.push({ time, action: String(action), price });
    }

    simulateTrading(data) {
        for (let i = 0; i < data.length; i++) {
            const { time, open, high, low, close } = data[i];
            
            if (!high || !low || !open || !close) {
                continue;
            }

            if (this.updateStopLossFunction) {
                const newSL = this.updateStopLossFunction(i, data, this.stopLossPrice, this.logAction);
                if (newSL !== this.stopLossPrice) {
                    this.tradeActions.push({ time, action: 'Stop loss updated', price: newSL });
                    this.stopLossPrice = newSL;
                }
            }

            if (!this.isPositionOpen) {
                if (this.triggerPrice === 'MKT' && i === 0) {
                    this.position = open;
                    this.isPositionOpen = true;
                    this.tradeActions.push({ time, action: 'Short at Market', price: open });
                }
                else if (!this.isPositionOpen && Number(this.triggerPrice) && low <= this.triggerPrice) {
                    this.position = this.triggerPrice;
                    this.isPositionOpen = true;
                    this.tradeActions.push({ time, action: 'Short at Limit', price: this.triggerPrice });
                }
                else if (this.updateTriggerPriceFunction) {
                    const newTP = this.updateTriggerPriceFunction(i, data, this.triggerPrice, this.logAction);
                    console.log('newTP', newTP, this.triggerPrice);
                    if (newTP && newTP !== this.triggerPrice) {
                        this.tradeActions.push({ time, action: 'Target price updated', price: newTP });
                        this.triggerPrice = newTP;
                    }
                }
            }
            else {
                if (high >= this.stopLossPrice) {
                    this.pnl -= (this.stopLossPrice - this.position) * this.quantity;
                    this.tradeActions.push({ time, action: 'Stop Loss Hit', price: this.stopLossPrice });
                    this.isPositionOpen = false;
                    break;
                }

                if (low <= this.targetPrice) {
                    this.pnl += (this.position - this.targetPrice) * this.quantity;
                    this.tradeActions.push({ time, action: 'Target Hit', price: this.targetPrice });
                    this.isPositionOpen = false;
                    break;
                }
            }
        }

        if (this.isPositionOpen) {
            const lastCandle = data[data.length - 1];
            this.pnl += (this.position - lastCandle.close) * this.quantity;
            this.tradeActions.push({ time: lastCandle.time, action: 'Auto Square-off', price: lastCandle.close });
            this.isPositionOpen = false;
        }

        this.data = data;
    }

    async run() {
        // console.log('this.yahooData', this.yahooData);
        // const data = this.fetchData(this.yahooData);
        const data = this.yahooData;
        this.simulateTrading(data);
    }
}

export { ShortSellingSimulator };
