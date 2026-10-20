"""Monta relatórios em PDF (A4) no padrão Mercurius Research.

    rel = Relatorio("saida/relatorio.pdf", data="20 de outubro de 2026")
    rel.capa("Quanto vale um halving", "Projeções de oferta e preço para 2028",
             autores=["Fulano — Analista"])
    rel.pagina("Caso você tenha cinco minutos", "Do hashrate ao preço",
               paragrafos=["**Frase de abertura em negrito.** Resto do parágrafo...", ...],
               figuras=["galeria/01_barras_empilhadas.png",
                        ("galeria/07_ranking.png", "galeria/08_barras_com_linha.png")])
    rel.fechar()

Figuras podem ser caminhos de PNG ou objetos Figure do matplotlib; uma tupla
coloca duas lado a lado. Use `**negrito**` no início do parágrafo para a frase-tese.
"""

import io
import re
from pathlib import Path

import matplotlib.image as mpimg
import matplotlib.pyplot as plt
from matplotlib.backends.backend_pdf import PdfPages
from matplotlib.lines import Line2D
from matplotlib.patches import Rectangle

from .tema import fonte_texto, fonte_titulo, usar_tema

A4 = (8.27, 11.69)
MARGEM = 0.75
DISCLAIMER = ("Este material tem caráter informativo e não constitui recomendação de investimento. "
              "Consulte o disclaimer completo ao final do relatório.")


class Relatorio:
    def __init__(self, caminho, data="", casa="Mercurius Research", tema="claro"):
        self.t = usar_tema(tema)
        self.caminho = Path(caminho)
        self.caminho.parent.mkdir(parents=True, exist_ok=True)
        self.pdf = PdfPages(self.caminho)
        self.data, self.casa, self.n = data, casa, 0

    # ------------------------------------------------------------ utilidades
    def _nova(self):
        self.n += 1
        fig = plt.figure(figsize=A4)
        fig.patch.set_facecolor(self.t.fundo)
        return fig

    def _fx(self, pol):
        return pol / A4[0]

    def _fy(self, pol):
        return 1 - pol / A4[1]

    def _cabecalho_rodape(self, fig):
        t = self.t
        fig.text(self._fx(MARGEM), self._fy(0.45), self.casa, fontsize=10, color=t.texto_2,
                 family=fonte_titulo(), va="baseline")
        fig.text(self._fx(A4[0] - MARGEM), self._fy(0.45), self.data, fontsize=10,
                 color=t.texto_3, ha="right", va="baseline")
        y = self._fy(0.55)
        fig.add_artist(Line2D([self._fx(MARGEM), self._fx(A4[0] - MARGEM)], [y, y],
                              transform=fig.transFigure, color=t.linha_fina, lw=0.8))
        yb = 0.42 / A4[1]
        fig.add_artist(Line2D([self._fx(MARGEM), self._fx(A4[0] - MARGEM)], [yb + 0.2 / A4[1]] * 2,
                              transform=fig.transFigure, color=t.linha_fina, lw=0.6))
        fig.text(self._fx(MARGEM), yb, DISCLAIMER, fontsize=6.3, color=t.texto_3, va="baseline")
        fig.text(self._fx(A4[0] - MARGEM), yb, str(self.n), fontsize=8, color=t.texto_2,
                 ha="right", va="baseline")

    def _paragrafo(self, fig, y_pol, texto, tamanho=9.5, largura=None, entrelinha=1.5):
        """Layout palavra a palavra, com trechos **negrito**. Devolve o y final (pol)."""
        t = self.t
        largura = largura or (A4[0] - 2 * MARGEM)
        r = fig.canvas.get_renderer()
        dpi = fig.dpi
        x0 = MARGEM
        cx, cy = x0, y_pol
        altura_linha = tamanho * entrelinha / 72
        trechos = re.split(r"(\*\*.+?\*\*)", texto)
        espaco = None
        for tr in trechos:
            if not tr:
                continue
            negrito = tr.startswith("**")
            for palavra in tr.strip("*").split():
                a = fig.text(self._fx(cx), self._fy(cy), palavra, fontsize=tamanho,
                             color=t.texto, weight="bold" if negrito else "normal",
                             family=fonte_texto(), va="baseline")
                w = a.get_window_extent(renderer=r).width / dpi
                if espaco is None:
                    e = fig.text(0, 0, "a a", fontsize=tamanho, family=fonte_texto())
                    e2 = fig.text(0, 0, "aa", fontsize=tamanho, family=fonte_texto())
                    espaco = (e.get_window_extent(renderer=r).width
                              - e2.get_window_extent(renderer=r).width) / dpi
                    e.remove()
                    e2.remove()
                if cx + w > x0 + largura and cx > x0:
                    cx, cy = x0, cy + altura_linha
                    a.set_position((self._fx(cx), self._fy(cy)))
                cx += w + espaco
        return cy + altura_linha * 0.9

    def _imagem(self, fig, origem, x_pol, y_pol, largura_pol):
        if hasattr(origem, "savefig"):
            buf = io.BytesIO()
            origem.savefig(buf, format="png", dpi=300)
            plt.close(origem)
            buf.seek(0)
            img = mpimg.imread(buf, format="png")
        else:
            img = mpimg.imread(str(origem))
        h, w = img.shape[:2]
        alt = largura_pol * h / w
        ax = fig.add_axes([self._fx(x_pol), self._fy(y_pol + alt), largura_pol / A4[0], alt / A4[1]])
        ax.imshow(img, interpolation="lanczos")
        ax.axis("off")
        return alt

    # --------------------------------------------------------------- páginas
    def capa(self, titulo, subtitulo="", autores=(), tipo="Relatório"):
        t = self.t
        fig = self._nova()
        fig.add_artist(Rectangle((0, 0.55), 1, 0.45, transform=fig.transFigure,
                                 facecolor="#0e1318", lw=0))
        fig.text(self._fx(MARGEM), self._fy(0.9), "MERCURIUS", fontsize=14, weight="bold",
                 color="#f2f6f8", family=fonte_titulo())
        fig.text(self._fx(MARGEM + 1.42), self._fy(0.9), "RESEARCH", fontsize=14,
                 color="#76828b", family=fonte_titulo())
        fig.text(self._fx(MARGEM), self._fy(3.1), tipo.upper(), fontsize=9, color="#50ddd5",
                 family=fonte_titulo(), weight="bold")
        fig.add_artist(Line2D([self._fx(MARGEM), self._fx(MARGEM + 0.5)], [self._fy(3.3)] * 2,
                              transform=fig.transFigure, color="#50ddd5", lw=2.4))
        y = 3.9
        for linha in _quebrar(titulo, 26):
            fig.text(self._fx(MARGEM), self._fy(y), linha, fontsize=32, weight="semibold",
                     color="#f2f6f8", family=fonte_titulo())
            y += 0.55
        for linha in _quebrar(subtitulo, 48):
            fig.text(self._fx(MARGEM), self._fy(y + 0.05), linha, fontsize=15, color="#a6b3bd",
                     family=fonte_titulo())
            y += 0.3
        fig.text(self._fx(MARGEM), self._fy(5.6), self.data, fontsize=10, color="#a6b3bd")
        y = 6.0
        for a in autores:
            fig.text(self._fx(MARGEM), self._fy(y), a, fontsize=10, color=t.texto)
            y += 0.24
        self.pdf.savefig(fig)
        plt.close(fig)

    def pagina(self, titulo, subtitulo="", paragrafos=(), figuras=(), espaco=0.18):
        fig = self._nova()
        t = self.t
        self._cabecalho_rodape(fig)
        fig.text(self._fx(MARGEM), self._fy(1.05), titulo, fontsize=19, weight="bold",
                 color=t.texto, family=fonte_titulo())
        y = 1.05
        if subtitulo:
            fig.text(self._fx(MARGEM), self._fy(1.42), subtitulo, fontsize=14, color=t.texto_2,
                     family=fonte_titulo())
            y = 1.42
        y += 0.42
        for p in paragrafos:
            y = self._paragrafo(fig, y, p) + 0.08
        y += 0.05
        util = A4[0] - 2 * MARGEM
        for f in figuras:
            if isinstance(f, (tuple, list)):
                w = (util - 0.2) / 2
                h1 = self._imagem(fig, f[0], MARGEM, y, w)
                h2 = self._imagem(fig, f[1], MARGEM + w + 0.2, y, w)
                y += max(h1, h2) + espaco
            else:
                y += self._imagem(fig, f, MARGEM, y, util) + espaco
        if y > A4[1] - 0.6:
            print(f"[aviso] página {self.n} transbordou ({y:.1f} pol). Divida o conteúdo.")
        self.pdf.savefig(fig)
        plt.close(fig)

    def fechar(self):
        self.pdf.close()
        return self.caminho


def _quebrar(texto, n):
    import textwrap
    return textwrap.wrap(texto, n) if texto else []
