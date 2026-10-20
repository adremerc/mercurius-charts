"""Camada de anotação: é aqui que um gráfico deixa de ser 'plot' e vira 'exhibit'.

    mc.periodo(ax, "2021-11", "2022-11", "Bear market")
    mc.evento(ax, "2024-04-20", "Halving")
    mc.etiquetas_finais(ax, df, fmt=F.num)      # tags com o último valor na borda direita
    mc.destacar(ax, x, y, "Máxima: US$ 124 mil")
    mc.caixa(ax, [("+38%", "retorno no ano"), ("1,9x", "vs. Nasdaq")])
"""

import numpy as np
import pandas as pd
from matplotlib.colors import to_rgb
from matplotlib.patches import FancyBboxPatch
from matplotlib.transforms import ScaledTranslation, blended_transform_factory

from .tokens import T


def _t(ax):
    return ax._merc["tema"]


def _x(ax, x):
    if isinstance(x, str):
        x = pd.Timestamp(x)
    return ax.xaxis.convert_units(x) if not isinstance(x, (int, float, np.number)) else x


def texto_sobre(cor):
    r, g, b = [c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4 for c in to_rgb(cor)]
    return "#0e1a24" if 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.4 else "#ffffff"


def periodo(ax, inicio, fim, texto=None, cor=None):
    """Faixa sombreada (recessão, bear market, janela de evento) com rótulo no topo."""
    t = _t(ax)
    a, b = _x(ax, inicio), _x(ax, fim)
    ax.axvspan(a, b, color=cor or t.sombra, lw=0, zorder=0)
    if texto:
        tr = blended_transform_factory(ax.transData, ax.transAxes)
        ax.text((a + b) / 2, 0.985, texto, transform=tr, ha="center", va="top",
                fontsize=T["anotacao"], color=t.texto_3, zorder=6)


def evento(ax, x, texto, y=0.02, lado="direita"):
    """Linha vertical fina + rótulo (halving, aprovação de ETF, decisão do Fed)."""
    t = _t(ax)
    xv = _x(ax, x)
    ax.axvline(xv, color=t.texto_3, lw=0.6, ls=(0, (2, 1.5)), zorder=1)
    tr = blended_transform_factory(ax.transData, ax.transAxes)
    dx = 2.5 if lado == "direita" else -2.5
    ax.text(xv, y, texto, transform=tr + ScaledTranslation(dx / 72, 0, ax.figure.dpi_scale_trans),
            ha="left" if lado == "direita" else "right", va="bottom" if y < 0.5 else "top",
            fontsize=T["anotacao"], color=t.texto_2, zorder=6)


def linha_ref(ax, y, texto=None, lado="esquerda"):
    """Linha horizontal de referência (meta, média histórica, zero)."""
    t = _t(ax)
    ax.axhline(y, color=t.eixo, lw=0.6, ls=(0, (2, 1.5)), zorder=1)
    if texto:
        tr = blended_transform_factory(ax.transAxes, ax.transData)
        ax.text(0.005 if lado == "esquerda" else 0.995, y, texto, transform=tr,
                ha="left" if lado == "esquerda" else "right", va="bottom",
                fontsize=T["anotacao"], color=t.texto_2,
                bbox=dict(boxstyle="square,pad=0.1", fc=t.fundo, ec="none"))


def etiquetas_finais(ax, df, cores, fmt, nomes=True, borda=True):
    """Tags coloridas com o último valor de cada série, fora do eixo à direita
    (estilo terminal/JPM). Requer margem_dir ≈ 0.55–0.8 na figura."""
    t = _t(ax)
    fig = ax.figure
    fig.canvas.draw()
    itens = []
    for c in df.columns:
        s = df[c].dropna()
        if s.empty:
            continue
        yv = s.iloc[-1]
        ypix = ax.transData.transform((ax.xaxis.convert_units(s.index[-1]), yv))[1]
        itens.append([c, yv, ypix])
    itens.sort(key=lambda i: i[2])
    gap = (T["rotulo"] + 4.5) * fig.dpi / 72
    for k in range(1, len(itens)):
        itens[k][2] = max(itens[k][2], itens[k - 1][2] + gap)
    lo, hi = ax.transAxes.transform((0, 0))[1], ax.transAxes.transform((0, 1))[1]
    if itens and itens[-1][2] > hi:
        desloc = itens[-1][2] - hi
        for i in itens:
            i[2] -= desloc
    inv = ax.transAxes.inverted()
    r = fig.canvas.get_renderer()
    for c, yv, ypix in itens:
        ya = inv.transform((0, ypix))[1]
        cor = cores[c]
        tag = ax.annotate(fmt(yv), (1, ya), xycoords="axes fraction", xytext=(5, 0),
                          textcoords="offset points", va="center", ha="left",
                          fontsize=T["rotulo"], weight="bold", color=texto_sobre(cor),
                          bbox=dict(boxstyle="square,pad=0.25", fc=cor, ec="none"),
                          annotation_clip=False, zorder=7)
        if nomes:
            w_pts = tag.get_window_extent(r).width * 72 / fig.dpi
            ax.annotate(c, (1, ya), xycoords="axes fraction", xytext=(5 + w_pts + 4, 0),
                        textcoords="offset points", va="center", ha="left",
                        fontsize=T["rotulo"], color=t.texto_2, annotation_clip=False)


def destacar(ax, x, y, texto, dx=-30, dy=18, cor=None, ha=None):
    """Ponto + texto com linha de chamada (máxima, mínima, nível relevante)."""
    t = _t(ax)
    cor = cor or t.texto
    xv = _x(ax, x)
    ax.scatter([xv], [y], s=16, color=cor, edgecolor=t.fundo, linewidth=1.0, zorder=8)
    ax.annotate(texto, (xv, y), xytext=(dx, dy), textcoords="offset points",
                fontsize=T["anotacao"], color=t.texto, ha=ha or ("right" if dx < 0 else "left"),
                va="center", zorder=8,
                arrowprops=dict(arrowstyle="-", color=t.texto_3, lw=0.6,
                                shrinkA=1.5, shrinkB=2.5),
                bbox=dict(boxstyle="square,pad=0.15", fc=t.fundo, ec="none", alpha=0.9))


def caixa(ax, itens, x=0.02, y=0.96, largura=None):
    """Caixa de estatísticas (JPM Guide to the Markets).
    itens = [("+38%", "retorno no ano"), ("1,9x", "vs. Nasdaq")]"""
    t = _t(ax)
    fig = ax.figure
    linhas = len(itens)
    h_pt = 6 + linhas * 19
    w_pt = largura or 110
    bb = ax.get_window_extent()
    w_ax = w_pt * fig.dpi / 72 / bb.width
    h_ax = h_pt * fig.dpi / 72 / bb.height
    ax.add_patch(FancyBboxPatch((x, y - h_ax), w_ax, h_ax, transform=ax.transAxes,
                                boxstyle="square,pad=0", fc=t.sombra, ec="none", zorder=6,
                                clip_on=False))
    ax.add_patch(FancyBboxPatch((x, y - h_ax), 2.0 * fig.dpi / 72 / bb.width, h_ax,
                                transform=ax.transAxes, boxstyle="square,pad=0",
                                fc=t.destaque, ec="none", zorder=7, clip_on=False))
    for k, (valor, desc) in enumerate(itens):
        yy = y - (5 + 19 * k + 9) * fig.dpi / 72 / bb.height
        ax.text(x + 8 * fig.dpi / 72 / bb.width, yy, valor, transform=ax.transAxes,
                fontsize=9.5, weight="bold", color=t.texto, va="center", zorder=8)
        ax.text(x + 52 * fig.dpi / 72 / bb.width, yy, desc, transform=ax.transAxes,
                fontsize=T["anotacao"], color=t.texto_2, va="center", zorder=8)
