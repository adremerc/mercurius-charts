"""Aplica o tema Mercurius ao matplotlib (fontes, cores, eixos)."""

from pathlib import Path

import matplotlib as mpl
from matplotlib import font_manager

from .tokens import FONTE_MONO, FONTE_TEXTO, FONTE_TITULO, TAMANHO, TEMAS

_PASTA_FONTES = Path(__file__).parent / "fonts"
_atual = {"tema": TEMAS["claro"], "fontes_ok": False}


def _registrar_fontes():
    if _atual["fontes_ok"]:
        return
    if _PASTA_FONTES.exists():
        for arq in list(_PASTA_FONTES.glob("*.ttf")) + list(_PASTA_FONTES.glob("*.otf")):
            font_manager.fontManager.addfont(str(arq))
    _atual["fontes_ok"] = True


def _primeira_disponivel(preferencias):
    instaladas = {f.name for f in font_manager.fontManager.ttflist}
    for nome in preferencias:
        if nome in instaladas:
            return nome
    return "DejaVu Sans"


def fonte_texto():
    _registrar_fontes()
    return _primeira_disponivel(FONTE_TEXTO)


def fonte_titulo():
    _registrar_fontes()
    return _primeira_disponivel(FONTE_TITULO)


def fonte_mono():
    _registrar_fontes()
    return _primeira_disponivel(FONTE_MONO)


def tema_atual():
    return _atual["tema"]


def usar_tema(nome="claro"):
    """Ativa o tema ('claro' para relatório/PDF, 'escuro' para app/redes)."""
    if nome is None:
        return _atual["tema"]
    t = TEMAS[nome] if isinstance(nome, str) else nome
    _atual["tema"] = t
    _registrar_fontes()
    mpl.rcParams.update({
        "font.family": fonte_texto(),
        "font.size": TAMANHO["eixo"],
        "text.color": t.texto,
        "figure.facecolor": t.fundo,
        "axes.facecolor": t.fundo,
        "savefig.facecolor": t.fundo,
        "axes.edgecolor": t.linha_fina,
        "axes.labelcolor": t.texto_2,
        "axes.linewidth": 0.8,
        "axes.spines.top": False,
        "axes.spines.right": False,
        "axes.spines.left": False,
        "axes.grid": False,
        "axes.axisbelow": True,
        "axes.prop_cycle": mpl.cycler(color=list(t.categorica)),
        "grid.color": t.linha_fina,
        "grid.linewidth": 0.6,
        "xtick.color": t.texto_2,
        "ytick.color": t.texto_2,
        "xtick.labelcolor": t.texto_2,
        "ytick.labelcolor": t.texto_2,
        "xtick.labelsize": TAMANHO["eixo"],
        "ytick.labelsize": TAMANHO["eixo"],
        "xtick.major.size": 0,
        "ytick.major.size": 0,
        "xtick.major.pad": 4,
        "ytick.major.pad": 4,
        "legend.frameon": False,
        "legend.fontsize": TAMANHO["legenda"],
        "legend.labelcolor": t.texto_2,
        "lines.linewidth": 2,
        "lines.solid_capstyle": "round",
        "patch.linewidth": 0,
        "svg.fonttype": "none",   # texto editável no Figma/Illustrator
        "pdf.fonttype": 42,
        "axes.unicode_minus": True,
    })
    return t
