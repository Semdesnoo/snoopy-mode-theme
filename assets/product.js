/* ==========================================================================
   PRODUCTPAGINA — variantkeuze en maat-adviseur
   Stond eerst inline in sections/main-product.liquid.
   Alle teksten komen uit data-attributen, die door de Thema-editor gevuld worden.
   ========================================================================== */
(function () {
    /* ---------- VARIANTKEUZE VIA KNOPPEN ---------- */
    var jsonEl = document.querySelector("[data-variant-json]");
    var idField = document.querySelector("[data-variant-id]");
    var optionBlocks = Array.prototype.slice.call(document.querySelectorAll("[data-option-block]"));
    var priceEls = document.querySelectorAll("[data-product-price]");
    var addButtons = document.querySelectorAll('button[name="add"]');
    var buyNowButtons = document.querySelectorAll("[data-buy-now]");
    var colorValueEl = document.querySelector("[data-color-value]");

    var variants = [];
    try { variants = JSON.parse(jsonEl.textContent || "[]"); } catch (err) { variants = []; }

    function moneyFormat(cents) {
      var amount = (cents / 100);
      // Toon met NL-notatie en euroteken; valt netjes terug als Intl niet beschikbaar is.
      try {
        return new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(amount);
      } catch (e) {
        return "€ " + amount.toFixed(2).replace(".", ",");
      }
    }

    // Huidige selectie per optiepositie (1-based) op basis van de gemarkeerde knoppen.
    function readSelection() {
      var sel = {};
      optionBlocks.forEach(function (block) {
        var pos = parseInt(block.getAttribute("data-opt-position"), 10);
        var active = block.querySelector('[data-opt-button][aria-pressed="true"]');
        if (active) sel[pos] = active.getAttribute("data-opt-value");
      });
      return sel;
    }

    function findVariant(sel) {
      var positions = Object.keys(sel).map(Number);
      for (var i = 0; i < variants.length; i++) {
        var v = variants[i];
        var match = true;
        for (var j = 0; j < positions.length; j++) {
          var p = positions[j];
          if (v.options[p - 1] !== sel[p]) { match = false; break; }
        }
        if (match) return v;
      }
      return null;
    }

    // Markeer onbeschikbare combinaties: per knop kijken of er, met de overige
    // huidige keuzes, een beschikbare variant bestaat.
    function refreshAvailability() {
      var sel = readSelection();
      optionBlocks.forEach(function (block) {
        var pos = parseInt(block.getAttribute("data-opt-position"), 10);
        var buttons = block.querySelectorAll("[data-opt-button]");
        Array.prototype.forEach.call(buttons, function (btn) {
          var test = {};
          Object.keys(sel).forEach(function (k) { test[k] = sel[k]; });
          test[pos] = btn.getAttribute("data-opt-value");
          var hasAvailable = variants.some(function (v) {
            var ok = true;
            Object.keys(test).forEach(function (k) {
              if (v.options[Number(k) - 1] !== test[k]) ok = false;
            });
            return ok && v.available;
          });
          var existsAtAll = variants.some(function (v) {
            return v.options[pos - 1] === btn.getAttribute("data-opt-value");
          });
          if (existsAtAll && !hasAvailable) {
            btn.setAttribute("disabled", "disabled");
          } else {
            btn.removeAttribute("disabled");
          }
        });
      });
    }

    function updateForVariant(v) {
      if (v) {
        if (idField) idField.value = v.id;
        priceEls.forEach(function (el) { el.textContent = moneyFormat(v.price); });
        Array.prototype.forEach.call(addButtons, function (btn) {
          btn.disabled = !v.available;
          /* Teksten komen uit de Thema-editor (data-label-*). */
          btn.textContent = v.available
            ? (btn.getAttribute("data-label-available") || "In winkelmand")
            : (btn.getAttribute("data-label-soldout") || "Uitverkocht");
        });
        Array.prototype.forEach.call(buyNowButtons, function (btn) {
          btn.disabled = !v.available;
        });
      } else {
        Array.prototype.forEach.call(addButtons, function (btn) {
          btn.disabled = true;
          btn.textContent = btn.getAttribute("data-label-unavailable") || "Niet beschikbaar";
        });
        Array.prototype.forEach.call(buyNowButtons, function (btn) {
          btn.disabled = true;
        });
      }
    }

    function selectButton(btn) {
      var block = btn.closest("[data-option-block]");
      if (!block) return;
      block.querySelectorAll("[data-opt-button]").forEach(function (b) {
        var on = b === btn;
        b.classList.toggle("is-selected", on);
        b.setAttribute("aria-pressed", on ? "true" : "false");
      });
      // Toon de gekozen kleurwaarde naast het label, indien aanwezig.
      if (colorValueEl && block.contains(colorValueEl)) {
        colorValueEl.textContent = btn.getAttribute("data-opt-value");
      }
      var sel = readSelection();
      updateForVariant(findVariant(sel));
      refreshAvailability();
    }

    document.querySelectorAll("[data-opt-button]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        if (btn.hasAttribute("disabled")) return;
        selectButton(btn);
      });
    });

    // Initialiseer prijs/beschikbaarheid op basis van de huidige selectie.
    updateForVariant(findVariant(readSelection()));
    refreshAvailability();

    /* ---------- MAAT-ADVISEUR (letter-maten) ---------- */
    var root = document.querySelector("[data-sizefinder]");
    if (!root) return;

    var openers = document.querySelectorAll("[data-sizefinder-open]");
    var closers = root.querySelectorAll("[data-sizefinder-close]");
    var form = root.querySelector("[data-sizefinder-form]");
    var errorEl = root.querySelector("[data-sizefinder-error]");
    var result = root.querySelector("[data-sizefinder-result]");
    var sizeEl = root.querySelector("[data-sizefinder-size]");
    var explainEl = root.querySelector("[data-sizefinder-explain]");
    var applyBtn = root.querySelector("[data-sizefinder-apply]");
    var editBtn = root.querySelector("[data-sizefinder-edit]");
    var lastFocus = null;
    var recommendedValue = null; // de exacte maat-knopwaarde die we adviseren

    function open(e) {
      if (e) e.preventDefault();
      lastFocus = document.activeElement;
      root.hidden = false;
      document.body.classList.add("is-locked");
      var first = document.getElementById("sf-length");
      if (first) first.focus();
    }
    function close() {
      root.hidden = true;
      document.body.classList.remove("is-locked");
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }

    openers.forEach(function (o) { o.addEventListener("click", open); });
    closers.forEach(function (c) { c.addEventListener("click", close); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !root.hidden) close();
    });

    // Letterladder + bijbehorende NL-maat (uit de maattabel).
    var LETTERS = ["XS", "S", "M", "L", "XL", "XXL"];
    var LETTER_TO_NL = { XS: "34", S: "36", M: "38", L: "40", XL: "42", XXL: "44" };

    // Welke maat-knoppen heeft dit product? (de maat-optiegroep)
    var sizeGrid = document.querySelector("[data-size-grid]");
    function sizeButtons() {
      return sizeGrid ? Array.prototype.slice.call(sizeGrid.querySelectorAll("[data-opt-button]")) : [];
    }

    // Map een geadviseerde letter naar een werkelijke maat-knopwaarde van dit product.
    // Ondersteunt letter-maten (S/M/L), NL-nummers (36/38) en losse waarden.
    function matchButtonForLetter(letter) {
      var btns = sizeButtons();
      if (!btns.length) return null;
      var nl = LETTER_TO_NL[letter];
      var letterIdx = LETTERS.indexOf(letter);

      // 1) directe letter-match
      for (var i = 0; i < btns.length; i++) {
        var val = (btns[i].getAttribute("data-opt-value") || "").trim().toUpperCase();
        if (val === letter) return btns[i];
      }
      // 2) NL-nummer-match (38, "Maat 38", "38 (M)")
      for (var k = 0; k < btns.length; k++) {
        var raw = (btns[k].getAttribute("data-opt-value") || "");
        if (raw.replace(/[^0-9]/g, "") === nl) return btns[k];
      }
      // 3) val terug op positie in de lijst, geschaald naar de letterladder
      var ratio = letterIdx / (LETTERS.length - 1);
      var pick = Math.round(ratio * (btns.length - 1));
      if (pick < 0) pick = 0;
      if (pick > btns.length - 1) pick = btns.length - 1;
      return btns[pick];
    }

    function recommendLetter(length, weight, fit) {
      var base;
      if (weight < 55) base = 0;        // XS
      else if (weight < 61) base = 1;   // S
      else if (weight < 68) base = 2;   // M
      else if (weight < 76) base = 3;   // L
      else if (weight < 85) base = 4;   // XL
      else base = 5;                    // XXL

      var idx = base;
      if (length >= 179) idx -= 1;
      else if (length <= 161) idx += 1;

      if (fit === "fitted") idx -= 1;
      else if (fit === "relaxed") idx += 1;

      if (idx < 0) idx = 0;
      if (idx > LETTERS.length - 1) idx = LETTERS.length - 1;
      return LETTERS[idx];
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var length = parseInt(document.getElementById("sf-length").value, 10);
      var weight = parseInt(document.getElementById("sf-weight").value, 10);
      var fit = document.getElementById("sf-fit").value;

      if (isNaN(length) || length < 140 || length > 210 ||
          isNaN(weight) || weight < 40 || weight > 150) {
        if (errorEl) errorEl.hidden = false;
        result.hidden = true;
        return;
      }
      if (errorEl) errorEl.hidden = true;

      var letter = recommendLetter(length, weight, fit);
      var nl = LETTER_TO_NL[letter];

      // Bepaal de werkelijke knopwaarde die we straks selecteren.
      var target = matchButtonForLetter(letter);
      recommendedValue = target ? target.getAttribute("data-opt-value") : null;

      var fitText = fit === "fitted" ? "aansluitende" : (fit === "relaxed" ? "ruime" : "normale");
      /* Woord en zin komen uit de Thema-editor. */
      var wordSize = result.getAttribute("data-word-size") || "Maat";
      var template = result.getAttribute("data-explain-template") ||
        "Op basis van [lengte] cm, [gewicht] kg en een [pasvorm] pasvorm.";
      sizeEl.textContent = wordSize + " " + letter + (nl ? " (NL " + nl + ")" : "");
      explainEl.textContent = template
        .replace("[lengte]", length)
        .replace("[gewicht]", weight)
        .replace("[pasvorm]", fitText)
        .replace("[maat]", letter);
      result.hidden = false;
      result.focus({ preventScroll: true });
      result.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });

    applyBtn.addEventListener("click", function () {
      var target = null;
      if (recommendedValue !== null) {
        var btns = sizeButtons();
        for (var i = 0; i < btns.length; i++) {
          if (btns[i].getAttribute("data-opt-value") === recommendedValue) { target = btns[i]; break; }
        }
      }
      close();
      if (target) {
        target.click();
        target.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    });

    if (editBtn) {
      editBtn.addEventListener("click", function () {
        var first = document.getElementById("sf-length");
        if (first) {
          first.scrollIntoView({ behavior: "smooth", block: "center" });
          first.focus({ preventScroll: true });
        }
      });
    }
  })();
