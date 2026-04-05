import moment from 'moment';
import { OFFSET_TIME } from '../constants/simulatorConstants';

/**
 * Process trial data to generate statistics
 */
export const processTrialData = (trialData) => {
  const calcPnLStats = (pnls) => {
    const trades = pnls.length;
    const totalPnl = pnls.reduce((acc, curr) => acc + curr, 0);
    const positiveTrades = pnls.filter((pnl) => pnl > 0).length;
    const positivePercent = trades ? (positiveTrades * 100) / trades : 0;
    const meanPnlPerTrade = trades ? totalPnl / trades : 0;
    const variance =
      trades > 0
        ? pnls.reduce((acc, val) => acc + Math.pow(val - meanPnlPerTrade, 2), 0) / trades
        : 0;
    const stdDevPnlPerTrade = Math.sqrt(variance);

    return {
      totalPnl,
      trades,
      positiveTrades,
      positivePercent,
      meanPnlPerTrade,
      stdDevPnlPerTrade,
    };
  };

  const dailyPnl = Object.values(
    trialData.reduce((acc, curr) => {
      const date = curr.timestamp.toISOString().split('T')[0];
      acc[date] = acc[date] || [];
      acc[date].push(curr.pnl);
      return acc;
    }, {})
  ).map(pnls => pnls.reduce((a, b) => a + b, 0));

  const totalPnl = dailyPnl.reduce((acc, curr) => acc + curr, 0);
  const totalTrades = trialData.filter(t => t.pnl !== 0).length;

  const weeklyPnl = Object.values(
    trialData.reduce((acc, curr) => {
      const date = new Date(curr.timestamp);
      const weekKey = `${date.getFullYear()}-W${Math.ceil((date.getDate() + date.getDay()) / 7)}`;
      acc[weekKey] = acc[weekKey] || [];
      acc[weekKey].push(curr.pnl);
      return acc;
    }, {})
  ).map(pnls => pnls.reduce((a, b) => a + b, 0));

  const hourWisePnl = trialData.reduce((acc, curr) => {
    const date = new Date(curr.timestamp);
    const hourKey = `${date.getUTCHours()}`;
    acc[hourKey] = acc[hourKey] || [];
    acc[hourKey].push(curr.pnl);
    return acc;
  }, {});

  const directionWisePnl = trialData.reduce((acc, curr) => {
    acc[curr.direction] = acc[curr.direction] || [];
    acc[curr.direction].push(curr.pnl);
    return acc;
  }, {});

  const orderCountStats = Object.values(
    trialData.reduce((acc, curr) => {
      const date = curr.timestamp.toISOString().split('T')[0];
      acc[date] = acc[date] || 0;
      acc[date]++;
      return acc;
    }, {})
  );

  const meanPnlPerTrade = trialData.length
    ? trialData.reduce((acc, curr) => acc + curr.pnl, 0) / trialData.length
    : 0;
  const stdDevPnlPerTrade = trialData.length
    ? Math.sqrt(
      trialData.reduce((acc, curr) => acc + Math.pow(curr.pnl - meanPnlPerTrade, 2), 0) / trialData.length
    )
    : 0;
  const positiveTrades = trialData.filter(trade => trade.pnl > 0).length;

  // Stock-symbol level bearish/bullish aggregation
  const symbolWiseBullishPnl = trialData.reduce((acc, curr) => {
    const direction = typeof curr.direction === 'string' ? curr.direction.toUpperCase() : String(curr.direction || '');
    if (direction !== 'BULLISH') return acc;

    const symbol = curr.symbol || 'unknown';
    acc[symbol] = acc[symbol] || [];
    acc[symbol].push(curr.pnl);
    return acc;
  }, {});

  const symbolWiseBearishPnl = trialData.reduce((acc, curr) => {
    const direction = typeof curr.direction === 'string' ? curr.direction.toUpperCase() : String(curr.direction || '');
    if (direction !== 'BEARISH') return acc;

    const symbol = curr.symbol || 'unknown';
    acc[symbol] = acc[symbol] || [];
    acc[symbol].push(curr.pnl);
    return acc;
  }, {});

  const symbolWiseBullishStats = Object.fromEntries(
    Object.entries(symbolWiseBullishPnl).map(([symbol, pnls]) => [
      symbol,
      calcPnLStats(pnls),
    ])
  );

  const symbolWiseBearishStats = Object.fromEntries(
    Object.entries(symbolWiseBearishPnl).map(([symbol, pnls]) => [
      symbol,
      calcPnLStats(pnls),
    ])
  );

  return {
    dailyPnl,
    weeklyPnl,
    hourWisePnl,
    directionWisePnl,
    orderCountStats,
    positiveTrades,
    meanPnlPerTrade,
    stdDevPnlPerTrade,
    totalPnl,
    totalTrades,
    symbolWiseBullishPnl,
    symbolWiseBearishPnl,
    symbolWiseBullishStats,
    symbolWiseBearishStats,
  };
};

/**
 * Generate all possible parameter combinations
 */
export const generateCombinations = (options) => {
  const keys = Object.keys(options);
  
  // Generate value ranges for each parameter
  const values = keys.map(key => {
    const param = options[key];
    if (param.type === 'number') {
      const range = [];
      for (let val = param.start; val <= param.end; val += param.step) {
        range.push(Number(val.toFixed(6))); // Ensuring precision
      }
      return range;
    } else if (param.type === 'category') {
      return param.options;
    }
  });
  
  // Generate all possible combinations
  const combinations = [];
  function combine(index, current) {
    if (index === keys.length) {
      combinations.push({ ...current });
      return;
    }
    for (const value of values[index]) {
      current[keys[index]] = value;
      combine(index + 1, current);
    }
  }
  
  combine(0, {});
  return combinations;
};

/**
 * Process trials for CSV export
 */
export const processTrialsForExport = (trials) => {
  return trials.map(trial => ({
    startTime: trial.startTime,
    totalPnl: trial.results.totalPnl,
    totalTrades: trial.results.totalTrades,
    meanPnlPerTrade: trial.results.meanPnlPerTrade,
    stdDevPnlPerTrade: trial.results.stdDevPnlPerTrade,
    positiveTrades: trial.results.positiveTrades,
    positivePercent: (trial.results.positiveTrades / trial.results.totalTrades).toFixed(2),

    ...trial.selectionParams,
    
    reEnterPosition: trial.params.reEnterPosition,
    cancelInMins: trial.params.cancelInMins,
    updateSL: trial.params.updateSL,
    updateSLInterval: trial.params.updateSLInterval,
    updateSLFrequency: trial.params.updateSLFrequency,
    targetStopLossRatio: trial.params.targetStopLossRatio,
    marketOrder: trial.params.marketOrder,
    enableTriggerDoubleConfirmation: trial.params.enableTriggerDoubleConfirmation,
    enableStopLossDoubleConfirmation: trial.params.enableStopLossDoubleConfirmation,
    doubleConfirmationLookbackHours: trial.params.doubleConfirmationLookbackHours
  }));
};

/**
 * Format simulation result data
 */
export const formatSimulationResults = (result, simulationType) => {
  return result.map(item => ({
    symbol: item.sym,
    date: moment(item.scannedCandleAt || item.placedAt).format('DD-MM-YYYY'),
    timestamp: new Date(item.scannedCandleAt || item.placedAt),
    datetime: moment(+new Date(item.scannedCandleAt || item.placedAt) + OFFSET_TIME).format('DD-MM-YYYY HH:mm'),
    pnl: item.pnl,
    direction: item.direction,
    quantity: item.quantity,
    data: simulationType === 'lightyear' ? [] : item.data.filter(d => 
      new Date(d.time).toISOString().split('T')[0] === new Date(item.scannedCandleAt || item.placedAt).toISOString().split('T')[0]
    ),
    actions: item.actions,
    perDayResults: item.perDayResults,
    triggerPrice: item.triggerPrice,
    targetPrice: item.targetPrice,
    stopLossPrice: item.stopLossPrice
  }));
};

/**
 * Calculate simulation progress
 */
export const calculateProgress = (currentDate, dateRange) => {
  const currentDateTime = new Date(currentDate);
  
  // Define trading day start and end times
  const startTime = new Date(currentDateTime);
  startTime.setUTCHours(3, 51, 0, 0);
  
  const endTime = new Date(currentDateTime);
  endTime.setUTCHours(9, 50, 0, 0);
  
  // Calculate daily progress percentage
  const totalDuration = endTime - startTime;
  const elapsed = currentDateTime - startTime;
  const dailyProgress = Math.min(Math.max(Math.round((elapsed / totalDuration) * 100), 0), 100);
  
  // Calculate overall progress based on weekdays in date range
  const getWeekdayCount = (start, end) => {
    let count = 0;
    let current = new Date(start);
    while (current <= end) {
      if (current.getDay() !== 0 && current.getDay() !== 6) {
        count++;
      }
      current.setDate(current.getDate() + 1);
    }
    return count;
  };
  
  const totalWeekdays = getWeekdayCount(dateRange[0], dateRange[1]);
  const completedWeekdays = getWeekdayCount(dateRange[0], currentDateTime);
  const overallProgress = Math.round(((completedWeekdays - 1 + (dailyProgress / 100)) / totalWeekdays) * 100);

  return {
    dailyProgress,
    overallProgress,
    currentDate: currentDateTime
  };
};

/**
 * Calculate estimated time remaining
 */
export const calculateTimeRemaining = (overallProgress, startTime) => {
  if (!startTime || !Number.isFinite(overallProgress) || overallProgress <= 0) {
    return { minutes: 0, seconds: 0 };
  }

  const timeSinceStart = new Date() - new Date(startTime);
  const timeSinceStartInMins = timeSinceStart / (1000 * 60);
  const timeLeft = (100 - overallProgress) * timeSinceStartInMins / overallProgress;

  if (!Number.isFinite(timeLeft) || timeLeft <= 0) {
    return { minutes: 0, seconds: 0 };
  }
  
  return {
    minutes: parseInt(timeLeft),
    seconds: parseInt((timeLeft - parseInt(timeLeft)) * 60)
  };
};
