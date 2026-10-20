"""Tipos de gráfico Mercurius.

Todas as funções recebem um `ax` vindo de `mc.figura(...)` e dados em pandas.
Regras embutidas: um eixo y, cores na ordem fixa do tema, rótulos diretos,
linhas finas, grade discreta e texto sempre em cor de texto.
"""

import numpy as np
import pandas as pd
from matplotlib import dates as mdates
from matplotlib.colors import LinearSegmentedColormap
from matplotlib.patches import Rectangle
from matplotlib.ticker import FixedLocator, FuncFormatter, NullLocator

from . import formato as F
from .anotacoes import etiquetas_finais, texto_sobre
from .figura import legenda
from .tokens import T


# ================================================================ utilidades
def _t(ax):
    return ax._merc["tema"]


def _paleta(t, chaves, cores=None, destaque=None):
    """Mapeia série -> cor. Ordem fixa; com `destaque`, o resto vira contexto."""
    chaves = list(chaves)
    if isinstance(cores, dict):
        return cores
    if cores is not None:
        return dict(zip(chaves, cores))
    if destaque is not None:
        destaque = [destaque] if isinstance(destaque, str) else list(destaque)
        base = list(t.categorica)
        return {c: (base[destaque.index(c)] if c in destaque else t.outros) for c in chaves}
    if len(chaves) > len(t.categorica):
        raise ValueError(f"{len(chaves)} séries > {len(t.categorica)} cores: agrupe em 'Outros' "
                         "ou use painéis.")
    return dict(zip(chaves, t.categorica))


def _y(ax, fmt=None, direita=False, n=5):
    t = _t(ax)
    ax.yaxis.set_major_formatter(FuncFormatter(lambda v, _: (fmt or F.num)(v)))
    ax.yaxis.set_major_locator(__import__("matplotlib.ticker", fromlist=["x"]).MaxNLocator(n))
    if direita:
        ax.yaxis.tick_right()
    ax.spines["bottom"].set_color(t.eixo)
    ax.spines["bottom"].set_linewidth(0.7)


def eixo_tempo(ax, passo="ano", rotulo=None):
    """Eixo de datas em português. passo: 'ano' | 'semestre' | 'trimestre' | 'mes'."""
    if passo == "ano":
        ax.xaxis.set_major_locator(mdates.YearLocator())
        ax.xaxis.set_major_formatter(FuncFormatter(lambda v, _: mdates.num2date(v).strftime("%Y")))
    elif passo == "anos2":
        ax.xaxis.set_major_locator(mdates.YearLocator(2))
        ax.xaxis.set_major_formatter(FuncFormatter(lambda v, _: mdates.num2date(v).strftime("%Y")))
    else:
        meses = {"semestre": 6, "trimestre": 3, "mes": 1}[passo]
        ax.xaxis.set_major_locator(mdates.MonthLocator(bymonth=range(1, 13, meses)))
        ax.xaxis.set_major_formatter(F.eixo_data())
    ax.xaxis.set_minor_locator(NullLocator())


def _zero(ax):
    t = _t(ax)
    lo, hi = ax.get_ylim()
    if lo < 0 < hi:
        ax.axhline(0, color=t.eixo, lw=0.7, zorder=2)


# ================================================================== linhas
def linhas(ax, df, cores=None, destaque=None, log=False, fmt=F.num, fmt_tag=None,
           etiquetas=True, area=False, larguras=None, tracejadas=(), passo="ano",
           mostrar_legenda=None):
    """Séries temporais.

    destaque: série(s) em cor; as demais em cinza de contexto.
    log: escala logarítmica com marcas 1-2-5 (preços de ativos de longo prazo).
    etiquetas: tags com o último valor na borda direita (exige margem_dir≈0.6).
    tracejadas: séries desenhadas tracejadas (projeções, referências).
    """
    t = _t(ax)
    cor = _paleta(t, df.columns, cores, destaque)
    dest = None if destaque is None else ([destaque] if isinstance(destaque, str) else destaque)
    ordem = [c for c in df.columns if dest is None or c not in dest] + (dest or [])
    for c in ordem:
        s = df[c].dropna()
        principal = dest is None or c in dest
        lw = (larguras or {}).get(c, 1.3 if principal else 0.9)
        ax.plot(s.index, s.values, color=cor[c], lw=lw, zorder=4 if principal else 3,
                ls=(0, (3.5, 1.8)) if c in tracejadas else "-")
        if area:
            ax.fill_between(s.index, s.values, ax.get_ylim()[0] if log else 0, color=cor[c],
                            alpha=0.08, lw=0, zorder=1)
    if log:
        ax.set_yscale("log")
        lo, hi = np.nanmin(df.values), np.nanmax(df.values)
        marcas = [m * 10 ** e for e in range(int(np.floor(np.log10(lo))), int(np.ceil(np.log10(hi))) + 1)
                  for m in (1, 2, 5) if lo * 0.8 <= m * 10 ** e <= hi * 1.25]
        ax.yaxis.set_major_locator(FixedLocator(marcas))
        ax.yaxis.set_minor_locator(NullLocator())
        ax.yaxis.set_major_formatter(FuncFormatter(lambda v, _: fmt(v)))
        ax.spines["bottom"].set_color(t.eixo)
    else:
        _y(ax, fmt)
        _zero(ax)
    if isinstance(df.index, pd.DatetimeIndex):
        eixo_tempo(ax, passo)
    ax.set_xlim(df.index[0], df.index[-1])
    if etiquetas:
        etiquetas_finais(ax, df[[c for c in df.columns if dest is None or c in dest]],
                         cor, fmt_tag or fmt)
    if mostrar_legenda or (mostrar_legenda is None and not etiquetas and len(df.columns) > 1):
        legenda(ax, [(c, cor[c], "tracejada" if c in tracejadas else "linha") for c in df.columns])
    return cor


# ========================================================= área empilhada
def area_empilhada(ax, df, cores=None, fmt=F.num, rotulos=True, passo="ano", pos_rotulo=0.80):
    """Composição ao longo do tempo com rótulos dentro das faixas (sem legenda)."""
    t = _t(ax)
    cor = _paleta(t, df.columns, cores)
    x = df.index
    vals = df.fillna(0).to_numpy(float).T
    ax.stackplot(x, vals, colors=[cor[c] for c in df.columns], lw=0.5, edgecolor=t.fundo,
                 zorder=2)
    _y(ax, fmt)
    ax.set_xlim(x[0], x[-1])
    ax.set_ylim(0, vals.sum(0).max() * 1.08)
    if isinstance(x, pd.DatetimeIndex):
        eixo_tempo(ax, passo)
    if rotulos:
        # faixas grossas: rótulo dentro; faixas finas: rótulo fora, à direita (margem_dir≈0.6)
        acum = np.vstack([np.zeros(len(x)), np.cumsum(vals, 0)])
        i = int(len(x) * pos_rotulo)
        fora = []
        for k, c in enumerate(df.columns):
            if acum[k + 1, i] - acum[k, i] >= ax.get_ylim()[1] * 0.07:
                ax.text(x[i], (acum[k, i] + acum[k + 1, i]) / 2, c, ha="center", va="center",
                        fontsize=T["rotulo"], weight="bold", color=texto_sobre(cor[c]), zorder=5)
            else:
                fora.append((c, (acum[k, -1] + acum[k + 1, -1]) / 2))
        if fora:
            fig = ax.figure
            fig.canvas.draw()
            gap = (T["rotulo"] + 2) * fig.dpi / 72
            pix = [[c, ax.transData.transform((0, yv))[1]] for c, yv in fora]
            for k in range(1, len(pix)):
                pix[k][1] = max(pix[k][1], pix[k - 1][1] + gap)
            inv = ax.transAxes.inverted()
            for c, yp in pix:
                ax.annotate(c, (1, inv.transform((0, yp))[1]), xycoords="axes fraction",
                            xytext=(4, 0), textcoords="offset points", va="center",
                            fontsize=T["rotulo"], color=t.texto_2, annotation_clip=False)
    return cor


# ============================================================ barras no tempo
def barras_tempo(ax, s, fmt=F.num, polaridade=True, cor=None, largura=0.8, passo="trimestre"):
    """Barras para séries temporais (fluxos mensais/semanais). Positivo teal, negativo coral."""
    t = _t(ax)
    if isinstance(s.index, pd.DatetimeIndex):
        dias = np.median(np.diff(s.index.values).astype("timedelta64[D]").astype(float))
        w = dias * largura
    else:
        w = largura
    cores = [(t.positivo if v >= 0 else t.negativo) if polaridade else (cor or t.principal)
             for v in s]
    ax.bar(s.index, s.values, width=w, color=cores, zorder=3)
    _y(ax, fmt)
    pad = (s.max() - min(s.min(), 0)) * 0.06
    ax.set_ylim(min(s.min(), 0) - pad, max(s.max(), 0) + pad)
    _zero(ax)
    if isinstance(s.index, pd.DatetimeIndex):
        eixo_tempo(ax, passo)
        meio = pd.Timedelta(days=dias * 0.6)
        ax.set_xlim(s.index[0] - meio, s.index[-1] + meio)


# ============================================================ barras categorias
def barras(ax, df, cores=None, fmt=F.num, rotulos=True, largura=0.72, empilhar=False,
           total=True, projecao_desde=None, mostrar_legenda=True):
    """Colunas por categoria/ano. df com 1 coluna = simples; várias = agrupadas
    (ou empilhadas com empilhar=True, com total no topo)."""
    t = _t(ax)
    if isinstance(df, pd.Series):
        df = df.to_frame()
    cor = _paleta(t, df.columns, cores)
    n, m = df.shape
    x = np.arange(n)
    if empilhar:
        base_pos = np.zeros(n)
        base_neg = np.zeros(n)
        for c in df.columns:
            v = df[c].fillna(0).to_numpy(float)
            b = np.where(v >= 0, base_pos, base_neg)
            ax.bar(x, v, largura, bottom=b, color=cor[c], zorder=3, edgecolor=t.fundo, lw=0.4)
            base_pos += np.where(v >= 0, v, 0)
            base_neg += np.where(v < 0, v, 0)
        topo = base_pos
        if total:
            tot = df.sum(1).to_numpy(float)
            for xi, tp, tv in zip(x, topo, tot):
                ax.annotate(fmt(tv), (xi, tp), xytext=(0, 2.5), textcoords="offset points",
                            ha="center", va="bottom", fontsize=T["rotulo"], weight="bold",
                            color=t.texto, zorder=5)
        hi, lo = topo.max(), base_neg.min()
    else:
        w = largura / m
        for k, c in enumerate(df.columns):
            v = df[c].to_numpy(float)
            xs = x - largura / 2 + w * (k + 0.5)
            ax.bar(xs, v, w * 0.9, color=cor[c], zorder=3)
            if rotulos:
                for xi, vi in zip(xs, v):
                    ax.annotate(fmt(vi), (xi, vi), xytext=(0, 2.5 if vi >= 0 else -2.5),
                                textcoords="offset points", ha="center",
                                va="bottom" if vi >= 0 else "top", fontsize=T["rotulo"] - 0.5,
                                color=t.texto, zorder=5)
        hi, lo = np.nanmax(df.values), min(0, np.nanmin(df.values))
    ax.set_xticks(x, [str(i) for i in df.index])
    ax.tick_params(axis="x", length=0)
    ax.set_xlim(-0.6, n - 0.4)
    ax.set_ylim(lo * 1.12 if lo < 0 else 0, hi * 1.12)
    _y(ax, fmt)
    _zero(ax)
    if projecao_desde is not None:
        i0 = [str(i) for i in df.index].index(str(projecao_desde))
        ax.axvspan(i0 - 0.5, n - 0.4, color=t.sombra, zorder=0, lw=0)
        ax.annotate("Projeção", (i0 - 0.45, 1), xycoords=("data", "axes fraction"),
                    xytext=(2, -3), textcoords="offset points", fontsize=T["anotacao"],
                    color=t.texto_3, va="top", style="italic")
    if mostrar_legenda and m > 1:
        legenda(ax, [(c, cor[c], "barra") for c in df.columns])
    return cor


# ============================================================ barras horizontais
def barras_horizontais(ax, s, fmt=F.num, polaridade=False, destaque=None, ordenar=True,
                       cor=None, sinal=None, referencia=None):
    """Ranking horizontal com valor na ponta. referencia: (valor, rótulo) linha vertical."""
    t = _t(ax)
    s = s.sort_values() if ordenar else s.iloc[::-1]
    y = np.arange(len(s))
    if polaridade:
        cores = [t.positivo if v >= 0 else t.negativo for v in s]
    elif destaque is not None:
        cores = [t.destaque if i in destaque else t.outros for i in s.index]
    else:
        cores = [cor or t.principal] * len(s)
    ax.barh(y, s.values, 0.68, color=cores, zorder=3)
    sinal = polaridade if sinal is None else sinal
    for yi, v in zip(y, s):
        txt = fmt(v, sinal=True) if sinal else fmt(v)
        ax.annotate(txt, (v, yi), xytext=(3 if v >= 0 else -3, 0), textcoords="offset points",
                    ha="left" if v >= 0 else "right", va="center", fontsize=T["rotulo"],
                    color=t.texto, zorder=5,
                    bbox=dict(boxstyle="square,pad=0.08", fc=t.fundo, ec="none"))
    ax.set_yticks(y, list(s.index))
    ax.tick_params(axis="y", labelcolor=t.texto, labelsize=T["rotulo"])
    amp = s.abs().max()
    ax.set_xlim(min(0, s.min()) - (amp * 0.32 if s.min() < 0 else 0), max(0, s.max()) + amp * 0.2)
    ax.set_ylim(-0.6, len(s) - 0.4)
    ax.grid(False)
    ax.axvline(0, color=t.eixo, lw=0.7, zorder=4)
    ax.xaxis.set_visible(False)
    ax.spines["bottom"].set_visible(False)
    if referencia is not None:
        ax.set_ylim(-0.6, len(s) + 0.35)
        ax.axvline(referencia[0], ymax=(len(s) - 0.1 + 0.6) / (len(s) + 0.95), color=t.texto_2,
                   lw=0.7, ls=(0, (2, 1.5)), zorder=2)
        ax.annotate(referencia[1], (referencia[0], len(s) - 0.15), ha="center", va="bottom",
                    fontsize=T["anotacao"], color=t.texto_2)


# ================================================================ dispersão
def dispersao(ax, df, x, y, rotulo=None, tamanho=None, grupo=None, destaque=None,
              regressao=False, fmt_x=F.num, fmt_y=F.num, cores=None, escala_tamanho=600):
    """Dispersão com rótulos diretos (risco × retorno, valuation × crescimento).

    tamanho: coluna para área da bolha. grupo: coluna categórica para cor.
    destaque: rótulos destacados (os demais ficam cinza).
    """
    t = _t(ax)
    d = df.copy()
    if grupo:
        cor = _paleta(t, pd.unique(d[grupo]), cores)
        cs = d[grupo].map(cor)
    elif destaque is not None:
        cs = d[rotulo].map(lambda r: t.destaque if r in destaque else t.outros)
    else:
        cs = pd.Series([t.principal] * len(d), index=d.index)
    if tamanho:
        sz = 18 + escala_tamanho * (d[tamanho] / d[tamanho].max())
    else:
        sz = pd.Series([26] * len(d), index=d.index)
    ordem = d.assign(_s=sz).sort_values("_s", ascending=False).index
    ax.scatter(d.loc[ordem, x], d.loc[ordem, y], s=sz[ordem], c=cs[ordem], alpha=0.9,
               edgecolor=t.fundo, linewidth=0.8, zorder=4)
    if regressao:
        b, a = np.polyfit(d[x], d[y], 1)
        xs = np.linspace(d[x].min(), d[x].max(), 50)
        ax.plot(xs, a + b * xs, color=t.texto_3, lw=0.8, ls=(0, (3, 2)), zorder=3)
        r2 = np.corrcoef(d[x], d[y])[0, 1] ** 2
        ax.annotate(f"R² = {F.num(r2, 2)}", (xs[-1], a + b * xs[-1]), xytext=(3, 0),
                    textcoords="offset points", fontsize=T["anotacao"], color=t.texto_2,
                    va="center", annotation_clip=False)
    if rotulo:
        _rotular_pontos(ax, d, x, y, rotulo, sz)
    ax.xaxis.set_major_formatter(FuncFormatter(lambda v, _: fmt_x(v)))
    ax.yaxis.set_major_formatter(FuncFormatter(lambda v, _: fmt_y(v)))
    ax.grid(True, axis="both")
    ax.spines["bottom"].set_color(t.eixo)
    ax.tick_params(axis="x", length=0)
    _zero(ax)
    lo, hi = ax.get_xlim()
    if lo < 0 < hi:
        ax.axvline(0, color=t.eixo, lw=0.7, zorder=2)
    return cs


def _rotular_pontos(ax, d, x, y, rotulo, sz):
    """Rótulos com escolha gulosa de posição (evita colisão entre rótulos)."""
    t = _t(ax)
    fig = ax.figure
    fig.canvas.draw()
    r = fig.canvas.get_renderer()
    from matplotlib.transforms import Bbox
    bolhas = {}
    for i in d.index:  # as próprias bolhas também ocupam espaço
        cx, cy = ax.transData.transform((d.at[i, x], d.at[i, y]))
        rr = np.sqrt(sz[i]) / 2 * fig.dpi / 72
        bolhas[i] = Bbox([[cx - rr, cy - rr], [cx + rr, cy + rr]])
    ocupados = []
    for i in d.sort_values(y, ascending=False).index:
        px, py = ax.transData.transform((d.at[i, x], d.at[i, y]))
        raio = np.sqrt(sz[i]) / 2 * fig.dpi / 72 + 2
        melhor = None
        for dx, dy, ha, va in [(1, 0, "left", "center"), (-1, 0, "right", "center"),
                               (0, 1, "center", "bottom"), (0, -1, "center", "top"),
                               (0.8, 0.8, "left", "bottom"), (-0.8, 0.8, "right", "bottom"),
                               (0.8, -0.8, "left", "top"), (-0.8, -0.8, "right", "top")]:
            a = ax.annotate(str(d.at[i, rotulo]), (d.at[i, x], d.at[i, y]),
                            xytext=(dx * raio * 72 / fig.dpi, dy * raio * 72 / fig.dpi),
                            textcoords="offset points", ha=ha, va=va, fontsize=T["rotulo"],
                            color=t.texto, zorder=6)
            bb = a.get_window_extent(r).expanded(1.05, 1.1)
            colide = (any(bb.overlaps(o) for o in ocupados)
                      or any(bb.overlaps(b) for k, b in bolhas.items() if k != i))
            dentro = ax.bbox.contains(bb.x0, bb.y0) and ax.bbox.contains(bb.x1, bb.y1)
            if not colide and dentro:
                melhor = a
                ocupados.append(bb)
                break
            a.remove()
        if melhor is None:  # sem posição livre: põe à direita mesmo assim
            a = ax.annotate(str(d.at[i, rotulo]), (d.at[i, x], d.at[i, y]),
                            xytext=(raio * 72 / fig.dpi, 0), textcoords="offset points",
                            ha="left", va="center", fontsize=T["rotulo"], color=t.texto, zorder=6)
            ocupados.append(a.get_window_extent(r))


# ================================================================== cascata
def cascata(ax, inicio, passos, fim, fmt=F.num, largura=0.6, quebra=11):
    """Ponte entre dois totais. inicio=("2025", 942); passos=[("Preço", 481), ...]."""
    import textwrap
    t = _t(ax)
    nivel = inicio[1]
    barras_ = [(0, inicio[1], t.principal, fmt(inicio[1]), True)]
    for _, v in passos:
        barras_.append((nivel if v >= 0 else nivel + v, abs(v),
                        t.positivo if v >= 0 else t.negativo, fmt(v, sinal=True), v >= 0))
        nivel += v
    barras_.append((0, nivel, t.principal, fmt(nivel), True))
    for i, (b, h, c, txt, pos) in enumerate(barras_):
        ax.bar(i, h, largura, bottom=b, color=c, zorder=3)
        ax.annotate(txt, (i, b + h if pos else b), xytext=(0, 2.5 if pos else -2.5),
                    textcoords="offset points", ha="center", va="bottom" if pos else "top",
                    fontsize=T["rotulo"], weight="bold" if i in (0, len(barras_) - 1) else "normal",
                    color=t.texto, zorder=5)
        if i < len(barras_) - 1:
            nivel_i = b + h if pos else b
            ax.plot([i + largura / 2, i + 1 - largura / 2], [nivel_i] * 2, color=t.texto_3,
                    lw=0.5, zorder=2)
    rot = [inicio[0]] + [p[0] for p in passos] + [fim]
    ax.set_xticks(range(len(rot)), ["\n".join(textwrap.wrap(r, quebra)) for r in rot])
    ax.tick_params(axis="x", length=0)
    topo = max(b + h for b, h, *_ in barras_)
    ax.set_ylim(0, topo * 1.1)
    ax.set_xlim(-0.6, len(rot) - 0.4)
    ax.yaxis.set_visible(False)
    ax.grid(False)
    ax.spines["bottom"].set_color(t.eixo)


# ================================================================ leque (FMI)
def leque(ax, historico, projecao, fmt=F.num, nome="Cenário-base", passo="ano", log=False):
    """Fan chart: histórico + bandas de probabilidade.

    projecao: DataFrame com colunas de quantis, p.ex. [0.05, 0.25, 0.5, 0.75, 0.95]
    (simétricas em torno de 0.5). Bandas mais escuras = mais prováveis.
    """
    t = _t(ax)
    qs = sorted(projecao.columns)
    pares = [(qs[i], qs[-1 - i]) for i in range(len(qs) // 2)]
    tons = np.linspace(0.18, 0.45, len(pares))
    for (lo, hi), a in zip(pares, tons):
        ax.fill_between(projecao.index, projecao[lo], projecao[hi], color=t.destaque, alpha=a,
                        lw=0, zorder=2)
    mediana = projecao[0.5] if 0.5 in projecao.columns else projecao[qs[len(qs) // 2]]
    ax.plot(historico.index, historico.values, color=t.principal, lw=1.45, zorder=4)
    ax.plot(mediana.index, mediana.values, color=t.principal, lw=1.2, ls=(0, (3.5, 1.8)), zorder=4)
    x0 = projecao.index[0]
    ax.axvline(x0, color=t.texto_3, lw=0.6, zorder=3)
    ax.annotate("Projeção →", (x0, 1), xycoords=("data", "axes fraction"), xytext=(3, -3),
                textcoords="offset points", fontsize=T["anotacao"], color=t.texto_2, va="top")
    if log:
        ax.set_yscale("log")
        ax.yaxis.set_minor_locator(NullLocator())
        ax.yaxis.set_major_formatter(FuncFormatter(lambda v, _: fmt(v)))
        ax.spines["bottom"].set_color(t.eixo)
    else:
        _y(ax, fmt)
    if isinstance(historico.index, pd.DatetimeIndex):
        eixo_tempo(ax, passo)
    ax.set_xlim(historico.index[0], projecao.index[-1])
    # rótulos das bandas na ponta direita
    xf = projecao.index[-1]
    for (lo, hi) in pares:
        ax.annotate(f"{int(round((hi - lo) * 100))}%", (xf, projecao[hi].iloc[-1]), xytext=(3, 0),
                    textcoords="offset points", fontsize=T["anotacao"], color=t.texto_2,
                    va="center", annotation_clip=False)
    ax.annotate(f"{nome} {fmt(mediana.iloc[-1])}", (xf, mediana.iloc[-1]), xytext=(3, 0),
                textcoords="offset points", fontsize=T["rotulo"], weight="bold", color=t.texto,
                va="center", annotation_clip=False)


# ======================================================= calendário de retornos
def calendario(ax, df, fmt=lambda v: F.pct(v, 0), total="Ano", limite=None):
    """Heatmap ano × mês (retornos mensais). Coluna `total` em negrito, separada."""
    t = _t(ax)
    cols = [c for c in df.columns if c != total]
    vals = df[cols].to_numpy(float)
    lim = limite or np.nanpercentile(np.abs(vals), 95)
    cmap = LinearSegmentedColormap.from_list("div", list(t.divergente))
    nl = len(df)
    for i in range(nl):
        for j, c in enumerate(cols):
            v = vals[i, j]
            if np.isnan(v):
                continue
            cor = cmap(np.clip(0.5 + v / (2 * lim), 0, 1))
            ax.add_patch(Rectangle((j, nl - 1 - i), 1, 1, fc=cor, ec=t.fundo, lw=1.0))
            ax.text(j + 0.5, nl - 0.5 - i, fmt(v), ha="center", va="center",
                    fontsize=T["rotulo"] - 0.5, color=texto_sobre(cor))
        if total in df.columns:
            v = df[total].iloc[i]
            ax.add_patch(Rectangle((len(cols) + 0.25, nl - 1 - i), 1.3, 1, fc=t.sombra,
                                   ec=t.fundo, lw=1.0))
            ax.text(len(cols) + 0.9, nl - 0.5 - i, fmt(v), ha="center", va="center",
                    fontsize=T["rotulo"], weight="bold",
                    color=t.positivo if v >= 0 else t.negativo)
    ncols = len(cols) + (1.55 if total in df.columns else 0)
    ax.set_xlim(0, ncols)
    ax.set_ylim(0, nl)
    xt = list(np.arange(len(cols)) + 0.5) + ([len(cols) + 0.9] if total in df.columns else [])
    ax.set_xticks(xt, cols + ([total] if total in df.columns else []))
    ax.set_yticks(np.arange(nl) + 0.5, [str(r) for r in df.index[::-1]])
    ax.xaxis.tick_top()
    ax.tick_params(axis="both", length=0, labelcolor=t.texto, labelsize=T["rotulo"])
    ax.grid(False)
    for s in ax.spines.values():
        s.set_visible(False)


# ================================================================= halteres
def halteres(ax, df, a, b, fmt=F.num, ordenar=True, nomes=None, fmt_eixo=None):
    """Dumbbell: duas medições por categoria (antes × depois, 2025 × 2026)."""
    t = _t(ax)
    d = df.sort_values(b) if ordenar else df.iloc[::-1]
    y = np.arange(len(d))
    ca, cb = t.outros, t.principal
    for yi, (_, r) in zip(y, d.iterrows()):
        cor_l = t.positivo if r[b] >= r[a] else t.negativo
        ax.plot([r[a], r[b]], [yi, yi], color=cor_l, lw=1.6, alpha=0.55, zorder=2,
                solid_capstyle="round")
    ax.scatter(d[a], y, s=28, color=ca, zorder=3, edgecolor=t.fundo, lw=0.8)
    ax.scatter(d[b], y, s=34, color=cb, zorder=4, edgecolor=t.fundo, lw=0.8)
    for yi, (_, r) in zip(y, d.iterrows()):
        dirb = 1 if r[b] >= r[a] else -1
        ax.annotate(fmt(r[b]), (r[b], yi), xytext=(5 * dirb, 0), textcoords="offset points",
                    ha="left" if dirb > 0 else "right", va="center", fontsize=T["rotulo"],
                    weight="bold", color=t.texto)
    ax.set_yticks(y, list(d.index))
    ax.tick_params(axis="y", labelcolor=t.texto)
    ax.set_ylim(-0.7, len(d) - 0.3)
    lo, hi = min(d[a].min(), d[b].min()), max(d[a].max(), d[b].max())
    ax.set_xlim(lo - (hi - lo) * 0.22, hi + (hi - lo) * 0.12)
    ax.grid(True, axis="x")
    ax.grid(False, axis="y")
    ax.xaxis.set_major_formatter(FuncFormatter(lambda v, _: (fmt_eixo or fmt)(v)))
    ax.tick_params(axis="x", length=0)
    ax.spines["bottom"].set_visible(False)
    nomes = nomes or (a, b)
    legenda(ax, [(nomes[0], ca, "ponto"), (nomes[1], cb, "ponto")])


# ================================================================ intervalos
def intervalos(ax, df, minimo="min", maximo="max", atual="atual", referencia=None,
               fmt=F.num, ordenar=True):
    """Faixa mín–máx por categoria com marcador do valor atual (ex.: 52 semanas,
    faixa de projeções de analistas). referencia: coluna marcada com traço (mediana)."""
    t = _t(ax)
    d = df.sort_values(atual) if ordenar else df.iloc[::-1]
    y = np.arange(len(d))
    ax.barh(y, d[maximo] - d[minimo], left=d[minimo], height=0.32, color=t.grade,
            zorder=2)
    if referencia:
        ax.scatter(d[referencia], y, marker="|", s=90, color=t.texto_2, lw=1.2, zorder=3)
    ax.scatter(d[atual], y, s=30, color=t.destaque, edgecolor=t.fundo, lw=0.8, zorder=4)
    from matplotlib.transforms import blended_transform_factory
    tr = blended_transform_factory(ax.transAxes, ax.transData)
    for yi, (_, r) in zip(y, d.iterrows()):
        ax.annotate(fmt(r[atual]), (1, yi), xycoords=tr, xytext=(6, 0),
                    textcoords="offset points", va="center", ha="left", fontsize=T["rotulo"],
                    weight="bold", color=t.texto, annotation_clip=False)
    ax.set_yticks(y, list(d.index))
    ax.tick_params(axis="y", labelcolor=t.texto)
    ax.set_ylim(-0.7, len(d) - 0.3)
    ax.grid(True, axis="x")
    ax.grid(False, axis="y")
    ax.xaxis.set_major_formatter(FuncFormatter(lambda v, _: fmt(v)))
    ax.tick_params(axis="x", length=0)
    ax.spines["bottom"].set_visible(False)
    itens = [("Atual", t.destaque, "ponto"), ("Faixa mín.–máx.", t.grade, "barra")]
    if referencia:
        itens.insert(1, ("Mediana", t.texto_2, "linha"))
    legenda(ax, itens)


# ================================================================ correlação
def correlacao(ax, m, fmt=lambda v: F.num(v, 2)):
    """Matriz de correlação triangular (sem a diagonal), divergente em torno de 0."""
    t = _t(ax)
    nomes = list(m.columns)
    n = len(nomes)
    cmap = LinearSegmentedColormap.from_list("div", list(t.divergente))
    for i in range(1, n):
        for j in range(i):
            v = m.iloc[i, j]
            cor = cmap(np.clip(0.5 + v / 2, 0, 1))
            ax.add_patch(Rectangle((j, n - 1 - i), 1, 1, fc=cor, ec=t.fundo, lw=1.2))
            ax.text(j + 0.5, n - 0.5 - i, fmt(v), ha="center", va="center",
                    fontsize=T["rotulo"] - 0.3, color=texto_sobre(cor))
    ax.set_xlim(0, n - 1)
    ax.set_ylim(0, n - 0.6)
    ax.set_xticks([])
    for j in range(n - 1):  # nomes das colunas na "escada" da diagonal
        ax.text(j + 0.5, n - 1 - j + 0.08, nomes[j], ha="center", va="bottom",
                fontsize=T["rotulo"], color=t.texto)
    ax.set_yticks(np.arange(n - 1) + 0.5, nomes[1:][::-1])
    ax.tick_params(axis="both", length=0, labelcolor=t.texto)
    ax.grid(False)
    ax.set_aspect("equal")
    for s in ax.spines.values():
        s.set_visible(False)


# ================================================================ barras 100%
def barras_100(ax, df, cores=None, fmt=lambda v: F.pct(v, 0), minimo_rotulo=0.06):
    """Composição percentual por categoria (barras horizontais 100%)."""
    t = _t(ax)
    cor = _paleta(t, df.columns, cores)
    p = df.div(df.sum(1), axis=0)
    y = np.arange(len(p))[::-1]
    esq = np.zeros(len(p))
    for c in p.columns:
        v = p[c].to_numpy(float)
        ax.barh(y, v, 0.62, left=esq, color=cor[c], edgecolor=t.fundo, lw=0.8, zorder=3)
        for yi, l, vi in zip(y, esq, v):
            if vi >= minimo_rotulo:
                ax.text(l + vi / 2, yi, fmt(vi), ha="center", va="center", fontsize=T["rotulo"],
                        color=texto_sobre(cor[c]), zorder=4)
        esq += v
    ax.set_yticks(y, list(p.index))
    ax.tick_params(axis="y", labelcolor=t.texto)
    ax.set_xlim(0, 1)
    ax.set_ylim(-0.6, len(p) - 0.4)
    ax.xaxis.set_visible(False)
    ax.spines["bottom"].set_visible(False)
    ax.grid(False)
    legenda(ax, [(c, cor[c], "barra") for c in p.columns])
