"""Aplica o tema Mercurius ao matplotlib."""

import matplotlib as mpl

from .tokens import FONTES, TEMAS, T

_atual = {"tema": TEMAS["claro"]}


def tema_atual():
    return _atual["tema"]


def usar_tema(nome="claro"):
    """'claro' para relatórios/PDF; 'escuro' para app, site e redes."""
    if nome is None:
        return _atual["tema"]
    t = TEMAS[nome] if isinstance(nome, str) else nome
    _atual["tema"] = t
    mpl.rcParams.update({
        "font.family": "sans-serif",
        "font.sans-serif": FONTES,
        "font.size": T["tick"],
        "text.color": t.texto,
        "figure.facecolor": t.fundo,
        "axes.facecolor": t.fundo,
        "savefig.facecolor": t.fundo,
        "axes.edgecolor": t.eixo,
        "axes.labelcolor": t.texto_2,
        "axes.linewidth": 0.7,
        "axes.spines.top": False,
        "axes.spines.right": False,
        "axes.spines.left": False,
        "axes.grid": True,
        "axes.grid.axis": "y",
        "axes.axisbelow": True,
        "axes.prop_cycle": mpl.cycler(color=list(t.categorica)),
        "axes.xmargin": 0.0,
        "grid.color": t.grade,
        "grid.linewidth": 0.5,
        "xtick.color": t.eixo,
        "xtick.labelcolor": t.texto_2,
        "ytick.labelcolor": t.texto_2,
        "xtick.labelsize": T["tick"],
        "ytick.labelsize": T["tick"],
        "xtick.major.size": 2.5,
        "xtick.major.width": 0.6,
        "xtick.minor.size": 0,
        "ytick.major.size": 0,
        "xtick.major.pad": 3,
        "ytick.major.pad": 3,
        "xtick.direction": "out",
        "legend.frameon": False,
        "legend.fontsize": T["legenda"],
        "lines.linewidth": 1.3,
        "lines.solid_capstyle": "butt",
        "lines.solid_joinstyle": "round",
        "patch.linewidth": 0,
        "svg.fonttype": "none",
        "pdf.fonttype": 42,
        "axes.unicode_minus": True,
        "hatch.linewidth": 0.5,
    })
    return t
