"""Formatação de números no padrão brasileiro (1.388 · 27% · US$ 1,8 tri)."""

import math


def num(valor, casas=0, sinal=False):
    """1388 -> '1.388'; 1.39 (casas=2) -> '1,39'; sinal=True -> '+481' / '−204'."""
    if valor is None or (isinstance(valor, float) and math.isnan(valor)):
        return "–"
    s = f"{abs(valor):,.{casas}f}".replace(",", "X").replace(".", ",").replace("X", ".")
    if valor < 0:
        return "−" + s  # sinal de menos tipográfico
    return ("+" + s) if sinal and valor > 0 else s


def pct(valor, casas=0, sinal=False, fracao=True):
    """0.27 -> '27%'. Use fracao=False se o valor já vier em % (27 -> '27%')."""
    if valor is None or (isinstance(valor, float) and math.isnan(valor)):
        return "–"
    v = valor * 100 if fracao else valor
    return num(v, casas, sinal) + "%"


def pp(valor, casas=0, sinal=True):
    """Pontos percentuais: -2 -> '−2 p.p.'"""
    return num(valor, casas, sinal) + " p.p."


def moeda(valor, prefixo="US$", casas=1):
    """1.8e12 -> 'US$ 1,8 tri'; 447e9 -> 'US$ 447 bi'; 21.3e6 -> 'US$ 21,3 mi'."""
    for lim, suf in ((1e12, "tri"), (1e9, "bi"), (1e6, "mi"), (1e3, "mil")):
        if abs(valor) >= lim:
            v = valor / lim
            c = 0 if abs(v) >= 100 else casas
            return f"{prefixo} {num(v, c)} {suf}"
    return f"{prefixo} {num(valor, casas)}"


def eixo_num(casas=0):
    """Formatter de eixo matplotlib em padrão BR."""
    from matplotlib.ticker import FuncFormatter
    return FuncFormatter(lambda v, _: num(v, casas))


def eixo_pct(casas=0, fracao=True):
    from matplotlib.ticker import FuncFormatter
    return FuncFormatter(lambda v, _: pct(v, casas, fracao=fracao))


_MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"]


def eixo_data(estilo="mes"):
    """Datas em português: 'mes' -> 'mar/26'; 'ano' -> '2026'."""
    from matplotlib.dates import num2date
    from matplotlib.ticker import FuncFormatter

    def f(v, _):
        d = num2date(v)
        return f"{_MESES[d.month - 1]}/{d.strftime('%y')}" if estilo == "mes" else str(d.year)
    return FuncFormatter(f)
