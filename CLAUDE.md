# Padrão de gráficos Mercurius Research (para analistas e agentes de IA)

Todo gráfico da Mercurius sai por esta biblioteca. Referências de linguagem:
Morgan Stanley Research (exhibits), JPM Guide to the Markets e FMI (WEO/GFSR).

## Fluxo

1. Dados em pandas: índice = eixo x (datas/anos/categorias), colunas = séries.
2. `fig, ax = mc.figura(titulo, subtitulo, numero=N, fonte=...)`.
3. Uma função de `graficos.py` por figura. Não use `ax.plot`/`ax.bar` cru se existe função pronta;
   se faltar um tipo, crie em `graficos.py` seguindo o mesmo padrão.
4. Anote: `periodo`, `evento`, `destacar`, `caixa`, `linha_ref`. Um bom exhibit tem de 1 a 3 anotações.
5. `mc.salvar(fig, "saida/figNN")`. Depois **abra o PNG** e confira se há sobreposição ou
   corte; ajuste `altura`, `margem_esq` e `margem_dir`.

## Texto

- **Título = conclusão**, em frase ("Fluxos para ETFs voltaram a acelerar"), nunca só o assunto
  ("Fluxos de ETFs").
- **Subtítulo = unidade + recorte** ("US$ bilhões, semanal, jan/24–dez/25").
- **Painéis** (FMI): `titulos_paineis=[("Nome", "unidade"), ...]`; a numeração é automática.
- **`fonte=` é obrigatória**: "Glassnode, CoinMetrics e Mercurius Research.". Dados simulados
  levam "Dados ilustrativos.".
- Números no padrão BR (`formato`): 1.388 · 27% · −204 (menos tipográfico) · US$ 1,8 tri · mar/26.
  Valores em tags e rótulos devem ser arredondados ao que importa (88.400, não 88.383,27).
- Projeções com sufixo `e` (2026e) e `projecao_desde=`.

## Visual (não negociável)

- Cores só do tema (`mc.tema_atual()`): `principal` (navy, âncora), `destaque` (teal),
  `outros` (cinza de contexto), `categorica[0..5]` em **ordem fixa**. Nunca escreva hex à mão.
- `positivo`/`negativo` só para polaridade (fluxo, retorno), nunca como "série 5".
- No máximo 6 séries com cor. Da 7ª em diante, agrupe em "Outros" ou use painéis.
- A mesma entidade tem a mesma cor em todas as figuras de um material.
- **Nada de eixo y duplo.** Escalas diferentes viram painéis (`paineis=(1, 2)`).
- Prefira rótulo direto (etiquetas na ponta, rótulos dentro de áreas) a legenda.
- Linhas finas (1,3 pt na principal e 0,9 pt no contexto); grade só horizontal e clara.
- Nada de 3D, sombra, gradiente decorativo, pizza com mais de 3 fatias ou rótulo em todo ponto.

## Tamanhos

- `largura="inteira"` (6,5 pol) ou `"meia"` (3,15 pol, para dois lado a lado); `"social"` e `"slide"`.
- `altura` total: 3,0 a 3,6 para um painel e 3,4 a 4,0 para dois painéis ou small multiples.
- Com etiquetas na ponta, use `margem_dir` de 0,6 a 0,8.
