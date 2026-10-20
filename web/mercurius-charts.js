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
  --mc-s1:#0e2a3b; --mc-s2:#17a398; --mc-s3:#d2a03c; --mc-s4:#3d7cc9; --mc-s5:#8e7cc3; --mc-s6:#d0605e;
}}
:where(:root[data-theme="light"]){
  --mc-bg:#ffffff; --mc-fg:#0e1a24; --mc-fg2:#4a5761; --mc-fg3:#7b8791;
  --mc-grade:#e6ebee; --mc-eixo:#55626c; --mc-sombra:#f1f4f6; --mc-borda:#e3e8ec; --mc-tip-bg:#ffffff;
  --mc-destaque:#138f86; --mc-pos:#138f86; --mc-neg:#cf5c5a; --mc-outros:#b9c4cc;
  --mc-s1:#0e2a3b; --mc-s2:#17a398; --mc-s3:#d2a03c; --mc-s4:#3d7cc9; --mc-s5:#8e7cc3; --mc-s6:#d0605e;
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
.mc-plot{position:relative;min-width:0}
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
    cancelAnimationFrame(agendado);
    agendado = requestAnimationFrame(() => vivos.forEach((f) => f()));
  }
  new MutationObserver(redesenharTodos).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme", "class"] });
  matchMedia("(prefers-color-scheme: light)").addEventListener("change", redesenharTodos);

  function montar(plot, altura, desenhar) {
    const el = typeof plot === "string" ? document.querySelector(plot) : plot;
    let ultimaL = 0;
    const f = () => {
      const w = Math.max(240, Math.round(el.clientWidth));
      el.innerHTML = "";
      const t = tema(el);
      const svg = d3.select(el).append("svg").attr("width", w).attr("height", altura).attr("role", "img");
      const tip = d3.select(el).append("div").attr("class", "mc-tip");
      desenhar({ el, svg, w, h: altura, t, tip: dicas(el, tip) });
      ultimaL = w;
    };
    f();
    vivos.add(f);
    new ResizeObserver(() => { if (Math.abs(el.clientWidth - ultimaL) > 2) f(); }).observe(el);
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

  function legenda(plot, itens) {
    const leg = plot._mcLeg;
    if (!leg) return;
    const t = tema(plot);
    leg.innerHTML = itens.map(([nome, c, tipo]) => {
      const k = tipo === "barra" ? "b" : tipo === "ponto" ? "p" : tipo === "tracejada" ? "t" : "";
      const estilo = tipo === "tracejada" ? `border-color:${cor(t, c)}` : `background:${cor(t, c)}`;
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
      if (p.texto) g.append("text").attr("x", (x0 + x1) / 2).attr("y", 12).attr("text-anchor", "middle")
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
      const maxTag = etq ? d3.max(S, (s) => larguraTexto(fmtTag(s.d.at(-1)[1])) + 10 + larguraTexto(s.nome)) + 16 : 12;
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
      ...pares.map(([a, b], i) => [`Intervalo de ${Math.round((b - a) * 100)}%`, `rgba(80,221,213,${0.18 + 0.2 * i})`, "barra"])]);
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
      for (const [nome, v] of o.passos) { barras.push({ nome, b: v >= 0 ? nivel : nivel + v, v, tipo: v >= 0 ? "pos" : "neg", acum: nivel + v }); nivel += v; }
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
          .attr("rx", 2).attr("fill", c).attr("fill-opacity", d.tipo === "total" ? 0.9 : 1);
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
      const x = d3.scaleLinear().domain([ext[0] < 0 ? ext[0] - amp * 0.16 : 0, ext[1]]).range([0, iw]);
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
          .attr("text-anchor", v >= 0 ? "start" : "end").attr("font-size", 11.5).attr("font-weight", 550).attr("fill", t.fg).text(fmt(v));
        r.on("pointerenter", function () { d3.select(this).attr("opacity", 0.75); tip.mostrar(`<div class="d">${nome}</div>${linhaTip(c, o.rotulo || "Valor", fmt(v))}`, x(v) + m.l, yy + m.t); })
          .on("pointerleave", function () { d3.select(this).attr("opacity", 1); tip.esconder(); });
      });
      g.append("line").attr("x1", x(0)).attr("x2", x(0)).attr("y1", 0).attr("y2", ih).attr("stroke", t.eixo);
    });
  }

  global.MC = { figura, legenda, linhas, barrasTempo, areaEmpilhada, dispersao, leque, calendario, cascata, barrasHorizontais, F, MESES };
})(window);
