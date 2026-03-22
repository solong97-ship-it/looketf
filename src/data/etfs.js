export const ETF_LIST = [
  { name: 'KODEX 미국S&P500', code: '379800', dividendYield: 1.74, type: 'stock' },
  { name: 'KODEX 미국나스닥100', code: '379810', dividendYield: 0.94, type: 'stock' },
  { name: 'SOL 미국배당다우존스', code: '446720', dividendYield: 2.95, type: 'stock' },
  { name: 'KIWOOM 200TR', code: '294400', dividendYield: 0, type: 'stock' },
  { name: 'KODEX 차이나CSI300', code: '283580', dividendYield: 2.05, type: 'stock' },
  { name: 'KODEX 인도Nifty50', code: '453810', dividendYield: 1.24, type: 'stock' },
  { name: 'ACE KRX금현물', code: '411060', dividendYield: 0, type: 'alt' },
  { name: 'TIGER 리츠부동산인프라', code: '329200', dividendYield: 8.78, type: 'alt' },
  { name: 'KODEX 200미국채혼합', code: '284430', dividendYield: 1.5, type: 'mixed' },
  { name: 'TIGER 미국채10년선물', code: '305080', dividendYield: 2.0, type: 'bond' },
  { name: 'TIGER 단기채권액티브', code: '332610', dividendYield: 3.5, type: 'bond' },
  { name: 'KODEX KOFR금리액티브(합성)', code: '439330', dividendYield: 3.6, type: 'cash' },
  { name: 'KODEX 단기채권', code: '153130', dividendYield: 3.5, type: 'cash' },
];

export const ETF_CODE_KOFR = '439330';

export const TYPE_LABEL = {
  stock: '주식',
  alt: '대체',
  mixed: '혼합',
  bond: '채권',
  cash: '현금성',
};
