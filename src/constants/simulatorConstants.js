// Time offset constants
const user_offset = (new Date().getTimezoneOffset()) / 60;
const indian_offset = 5.5;
export const OFFSET_TIME = (user_offset + indian_offset) * 60 * 60 * 1000;

// History management
export const MAX_HISTORY_ENTRIES = 100;
export const POLLING_INTERVAL = 3000;

// Retry configuration
export const RETRY_DELAYS = [3000, 6000, 12000, 30000]; // Exponential backoff: 3s, 6s, 12s, max 30s
export const MAX_RETRY_COUNT = RETRY_DELAYS.length;

// Initial selection parameter options
export const initialSelectionParamOptions = {
  zaire: {
    TOUCHING_SMA_TOLERANCE: { type: 'category', options: [0.0003] },
    TOUCHING_SMA_15_TOLERANCE: { type: 'category', options: [0.0003] },
    NARROW_RANGE_TOLERANCE: { type: 'category', options: [0.0046] },
    WIDE_RANGE_TOLERANCE: { type: 'category', options: [0.0015] },
    CANDLE_CONDITIONS_SLOPE_TOLERANCE: { type: 'category', options: [1] },
    BASE_CONDITIONS_SLOPE_TOLERANCE: { type: 'category', options: [1] },
    MA_WINDOW: { type: 'category', options: [44] },
    MA_WINDOW_5: { type: 'category', options: [22] },
    CHECK_75MIN: { type: 'category', options: [1] },
    CHECK_NIFTY_50: { type: 'category', options: [1] },
    STOCK_LIST: { type: 'category', options: ['HIGHBETA!D2:D550'] },
  },
  benoit: {
    TOUCHING_SMA_TOLERANCE: { type: 'category', options: [0.0001] },
    NARROW_RANGE_TOLERANCE: { type: 'category', options: [0.0046] },
    MA_WINDOW: { type: 'category', options: [200] },
    STOCK_LIST: { type: 'category', options: ['HIGHBETA!C2:C550'] },
  },
  baxter: {
    TOUCHING_SMA_TOLERANCE: { type: 'category', options: [0] },
    NARROW_RANGE_TOLERANCE: { type: 'category', options: [0.01] },
    MA_WINDOW: { type: 'category', options: [200] },
    AVG_VOLUME_FACTOR: { type: 'category', options: [1.2] },
    AVG_VOLUME_COUNT: { type: 'category', options: [10] },
    STOCK_LIST: { type: 'category', options: ['BAXTER-StockList'] },
  },
  bailey: {
    STOCK_LIST: { type: 'category', options: ['HIGHBETA!C2:C550'] },
  },
  lightyear: {
    STOCK_LIST: { type: 'category', options: ['HIGHBETA!C2:C550'] },
  }
};

// Stock options for selector
export const stockOptions = [
  { value: 'AUROPHARMA', label: 'AUROPHARMA' },
  { value: 'HCLTECH', label: 'HCLTECH' },
  { value: 'TCS', label: 'TCS' },
  { value: 'INFY', label: 'INFY' },
  { value: 'WIPRO', label: 'WIPRO' },
  { value: 'TECHM', label: 'TECHM' },
  { value: 'CUMMINSIND', label: 'CUMMINSIND' },
  { value: 'HEROMOTOCO', label: 'HEROMOTOCO' },
  { value: 'HINDUNILVR', label: 'HINDUNILVR' },
  { value: 'INDHOTEL', label: 'INDHOTEL' },
  { value: 'LT', label: 'LT' },
  { value: 'MANKIND', label: 'MANKIND' },
  { value: 'M&M', label: 'M&M' },
  { value: 'NESTLEIND', label: 'NESTLEIND' },
  { value: 'EICHERMOT', label: 'EICHERMOT' },
  { value: 'GODREJPROP', label: 'GODREJPROP' },
  { value: 'TATAMOTORS', label: 'TATAMOTORS' },
  { value: 'NETWEB', label: 'NETWEB' },
  { value: 'MOTILALOFS', label: 'MOTILALOFS' },
  { value: 'HDFCBANK', label: 'HDFCBANK' },
  { value: 'ICICIBANK', label: 'ICICIBANK' },
];

// Trial stock columns configuration
export const trialStockColumns = [
  { key: 'symbol', label: 'Stock' },
  { key: 'datetime', label: 'Date' },
  { key: 'quantity', label: 'Quantity' },
  { key: 'direction', label: 'Direction' },
  { 
    key: 'pnl', 
    label: 'P&L', 
    classRenderer: (pnl) => Number(pnl) >= 0 ? 'text-green-600' : 'text-red-600', 
    renderer: (pnl) => pnl?.toFixed(2) 
  },
  { key: 'triggerPrice', label: 'Trigger Price', renderer: (triggerPrice) => triggerPrice?.toFixed(2) },
  { key: 'targetPrice', label: 'Target Price', renderer: (targetPrice) => targetPrice?.toFixed(2) },
  { key: 'stopLossPrice', label: 'Stop Loss Price', renderer: (stopLossPrice) => stopLossPrice?.toFixed(2) }
];

// Default simulation state
export const defaultSimulationState = {
  result: null,
  reEnterPosition: true,
  cancelInMins: 5,
  updateSL: true,
  updateSLInterval: 15,
  updateSLFrequency: 5,
  targetStopLossRatio: '5:1',
  marketOrder: false,
  type: 'baxter',
  enableTriggerDoubleConfirmation: false,
  enableStopLossDoubleConfirmation: false,
  doubleConfirmationLookbackHours: 3
};
