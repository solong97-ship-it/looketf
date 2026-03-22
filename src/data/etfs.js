export const ETF_LIST = [
  { name: 'KODEX 미국S&P500',           code: '379800', type: 'stock',       subClass: 'US Large',    expectedReturn: 0.09,  aiAlpha: 1.2, dividendYield: 1.74, maxWeight: 0.10 },
  { name: 'KODEX 미국나스닥100',         code: '379810', type: 'stock',       subClass: 'US Growth',   expectedReturn: 0.11,  aiAlpha: 1.5, dividendYield: 0.94, maxWeight: 0.10 },
  { name: 'SOL 미국배당다우존스',         code: '446720', type: 'stock',       subClass: 'US Dividend', expectedReturn: 0.08,  aiAlpha: 1.1, dividendYield: 2.95, maxWeight: 0.10 },
  { name: 'KIWOOM 200TR',               code: '294400', type: 'stock',       subClass: 'KR Market',   expectedReturn: 0.07,  aiAlpha: 1.0, dividendYield: 0,    maxWeight: 0.10 },
  { name: 'KODEX 차이나CSI300',          code: '283580', type: 'stock',       subClass: 'CN Market',   expectedReturn: 0.07,  aiAlpha: 0.8, dividendYield: 2.05, maxWeight: 0.10 },
  { name: 'KODEX 인도Nifty50',           code: '453810', type: 'stock',       subClass: 'IN Market',   expectedReturn: 0.10,  aiAlpha: 1.3, dividendYield: 1.24, maxWeight: 0.10 },
  { name: 'ACE KRX금현물',              code: '411060', type: 'alternative', subClass: 'Gold',        expectedReturn: 0.04,  aiAlpha: 1.0, dividendYield: 0,    maxWeight: 0.20 },
  { name: 'TIGER 리츠부동산인프라',      code: '329200', type: 'alternative', subClass: 'REITs',       expectedReturn: 0.05,  aiAlpha: 0.9, dividendYield: 8.78, maxWeight: 0.20 },
  { name: 'KODEX 200미국채혼합',         code: '284430', type: 'mixed',       subClass: 'Hybrid',      expectedReturn: 0.05,  aiAlpha: 0.85,dividendYield: 1.5,  maxWeight: 0.20 },
  { name: 'TIGER 미국채10년선물',        code: '305080', type: 'bond',        subClass: 'US Treasury', expectedReturn: 0.035, aiAlpha: 0.7, dividendYield: 2.0,  maxWeight: 0.20 },
  { name: 'TIGER 단기채권액티브',        code: '332610', type: 'bond',        subClass: 'Short Bond',  expectedReturn: 0.03,  aiAlpha: 0.6, dividendYield: 3.5,  maxWeight: 0.20 },
  { name: 'KODEX KOFR금리액티브(합성)',  code: '439330', type: 'cash',        subClass: 'Money Mkt',   expectedReturn: 0.032, aiAlpha: 0.5, dividendYield: 3.6,  maxWeight: 0.20 },
  { name: 'KODEX 단기채권',             code: '153130', type: 'bond',        subClass: 'Short Bond',  expectedReturn: 0.03,  aiAlpha: 0.6, dividendYield: 3.5,  maxWeight: 0.20 },
];

export const ETF_CODE_KOFR = '439330';
export const KOFR_MIN_WEIGHT = 0.05;
export const RISK_FREE_RATE = 0.03;

export const TYPE_LABEL = {
  stock: '주식',
  alternative: '대체',
  mixed: '혼합',
  bond: '채권',
  cash: '현금성',
};

export const TYPE_COLOR = {
  stock: '#22d3ee',
  alternative: '#f59e0b',
  mixed: '#a78bfa',
  bond: '#34d399',
  cash: '#94a3b8',
};
