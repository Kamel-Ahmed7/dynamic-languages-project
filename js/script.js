const $ = (s) => document.querySelector(s),
  $$ = (s) => [...document.querySelectorAll(s)];
function ctl(box, render, getLen) {
  box.innerHTML =
    '<button data-a="play">▶ تشغيل</button><button data-a="pause">⏸ إيقاف</button><button data-a="next">⏭ خطوة</button><button data-a="reset">↺ إعادة</button><label>السرعة <input type="range" min="1" max="10" value="6"></label><span class="cnt"></span>';
  let k = 0,
    t = null;
  const sp = box.querySelector("input"),
    cnt = box.querySelector(".cnt");
  const draw = () => {
    render(k);
    cnt.textContent = k + " / " + getLen();
  };
  const stop = () => {
    clearTimeout(t);
    t = null;
  };
  const tick = () => {
    if (k >= getLen()) {
      stop();
      return;
    }
    k++;
    draw();
    t = setTimeout(tick, 1100 - sp.value * 100);
  };
  box.onclick = (e) => {
    const a = e.target.dataset.a;
    if (!a) return;
    if (a == "play" && !t) {
      if (k >= getLen()) k = 0;
      tick();
    } else if (a == "pause") stop();
    else if (a == "next") {
      stop();
      if (k < getLen()) k++;
      draw();
    } else if (a == "reset") {
      stop();
      k = 0;
      draw();
    }
  };
  return {
    reset() {
      stop();
      k = 0;
      draw();
    },
    redraw: draw,
  };
}
$$(".tab").forEach(
  (b) =>
    (b.onclick = () => {
      $$(".tab").forEach((x) => x.classList.toggle("on", x == b));
      $$(".panel").forEach((p) =>
        p.classList.toggle("show", p.id == b.dataset.t),
      );
    }),
);

const OP = { match: "تطابق", sub: "استبدال", del: "حذف", ins: "إضافة" };
let mode = "lcs",
  S1;
function solve(a, b, m) {
  const M = a.length,
    N = b.length,
    T = Array.from({ length: M + 1 }, (_, i) =>
      Array.from({ length: N + 1 }, (_, j) =>
        m == "edit" ? (i == 0 ? j : j == 0 ? i : 0) : 0,
      ),
    );
  for (let i = 1; i <= M; i++)
    for (let j = 1; j <= N; j++) {
      const eq = a[i - 1] == b[j - 1];
      T[i][j] =
        m == "lcs"
          ? eq
            ? T[i - 1][j - 1] + 1
            : Math.max(T[i - 1][j], T[i][j - 1])
          : eq
            ? T[i - 1][j - 1]
            : 1 + Math.min(T[i - 1][j], T[i][j - 1], T[i - 1][j - 1]);
    }
  let i = M,
    j = N,
    lcs = "";
  const path = [];
  while (i > 0 || j > 0) {
    let op;
    const eq = i > 0 && j > 0 && a[i - 1] == b[j - 1];
    if (m == "lcs") {
      if (i == 0 || j == 0) break;
      op = eq ? "match" : T[i - 1][j] >= T[i][j - 1] ? "up" : "left";
    } else if (eq && T[i][j] == T[i - 1][j - 1]) op = "match";
    else if (i > 0 && j > 0 && T[i][j] == T[i - 1][j - 1] + 1) op = "sub";
    else if (i > 0 && T[i][j] == T[i - 1][j] + 1) op = "del";
    else op = "ins";
    path.push({ i, j, op });
    if (op == "match") {
      if (m == "lcs") lcs = a[i - 1] + lcs;
      i--;
      j--;
    } else if (op == "sub") {
      i--;
      j--;
    } else if (op == "del" || op == "up") i--;
    else j--;
  }
  path.push({ i, j, op: "end" });
  return { T, path, lcs };
}
const len1 = () => S1.a.length * S1.b.length + S1.s[mode].path.length;
function r1(k) {
  const { a, b, s } = S1,
    { T, path } = s[mode],
    M = a.length,
    N = b.length,
    F = M * N;
  const cur = k > 0 && k <= F ? k - 1 : -1,
    ci = cur >= 0 ? Math.floor(cur / N) + 1 : 0,
    cj = cur >= 0 ? (cur % N) + 1 : 0;
  const pk = k > F ? k - F : 0,
    onp = new Map(path.slice(0, pk).map((p) => [p.i + "," + p.j, p.op]));
  let h =
    "<table><tr><th></th><th>ε</th>" +
    [...b].map((c) => `<th>${c}</th>`).join("") +
    "</tr>";
  for (let i = 0; i <= M; i++) {
    h += `<tr><th>${i ? a[i - 1] : "ε"}</th>`;
    for (let j = 0; j <= N; j++) {
      const vis = i == 0 || j == 0 || (i - 1) * N + j - 1 < k;
      let c = "";
      if (i == ci && j == cj && cur >= 0) c = "cur";
      else if (
        cur >= 0 &&
        ((i == ci - 1 && j == cj) ||
          (i == ci && j == cj - 1) ||
          (i == ci - 1 && j == cj - 1))
      )
        c = "dep";
      if (onp.has(i + "," + j)) c += " path";
      h += `<td class="${c}">${vis ? T[i][j] : ""}</td>`;
    }
    h += "</tr>";
  }
  $("#mx").innerHTML = h + "</table>";
  let t =
    "اضغط تشغيل أو خطوة: سيُملأ الجدول خلية بخلية، ثم يبدأ الرجوع (Backtracking) لاستخراج الحل.";
  if (cur >= 0) {
    const x = a[ci - 1],
      y = b[cj - 1],
      v = T[ci][cj],
      tp = T[ci - 1][cj],
      lf = T[ci][cj - 1],
      dg = T[ci - 1][cj - 1],
      eq = x == y;
    t =
      `الخلية (${ci},${cj}) — مقارنة <b>${x}</b> مع <b>${y}</b>: ` +
      (mode == "lcs"
        ? eq
          ? `متطابقان ⇒ <code>L[${ci}][${cj}] = L[${ci - 1}][${cj - 1}] + 1 = ${v}</code>`
          : `مختلفان ⇒ <code>L[${ci}][${cj}] = max(${tp}, ${lf}) = ${v}</code> (أعلى، يسار)`
        : eq
          ? `متطابقان ⇒ <code>D[${ci}][${cj}] = D[${ci - 1}][${cj - 1}] = ${v}</code>`
          : `مختلفان ⇒ <code>D[${ci}][${cj}] = 1 + min(${tp}, ${lf}, ${dg}) = ${v}</code> (حذف، إضافة، استبدال)`);
  } else if (pk > 0) {
    const p = path[pk - 1],
      x = a[p.i - 1],
      y = b[p.j - 1];
    t = {
      match:
        `رجوع: تطابق <b>${x}</b> ← قطري` +
        (mode == "lcs" ? ` (يُضاف للـ LCS: ${s.lcs.lcs.length} حرف)` : ""),
      up: "رجوع: لا تطابق، نتحرك للأعلى (تجاهل حرف من النص الأول)",
      left: "رجوع: لا تطابق، نتحرك لليسار (تجاهل حرف من النص الثاني)",
      sub: `رجوع: استبدال <b>${x}</b> بـ <b>${y}</b> (تكلفة 1)`,
      del: `رجوع: حذف <b>${x}</b> (تكلفة 1)`,
      ins: `رجوع: إضافة <b>${y}</b> (تكلفة 1)`,
      end: "وصلنا إلى الخلية (0,0): انتهى الرجوع.",
    }[p.op];
  }
  $("#ex1").innerHTML = t;
}
const pl1 = ctl($("#c1"), r1, len1);
function load1() {
  const a = $("#sa").value.slice(0, 12),
    b = $("#sb").value.slice(0, 12);
  S1 = { a, b, s: { lcs: solve(a, b, "lcs"), edit: solve(a, b, "edit") } };
  const L = S1.s.lcs.T[a.length][b.length],
    D = S1.s.edit.T[a.length][b.length],
    sim = (((2 * L) / (a.length + b.length || 1)) * 100).toFixed(1);
  const ops = S1.s.edit.path
    .filter((p) => OP[p.op])
    .reverse()
    .map((p) => `<span class="b ${p.op}">${OP[p.op]}</span>`)
    .join("");
  $("#sum1").innerHTML =
    `<div class="card"><h3>LCS</h3><div class="big">${L}</div><p>أطول تسلسل مشترك: <code>${S1.s.lcs.lcs || "—"}</code><br>نسبة التشابه: ${sim}%<br>الزمن O(m×n) · الذاكرة O(m×n)</p></div>
<div class="card"><h3>Edit Distance</h3><div class="big">${D}</div><p>أقل عدد عمليات تحويل<br>${ops}<br>الزمن O(m×n) · الذاكرة O(m×n)</p></div>`;
  pl1.reset();
}
$("#sa").oninput = $("#sb").oninput = load1;
$$(".chip").forEach(
  (c) =>
    (c.onclick = () => {
      $("#sa").value = c.dataset.a;
      $("#sb").value = c.dataset.b;
      load1();
    }),
);
$$(".seg-b").forEach(
  (b) =>
    (b.onclick = () => {
      mode = b.dataset.m;
      $$(".seg-b").forEach((x) => x.classList.toggle("on", x == b));
      pl1.reset();
    }),
);

const C = 16,
  R = 9,
  NN = C * R;
let cell = Array(NN).fill(0),
  st = 2 * C + 2,
  gl = 4 * C + 13,
  tool = "wall",
  showV = false,
  paint = false,
  rD,
  rA;
const nb = (i) => {
  const r = (i / C) | 0,
    c = i % C,
    o = [];
  if (r > 0) o.push(i - C);
  if (r < R - 1) o.push(i + C);
  if (c > 0) o.push(i - 1);
  if (c < C - 1) o.push(i + 1);
  return o;
};
const hf = (i) =>
  Math.abs(((i / C) | 0) - ((gl / C) | 0)) + Math.abs((i % C) - (gl % C));
const cost = (i) => (cell[i] == 2 ? 5 : 1);
function run(astar) {
  const g = Array(NN).fill(Infinity),
    par = {},
    cl = new Set(),
    ev = [],
    open = [st],
    key = (i) => (astar ? g[i] + hf(i) : g[i]);
  g[st] = 0;
  while (open.length) {
    let b = 0;
    for (let x = 1; x < open.length; x++) {
      const p = open[x],
        q = open[b];
      if (key(p) < key(q) || (astar && key(p) == key(q) && hf(p) < hf(q)))
        b = x;
    }
    const u = open.splice(b, 1)[0];
    if (cl.has(u)) continue;
    cl.add(u);
    const e = { u, up: [] };
    ev.push(e);
    if (u == gl) break;
    for (const v of nb(u)) {
      if (cell[v] == 1 || cl.has(v)) continue;
      const ng = g[u] + cost(v);
      if (ng < g[v]) {
        g[v] = ng;
        par[v] = u;
        open.push(v);
        e.up.push([v, ng]);
      }
    }
  }
  const path = [];
  if (cl.has(gl)) for (let v = gl; v !== undefined; v = par[v]) path.push(v);
  return { ev, path, found: cl.has(gl), cost: g[gl], ex: cl.size };
}
function dg(el, Rs, k, astar) {
  const kk = Math.min(k, Rs.ev.length),
    cl = new Set(),
    g = { [st]: 0 };
  let cur = -1;
  for (let x = 0; x < kk; x++) {
    const e = Rs.ev[x];
    cl.add(e.u);
    cur = e.u;
    for (const [v, ng] of e.up) g[v] = ng;
  }
  const done = kk >= Rs.ev.length,
    pp = new Set(done && Rs.found ? Rs.path : []);
  el.innerHTML = cell
    .map((t, i) => {
      let c = "c" + (t == 1 ? " w" : t == 2 ? " wt" : "");
      if (cl.has(i)) c += " cl";
      else if (g[i] !== undefined) c += " op";
      if (pp.has(i)) c += " pa";
      if (i == cur && !done) c += " cu";
      if (i == st) c += " s";
      if (i == gl) c += " gl";
      let tx = i == st ? "S" : i == gl ? "G" : "";
      if (showV && !tx && t != 1 && g[i] !== undefined)
        tx = astar
          ? `<b>${g[i]}</b><i>${hf(i)}</i><u>${g[i] + hf(i)}</u>`
          : g[i];
      return `<div class="${c}" data-i="${i}">${tx}</div>`;
    })
    .join("");
  const rc = (i) => `(${(i / C) | 0},${i % C})`;
  let msg =
    kk == 0
      ? "لم يبدأ البحث"
      : done
        ? Rs.found
          ? `اكتمل: تكلفة المسار ${Rs.cost}`
          : "لا يوجد مسار"
        : `يُستخرج ${rc(cur)} بـ g=${g[cur]}` +
          (astar ? `, h=${hf(cur)}, f=${g[cur] + hf(cur)}` : "");
  return { n: cl.size, done, msg };
}
const len2 = () => Math.max(rD.ev.length, rA.ev.length);
function r2(k) {
  const d = dg($("#gd"), rD, k, false),
    a = dg($("#ga"), rA, k, true);
  $("#ex2").innerHTML = `<b>Dijkstra:</b> ${d.msg}<br><b>A*:</b> ${a.msg}`;
  const v = (r, x, f) => (x.done ? f(r) : "…"),
    both = d.done && a.done;
  const row = (n, f) =>
    `<tr><th>${n}</th><td>${v(rD, d, f)}</td><td>${v(rA, a, f)}</td></tr>`;
  $("#dash").innerHTML =
    `<tr><th></th><th>Dijkstra</th><th>A*</th></tr>` +
    row("المسار", (r) => (r.found ? "✔ موجود" : "✘ لا يوجد")) +
    row("التكلفة الكلية", (r) => (r.found ? r.cost : "—")) +
    row("عدد الخطوات", (r) => (r.found ? r.path.length - 1 : "—")) +
    `<tr><th>العقد المستكشَفة</th><td>${d.n}</td><td>${a.n}</td></tr>` +
    `<tr><th>كفاءة A* مقابل Dijkstra</th><td colspan="2">${both && rD.ex ? (((rD.ex - rA.ex) / rD.ex) * 100).toFixed(1) + "% عقد أقل" : "…"}</td></tr>`;
}
const pl2 = ctl($("#c2"), r2, len2);
function load2() {
  rD = run(false);
  rA = run(true);
  pl2.reset();
}
const edit = (i) => {
  if (tool == "start") {
    if (cell[i] != 1 && i != gl) st = i;
  } else if (tool == "goal") {
    if (cell[i] != 1 && i != st) gl = i;
  } else if (i != st && i != gl)
    cell[i] = tool == "wall" ? 1 : tool == "weight" ? 2 : 0;
};
const hit = (e) => {
  const t = document.elementFromPoint(e.clientX, e.clientY),
    d = t && t.closest(".c");
  return d ? +d.dataset.i : -1;
};
["#gd", "#ga"].forEach((s) => {
  const el = $(s);
  el.onpointerdown = (e) => {
    el.setPointerCapture(e.pointerId);
    paint = true;
    const i = hit(e);
    if (i >= 0) {
      edit(i);
      load2();
    }
  };
  el.onpointermove = (e) => {
    if (!paint) return;
    const i = hit(e);
    if (i >= 0) {
      edit(i);
      load2();
    }
  };
  el.onpointerup = () => (paint = false);
});
$$(".tl").forEach(
  (b) =>
    (b.onclick = () => {
      tool = b.dataset.t;
      $$(".tl").forEach((x) => x.classList.toggle("on", x == b));
    }),
);
$("#chk").onchange = (e) => {
  showV = e.target.checked;
  pl2.redraw();
};
$("#bPre").onclick = () => {
  cell.fill(0);
  st = 4 * C + 2;
  gl = 4 * C + 13;
  for (let r = 0; r < 7; r++) cell[r * C + 8] = 1;
  for (let r = 3; r <= 5; r++) for (let c = 4; c <= 6; c++) cell[r * C + c] = 2;
  load2();
};
$("#bRnd").onclick = () => {
  cell = cell.map(() => {
    const x = Math.random();
    return x < 0.25 ? 1 : x < 0.37 ? 2 : 0;
  });
  cell[st] = cell[gl] = 0;
  load2();
};
$("#bClr").onclick = () => {
  cell.fill(0);
  load2();
};
$("#bPre").click();
load1();
