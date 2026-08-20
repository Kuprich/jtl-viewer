import type { MessageDict } from './types'

export const ru: MessageDict = {
  // App header
  'app.openRuns': 'Открыть список запусков',
  'app.logout': 'Выйти',
  'app.exportTooltip': 'Экспорт отчёта в HTML',
  'app.export': 'Экспорт отчёта',
  'app.settings': 'Параметры отображения',
  'app.language': 'Язык',
  'app.languageRu': 'Русский',
  'app.languageEn': 'Английский',

  // Login
  'login.subtitle': 'просмотр JTL-запусков',
  'login.username': 'Логин',
  'login.password': 'Пароль',
  'login.submit': 'Войти',
  'login.badCredentials': 'Неверный логин или пароль',

  // Home
  'home.empty': 'Выберите запуск слева, чтобы увидеть результаты',

  // Auth / API
  'api.authRequired': 'Нужна авторизация',

  // Run selector
  'selector.title': 'Логи тестирования',
  'selector.search': 'Поиск по имени файла',
  'selector.uploadTitle': 'Загрузить JTL',
  'selector.uploadHint': 'перетащите файл или кликните',
  'selector.errorsTag': 'Ошибки: {pct}',
  'selector.deleteTitle': 'Удалить запуск',
  'selector.deleteConfirm': 'Удалить запуск «{file}»? Данные будут удалены безвозвратно.',
  'selector.delete': 'Удалить',
  'selector.cancel': 'Отмена',
  'selector.uploaded': 'Загружен: {file}, строк {n}',
  'selector.deleted': 'Удалён: {file}',
  'selector.empty': 'Логов пока нет — загрузите JTL',
  'selector.noMatches': 'Ничего не найдено',

  // Ops filter
  'ops.title': 'Выберите операции, которые будут учитываться в статистике',
  'ops.excluded': 'Не учитываются',
  'ops.included': 'Учитываются',
  'ops.search': 'Поиск',
  'ops.empty': 'Нет данных',
  'ops.moveAllRight': 'Перенести все',
  'ops.moveRight': 'Перенести выбранные',
  'ops.moveLeft': 'Вернуть выбранные',
  'ops.moveAllLeft': 'Вернуть все',
  'ops.loadFailed': 'Не удалось загрузить операции: {list}',

  // Run detail
  'detail.loading': 'Загрузка…',
  'detail.testMeta': 'Тест: {start} – {end} ({duration})',
  'detail.selectOps': 'Выбор операций',
  'detail.throughput': 'Пропускная способность',
  'detail.showVu': 'График VU',
  'detail.kpis': 'Показатели (KPI)',
  'detail.requests': 'Запросы',
  'detail.errors': 'Ошибки',
  'detail.duration': 'Длительность',
  'detail.incoming': 'Входящий',
  'detail.outgoing': 'Исходящий',
  'detail.exportSaved': 'Отчёт сохранён в HTML',
  'detail.errorThresholdHint':
    'Для каждой операции показано общее число вызовов,<br />разбитое на успешные и ошибки, и доля ошибок в %.<br />Красным выделена доля ошибок выше порога (сейчас {pct}%).<br />Порог настраивается в «Параметрах отображения».',
  'detail.trafficHint':
    'Трафик относительно станции нагрузки:<br />Входящий — ответы, полученные генератором от сервиса;<br />Исходящий — запросы, отправленные генератором сервису.<br />Учитывается только прикладная нагрузка (без заголовков, TCP/IP и TLS-оверхедов).',

  // Settings drawer
  'settings.title': 'Параметры отображения',
  'settings.theme': 'Тема оформления',
  'settings.dark': 'Тёмная',
  'settings.light': 'Светлая',
  'settings.zoom': 'Зум выделением',
  'settings.zoomHint':
    'Выделите участок мышью на любом графике —<br />графики приблизятся к этому интервалу.<br />Двойной клик по графику или кнопка «Сбросить зум»<br />вернут полный интервал.',
  'settings.resetZoom': 'Сбросить зум',
  'settings.bucket': 'Интервал агрегации',
  'settings.bucketAuto': 'Авто',
  'settings.lineWidth': 'Толщина линий',
  'settings.pointSize': 'Размер точек',
  'settings.fill': 'Заливка областей',
  'settings.errorThreshold': 'Порог ошибок, %',
  'settings.rateUnit': 'Единицы нагрузки',

  // Export dialog
  'export.title': 'Экспорт отчёта',
  'export.theme': 'Тема экспорта',
  'export.panels': 'Панели',
  'export.cancel': 'Отмена',
  'export.download': 'Скачать HTML',
  'export.throughputSubtitle': 'Пропускная способность',
  'export.statsSubtitle': 'Группировка и статистика',

  // Export panels
  'export.opsThroughput': 'Пропускная способность (по операциям)',
  'export.allPercentiles': 'Время отклика по всем операциям',
  'export.opsPercentiles': 'Время отклика по операциям',
  'export.frequency': 'Частота вызовов',
  'export.traffic': 'Трафик (входящий/исходящий)',
  'export.throughputErrors': 'Errors/sec',
  'export.throughputRate': 'Errors %',
  'export.throughputTitleErrors': 'Пропускная способность (Errors/sec)',
  'export.throughputTitleRate': 'Пропускная способность (Errors %)',
  'export.statsLabel': 'Сценарий',
  'export.statsResponseCode': 'Код ответа',
  'export.statsErrorMessage': 'Ошибки',

  // Stats table
  'stats.title': 'Группировка и статистика',
  'stats.errorHint':
    'Красным выделены запросы, у которых доля ошибок выше порога<br />(сейчас {pct}%).<br />Порог настраивается в «Параметрах отображения».',
  'stats.search': 'Поиск операции',
  'stats.groupByLabel': 'Сценарий',
  'stats.groupByResponseCode': 'Код ответа',
  'stats.groupByErrorMessage': 'Ошибки',
  'stats.withoutText': 'без текста',
  'stats.withoutCode': 'без кода',
  'stats.colRequests': 'Запросы',
  'stats.colErrors': 'Ошибки',
  'stats.colAvgBytes': 'Ср. байт',
  'stats.colGroup': 'Группа',
  'stats.noCodeErrorHint':
    'Упавшие сэмплы без текста ошибки —<br />например Transaction Controller.',
  'stats.noCodeHint':
    'Сэмплы без responseCode — обычно Transaction Controller,<br />агрегирующий вложенные запросы.<br />Детали — во вкладке «Сценарий».',
  'stats.noMatches': 'Ничего не найдено',
  'stats.empty': 'Нет данных',

  // Charts
  'chart.empty': 'Нет данных',
  'chart.responseTime': 'Время отклика',
  'chart.traffic': 'Трафик',
  'chart.vu': 'Виртуальные пользователи',
  'chart.incoming': 'Входящий',
  'chart.outgoing': 'Исходящий',
  'chart.successful': 'Успешные',
  'chart.errors': 'Ошибки',
  'chart.freqTooltip': 'Успешные: {ok} · Ошибки: {err}',

  // Format units
  'format.ms': 'мс',
  'format.s': 'с',
  'format.min': 'мин',
  'format.h': 'ч',
  'format.b': 'Б',
  'format.kb': 'КБ',
  'format.mb': 'МБ',
  'format.gb': 'ГБ',
  'format.bit': 'бит',
  'format.kbit': 'Кбит',
  'format.mbit': 'Мбит',
  'format.gbit': 'Гбит',
  'format.perSec': '/с',

  // Export HTML
  'report.title': '{file} — отчёт jtl-viewer',
  'report.uploaded': 'Загружен: {date}',
  'report.test': 'Тест: {start} – {end} ({duration})',
  'report.statsSection': 'Группировка и статистика — {title}',
}