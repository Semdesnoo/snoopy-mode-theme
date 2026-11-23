# Snoopy Mode — Shopify-thema v10.0

Dit is het complete Shopify-thema van Snoopy Mode. **Je past álles zelf aan in Shopify** — teksten, foto's,
kleuren, lettertypes, pop-ups en de volgorde van de blokken. En je stelt de **laptop-weergave en de mobiele
weergave apart** in.

*Nieuw in v10.0 (Rano-stijl): nieuwe opmaak met Bodoni Moda + Geist (zit in het thema, geen Google Fonts), rechte knoppen
die zich vullen bij hover, header met menu links en logo in het midden, nieuwe sectie **Producttabs** (tabs per collectie met
swipe-rij en pijlen), productkaarten in 2:3 met tweede foto bij hover en "-%"-label, productpagina met fotogalerij
(laptop: twee kolommen, telefoon: swipen met stipjes, tik = hele foto vergroot), verhaal-sectie met jullie eigen tekst,
nieuwsbrief en footer vernieuwd. Telefoonfoto's (staand) blijven gewoon werken: ze vallen netjes in de 2:3-vorm.
Kop-trucje: zet een woord tussen [ ] voor schuine letters, bijv. "De nieuwste [favorieten]".*
*In v9.4: winkelmand met gratis-verzendbalk, aantal aanpassen en verwijderen; verzendkosten en totaal in beeld; scherpere fotoformaten voor een snellere mobiele site.*
*In v8.8: retourvoorwaarden aangepast (14 dagen bedenktijd, kosten voor eigen rekening, Sale uitgesloten) en "Voor 17:00 besteld, morgen in huis".*
*In v6.1: drie pop-ups (nieuwsbrief, actie en cookiemelding) en standaardfoto's die in het thema zelf zitten.*

📦 Uploadbestand: **`snoopy-mode-theme.zip`** uit de release hierboven.


🌐 **Live preview:** https://semdesnoo.github.io/snoopy-mode-theme/ (winkelmand en afrekenen werken alleen in Shopify).
📦 **Nieuwste zip:** https://github.com/Semdesnoo/snoopy-mode-theme/releases/latest . Wordt automatisch opnieuw gebouwd bij elke wijziging.

Preview lokaal bouwen: `npm install` en dan `node preview/build.mjs` (schrijft naar `_site/`).

---

## 1. Uploaden (5 minuten)

1. Log in op je **Shopify-admin**.
2. Ga naar **Online Store → Thema's**.
3. Klik bij *Themabibliotheek* op **Toevoegen → Zip-bestand uploaden**.
4. Kies **`snoopy-mode-theme.zip`**.
5. Klik op **Voorbeeld**. Tevreden? Klik op **Publiceren**.

> **Tip:** verwijder oude versies uit je themabibliotheek, zodat je nooit per ongeluk een oude versie bewerkt.
> Je herkent de nieuwe aan de naam **"Snoopy Mode v10.0"**.

> **Let op:** instellingen die je in een oud thema hebt gemaakt gaan niet automatisch mee naar een nieuw thema.
> Dat is Shopify-eigen. Zet daarom eerst je logo, menu's en foto's goed in de nieuwe versie voordat je publiceert.

---

## 2. Waar pas ik wat aan?

Alles gebeurt in **Online Store → Thema's → Aanpassen**. Links zie je de blokken van de pagina, rechts de instellingen.

| Wat wil je aanpassen? | Waar? |
|---|---|
| Teksten, koppen en knoppen | Klik op het blok in de linkerkolom |
| Foto's (laptop + mobiel apart) | Idem — elk blok heeft "Foto — laptop & tablet" en "Foto — mobiel" |
| Volgorde van de homepage | Sleep de blokken in de linkerkolom |
| Blok verwijderen of toevoegen | Knop **Sectie toevoegen** / het oogje of prullenbakje bij een blok |
| Kleuren van de hele winkel | Themainstellingen (tandwiel onderaan) → **Kleuren** |
| Lettertype | Themainstellingen → **Lettertypes** |
| Tekstgrootte & witruimte | Themainstellingen → **Tekstgrootte & ruimte** (laptop en mobiel apart) |
| Logo | Blok **Koptekst** bovenaan (aparte breedte voor laptop en mobiel) |
| Adres, e-mail, KVK, social media | Themainstellingen → **Bedrijfsgegevens** / **Sociale media** |
| Menu's | Shopify → **Content → Menu's** (het hoofdmenu heet `main-menu`) |
| Welk menu-item opvalt (Sale) | Blok **Koptekst** → "Menu-item dat mag opvallen" |

---

## 3. Laptop en mobiel apart instellen

In vrijwel elk blok vind je:

- **Foto — laptop & tablet** en **Foto — mobiel**
  Laat je "mobiel" leeg, dan wordt de laptopfoto gebruikt. Vul je hem in, dan krijgen telefoons die foto.
  Handig: een liggende foto voor de laptop, een staande voor de telefoon.
- **Weergave op laptop & tablet** / **Weergave op mobiel**
  Hoogte, aantal naast elkaar, uitlijning en (bij de hero) hoe donker de laag over de foto is.
- **Deze sectie verbergen op mobiel / op laptop**
  Zo laat je iets alleen op de telefoon zien, of juist alleen op de grote schermen.
- **Ruimte boven en onder** — apart te kiezen voor laptop en mobiel.
- Bij de hero kun je zelfs een **kortere kop en tekst voor de telefoon** invullen.

---

## 4. De blokken die je kunt gebruiken

Op de homepage (en op de meeste pagina's) kun je met **Sectie toevoegen** deze blokken plaatsen:

| Blok | Waarvoor? |
|---|---|
| **Hero (grote foto)** | De grote sfeerfoto bovenaan met kop en knoppen |
| **USP-balk** | Smalle balk met pluspunten; iconen kies je uit een lijst |
| **Categorie-tegels** | Rij foto's per categorie |
| **Productrij** | Rij producten uit een collectie — plaats hem zo vaak je wilt |
| **Foto met tekst** | Foto naast een verhaal (bijv. over jullie tweeën) |
| **Fotobanner** | Brede foto met tekst eroverheen, ideaal voor een actie |
| **Tekstblok** | Losse kop met tekst en knoppen |
| **TikTok-rij** | Rij met clips of foto's die naar TikTok linken |
| **Klantbeoordelingen** | Quotes van klanten |
| **Nieuwsbrief** | Inschrijfformulier (inschrijvingen komen in Shopify → Klanten) |
| **Aankondigingsbalk** | Het smalle balkje bovenaan met wisselende zinnen |

---

## 5. Pop-ups

Onderaan de linkerkolom van de editor staan drie pop-ups. **Ze staan alle drie standaard uit** — zet ze aan met
één vinkje ("Pop-up aanzetten"). Zolang ze uit staan, ziet een bezoeker er niets van.

| Pop-up | Waarvoor? |
| --- | --- |
| **Pop-up — nieuwsbrief** | Venster met (bijvoorbeeld) een welkomstkorting en een inschrijfveld. Inschrijvingen komen in Shopify → Klanten |
| **Pop-up — actie of nieuws** | Venster met foto, boodschap en één of twee knoppen. Bijvoorbeeld "Nieuwe collectie" of "Zondag open" |
| **Cookiemelding** | Klein balkje onderaan met een korte tekst en een knop |

Bij elke pop-up stel je in:

- **Tekst en foto** — kop, tekst, knoppen, en aparte foto's voor laptop en mobiel (foto op mobiel verbergen kan ook).
- **Wanneer hij verschijnt** — na een aantal seconden, na een stuk scrollen, als de bezoeker weg lijkt te gaan, of meteen.
- **Hoe vaak** — "daarna X dagen niet meer tonen", zodat vaste klanten hem niet elke keer zien.
- **Waar** — op de hele website of alleen op de homepage; en apart uit te zetten voor mobiel of laptop.
- **Vorm** — een groot venster in het midden of een klein kaartje rechtsonder.

> **Handig:** in de Thema-editor is een pop-up die aanstaat **altijd zichtbaar**, ook als je hem net hebt weggeklikt.
> Zo kun je hem rustig bewerken. Bezoekers krijgen hem gewoon volgens jouw instellingen te zien.

> **Over de cookiemelding:** dit is een *melding*, geen echte toestemmingsmodule. Wil je netjes aan de Europese
> cookieregels voldoen, gebruik dan de banner van Shopify zelf (Instellingen → Klantprivacy → Cookiebanner).
> Zet er niet twee tegelijk aan.

---

## 6. Foto's die in het thema zelf zitten

Foto's die je in de Thema-editor kiest, horen bij **dat ene thema**. Upload je later een nieuwe versie, dan moet je
ze opnieuw kiezen. Daarom kan het thema ook **standaardfoto's** meedragen: die zitten in het themabestand zelf en
komen automatisch mee met elke nieuwe versie.

De volgorde op de website is:

1. Heb je in de Thema-editor een foto gekozen? Die wint altijd — je kunt dus alles gewoon zelf aanpassen.
2. Zo niet: de standaardfoto die in het thema zit.
3. Staat die er ook niet: het nette vlak met een tekstje (zoals nu).

Standaardfoto's zijn mogelijk voor: de hero, "Foto met tekst", de fotobanner, de categorie-tegels, beide pop-ups,
en de foto's op Over ons. Wil je die vastzetten? Lever de foto's aan, dan worden ze in het themabestand gezet
(zie `snippets/sm-default-image.liquid` voor de werkwijze).

---

## 7. Productpagina

Ook de productpagina is nu helemaal instelbaar (klik op **Productpagina** in de editor):

- **Pluspunten** onder de bestelknop — blokken met een icoon en tekst.
- **Uitklapblokken** (Omschrijving, Materiaal, Verzending, Maatadvies) — je bepaalt zelf titel, tekst en volgorde.
  Per blok kies je waar de tekst vandaan komt: je eigen tekst, de productomschrijving uit Shopify, of een metaveld.
- **Combineer met** — kop, knop en welke producten getoond worden.
- **Beoordelingen** â€” âš ï¸ de beoordelingen die er nu in staan zijn **voorbeelden**. Vervang ze door echte reacties
  van je klanten, of zet de sectie uit met het vinkje "Deze sectie tonen". Ook het gemiddelde cijfer en de
  sterrenverdeling vul je zelf in.
- **Maat-adviseur** — alle teksten én de maattabel (elke regel is een blok).

---

## 8. Nog in te stellen in Shopify zelf

Dit hoort bij Shopify en niet bij het thema:

- **Producten & collecties** — Producten → Toevoegen, met foto's, prijs en varianten (maat/kleur).
- **Menu's** — Content → Menu's. Maak `main-menu` met o.a. een item "Producten" met je collecties eronder
  (dat wordt automatisch het uitklapmenu). Koppel je niets, dan tonen we automatisch al je collecties.
- **Pagina's** — Content → Pagina's. Gebruik deze handles zodat de links in de footer kloppen:
  `over-ons`, `contact`, `algemene-voorwaarden`, `privacybeleid`, `cookies`, `maattabel`,
  `verzending-retour`, `veelgestelde-vragen`, `betaalmethoden`.
  Kies bij *Themasjabloon* het bijbehorende maatwerk-sjabloon als dat in de lijst staat; anders werkt "Default page" ook.
- **Betaalmethoden** — Instellingen → Betalingen (Shopify Payments voor iDEAL).
- **Verzendkosten** — Instellingen → Verzending.

---

## 9. Ga-live checklist

- [ ] Thema geüpload en gepubliceerd (v10.0)
- [ ] Logo geüpload (laptop + mobiel) en favicon ingesteld
- [ ] Hoofdmenu `main-menu` en footer-menu's ingesteld
- [ ] Eigen foto's geplaatst in hero, categorie-tegels en "Foto met tekst" — ook de mobiele versies
- [ ] Producten en collecties toegevoegd; bij elke productrij de juiste collectie gekozen
- [ ] Voorbeeldbeoordelingen op de productpagina vervangen of uitgezet
- [ ] Besloten welke pop-ups aan gaan (en of je de cookiebanner van Shopify zelf gebruikt)
- [ ] Bedrijfsgegevens en sociale media gecontroleerd
- [ ] Op de telefoon bekeken (in de editor kun je bovenaan schakelen tussen laptop en mobiel)
- [ ] Betaalmethoden en verzendkosten ingesteld
- [ ] Testbestelling gedaan

---

## 10. Voor de techniek (kort)

- **layout/theme.liquid** – raamwerk; zet de kleuren, lettertypes en maten uit de thema-instellingen om in CSS.
- **sections/** – alle blokken. Elk blok heeft een `{% schema %}` met de instellingen die je in de editor ziet.
- **snippets/** – herbruikbare stukjes: `sm-photo` (kiest tussen editorfoto, standaardfoto en placeholder),
  `sm-picture` (foto laptop/mobiel), `sm-default-image` (de standaardfoto's in het thema), `sm-icon`
  (iconenbibliotheek), `sm-section-class` (verbergen/ruimte/achtergrond per apparaat), `product-card`.
- **Pop-ups** – `sections/popup-newsletter.liquid`, `sections/popup-announcement.liquid` en
  `sections/cookie-notice.liquid`, ingeladen in `layout/theme.liquid`. De timing/onthoud-logica staat in
  `assets/global.js` (hoofdstuk 17 en 18) en de vormgeving in `assets/base.css` (hoofdstuk 32).
- **templates/** – welke blokken op welke pagina staan. `index.json` is de homepage en is volledig te slepen.
- **assets/base.css** – de vormgeving; hoofdstuk 31 bevat alles wat vanuit de editor bestuurd wordt.
- **config/settings_schema.json** – de themabrede instellingen (kleuren, lettertypes, bedrijfsgegevens).

Veel succes! 🖤

