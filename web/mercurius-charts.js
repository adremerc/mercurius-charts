/*!
 * mercurius-charts.js — gráficos no padrão Mercurius Research (web, D3 v7).
 *
 *   <script src="https://cdnjs.cloudflare.com/ajax/libs/d3/7.9.0/d3.min.js"></script>
 *   <script src="mercurius-charts.js"></script>
 *   const [plot] = MC.figura("#alvo", { numero: 1, titulo: "...", subtitulo: "...", fonte: "..." });
 *   MC.linhas(plot, { series: { BTC: [["2024-01-05", 44100], ...] }, log: true });
 *
 * Tema escuro por padrão (identidade do app Mercurius); claro quando a página
 * está em modo claro (data-theme="light" ou prefers-color-scheme: light).
 * Todos os gráficos são responsivos, redesenham ao trocar de tema e têm tooltip.
 */
(function (global) {
  "use strict";
  const d3 = global.d3;
  if (!d3) throw new Error("mercurius-charts: carregue o D3 v7 antes deste arquivo.");

  // ------------------------------------------------------------------ estilo
  const CSS = `
:where(:root){
  --mc-bg:#0e1318; --mc-fg:#f2f6f8; --mc-fg2:#a6b3bd; --mc-fg3:#76828b;
  --mc-grade:rgba(255,255,255,.07); --mc-eixo:#56636d; --mc-sombra:rgba(255,255,255,.035);
  --mc-borda:rgba(255,255,255,.08); --mc-tip-bg:#161b20;
  --mc-destaque:#50ddd5; --mc-pos:#3ad693; --mc-neg:#fd736d; --mc-outros:#4c575f;
  --mc-s1:#50ddd5; --mc-s2:#4f8ff0; --mc-s3:#e0a630; --mc-s4:#9b82f0; --mc-s5:#f06a64; --mc-s6:#c9d2d8;
  --mc-fonte:"Inter",ui-sans-serif,system-ui,-apple-system,"Segoe UI",Arial,sans-serif;
}
@media (prefers-color-scheme: light){ :where(:root:not([data-theme="dark"])){
  --mc-bg:#ffffff; --mc-fg:#0e1a24; --mc-fg2:#4a5761; --mc-fg3:#7b8791;
  --mc-grade:#e6ebee; --mc-eixo:#55626c; --mc-sombra:#f1f4f6; --mc-borda:#e3e8ec; --mc-tip-bg:#ffffff;
  --mc-destaque:#138f86; --mc-pos:#138f86; --mc-neg:#cf5c5a; --mc-outros:#b9c4cc;
  --mc-s1:#0e2a3b; --mc-s2:#17a398; --mc-s3:#d2a03c; --mc-s4:#3d7cc9; --mc-s5:#8e7cc3; --mc-s6:#7d8a94;
}}
:where(:root[data-theme="light"]){
  --mc-bg:#ffffff; --mc-fg:#0e1a24; --mc-fg2:#4a5761; --mc-fg3:#7b8791;
  --mc-grade:#e6ebee; --mc-eixo:#55626c; --mc-sombra:#f1f4f6; --mc-borda:#e3e8ec; --mc-tip-bg:#ffffff;
  --mc-destaque:#138f86; --mc-pos:#138f86; --mc-neg:#cf5c5a; --mc-outros:#b9c4cc;
  --mc-s1:#0e2a3b; --mc-s2:#17a398; --mc-s3:#d2a03c; --mc-s4:#3d7cc9; --mc-s5:#8e7cc3; --mc-s6:#7d8a94;
}
[data-mc-tema="claro"]{
  --mc-bg:#ffffff; --mc-fg:#0e1a24; --mc-fg2:#4a5761; --mc-fg3:#7b8791;
  --mc-grade:#e6ebee; --mc-eixo:#55626c; --mc-sombra:#f1f4f6; --mc-borda:#e3e8ec; --mc-tip-bg:#ffffff;
  --mc-destaque:#138f86; --mc-pos:#138f86; --mc-neg:#cf5c5a; --mc-outros:#b9c4cc;
  --mc-s1:#0e2a3b; --mc-s2:#17a398; --mc-s3:#d2a03c; --mc-s4:#3d7cc9; --mc-s5:#8e7cc3; --mc-s6:#7d8a94;
}
[data-mc-tema="escuro"]{
  --mc-bg:#0e1318; --mc-fg:#f2f6f8; --mc-fg2:#a6b3bd; --mc-fg3:#76828b;
  --mc-grade:rgba(255,255,255,.07); --mc-eixo:#56636d; --mc-sombra:rgba(255,255,255,.035);
  --mc-borda:rgba(255,255,255,.08); --mc-tip-bg:#161b20;
  --mc-destaque:#50ddd5; --mc-pos:#3ad693; --mc-neg:#fd736d; --mc-outros:#4c575f;
  --mc-s1:#50ddd5; --mc-s2:#4f8ff0; --mc-s3:#e0a630; --mc-s4:#9b82f0; --mc-s5:#f06a64; --mc-s6:#c9d2d8;
}
.mc-fig{margin:0;background:var(--mc-bg);color:var(--mc-fg);font-family:var(--mc-fonte);
  font-variant-numeric:tabular-nums;border-top:2px solid var(--mc-destaque);padding:14px 0 10px;
  display:flex;flex-direction:column;gap:10px;min-width:0}
.mc-cab{display:flex;flex-direction:column;gap:3px;padding-inline:2px}
.mc-eyebrow{font-size:10.5px;font-weight:700;letter-spacing:.09em;color:var(--mc-destaque);text-transform:uppercase}
.mc-titulo{margin:0;font-size:16px;line-height:1.3;font-weight:650;letter-spacing:-.01em;text-wrap:balance;color:var(--mc-fg)}
.mc-sub{margin:0;font-size:12.5px;color:var(--mc-fg2)}
.mc-leg{display:flex;flex-wrap:wrap;gap:4px 14px;font-size:11.5px;color:var(--mc-fg2);padding-inline:2px}
.mc-leg span{display:inline-flex;align-items:center;gap:6px}
.mc-leg i{display:inline-block;width:14px;height:2px;border-radius:1px}
.mc-leg i.b{width:9px;height:9px;border-radius:2px}
.mc-leg i.p{width:8px;height:8px;border-radius:50%}
.mc-leg i.t{height:0;border-top:2px dashed;background:none!important}
.mc-paineis{display:grid;gap:18px 26px}
.mc-painel{min-width:0;display:flex;flex-direction:column;gap:6px}
.mc-ptit{font-size:12.5px;font-weight:650;color:var(--mc-fg);display:flex;flex-direction:column;gap:1px;padding-inline:2px}
.mc-ptit em{font-weight:400;font-size:11.5px;color:var(--mc-fg2)}
.mc-plot{position:relative;min-width:0;overflow-x:clip}
.mc-plot svg{display:block;overflow:visible}
.mc-plot text{font-family:var(--mc-fonte);font-variant-numeric:tabular-nums}
.mc-rod{display:flex;justify-content:space-between;align-items:flex-end;gap:12px;font-size:10.5px;
  color:var(--mc-fg3);border-top:1px solid var(--mc-borda);padding-top:8px;line-height:1.45}
.mc-rod b{color:var(--mc-fg);letter-spacing:.12em;font-size:10px;white-space:nowrap}
.mc-tip{position:absolute;pointer-events:none;z-index:5;background:var(--mc-tip-bg);color:var(--mc-fg);
  border:1px solid var(--mc-borda);border-radius:6px;padding:7px 9px;font-size:11.5px;line-height:1.5;
  box-shadow:0 8px 24px rgba(0,0,0,.28);white-space:nowrap;opacity:0;transition:opacity .12s}
.mc-tip.on{opacity:1}
.mc-tip .d{color:var(--mc-fg2);font-size:10.5px;margin-bottom:2px}
.mc-tip .l{display:flex;align-items:center;gap:7px;justify-content:space-between}
.mc-tip .l span{display:inline-flex;align-items:center;gap:6px;color:var(--mc-fg2)}
.mc-tip .l i{width:8px;height:8px;border-radius:2px;display:inline-block}
.mc-tip .l b{font-weight:600}
@media (prefers-reduced-motion: reduce){.mc-tip{transition:none}}
`;
  if (!document.getElementById("mc-css")) {
    const s = document.createElement("style");
    s.id = "mc-css";
    s.textContent = CSS;
    document.head.prepend(s);
  }

  // ------------------------------------------------------------- formatação
  const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
  const _nf = {};
  function nf(c) { return (_nf[c] ||= new Intl.NumberFormat("pt-BR", { minimumFractionDigits: c, maximumFractionDigits: c })); }
  const F = {
    num(v, c = 0, sinal = false) {
      if (v == null || Number.isNaN(v)) return "–";
      const s = nf(c).format(Math.abs(v));
      if (v < 0 && Number(s.replace(/\./g, "").replace(",", ".")) !== 0) return "−" + s;
      return (sinal && v > 0 ? "+" : "") + s;
    },
    pct(v, c = 0, sinal = false) { return v == null ? "–" : F.num(v * 100, c, sinal) + "%"; },
    pp(v, c = 1) { return F.num(v, c, true) + " p.p."; },
    mil(v) {
      if (Math.abs(v) < 1000) return F.num(v);
      const k = v / 1000;
      return F.num(k, Math.abs(k) >= 10 || Number.isInteger(Math.round(k * 10) / 10) && Math.round(k * 10) % 10 === 0 ? 0 : 1) + " mil";
    },
    mes(d) { return `${MESES[d.getMonth()]}/${String(d.getFullYear()).slice(2)}`; },
    dia(d) { return `${d.getDate()} ${MESES[d.getMonth()]} ${d.getFullYear()}`; },
  };

  // ------------------------------------------------------------------- tema
  function tema(el) {
    const cs = getComputedStyle(el);
    const g = (n) => cs.getPropertyValue("--mc-" + n).trim();
    return {
      bg: g("bg"), fg: g("fg"), fg2: g("fg2"), fg3: g("fg3"), grade: g("grade"), eixo: g("eixo"),
      sombra: g("sombra"), destaque: g("destaque"), pos: g("pos"), neg: g("neg"), outros: g("outros"),
      s: [g("s1"), g("s2"), g("s3"), g("s4"), g("s5"), g("s6")],
    };
  }
  function cor(t, c, i) {
    if (!c) return t.s[i % 6];
    if (/^s[1-6]$/.test(c)) return t.s[+c[1] - 1];
    if (t[c]) return t[c];
    return c;
  }
  function textoSobre(c) {
    const r = d3.rgb(c);
    const L = (x) => { x /= 255; return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4; };
    return 0.2126 * L(r.r) + 0.7152 * L(r.g) + 0.0722 * L(r.b) > 0.33 ? "#0b1117" : "#ffffff";
  }

  // ---------------------------------------------------- registro/redesenho
  const vivos = new Set();
  let agendado = 0;
  function redesenharTodos() {
    clearTimeout(agendado);
    agendado = setTimeout(() => vivos.forEach((f) => f()), 30);
  }
  new MutationObserver(redesenharTodos).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme", "class"] });
  matchMedia("(prefers-color-scheme: light)").addEventListener("change", redesenharTodos);

  // Redesenha quando a largura do contêiner muda (janela, rotação do celular, layout).
  const medidas = new Map();
  function checarLarguras() {
    medidas.forEach((m, el) => {
      if (!el.isConnected) { medidas.delete(el); return; }
      if (Math.abs(el.clientWidth - m.largura) > 2) m.f();
    });
  }
  let espera = 0;
  const agendarChecagem = () => { clearTimeout(espera); espera = setTimeout(checarLarguras, 60); };
  const ro = new ResizeObserver(agendarChecagem);
  addEventListener("resize", agendarChecagem);

  function montar(plot, altura, desenhar) {
    const el = typeof plot === "string" ? document.querySelector(plot) : plot;
    const m = { largura: 0, f: null };
    const f = () => {
      const w = Math.max(240, Math.round(el.clientWidth));
      el.innerHTML = "";
      const t = tema(el);
      const svg = d3.select(el).append("svg").attr("width", w).attr("height", altura).attr("role", "img");
      const tip = d3.select(el).append("div").attr("class", "mc-tip");
      desenhar({ el, svg, w, h: altura, t, tip: dicas(el, tip) });
      m.largura = w;
    };
    m.f = f;
    f();
    vivos.add(f);
    medidas.set(el, m);
    ro.observe(el);
    return el;
  }

  function dicas(el, tip) {
    return {
      mostrar(html, x, y) {
        tip.html(html).classed("on", true);
        const n = tip.node(), W = el.clientWidth;
        let left = x + 14, top = y - n.offsetHeight / 2;
        if (left + n.offsetWidth > W) left = x - 14 - n.offsetWidth;
        top = Math.max(-8, top);
        tip.style("left", left + "px").style("top", top + "px");
      },
      esconder() { tip.classed("on", false); },
    };
  }
  function linhaTip(c, nome, valor) {
    return `<div class="l"><span><i style="background:${c}"></i>${nome}</span><b>${valor}</b></div>`;
  }

  // ------------------------------------------------------------------ moldura
  function figura(alvo, o) {
    const raiz = typeof alvo === "string" ? document.querySelector(alvo) : alvo;
    raiz.innerHTML = "";
    const fig = d3.select(raiz).append("figure").attr("class", "mc-fig");
    if (o.tema) fig.attr("data-mc-tema", o.tema); // "claro" | "escuro" força o tema desta figura
    const cab = fig.append("div").attr("class", "mc-cab");
    if (o.numero != null) cab.append("div").attr("class", "mc-eyebrow").text(`Figura ${o.numero}`);
    cab.append("h3").attr("class", "mc-titulo").text(o.titulo);
    if (o.subtitulo) cab.append("p").attr("class", "mc-sub").text(o.subtitulo);
    const leg = fig.append("div").attr("class", "mc-leg");
    const paineis = o.paineis || [{}];
    const grade = fig.append("div").attr("class", "mc-paineis")
      .style("grid-template-columns", `repeat(auto-fit, minmax(${o.minPainel || 260}px, 1fr))`);
    const plots = paineis.map((p, i) => {
      const pn = grade.append("div").attr("class", "mc-painel");
      if (p.titulo) {
        const pt = pn.append("div").attr("class", "mc-ptit");
        pt.append("span").text((paineis.length > 1 ? `${i + 1}. ` : "") + p.titulo);
        if (p.unidade) pt.append("em").text(p.unidade);
      }
      const pl = pn.append("div").attr("class", "mc-plot").node();
      pl._mcLeg = leg.node();
      return pl;
    });
    const rod = fig.append("figcaption").attr("class", "mc-rod");
    const txt = rod.append("div");
    if (o.nota) txt.append("div").text(`Nota: ${o.nota}`);
    if (o.fonte) txt.append("div").text(`Fonte: ${o.fonte}`);
    rod.append("b").text("MERCURIUS");
    return plots;
  }

  const VARS = { pos: "pos", neg: "neg", outros: "outros", destaque: "destaque", fg: "fg", fg2: "fg2", fg3: "fg3" };
  function corCss(c, i = 0) {
    if (!c) return `var(--mc-s${(i % 6) + 1})`;
    if (/^s[1-6]$/.test(c)) return `var(--mc-${c})`;
    if (VARS[c]) return `var(--mc-${VARS[c]})`;
    return c;
  }
  function legenda(plot, itens) {
    const leg = plot._mcLeg;
    if (!leg) return;
    leg.innerHTML = itens.map(([nome, c, tipo, opac], i) => {
      const k = tipo === "barra" ? "b" : tipo === "ponto" ? "p" : tipo === "tracejada" ? "t" : "";
      const estilo = (tipo === "tracejada" ? `border-color:${corCss(c, i)}` : `background:${corCss(c, i)}`) + (opac ? `;opacity:${opac}` : "");
      return `<span><i class="${k}" style="${estilo}"></i>${nome}</span>`;
    }).join("");
  }

  // ------------------------------------------------------------ eixos comuns
  const parse = d3.timeParse("%Y-%m-%d");
  function datas(serie) { return serie.map(([d, v]) => [parse(d), v]); }

  function larguraTexto(s, px = 11) { return s.length * px * 0.56 + 2; }

  function eixoY(g, y, w, t, fmt, ticks) {
    const ts = ticks || y.ticks(5);
    const gy = g.append("g");
    gy.selectAll("line").data(ts).join("line")
      .attr("x1", 0).attr("x2", w).attr("y1", y).attr("y2", y)
      .attr("stroke", (d) => (d === 0 ? t.eixo : t.grade)).attr("stroke-width", 1)
      .attr("shape-rendering", "crispEdges");
    gy.selectAll("text").data(ts).join("text")
      .attr("x", -8).attr("y", y).attr("dy", "0.34em").attr("text-anchor", "end")
      .attr("fill", t.fg3).attr("font-size", 11).text((d) => fmt(d));
    return ts;
  }

  function eixoX(g, x, h, t, passo = "ano") {
    const [a, b] = x.domain();
    let ticks;
    if (passo === "ano") ticks = d3.timeYear.range(d3.timeYear.ceil(a), b);
    else ticks = d3.timeMonth.every(passo === "semestre" ? 6 : passo === "trimestre" ? 3 : 1).range(d3.timeMonth.ceil(a), b);
    const gx = g.append("g").attr("transform", `translate(0,${h})`);
    gx.append("line").attr("x1", 0).attr("x2", x.range()[1]).attr("stroke", t.eixo).attr("shape-rendering", "crispEdges");
    const tk = gx.selectAll("g").data(ticks).join("g").attr("transform", (d) => `translate(${x(d)},0)`);
    tk.append("line").attr("y2", 4).attr("stroke", t.eixo);
    tk.append("text").attr("y", 17).attr("text-anchor", "middle").attr("fill", t.fg2).attr("font-size", 11)
      .text((d) => (passo === "ano" ? d.getFullYear() : F.mes(d)));
  }

  function ticksLog(lo, hi) {
    const out = [];
    for (let e = Math.floor(Math.log10(lo)); e <= Math.ceil(Math.log10(hi)); e++)
      for (const m of [1, 2, 5]) { const v = m * 10 ** e; if (v >= lo * 0.9 && v <= hi * 1.1) out.push(v); }
    return out;
  }

  function anotarPeriodos(g, x, h, t, periodos = []) {
    for (const p of periodos) {
      const x0 = x(parse(p.de)), x1 = x(parse(p.ate));
      g.append("rect").attr("x", x0).attr("width", x1 - x0).attr("y", 0).attr("height", h).attr("fill", t.sombra);
      if (p.texto) g.append("text").attr("x", (x0 + x1) / 2).attr("y", -5).attr("text-anchor", "middle")
        .attr("fill", t.fg3).attr("font-size", 10.5).text(p.texto);
    }
  }
  function anotarEventos(g, x, h, t, eventos = []) {
    let ultimo = -1e9, nivel = 0;
    for (const e of eventos) {
      const xv = x(parse(e.x));
      nivel = xv - ultimo < 80 ? nivel + 1 : 0;
      ultimo = xv;
      g.append("line").attr("x1", xv).attr("x2", xv).attr("y1", 0).attr("y2", h)
        .attr("stroke", t.fg3).attr("stroke-dasharray", "3 3").attr("stroke-width", 1);
      g.append("text").attr("x", xv + 5).attr("y", h - 7 - nivel * 14).attr("fill", t.fg2).attr("font-size", 10.5).text(e.texto);
    }
  }

  function tags(g, w, itens, t) {
    // itens: [{y, texto, cor, nome}] — etiquetas na borda direita, sem sobreposição
    itens.sort((a, b) => a.y - b.y);
    for (let i = 1; i < itens.length; i++) itens[i].y = Math.max(itens[i].y, itens[i - 1].y + 20);
    for (const it of itens) {
      const tw = larguraTexto(it.texto, 11) + 10;
      const gg = g.append("g").attr("transform", `translate(${w + 8},${it.y})`);
      gg.append("rect").attr("y", -9).attr("height", 18).attr("width", tw).attr("rx", 3).attr("fill", it.cor);
      gg.append("text").attr("x", tw / 2).attr("dy", "0.35em").attr("text-anchor", "middle")
        .attr("fill", textoSobre(it.cor)).attr("font-size", 11).attr("font-weight", 650).text(it.texto);
      if (it.nome) gg.append("text").attr("x", tw + 6).attr("dy", "0.35em").attr("fill", t.fg2)
        .attr("font-size", 11).text(it.nome);
    }
  }

  // ===================================================================== linhas
  function linhas(plot, o) {
    const nomes = Object.keys(o.series);
    const S = nomes.map((n) => ({ nome: n, d: datas(o.series[n]) }));
    const fmt = o.fmt || ((v) => F.num(v));
    const fmtTag = o.fmtTag || fmt;
    if (o.legenda !== false && nomes.length > 1 && !o.etiquetas) legenda(plot, nomes.map((n, i) => [n, o.cores?.[n] || `s${i + 1}`, "linha"]));
    return montar(plot, o.altura || 340, ({ svg, w, h, t, tip }) => {
      const corDe = Object.fromEntries(nomes.map((n, i) => [n, cor(t, o.cores?.[n], i)]));
      const etq = o.etiquetas !== false;
      const maxTag = etq ? d3.max(S, (s) => larguraTexto(fmtTag(s.d.at(-1)[1])) + 10 + larguraTexto(s.nome)) + 26 : 12;
      const todos = S.flatMap((s) => s.d.map((p) => p[1]));
      let y, ticks;
      const m = { t: 18, r: maxTag, b: 26, l: 0 };
      const iw0 = w - m.r;
      const ih = h - m.t - m.b;
      if (o.log) {
        const lo = d3.min(todos), hi = d3.max(todos);
        y = d3.scaleLog().domain([lo * 0.9, hi * 1.15]).range([ih, 0]);
        ticks = ticksLog(lo, hi);
      } else {
        const lo = Math.min(0, d3.min(todos)), hi = d3.max(todos);
        y = d3.scaleLinear().domain([o.zero === false ? d3.min(todos) : lo, hi]).nice().range([ih, 0]);
        ticks = y.ticks(5);
      }
      m.l = d3.max(ticks, (v) => larguraTexto(fmt(v))) + 10;
      const iw = iw0 - m.l;
      const x = d3.scaleTime().domain(d3.extent(S.flatMap((s) => s.d.map((p) => p[0])))).range([0, iw]);
      const g = svg.append("g").attr("transform", `translate(${m.l},${m.t})`);
      anotarPeriodos(g, x, ih, t, o.periodos);
      eixoY(g, y, iw, t, fmt, ticks);
      if (o.base != null) g.append("line").attr("x1", 0).attr("x2", iw).attr("y1", y(o.base)).attr("y2", y(o.base))
        .attr("stroke", t.fg3).attr("stroke-dasharray", "2 3");
      anotarEventos(g, x, ih, t, o.eventos);
      eixoX(g, x, ih, t, o.passo || "ano");
      const ln = d3.line().x((p) => x(p[0])).y((p) => y(p[1])).curve(d3.curveMonotoneX);
      const defs = svg.append("defs");
      S.forEach((s, i) => {
        if (o.area) {
          const id = `mcg${Math.random().toString(36).slice(2, 8)}`;
          const lg = defs.append("linearGradient").attr("id", id).attr("x1", 0).attr("x2", 0).attr("y1", 0).attr("y2", 1);
          lg.append("stop").attr("offset", "0%").attr("stop-color", corDe[s.nome]).attr("stop-opacity", 0.22);
          lg.append("stop").attr("offset", "100%").attr("stop-color", corDe[s.nome]).attr("stop-opacity", 0);
          g.append("path").datum(s.d).attr("fill", `url(#${id})`)
            .attr("d", d3.area().x((p) => x(p[0])).y0(ih).y1((p) => y(p[1])).curve(d3.curveMonotoneX));
        }
        g.append("path").datum(s.d).attr("fill", "none").attr("stroke", corDe[s.nome])
          .attr("stroke-width", o.larguras?.[s.nome] || 1.8).attr("stroke-linejoin", "round")
          .attr("stroke-dasharray", o.tracejadas?.includes(s.nome) ? "5 4" : null).attr("d", ln);
      });
      if (o.destaque) {
        const s = S.find((q) => q.nome === o.destaque.serie) || S[0];
        const p = o.destaque.tipo === "min" ? s.d.reduce((a, b) => (b[1] < a[1] ? b : a)) : s.d.reduce((a, b) => (b[1] > a[1] ? b : a));
        const px = x(p[0]), py = y(p[1]);
        g.append("line").attr("x1", px).attr("x2", px - 22).attr("y1", py).attr("y2", py - 14).attr("stroke", t.fg3);
        g.append("circle").attr("cx", px).attr("cy", py).attr("r", 3.5).attr("fill", corDe[s.nome]).attr("stroke", t.bg).attr("stroke-width", 1.5);
        g.append("text").attr("x", px - 26).attr("y", py - 16).attr("text-anchor", "end").attr("fill", t.fg)
          .attr("font-size", 11).attr("font-weight", 600).text(o.destaque.texto(p[1], p[0]));
      }
      if (etq) tags(g, iw, S.map((s) => ({ y: y(s.d.at(-1)[1]), texto: fmtTag(s.d.at(-1)[1]), cor: corDe[s.nome], nome: s.nome })), t);
      // crosshair
      const cx = g.append("line").attr("y1", 0).attr("y2", ih).attr("stroke", t.fg3).attr("opacity", 0);
      const pts = g.append("g");
      const bis = d3.bisector((p) => p[0]).center;
      g.append("rect").attr("width", iw).attr("height", ih).attr("fill", "transparent")
        .on("pointermove", (ev) => {
          const [mx] = d3.pointer(ev);
          const dt = x.invert(mx);
          const vals = S.map((s) => ({ s, p: s.d[bis(s.d, dt)] })).filter((v) => v.p);
          const xd = x(vals[0].p[0]);
          cx.attr("x1", xd).attr("x2", xd).attr("opacity", 1);
          pts.selectAll("circle").data(vals).join("circle").attr("r", 4).attr("cx", (v) => x(v.p[0])).attr("cy", (v) => y(v.p[1]))
            .attr("fill", (v) => corDe[v.s.nome]).attr("stroke", t.bg).attr("stroke-width", 2);
          vals.sort((a, b) => b.p[1] - a.p[1]);
          tip.mostrar(`<div class="d">${F.dia(vals[0].p[0])}</div>` + vals.map((v) => linhaTip(corDe[v.s.nome], v.s.nome, fmt(v.p[1]))).join(""), xd + m.l, d3.pointer(ev)[1] + m.t);
        })
        .on("pointerleave", () => { cx.attr("opacity", 0); pts.selectAll("*").remove(); tip.esconder(); });
    });
  }

  // =============================================================== barras tempo
  function barrasTempo(plot, o) {
    const d = datas(o.dados);
    const fmt = o.fmt || ((v) => F.num(v, 1));
    return montar(plot, o.altura || 300, ({ svg, w, h, t, tip }) => {
      const ext = d3.extent(d, (p) => p[1]);
      const y = d3.scaleLinear().domain([Math.min(0, ext[0]), Math.max(0, ext[1])]).nice().range([h - 44, 0]);
      const ticks = y.ticks(5);
      const m = { t: 18, r: 4, b: 26, l: d3.max(ticks, (v) => larguraTexto((o.fmtEixo || fmt)(v))) + 10 };
      const iw = w - m.l - m.r, ih = h - m.t - m.b;
      y.range([ih, 0]);
      const passo = d3.median(d3.pairs(d, (a, b) => b[0] - a[0]));
      const x = d3.scaleTime().domain([+d[0][0] - passo / 2, +d.at(-1)[0] + passo / 2]).range([0, iw]);
      const bw = Math.max(1, (x(+d[0][0] + passo) - x(d[0][0])) * 0.72);
      const g = svg.append("g").attr("transform", `translate(${m.l},${m.t})`);
      eixoY(g, y, iw, t, o.fmtEixo || fmt, ticks);
      eixoX(g, x, ih, t, o.passo || "semestre");
      g.append("g").selectAll("rect").data(d).join("rect")
        .attr("x", (p) => x(p[0]) - bw / 2).attr("width", bw)
        .attr("y", (p) => y(Math.max(0, p[1]))).attr("height", (p) => Math.abs(y(p[1]) - y(0)))
        .attr("fill", (p) => (p[1] >= 0 ? t.pos : t.neg)).attr("rx", Math.min(1.5, bw / 3))
        .on("pointerenter", function (ev, p) {
          d3.select(this).attr("opacity", 0.7);
          tip.mostrar(`<div class="d">Semana de ${F.dia(p[0])}</div>${linhaTip(p[1] >= 0 ? t.pos : t.neg, o.rotulo || "Fluxo", fmt(p[1]))}`, x(p[0]) + m.l, y(p[1]) + m.t);
        })
        .on("pointerleave", function () { d3.select(this).attr("opacity", 1); tip.esconder(); });
      g.append("line").attr("x1", 0).attr("x2", iw).attr("y1", y(0)).attr("y2", y(0)).attr("stroke", t.eixo);
    });
  }

  // ============================================================= área empilhada
  function areaEmpilhada(plot, o) {
    const ds = o.datas.map(parse);
    const nomes = Object.keys(o.series);
    const fmt = o.fmt || ((v) => F.num(v));
    return montar(plot, o.altura || 340, ({ svg, w, h, t, tip }) => {
      const corDe = Object.fromEntries(nomes.map((n, i) => [n, cor(t, o.cores?.[n], i)]));
      const linhasD = ds.map((dt, i) => Object.fromEntries([["dt", dt], ...nomes.map((n) => [n, o.series[n][i]])]));
      const st = d3.stack().keys(nomes)(linhasD);
      const tot = linhasD.map((r) => d3.sum(nomes, (n) => r[n]));
      const y = d3.scaleLinear().domain([0, d3.max(tot) * 1.06]).nice();
      const ticks = y.ticks(5);
      const iR = Math.round((ds.length - 1) * (o.posRotulo ?? 0.82));
      const finos = nomes.filter((n, k) => (st[k][iR][1] - st[k][iR][0]) < d3.max(tot) * 0.08);
      const m = { t: 10, r: finos.length ? d3.max(finos, (n) => larguraTexto(n)) + 14 : 6, b: 26, l: d3.max(ticks, (v) => larguraTexto(fmt(v))) + 10 };
      const iw = w - m.l - m.r, ih = h - m.t - m.b;
      y.range([ih, 0]);
      const x = d3.scaleTime().domain(d3.extent(ds)).range([0, iw]);
      const g = svg.append("g").attr("transform", `translate(${m.l},${m.t})`);
      eixoY(g, y, iw, t, fmt, ticks);
      const ar = d3.area().x((p) => x(p.data.dt)).y0((p) => y(p[0])).y1((p) => y(p[1])).curve(d3.curveMonotoneX);
      g.selectAll("path.a").data(st).join("path").attr("class", "a").attr("fill", (s) => corDe[s.key]).attr("d", ar)
        .attr("stroke", t.bg).attr("stroke-width", 0.6);
      eixoX(g, x, ih, t, o.passo || "ano");
      const i = iR;
      st.forEach((s) => {
        if (finos.includes(s.key)) return;
        g.append("text").attr("x", x(ds[i])).attr("y", y((s[i][0] + s[i][1]) / 2)).attr("dy", "0.35em")
          .attr("text-anchor", "middle").attr("font-size", 12).attr("font-weight", 650).attr("fill", textoSobre(corDe[s.key])).text(s.key);
      });
      const fora = st.filter((s) => finos.includes(s.key)).map((s) => ({ nome: s.key, y: y((s.at(-1)[0] + s.at(-1)[1]) / 2) }));
      fora.sort((a, b) => a.y - b.y);
      for (let k = 1; k < fora.length; k++) fora[k].y = Math.max(fora[k].y, fora[k - 1].y + 14);
      fora.forEach((f) => g.append("text").attr("x", iw + 6).attr("y", f.y).attr("dy", "0.35em").attr("font-size", 11).attr("fill", t.fg2).text(f.nome));
      if (o.caixa) {
        const cg = g.append("g").attr("transform", "translate(14,8)");
        const bw = 188, bh = 12 + o.caixa.length * 30;
        cg.append("rect").attr("width", bw).attr("height", bh).attr("rx", 6).attr("fill", t.bg).attr("stroke", t.grade);
        cg.append("rect").attr("width", 3).attr("height", bh - 16).attr("y", 8).attr("x", 0).attr("rx", 1.5).attr("fill", t.destaque);
        o.caixa.forEach(([v, desc], k) => {
          const yy = 24 + k * 30;
          cg.append("text").attr("x", 14).attr("y", yy).attr("font-size", 17).attr("font-weight", 650).attr("fill", t.fg).text(v);
          cg.append("text").attr("x", 76).attr("y", yy - 1).attr("font-size", 11).attr("fill", t.fg2).text(desc);
        });
      }
      const cx = g.append("line").attr("y1", 0).attr("y2", ih).attr("stroke", t.fg).attr("opacity", 0);
      const bis = d3.bisector((d) => d).center;
      g.append("rect").attr("width", iw).attr("height", ih).attr("fill", "transparent")
        .on("pointermove", (ev) => {
          const k = bis(ds, x.invert(d3.pointer(ev)[0]));
          cx.attr("x1", x(ds[k])).attr("x2", x(ds[k])).attr("opacity", 0.5);
          tip.mostrar(`<div class="d">${F.mes(ds[k])}</div>` + [...nomes].reverse().map((n) => linhaTip(corDe[n], n, fmt(o.series[n][k]))).join("")
            + `<div class="l" style="border-top:1px solid var(--mc-borda);margin-top:3px;padding-top:3px"><span>Total</span><b>${fmt(tot[k])}</b></div>`,
          x(ds[k]) + m.l, d3.pointer(ev)[1] + m.t);
        })
        .on("pointerleave", () => { cx.attr("opacity", 0); tip.esconder(); });
    });
  }

  // ================================================================== dispersão
  function dispersao(plot, o) {
    const P = o.pontos;
    const fx = o.fmtX || ((v) => F.pct(v)), fy = o.fmtY || ((v) => F.pct(v));
    const grupos = [...new Set(P.map((p) => p.grupo))];
    if (grupos.length > 1) legenda(plot, grupos.map((gname, i) => [gname, o.cores?.[gname] || `s${i + 1}`, "ponto"]));
    return montar(plot, o.altura || 360, ({ svg, w, h, t, tip }) => {
      const corDe = Object.fromEntries(grupos.map((gname, i) => [gname, cor(t, o.cores?.[gname], i)]));
      const y = d3.scaleLinear().domain(o.dominioY || d3.extent(P, (p) => p.y)).nice();
      const ticks = y.ticks(6);
      const m = { t: 10, r: 14, b: 40, l: d3.max(ticks, (v) => larguraTexto(fy(v))) + 10 };
      const iw = w - m.l - m.r, ih = h - m.t - m.b;
      y.range([ih, 0]);
      const x = d3.scaleLinear().domain(o.dominioX || [0, d3.max(P, (p) => p.x) * 1.08]).nice().range([0, iw]);
      const r = d3.scaleSqrt().domain([0, d3.max(P, (p) => p.tamanho || 1)]).range([3.5, o.raioMax || 26]);
      const g = svg.append("g").attr("transform", `translate(${m.l},${m.t})`);
      eixoY(g, y, iw, t, fy, ticks);
      const xt = x.ticks(6);
      g.selectAll("line.vx").data(xt).join("line").attr("class", "vx").attr("x1", x).attr("x2", x).attr("y1", 0).attr("y2", ih).attr("stroke", t.grade);
      g.selectAll("text.tx").data(xt).join("text").attr("class", "tx").attr("x", x).attr("y", ih + 17).attr("text-anchor", "middle")
        .attr("fill", t.fg3).attr("font-size", 11).text(fx);
      g.append("line").attr("x1", 0).attr("x2", iw).attr("y1", ih).attr("y2", ih).attr("stroke", t.eixo);
      if (o.tituloX) g.append("text").attr("x", iw).attr("y", ih + 34).attr("text-anchor", "end").attr("fill", t.fg2).attr("font-size", 11).text(o.tituloX);
      const ordem = [...P].sort((a, b) => (b.tamanho || 1) - (a.tamanho || 1));
      const bol = g.append("g").selectAll("circle").data(ordem).join("circle")
        .attr("cx", (p) => x(p.x)).attr("cy", (p) => y(p.y)).attr("r", (p) => r(p.tamanho || 1))
        .attr("fill", (p) => corDe[p.grupo]).attr("fill-opacity", 0.88).attr("stroke", t.bg).attr("stroke-width", 1.2);
      // rótulos sem colisão (guloso, 8 posições)
      const ocup = P.map((p) => { const rr = r(p.tamanho || 1); return { x0: x(p.x) - rr, x1: x(p.x) + rr, y0: y(p.y) - rr, y1: y(p.y) + rr, p }; });
      const sobrep = (a, b) => a.x0 < b.x1 && a.x1 > b.x0 && a.y0 < b.y1 && a.y1 > b.y0;
      const lab = g.append("g");
      [...P].sort((a, b) => b.y - a.y).forEach((p) => {
        const rr = r(p.tamanho || 1) + 4, tw = larguraTexto(p.nome, 11.5), th = 13;
        const cands = [[rr, 0, "start"], [-rr, 0, "end"], [0, -rr - 4, "middle"], [0, rr + 9, "middle"],
          [rr * 0.75, -rr * 0.75, "start"], [-rr * 0.75, -rr * 0.75, "end"], [rr * 0.75, rr * 0.8, "start"], [-rr * 0.75, rr * 0.8, "end"]];
        for (const [dx, dy, anc] of cands) {
          const lx = x(p.x) + dx, ly = y(p.y) + dy;
          const bx0 = anc === "start" ? lx : anc === "end" ? lx - tw : lx - tw / 2;
          const caixa = { x0: bx0, x1: bx0 + tw, y0: ly - th / 2, y1: ly + th / 2 };
          const bate = ocup.some((q) => q.p !== p && sobrep(caixa, q)) || caixa.x0 < 0 || caixa.x1 > iw || caixa.y0 < 0 || caixa.y1 > ih;
          if (!bate) {
            ocup.push(caixa);
            lab.append("text").attr("x", lx).attr("y", ly).attr("dy", "0.35em").attr("text-anchor", anc).attr("font-size", 11.5)
              .attr("fill", t.fg).attr("font-weight", (p.tamanho || 0) > d3.max(P, (q) => q.tamanho || 0) * 0.3 ? 650 : 400).text(p.nome);
            return;
          }
        }
      });
      bol.on("pointerenter", function (ev, p) {
        d3.select(this).attr("fill-opacity", 1).attr("stroke", t.fg);
        tip.mostrar(`<div class="d">${p.nome}</div>${linhaTip(corDe[p.grupo], o.rotuloY || "Retorno", fy(p.y))}${linhaTip(corDe[p.grupo], o.rotuloX || "Volatilidade", fx(p.x))}`
          + (o.fmtTamanho ? linhaTip(corDe[p.grupo], o.rotuloTamanho || "Tamanho", o.fmtTamanho(p.tamanho)) : ""), x(p.x) + m.l, y(p.y) + m.t);
      }).on("pointerleave", function () { d3.select(this).attr("fill-opacity", 0.88).attr("stroke", t.bg); tip.esconder(); });
    });
  }

  // ====================================================================== leque
  function leque(plot, o) {
    const hst = datas(o.historico);
    const qs = Object.keys(o.quantis).map(Number).sort((a, b) => a - b);
    const Q = Object.fromEntries(qs.map((q) => [q, datas(o.quantis[String(q)])]));
    const fmt = o.fmt || ((v) => F.num(v));
    const pares = [];
    for (let i = 0; i < Math.floor(qs.length / 2); i++) pares.push([qs[i], qs[qs.length - 1 - i]]);
    const med = Q[0.5] || Q[qs[Math.floor(qs.length / 2)]];
    legenda(plot, [[o.nomeHistorico || "Histórico", "fg", "linha"], ["Mediana", "fg", "tracejada"],
      ...pares.map(([a, b], i) => [`Intervalo de ${Math.round((b - a) * 100)}%`, "destaque", "barra", 0.3 + 0.35 * i])]);
    return montar(plot, o.altura || 340, ({ svg, w, h, t, tip }) => {
      const todos = [...hst.map((p) => p[1]), ...Object.values(Q).flatMap((s) => s.map((p) => p[1]))];
      const lo = d3.min(todos), hi = d3.max(todos);
      const y = o.log ? d3.scaleLog().domain([lo * 0.9, hi * 1.1]) : d3.scaleLinear().domain([0, hi]).nice();
      const ticks = o.log ? ticksLog(lo, hi) : y.ticks(5);
      const m = { t: 18, r: 112, b: 26, l: d3.max(ticks, (v) => larguraTexto(fmt(v))) + 10 };
      const iw = w - m.l - m.r, ih = h - m.t - m.b;
      y.range([ih, 0]);
      const x = d3.scaleTime().domain([hst[0][0], med.at(-1)[0]]).range([0, iw]);
      const g = svg.append("g").attr("transform", `translate(${m.l},${m.t})`);
      const x0 = x(med[0][0]);
      g.append("rect").attr("x", x0).attr("width", iw - x0).attr("height", ih).attr("fill", t.sombra);
      eixoY(g, y, iw, t, fmt, ticks);
      eixoX(g, x, ih, t, "ano");
      pares.forEach(([a, b], i) => {
        const ar = d3.area().x((p, k) => x(p[0])).y0((p, k) => y(Q[a][k][1])).y1((p, k) => y(Q[b][k][1])).curve(d3.curveMonotoneX);
        g.append("path").datum(med).attr("fill", t.destaque).attr("fill-opacity", 0.16 + 0.2 * i).attr("d", ar);
        const yb = y(Q[b].at(-1)[1]);
        g.append("text").attr("x", iw + 6).attr("y", yb).attr("dy", "0.35em").attr("fill", t.fg3).attr("font-size", 10.5)
          .text(`${Math.round((b - a) * 100)}%: ${fmt(Q[b].at(-1)[1])}`);
      });
      const ln = d3.line().x((p) => x(p[0])).y((p) => y(p[1])).curve(d3.curveMonotoneX);
      g.append("path").datum(hst).attr("fill", "none").attr("stroke", t.fg).attr("stroke-width", 1.8).attr("d", ln);
      g.append("path").datum(med).attr("fill", "none").attr("stroke", t.fg).attr("stroke-width", 1.5).attr("stroke-dasharray", "5 4").attr("d", ln);
      g.append("line").attr("x1", x0).attr("x2", x0).attr("y1", 0).attr("y2", ih).attr("stroke", t.fg3);
      g.append("text").attr("x", x0 + 6).attr("y", 12).attr("fill", t.fg2).attr("font-size", 10.5).text("Projeção →");
      tags(g, iw - 2, [{ y: y(med.at(-1)[1]), texto: fmt(med.at(-1)[1]), cor: t.destaque, nome: "" }], t);
      const cx = g.append("line").attr("y1", 0).attr("y2", ih).attr("stroke", t.fg3).attr("opacity", 0);
      const bisH = d3.bisector((p) => p[0]).center;
      g.append("rect").attr("width", iw).attr("height", ih).attr("fill", "transparent")
        .on("pointermove", (ev) => {
          const dt = x.invert(d3.pointer(ev)[0]);
          let html, xd;
          if (dt < med[0][0]) {
            const p = hst[bisH(hst, dt)]; xd = x(p[0]);
            html = `<div class="d">${F.mes(p[0])}</div>${linhaTip(t.fg, "Preço", fmt(p[1]))}`;
          } else {
            const k = bisH(med, dt); xd = x(med[k][0]);
            html = `<div class="d">${F.mes(med[k][0])} · projeção</div>` + linhaTip(t.fg, "Mediana", fmt(med[k][1]))
              + pares.map(([a, b]) => linhaTip(t.destaque, `${Math.round((b - a) * 100)}%`, `${fmt(Q[a][k][1])} – ${fmt(Q[b][k][1])}`)).join("");
          }
          cx.attr("x1", xd).attr("x2", xd).attr("opacity", 1);
          tip.mostrar(html, xd + m.l, d3.pointer(ev)[1] + m.t);
        })
        .on("pointerleave", () => { cx.attr("opacity", 0); tip.esconder(); });
    });
  }

  // ================================================================= calendário
  function calendario(plot, o) {
    const fmt = o.fmt || ((v) => F.pct(v, 0));
    const temTotal = o.meses.at(-1) === "Ano";
    return montar(plot, o.altura || (o.anos.length * 30 + 30), ({ svg, w, h, t, tip }) => {
      const m = { t: 22, r: 0, b: 0, l: 42 };
      const nc = o.meses.length - (temTotal ? 1 : 0);
      const gapTot = temTotal ? 10 : 0;
      const cw = (w - m.l - gapTot) / (nc + (temTotal ? 1.25 : 0));
      const ch = (h - m.t) / o.anos.length;
      const lim = o.limite || 0.35;
      const esc = d3.scaleLinear().domain([-lim, 0, lim]).range([t.neg, t.bg, t.pos]).interpolate(d3.interpolateLab).clamp(true);
      const g = svg.append("g").attr("transform", `translate(${m.l},${m.t})`);
      o.meses.forEach((mes, j) => {
        const xx = j < nc ? j * cw + cw / 2 : nc * cw + gapTot + cw * 0.625;
        g.append("text").attr("x", xx).attr("y", -8).attr("text-anchor", "middle").attr("fill", j < nc ? t.fg2 : t.fg)
          .attr("font-size", 11).attr("font-weight", j < nc ? 400 : 650).text(mes);
      });
      o.anos.forEach((ano, i) => {
        g.append("text").attr("x", -8).attr("y", i * ch + ch / 2).attr("dy", "0.35em").attr("text-anchor", "end").attr("fill", t.fg2).attr("font-size", 11).text(ano);
        o.valores[i].forEach((v, j) => {
          if (v == null) return;
          const tot = j >= nc;
          const xx = tot ? nc * cw + gapTot : j * cw, ww = tot ? cw * 1.25 : cw;
          const c = tot ? t.sombra : esc(v);
          const cel = g.append("g");
          cel.append("rect").attr("x", xx + 1).attr("y", i * ch + 1).attr("width", ww - 2).attr("height", ch - 2).attr("rx", 3).attr("fill", c)
            .attr("stroke", "transparent").attr("stroke-width", 1.5);
          cel.append("text").attr("x", xx + ww / 2).attr("y", i * ch + ch / 2).attr("dy", "0.35em").attr("text-anchor", "middle")
            .attr("font-size", cw < 40 ? 10 : 11).attr("font-weight", tot ? 650 : 450)
            .attr("fill", tot ? (v >= 0 ? t.pos : t.neg) : Math.abs(v) > lim * 0.55 ? textoSobre(c) : t.fg).text(fmt(v));
          cel.on("pointerenter", function () {
            d3.select(this).select("rect").attr("stroke", t.fg);
            tip.mostrar(`<div class="d">${tot ? "Ano de " + ano : o.meses[j] + " de " + ano}</div>${linhaTip(v >= 0 ? t.pos : t.neg, "Retorno", F.pct(v, 1, true))}`, xx + ww / 2 + m.l, i * ch + m.t);
          }).on("pointerleave", function () { d3.select(this).select("rect").attr("stroke", "transparent"); tip.esconder(); });
        });
      });
    });
  }

  // ==================================================================== cascata
  function cascata(plot, o) {
    const fmt = o.fmt || ((v, s) => F.num(v, 1, s));
    return montar(plot, o.altura || 300, ({ svg, w, h, t, tip }) => {
      const barras = [];
      let nivel = o.inicio[1];
      barras.push({ nome: o.inicio[0], b: 0, v: nivel, tipo: "total" });
      for (const [nome, v] of o.passos) {
        if (v == null) { barras.push({ nome, b: 0, v: nivel, tipo: "total", sub: true }); continue; }
        barras.push({ nome, b: v >= 0 ? nivel : nivel + v, v, tipo: v >= 0 ? "pos" : "neg", acum: nivel + v }); nivel += v;
      }
      barras.push({ nome: o.fim, b: 0, v: nivel, tipo: "total" });
      const m = { t: 22, r: 4, b: 40, l: 4 };
      const iw = w - m.l - m.r, ih = h - m.t - m.b;
      const x = d3.scaleBand().domain(barras.map((d) => d.nome)).range([0, iw]).padding(0.32);
      const y = d3.scaleLinear().domain([0, d3.max(barras, (d) => d.b + Math.abs(d.v)) * 1.08]).range([ih, 0]);
      const g = svg.append("g").attr("transform", `translate(${m.l},${m.t})`);
      g.append("line").attr("x1", 0).attr("x2", iw).attr("y1", ih).attr("y2", ih).attr("stroke", t.eixo);
      barras.forEach((d, i) => {
        const topo = d.b + Math.abs(d.v);
        const c = d.tipo === "total" ? t.fg2 : d.tipo === "pos" ? t.pos : t.neg;
        const r = g.append("rect").attr("x", x(d.nome)).attr("width", x.bandwidth()).attr("y", y(topo)).attr("height", y(d.b) - y(topo))
          .attr("rx", 2).attr("fill", c).attr("fill-opacity", d.sub ? 0.55 : d.tipo === "total" ? 0.9 : 1);
        r.on("pointerenter", function () {
          d3.select(this).attr("fill-opacity", 0.7);
          tip.mostrar(`<div class="d">${d.nome}</div>${linhaTip(c, d.tipo === "total" ? "Total" : "Contribuição", d.tipo === "total" ? fmt(d.v) : fmt(d.v, true))}`
            + (d.acum != null ? linhaTip(t.fg3, "Acumulado", fmt(d.acum)) : ""), x(d.nome) + x.bandwidth() / 2 + m.l, y(topo) + m.t);
        }).on("pointerleave", function () { d3.select(this).attr("fill-opacity", d.tipo === "total" ? 0.9 : 1); tip.esconder(); });
        const neg = d.tipo === "neg";
        g.append("text").attr("x", x(d.nome) + x.bandwidth() / 2).attr("y", neg ? y(d.b) + 14 : y(topo) - 6).attr("text-anchor", "middle")
          .attr("font-size", 11.5).attr("font-weight", d.tipo === "total" ? 700 : 500).attr("fill", t.fg)
          .text(d.tipo === "total" ? fmt(d.v) : fmt(d.v, true));
        if (i < barras.length - 1) {
          const nv = d.tipo === "neg" ? d.b : topo;
          g.append("line").attr("x1", x(d.nome) + x.bandwidth()).attr("x2", x(barras[i + 1].nome)).attr("y1", y(nv)).attr("y2", y(nv))
            .attr("stroke", t.fg3).attr("stroke-dasharray", "2 2");
        }
        const palavras = d.nome.split(" ");
        const lin = palavras.length > 1 && larguraTexto(d.nome) > x.step() ? [palavras.slice(0, Math.ceil(palavras.length / 2)).join(" "), palavras.slice(Math.ceil(palavras.length / 2)).join(" ")] : [d.nome];
        lin.forEach((l, k) => g.append("text").attr("x", x(d.nome) + x.bandwidth() / 2).attr("y", ih + 16 + k * 13).attr("text-anchor", "middle")
          .attr("font-size", 11).attr("fill", t.fg2).text(l));
      });
    });
  }

  // ========================================================= barras horizontais
  function barrasHorizontais(plot, o) {
    const fmt = o.fmt || ((v) => F.pct(v, 0, true));
    const dados = [...o.dados].sort((a, b) => b[1] - a[1]);
    return montar(plot, o.altura || dados.length * 26 + 30, ({ svg, w, h, t, tip }) => {
      const m = { t: o.referencia ? 22 : 4, r: 44, b: 4, l: d3.max(dados, (d) => larguraTexto(d[0], 11.5)) + 12 };
      const iw = w - m.l - m.r, ih = h - m.t - m.b;
      const y = d3.scaleBand().domain(dados.map((d) => d[0])).range([0, ih]).padding(0.3);
      const ext = d3.extent([0, ...dados.map((d) => d[1])]);
      const amp = ext[1] - ext[0];
      const x = d3.scaleLinear().domain([ext[0] < 0 ? ext[0] - amp * 0.3 : 0, ext[1]]).range([0, iw]);
      const g = svg.append("g").attr("transform", `translate(${m.l},${m.t})`);
      if (o.referencia) {
        const xr = x(o.referencia[0]);
        g.append("line").attr("x1", xr).attr("x2", xr).attr("y1", -6).attr("y2", ih).attr("stroke", t.fg2).attr("stroke-dasharray", "3 3");
        g.append("text").attr("x", xr).attr("y", -10).attr("text-anchor", "middle").attr("fill", t.fg2).attr("font-size", 10.5).text(o.referencia[1]);
      }
      dados.forEach(([nome, v]) => {
        const c = o.polaridade === false ? (o.destaque?.includes(nome) ? t.destaque : t.outros) : v >= 0 ? t.pos : t.neg;
        const yy = y(nome);
        g.append("text").attr("x", -10).attr("y", yy + y.bandwidth() / 2).attr("dy", "0.35em")
          .attr("text-anchor", "end").attr("fill", t.fg).attr("font-size", 11.5).text(nome);
        const r = g.append("rect").attr("x", Math.min(x(0), x(v))).attr("width", Math.abs(x(v) - x(0))).attr("y", yy).attr("height", y.bandwidth())
          .attr("rx", 2).attr("fill", c);
        g.append("text").attr("x", x(v) + (v >= 0 ? 6 : -6)).attr("y", yy + y.bandwidth() / 2).attr("dy", "0.35em")
          .attr("text-anchor", v >= 0 ? "start" : "end").attr("font-size", 11.5).attr("font-weight", 550).attr("fill", t.fg)
          .attr("paint-order", "stroke").attr("stroke", t.bg).attr("stroke-width", 4).attr("stroke-linejoin", "round").text(fmt(v));
        r.on("pointerenter", function () { d3.select(this).attr("opacity", 0.75); tip.mostrar(`<div class="d">${nome}</div>${linhaTip(c, o.rotulo || "Valor", fmt(v))}`, x(v) + m.l, yy + m.t); })
          .on("pointerleave", function () { d3.select(this).attr("opacity", 1); tip.esconder(); });
      });
      g.append("line").attr("x1", x(0)).attr("x2", x(0)).attr("y1", 0).attr("y2", ih).attr("stroke", t.eixo);
    });
  }

  // ====================================================== utilidades extras
  function eixoXIndice(g, x, h, t, rotulos, n = 6) {
    const passo = Math.max(1, Math.ceil(rotulos.length / n));
    const gx = g.append("g").attr("transform", `translate(0,${h})`);
    gx.append("line").attr("x1", 0).attr("x2", x.range()[1]).attr("stroke", t.eixo).attr("shape-rendering", "crispEdges");
    rotulos.forEach((r, i) => {
      if (i % passo) return;
      const xx = x(i) + (x.bandwidth ? x.bandwidth() / 2 : 0);
      gx.append("line").attr("x1", xx).attr("x2", xx).attr("y2", 4).attr("stroke", t.eixo);
      gx.append("text").attr("x", xx).attr("y", 17).attr("text-anchor", "middle").attr("fill", t.fg2).attr("font-size", 11).text(r);
    });
  }
  function caixaStats(g, x, y, itens, t, largura = 170) {
    const cg = g.append("g").attr("transform", `translate(${x},${y})`);
    const bh = 10 + itens.length * 19;
    cg.append("rect").attr("width", largura).attr("height", bh).attr("rx", 6).attr("fill", t.bg).attr("fill-opacity", 0.92).attr("stroke", t.grade);
    cg.append("rect").attr("width", 3).attr("height", bh - 14).attr("y", 7).attr("rx", 1.5).attr("fill", t.destaque);
    itens.forEach(([rot, val], k) => {
      cg.append("text").attr("x", 12).attr("y", 19 + k * 19).attr("font-size", 11).attr("fill", t.fg2).text(rot);
      cg.append("text").attr("x", largura - 10).attr("y", 19 + k * 19).attr("text-anchor", "end").attr("font-size", 11.5).attr("font-weight", 650).attr("fill", t.fg).text(val);
    });
  }
  const media = (a) => d3.mean(a);

  // ============================================== velas / OHLC / Heikin-Ashi
  function velas(plot, o) {
    let D = o.dados.map(([d, op, hi, lo, cl, v]) => ({ d: parse(d), o: op, h: hi, l: lo, c: cl, v }));
    if (o.tipo === "heikin") {
      const ha = [];
      D.forEach((k, i) => {
        const c = (k.o + k.h + k.l + k.c) / 4;
        const op = i ? (ha[i - 1].o + ha[i - 1].c) / 2 : (k.o + k.c) / 2;
        ha.push({ ...k, o: op, c, h: Math.max(k.h, op, c), l: Math.min(k.l, op, c) });
      });
      D = ha;
    }
    const fmt = o.fmt || ((v) => F.num(v));
    const mas = (o.medias || []).map((n) => ({ n, v: D.map((_, i) => (i + 1 >= n ? d3.mean(D.slice(i + 1 - n, i + 1), (k) => k.c) : null)) }));
    const corMa = ["s3", "s4", "s2"];
    legenda(plot, [
      [o.tipo === "ohlc" ? "Barra de alta" : "Alta", "pos", "barra"], [o.tipo === "ohlc" ? "Barra de baixa" : "Baixa", "neg", "barra"],
      ...mas.map((m, i) => [`Média ${m.n}d`, corMa[i], "linha"]),
    ]);
    return montar(plot, o.altura || 400, ({ svg, w, h, t, tip }) => {
      const volH = o.volume === false ? 0 : Math.round(h * 0.2);
      const ticks0 = d3.scaleLinear().domain([d3.min(D, (k) => k.l), d3.max(D, (k) => k.h)]).nice().ticks(6);
      const m = { t: 10, r: 70, b: 26, l: d3.max(ticks0, (v) => larguraTexto(fmt(v))) + 10 };
      const iw = w - m.l - m.r, ih = h - m.t - m.b - (volH ? volH + 12 : 0);
      const x = d3.scaleBand().domain(d3.range(D.length)).range([0, iw]).padding(0.28);
      const y = d3.scaleLinear().domain([d3.min(D, (k) => k.l), d3.max(D, (k) => k.h)]).nice().range([ih, 0]);
      const g = svg.append("g").attr("transform", `translate(${m.l},${m.t})`);
      eixoY(g, y, iw, t, fmt, y.ticks(6));
      const bw = x.bandwidth();
      const cx = (i) => x(i) + bw / 2;
      D.forEach((k, i) => {
        const c = k.c >= k.o ? t.pos : t.neg;
        if (o.tipo === "ohlc") {
          g.append("line").attr("x1", cx(i)).attr("x2", cx(i)).attr("y1", y(k.h)).attr("y2", y(k.l)).attr("stroke", c).attr("stroke-width", 1.2);
          g.append("line").attr("x1", x(i) - 0.5).attr("x2", cx(i)).attr("y1", y(k.o)).attr("y2", y(k.o)).attr("stroke", c).attr("stroke-width", 1.2);
          g.append("line").attr("x1", cx(i)).attr("x2", x(i) + bw + 0.5).attr("y1", y(k.c)).attr("y2", y(k.c)).attr("stroke", c).attr("stroke-width", 1.2);
        } else {
          g.append("line").attr("x1", cx(i)).attr("x2", cx(i)).attr("y1", y(k.h)).attr("y2", y(k.l)).attr("stroke", c).attr("stroke-width", 1);
          g.append("rect").attr("x", x(i)).attr("width", bw).attr("y", y(Math.max(k.o, k.c)))
            .attr("height", Math.max(1, Math.abs(y(k.o) - y(k.c)))).attr("fill", c).attr("rx", Math.min(1, bw / 4));
        }
      });
      mas.forEach((mm, j) => {
        g.append("path").datum(mm.v.map((v, i) => [i, v]).filter((p) => p[1] != null)).attr("fill", "none")
          .attr("stroke", cor(t, corMa[j])).attr("stroke-width", 1.5)
          .attr("d", d3.line().x((p) => cx(p[0])).y((p) => y(p[1])).curve(d3.curveMonotoneX));
      });
      const ult = D.at(-1);
      tags(g, iw, [{ y: y(ult.c), texto: fmt(ult.c), cor: ult.c >= ult.o ? t.pos : t.neg }], t);
      g.append("line").attr("x1", 0).attr("x2", iw).attr("y1", y(ult.c)).attr("y2", y(ult.c)).attr("stroke", ult.c >= ult.o ? t.pos : t.neg)
        .attr("stroke-dasharray", "2 3").attr("opacity", 0.6);
      const rot = D.map((k) => F.mes(k.d));
      const rotUnico = rot.map((r, i) => (i && rot[i - 1] === r ? "" : r));
      const idxMes = rotUnico.map((r, i) => (r ? i : -1)).filter((i) => i >= 0);
      const gx = g.append("g").attr("transform", `translate(0,${ih + (volH ? volH + 12 : 0)})`);
      gx.append("line").attr("x2", iw).attr("stroke", t.eixo);
      idxMes.forEach((i) => { if (i === 0) return; gx.append("line").attr("x1", x(i)).attr("x2", x(i)).attr("y2", 4).attr("stroke", t.eixo);
        gx.append("text").attr("x", x(i) + 3).attr("y", 17).attr("fill", t.fg2).attr("font-size", 11).text(rotUnico[i]); });
      if (volH) {
        const gv = g.append("g").attr("transform", `translate(0,${ih + 12})`);
        const yv = d3.scaleLinear().domain([0, d3.max(D, (k) => k.v)]).range([volH, 0]);
        gv.append("text").attr("x", -8).attr("y", 8).attr("text-anchor", "end").attr("fill", t.fg3).attr("font-size", 10.5).text("Vol.");
        D.forEach((k, i) => gv.append("rect").attr("x", x(i)).attr("width", bw).attr("y", yv(k.v)).attr("height", volH - yv(k.v))
          .attr("fill", k.c >= k.o ? t.pos : t.neg).attr("opacity", 0.45));
      }
      const linhaV = g.append("line").attr("y1", 0).attr("y2", ih + (volH ? volH + 12 : 0)).attr("stroke", t.fg3).attr("opacity", 0);
      g.append("rect").attr("width", iw).attr("height", ih + volH + 12).attr("fill", "transparent")
        .on("pointermove", (ev) => {
          const [mx, my] = d3.pointer(ev);
          const i = Math.max(0, Math.min(D.length - 1, Math.floor(mx / x.step())));
          const k = D[i], ant = D[i - 1] || k;
          linhaV.attr("x1", cx(i)).attr("x2", cx(i)).attr("opacity", 1);
          const c = k.c >= k.o ? t.pos : t.neg;
          tip.mostrar(`<div class="d">${F.dia(k.d)}${o.tipo === "heikin" ? " · Heikin-Ashi" : ""}</div>`
            + linhaTip(t.fg3, "Abertura", fmt(k.o)) + linhaTip(t.fg3, "Máxima", fmt(k.h)) + linhaTip(t.fg3, "Mínima", fmt(k.l))
            + linhaTip(c, "Fechamento", fmt(k.c)) + linhaTip(c, "Variação", F.pct(k.c / ant.c - 1, 1, true))
            + (k.v != null ? linhaTip(t.fg3, "Volume", F.num(k.v, 1) + " mil BTC") : ""), cx(i) + m.l, my + m.t);
        })
        .on("pointerleave", () => { linhaV.attr("opacity", 0); tip.esconder(); });
    });
  }

  // ====================================================================== renko
  function renko(plot, o) {
    const fech = o.dados.map(([d, op, hi, lo, c]) => [parse(d), c ?? op]);
    const fmt = o.fmt || ((v) => F.num(v));
    const tam = o.tijolo || Math.round(fech.at(-1)[1] * 0.02 / 500) * 500 || 1;
    const tij = [];
    let topo = Math.floor(fech[0][1] / tam) * tam + tam, base = topo - tam, dir = 0;
    for (const [d, c] of fech) {
      while (c >= topo + tam && dir >= 0 || (dir < 0 && c >= topo + 2 * tam)) {
        if (dir < 0) { base = topo; topo = base + tam; } else { base = topo; topo += tam; }
        tij.push({ b: base, t: topo, up: true, d }); dir = 1;
      }
      while (c <= base - tam && dir <= 0 || (dir > 0 && c <= base - 2 * tam)) {
        if (dir > 0) { topo = base; base = topo - tam; } else { topo = base; base -= tam; }
        tij.push({ b: base, t: topo, up: false, d }); dir = -1;
      }
    }
    legenda(plot, [[`Tijolo de alta (${fmt(tam)})`, "pos", "barra"], ["Tijolo de baixa", "neg", "barra"]]);
    return montar(plot, o.altura || 340, ({ svg, w, h, t, tip }) => {
      const y = d3.scaleLinear().domain([d3.min(tij, (k) => k.b), d3.max(tij, (k) => k.t)]).nice();
      const ticks = y.ticks(6);
      const m = { t: 10, r: 8, b: 26, l: d3.max(ticks, (v) => larguraTexto(fmt(v))) + 10 };
      const iw = w - m.l - m.r, ih = h - m.t - m.b;
      y.range([ih, 0]);
      const x = d3.scaleBand().domain(d3.range(tij.length)).range([0, iw]).padding(0.08);
      const g = svg.append("g").attr("transform", `translate(${m.l},${m.t})`);
      eixoY(g, y, iw, t, fmt, ticks);
      tij.forEach((k, i) => {
        g.append("rect").attr("x", x(i)).attr("width", x.bandwidth()).attr("y", y(k.t)).attr("height", y(k.b) - y(k.t))
          .attr("fill", k.up ? t.pos : "transparent").attr("stroke", k.up ? t.pos : t.neg).attr("stroke-width", 1.2).attr("rx", 1)
          .on("pointerenter", function () { d3.select(this).attr("opacity", 0.7); tip.mostrar(`<div class="d">Tijolo ${i + 1} · ${F.dia(k.d)}</div>${linhaTip(k.up ? t.pos : t.neg, k.up ? "Alta" : "Baixa", `${fmt(k.b)} – ${fmt(k.t)}`)}`, x(i) + m.l, y(k.t) + m.t); })
          .on("pointerleave", function () { d3.select(this).attr("opacity", 1); tip.esconder(); });
      });
      const gx = g.append("g").attr("transform", `translate(0,${ih})`);
      gx.append("line").attr("x2", iw).attr("stroke", t.eixo);
      let ultX = -1e9;
      tij.forEach((k, i) => {
        const r = F.mes(k.d);
        if (i && F.mes(tij[i - 1].d) === r) return;
        if (x(i) - ultX < 56) return;
        ultX = x(i);
        gx.append("line").attr("x1", x(i)).attr("x2", x(i)).attr("y2", 4).attr("stroke", t.eixo);
        gx.append("text").attr("x", x(i) + 3).attr("y", 17).attr("fill", t.fg2).attr("font-size", 11).text(r);
      });
    });
  }

  // ============================================================ ponto e figura
  function pontoFigura(plot, o) {
    const fech = o.dados.map((k) => k[4] ?? k[1]);
    const fmt = o.fmt || ((v) => F.num(v));
    const cx_ = o.caixa || Math.round(fech.at(-1) * 0.015 / 500) * 500 || 1;
    const rev = o.reversao || 3;
    const cols = [];
    let col = null;
    for (const c of fech) {
      const nivel = Math.floor(c / cx_);
      if (!col) { col = { tipo: "X", de: nivel, ate: nivel }; cols.push(col); continue; }
      if (col.tipo === "X") {
        if (nivel > col.ate) col.ate = nivel;
        else if (nivel <= col.ate - rev) { col = { tipo: "O", de: col.ate - 1, ate: nivel }; cols.push(col); }
      } else {
        if (nivel < col.ate) col.ate = nivel;
        else if (nivel >= col.ate + rev) { col = { tipo: "X", de: col.ate + 1, ate: nivel }; cols.push(col); }
      }
    }
    legenda(plot, [[`X: alta de ${fmt(cx_)}`, "pos", "linha"], [`O: queda de ${fmt(cx_)}`, "neg", "linha"], [`Reversão de ${rev} caixas`, "fg3", "linha"]]);
    return montar(plot, o.altura || 360, ({ svg, w, h, t, tip }) => {
      const lo = d3.min(cols, (c) => Math.min(c.de, c.ate)), hi = d3.max(cols, (c) => Math.max(c.de, c.ate));
      const niveis = d3.range(lo, hi + 1);
      const m = { t: 8, r: 8, b: 8, l: larguraTexto(fmt(hi * cx_)) + 12 };
      const iw = w - m.l - m.r, ih = h - m.t - m.b;
      const cw = Math.min(iw / cols.length, 26), ch = ih / niveis.length;
      const lado = cw;
      const y = (n) => ih - (n - lo + 1) * ch;
      const g = svg.append("g").attr("transform", `translate(${m.l},${m.t})`);
      niveis.forEach((n) => {
        if ((n - lo) % Math.ceil(niveis.length / 10)) return;
        g.append("line").attr("x1", 0).attr("x2", cols.length * lado).attr("y1", y(n) + ch / 2).attr("y2", y(n) + ch / 2).attr("stroke", t.grade);
        g.append("text").attr("x", -8).attr("y", y(n) + ch / 2).attr("dy", "0.35em").attr("text-anchor", "end").attr("fill", t.fg3).attr("font-size", 11).text(fmt(n * cx_));
      });
      const r = Math.min(cw, ch) * 0.38;
      cols.forEach((c, i) => {
        const a = Math.min(c.de, c.ate), b = Math.max(c.de, c.ate);
        const gc = g.append("g");
        for (let n = a; n <= b; n++) {
          const xx = i * lado + lado / 2, yy = y(n) + ch / 2;
          if (c.tipo === "X") {
            gc.append("path").attr("d", `M${xx - r},${yy - r}L${xx + r},${yy + r}M${xx + r},${yy - r}L${xx - r},${yy + r}`).attr("stroke", t.pos).attr("stroke-width", 1.4);
          } else {
            gc.append("circle").attr("cx", xx).attr("cy", yy).attr("r", r).attr("fill", "none").attr("stroke", t.neg).attr("stroke-width", 1.4);
          }
        }
        gc.append("rect").attr("x", i * lado).attr("width", lado).attr("y", y(b)).attr("height", (b - a + 1) * ch).attr("fill", "transparent")
          .on("pointerenter", () => tip.mostrar(`<div class="d">Coluna ${i + 1} · ${c.tipo === "X" ? "alta" : "queda"}</div>${linhaTip(c.tipo === "X" ? t.pos : t.neg, "Faixa", `${fmt(a * cx_)} – ${fmt((b + 1) * cx_)}`)}${linhaTip(t.fg3, "Caixas", String(b - a + 1))}`, i * lado + lado + m.l, y(b) + m.t))
          .on("pointerleave", () => tip.esconder());
      });
    });
  }

  // ================================================================= histograma
  function histograma(plot, o) {
    const R = o.retornos;
    const fmt = o.fmt || ((v) => F.pct(v, 0));
    const mu = media(R), sd = d3.deviation(R);
    const q = o.var ?? 0.05;
    const VaR = d3.quantile([...R].sort(d3.ascending), q);
    const ass = d3.mean(R, (r) => ((r - mu) / sd) ** 3);
    const kurt = d3.mean(R, (r) => ((r - mu) / sd) ** 4) - 3;
    legenda(plot, [["Frequência", "s1", "barra"], [`Cauda abaixo do VaR ${Math.round((1 - q) * 100)}%`, "neg", "barra"], ["Normal com mesma média e vol.", "fg2", "tracejada"]]);
    return montar(plot, o.altura || 330, ({ svg, w, h, t, tip }) => {
      const lim = o.limite || d3.quantile([...R].map(Math.abs).sort(d3.ascending), 0.995);
      const x = d3.scaleLinear().domain([-lim, lim]);
      const bins = d3.bin().domain(x.domain()).thresholds(o.bins || 61)(R.filter((r) => Math.abs(r) <= lim));
      const y = d3.scaleLinear().domain([0, d3.max(bins, (b) => b.length) * 1.1]).nice();
      const ticks = y.ticks(5);
      const m = { t: 8, r: 10, b: 26, l: d3.max(ticks, (v) => larguraTexto(F.num(v))) + 10 };
      const iw = w - m.l - m.r, ih = h - m.t - m.b;
      x.range([0, iw]); y.range([ih, 0]);
      const g = svg.append("g").attr("transform", `translate(${m.l},${m.t})`);
      eixoY(g, y, iw, t, (v) => F.num(v), ticks);
      g.selectAll("rect.b").data(bins).join("rect").attr("class", "b")
        .attr("x", (b) => x(b.x0) + 0.5).attr("width", (b) => Math.max(0, x(b.x1) - x(b.x0) - 1))
        .attr("y", (b) => y(b.length)).attr("height", (b) => ih - y(b.length)).attr("rx", 1)
        .attr("fill", (b) => (b.x1 <= VaR ? t.neg : t.s[0])).attr("fill-opacity", (b) => (b.x1 <= VaR ? 1 : 0.85))
        .on("pointerenter", function (ev, b) { d3.select(this).attr("fill-opacity", 0.6);
          tip.mostrar(`<div class="d">${F.pct(b.x0, 1)} a ${F.pct(b.x1, 1)}</div>${linhaTip(t.s[0], "Dias", F.num(b.length))}${linhaTip(t.fg3, "% do total", F.pct(b.length / R.length, 1))}`, x(b.x1) + m.l, y(b.length) + m.t); })
        .on("pointerleave", function (ev, b) { d3.select(this).attr("fill-opacity", b.x1 <= VaR ? 1 : 0.85); tip.esconder(); });
      const larg = (bins[1] || bins[0]).x1 - (bins[1] || bins[0]).x0;
      const pdf = d3.range(-lim, lim, lim / 120).map((v) => [v, R.length * larg * Math.exp(-0.5 * ((v - mu) / sd) ** 2) / (sd * Math.sqrt(2 * Math.PI))]);
      g.append("path").datum(pdf).attr("fill", "none").attr("stroke", t.fg2).attr("stroke-width", 1.4).attr("stroke-dasharray", "4 3")
        .attr("d", d3.line().x((p) => x(p[0])).y((p) => y(p[1])).curve(d3.curveBasis));
      g.append("line").attr("x1", x(VaR)).attr("x2", x(VaR)).attr("y1", 0).attr("y2", ih).attr("stroke", t.neg).attr("stroke-dasharray", "3 3");
      g.append("text").attr("x", x(VaR) - 5).attr("y", 12).attr("text-anchor", "end").attr("fill", t.neg).attr("font-size", 11).attr("font-weight", 600).text(`VaR ${Math.round((1 - q) * 100)}%: ${F.pct(VaR, 1)}`);
      const xt = x.ticks(8);
      const gx = g.append("g").attr("transform", `translate(0,${ih})`);
      gx.append("line").attr("x2", iw).attr("stroke", t.eixo);
      xt.forEach((v) => { gx.append("line").attr("x1", x(v)).attr("x2", x(v)).attr("y2", 4).attr("stroke", t.eixo);
        gx.append("text").attr("x", x(v)).attr("y", 17).attr("text-anchor", "middle").attr("fill", t.fg2).attr("font-size", 11).text(fmt(v)); });
      caixaStats(g, iw - 180, 4, [["Média diária", F.pct(mu, 2)], ["Vol. anualizada", F.pct(sd * Math.sqrt(365), 0)],
        ["Assimetria", F.num(ass, 2)], ["Curtose em excesso", F.num(kurt, 1)], ["Observações", F.num(R.length)]], t, 176);
    });
  }

  // =================================================================== drawdown
  function drawdown(plot, o) {
    const S = datas(o.serie);
    let pico = -Infinity;
    const DD = S.map(([d, v]) => { pico = Math.max(pico, v); return [d, v / pico - 1]; });
    const fmt = o.fmt || ((v) => F.pct(v, 0));
    return montar(plot, o.altura || 300, ({ svg, w, h, t, tip }) => {
      const y = d3.scaleLinear().domain([d3.min(DD, (p) => p[1]) * 1.08, 0]).nice();
      const ticks = y.ticks(5);
      const m = { t: 8, r: 64, b: 26, l: d3.max(ticks, (v) => larguraTexto(fmt(v))) + 10 };
      const iw = w - m.l - m.r, ih = h - m.t - m.b;
      y.range([ih, 0]);
      const x = d3.scaleTime().domain(d3.extent(DD, (p) => p[0])).range([0, iw]);
      const g = svg.append("g").attr("transform", `translate(${m.l},${m.t})`);
      const id = `mcdd${Math.random().toString(36).slice(2, 7)}`;
      const lg = svg.append("defs").append("linearGradient").attr("id", id).attr("x1", 0).attr("x2", 0).attr("y1", 0).attr("y2", 1);
      lg.append("stop").attr("offset", "0%").attr("stop-color", t.neg).attr("stop-opacity", 0.08);
      lg.append("stop").attr("offset", "100%").attr("stop-color", t.neg).attr("stop-opacity", 0.55);
      anotarPeriodos(g, x, ih, t, o.periodos);
      eixoY(g, y, iw, t, fmt, ticks);
      g.append("path").datum(DD).attr("fill", `url(#${id})`).attr("d", d3.area().x((p) => x(p[0])).y0(y(0)).y1((p) => y(p[1])));
      g.append("path").datum(DD).attr("fill", "none").attr("stroke", t.neg).attr("stroke-width", 1.3).attr("d", d3.line().x((p) => x(p[0])).y((p) => y(p[1])));
      g.append("line").attr("x1", 0).attr("x2", iw).attr("stroke", t.eixo);
      eixoX(g, x, ih, t, o.passo || "ano");
      const pior = DD.reduce((a, b) => (b[1] < a[1] ? b : a));
      g.append("circle").attr("cx", x(pior[0])).attr("cy", y(pior[1])).attr("r", 3.5).attr("fill", t.neg).attr("stroke", t.bg).attr("stroke-width", 1.5);
      const aDireita = x(pior[0]) < iw * 0.7;
      g.append("text").attr("x", x(pior[0]) + (aDireita ? 8 : -8)).attr("y", y(pior[1]) + 4).attr("text-anchor", aDireita ? "start" : "end").attr("fill", t.fg).attr("font-size", 11).attr("font-weight", 600)
        .text(`Pior queda: ${F.pct(pior[1], 0)} (${F.mes(pior[0])})`);
      tags(g, iw, [{ y: y(DD.at(-1)[1]), texto: fmt(DD.at(-1)[1]), cor: t.neg, nome: "" }], t);
      const cx = g.append("line").attr("y1", 0).attr("y2", ih).attr("stroke", t.fg3).attr("opacity", 0);
      const bis = d3.bisector((p) => p[0]).center;
      g.append("rect").attr("width", iw).attr("height", ih).attr("fill", "transparent")
        .on("pointermove", (ev) => { const k = bis(DD, x.invert(d3.pointer(ev)[0])); const p = DD[k];
          cx.attr("x1", x(p[0])).attr("x2", x(p[0])).attr("opacity", 1);
          tip.mostrar(`<div class="d">${F.dia(p[0])}</div>${linhaTip(t.neg, "Queda desde o topo", F.pct(p[1], 1))}${linhaTip(t.fg3, "Preço", F.num(S[k][1]))}`, x(p[0]) + m.l, d3.pointer(ev)[1] + m.t); })
        .on("pointerleave", () => { cx.attr("opacity", 0); tip.esconder(); });
    });
  }

  // ============================================================ curva de juros
  function curvaJuros(plot, o) {
    const nomes = Object.keys(o.curvas);
    const fmt = o.fmt || ((v) => F.num(v, 2) + "%");
    const corC = (t, i) => (i === 0 ? t.s[0] : i === 1 ? t.s[1] : t.fg3);
    legenda(plot, nomes.map((n, i) => [n, i === 0 ? "s1" : i === 1 ? "s2" : "fg3", i === 0 ? "linha" : "tracejada"]));
    return montar(plot, o.altura || 320, ({ svg, w, h, t, tip }) => {
      const todos = nomes.flatMap((n) => o.curvas[n]);
      const y = d3.scaleLinear().domain([d3.min(todos) - 0.15, d3.max(todos) + 0.15]).nice();
      const ticks = y.ticks(5);
      const m = { t: 10, r: 70, b: 40, l: d3.max(ticks, (v) => larguraTexto(fmt(v))) + 10 };
      const iw = w - m.l - m.r, ih = h - m.t - m.b;
      y.range([ih, 0]);
      const x = d3.scalePoint().domain(o.prazos).range([0, iw]).padding(0.2);
      const g = svg.append("g").attr("transform", `translate(${m.l},${m.t})`);
      eixoY(g, y, iw, t, fmt, ticks);
      const gx = g.append("g").attr("transform", `translate(0,${ih})`);
      gx.append("line").attr("x2", iw).attr("stroke", t.eixo);
      o.prazos.forEach((p) => { gx.append("line").attr("x1", x(p)).attr("x2", x(p)).attr("y2", 4).attr("stroke", t.eixo);
        gx.append("text").attr("x", x(p)).attr("y", 17).attr("text-anchor", "middle").attr("fill", t.fg2).attr("font-size", 11).text(p); });
      gx.append("text").attr("x", iw).attr("y", 34).attr("text-anchor", "end").attr("fill", t.fg3).attr("font-size", 10.5).text("Prazo até o vencimento →");
      [...nomes].reverse().forEach((n) => {
        const i = nomes.indexOf(n);
        const pts = o.curvas[n].map((v, k) => [o.prazos[k], v]);
        g.append("path").datum(pts).attr("fill", "none").attr("stroke", corC(t, i)).attr("stroke-width", i === 0 ? 2.2 : 1.4)
          .attr("stroke-dasharray", i === 0 ? null : "5 4").attr("d", d3.line().x((p) => x(p[0])).y((p) => y(p[1])).curve(d3.curveMonotoneX));
        if (i === 0) g.selectAll(null).data(pts).join("circle").attr("cx", (p) => x(p[0])).attr("cy", (p) => y(p[1])).attr("r", 3.2)
          .attr("fill", corC(t, 0)).attr("stroke", t.bg).attr("stroke-width", 1.5);
      });
      tags(g, iw, nomes.map((n, i) => ({ y: y(o.curvas[n].at(-1)), texto: fmt(o.curvas[n].at(-1)), cor: corC(t, i), nome: "" })), t);
      if (o.spread) {
        const [a, b] = o.spread, c0 = o.curvas[nomes[0]];
        const va = c0[o.prazos.indexOf(a)], vb = c0[o.prazos.indexOf(b)];
        caixaStats(g, iw * 0.36, 4, [[`Spread ${b} – ${a}`, F.num((vb - va) * 100, 0) + " bps"], ["Inclinação", vb >= va ? "Positiva" : "Invertida"]], t, 170);
      }
      g.append("g").selectAll("rect").data(o.prazos).join("rect").attr("x", (p) => x(p) - x.step() / 2).attr("width", x.step()).attr("height", ih).attr("fill", "transparent")
        .on("pointerenter", (ev, p) => { const k = o.prazos.indexOf(p);
          tip.mostrar(`<div class="d">Vencimento ${p}</div>` + nomes.map((n, i) => linhaTip(corC(t, i), n, fmt(o.curvas[n][k]))).join(""), x(p) + m.l, y(o.curvas[nomes[0]][k]) + m.t); })
        .on("pointerleave", () => tip.esconder());
    });
  }

  // ==================================================================== boxplot
  function boxplot(plot, o) {
    const nomes = Object.keys(o.grupos);
    const fmt = o.fmt || ((v) => F.pct(v, 0));
    const est = nomes.map((n) => {
      const a = [...o.grupos[n]].sort(d3.ascending);
      const q1 = d3.quantile(a, 0.25), q2 = d3.quantile(a, 0.5), q3 = d3.quantile(a, 0.75), iqr = q3 - q1;
      const lo = d3.min(a.filter((v) => v >= q1 - 1.5 * iqr)), hi = d3.max(a.filter((v) => v <= q3 + 1.5 * iqr));
      return { n, a, q1, q2, q3, lo, hi, out: a.filter((v) => v < lo || v > hi), mu: d3.mean(a) };
    });
    legenda(plot, [["Intervalo interquartil (25%–75%)", "s1", "barra"], ["Mediana", "fg", "linha"], ["Fora de 1,5× IQR", "neg", "ponto"]]);
    return montar(plot, o.altura || 320, ({ svg, w, h, t, tip }) => {
      const y = d3.scaleLinear().domain(d3.extent(est.flatMap((e) => e.a))).nice();
      const ticks = y.ticks(6);
      const m = { t: 8, r: 8, b: 26, l: d3.max(ticks, (v) => larguraTexto(fmt(v))) + 10 };
      const iw = w - m.l - m.r, ih = h - m.t - m.b;
      y.range([ih, 0]);
      const x = d3.scaleBand().domain(nomes).range([0, iw]).padding(0.45);
      const g = svg.append("g").attr("transform", `translate(${m.l},${m.t})`);
      eixoY(g, y, iw, t, fmt, ticks);
      est.forEach((e) => {
        const xx = x(e.n), bw = x.bandwidth(), c = xx + bw / 2;
        const gb = g.append("g");
        gb.append("line").attr("x1", c).attr("x2", c).attr("y1", y(e.hi)).attr("y2", y(e.q3)).attr("stroke", t.fg2);
        gb.append("line").attr("x1", c).attr("x2", c).attr("y1", y(e.q1)).attr("y2", y(e.lo)).attr("stroke", t.fg2);
        [e.hi, e.lo].forEach((v) => gb.append("line").attr("x1", c - bw / 4).attr("x2", c + bw / 4).attr("y1", y(v)).attr("y2", y(v)).attr("stroke", t.fg2));
        gb.append("rect").attr("x", xx).attr("width", bw).attr("y", y(e.q3)).attr("height", y(e.q1) - y(e.q3)).attr("rx", 3)
          .attr("fill", t.s[0]).attr("fill-opacity", 0.28).attr("stroke", t.s[0]).attr("stroke-width", 1.2);
        gb.append("line").attr("x1", xx).attr("x2", xx + bw).attr("y1", y(e.q2)).attr("y2", y(e.q2)).attr("stroke", t.fg).attr("stroke-width", 2);
        e.out.forEach((v) => gb.append("circle").attr("cx", c).attr("cy", y(v)).attr("r", 2.8).attr("fill", "none").attr("stroke", t.neg).attr("stroke-width", 1.2));
        gb.append("rect").attr("x", xx - 6).attr("width", bw + 12).attr("y", 0).attr("height", ih).attr("fill", "transparent")
          .on("pointerenter", () => tip.mostrar(`<div class="d">${e.n} · ${e.a.length} observações</div>`
            + linhaTip(t.fg3, "Máximo (sem outliers)", fmt(e.hi)) + linhaTip(t.s[0], "3º quartil", fmt(e.q3)) + linhaTip(t.fg, "Mediana", fmt(e.q2))
            + linhaTip(t.s[0], "1º quartil", fmt(e.q1)) + linhaTip(t.fg3, "Mínimo (sem outliers)", fmt(e.lo)) + linhaTip(t.neg, "Outliers", String(e.out.length)), c + bw / 2 + m.l, y(e.q3) + m.t))
          .on("pointerleave", () => tip.esconder());
      });
      g.append("line").attr("x1", 0).attr("x2", iw).attr("y1", y(0)).attr("y2", y(0)).attr("stroke", t.eixo);
      const gx = g.append("g").attr("transform", `translate(0,${ih})`);
      nomes.forEach((n) => gx.append("text").attr("x", x(n) + x.bandwidth() / 2).attr("y", 17).attr("text-anchor", "middle").attr("fill", t.fg).attr("font-size", 11.5).text(n));
    });
  }

  // ======================================================================= RRG
  function rrg(plot, o) {
    const nomes = Object.keys(o.ativos);
    const Q = (xx, yy) => (xx >= 100 ? (yy >= 100 ? "Liderando" : "Enfraquecendo") : yy >= 100 ? "Melhorando" : "Defasados");
    const corQ = (t, q) => ({ Liderando: t.pos, Enfraquecendo: t.s[2], Defasados: t.neg, Melhorando: t.s[3] }[q]);
    legenda(plot, [["Liderando", "pos", "ponto"], ["Enfraquecendo", "s3", "ponto"], ["Defasados", "neg", "ponto"], ["Melhorando", "s4", "ponto"]]);
    return montar(plot, o.altura || 440, ({ svg, w, h, t, tip }) => {
      const todos = nomes.flatMap((n) => o.ativos[n]);
      const dx = Math.max(...todos.map((p) => Math.abs(p[0] - 100))) * 1.15, dy = Math.max(...todos.map((p) => Math.abs(p[1] - 100))) * 1.15;
      const m = { t: 8, r: 10, b: 36, l: 60 };
      const iw = w - m.l - m.r, ih = h - m.t - m.b;
      const x = d3.scaleLinear().domain([100 - dx, 100 + dx]).range([0, iw]);
      const y = d3.scaleLinear().domain([100 - dy, 100 + dy]).range([ih, 0]);
      const g = svg.append("g").attr("transform", `translate(${m.l},${m.t})`);
      const quad = [["Melhorando", 0, 0], ["Liderando", x(100), 0], ["Defasados", 0, y(100)], ["Enfraquecendo", x(100), y(100)]];
      quad.forEach(([q, qx, qy]) => {
        g.append("rect").attr("x", qx).attr("y", qy).attr("width", qx ? iw - qx : x(100)).attr("height", qy ? ih - qy : y(100)).attr("fill", corQ(t, q)).attr("fill-opacity", 0.07);
        const dir = qx ? iw - 8 : 8, top = qy ? ih - 8 : 16;
        g.append("text").attr("x", dir).attr("y", top).attr("text-anchor", qx ? "end" : "start").attr("fill", corQ(t, q)).attr("font-size", 12).attr("font-weight", 700).attr("letter-spacing", ".04em").text(q.toUpperCase());
      });
      g.append("line").attr("x1", x(100)).attr("x2", x(100)).attr("y1", 0).attr("y2", ih).attr("stroke", t.eixo);
      g.append("line").attr("x1", 0).attr("x2", iw).attr("y1", y(100)).attr("y2", y(100)).attr("stroke", t.eixo);
      x.ticks(6).forEach((v) => g.append("text").attr("x", x(v)).attr("y", ih + 15).attr("text-anchor", "middle").attr("fill", t.fg3).attr("font-size", 10.5).text(F.num(v, 1)));
      y.ticks(6).forEach((v) => g.append("text").attr("x", -6).attr("y", y(v)).attr("dy", "0.35em").attr("text-anchor", "end").attr("fill", t.fg3).attr("font-size", 10.5).text(F.num(v, 1)));
      g.append("text").attr("x", iw).attr("y", ih + 30).attr("text-anchor", "end").attr("fill", t.fg2).attr("font-size", 11).text("Força relativa (RS-Ratio) →");
      g.append("text").attr("transform", `translate(${-48},0) rotate(-90)`).attr("text-anchor", "end").attr("fill", t.fg2).attr("font-size", 11).text("Momento (RS-Momentum) →");
      nomes.forEach((n) => {
        const tr = o.ativos[n], cab = tr.at(-1), c = corQ(t, Q(cab[0], cab[1]));
        g.append("path").datum(tr).attr("fill", "none").attr("stroke", c).attr("stroke-width", 1.3).attr("stroke-opacity", 0.6)
          .attr("d", d3.line().x((p) => x(p[0])).y((p) => y(p[1])).curve(d3.curveCatmullRom));
        tr.slice(0, -1).forEach((p, k) => g.append("circle").attr("cx", x(p[0])).attr("cy", y(p[1])).attr("r", 1.8).attr("fill", c).attr("fill-opacity", 0.25 + 0.6 * k / tr.length));
        g.append("circle").attr("cx", x(cab[0])).attr("cy", y(cab[1])).attr("r", 5.5).attr("fill", c).attr("stroke", t.bg).attr("stroke-width", 1.5)
          .on("pointerenter", () => tip.mostrar(`<div class="d">${n} vs. ${o.benchmark || "benchmark"}</div>${linhaTip(c, "Quadrante", Q(cab[0], cab[1]))}${linhaTip(t.fg3, "RS-Ratio", F.num(cab[0], 2))}${linhaTip(t.fg3, "RS-Momentum", F.num(cab[1], 2))}`, x(cab[0]) + m.l, y(cab[1]) + m.t))
          .on("pointerleave", () => tip.esconder());
        g.append("text").attr("x", x(cab[0]) + 9).attr("y", y(cab[1])).attr("dy", "0.35em").attr("fill", t.fg).attr("font-size", 11.5).attr("font-weight", 650).text(n);
      });
    });
  }

  // ==================================================================== colunas
  function colunas(plot, o) {
    const nomes = Object.keys(o.series);
    const fmt = o.fmt || ((v) => F.num(v, 1));
    legenda(plot, nomes.map((n, i) => [n, o.cores?.[n] || `s${i + 1}`, "barra"]));
    return montar(plot, o.altura || 320, ({ svg, w, h, t, tip }) => {
      const corDe = Object.fromEntries(nomes.map((n, i) => [n, cor(t, o.cores?.[n], i)]));
      const todos = nomes.flatMap((n) => o.series[n]);
      const y = d3.scaleLinear().domain([Math.min(0, d3.min(todos)), d3.max(todos) * 1.12]).nice();
      const ticks = y.ticks(5);
      const m = { t: 18, r: 4, b: 26, l: d3.max(ticks, (v) => larguraTexto(fmt(v))) + 10 };
      const iw = w - m.l - m.r, ih = h - m.t - m.b;
      y.range([ih, 0]);
      const x0 = d3.scaleBand().domain(o.categorias).range([0, iw]).paddingInner(0.28).paddingOuter(0.12);
      const x1 = d3.scaleBand().domain(nomes).range([0, x0.bandwidth()]).padding(0.08);
      const g = svg.append("g").attr("transform", `translate(${m.l},${m.t})`);
      if (o.projecaoDesde) {
        const xp = x0(o.projecaoDesde) - x0.step() * x0.paddingInner() / 2;
        g.append("rect").attr("x", xp).attr("width", iw - xp).attr("height", ih).attr("fill", t.sombra);
        g.append("text").attr("x", xp + 6).attr("y", -6).attr("fill", t.fg3).attr("font-size", 10.5).attr("font-style", "italic").text("Projeção");
      }
      eixoY(g, y, iw, t, fmt, ticks);
      o.categorias.forEach((cat, i) => {
        nomes.forEach((n) => {
          const v = o.series[n][i];
          const xx = x0(cat) + x1(n);
          g.append("rect").attr("x", xx).attr("width", x1.bandwidth()).attr("y", y(Math.max(0, v))).attr("height", Math.abs(y(v) - y(0)))
            .attr("rx", 2).attr("fill", corDe[n])
            .on("pointerenter", function () { d3.select(this).attr("opacity", 0.7); tip.mostrar(`<div class="d">${cat}</div>` + nomes.map((q) => linhaTip(corDe[q], q, fmt(o.series[q][i]))).join("") + (o.margem ? linhaTip(t.fg3, o.margem[0], F.pct(o.series[o.margem[2]][i] / o.series[o.margem[1]][i], 0)) : ""), xx + m.l, y(v) + m.t); })
            .on("pointerleave", function () { d3.select(this).attr("opacity", 1); tip.esconder(); });
          const rotular = o.rotulos === true || (o.rotulos == null && n === nomes[0]) || (Array.isArray(o.rotulos) && o.rotulos.includes(n));
          if (rotular && x1.bandwidth() > 14) g.append("text").attr("x", xx + x1.bandwidth() / 2).attr("y", v >= 0 ? y(v) - 4 : y(v) + 12)
            .attr("text-anchor", "middle").attr("font-size", 10).attr("fill", t.fg2).text(fmt(v));
        });
        g.append("text").attr("x", x0(cat) + x0.bandwidth() / 2).attr("y", ih + 17).attr("text-anchor", "middle").attr("fill", t.fg2).attr("font-size", 11).text(cat);
      });
      g.append("line").attr("x1", 0).attr("x2", iw).attr("y1", y(0)).attr("y2", y(0)).attr("stroke", t.eixo);
    });
  }

  // ============================================================== rosca / pizza
  function rosca(plot, o) {
    const fatias = [...o.fatias].sort((a, b) => b[1] - a[1]);
    const total = d3.sum(fatias, (f) => f[1]);
    return montar(plot, o.altura || 280, ({ svg, w, h, t, tip }) => {
      const corDe = Object.fromEntries(fatias.map(([n], i) => [n, cor(t, o.cores?.[n], i)]));
      const R = Math.min(h / 2 - 6, w * 0.22);
      const cx = R + 6, cy = h / 2;
      const g = svg.append("g").attr("transform", `translate(${cx},${cy})`);
      const arc = d3.arc().innerRadius(o.tipo === "pizza" ? 0 : R * 0.62).outerRadius(R).cornerRadius(o.tipo === "pizza" ? 0 : 2).padAngle(0.012);
      const arcO = d3.arc().innerRadius(o.tipo === "pizza" ? 0 : R * 0.62).outerRadius(R + 5).cornerRadius(2).padAngle(0.012);
      const pie = d3.pie().sort(null).value((f) => f[1])(fatias);
      const legs = svg.append("g").attr("transform", `translate(${cx + R + 30},${cy - fatias.length * 12})`);
      const linhas = [];
      pie.forEach((p, i) => {
        const [n, v] = p.data;
        const path = g.append("path").attr("d", arc(p)).attr("fill", corDe[n]).attr("stroke", t.bg).attr("stroke-width", 1.5);
        const lg = legs.append("g").attr("transform", `translate(0,${i * 24})`);
        lg.append("rect").attr("y", -5).attr("width", 10).attr("height", 10).attr("rx", 2).attr("fill", corDe[n]);
        lg.append("text").attr("x", 18).attr("dy", "0.35em").attr("fill", t.fg).attr("font-size", 12).text(n);
        const wl = Math.max(150, w - (cx + R + 30) - 10);
        lg.append("text").attr("x", wl).attr("dy", "0.35em").attr("text-anchor", "end").attr("fill", t.fg).attr("font-size", 12).attr("font-weight", 650).text(F.pct(v / total, 0));
        lg.append("line").attr("x1", 0).attr("x2", wl).attr("y1", 12).attr("y2", 12).attr("stroke", t.grade);
        const on = () => { path.attr("d", arcO(p)); tip.mostrar(`<div class="d">${n}</div>${linhaTip(corDe[n], "Peso", F.pct(v / total, 1))}${o.fmt ? linhaTip(t.fg3, "Valor", o.fmt(v)) : ""}`, cx + arc.centroid(p)[0], cy + arc.centroid(p)[1]); };
        const off = () => { path.attr("d", arc(p)); tip.esconder(); };
        path.on("pointerenter", on).on("pointerleave", off);
        lg.on("pointerenter", on).on("pointerleave", off);
        linhas.push(lg);
      });
      if (o.centro && o.tipo !== "pizza") {
        g.append("text").attr("text-anchor", "middle").attr("dy", "-0.1em").attr("fill", t.fg).attr("font-size", Math.min(22, R * 0.16)).attr("font-weight", 650).text(o.centro[0]);
        g.append("text").attr("text-anchor", "middle").attr("dy", "1.5em").attr("fill", t.fg2).attr("font-size", 11).text(o.centro[1]);
      }
    });
  }

  // ======================================================= dispersão regressão
  function regressao(plot, o) {
    const P = o.pontos;
    const fx = o.fmtX || ((v) => F.pct(v, 0)), fy = o.fmtY || ((v) => F.pct(v, 0));
    const mx = d3.mean(P, (p) => p[0]), my = d3.mean(P, (p) => p[1]);
    const beta = d3.sum(P, (p) => (p[0] - mx) * (p[1] - my)) / d3.sum(P, (p) => (p[0] - mx) ** 2);
    const alfa = my - beta * mx;
    const r = d3.sum(P, (p) => (p[0] - mx) * (p[1] - my)) / Math.sqrt(d3.sum(P, (p) => (p[0] - mx) ** 2) * d3.sum(P, (p) => (p[1] - my) ** 2));
    legenda(plot, [["Observação diária", "s1", "ponto"], ["Regressão linear (MQO)", "fg", "tracejada"]]);
    return montar(plot, o.altura || 360, ({ svg, w, h, t, tip }) => {
      const lx = d3.quantile(P.map((p) => Math.abs(p[0])).sort(d3.ascending), 0.995) * 1.1;
      const ly = d3.quantile(P.map((p) => Math.abs(p[1])).sort(d3.ascending), 0.995) * 1.1;
      const y = d3.scaleLinear().domain([-ly, ly]).nice();
      const ticks = y.ticks(6);
      const m = { t: 8, r: 12, b: 40, l: d3.max(ticks, (v) => larguraTexto(fy(v))) + 10 };
      const iw = w - m.l - m.r, ih = h - m.t - m.b;
      y.range([ih, 0]);
      const x = d3.scaleLinear().domain([-lx, lx]).nice().range([0, iw]);
      const g = svg.append("g").attr("transform", `translate(${m.l},${m.t})`);
      eixoY(g, y, iw, t, fy, ticks);
      x.ticks(6).forEach((v) => { g.append("line").attr("x1", x(v)).attr("x2", x(v)).attr("y1", 0).attr("y2", ih).attr("stroke", v === 0 ? t.eixo : t.grade);
        g.append("text").attr("x", x(v)).attr("y", ih + 16).attr("text-anchor", "middle").attr("fill", t.fg3).attr("font-size", 11).text(fx(v)); });
      g.append("text").attr("x", iw).attr("y", ih + 33).attr("text-anchor", "end").attr("fill", t.fg2).attr("font-size", 11).text(o.tituloX || "");
      g.append("g").selectAll("circle").data(P.filter((p) => Math.abs(p[0]) < lx && Math.abs(p[1]) < ly)).join("circle")
        .attr("cx", (p) => x(p[0])).attr("cy", (p) => y(p[1])).attr("r", 2.6).attr("fill", t.s[0]).attr("fill-opacity", 0.45);
      g.append("line").attr("x1", x(-lx)).attr("x2", x(lx)).attr("y1", y(alfa - beta * lx)).attr("y2", y(alfa + beta * lx))
        .attr("stroke", t.fg).attr("stroke-width", 1.6).attr("stroke-dasharray", "6 4");
      caixaStats(g, 10, 6, [["Beta", F.num(beta, 2)], ["Correlação", F.num(r, 2)], ["R²", F.num(r * r, 2)], ["Observações", F.num(P.length)]], t, 150);
      if (o.tituloY) g.append("text").attr("x", 6).attr("y", ih - 8).attr("fill", t.fg2).attr("font-size", 11).text(o.tituloY);
    });
  }


  // ============================================ curvas (eixo x numérico)
  // Séries com x numérico (anos desde o início, prazo, nível). series: {nome: [[x, y], ...]}
  function curvas(plot, o) {
    const nomes = Object.keys(o.series);
    const fmtY = o.fmtY || ((v) => F.num(v)), fmtX = o.fmtX || ((v) => F.num(v));
    if (o.etiquetas === false) legenda(plot, nomes.map((n, i) => [n, o.cores?.[n] || `s${i + 1}`, "linha"]));
    return montar(plot, o.altura || 340, ({ svg, w, h, t, tip }) => {
      const corDe = Object.fromEntries(nomes.map((n, i) => [n, cor(t, o.cores?.[n], i)]));
      const todos = nomes.flatMap((n) => o.series[n]);
      const ext = d3.extent(todos, (p) => p[1]);
      const y = o.log ? d3.scaleLog().domain(o.dominioY || [ext[0] * 0.7, ext[1] * 1.4]) : d3.scaleLinear().domain(o.dominioY || ext).nice();
      const ticks = o.log ? (o.ticksY || ticksLog(y.domain()[0], y.domain()[1])) : y.ticks(5);
      const etq = o.etiquetas !== false;
      const maxTag = etq ? d3.max(nomes, (n) => larguraTexto(n, 11)) + 16 : 10;
      const m = { t: 10, r: maxTag, b: o.tituloX ? 40 : 26, l: d3.max(ticks, (v) => larguraTexto(fmtY(v))) + 10 };
      const iw = w - m.l - m.r, ih = h - m.t - m.b;
      y.range([ih, 0]);
      const x = d3.scaleLinear().domain(o.dominioX || d3.extent(todos, (p) => p[0])).range([0, iw]);
      const g = svg.append("g").attr("transform", `translate(${m.l},${m.t})`);
      eixoY(g, y, iw, t, fmtY, ticks);
      const gx = g.append("g").attr("transform", `translate(0,${ih})`);
      gx.append("line").attr("x2", iw).attr("stroke", t.eixo);
      x.ticks(8).forEach((v) => { gx.append("line").attr("x1", x(v)).attr("x2", x(v)).attr("y2", 4).attr("stroke", t.eixo);
        gx.append("text").attr("x", x(v)).attr("y", 17).attr("text-anchor", "middle").attr("fill", t.fg2).attr("font-size", 11).text(fmtX(v)); });
      if (o.tituloX) gx.append("text").attr("x", iw).attr("y", 34).attr("text-anchor", "end").attr("fill", t.fg2).attr("font-size", 11).text(o.tituloX);
      const ln = d3.line().x((p) => x(p[0])).y((p) => y(p[1])).curve(d3.curveMonotoneX);
      const clipId = `mcc${Math.random().toString(36).slice(2, 8)}`;
      svg.append("defs").append("clipPath").attr("id", clipId).append("rect").attr("width", iw + 4).attr("height", ih + 4).attr("y", -2);
      const gl = g.append("g").attr("clip-path", `url(#${clipId})`);
      const fim = [];
      nomes.forEach((n) => {
        const d = o.series[n].filter((p) => p[0] >= x.domain()[0] && p[0] <= x.domain()[1]);
        const dest = !o.destaque || o.destaque.includes(n);
        gl.append("path").datum(d).attr("fill", "none").attr("stroke", corDe[n]).attr("stroke-width", dest ? 2.2 : 1.4)
          .attr("stroke-opacity", dest ? 1 : 0.85).attr("d", ln);
        const ult = d.at(-1);
        g.append("circle").attr("cx", x(ult[0])).attr("cy", y(ult[1])).attr("r", 3).attr("fill", corDe[n]);
        fim.push({ n, x: x(ult[0]), y: y(ult[1]) });
      });
      if (etq) {
        fim.sort((a, b) => a.y - b.y);
        for (let i = 1; i < fim.length; i++) fim[i].y = Math.max(fim[i].y, fim[i - 1].y + 14);
        fim.forEach((f) => { const pos = o.posRotulo?.[f.n]; if (pos) { f.x = x(pos[0]) - 7; f.y = y(pos[1]); } });
        fim.forEach((f) => g.append("text").attr("x", Math.min(f.x, iw) + 7).attr("y", f.y).attr("dy", "0.35em")
          .attr("fill", corDe[f.n]).attr("font-size", 11).attr("font-weight", 600).text(f.n));
      }
      (o.anotacoes || []).forEach((a) => {
        g.append("text").attr("x", x(a.x)).attr("y", y(a.y)).attr("dy", a.dy || -8).attr("text-anchor", a.ancora || "middle")
          .attr("fill", t.fg).attr("font-size", 11).attr("font-weight", 600).text(a.texto);
      });
      const pts = g.append("g");
      g.append("rect").attr("width", iw).attr("height", ih).attr("fill", "transparent")
        .on("pointermove", (ev) => {
          const xv = x.invert(d3.pointer(ev)[0]);
          const vals = nomes.map((n) => { const d = o.series[n]; const i = d3.bisector((p) => p[0]).center(d, xv); return { n, p: d[i] }; })
            .filter((v) => v.p && Math.abs(v.p[0] - xv) < (x.domain()[1] - x.domain()[0]) / 20);
          pts.selectAll("circle").data(vals).join("circle").attr("r", 4).attr("cx", (v) => x(v.p[0])).attr("cy", (v) => y(v.p[1])).attr("fill", (v) => corDe[v.n]);
          if (vals.length) tip.mostrar(`<div class="d">${fmtX(xv)}</div>` + vals.map((v) => linhaTip(corDe[v.n], v.n, fmtY(v.p[1]))).join(""), d3.pointer(ev)[0] + m.l, d3.pointer(ev)[1] + m.t);
        })
        .on("pointerleave", () => { pts.selectAll("*").remove(); tip.esconder(); });
    });
  }


  // ============================================ matriz de correlação (triangular)
  function correlacao(plot, o) {
    const n = o.nomes.length;
    return montar(plot, o.altura || 320, ({ svg, w, h, t, tip }) => {
      const m = { t: 22, r: 4, b: 4, l: d3.max(o.nomes, (s) => larguraTexto(s, 11)) + 10 };
      const lado = Math.min((w - m.l - m.r) / (n - 1), (h - m.t - m.b) / (n - 1));
      const esc = d3.scaleLinear().domain([-1, 0, 1]).range([t.neg, t.bg, t.destaque]).interpolate(d3.interpolateLab);
      const g = svg.append("g").attr("transform", `translate(${m.l},${m.t})`);
      for (let i = 1; i < n; i++) {
        g.append("text").attr("x", -8).attr("y", (i - 1) * lado + lado / 2).attr("dy", "0.35em").attr("text-anchor", "end").attr("fill", t.fg).attr("font-size", 11).text(o.nomes[i]);
        for (let j = 0; j < i; j++) {
          const v = o.matriz[i][j], c = esc(v);
          const cel = g.append("g");
          cel.append("rect").attr("x", j * lado + 1).attr("y", (i - 1) * lado + 1).attr("width", lado - 2).attr("height", lado - 2).attr("rx", 2).attr("fill", c);
          cel.append("text").attr("x", j * lado + lado / 2).attr("y", (i - 1) * lado + lado / 2).attr("dy", "0.35em").attr("text-anchor", "middle")
            .attr("font-size", lado < 34 ? 9.5 : 11).attr("fill", Math.abs(v) > 0.55 ? textoSobre(c) : t.fg).text(F.num(v, 2));
          cel.on("pointerenter", () => tip.mostrar(`<div class="d">${o.nomes[i]} × ${o.nomes[j]}</div>${linhaTip(c, "Correlação", F.num(v, 2))}`, j * lado + lado + m.l, (i - 1) * lado + m.t))
            .on("pointerleave", () => tip.esconder());
        }
        g.append("text").attr("x", (i - 1) * lado + lado / 2).attr("y", (i - 1) * lado - 5).attr("text-anchor", "middle").attr("fill", t.fg).attr("font-size", 10.5).text(o.nomes[i - 1]);
      }
    });
  }

  global.MC = { figura, legenda, linhas, barrasTempo, areaEmpilhada, dispersao, leque, calendario, cascata, barrasHorizontais,
    velas, renko, pontoFigura, histograma, drawdown, curvaJuros, boxplot, rrg, colunas, rosca, regressao, curvas, correlacao, F, MESES };
})(window);
