"""Tipos de gráfico no padrão Mercurius.

Cada função recebe um `ax` criado por `mc.figura(...)` e os dados (pandas).
Regras embutidas: cores na ordem fixa do tema, rótulos diretos em vez de grade
pesada, um único eixo y (nada de eixo duplo), texto sempre em cor de texto.
"""

import textwrap

import numpy as np
import pandas as pd
from matplotlib.colors import LinearSegmentedColormap, to_rgb
from matplotlib.patches import FancyBboxPatch, Rectangle

from . import formato as F
from .figura import legenda as _legenda
from .figura import subtitulo
from .tema import fonte_titulo, tema_atual
from .tokens import TAMANHO


# ---------------------------------------------------------------- utilidades
def _t(ax):
    return getattr(ax.figure, "_merc", {}).get("tema") or tema_atual()


def _cores(t, n, cores=None):
    if cores is not None:
        return list(cores)
    if n > len(t.categorica):
        raise ValueError(
            f"{n} séries > {len(t.categorica)} cores. Agrupe as menores em 'Outros' "
            "(use t.outros) ou divida em small multiples.")
    return list(t.categorica[:n])


def _luminancia(cor):
    r, g, b = [c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4 for c in to_rgb(cor)]
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def _texto_sobre(cor, t):
    return "#0e1318" if _luminancia(cor) > 0.35 else "#ffffff"


def _eixo_limpo(ax, y=True, grade=True):
    t = _t(ax)
    ax.spines["bottom"].set_color(t.linha_fina)
    if grade and y:
        ax.yaxis.grid(True, color=t.linha_fina, lw=0.6)
    if not y:
        ax.yaxis.set_visible(False)
    ax.tick_params(axis="x", colors=t.texto_2)


def _marcar_projecao(ax, x_inicio, n, rotulo="Projeção"):
    t = _t(ax)
    ax.axvspan(x_inicio - 0.5, n - 0.5, color=t.faixa_tabela, zorder=0, lw=0)
    ax.text(x_inicio - 0.4, 1.0, rotulo, transform=ax.get_xaxis_transform(),
            fontsize=TAMANHO["rotulo"] - 0.5, color=t.texto_3, va="top", ha="left",
            style="italic")


# ---------------------------------------------------------- barras empilhadas
def barras_empilhadas(ax, df, cores=None, total=True, fmt=F.num, largura=0.7,
                      projecao_desde=None, eixo_y=True, rotacao=None, legenda=True,
                      total_minimo=None):
    """Colunas empilhadas. df: índice = eixo x (anos), colunas = séries.

    projecao_desde: rótulo do índice a partir do qual os valores são estimativas
    (pinta uma faixa de fundo discreta com 'Projeção').
    total_minimo: só rotula totais >= esse valor (evita poluir anos pequenos).
    """
    t = _t(ax)
    cores = _cores(t, df.shape[1], cores)
    x = np.arange(len(df))
    base = np.zeros(len(df))
    for col, cor in zip(df.columns, cores):
        v = df[col].fillna(0).to_numpy(float)
        ax.bar(x, v, largura, bottom=base, color=cor, edgecolor=t.fundo, lw=0.6, zorder=2)
        base += v
    if total:
        for xi, tot in zip(x, base):
            if total_minimo is None or tot >= total_minimo:
                ax.text(xi, tot, fmt(tot), ha="center", va="bottom", fontsize=TAMANHO["rotulo_total"],
                        color=t.texto, weight="medium", zorder=3,
                        transform=ax.transData + _desloc_pts(ax, 0, 2.5))
    ax.set_xticks(x, [str(i) for i in df.index], rotation=rotacao if rotacao is not None
                  else (90 if len(df) > 14 else 0))
    ax.set_xlim(-0.6, len(df) - 0.4)
    ax.set_ylim(0, base.max() * 1.12)
    ax.yaxis.set_major_formatter(F.eixo_num())
    if projecao_desde is not None:
        _marcar_projecao(ax, list(map(str, df.index)).index(str(projecao_desde)), len(df))
    _eixo_limpo(ax, y=eixo_y)
    if legenda:
        _legenda(ax.figure, [(c, cor, "barra") for c, cor in zip(df.columns, cores)])
    return ax


def _desloc_pts(ax, dx, dy):
    from matplotlib.transforms import ScaledTranslation
    return ScaledTranslation(dx / 72, dy / 72, ax.figure.dpi_scale_trans)


# ------------------------------------------------------------------ cascata
def cascata(ax, inicio, passos, fim, fmt=F.num, quebra=12, largura=0.62):
    """Gráfico de cascata (waterfall), estilo ponte de valores.

    inicio = ("Capex 2026e", 942)
    passos = [("Mais GW (volume)", 481), ("Restrição de energia", -319), ...]
    fim    = "Capex 2030e"  (valor calculado)
    """
    t = _t(ax)
    rot = [inicio[0]] + [p[0] for p in passos] + [fim]
    nivel = inicio[1]
    barras = [(0, inicio[1], t.principal, fmt(inicio[1]))]
    for _, v in passos:
        b = nivel if v >= 0 else nivel + v
        barras.append((b, abs(v), t.positivo if v >= 0 else t.negativo, fmt(v, sinal=True)))
        nivel += v
    barras.append((0, nivel, t.principal, fmt(nivel)))

    topo = max(b + h for b, h, *_ in barras)
    for i, (b, h, cor, txt) in enumerate(barras):
        ax.bar(i, h, largura, bottom=b, color=cor, zorder=2)
        negativo = cor == t.negativo
        y = b if negativo else b + h
        ax.text(i, y, txt, ha="center", va="top" if negativo else "bottom",
                fontsize=TAMANHO["rotulo"], color=t.texto, zorder=3,
                transform=ax.transData + _desloc_pts(ax, 0, -3 if negativo else 3))
        if i < len(barras) - 1:
            conec = b + h if (i == 0 or not negativo) else b
            ax.plot([i + largura / 2, i + 1 - largura / 2], [conec, conec],
                    color=t.texto_3, lw=0.7, ls=(0, (2, 2)), zorder=1)
    ax.set_xticks(range(len(rot)), ["\n".join(textwrap.wrap(r, quebra)) for r in rot])
    ax.set_ylim(min(0, min(b for b, *_ in barras)) , topo * 1.12)
    ax.set_xlim(-0.6, len(rot) - 0.4)
    _eixo_limpo(ax, y=False)
    return ax


# -------------------------------------------------------- barras + linha
def barras_com_linha(ax, barras, linha, nome_barras, nome_linha, fmt=F.num,
                     fmt_linha=None, linha_tracejada=True):
    """Colunas + linha de referência NO MESMO EIXO (ex.: receita vs. necessária).

    Se as duas medidas têm escalas diferentes, NÃO use esta função — faça dois
    gráficos lado a lado (grade=(1, 2)). Eixo duplo é proibido no padrão.
    """
    t = _t(ax)
    fmt_linha = fmt_linha or fmt
    x = np.arange(len(barras))
    ax.bar(x, barras.to_numpy(float), 0.62, color=t.destaque, zorder=2)
    for xi, v in zip(x, barras):
        ax.text(xi, v, fmt(v), ha="center", va="bottom", fontsize=TAMANHO["rotulo"],
                color=t.texto, transform=ax.transData + _desloc_pts(ax, 0, 3), zorder=4)
    ax.plot(x, linha.to_numpy(float), color=t.principal, lw=1.8,
            ls=(0, (4, 2.5)) if linha_tracejada else "-", zorder=3)
    ax.scatter(x, linha, s=26, color=t.principal, edgecolor=t.fundo, linewidth=1.5, zorder=4)
    for xi, v in zip(x, linha):
        ax.text(xi, v, fmt_linha(v), ha="center", va="top", fontsize=TAMANHO["rotulo"] - 0.5,
                color=t.texto_2, transform=ax.transData + _desloc_pts(ax, 0, -5), zorder=4,
                bbox=dict(boxstyle="round,pad=0.18", fc=t.fundo, ec="none", alpha=0.85))
    ax.set_xticks(x, [str(i) for i in barras.index])
    ax.set_ylim(0, max(barras.max(), linha.max()) * 1.18)
    ax.yaxis.set_major_formatter(F.eixo_num())
    _eixo_limpo(ax)
    _legenda(ax.figure, [(nome_barras, t.destaque, "barra"),
                         (nome_linha, t.principal, "tracejada" if linha_tracejada else "linha")])
    return ax


# ------------------------------------------------------------------ linhas
def linhas(ax, df, destaque=None, cores=None, fmt=F.num, rotulo_final=True,
           area=False, eixo_fmt=None, base=None, legenda=True):
    """Séries temporais. df: índice = datas, colunas = séries.

    destaque: nome(s) de coluna(s) a destacar; as demais ficam em cinza de contexto.
    rotulo_final: escreve o último valor + nome no fim de cada linha.
    base: desenha linha de referência horizontal (ex.: 100 para índice).
    """
    t = _t(ax)
    cols = list(df.columns)
    if destaque is not None:
        destaque = [destaque] if isinstance(destaque, str) else list(destaque)
        paleta = _cores(t, len(destaque), cores)
        cor_de = {c: (paleta[destaque.index(c)] if c in destaque else t.outros) for c in cols}
    else:
        cor_de = dict(zip(cols, _cores(t, len(cols), cores)))
    ordem = sorted(cols, key=lambda c: destaque is not None and c in destaque)  # destaque por cima
    for c in ordem:
        s = df[c].dropna()
        principal = destaque is None or c in destaque
        ax.plot(s.index, s.values, color=cor_de[c], lw=1.7 if principal else 1.1,
                zorder=3 if principal else 2)
        if area:
            ax.fill_between(s.index, s.values, color=cor_de[c], alpha=0.10, lw=0, zorder=1)
    if base is not None:
        ax.axhline(base, color=t.texto_3, lw=0.8, ls=(0, (2, 2)), zorder=1)
    if rotulo_final:
        _rotulos_finais(ax, df, cor_de, fmt)
    if eixo_fmt is not None:
        ax.yaxis.set_major_formatter(eixo_fmt)
    else:
        ax.yaxis.set_major_formatter(F.eixo_num())
    ax.margins(x=0.01)
    _eixo_limpo(ax)
    if legenda and len(cols) > 1:
        itens = [(c, cor_de[c], "linha") for c in (cols if destaque is None else destaque)]
        if destaque is not None and len(destaque) < len(cols):
            itens.append(("Demais (rótulo no fim da linha)", t.outros, "linha"))
        _legenda(ax.figure, itens)
    return ax


def _rotulos_finais(ax, df, cor_de, fmt):
    t = _t(ax)
    fig = ax.figure
    fig.canvas.draw()
    ultimos = [(c, df[c].dropna().index[-1], df[c].dropna().iloc[-1]) for c in df.columns]
    # repulsão vertical simples em pixels para não sobrepor rótulos
    pix = [(c, x, v, ax.transData.transform((ax.xaxis.convert_units(x), v))[1]) for c, x, v in ultimos]
    pix.sort(key=lambda p: p[3])
    min_gap = TAMANHO["rotulo"] * 1.35 * fig.dpi / 72
    ys = [p[3] for p in pix]
    for i in range(1, len(ys)):
        ys[i] = max(ys[i], ys[i - 1] + min_gap)
    inv = ax.transData.inverted()
    for (c, x, v, _), yp in zip(pix, ys):
        xp = ax.transData.transform((ax.xaxis.convert_units(x), v))[0]
        ax.scatter([x], [v], s=22, color=cor_de[c], edgecolor=t.fundo, linewidth=1.5, zorder=5)
        _, yd = inv.transform((xp, yp))
        ax.annotate(f"{c} {fmt(v)}", (x, yd), xytext=(7, 0), textcoords="offset points",
                    va="center", ha="left", fontsize=TAMANHO["rotulo"], color=t.texto,
                    annotation_clip=False)


# --------------------------------------------------------- barras horizontais
def barras_horizontais(ax, serie, fmt=F.num, polaridade=False, destaque=None,
                       ordenar=True, cor=None):
    """Ranking horizontal. polaridade=True pinta positivo/negativo (teal/coral).

    destaque: lista de rótulos pintados com a cor de destaque (o resto em cinza).
    """
    t = _t(ax)
    s = serie.sort_values() if ordenar else serie.iloc[::-1]
    y = np.arange(len(s))
    if polaridade:
        cores = [t.positivo if v >= 0 else t.negativo for v in s]
    elif destaque is not None:
        cores = [t.destaque if i in destaque else t.outros for i in s.index]
    else:
        cores = [cor or t.principal] * len(s)
    ax.barh(y, s.to_numpy(float), 0.66, color=cores, zorder=2)
    amp = s.abs().max()
    for yi, v in zip(y, s):
        ax.text(v, yi, fmt(v, sinal=polaridade) if fmt in (F.num, F.pct) else fmt(v),
                va="center", ha="left" if v >= 0 else "right", fontsize=TAMANHO["rotulo"],
                color=t.texto, transform=ax.transData + _desloc_pts(ax, 4 if v >= 0 else -4, 0))
    ax.set_yticks(y, list(s.index))
    ax.tick_params(axis="y", colors=t.texto, labelsize=TAMANHO["rotulo"])
    lo = min(0, s.min()) - (amp * 0.32 if s.min() < 0 else 0)
    ax.set_xlim(lo, max(0, s.max()) + amp * 0.18)
    ax.axvline(0, color=t.texto_3, lw=0.8, zorder=3)
    ax.xaxis.set_visible(False)
    ax.spines["bottom"].set_visible(False)
    return ax


# --------------------------------------------------------- small multiples
def multiplos_area(axes, dados, cores=None, valor_painel=None, rotulos_x=None,
                   nomes_series=None, legenda=True):
    """Painéis pequenos, um por entidade, cada um com escala própria.

    dados: dict {nome_painel: DataFrame} — cada DF com 1 ou 2 colunas (ex.:
    'Planejada' e 'Entregue'). As áreas são sobrepostas (a 2ª por cima).
    valor_painel: dict {nome_painel: '40 GW'} escrito no canto direito.
    """
    axes = np.ravel(axes)
    t = _t(axes[0])
    n_series = max(d.shape[1] for d in dados.values())
    cores = cores or [t.destaque, t.principal][:n_series]
    for ax, (nome, d) in zip(axes, dados.items()):
        x = np.arange(len(d))
        for col, cor in zip(d.columns, cores):
            ax.fill_between(x, d[col].to_numpy(float), color=cor, lw=0, zorder=2)
        ax.set_xticks(x, rotulos_x or [str(i) for i in d.index])
        ax.set_xlim(0, len(d) - 1)
        ax.set_ylim(0, d.to_numpy(float).max() * 1.05)
        ax.yaxis.set_visible(False)
        ax.tick_params(axis="x", labelsize=TAMANHO["eixo"] - 1)
        ax.spines["bottom"].set_color(t.linha_fina)
        subtitulo(ax, nome, (valor_painel or {}).get(nome))
    for ax in axes[len(dados):]:
        ax.set_visible(False)
    if legenda:
        nomes = nomes_series or list(next(iter(dados.values())).columns)
        _legenda(axes[0].figure, [(n, c, "barra") for n, c in zip(nomes, cores)])
    return axes


# ----------------------------------------------------------- mapa de calor
def mapa_calor(ax, df, fmt=F.num, centro=0.0, divergente=True, titulo_linhas=None,
               titulo_colunas=None, celula_ref=None, limite=None):
    """Tabela de sensibilidade colorida (linhas x colunas).

    divergente=True: coral (abaixo do centro) → neutro → teal (acima).
    celula_ref: (rótulo_linha, rótulo_coluna) do cenário-base, ganha contorno.
    """
    t = _t(ax)
    vals = df.to_numpy(float)
    lim = limite or np.nanmax(np.abs(vals - centro))
    if divergente:
        cmap = LinearSegmentedColormap.from_list("merc_div", list(t.divergente))
        norm = lambda v: 0.5 + (v - centro) / (2 * lim)  # noqa: E731
    else:
        cmap = LinearSegmentedColormap.from_list("merc_seq", list(t.sequencial))
        lo, hi = np.nanmin(vals), np.nanmax(vals)
        norm = lambda v: (v - lo) / (hi - lo or 1)  # noqa: E731
    nl, nc = vals.shape
    for i in range(nl):
        for j in range(nc):
            v = vals[i, j]
            cor = cmap(np.clip(norm(v), 0, 1))
            ax.add_patch(Rectangle((j, nl - 1 - i), 1, 1, facecolor=cor, edgecolor=t.fundo, lw=1.2))
            ax.text(j + 0.5, nl - 0.5 - i, fmt(v), ha="center", va="center",
                    fontsize=TAMANHO["rotulo"] - 0.3, color=_texto_sobre(cor, t))
    if celula_ref is not None:
        i = list(map(str, df.index)).index(str(celula_ref[0]))
        j = list(map(str, df.columns)).index(str(celula_ref[1]))
        ax.add_patch(Rectangle((j, nl - 1 - i), 1, 1, fill=False, edgecolor=t.texto, lw=1.6, zorder=5))
    ax.set_xlim(0, nc)
    ax.set_ylim(0, nl)
    ax.set_xticks(np.arange(nc) + 0.5, [str(c) for c in df.columns])
    ax.set_yticks(np.arange(nl) + 0.5, [str(r) for r in df.index[::-1]])
    ax.xaxis.tick_top()
    ax.tick_params(axis="both", colors=t.texto, labelsize=TAMANHO["rotulo"])
    for s in ax.spines.values():
        s.set_visible(False)
    if titulo_colunas:
        # no canto superior esquerdo, na altura dos rótulos de coluna
        ax.annotate(titulo_colunas, (0, 1), xycoords="axes fraction", xytext=(-6, 4),
                    textcoords="offset points", ha="right", va="bottom",
                    color=t.texto_2, fontsize=TAMANHO["rotulo"] - 0.5, style="italic")
    if titulo_linhas:
        ax.set_ylabel(titulo_linhas, color=t.texto_2, fontsize=TAMANHO["rotulo"] - 0.5,
                      labelpad=6, style="italic")
    return ax


# ------------------------------------------------------------------ tabela
def tabela(ax, df, formatos=None, negrito=(), secoes=(), destaque_coluna=None,
           destaque_linhas=(), calor=None, larguras=None, alinhar_primeira="left",
           altura_linha=None):
    """Tabela editorial (estilo relatório sell-side).

    df: primeira coluna = rótulos (ou use o índice: df.reset_index()).
    formatos: {coluna: func} ex. {"ROIC": lambda v: F.pct(v)}.
    negrito: rótulos de linha em negrito (totais).
    secoes: rótulos de linha que viram faixa de seção (sem valores).
    destaque_coluna: coluna com fundo de destaque suave.
    destaque_linhas: linhas com fundo de destaque (ex.: a métrica principal).
    calor: {coluna: "div" | "seq"} pinta a coluna como mapa de calor.
    """
    t = _t(ax)
    formatos = formatos or {}
    calor = calor or {}
    cols = list(df.columns)
    nl, nc = len(df), len(cols)
    larguras = larguras or ([2.4] + [1] * (nc - 1))
    xs = np.concatenate([[0], np.cumsum(larguras)])
    W = xs[-1]
    h = 1.0
    ax.set_xlim(0, W)
    ax.set_ylim(-(nl + 1) * h, 0)
    ax.axis("off")

    destaque_fundo = _misturar(t.destaque, t.fundo, 0.22)
    # cabeçalho
    ax.add_patch(Rectangle((0, -h), W, h, facecolor=t.cabecalho_tabela, lw=0))
    for j, c in enumerate(cols):
        x, ha = _pos_celula(xs, j, alinhar_primeira)
        ax.text(x, -h / 2, "\n".join(textwrap.wrap(str(c), 16)), ha=ha, va="center",
                fontsize=TAMANHO["rotulo"], weight="bold", color=t.texto_cabecalho)

    escalas = {}
    for c, tipo in calor.items():
        v = pd.to_numeric(df[c], errors="coerce")
        escalas[c] = (tipo, v.min(), v.max(), np.nanmax(np.abs(v)))

    for i, (_, linha) in enumerate(df.iterrows()):
        y0 = -(i + 2) * h
        rot = str(linha.iloc[0])
        if rot in secoes:
            ax.add_patch(Rectangle((0, y0), W, h, facecolor=t.faixa_tabela, lw=0))
            ax.text(xs[0] + 0.12, y0 + h / 2, rot, va="center", fontsize=TAMANHO["rotulo"],
                    weight="bold", color=t.texto)
            continue
        if rot in destaque_linhas:
            ax.add_patch(Rectangle((0, y0), W, h, facecolor=destaque_fundo, lw=0))
        for j, c in enumerate(cols):
            v = linha[c]
            if c in escalas and pd.notna(pd.to_numeric(v, errors="coerce")):
                tipo, lo, hi, amp = escalas[c]
                if tipo == "div":
                    k = 0.5 + float(v) / (2 * amp or 1)
                    base = t.divergente[0] if k < 0.5 else t.divergente[2]
                    cor = _misturar(base, t.fundo, abs(k - 0.5) * 2 * 0.75)
                else:
                    cor = _misturar(t.destaque, t.fundo, 0.12 + 0.6 * (float(v) - lo) / (hi - lo or 1))
                ax.add_patch(Rectangle((xs[j], y0), larguras[j], h, facecolor=cor, lw=0))
            elif c == destaque_coluna and j > 0:
                ax.add_patch(Rectangle((xs[j], y0), larguras[j], h, facecolor=destaque_fundo, lw=0))
            txt = formatos[c](v) if c in formatos and j > 0 else str(v)
            x, ha = _pos_celula(xs, j, alinhar_primeira)
            recuo = 0.12 if (j == 0 and rot not in negrito and secoes) else 0
            ax.text(x + recuo, y0 + h / 2, txt, ha=ha, va="center", fontsize=TAMANHO["rotulo"],
                    color=t.texto, weight="bold" if rot in negrito else "normal")
        ax.plot([0, W], [y0, y0], color=t.linha_fina, lw=0.5)
    ax.plot([0, W], [-(nl + 1) * h, -(nl + 1) * h], color=t.texto_3, lw=0.8)
    return ax


def _pos_celula(xs, j, alinhar_primeira):
    if j == 0:
        return (xs[0] + 0.12, "left") if alinhar_primeira == "left" else ((xs[0] + xs[1]) / 2, "center")
    return (xs[j] + xs[j + 1]) / 2, "center"


def _misturar(cor, fundo, alfa):
    a, b = np.array(to_rgb(cor)), np.array(to_rgb(fundo))
    return tuple(b + (a - b) * float(np.clip(alfa, 0, 1)))


# ------------------------------------------------------------ números-chave
def numeros_chave(ax, itens, colunas=None):
    """Cartões de destaque (hero numbers) para páginas de resumo.

    itens = [("US$ 1,8 tri", "Capex projetado em 2030", "+91% vs. 2026"), ...]
    O 3º elemento (variação) é opcional; começa com '+' (positivo) ou '−'/'-'.
    """
    t = _t(ax)
    ax.axis("off")
    n = len(itens)
    colunas = colunas or n
    linhas_n = int(np.ceil(n / colunas))
    ax.set_xlim(0, colunas)
    ax.set_ylim(0, linhas_n)
    for k, item in enumerate(itens):
        valor, rotulo = item[0], item[1]
        var = item[2] if len(item) > 2 else None
        c, r = k % colunas, linhas_n - 1 - k // colunas
        ax.add_patch(FancyBboxPatch((c + 0.04, r + 0.06), 0.92, 0.88,
                                    boxstyle="round,pad=0,rounding_size=0.06",
                                    facecolor=t.faixa_tabela, edgecolor="none"))
        ax.plot([c + 0.10, c + 0.24], [r + 0.80, r + 0.80], color=t.destaque, lw=2.2,
                solid_capstyle="butt")
        ax.text(c + 0.10, r + 0.60, valor, fontsize=19, weight="semibold", color=t.texto,
                family=fonte_titulo(), va="center")
        ax.text(c + 0.10, r + 0.44, "\n".join(textwrap.wrap(rotulo, 34)), fontsize=TAMANHO["rotulo"],
                color=t.texto_2, va="top", linespacing=1.3)
        if var:
            neg = var.strip().startswith(("−", "-"))
            ax.scatter([c + 0.125], [r + 0.165], marker="v" if neg else "^", s=24, lw=0,
                       color=t.negativo if neg else t.positivo)
            ax.text(c + 0.17, r + 0.165, var, fontsize=TAMANHO["rotulo"] - 0.5,
                    color=t.texto, va="center")
    return ax
