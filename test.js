/**
 * Unit Tests for LineChartGenerator PCF Component
 */

const crypto = require('crypto');

function computeHmacSha256Sync(secretKey, message) {
  return crypto.createHmac('sha256', secretKey).update(message).digest('hex');
}

function parseDataValues(data) {
  if (!data) return [];
  const trimmed = data.trim();
  const separator = trimmed.includes('|') ? '|' : ',';
  return trimmed.split(separator).map(v => parseFloat(v.trim())).filter(v => !isNaN(v));
}

function formatDataAwesome(values) {
  if (values.length === 0) return '';
  return 'a:' + values.join(',');
}

function parseLabels(labels) {
  if (!labels) return [];
  const trimmed = labels.trim();
  const separator = trimmed.includes('|') ? '|' : ',';
  return trimmed.split(separator).map(l => l.trim()).filter(l => l !== '');
}

function buildLineChartUrl(params) {
  const { accountId, secretKey, privateCloudDomain, data, labels, colors, title, lineWidth, chartSize } = params;
  const host = privateCloudDomain || 'image-charts.com';
  const dataValues = parseDataValues(data);

  const queryParts = ['cht=lc', 'chs=' + (chartSize || '400x300'), 'chd=' + formatDataAwesome(dataValues)];

  if (labels) {
    const labelArr = parseLabels(labels);
    if (labelArr.length > 0) queryParts.push('chxl=0:|' + labelArr.join('|'));
  }
  if (colors) queryParts.push('chco=' + colors);
  if (title) queryParts.push('chtt=' + title);
  if (lineWidth) queryParts.push('chls=' + lineWidth);
  if (accountId && !privateCloudDomain) queryParts.push('icac=' + accountId);

  const queryString = queryParts.join('&');

  if (accountId && secretKey && !privateCloudDomain) {
    const signature = computeHmacSha256Sync(secretKey, queryString);
    return 'https://' + host + '/chart?' + queryString + '&ichm=' + signature;
  }
  return 'https://' + host + '/chart?' + queryString;
}

describe('Line Chart URL Building', () => {
  test('should build line chart URL with cht=lc', () => {
    const url = buildLineChartUrl({
      accountId: 'test_account',
      secretKey: 'test_secret',
      data: '10,25,15,30,20',
      labels: 'Jan,Feb,Mar,Apr,May'
    });

    expect(url).toContain('cht=lc');
    expect(url).toContain('chd=a:10,25,15,30,20');
    expect(url).toContain('ichm=');
  });

  test('should include line width', () => {
    const url = buildLineChartUrl({
      accountId: 'test_account',
      secretKey: 'test_secret',
      data: '10,20,30',
      lineWidth: '3'
    });

    expect(url).toContain('chls=3');
  });

  test('should include colors', () => {
    const url = buildLineChartUrl({
      accountId: 'test_account',
      secretKey: 'test_secret',
      data: '10,20,30',
      colors: 'FF0000'
    });

    expect(url).toContain('chco=FF0000');
  });

  test('should handle Private Cloud mode', () => {
    const url = buildLineChartUrl({
      privateCloudDomain: 'charts.mycompany.com',
      data: '10,20,30'
    });

    expect(url).toContain('https://charts.mycompany.com/chart');
    expect(url).not.toContain('ichm=');
  });
});

describe('Data Parsing', () => {
  test('should handle time series data', () => {
    const values = parseDataValues('100,150,120,180,200');
    expect(values).toEqual([100, 150, 120, 180, 200]);
  });

  test('should handle negative values', () => {
    const values = parseDataValues('10,-5,20,-10,15');
    expect(values).toEqual([10, -5, 20, -10, 15]);
  });
});
