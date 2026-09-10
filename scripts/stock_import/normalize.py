"""Normalize Excel values without leaking NaN, blank strings, or numeric codes."""
import math
import re
from datetime import date, datetime
from openpyxl.utils.datetime import from_excel, WINDOWS_EPOCH


def text(value):
    if value is None:
        return None
    value = str(value).strip()
    return value or None


def number(value, integer=False):
    if value is None or isinstance(value, bool):
        return None
    try:
        value = float(str(value).replace(',', '').replace('%', '').strip())
        if not math.isfinite(value):
            return None
        return int(round(value)) if integer else round(value, 8)
    except (ValueError, TypeError):
        return None


def iso_date(value, epoch=WINDOWS_EPOCH):
    if isinstance(value, (datetime, date)):
        return value.strftime('%Y-%m-%d')
    if isinstance(value, (float, int)) and not isinstance(value, bool):
        try:
            converted = from_excel(value, epoch)
            return converted.strftime('%Y-%m-%d') if isinstance(converted, (datetime, date)) else None
        except (ValueError, OverflowError):
            return None
    match = re.search(r'((?:19|20)\d{2})[-/年.](\d{1,2})[-/月.](\d{1,2})', str(value))
    if not match:
        match = re.search(r'(?<!\d)((?:19|20)\d{2})(\d{2})(\d{2})(?!\d)', str(value))
    if match:
        try:
            return date(*map(int, match.groups())).isoformat()
        except ValueError:
            pass
    return None


def security_code(value):
    # Never infer exchange from a number. Preserve an explicit code as a string.
    value = text(value)
    if not value:
        return None
    value = value.upper()
    if re.fullmatch(r'\d{1,6}(?:\.0)?', value):
        return value.removesuffix('.0').zfill(6)
    return value if re.fullmatch(r'\d{6}\.(SZ|SH|BJ)', value) else None


def st_status(value):
    value = text(value)
    if value is None:
        return None
    if value.upper() in ('是', 'ST', '*ST', 'TRUE', '1'):
        return True
    if value.upper() in ('否', 'FALSE', '0', '非ST'):
        return False
    return None


def missing_dates(value, epoch):
    if value is None or text(value) is None:
        return None
    if isinstance(value, (datetime, date, int, float)):
        parsed = iso_date(value, epoch)
        return [parsed] if parsed else None
    values = re.findall(r'(?:19|20)\d{2}[-/年.]\d{1,2}[-/月.]\d{1,2}|(?<!\d)(?:19|20)\d{6}(?!\d)', str(value))
    return [parsed for v in values if (parsed := iso_date(v, epoch))] or None
