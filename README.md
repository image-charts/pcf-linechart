
# @image-charts/pcf-linechart

[![npm version](https://img.shields.io/npm/v/%40image-charts/pcf-linechart.svg)](https://www.npmjs.com/package/@image-charts/pcf-linechart)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> Generate signed [Image-Charts](https://image-charts.com) Line Charts directly in Microsoft Power Apps Canvas Apps

## Quick Start

```bash
npm install @image-charts/pcf-linechart
```

Import `node_modules/@image-charts/pcf-linechart/solution/ImageChartsLineChart.zip` into Power Apps.

```powerapps-fx
LineChartGenerator.accountId = "YOUR_ACCOUNT_ID"
LineChartGenerator.secretKey = "YOUR_SECRET_KEY"
LineChartGenerator.data = "10,25,15,30,20"
LineChartGenerator.labels = "Jan,Feb,Mar,Apr,May"
```

## Properties

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `accountId` | Text | No* | Enterprise Account ID |
| `secretKey` | Text | No* | Enterprise Secret Key |
| `privateCloudDomain` | Text | No* | Private Cloud domain |
| `data` | Text | **Yes** | Line values (CSV or pipe-separated) |
| `labels` | Text | No | X-axis labels |
| `colors` | Text | No | Line colors (pipe-separated hex) |
| `title` | Text | No | Chart title |
| `lineWidth` | Number | No | Line thickness in pixels |
| `chartSize` | Text | No | Size (`WIDTHxHEIGHT`) |
| `advancedOptions` | Text | No | Additional parameters |
| `showDebugUrl` | Boolean | No | Display generated URL |
| `signedUrl` | Text | Output | Generated URL |

## Documentation

[https://documentation.image-charts.com/integrations/power-apps/](https://documentation.image-charts.com/integrations/power-apps/)

## License

MIT
