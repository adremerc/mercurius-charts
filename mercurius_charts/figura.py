"""Moldura de figura ("exhibit") Mercurius.

Anatomia (de cima para baixo):
    ─────────────────────────────  régua navy
    FIGURA 3                       eyebrow em teal
    Título que conta a conclusão   negrito
    Unidade, período, recorte      cinza
    [1. Painel  (unidade)]         painéis numerados no estilo FMI
    [legenda compacta]
    ┌ gráfico ┐
    ─────────────────────────────  filete
    Fonte: ...            MERCURIUS RESEARCH

Todo o layout é calculado em polegadas, então figuras de tamanhos diferentes
mantêm exatamente as mesmas distâncias entre os elementos.
"""

import textwrap
from pathlib import Path

import matplotlib.pyplot as plt
from matplotlib.lines import Line2D
from matplotlib.patches import Rectangle

from .tema import usar_tema
from .tokens import LARGURA, T

_PT = 1 / 72


def figura(titulo, subtitulo=None, numero=None, fonte=None, nota=None,
           largura="inteira", altura=3.3, paineis=(1, 1), titulos_paineis=None,
           numerar_paineis=True, legenda=False, tema="claro",
           margem_esq=0.40, margem_dir=0.10, espaco_col=0.30, espaco_lin=0.30,
           eixo_x=True, assinatura=True):
    """Cria a figura e devolve (fig, ax) ou (fig, [axes]).

    titulo: a CONCLUSÃO ("Fluxos para ETFs voltaram a acelerar"), não o assunto.
    subtitulo: unidade e recorte ("US$ bilhões, semanal, jan/24–set/26").
    titulos_paineis: [("Fluxo mensal", "US$ bilhões"), ...] — um por painel.
    legenda: reserva uma faixa sobre cada painel para mc.legenda(ax, ...).
    margem_dir: aumente (≈0.6) quando usar mc.etiquetas_finais.
    """
    t = usar_tema(tema)
    W = LARGURA.get(largura, largura) if isinstance(largura, str) else float(largura)
    H = float(altura)
    fig = plt.figure(figsize=(W, H))
    x0 = 0.0

    def fx(pol):
        return pol / W

    def fy(pol_do_topo):
        return 1 - pol_do_topo / H

    # ---------------- cabeçalho
    fig.add_artist(Line2D([0, 1], [fy(0.02)] * 2, transform=fig.transFigure,
                          color=t.regua, lw=1.6, solid_capstyle="butt"))
    y = 0.20
    if numero is not None:
        fig.text(fx(x0), fy(y), f"FIGURA {numero}", fontsize=T["eyebrow"], weight="bold",
                 color=t.destaque, va="baseline")
        y += 0.19
    linhas_tit = textwrap.wrap(titulo, int(W * 11.5))
    for lt in linhas_tit:
        fig.text(fx(x0), fy(y), lt, fontsize=T["titulo"], weight="bold", color=t.texto,
                 va="baseline")
        y += 0.17
    if subtitulo:
        y += 0.01
        fig.text(fx(x0), fy(y), subtitulo, fontsize=T["subtitulo"], color=t.texto_2, va="baseline")
        y += 0.06
    topo_conteudo = y + 0.16

    # ---------------- rodapé
    chars = int(W * 21)
    rod = []
    if nota:
        rod += textwrap.wrap(f"Nota: {nota}", chars)
    if fonte:
        rod += textwrap.wrap(f"Fonte: {fonte}", chars)
    h_rod = 0.06 + 0.105 * max(len(rod), 1)
    yb = 0.06
    for linha in reversed(rod):
        fig.text(fx(x0), yb / H, linha, fontsize=T["fonte"], color=t.texto_3, va="bottom")
        yb += 0.105
    fig.add_artist(Line2D([0, 1], [(h_rod + 0.04) / H] * 2, transform=fig.transFigure,
                          color=t.grade, lw=0.6))
    if assinatura:
        fig.text(1, 0.06 / H, "MERCURIUS", fontsize=T["fonte"], weight="bold",
                 color=t.texto, ha="right", va="bottom")
    base_conteudo = h_rod + 0.10 + (0.22 if eixo_x else 0.05)

    # ---------------- painéis (posições manuais, em polegadas)
    nl, nc = paineis
    h_titulo_painel = 0.30 if titulos_paineis else 0.0
    h_leg = 0.17 if legenda else 0.0
    cab = h_titulo_painel + h_leg
    area_w = W - margem_esq - margem_dir
    area_h = H - topo_conteudo - base_conteudo
    pw = (area_w - (nc - 1) * (espaco_col + margem_esq)) / nc
    ph = (area_h - nl * cab - (nl - 1) * espaco_lin) / nl
    axes = []
    k = 0
    for i in range(nl):
        for j in range(nc):
            left = margem_esq + j * (pw + espaco_col + margem_esq)
            top = topo_conteudo + i * (ph + cab + espaco_lin) + cab
            ax = fig.add_axes([fx(left), fy(top + ph), pw / W, ph / H])
            ax._merc = {"tema": t, "h_leg": h_leg}
            if titulos_paineis and k < len(titulos_paineis):
                tp = titulos_paineis[k]
                nome, unid = (tp, None) if isinstance(tp, str) else tp
                prefixo = f"{k + 1}. " if numerar_paineis and nl * nc > 1 else ""
                ax.annotate(prefixo + nome, (0, 1), xycoords="axes fraction",
                            xytext=(-margem_esq * 72 + 0.5, (h_leg + 0.15) * 72),
                            textcoords="offset points", fontsize=T["painel"], weight="bold",
                            color=t.texto, va="bottom", ha="left", annotation_clip=False)
                if unid:
                    ax.annotate(unid, (0, 1), xycoords="axes fraction",
                                xytext=(-margem_esq * 72 + 0.5, (h_leg + 0.02) * 72),
                                textcoords="offset points", fontsize=T["painel_unidade"],
                                style="italic", color=t.texto_2, va="bottom", ha="left",
                                annotation_clip=False)
            axes.append(ax)
            k += 1
    fig._merc = {"tema": t, "W": W, "H": H, "margem_esq": margem_esq}
    return (fig, axes[0]) if len(axes) == 1 else (fig, axes)


def legenda(ax, itens, ncol=None, x=None):
    """Legenda compacta sobre o painel. itens = [(rótulo, cor, tipo)], tipo em
    'linha' | 'tracejada' | 'barra' | 'ponto' | 'area'."""
    t = ax._merc["tema"]
    W = ax.figure._merc["W"]
    me = ax.figure._merc["margem_esq"]
    alcas = []
    for rot, cor, tipo in itens:
        if tipo == "linha":
            alcas.append(Line2D([], [], color=cor, lw=1.6, label=rot))
        elif tipo == "tracejada":
            alcas.append(Line2D([], [], color=cor, lw=1.2, ls=(0, (3, 1.6)), label=rot))
        elif tipo == "ponto":
            alcas.append(Line2D([], [], color=cor, lw=0, marker="o", ms=4.5, label=rot))
        else:
            alcas.append(Rectangle((0, 0), 1, 1, facecolor=cor, label=rot))
    bb = ax.get_position()
    xa = x if x is not None else -me / (bb.width * W)
    ax.legend(handles=alcas, loc="lower left", bbox_to_anchor=(xa, 1.0), ncol=ncol or len(alcas),
              handlelength=1.3, handleheight=0.65, handletextpad=0.4, columnspacing=1.2,
              borderaxespad=0.15, borderpad=0, fontsize=T["legenda"], labelcolor=t.texto_2,
              frameon=False)


def salvar(fig, caminho, formatos=("png", "svg"), dpi=300):
    """PNG 300 dpi (documentos) + SVG com texto editável (Figma/Illustrator)."""
    caminho = Path(caminho)
    caminho.parent.mkdir(parents=True, exist_ok=True)
    for f in formatos:
        fig.savefig(caminho.with_suffix(f".{f}"), dpi=dpi)
    plt.close(fig)
    return caminho
