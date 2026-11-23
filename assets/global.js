/* ==========================================================================
   SNOOPY MODE — main.js
   Generieke gedrag-hooks (vanilla JS, defer geladen).
   Werkt op alle pagina's via klassen/data-attributen. Toegankelijk:
   aria-expanded, focus-beheer, Esc-sluiten, body-scroll-lock.
   ========================================================================== */
(function () {
  "use strict";

  var body = document.body;

  /* Houd bij welke overlay/drawer/menu open is, zodat Esc de juiste sluit. */
  var openLayers = [];

  /* ------------------------------------------------------------------
     Hulpfuncties voor performance: rAF-throttle (scroll) en debounce (resize).
     Houden de hoofdthread vrij: dure handlers vuren hooguit één keer per
     frame (throttle) of pas na een rustpauze (debounce).
     ------------------------------------------------------------------ */
  var raf = window.requestAnimationFrame
    ? window.requestAnimationFrame.bind(window)
    : function (cb) { return window.setTimeout(cb, 16); };

  function rafThrottle(fn) {
    var scheduled = false;
    return function () {
      if (scheduled) return;
      scheduled = true;
      raf(function () { scheduled = false; fn(); });
    };
  }

  function debounce(fn, wait) {
    var t = null;
    return function () {
      window.clearTimeout(t);
      t = window.setTimeout(fn, wait || 150);
    };
  }

  function lockScroll() { body.classList.add("is-locked"); }
  function unlockScroll() {
    if (openLayers.length === 0) body.classList.remove("is-locked");
  }

  function registerOpen(closeFn) {
    openLayers.push(closeFn);
    lockScroll();
  }
  function registerClose(closeFn) {
    var i = openLayers.indexOf(closeFn);
    if (i > -1) openLayers.splice(i, 1);
    unlockScroll();
  }

  /* ------------------------------------------------------------------
     1) STICKY HEADER: .is-scrolled op <body> bij scroll > 10px
     ------------------------------------------------------------------ */
  function onScroll() {
    /* Eén layout-lees vóór de schrijf (geen reflow-loop). */
    var scrolled = window.scrollY > 10;
    if (scrolled === body.classList.contains("is-scrolled")) return;
    body.classList.toggle("is-scrolled", scrolled);
  }
  /* rAF-throttle: hooguit één keer per frame i.p.v. bij elke scroll-pixel. */
  window.addEventListener("scroll", rafThrottle(onScroll), { passive: true });
  onScroll();

  /* ------------------------------------------------------------------
     Hulpfunctie: open/sluit een paneel met overlay + focus-beheer
     ------------------------------------------------------------------ */
  function makePanel(panel, overlay, opts) {
    if (!panel) return null;
    opts = opts || {};
    var lastFocused = null;

    function open() {
      lastFocused = document.activeElement;
      panel.classList.add("is-open");
      if (overlay) overlay.classList.add("is-open");
      panel.setAttribute("aria-hidden", "false");
      registerOpen(close);
      // Focus eerste focusbare element binnen het paneel
      var focusable = panel.querySelector(
        "input, button, a[href], [tabindex]:not([tabindex='-1'])"
      );
      if (focusable) focusable.focus();
      if (opts.onOpen) opts.onOpen();
    }

    function close() {
      panel.classList.remove("is-open");
      if (overlay) overlay.classList.remove("is-open");
      panel.setAttribute("aria-hidden", "true");
      registerClose(close);
      if (lastFocused && lastFocused.focus) lastFocused.focus();
      if (opts.onClose) opts.onClose();
    }

    return { open: open, close: close, el: panel };
  }

  var overlay = document.querySelector("[data-overlay]");

  /* ------------------------------------------------------------------
     2) MOBIEL MENU
     ------------------------------------------------------------------ */
  var mobileNav = document.querySelector("[data-mobile-nav]");
  var menuPanel = makePanel(mobileNav, overlay);
  var menuToggle = document.querySelector("[data-menu-toggle]");

  if (menuPanel && menuToggle) {
    menuToggle.addEventListener("click", function () {
      var expanded = menuToggle.getAttribute("aria-expanded") === "true";
      if (expanded) {
        menuPanel.close();
        menuToggle.setAttribute("aria-expanded", "false");
      } else {
        menuPanel.open();
        menuToggle.setAttribute("aria-expanded", "true");
      }
    });

    document.querySelectorAll("[data-menu-close]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        menuPanel.close();
        menuToggle.setAttribute("aria-expanded", "false");
      });
    });

    // Sluit menu bij klikken op een navigatielink
    mobileNav.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        menuPanel.close();
        menuToggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  /* ------------------------------------------------------------------
     3) WINKELMAND-DRAWER
     ------------------------------------------------------------------ */
  var cartEl = document.querySelector("[data-cart]");
  /* Bij het openen de inhoud opnieuw ophalen. Zonder dat staan er verouderde
     regelnummers in de lade als de klant de winkelmand in een tweede tabblad
     heeft aangepast — en dan verwijdert het kruisje het verkeerde artikel.
     Let op: smCart bestaat hier nog niet, vandaar de omhullende functie. */
  var cartPanel = makePanel(cartEl, overlay, {
    onOpen: function () {
      if (smCart && smCart.refresh) smCart.refresh();
    },
  });

  if (cartPanel) {
    document.querySelectorAll("[data-cart-open]").forEach(function (btn) {
      btn.addEventListener("click", cartPanel.open);
    });
    document.querySelectorAll("[data-cart-close]").forEach(function (btn) {
      btn.addEventListener("click", cartPanel.close);
    });
  }

  /* ------------------------------------------------------------------
     4) ZOEK-OVERLAY
     ------------------------------------------------------------------ */
  var searchEl = document.querySelector("[data-search]");
  var searchPanel = makePanel(searchEl, overlay);

  if (searchPanel) {
    document.querySelectorAll("[data-search-open]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        /* Vanuit het mobiele menu: sluit eerst het menu, open dan zoeken. */
        if (menuPanel && mobileNav && mobileNav.contains(btn)) {
          menuPanel.close();
          if (menuToggle) menuToggle.setAttribute("aria-expanded", "false");
        }
        searchPanel.open();
      });
    });
    document.querySelectorAll("[data-search-close]").forEach(function (btn) {
      btn.addEventListener("click", searchPanel.close);
    });
  }

  /* ------------------------------------------------------------------
     Overlay-klik + Esc sluiten bovenste laag
     ------------------------------------------------------------------ */
  if (overlay) {
    overlay.addEventListener("click", function () {
      var top = openLayers[openLayers.length - 1];
      if (top) {
        top();
        if (menuToggle) menuToggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && openLayers.length) {
      var top = openLayers[openLayers.length - 1];
      top();
      if (menuToggle) menuToggle.setAttribute("aria-expanded", "false");
    }
  });

  /* ------------------------------------------------------------------
     5) PRODUCTGALERIJ: thumbnail wisselt hoofd-.media
     ------------------------------------------------------------------ */
  var mainMedia = document.querySelector("[data-gallery-main]");
  if (mainMedia) {
    var mainImg = mainMedia.querySelector("img");
    document.querySelectorAll("[data-gallery-thumb]").forEach(function (thumb) {
      thumb.addEventListener("click", function () {
        var full = thumb.getAttribute("data-full");
        if (full && mainImg) {
          /* Echte foto wisselen: zet de volledige afbeelding als hoofdfoto.
             srcset/sizes wissen zodat de browser exact deze bron toont. */
          mainImg.removeAttribute("srcset");
          mainImg.removeAttribute("sizes");
          mainImg.src = full;
          var thumbImg = thumb.querySelector("img");
          if (thumbImg && thumbImg.alt) mainImg.alt = thumbImg.alt;
        } else {
          /* Terugval (blauwdruk-placeholder zonder echte foto's): label/tint wisselen. */
          var label = thumb.getAttribute("data-label");
          if (label) mainMedia.setAttribute("data-label", label);
          var m1 = thumb.getAttribute("data-m1");
          var m2 = thumb.getAttribute("data-m2");
          if (m1) mainMedia.style.setProperty("--m1", m1);
          if (m2) mainMedia.style.setProperty("--m2", m2);
        }
        document
          .querySelectorAll("[data-gallery-thumb]")
          .forEach(function (t) { t.classList.remove("is-active"); });
        thumb.classList.add("is-active");
      });
    });
  }

  /* ------------------------------------------------------------------
     6) MAATKEUZE: enkelvoudige selectie
     ------------------------------------------------------------------ */
  document.querySelectorAll("[data-size-group]").forEach(function (group) {
    group.querySelectorAll("[data-size]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        group.querySelectorAll("[data-size]").forEach(function (b) {
          b.classList.remove("is-selected");
          b.setAttribute("aria-pressed", "false");
        });
        btn.classList.add("is-selected");
        btn.setAttribute("aria-pressed", "true");
      });
    });
  });

  /* ------------------------------------------------------------------
     7) AANTAL-STEPPER
     ------------------------------------------------------------------ */
  document.querySelectorAll("[data-qty]").forEach(function (wrap) {
    var input = wrap.querySelector("input");
    var minus = wrap.querySelector("[data-qty-minus]");
    var plus = wrap.querySelector("[data-qty-plus]");
    function val() { return Math.max(1, parseInt(input.value, 10) || 1); }
    if (minus) minus.addEventListener("click", function () {
      input.value = Math.max(1, val() - 1);
    });
    if (plus) plus.addEventListener("click", function () {
      input.value = val() + 1;
    });
  });

  /* 8) IN WINKELMAND + winkelmand-badge worden in het Shopify-thema door
        Liquid/Shopify geregeld (productformulier {% form 'product' %} en
        {{ cart.item_count }}). De demo-logica is hier daarom verwijderd. */

  /* ------------------------------------------------------------------
     9) NIEUWSBRIEF: preventDefault -> bedankboodschap
     ------------------------------------------------------------------ */
  document.querySelectorAll(".newsletter-form").forEach(function (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var thanks = form.parentElement.querySelector(".newsletter__thanks");
      form.hidden = true;
      var disclaimer = form.parentElement.querySelector(".newsletter__disclaimer");
      if (disclaimer) disclaimer.hidden = true;
      if (thanks) {
        thanks.hidden = false;
        thanks.setAttribute("role", "status");
      }
    });
  });

  /* ------------------------------------------------------------------
     10) REVEAL-ON-SCROLL via IntersectionObserver
     ------------------------------------------------------------------ */
  var reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && reveals.length) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("is-visible"); });
  }

  /* ------------------------------------------------------------------
     10b) STICKY 'IN WINKELMAND'-BALK (verschijnt bij scrollen voorbij de knop)
     ------------------------------------------------------------------ */
  var stickyBar = document.querySelector("[data-sticky-atc]");
  if (stickyBar) {
    var pForm = document.getElementById("product-form");
    var atcAnchor = pForm
      ? (pForm.querySelector(".product-actions") || pForm.querySelector("[name='add']"))
      : null;
    if (atcAnchor && "IntersectionObserver" in window) {
      var stickyIO = new IntersectionObserver(
        function (entries) {
          var e = entries[0];
          if (!e.isIntersecting && e.boundingClientRect.top < 0) {
            stickyBar.classList.add("is-visible");
            stickyBar.setAttribute("aria-hidden", "false");
          } else {
            stickyBar.classList.remove("is-visible");
            stickyBar.setAttribute("aria-hidden", "true");
          }
        },
        { threshold: 0 }
      );
      stickyIO.observe(atcAnchor);
    }
    /* Prijs live bijwerken bij variantkeuze (hoofdprijs + sticky-balk) */
    var vSelect = document.getElementById("variant-select");
    if (vSelect) {
      vSelect.addEventListener("change", function () {
        var opt = vSelect.options[vSelect.selectedIndex];
        var p = opt && opt.getAttribute("data-price");
        if (p) {
          document.querySelectorAll("[data-product-price]").forEach(function (el) {
            el.textContent = p;
          });
        }
      });
    }
  }

  /* ------------------------------------------------------------------
     10c) TOAST / POPUP-MELDING
     Toont kort een melding rechtsboven (mobiel: onderaan). Verdwijnt na ~2,5s.
     ------------------------------------------------------------------ */
  var toastHost = document.querySelector("[data-toast]");
  function toast(msg, withCheck) {
    if (!toastHost) return;
    var el = document.createElement("div");
    el.className = "toast";
    el.setAttribute("role", "status");
    if (withCheck !== false) {
      el.innerHTML =
        '<span class="toast__icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg></span>';
    }
    var txt = document.createElement("span");
    txt.className = "toast__msg";
    txt.textContent = msg;
    el.appendChild(txt);
    toastHost.appendChild(el);
    /* In beeld schuiven in de volgende frame. */
    raf(function () { raf(function () { el.classList.add("is-visible"); }); });
    window.setTimeout(function () {
      el.classList.remove("is-visible");
      window.setTimeout(function () {
        if (el.parentNode) el.parentNode.removeChild(el);
      }, 350);
    }, 2500);
  }

  /* ------------------------------------------------------------------
     10d) WINKELMAND-LADE — inhoud, aantal wijzigen en verwijderen
     Draait op ELKE pagina (niet alleen op de productpagina), want ook vanaf
     de collectiepagina moet je in de lade een aantal kunnen aanpassen of een
     artikel kunnen verwijderen. Praat met Shopify via /cart.js en
     /cart/change.js. Geeft een klein object terug dat hoofdstuk 10d gebruikt.
     ------------------------------------------------------------------ */
  var smCart = (function initCartDrawer() {
    var drawerEl = document.querySelector("[data-cart]");
    var cartCountEls = document.querySelectorAll("[data-cart-count]");
    var cartItemsHost = document.querySelector("[data-cart-items]");
    var cartEmptyEl = document.querySelector("[data-cart-empty]");

    /* Voet en voortgangsbalk. */
    var subtotalEl = document.querySelector("[data-cart-subtotal]");
    var shippingEl = document.querySelector("[data-cart-shipping]");
    var shippingRow = document.querySelector("[data-cart-shipping-row]");
    var totalEl = document.querySelector("[data-cart-total]");
    var totalRow = document.querySelector("[data-cart-total-row]");
    var discountEl = document.querySelector("[data-cart-discount]");
    var discountRow = document.querySelector("[data-cart-discount-row]");
    var progressEl = document.querySelector("[data-cart-progress]");
    var progressTextEl = document.querySelector("[data-cart-progress-text]");
    var progressBarEl = document.querySelector("[data-cart-progress-bar]");

    function attr(name, fallback) {
      var v = drawerEl ? drawerEl.getAttribute(name) : null;
      return v === null || v === "" ? fallback : v;
    }

    var moneyFormat = drawerEl ? drawerEl.getAttribute("data-money-format") : null;
    var freeShipOn = attr("data-free-shipping", "false") === "true";
    var freeThreshold = parseInt(attr("data-free-threshold", "0"), 10) || 0;
    var shipCost = parseInt(attr("data-shipping-cost", "0"), 10) || 0;
    var textProgress = attr("data-progress-text", "Voeg nog [bedrag] toe voor gratis verzending");
    var textDone = attr("data-progress-done", "Gelukt — je bestelling wordt gratis verzonden");
    var labelFree = attr("data-free-label", "Gratis");
    var labelEmpty = attr("data-empty-label", "Berekend bij afrekenen");

    var quantityLabel = (cartItemsHost && cartItemsHost.getAttribute("data-quantity-label")) || "Aantal";
    var removeLabel = (cartItemsHost && cartItemsHost.getAttribute("data-remove-label")) || "Verwijderen";
    var lessLabel = (cartItemsHost && cartItemsHost.getAttribute("data-less-label")) || "Eén minder";
    var moreLabel = (cartItemsHost && cartItemsHost.getAttribute("data-more-label")) || "Eén meer";

    /* Prijsnotatie exact zoals Shopify hem elders op de site toont, zodat het
       bedrag in de lade er hetzelfde uitziet als op de productpagina. */
    function money(cents) {
      var euros = cents / 100;
      if (moneyFormat && moneyFormat.indexOf("amount") !== -1) {
        var comma = moneyFormat.indexOf("comma_separator") !== -1;
        var noDecimals = moneyFormat.indexOf("no_decimals") !== -1;
        var value = noDecimals ? Math.round(euros).toString() : euros.toFixed(2);
        /* Duizendtallen groeperen volgens dezelfde notatie. */
        var parts = value.split(".");
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, comma ? "." : ",");
        value = parts.length > 1 ? parts[0] + (comma ? "," : ".") + parts[1] : parts[0];
        return moneyFormat.replace(/\{\{\s*amount[a-z_]*\s*\}\}/, value);
      }
      return "€ " + euros.toFixed(2).replace(".", ",");
    }

    /* Productnamen komen uit Shopify en kunnen een apostrof of & bevatten. */
    function esc(str) {
      return String(str === null || str === undefined ? "" : str)
        .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
    }

    function updateCount(count) {
      /* Nooit "undefined" in het bolletje laten belanden. */
      var n = typeof count === "number" && isFinite(count) ? count : 0;
      cartCountEls.forEach(function (el) {
        el.textContent = n;
        if (n > 0) {
          el.removeAttribute("data-empty");
        } else {
          el.setAttribute("data-empty", "true");
        }
      });
    }

    /* /cart.js geeft de foto op ware grootte terug (soms enkele megabytes).
       Voor een vakje van 76 pixels vragen we een kleine versie op. */
    function fotoUrl(url) {
      if (!url) return "";
      return url + (url.indexOf("?") > -1 ? "&" : "?") + "width=200";
    }

    function itemHtml(item, index) {
      var img = item.image
        ? '<img src="' + esc(fotoUrl(item.image)) + '" alt="" loading="lazy" width="76" height="101">'
        : '<div class="media media--portrait media--blank" data-label="' + esc(item.product_title) + '"></div>';
      var minUit = item.quantity <= 1 ? " disabled" : "";
      var variant =
        item.variant_title && item.variant_title !== "Default Title"
          ? '<p class="cart-item__meta">' + esc(item.variant_title) + "</p>"
          : "";
      return (
        '<div class="cart-item" data-line="' + index + '">' +
          '<a class="cart-item__media" href="' + esc(item.url) + '">' + img + "</a>" +
          '<div class="cart-item__info">' +
            '<p class="cart-item__name"><a href="' + esc(item.url) + '">' +
              esc(item.product_title || item.title) +
            "</a></p>" +
            variant +
            '<div class="cart-item__row">' +
              '<div class="qty-step" data-qty role="group" aria-label="' + esc(quantityLabel) + '">' +
                '<button class="qty-step__btn" type="button"' + minUit + ' data-qty-down aria-label="' + esc(lessLabel) + '">&minus;</button>' +
                '<span class="qty-step__value" data-qty-value>' + item.quantity + "</span>" +
                '<button class="qty-step__btn" type="button" data-qty-up aria-label="' + esc(moreLabel) + '">+</button>' +
              "</div>" +
              '<p class="cart-item__price">' + money(item.final_line_price) + "</p>" +
            "</div>" +
          "</div>" +
          '<button class="cart-item__remove" type="button" data-line-remove aria-label="' + esc(removeLabel) + '">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true" width="14" height="14">' +
            '<line x1="6" y1="6" x2="18" y2="18" /><line x1="18" y1="6" x2="6" y2="18" /></svg>' +
          "</button>" +
        "</div>"
      );
    }

    function renderTotals(cart) {
      var leeg = cart.item_count === 0;

      /* Subtotaal = optelsom van de getoonde artikelen, zodat het scherm
         altijd klopt. Een kortingscode krijgt een eigen regel. */
      var artikelen = typeof cart.items_subtotal_price === "number"
        ? cart.items_subtotal_price
        : cart.total_price;
      var korting = artikelen - cart.total_price;

      if (subtotalEl) {
        if (leeg) {
          subtotalEl.className = "text-muted";
          subtotalEl.textContent = labelEmpty;
        } else {
          subtotalEl.className = "";
          subtotalEl.textContent = money(artikelen);
        }
      }

      if (discountRow) discountRow.hidden = leeg || korting <= 0;
      if (discountEl) discountEl.textContent = "−" + money(korting);

      /* Gratis vanaf de drempel; daaronder de vaste verzendkosten.
         Zelfde vergelijking als in de Liquid, anders springt het bedrag zodra
         de klant een aantal aanpast. */
      var gratis = cart.total_price >= freeThreshold;
      var verzend = leeg || gratis ? 0 : shipCost;

      if (shippingRow) shippingRow.hidden = leeg;
      if (totalRow) totalRow.hidden = leeg;
      if (shippingEl) shippingEl.textContent = gratis ? labelFree : money(verzend);
      if (totalEl) totalEl.textContent = money(cart.total_price + verzend);

      /* Voortgangsbalk. */
      if (progressEl && freeShipOn && freeThreshold > 0) {
        progressEl.hidden = leeg;
        var pct = Math.min(100, Math.round((cart.total_price / freeThreshold) * 100));
        if (progressBarEl) progressBarEl.style.width = pct + "%";
        if (progressTextEl) {
          var bedragTekst = money(freeThreshold - cart.total_price);
          progressTextEl.textContent = gratis
            ? textDone
            : textProgress.replace("[bedrag]", bedragTekst).replace("{bedrag}", bedragTekst);
        }
      }
    }

    function renderCart(cart) {
      updateCount(cart.item_count);

      if (cart.item_count === 0) {
        if (cartEmptyEl) cartEmptyEl.hidden = false;
        if (cartItemsHost) cartItemsHost.innerHTML = "";
      } else {
        if (cartEmptyEl) cartEmptyEl.hidden = true;
        if (cartItemsHost) {
          var html = "";
          cart.items.forEach(function (item, i) {
            /* Shopify telt regels vanaf 1 in /cart/change.js. */
            html += itemHtml(item, i + 1);
          });
          cartItemsHost.innerHTML = html;
        }
      }

      /* Afrekenknop uitschakelen zolang de winkelmand leeg is. */
      var checkoutBtn = document.querySelector("[data-cart-checkout]");
      if (checkoutBtn) {
        if (cart.item_count === 0) {
          checkoutBtn.setAttribute("disabled", "disabled");
        } else {
          checkoutBtn.removeAttribute("disabled");
        }
      }

      renderTotals(cart);
    }

    function refreshCart() {
      return fetch("/cart.js", {
        headers: { Accept: "application/json" },
        credentials: "same-origin",
      })
        .then(function (r) { return r.json(); })
        .then(function (cart) { renderCart(cart); return cart; });
    }

    /* Aantal wijzigen of een regel verwijderen. quantity 0 = verwijderen. */
    var bezig = false;
    var focusRegel = null;
    var focusKnop = null;

    /* Na het hertekenen bestaat de aangeklikte knop niet meer. Zonder dit
       springt de toetsenbordfocus terug naar het begin van de pagina en kun
       je niet twee keer achter elkaar op + drukken. */
    function herstelFocus() {
      if (!focusRegel || !focusKnop || !cartItemsHost) return;
      var knop = cartItemsHost.querySelector(
        '.cart-item[data-line="' + focusRegel + '"] [' + focusKnop + "]"
      );
      if (knop && !knop.disabled) knop.focus();
      focusRegel = null;
      focusKnop = null;
    }

    function changeLine(line, quantity) {
      if (bezig) return Promise.resolve();
      bezig = true;
      if (cartItemsHost) cartItemsHost.classList.add("is-busy");
      return fetch("/cart/change.js", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "X-Requested-With": "XMLHttpRequest",
        },
        credentials: "same-origin",
        body: JSON.stringify({ line: line, quantity: quantity }),
      })
        .then(function (r) {
          /* Shopify antwoordt met 422 als er te weinig voorraad is, en met 400
             als het regelnummer niet meer bestaat. Zonder deze controle zou dat
             foutbericht als "winkelmand" doorgegeven worden en kwam er
             "undefined" in het bolletje bij het tasje te staan. */
          return r.json().then(function (data) {
            if (!r.ok || typeof data.item_count !== "number") {
              var fout = new Error("cart");
              fout.data = data;
              throw fout;
            }
            return data;
          });
        })
        .then(function (cart) { renderCart(cart); })
        .catch(function (err) {
          toast(
            (err && err.data && err.data.description) || "Aanpassen is niet gelukt",
            false
          );
          /* Echte stand terughalen, anders blijven er verkeerde aantallen staan. */
          return refreshCart().catch(function () {});
        })
        .then(function () {
          bezig = false;
          if (cartItemsHost) cartItemsHost.classList.remove("is-busy");
          herstelFocus();
        });
    }

    /* Eén luisteraar op het omhulsel: werkt ook voor regels die het script
       zelf later heeft toegevoegd. */
    if (cartItemsHost) {
      cartItemsHost.addEventListener("click", function (e) {
        var rij = e.target.closest ? e.target.closest(".cart-item") : null;
        if (!rij) return;
        var line = parseInt(rij.getAttribute("data-line"), 10);
        if (!line) return;

        var huidig = 1;
        var waardeEl = rij.querySelector("[data-qty-value]");
        if (waardeEl) huidig = parseInt(waardeEl.textContent, 10) || 1;

        /* closest() bestaat niet op SVG-elementen in oudere browsers; via de
           dichtstbijzijnde element-ouder werkt het overal. */
        var doel = e.target.nodeType === 1 ? e.target : e.target.parentElement;
        if (!doel || !doel.closest) return;

        if (doel.closest("[data-line-remove]")) {
          e.preventDefault();
          focusRegel = null;
          changeLine(line, 0);
        } else if (doel.closest("[data-qty-up]")) {
          e.preventDefault();
          focusRegel = line;
          focusKnop = "data-qty-up";
          changeLine(line, huidig + 1);
        } else if (doel.closest("[data-qty-down]")) {
          e.preventDefault();
          focusRegel = line;
          focusKnop = "data-qty-down";
          changeLine(line, huidig - 1);
        }
      });
    }

    return { refresh: refreshCart, render: renderCart };
  })();

  /* ------------------------------------------------------------------
     10e) AJAX 'IN WINKELMAND' + 'NU KOPEN' (#product-form)
     Voegt toe via /cart/add.js, werkt de badge + lade bij via /cart.js,
     opent de lade als popup en toont een toast. 'Nu kopen' gaat direct
     naar de kassa. Werkt ook met de sticky-balk (form="product-form").
     ------------------------------------------------------------------ */
  (function initAjaxCart() {
    var productForm = document.getElementById("product-form");
    if (!productForm) return;

    function refreshCart() {
      return smCart.refresh();
    }

    function addToCart(form) {
      return fetch("/cart/add.js", {
        method: "POST",
        body: new FormData(form),
        credentials: "same-origin",
        headers: {
          Accept: "application/json",
          "X-Requested-With": "XMLHttpRequest",
        },
      }).then(function (r) {
        if (!r.ok) {
          return r.json().then(function (err) {
            throw err;
          });
        }
        return r.json();
      });
    }

    /* 'In winkelmand' (submit van #product-form, ook de sticky-knop). */
    productForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var submitBtn = productForm.querySelector("[name='add']");
      if (submitBtn) submitBtn.setAttribute("disabled", "disabled");
      addToCart(productForm)
        .then(function () { return refreshCart(); })
        .then(function () {
          if (cartPanel) cartPanel.open();
          toast("In je winkelmand");
        })
        .catch(function (err) {
          toast((err && err.description) || "Toevoegen mislukt", false);
        })
        .then(function () {
          if (submitBtn) submitBtn.removeAttribute("disabled");
        });
    });

    /* 'Nu kopen': toevoegen en direct naar de kassa. */
    document.querySelectorAll("[data-buy-now]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        btn.setAttribute("disabled", "disabled");
        addToCart(productForm)
          .then(function () { window.location.href = "/checkout"; })
          .catch(function (err) {
            btn.removeAttribute("disabled");
            toast((err && err.description) || "Toevoegen mislukt", false);
          });
      });
    });
  })();

  /* ------------------------------------------------------------------
     11) ROTERENDE ANNOUNCEMENT-BAR
     Toont de boodschappen één voor één met een fade/slide-overgang.
     Markup: .announcement[data-announcement] > .announcement__viewport
             > .announcement__item (eerste heeft .is-active).
     ------------------------------------------------------------------ */
  var annBar = document.querySelector("[data-announcement]");
  if (annBar) {
    var annItems = annBar.querySelectorAll(".announcement__item");
    if (annItems.length > 1) {
      var annIndex = 0;
      var annDelay = 4000; // milliseconden per boodschap
      var annTimer = null;
      function annTick() {
        annItems[annIndex].classList.remove("is-active");
        annIndex = (annIndex + 1) % annItems.length;
        annItems[annIndex].classList.add("is-active");
      }
      function annStart() { if (!annTimer) annTimer = window.setInterval(annTick, annDelay); }
      function annStop() { if (annTimer) { window.clearInterval(annTimer); annTimer = null; } }
      /* Pauzeer als het tabblad verborgen is: geen onnodig werk op de achtergrond. */
      document.addEventListener("visibilitychange", function () {
        document.hidden ? annStop() : annStart();
      });
      annStart();
    }
  }

  /* ------------------------------------------------------------------
     12) NAVIGATIE-DROPDOWN ("Producten") — klik/toets-ondersteuning
     (op desktop opent het menu ook via hover/focus, puur via CSS)
     ------------------------------------------------------------------ */
  var dropdowns = document.querySelectorAll("[data-dropdown]");
  function closeAllDropdowns() {
    dropdowns.forEach(function (dd) {
      dd.classList.remove("is-open");
      var t = dd.querySelector("[data-dropdown-toggle]");
      if (t) t.setAttribute("aria-expanded", "false");
    });
  }
  dropdowns.forEach(function (dd) {
    var toggle = dd.querySelector("[data-dropdown-toggle]");
    if (!toggle) return;
    toggle.addEventListener("click", function (e) {
      e.preventDefault();
      var willOpen = !dd.classList.contains("is-open");
      closeAllDropdowns();
      if (willOpen) {
        dd.classList.add("is-open");
        toggle.setAttribute("aria-expanded", "true");
      }
    });
  });
  if (dropdowns.length) {
    document.addEventListener("click", function (e) {
      dropdowns.forEach(function (dd) {
        if (!dd.contains(e.target)) {
          dd.classList.remove("is-open");
          var t = dd.querySelector("[data-dropdown-toggle]");
          if (t) t.setAttribute("aria-expanded", "false");
        }
      });
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeAllDropdowns();
    });
  }

  /* ------------------------------------------------------------------
     13) PRODUCTFILTERS (blueprint-demo)
     Generiek, tolerant filter-systeem dat de zichtbare producten filtert
     op categorie / maat / kleur / prijs, plus sorteren, resultaatteller,
     "geen resultaten" en "wis filters". Werkt op basis van data-attributen:
       wrapper:  [data-shop]
       grid:     [data-grid]   met kaarten [data-card]
       kaart:    data-categorie, data-maten="m l xl", data-kleuren="zand klei",
                 data-prijs="129.95", data-nieuw="1"
       filters:  input[data-f="categorie"][value], [data-f="maat"][data-value],
                 [data-f="kleur"][data-value], input[type=range][data-f="prijs"],
                 select[data-f="sorteer"] (aanbevolen|nieuwste|prijs-op|prijs-af)
       overig:   [data-result-count], [data-no-results], [data-clear], [data-price-value]
     Ontbrekende attributen sluiten een kaart NOOIT uit (defensief).
     In Shopify wordt dit vervangen door de native collectie-/Search&Discovery-filtering.
     ------------------------------------------------------------------ */
  (function initShopFilters() {
    var shop = document.querySelector("[data-shop]");
    if (!shop) return;
    var grid = shop.querySelector("[data-grid]");
    if (!grid) return;

    var cards = Array.prototype.slice.call(grid.querySelectorAll("[data-card]"));
    cards.forEach(function (c, i) { c.setAttribute("data-order", i); });

    var catBoxes = shop.querySelectorAll('input[type="checkbox"][data-f="categorie"]');
    var sizeBtns = shop.querySelectorAll('[data-f="maat"]');
    var colorBtns = shop.querySelectorAll('[data-f="kleur"]');
    var priceInput = shop.querySelector('input[type="range"][data-f="prijs"]');
    var priceLabel = shop.querySelector("[data-price-value]");
    var sortSel = shop.querySelector('select[data-f="sorteer"]');
    var countEl = shop.querySelector("[data-result-count]");
    var noResults = shop.querySelector("[data-no-results]");
    var clearBtn = shop.querySelector("[data-clear]");

    function toArr(nodeList) { return Array.prototype.slice.call(nodeList); }

    function euro(n) { return "€" + n.toFixed(2).replace(".", ","); }

    function priceOf(card) {
      if (card.hasAttribute("data-prijs")) return parseFloat(card.getAttribute("data-prijs"));
      var m = card.textContent.match(/€\s*([0-9]+(?:[.,][0-9]{2})?)/);
      return m ? parseFloat(m[1].replace(".", "").replace(",", ".")) : NaN;
    }

    function checkedCats() {
      return toArr(catBoxes).filter(function (b) { return b.checked; })
        .map(function (b) { return (b.value || "").toLowerCase(); });
    }
    function selected(btns) {
      return toArr(btns).filter(function (b) {
        return b.classList.contains("is-selected") || b.getAttribute("aria-pressed") === "true";
      }).map(function (b) { return (b.getAttribute("data-value") || "").toLowerCase(); });
    }
    function tokens(card, attr) {
      return (card.getAttribute(attr) || "").toLowerCase().split(/\s+/).filter(Boolean);
    }

    function apply() {
      var cats = checkedCats();
      var sizes = selected(sizeBtns);
      var colors = selected(colorBtns);
      var maxPrice = priceInput ? parseFloat(priceInput.value) : Infinity;
      var priceIsMax = priceInput ? (maxPrice >= parseFloat(priceInput.max)) : true;

      var visible = 0;
      cards.forEach(function (card) {
        var ok = true;
        if (ok && cats.length) {
          var cc = (card.getAttribute("data-categorie") || "").toLowerCase();
          ok = cc ? cats.indexOf(cc) !== -1 : true;
        }
        if (ok && sizes.length) {
          var cm = tokens(card, "data-maten");
          ok = cm.length ? sizes.some(function (s) { return cm.indexOf(s) !== -1; }) : true;
        }
        if (ok && colors.length) {
          var ck = tokens(card, "data-kleuren");
          ok = ck.length ? colors.some(function (s) { return ck.indexOf(s) !== -1; }) : true;
        }
        if (ok && priceInput && !priceIsMax) {
          var pr = priceOf(card);
          if (!isNaN(pr)) ok = pr <= maxPrice + 0.001;
        }
        card.style.display = ok ? "" : "none";
        if (ok) visible++;
      });

      if (sortSel) {
        var mode = sortSel.value;
        var shown = cards.filter(function (c) { return c.style.display !== "none"; });
        shown.sort(function (a, b) {
          if (mode === "prijs-op") return priceOf(a) - priceOf(b);
          if (mode === "prijs-af") return priceOf(b) - priceOf(a);
          if (mode === "nieuwste") {
            var na = a.getAttribute("data-nieuw") === "1" ? 1 : 0;
            var nb = b.getAttribute("data-nieuw") === "1" ? 1 : 0;
            return nb - na || (a.getAttribute("data-order") - b.getAttribute("data-order"));
          }
          return a.getAttribute("data-order") - b.getAttribute("data-order");
        });
        shown.forEach(function (c) { grid.appendChild(c); });
      }

      if (countEl) countEl.textContent = visible + (visible === 1 ? " artikel" : " artikelen");
      if (noResults) noResults.hidden = visible !== 0;
      if (priceLabel && priceInput) priceLabel.textContent = priceIsMax ? "Alle prijzen" : "tot " + euro(maxPrice);
    }

    function toggle(btn) {
      var on = !btn.classList.contains("is-selected");
      btn.classList.toggle("is-selected", on);
      btn.setAttribute("aria-pressed", on ? "true" : "false");
    }

    toArr(catBoxes).forEach(function (b) { b.addEventListener("change", apply); });
    toArr(sizeBtns).forEach(function (b) { b.addEventListener("click", function () { toggle(b); apply(); }); });
    toArr(colorBtns).forEach(function (b) { b.addEventListener("click", function () { toggle(b); apply(); }); });
    if (priceInput) priceInput.addEventListener("input", apply);
    if (sortSel) sortSel.addEventListener("change", apply);
    if (clearBtn) {
      clearBtn.addEventListener("click", function () {
        toArr(catBoxes).forEach(function (b) { b.checked = false; });
        toArr(sizeBtns).concat(toArr(colorBtns)).forEach(function (b) {
          b.classList.remove("is-selected");
          b.setAttribute("aria-pressed", "false");
        });
        if (priceInput) priceInput.value = priceInput.max;
        if (sortSel) sortSel.value = "aanbevolen";
        apply();
      });
    }

    apply();
  })();

  /* ------------------------------------------------------------------
     14) ZOEK-VELD: eigen, ingetogen wisknop i.p.v. de standaard browser-knop
     ------------------------------------------------------------------ */
  (function initSearchClear() {
    var input = document.getElementById("search-input");
    if (!input) return;
    var form = input.closest(".search-form");
    if (!form) return;
    var clear = document.createElement("button");
    clear.type = "button";
    clear.className = "search-clear";
    clear.setAttribute("aria-label", "Zoekveld wissen");
    clear.hidden = true;
    clear.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/></svg>';
    input.insertAdjacentElement("afterend", clear);
    function update() { clear.hidden = !input.value; }
    input.addEventListener("input", update);
    clear.addEventListener("click", function () {
      input.value = "";
      update();
      input.focus();
    });
    update();
  })();


  /* ------------------------------------------------------------------
     15b) AUTO-BEWEGENDE SLIDERS OP MOBIEL ([data-autoslide])
     Categorie-tegels, reviews en Instagram schuiven op telefoons vanzelf door.
     Pauzeert zodra de bezoeker zelf veegt/scrolt, en hervat daarna.
     ------------------------------------------------------------------ */
  if (window.matchMedia) {
    var autoslideMQ = window.matchMedia("(max-width: 749px)");
    var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    document.querySelectorAll("[data-autoslide]").forEach(function (track) {
      var mode = track.getAttribute("data-autoslide");

      /* CONTINU DOORLOPENDE MARQUEE (o.a. Instagram). De inhoud is in de markup
         verdubbeld, zodat de lus naadloos doorloopt. Werkt op alle schermformaten. */
      if (mode === "continuous") {
        if (reduceMotion) return;
        var paused = false;
        /* Snelheid in pixels per seconde; instelbaar via data-speed.
           30 px/s leest rustig mee, 60 px/s is vlot. */
        var pxPerSecond = parseInt(track.getAttribute("data-speed"), 10) || 30;
        var speed = pxPerSecond / 60; /* per beeldje bij 60 fps */

        /* Alleen laten lopen als de band écht breder is dan het scherm.
           Op een laptop staat alles gewoon naast elkaar; dan valt er niets te
           schuiven. We meten dat één keer en opnieuw bij het draaien van het
           scherm — niet elk beeldje, want dat kost onnodig rekenwerk. */
        var canScroll = false;
        function meet() { canScroll = track.scrollWidth > track.clientWidth + 4; }
        meet();
        window.addEventListener("resize", debounce(meet, 200), { passive: true });

        function tick() {
          if (!paused && canScroll) {
            track.scrollLeft += speed;
            var half = track.scrollWidth / 2;
            if (half > 0 && track.scrollLeft >= half) { track.scrollLeft -= half; }
          }
          window.requestAnimationFrame(tick);
        }
        ["mouseenter", "touchstart", "pointerdown"].forEach(function (ev) {
          track.addEventListener(ev, function () { paused = true; }, { passive: true });
        });
        ["mouseleave", "touchend", "pointercancel"].forEach(function (ev) {
          track.addEventListener(ev, function () { paused = false; }, { passive: true });
        });
        window.requestAnimationFrame(tick);
        return;
      }

      /* GESTAPTE AUTO-SLIDE: tegels = 2s, reviews = 3s (interval uit data-autoslide).
         Alleen op mobiel, want daar zijn het sliders; op desktop blijven het grids. */
      var stepMs = parseInt(mode, 10) || 3500;
      var timer = null;
      var resumeTimer = null;
      function step() {
        var max = track.scrollWidth - track.clientWidth;
        if (track.scrollLeft >= max - 4) {
          track.scrollTo({ left: 0, behavior: "smooth" });
        } else {
          var first = track.children[0];
          var amount = first ? first.getBoundingClientRect().width + 16 : track.clientWidth * 0.8;
          track.scrollBy({ left: amount, behavior: "smooth" });
        }
      }
      function stop() { if (timer) { window.clearInterval(timer); timer = null; } }
      function start() { stop(); if (autoslideMQ.matches && !reduceMotion && track.scrollWidth > track.clientWidth + 4) { timer = window.setInterval(step, stepMs); } }
      function pauseThenResume() { stop(); window.clearTimeout(resumeTimer); resumeTimer = window.setTimeout(start, Math.max(4000, stepMs + 2000)); }
      ["pointerdown", "touchstart", "wheel", "mouseenter"].forEach(function (ev) {
        track.addEventListener(ev, pauseThenResume, { passive: true });
      });
      if (autoslideMQ.addEventListener) {
        autoslideMQ.addEventListener("change", function () { autoslideMQ.matches ? start() : stop(); });
      } else if (autoslideMQ.addListener) {
        autoslideMQ.addListener(function () { autoslideMQ.matches ? start() : stop(); });
      }
      start();
    });
  }

  /* ------------------------------------------------------------------
     16) ACCOUNT + VERLANGLIJST (demo via localStorage)
     - Ingelogd: verlanglijst-knop -> persoonlijke verlanglijst (op account.html).
     - Niet ingelogd: item komt onderin de winkelmand ("Bewaard voor later"),
       ZONDER dat de winkelmand-badge omhooggaat.
     In Shopify wordt dit vervangen door echte klant-accounts.
     ------------------------------------------------------------------ */
  (function () {
    function read(key) { try { return JSON.parse(localStorage.getItem(key)); } catch (e) { return null; } }
    function write(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) {} }
    function getUser() { return read("sm_user"); }
    function getList(key) { var v = read(key); return Array.isArray(v) ? v : []; }
    function has(list, name) { return list.some(function (i) { return i.name === name; }); }

    var savedBox = document.querySelector("[data-saved]");
    var savedItems = document.querySelector("[data-saved-items]");

    function renderSaved() {
      if (!savedItems) return;
      var list = getList("sm_saved");
      savedItems.innerHTML = "";
      list.forEach(function (it) {
        var el = document.createElement("div");
        el.className = "cart-item cart-item--saved";
        var mediaHtml;
        if (it.image) {
          var img = '<img class="media media--portrait" src="' + it.image + '" alt="' + (it.name || "") + '" loading="lazy">';
          mediaHtml = it.url ? '<a href="' + it.url + '">' + img + '</a>' : img;
        } else {
          mediaHtml = '<div class="media media--portrait" data-label="' + (it.label || it.name) + '"></div>';
        }
        el.innerHTML =
          mediaHtml +
          '<div><p class="cart-item__name">' + it.name + '</p>' +
          '<p class="cart-item__meta">' + (it.price || "") + '</p></div>' +
          '<button class="cart-item__remove" type="button" aria-label="Verwijderen" data-saved-remove="' + it.name + '">&times;</button>';
        savedItems.appendChild(el);
      });
      if (savedBox) savedBox.hidden = list.length === 0;
    }

    /* Zelfherstellend: haal voor een bewaard item zonder foto de echte
       productfoto live op uit Shopify (via de productlink, of door op naam te
       zoeken). Zo tonen ook items die ooit zonder foto zijn opgeslagen alsnog
       de afbeelding — zolang het product een foto heeft. */
    function normImg(v) {
      if (!v) return "";
      if (typeof v === "string") return v;
      if (v.url) return v.url;
      return "";
    }
    function fetchJSON(url) {
      return fetch(url, { headers: { Accept: "application/json" } })
        .then(function (r) { return r.ok ? r.json() : null; })
        .catch(function () { return null; });
    }
    function hydrateSaved(done) {
      var list = getList("sm_saved");
      var pending = list.filter(function (it) { return !it.image; });
      if (!pending.length) { if (done) done(); return; }
      var remaining = pending.length;
      function finish() {
        remaining -= 1;
        if (remaining <= 0) { write("sm_saved", list); if (done) done(); }
      }
      pending.forEach(function (it) {
        var lookup;
        if (it.url) {
          lookup = fetchJSON(it.url + ".js").then(function (p) {
            return p ? normImg(p.featured_image) : "";
          });
        } else {
          lookup = fetchJSON(
            "/search/suggest.json?q=" + encodeURIComponent(it.name) +
            "&resources[type]=product&resources[limit]=1"
          ).then(function (d) {
            var r = d && d.resources && d.resources.results && d.resources.results.products;
            var prod = r && r[0];
            if (!prod) return "";
            if (!it.url && prod.url) it.url = prod.url;
            return normImg(prod.featured_image) || normImg(prod.image);
          });
        }
        lookup.then(function (src) { if (src) it.image = src; }).catch(function () {}).then(finish);
      });
    }
    function refreshSaved() {
      renderSaved();
      if (savedItems) hydrateSaved(renderSaved);
    }

    if (savedItems) {
      savedItems.addEventListener("click", function (e) {
        var btn = e.target.closest && e.target.closest("[data-saved-remove]");
        if (!btn) return;
        var name = btn.getAttribute("data-saved-remove");
        write("sm_saved", getList("sm_saved").filter(function (i) { return i.name !== name; }));
        renderSaved();
      });
    }

    function flash(btn, msg) {
      if (!btn.getAttribute("data-orig")) btn.setAttribute("data-orig", btn.innerHTML);
      btn.innerHTML = msg;
      btn.classList.add("is-added");
      setTimeout(function () {
        btn.innerHTML = btn.getAttribute("data-orig");
        btn.classList.remove("is-added");
      }, 1800);
    }

    document.querySelectorAll("[data-wishlist]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var item = {
          name: btn.getAttribute("data-name") || "Artikel",
          price: btn.getAttribute("data-price") || "",
          label: btn.getAttribute("data-label") || btn.getAttribute("data-name") || "Artikel",
          image: btn.getAttribute("data-image") || "",
          url: btn.getAttribute("data-url") || "",
        };
        if (getUser()) {
          var wl = getList("sm_wishlist");
          if (!has(wl, item.name)) { wl.push(item); write("sm_wishlist", wl); }
          flash(btn, "In verlanglijst ♥");
          renderAccount();
        } else {
          var sv = getList("sm_saved");
          if (!has(sv, item.name)) { sv.push(item); write("sm_saved", sv); }
          refreshSaved();
          if (cartPanel) cartPanel.open();
          flash(btn, "Bewaard in winkelmand");
        }
      });
    });

    /* ---- Account-pagina ---- */
    var accountRoot = document.querySelector("[data-account]");

    function renderAccount() {
      if (!accountRoot) return;
      var user = getUser();
      var outEl = accountRoot.querySelector("[data-account-out]");
      var inEl = accountRoot.querySelector("[data-account-in]");
      if (outEl) outEl.hidden = !!user;
      if (inEl) inEl.hidden = !user;
      if (!user) return;
      var nameEl = accountRoot.querySelector("[data-account-name]");
      if (nameEl) nameEl.textContent = user.naam || user.email || "klant";
      var listEl = accountRoot.querySelector("[data-wishlist-list]");
      var emptyEl = accountRoot.querySelector("[data-wishlist-empty]");
      var wl = getList("sm_wishlist");
      if (listEl) {
        listEl.innerHTML = "";
        wl.forEach(function (it) {
          var el = document.createElement("div");
          el.className = "wl-item";
          el.innerHTML =
            '<div class="media media--portrait" data-label="' + (it.label || it.name) + '"></div>' +
            '<div class="wl-item__info"><p class="wl-item__name">' + it.name + '</p>' +
            '<p class="wl-item__price">' + (it.price || "") + '</p></div>' +
            '<button class="wl-item__remove" type="button" aria-label="Verwijderen" data-wl-remove="' + it.name + '">&times;</button>';
          listEl.appendChild(el);
        });
        listEl.hidden = wl.length === 0;
      }
      if (emptyEl) emptyEl.hidden = wl.length > 0;
    }

    if (accountRoot) {
      accountRoot.addEventListener("click", function (e) {
        var rm = e.target.closest && e.target.closest("[data-wl-remove]");
        if (!rm) return;
        var name = rm.getAttribute("data-wl-remove");
        write("sm_wishlist", getList("sm_wishlist").filter(function (i) { return i.name !== name; }));
        renderAccount();
      });

      var mergeSaved = function () {
        var sv = getList("sm_saved");
        if (!sv.length) return;
        var wl = getList("sm_wishlist");
        sv.forEach(function (it) { if (!has(wl, it.name)) wl.push(it); });
        write("sm_wishlist", wl);
        write("sm_saved", []);
        renderSaved();
      };

      var regForm = accountRoot.querySelector("[data-register-form]");
      if (regForm) regForm.addEventListener("submit", function (e) {
        e.preventDefault();
        var naam = regForm.querySelector("[name='naam']");
        var email = regForm.querySelector("[name='email']");
        write("sm_user", { naam: naam ? naam.value : "", email: email ? email.value : "" });
        mergeSaved();
        renderAccount();
      });

      var logForm = accountRoot.querySelector("[data-login-form]");
      if (logForm) logForm.addEventListener("submit", function (e) {
        e.preventDefault();
        var email = logForm.querySelector("[name='email']");
        var mail = email ? email.value : "";
        var existing = getUser();
        write("sm_user", { naam: (existing && existing.naam) || (mail ? mail.split("@")[0] : "klant"), email: mail });
        mergeSaved();
        renderAccount();
      });

      var logoutBtn = accountRoot.querySelector("[data-logout]");
      if (logoutBtn) logoutBtn.addEventListener("click", function () {
        try { localStorage.removeItem("sm_user"); } catch (e) {}
        renderAccount();
      });
    }

    refreshSaved();
    renderAccount();
  })();
})();

/* ==========================================================================
   17) POP-UP-MOTOR ([data-sm-popup])
   Regelt wanneer een pop-up verschijnt, hoe hij sluit en of hij onthouden
   wordt. Alle keuzes komen uit de Thema-editor via data-attributen:
     data-sm-popup   = unieke sleutel (voor het onthouden)
     data-trigger    = "delay" | "scroll" | "exit" | "immediate"
     data-delay      = seconden (bij trigger "delay")
     data-scroll     = percentage van de pagina (bij trigger "scroll")
     data-days       = hoeveel dagen niet opnieuw tonen (0 = elke keer)
     data-editor     = "true" in de Thema-editor: altijd tonen, niets onthouden
   ========================================================================== */
(function () {
  "use strict";

  var popups = document.querySelectorAll("[data-sm-popup]");
  if (!popups.length) return;

  function storageKey(el) { return "sm_popup_" + el.getAttribute("data-sm-popup"); }

  function isDismissed(el) {
    if (el.getAttribute("data-editor") === "true") return false;
    var days = parseInt(el.getAttribute("data-days") || "0", 10);
    if (!days) return false;
    try {
      var until = parseInt(window.localStorage.getItem(storageKey(el)) || "0", 10);
      return until && Date.now() < until;
    } catch (e) { return false; }
  }

  function remember(el) {
    if (el.getAttribute("data-editor") === "true") return;
    var days = parseInt(el.getAttribute("data-days") || "0", 10);
    if (!days) return;
    try {
      window.localStorage.setItem(storageKey(el), String(Date.now() + days * 864e5));
    } catch (e) {}
  }

  function anyModalOpen() {
    return !!document.querySelector(".sm-popup.is-open:not(.sm-popup--corner)");
  }

  function open(el) {
    if (el.classList.contains("is-open")) return;
    /* Nooit twee vensters tegelijk over elkaar heen tonen. */
    if (!el.classList.contains("sm-popup--corner") && anyModalOpen()) return;
    el.classList.add("is-open");
    el.removeAttribute("aria-hidden");
    /* Alleen bij een echt venster de pagina vastzetten, niet bij een hoekkaartje. */
    if (!el.classList.contains("sm-popup--corner")) document.body.classList.add("sm-popup-open");
    var focusable = el.querySelector("input, button, a[href]");
    if (focusable) { try { focusable.focus({ preventScroll: true }); } catch (e) {} }
  }

  function close(el, save) {
    el.classList.remove("is-open");
    el.setAttribute("aria-hidden", "true");
    /* Scroll pas weer vrijgeven als er echt geen venster meer openstaat. */
    if (!anyModalOpen()) document.body.classList.remove("sm-popup-open");
    if (save !== false) remember(el);
  }

  popups.forEach(function (el) {
    var editor = el.getAttribute("data-editor") === "true";

    /* Sluiten: kruisje, "nee bedankt", klik op de donkere laag en Escape. */
    el.querySelectorAll("[data-sm-popup-close]").forEach(function (btn) {
      btn.addEventListener("click", function (e) { e.preventDefault(); close(el); });
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && el.classList.contains("is-open")) close(el);
    });

    /* Na een geslaagde inschrijving niet meer opnieuw tonen. */
    if (el.querySelector("[data-sm-popup-success]")) remember(el);

    if (isDismissed(el)) return;

    /* In de Thema-editor meteen tonen, zodat de eigenaar hem kan bewerken. */
    if (editor) { open(el); return; }

    var trigger = el.getAttribute("data-trigger") || "delay";

    if (trigger === "immediate") {
      open(el);
    } else if (trigger === "scroll") {
      var pct = parseInt(el.getAttribute("data-scroll") || "40", 10);
      var onScroll = function () {
        var h = document.documentElement.scrollHeight - window.innerHeight;
        var done = h > 0 ? (window.scrollY / h) * 100 : 100;
        if (done >= pct) { open(el); window.removeEventListener("scroll", onScroll); }
      };
      window.addEventListener("scroll", onScroll, { passive: true });
      onScroll();
    } else if (trigger === "exit") {
      /* Muis verlaat het venster aan de bovenkant = bezoeker gaat weg. */
      var onLeave = function (e) {
        if (e.clientY <= 0) { open(el); document.removeEventListener("mouseout", onLeave); }
      };
      document.addEventListener("mouseout", onLeave);
      /* Op de telefoon bestaat "muis naar boven" niet: dan na 25 seconden. */
      window.setTimeout(function () { open(el); }, 25000);
    } else {
      var secs = parseInt(el.getAttribute("data-delay") || "5", 10);
      window.setTimeout(function () { open(el); }, secs * 1000);
    }
  });
})();

/* ==========================================================================
   18) COOKIEMELDING ([data-sm-cookiebar])
   ========================================================================== */
(function () {
  "use strict";

  var bar = document.querySelector("[data-sm-cookiebar]");
  if (!bar) return;

  var KEY = "sm_cookie_notice";
  var editor = bar.getAttribute("data-editor") === "true";
  var days = parseInt(bar.getAttribute("data-days") || "180", 10);

  function answered() {
    if (editor) return false;
    try {
      var until = parseInt(window.localStorage.getItem(KEY) || "0", 10);
      return until && Date.now() < until;
    } catch (e) { return false; }
  }

  function store() {
    if (editor) return;
    try { window.localStorage.setItem(KEY, String(Date.now() + days * 864e5)); } catch (e) {}
  }

  bar.querySelectorAll("[data-sm-cookie-dismiss]").forEach(function (btn) {
    btn.addEventListener("click", function (e) {
      e.preventDefault();
      store();
      bar.classList.remove("is-open");
      bar.setAttribute("aria-hidden", "true");
    });
  });

  if (!answered()) {
    window.setTimeout(function () {
      bar.classList.add("is-open");
      bar.removeAttribute("aria-hidden");
    }, editor ? 0 : 800);
  }
})();

/* ==========================================================================
   v10 PRODUCTTABS: tab wisselt de rij, pijlen scrollen de zichtbare rij
   ========================================================================== */
(function () {
  document.querySelectorAll("[data-tabs]").forEach(function (root) {
    var tabs = root.querySelectorAll("[data-tab]");
    var panels = root.querySelectorAll("[data-panel]");
    function track() {
      var open = Array.prototype.find.call(panels, function (p) { return !p.hidden; });
      return open && open.querySelector("[data-carousel]");
    }
    function arrows() {
      var t = track(); if (!t) return;
      var prev = root.querySelector("[data-carousel-prev]"), next = root.querySelector("[data-carousel-next]");
      if (prev) prev.disabled = t.scrollLeft < 4;
      if (next) next.disabled = t.scrollLeft + t.clientWidth >= t.scrollWidth - 4;
    }
    tabs.forEach(function (tab, i) {
      tab.addEventListener("click", function () {
        tabs.forEach(function (x, j) { x.classList.toggle("is-active", i === j); x.setAttribute("aria-selected", i === j ? "true" : "false"); });
        panels.forEach(function (p, j) { p.hidden = i !== j; });
        var t = track(); if (t) t.scrollLeft = 0;
        /* kaarten in een eerder verborgen tab alsnog zichtbaar maken */
        root.querySelectorAll(".reveal:not(.is-visible)").forEach(function (el) { el.classList.add("is-visible"); });
        arrows();
      });
    });
    root.querySelectorAll("[data-carousel-prev],[data-carousel-next]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var t = track(); if (!t) return;
        var dir = btn.hasAttribute("data-carousel-next") ? 1 : -1;
        t.scrollBy({ left: dir * t.clientWidth * 0.85, behavior: "smooth" });
      });
    });
    panels.forEach(function (p) { var t = p.querySelector("[data-carousel]"); if (t) t.addEventListener("scroll", arrows, { passive: true }); });
    arrows();
  });
})();
