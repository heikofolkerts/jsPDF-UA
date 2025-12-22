# Sprint 32: Showcase-Dokument Optimierung

**Ziel:** Umfassende Optimierung des PDF/UA Showcase-Dokuments für bessere Accessibility-Compliance und Konsistenz.

**Branch:** `feature/pdfua-implementation` (Entwicklung)
**PR-Branch:** `feature/pdfua-pr-clean` (nach Fertigstellung cherry-picken)

---

## Backlog

### Story 1: WCAG-Kontraste anpassen

**Priorität:** Hoch
**Betroffene Zeilen:** 77-78, 214-217, 397-400, 533-536, 650-653, 668-669, 746-748, 880-884, 984-990

**Beschreibung:**
Die Kontraste müssen den WCAG 2.1 AA-Anforderungen entsprechen (mindestens 4.5:1 für normalen Text, 3:1 für großen Text).

**Probleme:**

1. **Header/Footer-Text:**

   - Verwenden `setTextColor(128, 128, 128)` = #808080
   - Kontrast auf weiß: ~4.5:1 (grenzwertig, unter manchen Berechnungen nicht bestanden)

2. **Figuren-Platzhalter (Zeilen 650-653, 668-669):**

   - Text "[Bar Chart: Q1=25%, Q2=30%, Q3=20%, Q4=25%]" in grau (#808080)
   - Text "[Flow: Input -> Process -> Output]" in grau (#808080)
   - Diese Texte repräsentieren Bildinhalte und müssen lesbar sein

3. **Alt-Text der Figuren:**

   - Alt-Text wird vom Screenreader vorgelesen, ist aber sehr lang
   - Der sichtbare Platzhaltertext sollte ebenfalls WCAG-konform sein

4. Austauschen der Bilder, sodass auch Text im Bild den WCAG-Kriterien entspricht.
   **Lösung:**

- Alle grauen Texte auf mindestens #595959 (Kontrast 7:1) ändern
- Oder #767676 für minimale WCAG AA Compliance (4.54:1)
- Empfehlung: #595959 (89, 89, 89) für bessere Lesbarkeit

**Akzeptanzkriterien:**

- [ ] Header/Footer-Text mit Kontrast ≥ 4.5:1
- [ ] Figuren-Platzhaltertext mit Kontrast ≥ 4.5:1
- [ ] Alle Grautöne auf mindestens #595959 oder #767676 angepasst
- [ ] Visuelle Prüfung bestätigt gute Lesbarkeit
- [ ] Text im Bild entspricht WCAG-Kontrast

---

### Story 2: Private-Element unsichtbar machen (API-Erweiterung)

**Priorität:** Hoch
**Betroffene Dateien:** `src/jspdf.js` (API), `tests/pdfua/showcase-pdfua-complete.js`

**Beschreibung:**
Text im Private-Element wird aktuell sichtbar im PDF angezeigt, aber vom Screenreader nicht vorgelesen. Dies führt zu Inkonsistenz zwischen visueller und auditiver Wahrnehmung.

**Gewählte Lösung: Option B** - API erweitern, sodass Private-Inhalte automatisch unsichtbar gerendert werden.

**Technische Umsetzung:**

1. **Text Rendering Mode in PDF:**

   - Mode 0: Fill text (normal, sichtbar)
   - Mode 3: Invisible (weder Fill noch Stroke)
   - PDF-Operator: `3 Tr` (set text rendering mode to invisible)

2. **API-Änderung in `beginPrivate()`:**

   ```javascript
   beginPrivate() {
     this.beginStructureElement('Private');
     // Text unsichtbar machen
     this.internal.write('3 Tr'); // Invisible text rendering mode
     return this;
   }
   ```

3. **API-Änderung in `endPrivate()`:**

   ```javascript
   endPrivate() {
     // Text rendering mode zurücksetzen auf normal
     this.internal.write('0 Tr'); // Fill text (normal)
     this.endStructureElement();
     return this;
   }
   ```

4. **Alternative mit State-Management:**
   - `setTextRenderingMode(mode)` als neue API-Methode
   - Automatisches Speichern/Wiederherstellen des vorherigen Modus

**Showcase bleibt unverändert:**

```javascript
doc.beginPrivate();
// Text wird jetzt automatisch unsichtbar gerendert
doc.text("[Internal metadata: doc-version=1.0, author-id=42]", 25, 154);
doc.endPrivate();
// Text ist wieder sichtbar
```

**Akzeptanzkriterien:**

- [ ] `beginPrivate()` setzt Text Rendering Mode auf 3 (invisible)
- [ ] `endPrivate()` setzt Text Rendering Mode zurück auf 0 (normal)
- [ ] Text im Private-Element ist nicht sichtbar im PDF
- [ ] Struktur-Tree enthält weiterhin das Private-Element
- [ ] Keine Auswirkung auf andere Elemente außerhalb von Private
- [ ] Unit-Test für unsichtbaren Private-Text

---

### Story 3: PDF 2.0 Features entfernen

**Priorität:** Hoch
**Betroffene Zeilen:** 31, 66, 124-125, 834-875, 957, 1030-1031

**Beschreibung:**
Da nur PDF/UA-1 (basierend auf PDF 1.7) unterstützt wird, sollten PDF 2.0 Features (DocumentFragment, Aside) aus dem Showcase-Dokument entfernt werden.

**Zu entfernen:**

1. Kommentar in Header (Zeile 31)
2. Bookmark "11. PDF 2.0 Elements" (Zeile 66)
3. TOC-Eintrag (Zeile 124-125)
4. Section 11 komplett (Zeilen 834-875)
5. Index-Eintrag "PDF 2.0 Elements" (Zeile 957)
6. Konsolenausgabe (Zeile 1030-1031)

**Umnummerierung:**

- "12. Bibliography" wird zu "11. Bibliography"
- Alle Referenzen aktualisieren

**Akzeptanzkriterien:**

- [ ] Keine PDF 2.0 Features im Dokument
- [ ] TOC, Bookmarks, Index aktualisiert
- [ ] Nummerierung konsistent

---

### Story 4: TOC und Bookmarks synchronisieren

**Priorität:** Hoch
**Betroffene Zeilen:** 56-67, 114-127

**Beschreibung:**
Inhaltsverzeichnis und Bookmarks müssen mit den tatsächlichen Seiteninhalten übereinstimmen.

**Aktuelle Zuordnung prüfen:**
| Kapitel | Bookmark-Seite | TOC-Seite | Tatsächlich |
|---------|---------------|-----------|-------------|
| 1. Introduction | 1 | 1 | Seite 1 |
| 2. Text Elements | 1 | 1 | Seite 1 |
| 3. Lists | 2 | 2 | Seite 2 |
| 4. Tables | 2 | 2 | Seite 2 |
| 5. Links | 2 | 2 | Seite 2 |
| 6. Forms | 3 | 3 | Seite 3 |
| 7. Quotes and Code | 3 | 3 | Seite 3 |
| 8. Footnotes | 4 | 4 | Seite 4 |
| 9. Figures and Captions | 4 | 4 | Seite 4 |
| 10. Advanced Elements | 5 | 5 | Seite 5 |
| 11. Bibliography | 6 | 6 | Seite 6 (nach Entfernung PDF 2.0) |

**Akzeptanzkriterien:**

- [ ] Alle Bookmark-Links führen zur korrekten Seite
- [ ] Alle TOC-Links führen zur korrekten Seite
- [ ] Seitenzahlen in TOC-Text stimmen
- [ ] Die namen der Bookmarks und im TOC entsprechen der Namen der Überschriften.
- [ ] Unterkapitel werden einheitlich im TOC dargestellt.

---

### Story 5: Überschriftenhierarchie korrigieren

**Priorität:** Mittel
**Betroffene Zeilen:** 683

**Beschreibung:**
Wenn Kapitel H2 verwenden, müssen Unterkapitel H3 verwenden.

**Problem:**

- Zeile 683: "9.1 Annotations" verwendet H2, sollte H3 sein

**Weitere Prüfung:**

- Alle H2/H3-Verwendungen auf korrekte Hierarchie prüfen
- Unterabschnitte in Section 10 verwenden korrekt H3

**Akzeptanzkriterien:**

- [ ] Hauptkapitel: H2
- [ ] Unterkapitel: H3
- [ ] Keine Ebenensprünge (H2 → H4)

---

### Story 6: Layout-Überlappungen beheben

**Priorität:** Mittel
**Betroffene Zeilen:** 129-141, 977

**Beschreibung:**

1. "End of PDF/UA..." überlappt den sichtbaren Text
2. Letzter TOC-Eintrag rutscht in die Überschrift "2. Text Elements"

**Problem 1 - Schlusssatz:**

- Schlusssatz bei y=262
- Index endet bei ca. y=254 (17 Einträge × 7 + 140 Start = 259)
- Kein Überlappungsproblem erkennbar, aber nach Entfernung von PDF 2.0 prüfen

**Problem 2 - TOC:**

- TOC startet bei y=88, 12 Einträge × 8 = 96, endet bei y=184
- Überschrift "2. Text Elements" bei y=180
- **Konflikt:** Eintrag 12 bei y=88+(11×8)=176, Überschrift bei y=180 - knapp!

**Lösung:**

- TOC-Spacing reduzieren oder Position anpassen
- Nach Entfernung von "PDF 2.0 Elements" nur noch 11 Einträge

**Akzeptanzkriterien:**

- [ ] Kein visueller Überlapp zwischen TOC und nächster Überschrift
- [ ] Schlusssatz hat ausreichend Abstand zum Index

---

### Story 7: P als Elternelement für Link, Code, Note, Annot

**Priorität:** Mittel
**Quelle:** https://accessible-pdf.info/de/basics/general/overview-of-the-pdf-tags/

**Beschreibung:**
Inline-Elemente wie Link, Code, Note und Annot sollten innerhalb eines P-Elements stehen, nicht als eigenständige Block-Elemente.

**Betroffene Stellen:**

1. **Links (Zeilen 377-381, 388-392):**

   ```javascript
   // Aktuell:
   doc.beginLink({ placement: 'Block' });
   doc.textWithLink(...);
   doc.endLink();

   // Sollte sein:
   doc.beginStructureElement('P');
   doc.beginLink();
   doc.textWithLink(...);
   doc.endLink();
   doc.endStructureElement();
   ```

2. **Code inline (Zeile 516-518):**

   - Bereits in P-Element - OK

3. **Code block (Zeilen 525-529):**

   - Block-Level Code kann eigenständig sein - prüfen

4. **Footnotes:**

   - API verwendet bereits korrekte Struktur

5. **Annotations (Zeilen 693-734):**
   - Annot-Elemente sollten in P eingebettet sein

**Akzeptanzkriterien:**

- [ ] Inline-Links in P-Element
- [ ] Inline-Code in P-Element (bereits OK)
- [ ] Annotationen in P-Element oder mit korrektem Parent

---

### Story 8: Formularfeld-Labels synchronisieren

**Priorität:** Mittel
**Betroffene Zeilen:** 433-462

**Beschreibung:**
Alternativtexte (für Screenreader) und sichtbare Beschriftungen müssen identisch sein.

**Aktuelle Inkonsistenzen:**
| Feld | Sichtbar | Label (AT) | Tooltip |
|------|----------|------------|---------|
| Name | "Name:" | "Full Name" | "Enter your full name" |
| Subscribe | (keins) | "Subscribe to newsletter" | "Check to receive..." |
| Country | "Country:" | "Country selection" | "Select your country..." |

**Lösung:**

- Sichtbare Labels VOR Feldern hinzufügen
- Label-Attribut = sichtbarer Text
- Tooltip kann erweiterte Beschreibung enthalten

**Akzeptanzkriterien:**

- [ ] Jedes Formularfeld hat sichtbare Beschriftung
- [ ] Label-Attribut = sichtbare Beschriftung
- [ ] Checkbox hat sichtbares Label daneben

---

### Story 9: Tab-Reihenfolge korrigieren

**Priorität:** Mittel

**Beschreibung:**
Die Reihenfolge beim Navigieren mit der Tab-Taste muss logisch und konsistent sein (links nach rechts, oben nach unten).

**Zu prüfen:**

1. Formularfelder auf Seite 3
2. Links auf Seite 2
3. TOC-Links auf Seite 1

**Mögliche Ursachen:**

- Annotations/Widgets werden in Erstellungsreihenfolge traversiert
- `/Tabs /S` ist gesetzt, aber Widget-Reihenfolge im Annots-Array bestimmt Tab-Order

**Lösung:**

- Formularfelder in visueller Reihenfolge erstellen
- Oder: Annots-Array sortieren (erfordert API-Änderung)

**Akzeptanzkriterien:**

- [ ] Tab navigiert von oben nach unten durch Formularfelder
- [ ] Tab navigiert logisch durch Links

---

### Story 10: Annotationen als geschlossen darstellen

**Priorität:** Niedrig
**Betroffene Zeilen:** 699, 715, 731

**Beschreibung:**
Annotationen sollen als geschlossene Kommentare (Icons) angezeigt werden, nicht als offene Popup-Fenster.

**Aktueller Code:**

```javascript
open: false; // Zeile 699 - OK
open: true; // Zeile 715 - sollte false sein
open: true; // Zeile 731 - sollte false sein (oder Demonstration entfernen)
```

**Lösung:**

- Alle Annotationen mit `open: false`
- Oder: Eine Annotation offen lassen als Demo, aber dokumentieren

**Akzeptanzkriterien:**

- [ ] Annotationen erscheinen als geschlossene Icons
- [ ] Bei Klick öffnet sich der Kommentar

---

### Story 11: PDF/A-Kennzeichnung hinzufügen

**Priorität:** Niedrig

**Beschreibung:**
Das Dokument soll zusätzlich als PDF/A gekennzeichnet werden, um die Validierung mit veraPDF zu verbessern.

**Hintergrund:**

- PDF/UA-1 basiert auf PDF 1.7
- PDF/A-2a oder PDF/A-3a sind mit PDF/UA-1 kompatibel
- veraPDF kann beide Standards gleichzeitig validieren

**Implementierung:**

1. XMP-Metadaten um PDF/A-Conformance erweitern
2. `<pdfaid:part>2</pdfaid:part>`
3. `<pdfaid:conformance>A</pdfaid:conformance>`

**Voraussetzungen:**

- Alle Fonts vollständig eingebettet (bereits erfüllt)
- Keine externen Referenzen
- Farbräume korrekt definiert

**Akzeptanzkriterien:**

- [ ] XMP enthält PDF/A-2a Conformance
- [ ] veraPDF validiert erfolgreich mit `--flavour 2a`
- [ ] Keine Konflikte zwischen PDF/A und PDF/UA

---

## Nicht im Scope

- Neue Features hinzufügen
- Ruby/Warichu (benötigt CJK-Fonts)
- Echte Bilder statt Text-Platzhalter (Graphics-Tagging nicht implementiert)

---

## Testplan

1. **Nach jeder Story:**

   - PDF generieren: `node tests/pdfua/showcase-pdfua-complete.js`
   - veraPDF-Validierung: `docker run --rm -v "$(pwd)/examples/temp:/data" verapdf/cli --flavour ua1 /data/pdfua-complete-showcase.pdf`

2. **Nach Abschluss:**
   - PAC-Validierung (Windows)
   - Acrobat Reader + Screenreader-Test
   - Tab-Navigation manuell prüfen

---

## Reihenfolge der Umsetzung

1. Story 3 (PDF 2.0 entfernen) - vereinfacht alle weiteren Änderungen
2. Story 4 (TOC/Bookmarks sync)
3. Story 5 (Überschriftenhierarchie)
4. Story 6 (Layout-Überlappungen)
5. Story 1 (WCAG-Kontraste)
6. Story 2 (Private unsichtbar)
7. Story 7 (P als Elternelement)
8. Story 8 (Formular-Labels)
9. Story 9 (Tab-Reihenfolge)
10. Story 10 (Annotationen geschlossen)
11. Story 11 (PDF/A)

---

## Geschätzte Komplexität

| Story | Komplexität | Risiko  |
| ----- | ----------- | ------- |
| 1     | Niedrig     | Niedrig |
| 2     | Niedrig     | Niedrig |
| 3     | Mittel      | Niedrig |
| 4     | Niedrig     | Niedrig |
| 5     | Niedrig     | Niedrig |
| 6     | Niedrig     | Niedrig |
| 7     | Mittel      | Mittel  |
| 8     | Niedrig     | Niedrig |
| 9     | Hoch        | Mittel  |
| 10    | Niedrig     | Niedrig |
| 11    | Hoch        | Hoch    |

---

**Erstellt:** 2025-12-19
**Status:** Backlog bereit
