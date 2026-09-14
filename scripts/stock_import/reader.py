"""Locate real headers and support the two observed workbook generations."""
from collections import Counter
from datetime import date, datetime
import re
from .normalize import text, number, iso_date, security_code, st_status, missing_dates

SIGNALS = {'two-yin': '严格两连阴', 'three-yin': '严格三连阴', 'three-yang-plus': '三连阳及以上'}
ALIASES = {'ST标识': 'ST/*ST', 'ST/＊ST': 'ST/*ST', '股票数': '数量', '缺失交易日': '缺失日期'}
FIELDS = {'证券代码': 'code', '证券简称': 'name', '申万一级行业': 'industry', '连续天数': 'streak',
          '开盘价': 'open', '最高价': 'high', '最低价': 'low', '收盘价': 'close', '成交量': 'volume', '上市日期': 'listedDate'}
WEEKLY_FIELDS = {'周KDJ-K': 'weeklyKdjK', '周KDJ-D': 'weeklyKdjD',
                 '周KDJ-J': 'weeklyKdjJ', '周RSI14': 'weeklyRsi14'}


def clean(value):
    return re.sub(r'\s+', '', str(value)) if value is not None else ''


def issue(issues, name, message, expected=None, actual=None):
    issues.append({'name': name, 'status': 'warning', 'message': message, 'expected': expected, 'actual': actual})


def rows_of(book, sheet):
    if sheet not in book.sheetnames:
        return None
    ws = book[sheet]
    # Some actual workbooks omit dimensions; some producers write incorrect dimensions.
    ws.reset_dimensions()
    return list(ws.iter_rows(values_only=True))


def summary_date(rows, epoch, issues):
    if rows is None:
        raise ValueError('缺少汇总工作表，无法确定数据日期')
    for row in rows:
        for col, cell in enumerate(row[:-1]):
            if clean(cell).upper() == 'T0日期':
                parsed = iso_date(row[col + 1], epoch)
                if not parsed:
                    raise ValueError('汇总 T0日期 无法读取；不使用文件名替代无效的 T0日期')
                return parsed, 'summary:T0日期'
    # Compatibility is bounded to dated title/scope lines, never the filename.
    dates = set()
    for row in rows:
        for cell in row:
            if isinstance(cell, str) and ('A股连阴连阳扫描' in cell or cell.startswith('范围：')):
                if parsed := iso_date(cell, epoch):
                    dates.add(parsed)
    if len(dates) == 1:
        issue(issues, '日期来源', '旧版汇总无 T0日期，使用汇总标题/范围中的明确日期')
        return dates.pop(), 'summary:legacy-title'
    raise ValueError('汇总中缺少可唯一识别的 T0日期')


def table(rows, required, sheet, issues):
    if rows is None:
        issue(issues, sheet, f'缺少工作表：{sheet}')
        return [], [], 'missing'
    for index, row in enumerate(rows):
        headers = [ALIASES.get(clean(c), clean(c)) for c in row]
        if required.issubset(set(headers)):
            mapped = [dict(zip(headers, r)) for r in rows[index + 1:] if any(text(c) for c in r)]
            return headers, mapped, 'available'
    state = 'empty' if not any(any(text(c) for c in r) for r in rows) else 'invalid'
    issue(issues, sheet, f'{sheet}为空或找不到必要表头：{", ".join(sorted(required))}')
    return [], [], state


def read_stocks(book, sheet, issues, exception=False):
    required = {'证券代码'} | ({'异常类型'} if exception else set())
    headers, rows, state = table(rows_of(book, sheet), required, sheet, issues)
    if state != 'available':
        return [], state
    expected = (set(FIELDS) - ({'连续天数'} if exception else set())) | {'ST/*ST'}
    missing = sorted(expected - set(headers))
    if missing:
        issue(issues, sheet + '缺列', f'缺少列，相关值置空：{", ".join(missing)}')
    records, invalid = [], 0
    for row in rows:
        code = security_code(row.get('证券代码'))
        if not code:
            invalid += 1
            continue
        record = {field: None for field in FIELDS.values()}
        record.update(code=code, name=text(row.get('证券简称')), industry=text(row.get('申万一级行业')))
        record['streak'] = number(row.get('连续天数'), True)
        record['isST'] = st_status(row.get('ST/*ST'))
        record['stLabel'] = text(row.get('ST/*ST'))
        for key in ['开盘价', '最高价', '最低价', '收盘价', '成交量']:
            record[FIELDS[key]] = number(row.get(key), key == '成交量')
        if not exception:
            for header, field in WEEKLY_FIELDS.items():
                record[field] = number(row.get(header))
        record['listedDate'] = iso_date(row.get('上市日期'), book.epoch)
        if exception:
            record['type'] = text(row.get('异常类型')) or '未注明类型'
            record['missingDates'] = missing_dates(row.get('缺失日期'), book.epoch)
        records.append(record)
    if invalid:
        issue(issues, sheet + '无效行', '已忽略不含有效证券代码的行', actual=invalid)
    unknown_st = sum(r['isST'] is None for r in records)
    if unknown_st:
        issue(issues, sheet + 'ST未知', 'ST原始字段为空或无法识别，保留未知状态', actual=unknown_st)
    return records, state


def read_industry(book, issues):
    _, rows, state = table(rows_of(book, '行业汇总'), {'类别', '申万一级行业', '数量'}, '行业汇总', issues)
    reverse = {v: k for k, v in SIGNALS.items()}
    records = []
    for row in rows:
        signal = reverse.get(clean(row.get('类别')))
        count = number(row.get('数量'), True)
        if signal and count is not None:
            records.append({'signal': signal, 'rank': number(row.get('排名'), True),
                            'industry': text(row.get('申万一级行业')), 'count': count})
        else:
            issue(issues, '行业行', '无法识别行业类别或数量，已忽略该行', actual=text(row.get('类别')))
    return records, state


def read_summary(rows, epoch):
    metrics, definitions, source_checks, reported, leaders = {}, [], [], {}, {}
    in_definitions = False
    reverse = {v: k for k, v in SIGNALS.items()}
    for row in rows:
        if not row:
            continue
        if clean(row[0]) == '统计口径':
            in_definitions = True
            continue
        if in_definitions:
            if text(row[0]) and len(row) > 1 and text(row[1]):
                definitions.append({'label': text(row[0]), 'text': text(row[1])})
            continue
        for col, cell in enumerate(row[:-1]):
            key, value = clean(cell), row[col + 1]
            if not key or value is None:
                continue
            if key in reverse and (count := number(value, True)) is not None:
                reported[reverse[key]] = count
                if len(row) > col + 3:
                    leaders[reverse[key]] = {'industry': text(row[col + 2]), 'count': number(row[col + 3], True)}
            if col == 0:
                normalized = iso_date(value, epoch) if '日期' in key else value
                if isinstance(normalized, (date, datetime)):
                    normalized = normalized.isoformat()
                metrics[key] = normalized if isinstance(normalized, (str, int, float, bool)) else text(normalized)
            if col == 3 and key not in reverse and key not in ('信号', '核验项目', '两类连阴交集'):
                source_checks.append({'name': key, 'result': iso_date(value, epoch) if isinstance(value, (date, datetime)) else text(value),
                                      'expected': text(row[col+2]) if len(row)>col+2 else None,
                                      'conclusion': text(row[col+3]) if len(row)>col+3 else None})
            if key == '两类连阴交集':
                metrics[key] = number(value, True)
    aliases = {
        'listed': ['上市股票池', 'iFinD当前A股证券数'], 'active': ['有效成交', '当日有有效成交'],
        'coverage': ['有效成交覆盖率'], 'onePrice': ['当日一价成交'], 'suspended': ['停牌', '当日停牌'],
        'noQuote': ['当日无有效行情', '当日无有效行情（非停牌标识）'],
        'historyMissing': ['历史缺失/上市不足', '必要历史日停牌或缺数/上市不足'],
        'exceptions': ['异常合计'], 'poolRefreshDate': ['股票池刷新日期']}
    normalized = {}
    for field, names in aliases.items():
        value = next((metrics[n] for n in names if n in metrics), None)
        if field == 'poolRefreshDate':
            normalized[field] = iso_date(value, epoch)
        else:
            normalized[field] = number(value, field != 'coverage')
            if field == 'coverage' and isinstance(value, str) and '%' in value and normalized[field] is not None:
                normalized[field] /= 100
    if normalized['coverage'] is None and normalized['listed'] and normalized['active'] is not None:
        normalized['coverage'] = normalized['active'] / normalized['listed']
    return {'metrics': normalized, 'rawMetrics': metrics, 'definitions': definitions, 'sourceChecks': source_checks,
            'reportedCounts': reported, 'reportedLeaders': leaders,
            'tradingStatus': text(metrics.get('交易日状态')) or '源文件未注明'}
