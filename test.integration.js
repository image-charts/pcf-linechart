/**
 * Integration Tests for LineChartGenerator PCF Component
 * Black-box tests against the real Image-Charts API.
 * Based on test scenarios from the Zapier connector.
 */

const crypto = require('crypto');
const https = require('https');

const ACCOUNT_ID = process.env.IMAGE_CHARTS_ACCOUNT_ID;
const SECRET_KEY = process.env.IMAGE_CHARTS_SECRET_KEY;
const PRIVATE_CLOUD_DOMAIN = process.env.IMAGE_CHARTS_PRIVATE_CLOUD_DOMAIN;
const USER_AGENT = process.env.IMAGE_CHARTS_USER_AGENT || 'pcf-image-charts-linechart/1.0.0-test';

const describeIfCredentials = ACCOUNT_ID && SECRET_KEY ? describe : describe.skip;
const describeIfPrivateCloud = PRIVATE_CLOUD_DOMAIN ? describe : describe.skip;

function computeHmacSha256Sync(secretKey, message) {
  return crypto.createHmac('sha256', secretKey).update(message).digest('hex');
}

function buildSignedLineChartUrl(params) {
  const { accountId, secretKey, data, labels, lineWidth, chartSize, chartType } = params;
  const cht = chartType || 'lc';
  const searchParams = new URLSearchParams();
  searchParams.append('cht', cht);
  searchParams.append('chs', chartSize || '400x300');
  searchParams.append('chd', 'a:' + data);
  if (labels) searchParams.append('chxl', '0:|' + labels);
  if (lineWidth) searchParams.append('chls', lineWidth);
  searchParams.append('icac', accountId);
  const signature = computeHmacSha256Sync(secretKey, searchParams.toString());
  searchParams.append('ichm', signature);
  return 'https://image-charts.com/chart?' + searchParams.toString();
}

function buildPrivateCloudLineChartUrl(params) {
  const { domain, data, labels, lineWidth, chartSize, chartType } = params;
  const cht = chartType || 'lc';
  const searchParams = new URLSearchParams();
  searchParams.append('cht', cht);
  searchParams.append('chs', chartSize || '400x300');
  searchParams.append('chd', 'a:' + data);
  if (labels) searchParams.append('chxl', '0:|' + labels);
  if (lineWidth) searchParams.append('chls', lineWidth);
  const baseUrl = domain.endsWith('/') ? domain.slice(0, -1) : domain;
  return baseUrl + '/chart?' + searchParams.toString();
}

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: { 'User-Agent': USER_AGENT } }, (res) => {
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => {
        resolve({ statusCode: res.statusCode, headers: res.headers, body: Buffer.concat(chunks) });
      });
    });
    req.on('error', reject);
    req.setTimeout(10000, () => { req.destroy(); reject(new Error('Request timeout')); });
  });
}

// ============================================================
// URL Generation Tests
// ============================================================

describe('URL Generation', () => {
  const testAccountId = 'test_account';
  const testSecretKey = 'test_secret_key_123';

  test('should generate correct URL structure for line chart (lc)', () => {
    const url = buildSignedLineChartUrl({
      accountId: testAccountId,
      secretKey: testSecretKey,
      data: '60,40',
      chartSize: '300x300'
    });
    expect(url).toContain('cht=lc');
    expect(url).toContain('chs=300x300');
    expect(url).toContain('chd=a%3A60%2C40');
    expect(url).toContain('icac=' + testAccountId);
    expect(url).toContain('ichm=');
  });

  test('should generate correct URL for sparkline (ls)', () => {
    const url = buildSignedLineChartUrl({
      accountId: testAccountId,
      secretKey: testSecretKey,
      data: '10,25,15,30,20',
      chartType: 'ls',
      chartSize: '200x50'
    });
    expect(url).toContain('cht=ls');
  });

  test('should generate correct URL for scatter/xy chart (lxy)', () => {
    const url = buildSignedLineChartUrl({
      accountId: testAccountId,
      secretKey: testSecretKey,
      data: '10,20,30|5,10,15',
      chartType: 'lxy'
    });
    expect(url).toContain('cht=lxy');
  });

  test('should include labels when provided', () => {
    const url = buildSignedLineChartUrl({
      accountId: testAccountId,
      secretKey: testSecretKey,
      data: '10,20,30',
      labels: 'Jan|Feb|Mar'
    });
    expect(url).toContain('chxl=0%3A%7CJan%7CFeb%7CMar');
  });

  test('should include line width when provided', () => {
    const url = buildSignedLineChartUrl({
      accountId: testAccountId,
      secretKey: testSecretKey,
      data: '10,20,30',
      lineWidth: '5'
    });
    expect(url).toContain('chls=5');
  });

  test('HMAC signature should be deterministic', () => {
    const params = {
      accountId: testAccountId,
      secretKey: testSecretKey,
      data: '10,20,30',
      chartSize: '300x300'
    };
    const url1 = buildSignedLineChartUrl(params);
    const url2 = buildSignedLineChartUrl(params);
    expect(url1).toBe(url2);
  });

  test('Private Cloud URL should not include icac or ichm', () => {
    const url = buildPrivateCloudLineChartUrl({
      domain: 'https://private.example.com',
      data: '10,20,30'
    });
    expect(url).not.toContain('icac=');
    expect(url).not.toContain('ichm=');
  });
});

// ============================================================
// API Integration Tests - Enterprise Mode
// ============================================================

describeIfCredentials('Enterprise Mode - Line Charts', () => {
  test('should return 200 for standard line chart (lc)', () => {
    const url = buildSignedLineChartUrl({
      accountId: ACCOUNT_ID,
      secretKey: SECRET_KEY,
      data: '60,40',
      chartSize: '300x300'
    });
    return fetchUrl(url).then((response) => {
      expect(response.statusCode).toBe(200);
      expect(response.headers['content-type']).toMatch(/^image\//);
    });
  }, 15000);

  test('should return 200 for sparkline chart (ls)', () => {
    const url = buildSignedLineChartUrl({
      accountId: ACCOUNT_ID,
      secretKey: SECRET_KEY,
      data: '10,25,15,30,20,35,25',
      chartType: 'ls',
      chartSize: '200x50'
    });
    return fetchUrl(url).then((response) => {
      expect(response.statusCode).toBe(200);
      expect(response.headers['content-type']).toMatch(/^image\//);
    });
  }, 15000);

  test('should return 200 for scatter/xy chart (lxy)', () => {
    const url = buildSignedLineChartUrl({
      accountId: ACCOUNT_ID,
      secretKey: SECRET_KEY,
      data: '10,20,30,40|5,10,15,20',
      chartType: 'lxy'
    });
    return fetchUrl(url).then((response) => {
      expect(response.statusCode).toBe(200);
      expect(response.headers['content-type']).toMatch(/^image\//);
    });
  }, 15000);

  test('should return 200 with labels', () => {
    const url = buildSignedLineChartUrl({
      accountId: ACCOUNT_ID,
      secretKey: SECRET_KEY,
      data: '10,25,15,30,20',
      labels: 'Jan|Feb|Mar|Apr|May'
    });
    return fetchUrl(url).then((response) => {
      expect(response.statusCode).toBe(200);
    });
  }, 15000);

  test('should return 200 with custom line width', () => {
    const url = buildSignedLineChartUrl({
      accountId: ACCOUNT_ID,
      secretKey: SECRET_KEY,
      data: '10,20,30,40,50',
      lineWidth: '5'
    });
    return fetchUrl(url).then((response) => {
      expect(response.statusCode).toBe(200);
    });
  }, 15000);

  test('should handle many data points', () => {
    const data = Array.from({ length: 50 }, (_, i) => Math.floor(Math.random() * 100)).join(',');
    const url = buildSignedLineChartUrl({
      accountId: ACCOUNT_ID,
      secretKey: SECRET_KEY,
      data: data
    });
    return fetchUrl(url).then((response) => {
      expect(response.statusCode).toBe(200);
    });
  }, 15000);

  test('should return 403 for invalid signature', () => {
    const url = 'https://image-charts.com/chart?cht=lc&chs=400x300&chd=a%3A10%2C20%2C30&icac=' + ACCOUNT_ID + '&ichm=invalid_signature';
    return fetchUrl(url).then((response) => {
      expect([400, 403]).toContain(response.statusCode);
    });
  }, 15000);
});

// ============================================================
// Private Cloud Mode Tests
// ============================================================

describeIfPrivateCloud('Private Cloud Mode - Line Charts', () => {
  test('should return 200 for standard line chart (lc)', () => {
    const url = buildPrivateCloudLineChartUrl({
      domain: PRIVATE_CLOUD_DOMAIN,
      data: '60,40',
      chartSize: '300x300'
    });
    return fetchUrl(url).then((response) => {
      expect(response.statusCode).toBe(200);
      expect(response.headers['content-type']).toMatch(/^image\//);
    });
  }, 15000);

  test('should return 200 for sparkline chart (ls)', () => {
    const url = buildPrivateCloudLineChartUrl({
      domain: PRIVATE_CLOUD_DOMAIN,
      data: '10,25,15,30,20,35,25',
      chartType: 'ls',
      chartSize: '200x50'
    });
    return fetchUrl(url).then((response) => {
      expect(response.statusCode).toBe(200);
      expect(response.headers['content-type']).toMatch(/^image\//);
    });
  }, 15000);

  test('should return 200 for scatter/xy chart (lxy)', () => {
    const url = buildPrivateCloudLineChartUrl({
      domain: PRIVATE_CLOUD_DOMAIN,
      data: '10,20,30,40|5,10,15,20',
      chartType: 'lxy'
    });
    return fetchUrl(url).then((response) => {
      expect(response.statusCode).toBe(200);
      expect(response.headers['content-type']).toMatch(/^image\//);
    });
  }, 15000);

  test('should return 200 with labels', () => {
    const url = buildPrivateCloudLineChartUrl({
      domain: PRIVATE_CLOUD_DOMAIN,
      data: '10,25,15,30,20',
      labels: 'Jan|Feb|Mar|Apr|May'
    });
    return fetchUrl(url).then((response) => {
      expect(response.statusCode).toBe(200);
    });
  }, 15000);

  test('should return 200 with custom line width', () => {
    const url = buildPrivateCloudLineChartUrl({
      domain: PRIVATE_CLOUD_DOMAIN,
      data: '10,20,30,40,50',
      lineWidth: '5'
    });
    return fetchUrl(url).then((response) => {
      expect(response.statusCode).toBe(200);
    });
  }, 15000);

  test('should handle many data points', () => {
    const data = Array.from({ length: 50 }, (_, i) => Math.floor(Math.random() * 100)).join(',');
    const url = buildPrivateCloudLineChartUrl({
      domain: PRIVATE_CLOUD_DOMAIN,
      data: data
    });
    return fetchUrl(url).then((response) => {
      expect(response.statusCode).toBe(200);
    });
  }, 15000);
});

// ============================================================
// Performance Tests
// ============================================================

describeIfCredentials('Performance - Enterprise', () => {
  test('should respond within 5 seconds', () => {
    const startTime = Date.now();
    const url = buildSignedLineChartUrl({
      accountId: ACCOUNT_ID,
      secretKey: SECRET_KEY,
      data: '10,20,30,40,50'
    });
    return fetchUrl(url).then((response) => {
      expect(response.statusCode).toBe(200);
      expect(Date.now() - startTime).toBeLessThan(5000);
    });
  }, 10000);
});

describeIfPrivateCloud('Performance - Private Cloud', () => {
  test('should respond within 5 seconds', () => {
    const startTime = Date.now();
    const url = buildPrivateCloudLineChartUrl({
      domain: PRIVATE_CLOUD_DOMAIN,
      data: '10,20,30,40,50'
    });
    return fetchUrl(url).then((response) => {
      expect(response.statusCode).toBe(200);
      expect(Date.now() - startTime).toBeLessThan(5000);
    });
  }, 10000);
});
