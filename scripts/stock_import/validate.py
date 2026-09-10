"""Cross-check actual records independently from workbook summary counts."""
from collections import Counter
from .reader import SIGNALS


def validate(summary, signals, exceptions, industry, issues):
    def check(name, expected, actual):
        status = 'unavailable' if expected is None else 'pass' if expected == actual else 'warning'
        issues.append({'name': name, 'status': status, 'expected': expected, 'actual': actual,
                       'message': '源文件未提供核验值' if expected is None else '一致' if expected == actual else '汇总与实际数据不一致'})
    for signal, records in signals.items():
        check(SIGNALS[signal] + '数量', summary['reportedCounts'].get(signal), len(records))
        check(SIGNALS[signal] + '重复代码', 0, len(records)-len({r['code'] for r in records}))
        invalid = sum(r['streak'] is None or (r['streak'] < 3 if signal == 'three-yang-plus' else r['streak'] != (2 if signal == 'two-yin' else 3)) for r in records)
        check(SIGNALS[signal] + '连续天数异常', 0, invalid)
        details = Counter(r['industry'] for r in records)
        reported = Counter()
        for r in industry:
            if r['signal'] == signal:
                reported[r['industry']] += r['count']
        if summary['sheetStatus']['行业汇总'] == 'available':
            check(SIGNALS[signal] + '行业合计', len(records), sum(reported.values()))
            for name in sorted(set(details) | set(reported), key=lambda x: x or ''):
                check(SIGNALS[signal] + '/' + (name or '未分类'), details[name], reported[name])
    check('异常合计', summary['metrics']['exceptions'], len(exceptions))
    check('两类连阴交集', 0, len({r['code'] for r in signals['two-yin']} & {r['code'] for r in signals['three-yin']}))
    check('异常与信号交集', 0, len({r['code'] for r in exceptions} & {r['code'] for rs in signals.values() for r in rs}))
    return issues
