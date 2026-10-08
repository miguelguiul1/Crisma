/* =========================================================
   Nauticarretas – interações
   ========================================================= */
(function () {
  "use strict";

  var WHATSAPP = "5511976811752";
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (s, ctx) { return (ctx || document).querySelector(s); };
  var $$ = function (s, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(s)); };

  /* ---------- Ano no rodapé ---------- */
  $("#year").textContent = new Date().getFullYear();

  /* ---------- Toast ---------- */
  var toast = $("#toast"), toastTimer;
  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.classList.remove("is-visible"); }, 2600);
  }

  /* ---------- Header, progresso e voltar ao topo ---------- */
  var header = $("#header"), progress = $(".scroll-progress"), toTop = $("#toTop");
  var stepsTrack = $(".steps__track"), steps = $$(".step");

  function onScroll() {
    var y = window.scrollY;
    var max = document.documentElement.scrollHeight - window.innerHeight;
    header.classList.toggle("is-scrolled", y > 30);
    progress.style.transform = "scaleX(" + (max > 0 ? y / max : 0) + ")";
    toTop.classList.toggle("is-visible", y > 700);

    // Linha de progresso em "Como funciona"
    if (stepsTrack) {
      var r = stepsTrack.getBoundingClientRect();
      var p = Math.min(1, Math.max(0, (window.innerHeight * 0.75 - r.top) / (r.height + window.innerHeight * 0.25)));
      stepsTrack.style.setProperty("--progress", p.toFixed(3));
      steps.forEach(function (s, i) { s.classList.toggle("is-lit", p >= i / Math.max(1, steps.length - 1) - 0.01 && p > 0); });
    }
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
  toTop.addEventListener("click", function () { window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" }); });

  /* ---------- Menu mobile ---------- */
  var nav = $("#nav"), toggle = $("#menuToggle");
  function setMenu(open) {
    nav.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
    document.body.style.overflow = open ? "hidden" : "";
  }
  toggle.addEventListener("click", function () { setMenu(!nav.classList.contains("is-open")); });
  $$("a", nav).forEach(function (a) { a.addEventListener("click", function () { setMenu(false); }); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && nav.classList.contains("is-open")) setMenu(false); });

  /* ---------- Link ativo no menu ---------- */
  var navLinks = $$(".nav__link");
  if ("IntersectionObserver" in window) {
    var sectionObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        navLinks.forEach(function (l) { l.classList.toggle("is-active", l.getAttribute("href") === "#" + en.target.id); });
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    navLinks.forEach(function (l) {
      var sec = document.querySelector(l.getAttribute("href"));
      if (sec) sectionObs.observe(sec);
    });
  }

  /* ---------- Reveal ao rolar ---------- */
  var reveals = $$(".reveal");
  // Atraso escalonado entre irmãos
  reveals.forEach(function (el) {
    var siblings = $$(":scope > .reveal", el.parentElement);
    var i = siblings.indexOf(el);
    if (i > 0) el.style.setProperty("--d", Math.min(i * 0.08, 0.5) + "s");
  });
  if ("IntersectionObserver" in window && !reduceMotion) {
    var revealObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("is-visible"); revealObs.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    reveals.forEach(function (el) { revealObs.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("is-visible"); });
  }

  /* ---------- Texto digitado no hero ---------- */
  var typed = $(".typed");
  if (typed && !reduceMotion) {
    var words = JSON.parse(typed.getAttribute("data-words"));
    var wi = 0, ci = words[0].length, deleting = true;
    function tick() {
      if (deleting) {
        ci--;
        if (ci === 0) { deleting = false; wi = (wi + 1) % words.length; }
      } else {
        ci++;
      }
      typed.textContent = words[wi].slice(0, ci) || "\u00a0";
      var delay = deleting ? 45 : 95;
      if (!deleting && ci === words[wi].length) { deleting = true; delay = 2200; }
      setTimeout(tick, delay);
    }
    // a primeira palavra já aparece completa; começa a apagar após uma pausa
    setTimeout(tick, 2600);
  }

  /* ---------- Brilho do hero segue o mouse ---------- */
  var hero = $(".hero"), glow = $(".hero__glow");
  if (hero && glow && !reduceMotion) {
    hero.addEventListener("mousemove", function (e) {
      var r = hero.getBoundingClientRect();
      var x = ((e.clientX - r.left) / r.width - 0.5) * 80;
      var y = ((e.clientY - r.top) / r.height - 0.5) * 80;
      glow.style.setProperty("--mx", x + "px");
      glow.style.setProperty("--my", y + "px");
    });
  }

  /* ---------- Fotos: espaço reservado quando a imagem não existir ---------- */
  function makePlaceholder(label) {
    var div = document.createElement("div");
    div.className = "placeholder";
    div.innerHTML =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="12" cy="12" r="3.5"/><path d="M8 5l1.5-2h5L16 5"/></svg>' +
      "<span></span><small>Foto real em breve</small>";
    div.querySelector("span").textContent = label;
    return div;
  }
  function swapToPlaceholder(img) {
    if (!img.parentNode) return;
    img.parentNode.replaceChild(makePlaceholder(img.getAttribute("data-fallback") || img.alt), img);
  }
  $$("img.photo").forEach(function (img) {
    if (img.complete && img.naturalWidth === 0) swapToPlaceholder(img);
    else img.addEventListener("error", function () { swapToPlaceholder(img); });
  });

  /* ---------- Manutenção: expandir lista ---------- */
  var maintBtn = $(".service-card__toggle"), maintList = $("#maintList");
  if (maintBtn) {
    maintBtn.addEventListener("click", function () {
      var open = maintBtn.getAttribute("aria-expanded") !== "true";
      maintBtn.setAttribute("aria-expanded", String(open));
      maintList.classList.toggle("is-open", open);
      maintBtn.firstChild.nodeValue = open ? "Ocultar serviços " : "Ver serviços de manutenção ";
    });
  }

  /* ---------- Abas de embarcações ---------- */
  var tabs = $$(".boat-tab");
  function activateTab(tab, focus) {
    tabs.forEach(function (t) {
      var on = t === tab;
      t.classList.toggle("is-active", on);
      t.setAttribute("aria-selected", String(on));
      t.tabIndex = on ? 0 : -1;
      var panel = document.getElementById(t.getAttribute("data-panel"));
      panel.hidden = !on;
      panel.classList.toggle("is-active", on);
    });
    if (focus) tab.focus();
  }
  tabs.forEach(function (tab, i) {
    tab.addEventListener("click", function () { activateTab(tab); });
    tab.addEventListener("keydown", function (e) {
      var next = null;
      if (e.key === "ArrowRight") next = tabs[(i + 1) % tabs.length];
      if (e.key === "ArrowLeft") next = tabs[(i - 1 + tabs.length) % tabs.length];
      if (next) { e.preventDefault(); activateTab(next, true); }
    });
  });

  /* ---------- Pré-preenchimento do formulário a partir dos botões ---------- */
  var form = $("#quoteForm"), serviceSel = $("#qService");
  $$("[data-service]").forEach(function (a) {
    a.addEventListener("click", function () {
      serviceSel.value = a.getAttribute("data-service");
      var map = { "Carreta para Jet Ski": "Jet Ski", "Carreta para Lancha": "Lancha", "Carreta para Veleiro": "Veleiro" };
      var boat = map[serviceSel.value];
      if (boat) checkBoat(boat);
      highlightForm();
    });
  });
  $$("[data-boat]").forEach(function (a) {
    a.addEventListener("click", function () {
      var boat = a.getAttribute("data-boat");
      checkBoat(boat);
      var svc = { "Jet Ski": "Carreta para Jet Ski", "Lancha": "Carreta para Lancha", "Veleiro": "Carreta para Veleiro" }[boat];
      serviceSel.value = svc || "Fabricação de carreta";
      highlightForm();
    });
  });
  function checkBoat(val) {
    $$('input[name="embarcacao"]').forEach(function (r) { r.checked = r.value === val; });
  }
  function highlightForm() {
    setTimeout(function () {
      form.animate && !reduceMotion && form.animate(
        [{ boxShadow: "0 0 0 0 rgba(212,175,55,.7)" }, { boxShadow: "0 0 0 18px rgba(212,175,55,0)" }],
        { duration: 900, delay: 500, easing: "ease-out" }
      );
    }, 0);
  }

  /* ---------- Formulário → WhatsApp ---------- */
  var formError = $("#formError");
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var name = $("#qName"), boat = $('input[name="embarcacao"]:checked');
    var ok = true;
    [name, serviceSel].forEach(function (f) {
      var bad = !f.value.trim();
      f.classList.toggle("is-invalid", bad);
      if (bad) ok = false;
    });
    if (!boat) ok = false;
    formError.hidden = ok;
    if (!ok) return;

    var lines = [
      "Olá, Nauticarretas! Gostaria de solicitar um orçamento.",
      "",
      "*Nome:* " + name.value.trim(),
      "*Embarcação:* " + boat.value,
      "*Serviço:* " + serviceSel.value
    ];
    var model = $("#qModel").value.trim(), msg = $("#qMsg").value.trim();
    if (model) lines.push("*Modelo/dimensões:* " + model);
    if (msg) lines.push("*Mensagem:* " + msg);

    window.open("https://wa.me/" + WHATSAPP + "?text=" + encodeURIComponent(lines.join("\n")), "_blank", "noopener");
    showToast("Abrindo o WhatsApp…");
  });
  $$("input, select, textarea", form).forEach(function (f) {
    f.addEventListener("input", function () { f.classList.remove("is-invalid"); });
    f.addEventListener("change", function () { f.classList.remove("is-invalid"); });
  });

  /* ---------- Copiar e-mail ---------- */
  $$(".copy-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var text = btn.getAttribute("data-copy");
      var done = function () { showToast("E-mail copiado!"); };
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(done, function () { fallbackCopy(text); done(); });
      } else { fallbackCopy(text); done(); }
    });
  });
  function fallbackCopy(text) {
    var ta = document.createElement("textarea");
    ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
    document.body.appendChild(ta); ta.select();
    try { document.execCommand("copy"); } catch (err) { /* ignore */ }
    document.body.removeChild(ta);
  }

  /* ---------- FAQ: apenas um aberto por vez ---------- */
  var faqs = $$(".faq-item");
  faqs.forEach(function (d) {
    d.addEventListener("toggle", function () {
      if (d.open) faqs.forEach(function (o) { if (o !== d) o.open = false; });
    });
  });

  /* ---------- Galeria: filtros ---------- */
  var chips = $$(".chip"), items = $$(".g-item");
  chips.forEach(function (chip) {
    chip.addEventListener("click", function () {
      var f = chip.getAttribute("data-filter");
      chips.forEach(function (c) { c.classList.toggle("is-active", c === chip); });
      items.forEach(function (it) {
        var show = f === "all" || it.getAttribute("data-cat") === f;
        it.classList.toggle("is-hidden", !show);
        it.classList.remove("is-filtering");
        if (show) { void it.offsetWidth; it.classList.add("is-filtering"); }
      });
    });
  });

  /* ---------- Galeria: lightbox ---------- */
  var lb = $("#lightbox"), lbMedia = $(".lightbox__media", lb), lbCap = $(".lightbox__caption", lb);
  var current = 0, lastFocus = null;
  function visibleItems() { return items.filter(function (it) { return !it.classList.contains("is-hidden"); }); }
  function renderLb() {
    var list = visibleItems(), it = list[current];
    if (!it) return;
    lbMedia.innerHTML = "";
    var media = it.querySelector("img, .placeholder");
    lbMedia.appendChild(media.cloneNode(true));
    lbCap.textContent = it.querySelector("figcaption").textContent + "  ·  " + (current + 1) + "/" + list.length;
  }
  function openLb(it) {
    lastFocus = document.activeElement;
    current = visibleItems().indexOf(it);
    renderLb();
    lb.hidden = false;
    document.body.style.overflow = "hidden";
    $(".lightbox__close", lb).focus();
  }
  function closeLb() {
    lb.hidden = true;
    document.body.style.overflow = "";
    if (lastFocus) lastFocus.focus();
  }
  function step(dir) {
    var n = visibleItems().length;
    current = (current + dir + n) % n;
    renderLb();
  }
  items.forEach(function (it) {
    it.tabIndex = 0;
    it.setAttribute("role", "button");
    it.setAttribute("aria-label", "Ampliar: " + it.querySelector("figcaption").textContent);
    it.addEventListener("click", function () { openLb(it); });
    it.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openLb(it); } });
  });
  $(".lightbox__close", lb).addEventListener("click", closeLb);
  $(".lightbox__nav--prev", lb).addEventListener("click", function () { step(-1); });
  $(".lightbox__nav--next", lb).addEventListener("click", function () { step(1); });
  lb.addEventListener("click", function (e) { if (e.target === lb) closeLb(); });
  document.addEventListener("keydown", function (e) {
    if (lb.hidden) return;
    if (e.key === "Escape") closeLb();
    if (e.key === "ArrowRight") step(1);
    if (e.key === "ArrowLeft") step(-1);
  });
  // Swipe no celular
  var sx = null;
  lb.addEventListener("touchstart", function (e) { sx = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener("touchend", function (e) {
    if (sx === null) return;
    var dx = e.changedTouches[0].clientX - sx;
    if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1);
    sx = null;
  });

  /* ---------- Efeito 3D leve nos cards de diferenciais ---------- */
  if (!reduceMotion && window.matchMedia("(hover: hover)").matches) {
    $$(".diff, .highlight").forEach(function (card) {
      card.addEventListener("mousemove", function (e) {
        var r = card.getBoundingClientRect();
        var rx = ((e.clientY - r.top) / r.height - 0.5) * -8;
        var ry = ((e.clientX - r.left) / r.width - 0.5) * 8;
        card.style.transform = "perspective(800px) rotateX(" + rx + "deg) rotateY(" + ry + "deg) translateY(-8px)";
      });
      card.addEventListener("mouseleave", function () { card.style.transform = ""; });
    });
  }
})();
