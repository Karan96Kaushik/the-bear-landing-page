class BuySimulator {
    constructor(simulationParams) {
        const {
            stockSymbol, 
            triggerPrice, 
            stopLossPrice, 
            targetPrice, 
            quantity, 
            updateStopLossFunction,
            updateTriggerPriceFunction,
            updateTargetPriceFunction,
            startTime,
            endTime,
            yahooData,
            reEnterPosition
        } = simulationParams;

        this.stockSymbol = stockSymbol;
        this.triggerPrice = triggerPrice;
        this.stopLossPrice = stopLossPrice;
        this.targetPrice = targetPrice;
        this.quantity = quantity;
        this.updateStopLossFunction = updateStopLossFunction;
        this.updateTriggerPriceFunction = updateTriggerPriceFunction;
        this.updateTargetPriceFunction = updateTargetPriceFunction;
        this.startTime = startTime;
        this.endTime = endTime;
        this.pnl = 0; // Profit and Loss
        this.position = null;
        this.tradeActions = []; // To store actions taken during simulation
        this.yahooData = yahooData;
        this.isPositionOpen = false;
        this.logAction = this.logAction.bind(this);
        this.reEnterPosition = reEnterPosition;

    }

    logAction(time, action, price=0) {
        this.tradeActions.push({ time, action, price });
    }

    simulateTrading(data) {
        for (let i = 0; i < data.length; i++) {
            const { time, open, high, low, close } = data[i];
            
            if (!high || !low || !open || !close) {
                continue;
            }

            // Open Position
            if (!this.isPositionOpen) {
                // Buy at Market
                if (this.triggerPrice === 'MKT' && i === 1) {
                    this.position = low + Math.random() * (high - low);
                    this.isPositionOpen = true;
                    this.tradeActions.push({ time, action: 'Buy at Market', price: open });
                }
                // Buy at Limit
                else if (!this.isPositionOpen && Number(this.triggerPrice) && high >= this.triggerPrice) {
                    this.position = this.triggerPrice;
                    this.isPositionOpen = true;
                    this.tradeActions.push({ time, action: 'Buy at Limit', price: this.triggerPrice });
                }

            }
            else {
                // Stop Loss Hit
                if (low <= this.stopLossPrice) {
                    this.pnl += (this.stopLossPrice - this.position) * this.quantity * 0.9;
                    this.tradeActions.push({ time, action: 'Stop Loss Hit', price: this.stopLossPrice });
                    this.isPositionOpen = false;
                    if (!this.reEnterPosition) {
                        break;
                    } 

                }

                // Target Hit
                if (high >= this.targetPrice) {
                    this.pnl += (this.targetPrice - this.position) * this.quantity * 0.9;
                    this.tradeActions.push({ time, action: 'Target Hit', price: this.targetPrice });
                    this.isPositionOpen = false;
                    if (!this.reEnterPosition) {
                        break;
                    }
                }
            }


            // Update Trigger Price
            if (this.updateTriggerPriceFunction && !this.isPositionOpen) {
                const newTriggerPrice = this.updateTriggerPriceFunction(i, data, this.triggerPrice, this.position, this.logAction);
                if (newTriggerPrice !== this.triggerPrice) {
                    this.tradeActions.push({ time, action: 'Trigger price updated', price: newTriggerPrice });
                    this.triggerPrice = newTriggerPrice;
                }
            }

            // Update Stop Loss Price
            if (this.updateStopLossFunction && this.isPositionOpen) {
                const newSL = this.updateStopLossFunction(i, data, this.stopLossPrice, this.position, this.logAction);
                if (newSL !== this.stopLossPrice) {
                    this.tradeActions.push({ time, action: 'Stop loss updated', price: newSL });
                    this.stopLossPrice = newSL;
                }
            }

            // Update Target Price
            if (this.updateTargetPriceFunction) {
                const newTP = this.updateTargetPriceFunction(i, data, this.targetPrice, this.position, this.logAction);
                if (newTP !== this.targetPrice) {
                    this.tradeActions.push({ time, action: 'Target price updated', price: newTP });
                    this.targetPrice = newTP;
                }
            }
        }

        // Auto Square-off
        if (this.isPositionOpen) {
            const lastCandle = data[data.length - 1];
            this.pnl += (lastCandle.close - this.position) * this.quantity * 0.9;
            this.tradeActions.push({ time: lastCandle.time, action: 'Auto Square-off', price: lastCandle.close });
            this.isPositionOpen = false;
        }

        this.data = data;
    }

    async run() {
        const data = this.yahooData;
        this.simulateTrading(data);
    }
}

export { BuySimulator };
