/* =========================================================
   Nauticarretas – interações
   Vanilla JS, sem dependências. Um único loop rAF para scroll
   e IntersectionObserver para tudo que depende de visibilidade.
   ========================================================= */
(function () {
  "use strict";

  var WHATSAPP = "5511976811752";
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var hasIO = "IntersectionObserver" in window;
  var $ = function (s, ctx) { return (ctx || document).querySelector(s); };
  var $$ = function (s, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(s)); };
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };

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

  /* ---------- Logo oficial (images/logo.png) com fallback ---------- */
  $$(".logo__img").forEach(function (img) {
    function ok() { if (img.naturalWidth > 0) { img.hidden = false; img.parentNode.classList.add("has-img"); } }
    if (img.complete) ok(); else img.addEventListener("load", ok);
  });

  /* ---------- Fotos: espaço reservado quando a imagem não existir ---------- */
  var parallaxDirty = true;
  function makePlaceholder(label) {
    var div = document.createElement("div");
    div.className = "placeholder";
    div.innerHTML =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" aria-hidden="true"><rect x="3" y="6" width="18" height="13" rx="1.5"/><circle cx="12" cy="12.5" r="3.5"/><path d="M8.5 6l1.4-2h4.2l1.4 2"/></svg>' +
      "<span></span><small>Foto em breve</small>";
    div.querySelector("span").textContent = label;
    return div;
  }
  function swapToPlaceholder(img) {
    if (!img.parentNode) return;
    var ph = makePlaceholder(img.getAttribute("data-fallback") || img.alt);
    if (img.hasAttribute("data-parallax")) ph.setAttribute("data-parallax", img.getAttribute("data-parallax"));
    img.parentNode.replaceChild(ph, img);
    parallaxDirty = true;
  }
  $$("img.photo").forEach(function (img) {
    if (img.complete && img.naturalWidth === 0) swapToPlaceholder(img);
    else img.addEventListener("error", function () { swapToPlaceholder(img); });
  });

  /* ---------- Hero: entrada cinematográfica ---------- */
  var hero = $(".hero"), heroMedia = $(".hero__media"), heroPhoto = $(".hero__photo");
  $$("[data-hero-step]").forEach(function (el, i) { el.style.setProperty("--i", i); });
  function heroPhotoReady() { if (heroPhoto.naturalWidth > 0) hero.classList.add("has-photo"); }
  if (heroPhoto.complete) heroPhotoReady(); else heroPhoto.addEventListener("load", heroPhotoReady);
  function startIntro() { requestAnimationFrame(function () { document.body.classList.add("is-loaded"); }); }
  if (document.fonts && document.fonts.ready) {
    // espera as fontes (no máx. 700ms) para a animação de texto não "pular"
    Promise.race([document.fonts.ready, new Promise(function (r) { setTimeout(r, 700); })]).then(startIntro);
  } else startIntro();

  /* ---------- Contadores ---------- */
  function countUp(el) {
    var target = parseInt(el.getAttribute("data-count"), 10), start = null, dur = 1400;
    if (reduceMotion) { el.textContent = target; return; }
    (function frame(t) {
      if (!start) start = t;
      var p = clamp((t - start) / dur, 0, 1);
      el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(frame);
    })(performance.now());
  }
  var counters = $$("[data-count]");
  if (hasIO) {
    var countObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { setTimeout(function () { countUp(en.target); }, 700); countObs.unobserve(en.target); }
      });
    }, { threshold: 0.6 });
    counters.forEach(function (c) { countObs.observe(c); });
  } else counters.forEach(function (c) { c.textContent = c.getAttribute("data-count"); });

  /* ---------- Revelação ao rolar ---------- */
  var reveals = $$(".reveal");
  reveals.forEach(function (el) {
    var siblings = $$(":scope > .reveal", el.parentElement);
    var i = siblings.indexOf(el);
    if (i > 0) el.style.setProperty("--d", Math.min(i * 0.07, 0.42) + "s");
  });
  if (hasIO && !reduceMotion) {
    var revealObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("is-visible"); revealObs.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    reveals.forEach(function (el) { revealObs.observe(el); });
  } else reveals.forEach(function (el) { el.classList.add("is-visible"); });

  /* ---------- Scroll: header, progresso, parallax (um único rAF) ---------- */
  var header = $("#header"), toTop = $("#toTop"), ring = $("#toTopRing");
  var RING = 2 * Math.PI * 22;
  var lastY = window.scrollY, ticking = false, menuOpen = false;
  var parallaxEls = [];

  function collectParallax() {
    parallaxEls = $$("[data-parallax]").map(function (el) { return { el: el, speed: parseFloat(el.getAttribute("data-parallax")) || 0 }; });
    parallaxDirty = false;
  }

  function onFrame() {
    ticking = false;
    var y = window.scrollY, vh = window.innerHeight;
    var max = document.documentElement.scrollHeight - vh;

    header.classList.toggle("is-scrolled", y > 40);
    if (!menuOpen) {
      if (y > lastY + 6 && y > 480) header.classList.add("is-hidden");
      else if (y < lastY - 6 || y < 480) header.classList.remove("is-hidden");
    }
    lastY = y;

    toTop.classList.toggle("is-visible", y > 700);
    ring.style.strokeDashoffset = (RING * (1 - (max > 0 ? y / max : 0))).toFixed(1);

    if (reduceMotion) return;
    if (y < vh) heroMedia.style.transform = "translate3d(0," + (y * 0.28).toFixed(1) + "px,0)";

    if (parallaxDirty) collectParallax();
    var scale = window.innerWidth < 640 ? 0.6 : 1;
    for (var i = 0; i < parallaxEls.length; i++) {
      var p = parallaxEls[i], r = p.el.parentElement.getBoundingClientRect();
      if (r.bottom < -100 || r.top > vh + 100) continue;
      var offset = (r.top + r.height / 2 - vh / 2) * p.speed * scale;
      p.el.style.transform = "translate3d(0," + offset.toFixed(1) + "px,0)";
    }
  }
  function requestFrame() { if (!ticking) { ticking = true; requestAnimationFrame(onFrame); } }
  window.addEventListener("scroll", requestFrame, { passive: true });
  window.addEventListener("resize", requestFrame);
  onFrame();
  toTop.addEventListener("click", function () { window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" }); });

  /* ---------- Menu mobile ---------- */
  var nav = $("#nav"), toggle = $("#menuToggle");
  $$(".nav__link").forEach(function (l, i) { l.style.setProperty("--i", i); });
  function setMenu(open) {
    menuOpen = open;
    nav.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
    document.body.style.overflow = open ? "hidden" : "";
    if (open) header.classList.remove("is-hidden");
  }
  toggle.addEventListener("click", function () { setMenu(!nav.classList.contains("is-open")); });
  $$("a", nav).forEach(function (a) { a.addEventListener("click", function () { setMenu(false); }); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && menuOpen) { setMenu(false); toggle.focus(); } });

  /* ---------- Link ativo + indicador deslizante ---------- */
  var navLinks = $$(".nav__link"), indicator = $(".nav__indicator");
  function moveIndicator(link) {
    if (!link || window.innerWidth <= 960) { indicator.style.opacity = 0; return; }
    var navBox = nav.getBoundingClientRect(), b = link.getBoundingClientRect();
    indicator.style.width = b.width + "px";
    indicator.style.transform = "translateX(" + (b.left - navBox.left) + "px)";
    indicator.style.opacity = 1;
  }
  var activeLink = null;
  if (hasIO) {
    var sectionObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        activeLink = null;
        navLinks.forEach(function (l) {
          var on = l.getAttribute("href") === "#" + en.target.id;
          l.classList.toggle("is-active", on);
          if (on) activeLink = l;
        });
        moveIndicator(activeLink);
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    navLinks.forEach(function (l) {
      var sec = document.querySelector(l.getAttribute("href"));
      if (sec) sectionObs.observe(sec);
    });
  }
  window.addEventListener("resize", function () { moveIndicator(activeLink); });

  /* ---------- Botões magnéticos (somente mouse) ---------- */
  if (finePointer && !reduceMotion) {
    $$("[data-magnetic]").forEach(function (btn) {
      btn.addEventListener("mousemove", function (e) {
        var r = btn.getBoundingClientRect();
        var dx = (e.clientX - r.left - r.width / 2) * 0.18;
        var dy = (e.clientY - r.top - r.height / 2) * 0.3;
        btn.style.setProperty("--mx", clamp(dx, -10, 10).toFixed(1) + "px");
        btn.style.setProperty("--my", clamp(dy, -6, 6).toFixed(1) + "px");
      });
      btn.addEventListener("mouseleave", function () { btn.style.setProperty("--mx", "0px"); btn.style.setProperty("--my", "0px"); });
    });
  }

  /* ---------- Serviços: pré-visualização de foto que segue o cursor ---------- */
  var preview = $(".service-preview"), previewImg = preview && $("img", preview);
  if (preview && finePointer) {
    var px = 0, py = 0, tx = 0, ty = 0, raf = null, showing = false;
    $$(".service[data-preview]").forEach(function (row) {
      var src = row.getAttribute("data-preview"), probe = new Image();
      probe.onload = function () { row.setAttribute("data-has-preview", ""); };
      probe.src = src;
      row.addEventListener("mouseenter", function (e) {
        if (!row.hasAttribute("data-has-preview")) return;
        previewImg.src = src;
        tx = px = e.clientX; ty = py = e.clientY;
        showing = true; preview.classList.add("is-visible");
        if (!raf) raf = requestAnimationFrame(loop);
      });
      row.addEventListener("mousemove", function (e) { tx = e.clientX; ty = e.clientY; });
      row.addEventListener("mouseleave", function () { showing = false; preview.classList.remove("is-visible"); });
    });
    function loop() {
      px += (tx - px) * 0.16; py += (ty - py) * 0.16;
      preview.style.transform = "translate3d(" + (px + 28).toFixed(1) + "px," + (py - 110).toFixed(1) + "px,0) scale(" + (showing ? 1 : 0.85) + ")";
      if (showing || Math.abs(tx - px) > 0.5) raf = requestAnimationFrame(loop); else raf = null;
    }
  }

  /* ---------- Manutenção: expandir lista ---------- */
  var maintBtn = $(".service__toggle"), maint = $("#maintList");
  if (maintBtn) {
    $$("li", maint).forEach(function (li, i) { li.style.setProperty("--i", i); });
    maintBtn.addEventListener("click", function () {
      var open = maintBtn.getAttribute("aria-expanded") !== "true";
      maintBtn.setAttribute("aria-expanded", String(open));
      maint.classList.toggle("is-open", open);
      $("span", maintBtn).textContent = open ? "Ocultar serviços" : "Ver serviços de manutenção";
    });
  }

  /* ---------- Tipos de embarcação: abas + palco de imagem ---------- */
  var tabs = $$(".boat-tab"), slides = $$(".boats__slide"), stage = $("#boatStage");
  var ink = $(".boat-tabs__ink"), boatIndex = $("#boatIndex"), tablist = $(".boat-tabs");
  var currentBoat = 0, leaveTimer;

  slides.forEach(function (fig) {
    var img = $("img", fig);
    function fail() { fig.classList.add("is-fallback"); }
    if (img.complete && img.naturalWidth === 0) fail(); else img.addEventListener("error", fail);
  });

  function moveInk(tab) {
    ink.style.width = tab.offsetWidth + "px";
    ink.style.transform = "translateX(" + tab.offsetLeft + "px)";
  }

  function activateBoat(index, focus) {
    index = (index + tabs.length) % tabs.length;
    if (index === currentBoat) { if (focus) tabs[index].focus(); return; }
    var dir = index > currentBoat ? 1 : -1;
    var prev = slides[currentBoat], next = slides[index];

    tabs.forEach(function (t, i) {
      var on = i === index;
      t.classList.toggle("is-active", on);
      t.setAttribute("aria-selected", String(on));
      t.tabIndex = on ? 0 : -1;
      var panel = document.getElementById(t.getAttribute("data-panel"));
      panel.hidden = !on;
      panel.classList.toggle("is-active", on);
    });

    // transição de imagem: cortina na direção da navegação
    slides.forEach(function (s) { s.classList.remove("is-leaving"); });
    prev.classList.remove("is-active");
    prev.classList.add("is-leaving");
    next.style.transition = "none";
    next.style.clipPath = dir > 0 ? "inset(0 0 0 100%)" : "inset(0 100% 0 0)";
    void next.offsetWidth;
    next.style.transition = "";
    next.style.clipPath = "";
    next.classList.add("is-active");
    clearTimeout(leaveTimer);
    leaveTimer = setTimeout(function () { prev.classList.remove("is-leaving"); }, 1000);

    currentBoat = index;
    boatIndex.textContent = ("0" + (index + 1)).slice(-2);
    moveInk(tabs[index]);
    var t = tabs[index];
    if (tablist.scrollWidth > tablist.clientWidth) {
      tablist.scrollTo({ left: t.offsetLeft - 20, behavior: reduceMotion ? "auto" : "smooth" });
    }
    if (focus) t.focus();
  }

  tabs.forEach(function (tab, i) {
    tab.addEventListener("click", function () { activateBoat(i); });
    tab.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight") { e.preventDefault(); activateBoat(i + 1, true); }
      if (e.key === "ArrowLeft") { e.preventDefault(); activateBoat(i - 1, true); }
    });
  });
  if (tabs.length) {
    moveInk(tabs[0]);
    window.addEventListener("resize", function () { moveInk(tabs[currentBoat]); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { moveInk(tabs[currentBoat]); });
  }

  /* ---------- Gestos de swipe (reutilizável) ---------- */
  function onSwipe(el, cb) {
    var sx = null, sy = null;
    el.addEventListener("touchstart", function (e) { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
    el.addEventListener("touchend", function (e) {
      if (sx === null) return;
      var dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy;
      if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.3) cb(dx < 0 ? 1 : -1);
      sx = null;
    });
  }
  if (stage) onSwipe(stage, function (d) { activateBoat(currentBoat + d); });

  /* ---------- Timeline do processo ---------- */
  var tlSteps = $$(".tl-step"), tlContents = $$(".tl-content"), timeline = $(".timeline");
  var tlArrows = $$(".tl-arrow"), tlCurrent = 0, tlAuto = null, tlTouched = false;
  function setStep(i, focus) {
    i = clamp(i, 0, tlSteps.length - 1);
    tlCurrent = i;
    tlSteps.forEach(function (s, k) {
      s.classList.toggle("is-active", k === i);
      s.classList.toggle("is-done", k < i);
      s.setAttribute("aria-selected", String(k === i));
      s.tabIndex = k === i ? 0 : -1;
    });
    tlContents.forEach(function (c, k) { c.classList.toggle("is-active", k === i); });
    timeline.style.setProperty("--p", (i / (tlSteps.length - 1)).toFixed(3));
    tlArrows[0].disabled = i === 0;
    tlArrows[1].disabled = i === tlSteps.length - 1;
    if (focus) tlSteps[i].focus();
  }
  function stopAuto() { tlTouched = true; clearInterval(tlAuto); tlAuto = null; }
  tlSteps.forEach(function (s, i) {
    s.addEventListener("click", function () { stopAuto(); setStep(i); });
    s.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight") { e.preventDefault(); stopAuto(); setStep(i + 1, true); }
      if (e.key === "ArrowLeft") { e.preventDefault(); stopAuto(); setStep(i - 1, true); }
    });
  });
  tlArrows.forEach(function (a) {
    a.addEventListener("click", function () { stopAuto(); setStep(tlCurrent + parseInt(a.getAttribute("data-dir"), 10)); });
  });
  if (timeline) {
    onSwipe($(".timeline__panel"), function (d) { stopAuto(); setStep(tlCurrent + d); });
    setStep(0);
    // Avança sozinha enquanto visível, até o visitante interagir
    if (hasIO && !reduceMotion) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting && !tlTouched && !tlAuto) {
            tlAuto = setInterval(function () {
              if (tlCurrent >= tlSteps.length - 1) { clearInterval(tlAuto); tlAuto = null; tlTouched = true; return; }
              setStep(tlCurrent + 1);
            }, 3200);
          } else if (!en.isIntersecting && tlAuto) { clearInterval(tlAuto); tlAuto = null; }
        });
      }, { threshold: 0.5 }).observe(timeline);
    }
  }

  /* ---------- Formulário de orçamento ---------- */
  var form = $("#quoteForm"), serviceSel = $("#qService"), nameInput = $("#qName");
  var modelInput = $("#qModel"), msgInput = $("#qMsg"), formError = $("#formError");
  var progress = $("#formProgress"), waPreview = $("#waPreview"), submitBtn = $(".btn--submit", form);
  var submitLabel = $(".btn__label", submitBtn);

  function boatValue() { var b = $('input[name="embarcacao"]:checked'); return b ? b.value : ""; }
  function buildMessage() {
    var lines = [
      "Olá, Nauticarretas! Gostaria de solicitar um orçamento.",
      "",
      "*Nome:* " + nameInput.value.trim(),
      "*Embarcação:* " + boatValue(),
      "*Serviço:* " + serviceSel.value
    ];
    var model = modelInput.value.trim(), msg = msgInput.value.trim();
    if (model) lines.push("*Modelo/dimensões:* " + model);
    if (msg) lines.push("*Mensagem:* " + msg);
    return lines.join("\n");
  }
  function esc(s) { return s.replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function updateForm() {
    var score = 0;
    if (nameInput.value.trim()) score += 0.3;
    if (boatValue()) score += 0.25;
    if (serviceSel.value) score += 0.25;
    if (modelInput.value.trim()) score += 0.1;
    if (msgInput.value.trim()) score += 0.1;
    progress.style.transform = "scaleX(" + score + ")";
    serviceSel.classList.toggle("has-value", !!serviceSel.value);

    var ph = function (v, label) { return v ? esc(v) : '<span class="muted">' + label + "</span>"; };
    var html = "Olá, Nauticarretas! Gostaria de solicitar um orçamento.\n\n" +
      "<b>Nome:</b> " + ph(nameInput.value.trim(), "seu nome") + "\n" +
      "<b>Embarcação:</b> " + ph(boatValue(), "tipo") + "\n" +
      "<b>Serviço:</b> " + ph(serviceSel.value, "serviço");
    if (modelInput.value.trim()) html += "\n<b>Modelo/dimensões:</b> " + esc(modelInput.value.trim());
    if (msgInput.value.trim()) html += "\n<b>Mensagem:</b> " + esc(msgInput.value.trim());
    waPreview.innerHTML = html;
  }
  $$("input, select, textarea", form).forEach(function (f) {
    var clear = function () {
      f.classList.remove("is-invalid");
      if (f.name === "embarcacao") $("#boatGroup").parentElement.classList.remove("is-invalid-group");
      updateForm();
    };
    f.addEventListener("input", clear);
    f.addEventListener("change", clear);
  });
  updateForm();

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var ok = true;
    [nameInput, serviceSel].forEach(function (f) {
      var bad = !f.value.trim();
      f.classList.toggle("is-invalid", bad);
      if (bad) ok = false;
    });
    var boatGroup = $("#boatGroup").parentElement;
    boatGroup.classList.toggle("is-invalid-group", !boatValue());
    if (!boatValue()) ok = false;
    formError.hidden = ok;
    if (!ok) {
      form.classList.remove("shake"); void form.offsetWidth; form.classList.add("shake");
      var first = $(".is-invalid", form) || $('input[name="embarcacao"]');
      if (first) first.focus();
      return;
    }

    // abrir já dentro do clique (evita bloqueio de pop-up)
    window.open("https://wa.me/" + WHATSAPP + "?text=" + encodeURIComponent(buildMessage()), "_blank", "noopener");
    submitBtn.classList.add("is-sent");
    submitLabel.textContent = "Mensagem pronta no WhatsApp ✓";
    showToast("Abrindo o WhatsApp…");
    setTimeout(function () { submitBtn.classList.remove("is-sent"); submitLabel.textContent = "Enviar pelo WhatsApp"; }, 4000);
  });

  /* Pré-preenchimento a partir dos botões de serviço / embarcação */
  function checkBoat(val) {
    $$('input[name="embarcacao"]').forEach(function (r) { r.checked = r.value === val; });
  }
  function afterPrefill() {
    updateForm();
    setTimeout(function () {
      if (!nameInput.value) nameInput.focus({ preventScroll: true });
    }, 900);
  }
  $$("[data-service]").forEach(function (a) {
    a.addEventListener("click", function () {
      serviceSel.value = a.getAttribute("data-service");
      var boat = { "Carreta para Jet Ski": "Jet Ski", "Carreta para Lancha": "Lancha", "Carreta para Veleiro": "Veleiro" }[serviceSel.value];
      if (boat) checkBoat(boat);
      afterPrefill();
    });
  });
  $$("[data-boat]").forEach(function (a) {
    a.addEventListener("click", function () {
      var boat = a.getAttribute("data-boat");
      checkBoat(boat);
      var svc = { "Jet Ski": "Carreta para Jet Ski", "Lancha": "Carreta para Lancha", "Veleiro": "Carreta para Veleiro" }[boat];
      serviceSel.value = svc || "Fabricação de carreta";
      afterPrefill();
    });
  });

  /* ---------- Copiar e-mail ---------- */
  $$(".copy-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var text = btn.getAttribute("data-copy");
      var done = function () { showToast("E-mail copiado"); btn.textContent = "Copiado"; setTimeout(function () { btn.textContent = "Copiar"; }, 2000); };
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

  /* ---------- FAQ (accordion animado, um aberto por vez) ---------- */
  var faqItems = $$(".faq-item");
  faqItems.forEach(function (item) {
    var btn = $(".faq-item__q", item);
    btn.addEventListener("click", function () {
      var open = !item.classList.contains("is-open");
      faqItems.forEach(function (o) {
        o.classList.remove("is-open");
        $(".faq-item__q", o).setAttribute("aria-expanded", "false");
      });
      item.classList.toggle("is-open", open);
      btn.setAttribute("aria-expanded", String(open));
    });
  });

  /* ---------- Galeria: filtros ---------- */
  var chips = $$(".chip"), items = $$(".g-item");
  chips.forEach(function (chip) {
    chip.addEventListener("click", function () {
      var f = chip.getAttribute("data-filter"), n = 0;
      chips.forEach(function (c) { var on = c === chip; c.classList.toggle("is-active", on); c.setAttribute("aria-pressed", String(on)); });
      items.forEach(function (it) {
        var show = f === "all" || it.getAttribute("data-cat") === f;
        it.classList.toggle("is-hidden", !show);
        it.classList.remove("is-filtering");
        if (show) { it.style.setProperty("--i", n++); void it.offsetWidth; it.classList.add("is-filtering"); }
      });
    });
  });

  /* ---------- Galeria: lightbox com zoom, miniaturas, teclado e swipe ---------- */
  var lb = $("#lightbox"), lbMedia = $(".lightbox__media", lb), lbCap = $(".lightbox__caption", lb);
  var lbCount = $(".lightbox__count", lb), lbThumbs = $(".lightbox__thumbs", lb);
  var current = 0, lastFocus = null, zoomed = false;

  function visibleItems() { return items.filter(function (it) { return !it.classList.contains("is-hidden"); }); }
  function setZoom(on, x, y) {
    zoomed = on;
    lbMedia.classList.toggle("is-zoomed", on);
    var media = lbMedia.firstElementChild;
    if (!media) return;
    if (on) { media.style.transformOrigin = x + "% " + y + "%"; media.style.transform = "scale(2.2)"; }
    else { media.style.transform = ""; }
  }
  function renderLb() {
    var list = visibleItems(), it = list[current];
    if (!it) return;
    setZoom(false);
    lbMedia.innerHTML = "";
    var media = it.querySelector("img, .placeholder").cloneNode(true);
    media.removeAttribute("loading");
    media.style.transform = "";
    lbMedia.appendChild(media);
    lbMedia.classList.remove("is-entering"); void lbMedia.offsetWidth; lbMedia.classList.add("is-entering");
    lbCap.textContent = it.querySelector("figcaption").textContent;
    lbCount.textContent = ("0" + (current + 1)).slice(-2) + " / " + ("0" + list.length).slice(-2);
    $$("button", lbThumbs).forEach(function (b, i) { b.classList.toggle("is-active", i === current); if (i === current) b.scrollIntoView({ block: "nearest", inline: "center" }); });
  }
  function buildThumbs() {
    lbThumbs.innerHTML = "";
    visibleItems().forEach(function (it, i) {
      var b = document.createElement("button");
      b.type = "button";
      b.setAttribute("aria-label", "Ver foto: " + it.querySelector("figcaption").textContent);
      b.appendChild(it.querySelector("img, .placeholder").cloneNode(true));
      b.addEventListener("click", function () { current = i; renderLb(); });
      lbThumbs.appendChild(b);
    });
  }
  function openLb(it) {
    lastFocus = document.activeElement;
    current = visibleItems().indexOf(it);
    buildThumbs();
    lb.hidden = false;
    renderLb();
    document.body.style.overflow = "hidden";
    $(".lightbox__close", lb).focus();
  }
  function closeLb() {
    lb.hidden = true;
    setZoom(false);
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
  lb.addEventListener("click", function (e) { if (e.target === lb || e.target.classList.contains("lightbox__figure")) closeLb(); });

  // Zoom: clique (desktop) / toque duplo (celular); arrastar move a área ampliada
  function pctPos(e) {
    var r = lbMedia.getBoundingClientRect();
    return [clamp((e.clientX - r.left) / r.width * 100, 0, 100), clamp((e.clientY - r.top) / r.height * 100, 0, 100)];
  }
  var lastTap = 0;
  lbMedia.addEventListener("click", function (e) {
    if (e.pointerType === "touch" || !lbMedia.querySelector("img")) return;
    var p = pctPos(e); setZoom(!zoomed, p[0], p[1]);
  });
  lbMedia.addEventListener("pointermove", function (e) {
    if (!zoomed) return;
    var p = pctPos(e), media = lbMedia.firstElementChild;
    if (media) media.style.transformOrigin = p[0] + "% " + p[1] + "%";
  });
  lbMedia.addEventListener("pointerup", function (e) {
    if (e.pointerType !== "touch" || !lbMedia.querySelector("img")) return;
    var now = Date.now();
    if (now - lastTap < 300) { var p = pctPos(e); setZoom(!zoomed, p[0], p[1]); lastTap = 0; }
    else lastTap = now;
  });
  onSwipe(lb, function (d) { if (!zoomed) step(d); });

  document.addEventListener("keydown", function (e) {
    if (lb.hidden) return;
    if (e.key === "Escape") { if (zoomed) setZoom(false); else closeLb(); }
    if (e.key === "ArrowRight") step(1);
    if (e.key === "ArrowLeft") step(-1);
    if (e.key === "Tab") { // mantém o foco dentro do lightbox
      var f = $$("button", lb).filter(function (b) { return b.offsetParent !== null; });
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  /* ---------- Mapa sob demanda ---------- */
  var mapBtn = $(".map-load");
  function loadMap() {
    if (!mapBtn || !mapBtn.parentNode) return;
    var iframe = document.createElement("iframe");
    iframe.title = "Mapa – Nauticarretas";
    iframe.src = mapBtn.getAttribute("data-src");
    iframe.loading = "lazy";
    iframe.referrerPolicy = "no-referrer-when-downgrade";
    iframe.allowFullscreen = true;
    mapBtn.parentNode.insertBefore(iframe, mapBtn);
    iframe.addEventListener("load", function () { if (mapBtn.parentNode) mapBtn.parentNode.removeChild(mapBtn); });
    mapBtn.disabled = true;
  }
  if (mapBtn) {
    mapBtn.addEventListener("click", loadMap);
    if (hasIO) {
      var mapObs = new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting) { loadMap(); mapObs.disconnect(); }
      }, { rootMargin: "200px 0px" });
      mapObs.observe(mapBtn);
    }
  }

  /* ---------- WhatsApp flutuante ---------- */
  var wa = $(".wa-float");
  setTimeout(function () { wa.classList.add("is-in"); }, 1400);
  if (finePointer) {
    var seen = false;
    try { seen = sessionStorage.getItem("nc-wa-bubble") === "1"; } catch (err) { /* ignore */ }
    if (!seen) {
      setTimeout(function () {
        wa.classList.add("show-bubble");
        try { sessionStorage.setItem("nc-wa-bubble", "1"); } catch (err) { /* ignore */ }
        setTimeout(function () { wa.classList.remove("show-bubble"); }, 4500);
      }, 9000);
    }
  }
})();
