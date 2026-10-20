"""Moldura padrão de figura: título numerado, régua, legenda, fonte e assinatura.

    fig, ax = mc.figura("Oferta de stablecoins por emissor", unidade="US$ bilhões",
                        numero=1, fonte="DefiLlama e Mercurius Research.")
    mc.barras_empilhadas(ax, df)
    mc.salvar(fig, "saida/fig01")
"""

import textwrap
from pathlib import Path

import matplotlib.pyplot as plt
from matplotlib.lines import Line2D
from matplotlib.patches import Rectangle

from .tema import fonte_titulo, usar_tema
from .tokens import LARGURA, TAMANHO

# Faixas fixas em polegadas — é isso que deixa todas as figuras com o mesmo "esqueleto".
_TOPO_TITULO = 0.40
_FAIXA_LEGENDA = 0.24
_MARGEM_X = 0.06
_LINHA_RODAPE = 0.14


def texto_rico(fig, x, y, partes, ha="left", va="baseline", **kw):
    """Escreve trechos com estilos diferentes lado a lado.

    partes = [("Figura 1: ", {"weight": "bold"}), ("Título", {}), (" – US$ bi", {"color": "#777"})]
    """
    r = fig.canvas.get_renderer()
    inv = fig.transFigure.inverted()
    artistas, cx = [], x
    for txt, estilo in partes:
        a = fig.text(cx, y, txt, ha="left", va=va, **{**kw, **estilo})
        bb = a.get_window_extent(renderer=r)
        cx = inv.transform((bb.x1, bb.y0))[0]
        artistas.append(a)
    if ha == "right":
        desloc = cx - x
        for a in artistas:
            a.set_x(a.get_position()[0] - desloc)
    return artistas


def figura(titulo, unidade=None, numero=None, fonte=None, nota=None,
           largura="inteira", altura=2.8, grade=(1, 1), tema="claro",
           legenda=True, assinatura=True, margem_esq=0.42, margem_dir=0.12,
           espaco_h=None, espaco_v=None, topo_extra=0.0, **gs_kw):
    """Cria uma figura no padrão Mercurius e devolve (fig, ax) ou (fig, axes).

    largura: "inteira" | "meia" | "slide" | "social" | polegadas.
    altura: altura TOTAL da figura em polegadas (inclui título e rodapé).
    legenda: reserva a faixa sob o título para a legenda (use mc.legenda/ automático).
    topo_extra: polegadas extras acima do gráfico (ex.: rótulos de coluna no topo).
    """
    t = usar_tema(tema)
    w = LARGURA.get(largura, largura) if isinstance(largura, str) else largura
    fig = plt.figure(figsize=(w, altura))

    # --- rodapé: fonte + notas (quebra automática pela largura) -------------
    chars = int(w * 17.5)
    linhas_rodape = []
    if fonte:
        linhas_rodape += textwrap.wrap(f"Fonte: {fonte}", chars)
    if nota:
        linhas_rodape += textwrap.wrap(f"Nota: {nota}", chars)
    rodape_in = 0.10 + _LINHA_RODAPE * max(len(linhas_rodape), 1)

    topo_in = _TOPO_TITULO + (_FAIXA_LEGENDA if legenda else 0) + 0.10 + topo_extra
    if grade != (1, 1):
        topo_in += 0.18  # espaço para os subtítulos dos painéis
    base_in = rodape_in + 0.38  # espaço para rótulos do eixo x

    gs = fig.add_gridspec(
        *grade,
        left=margem_esq / w, right=1 - margem_dir / w,
        top=1 - topo_in / altura, bottom=base_in / altura,
        wspace=espaco_h, hspace=espaco_v, **gs_kw,
    )
    axes = [[fig.add_subplot(gs[i, j]) for j in range(grade[1])] for i in range(grade[0])]

    # --- cabeçalho ---------------------------------------------------------
    x0 = _MARGEM_X / w
    y_tit = 1 - 0.20 / altura
    partes = []
    if numero is not None:
        partes.append((f"Figura {numero}: ", {"weight": "bold", "color": t.texto}))
    partes.append((titulo, {"color": t.texto, "weight": "medium"}))
    if unidade:
        partes.append((f"  –  {unidade}", {"color": t.texto_3}))
    texto_rico(fig, x0, y_tit, partes, fontsize=TAMANHO["titulo_figura"],
               family=fonte_titulo())

    y_regua = 1 - (_TOPO_TITULO - 0.06) / altura
    fig.add_artist(Line2D([x0, 1 - x0], [y_regua, y_regua], transform=fig.transFigure,
                          color=t.linha_fina, lw=0.8))
    fig.add_artist(Line2D([x0, x0 + 0.42 / w], [y_regua, y_regua], transform=fig.transFigure,
                          color=t.destaque, lw=2.2, solid_capstyle="butt"))

    # --- rodapé ------------------------------------------------------------
    y = 0.10 / altura
    for linha in reversed(linhas_rodape):
        fig.text(x0, y, linha, fontsize=TAMANHO["fonte"], color=t.texto_3, va="bottom")
        y += _LINHA_RODAPE / altura
    if assinatura:
        texto_rico(fig, 1 - x0, 0.10 / altura,
                   [("MERCURIUS", {"weight": "bold", "color": t.texto}),
                    ("  RESEARCH", {"color": t.texto_3})],
                   ha="right", va="bottom", fontsize=TAMANHO["assinatura"],
                   family=fonte_titulo())

    fig._merc = {"tema": t, "legenda_y": 1 - (_TOPO_TITULO + 0.04) / altura,
                 "x0": x0, "legenda": legenda, "largura": w, "altura": altura}

    if grade == (1, 1):
        return fig, axes[0][0]
    if grade[0] == 1:
        return fig, axes[0]
    return fig, axes


def legenda(fig, itens, ncol=None):
    """Legenda na faixa sob o título. itens = [(rótulo, cor, 'barra'|'linha'|'ponto'), ...]"""
    m = getattr(fig, "_merc", None)
    if not m or not m["legenda"]:
        return
    t = m["tema"]
    alcas = []
    for rotulo, cor, tipo in itens:
        if tipo == "linha":
            alcas.append(Line2D([], [], color=cor, lw=2, label=rotulo))
        elif tipo == "tracejada":
            alcas.append(Line2D([], [], color=cor, lw=1.6, ls=(0, (3, 2)), label=rotulo))
        elif tipo == "ponto":
            alcas.append(Line2D([], [], color=cor, lw=0, marker="o", ms=6,
                                markeredgecolor=t.fundo, label=rotulo))
        else:
            alcas.append(Rectangle((0, 0), 1, 1, facecolor=cor, label=rotulo))
    fig.legend(handles=alcas, loc="upper left", bbox_to_anchor=(m["x0"] - 0.006, m["legenda_y"]),
               bbox_transform=fig.transFigure, ncol=ncol or len(alcas),
               handlelength=1.0, handleheight=0.8, handletextpad=0.45,
               columnspacing=1.3, borderaxespad=0, borderpad=0.1,
               fontsize=TAMANHO["legenda"], labelcolor=t.texto_2)


def subtitulo(ax, texto, direita=None):
    """Título pequeno de painel (small multiples): 'Microsoft' ........ '40 GW'."""
    t = ax.figure._merc["tema"]
    ax.text(0, 1.06, texto, transform=ax.transAxes, fontsize=TAMANHO["rotulo"],
            weight="bold", color=t.texto, ha="left", va="bottom")
    if direita:
        ax.text(1, 1.06, direita, transform=ax.transAxes, fontsize=TAMANHO["rotulo"],
                weight="bold", color=t.texto_2, ha="right", va="bottom")


def salvar(fig, caminho, formatos=("png", "svg"), dpi=300):
    """Salva PNG (300 dpi, para Word/PDF) e SVG (texto editável, para Figma)."""
    caminho = Path(caminho)
    caminho.parent.mkdir(parents=True, exist_ok=True)
    for f in formatos:
        fig.savefig(caminho.with_suffix(f".{f}"), dpi=dpi)
    plt.close(fig)
    return caminho
