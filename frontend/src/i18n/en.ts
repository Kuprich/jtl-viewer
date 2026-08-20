import type { MessageDict } from './types'

export const en: MessageDict = {
  // App header
  'app.openRuns': 'Open runs list',
  'app.logout': 'Log out',
  'app.exportTooltip': 'Export report to HTML',
  'app.export': 'Export report',
  'app.settings': 'Display settings',
  'app.language': 'Language',
  'app.languageRu': 'Russian',
  'app.languageEn': 'English',

  // Login
  'login.subtitle': 'JTL runs viewer',
  'login.username': 'Username',
  'login.password': 'Password',
  'login.submit': 'Sign in',
  'login.badCredentials': 'Invalid username or password',

  // Home
  'home.empty': 'Select a run on the left to see results',

  // Auth / API
  'api.authRequired': 'Authentication required',

  // Run selector
  'selector.title': 'Test logs',
  'selector.search': 'Search by file name',
  'selector.uploadTitle': 'Upload JTL',
  'selector.uploadHint': 'drop a file or click',
  'selector.errorsTag': 'Errors: {pct}',
  'selector.deleteTitle': 'Delete run',
  'selector.deleteConfirm': 'Delete run "{file}"? The data will be permanently removed.',
  'selector.delete': 'Delete',
  'selector.cancel': 'Cancel',
  'selector.uploaded': 'Uploaded: {file}, {n} rows',
  'selector.deleted': 'Deleted: {file}',
  'selector.empty': 'No logs yet — upload a JTL file',
  'selector.noMatches': 'No matches',

  // Ops filter
  'ops.title': 'Select operations to include in statistics',
  'ops.excluded': 'Excluded',
  'ops.included': 'Included',
  'ops.search': 'Search',
  'ops.empty': 'No data',
  'ops.moveAllRight': 'Move all',
  'ops.moveRight': 'Move selected',
  'ops.moveLeft': 'Move selected back',
  'ops.moveAllLeft': 'Move all back',
  'ops.loadFailed': 'Failed to load operations: {list}',

  // Run detail
  'detail.loading': 'Loading…',
  'detail.testMeta': 'Test: {start} – {end} ({duration})',
  'detail.selectOps': 'Select operations',
  'detail.throughput': 'Throughput',
  'detail.showVu': 'VU chart',
  'detail.kpis': 'Metrics (KPI)',
  'detail.requests': 'Requests',
  'detail.errors': 'Errors',
  'detail.duration': 'Duration',
  'detail.incoming': 'Incoming',
  'detail.outgoing': 'Outgoing',
  'detail.exportSaved': 'Report saved as HTML',
  'detail.errorThresholdHint':
    'For each operation total calls are shown<br />split into successful and errors, plus the error share in %.<br />Errors above the threshold are highlighted in red (currently {pct}%).<br />The threshold is set in "Display settings".',
  'detail.trafficHint':
    'Traffic relative to the load generator:<br />Incoming — responses received by the generator from the service;<br />Outgoing — requests sent by the generator to the service.<br />Only application payload is counted (no headers, TCP/IP or TLS overhead).',

  // Settings drawer
  'settings.title': 'Display settings',
  'settings.theme': 'Theme',
  'settings.dark': 'Dark',
  'settings.light': 'Light',
  'settings.zoom': 'Zoom by selection',
  'settings.zoomHint':
    'Drag with the mouse over any chart —<br />charts will zoom to that interval.<br />Double-click a chart or press "Reset zoom"<br />to restore the full interval.',
  'settings.resetZoom': 'Reset zoom',
  'settings.bucket': 'Aggregation interval',
  'settings.bucketAuto': 'Auto',
  'settings.lineWidth': 'Line width',
  'settings.pointSize': 'Point size',
  'settings.fill': 'Area fill',
  'settings.errorThreshold': 'Error threshold, %',
  'settings.rateUnit': 'Load units',

  // Export dialog
  'export.title': 'Export report',
  'export.theme': 'Export theme',
  'export.panels': 'Panels',
  'export.cancel': 'Cancel',
  'export.download': 'Download HTML',
  'export.throughputSubtitle': 'Throughput',
  'export.statsSubtitle': 'Grouping and statistics',

  // Export panels
  'export.opsThroughput': 'Throughput (by operation)',
  'export.allPercentiles': 'Response time for all operations',
  'export.opsPercentiles': 'Response time by operation',
  'export.frequency': 'Call frequency',
  'export.traffic': 'Traffic (incoming/outgoing)',
  'export.throughputErrors': 'Errors/sec',
  'export.throughputRate': 'Errors %',
  'export.throughputTitleErrors': 'Throughput (Errors/sec)',
  'export.throughputTitleRate': 'Throughput (Errors %)',
  'export.statsLabel': 'Scenario',
  'export.statsResponseCode': 'Response code',
  'export.statsErrorMessage': 'Errors',

  // Stats table
  'stats.title': 'Grouping and statistics',
  'stats.errorHint':
    'Requests with an error share above the threshold are highlighted in red<br />(currently {pct}%).<br />The threshold is set in "Display settings".',
  'stats.search': 'Search operation',
  'stats.groupByLabel': 'Scenario',
  'stats.groupByResponseCode': 'Response code',
  'stats.groupByErrorMessage': 'Errors',
  'stats.withoutText': 'without text',
  'stats.withoutCode': 'without code',
  'stats.colRequests': 'Requests',
  'stats.colErrors': 'Errors',
  'stats.colAvgBytes': 'Avg bytes',
  'stats.colGroup': 'Group',
  'stats.noCodeErrorHint':
    'Failed samples without an error text —<br />e.g. Transaction Controller.',
  'stats.noCodeHint':
    'Samples without a responseCode are usually Transaction Controller,<br />aggregating nested requests.<br />Details are in the "Scenario" tab.',
  'stats.noMatches': 'No matches',
  'stats.empty': 'No data',

  // Charts
  'chart.empty': 'No data',
  'chart.responseTime': 'Response time',
  'chart.traffic': 'Traffic',
  'chart.vu': 'Virtual users',
  'chart.incoming': 'Incoming',
  'chart.outgoing': 'Outgoing',
  'chart.successful': 'Successful',
  'chart.errors': 'Errors',
  'chart.freqTooltip': 'Successful: {ok} · Errors: {err}',

  // Format units
  'format.ms': 'ms',
  'format.s': 's',
  'format.min': 'min',
  'format.h': 'h',
  'format.b': 'B',
  'format.kb': 'KB',
  'format.mb': 'MB',
  'format.gb': 'GB',
  'format.bit': 'bit',
  'format.kbit': 'Kbit',
  'format.mbit': 'Mbit',
  'format.gbit': 'Gbit',
  'format.perSec': '/s',

  // Export HTML
  'report.title': '{file} — jtl-viewer report',
  'report.uploaded': 'Uploaded: {date}',
  'report.test': 'Test: {start} – {end} ({duration})',
  'report.statsSection': 'Grouping and statistics — {title}',
}