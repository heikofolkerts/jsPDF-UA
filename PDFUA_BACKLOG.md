# PDF/UA Implementierungs-Backlog für jsPDF

## Überblick

Dieses Backlog beschreibt die erforderlichen Schritte zur Implementierung der PDF/UA (Universal Accessibility) Konformität gemäß ISO 14289-1 in jsPDF. PDF/UA stellt sicher, dass PDF-Dokumente für Hilfstechnologien wie Screenreader zugänglich sind.

## Hauptanforderungen PDF/UA-1

Gemäß ISO 14289-1 (basierend auf PDF 1.7) müssen folgende Kernbereiche implementiert werden:

1. **Tagged PDF** - Alle bedeutungsvollen Inhalte müssen semantisch korrekt getaggt sein
2. **Dokumentmetadaten** - XMP-Metadaten mit PDF/UA-Kennzeichnung und dc:title
3. **ViewerPreferences** - DisplayDocTitle muss auf true gesetzt sein
4. **Unicode-Mapping** - Alle Schriften müssen eingebettet und Unicode-mapped sein
5. **Alternativtexte** - Für alle Grafiken/Bilder müssen Alt-Texte vorhanden sein
6. **Strukturelle Semantik** - Korrekte Verwendung von Standard-Tags (H1-H6, P, L, Table, etc.)

---

## Epic 1: Grundlagen & Infrastruktur

### US-1.1: PDF/UA-Modus aktivieren/deaktivieren
**Als** Entwickler
**möchte ich** einen PDF/UA-Modus in jsPDF aktivieren können
**damit** die Bibliothek automatisch PDF/UA-konforme Dokumente erstellt.

**Akzeptanzkriterien:**
- Neue Option `pdfUA: true` im jsPDF-Konstruktor
- API-Methode `doc.enablePDFUA()` und `doc.disablePDFUA()`
- Interner Flag `internal.pdfUA.enabled`
- Dokumentation der Option

**Technische Details:**
- Erweitern von `src/jspdf.js` Konstruktor-Optionen
- Neues internes Objekt `internal.pdfUA` anlegen

**Story Points:** 3
**Priorität:** Hoch

---

### US-1.2: PDF/UA-Kennzeichnung in XMP-Metadaten
**Als** PDF/UA-konformes Dokument
**muss ich** die PDF/UA-Kennzeichnung in den XMP-Metadaten enthalten
**damit** Validatoren mich als PDF/UA erkennen.

**Akzeptanzkriterien:**
- Erweitere `xmp_metadata.js` Plugin um PDF/UA-Namespace
- Füge `pdfuaid:part` und `pdfuaid:conformance` zu Metadaten hinzu
- Automatische Aktivierung wenn PDF/UA-Modus an ist
- XML-Schema: `http://www.aiim.org/pdfua/ns/id/`

**Technische Details:**
```xml
<pdfuaid:part>1</pdfuaid:part>
<pdfuaid:conformance>A</pdfuaid:conformance>
```

**Abhängigkeiten:** US-1.1
**Story Points:** 5
**Priorität:** Hoch

---

### US-1.3: ViewerPreferences DisplayDocTitle aktivieren
**Als** PDF/UA-konformes Dokument
**muss ich** DisplayDocTitle auf true setzen
**damit** der Dokumenttitel (nicht Dateiname) im Viewer angezeigt wird.

**Akzeptanzkriterien:**
- Bei aktiviertem PDF/UA-Modus automatisch `DisplayDocTitle: true` setzen
- Integration mit bestehendem `viewerpreferences.js` Plugin
- Setze dc:title in XMP-Metadaten
- Warnung, wenn Titel nicht gesetzt wurde

**Technische Details:**
- Erweitere `src/modules/viewerpreferences.js`
- Hook in PDF/UA-Aktivierung einbauen
- Dokumenttitel aus `doc.setProperties({title: "..."})` übernehmen

**Abhängigkeiten:** US-1.1, US-1.2
**Story Points:** 3
**Priorität:** Hoch

---

## Epic 2: Tagged PDF Struktur

### US-2.1: Strukturbaum (Structure Tree) implementieren
**Als** PDF-Dokument
**muss ich** einen hierarchischen Strukturbaum haben
**damit** die logische Dokumentstruktur für Screenreader verfügbar ist.

**Akzeptanzkriterien:**
- Implementiere StructTreeRoot im Catalog
- Erstelle StructElem-Objekte für Inhalte
- Unterstütze Parent-Child-Beziehungen
- Implementiere ParentTree für Content-zu-Structure-Mapping
- Implementiere IDTree für benannte Elemente

**Technische Details:**
- Neue Datei: `src/modules/structure_tree.js`
- Interne API zum Hinzufügen von Strukturelementen
- Catalog-Erweiterung für `/StructTreeRoot`
- `/K` Array für Kinder
- `/P` Referenz für Parent

**Story Points:** 13
**Priorität:** Hoch

---

### US-2.2: Standard-Strukturelemente unterstützen
**Als** Entwickler
**möchte ich** Standard-PDF-Strukturelemente verwenden können
**damit** ich semantisch korrekte Dokumente erstelle.

**Akzeptanzkriterien:**
- Unterstützung für Document, Part, Sect, Div
- Unterstützung für H1-H6 (Überschriften)
- Unterstützung für P (Absatz)
- Unterstützung für L, LI, Lbl, LBody (Listen)
- Unterstützung für Table, TR, TH, TD (Tabellen)
- Unterstützung für Span, Quote, Note
- Unterstützung für Figure, Caption, Formula
- RoleMap für Custom Tags

**Technische Details:**
- Mapping zu PDF 1.7 Standard Structure Types (Tabelle 10.20 der PDF-Spec)
- API: `doc.beginStructureElement(type, attributes)`
- API: `doc.endStructureElement()`
- Stack-basierte Verwaltung für verschachtelte Elemente

**Abhängigkeiten:** US-2.1
**Story Points:** 21
**Priorität:** Hoch

---

### US-2.3: Content Marking implementieren
**Als** Inhaltselement
**muss ich** mit meinem Strukturelement verknüpft sein
**damit** Screenreader die Lesereihenfolge verstehen.

**Akzeptanzkriterien:**
- Implementiere Marked Content Sequences (BMC/EMC)
- Implementiere BDC/EMC mit Property Dictionary
- MCID (Marked Content Identifier) für jedes Content-Element
- Verknüpfung zwischen Content-Stream und StructElem über MCID
- Automatisches Marking wenn PDF/UA aktiv

**Technische Details:**
```
/P <</MCID 0>> BDC
  ... content ...
EMC
```
- Erweitere `text()`, `addImage()`, `line()`, etc.
- ParentTree für Page-zu-Structure-Mapping

**Abhängigkeiten:** US-2.1, US-2.2
**Story Points:** 21
**Priorität:** Hoch

---

### US-2.4: Artifact-Marking für dekorative Inhalte
**Als** Entwickler
**möchte ich** dekorative Elemente als Artifacts markieren
**damit** sie von Screenreadern ignoriert werden.

**Akzeptanzkriterien:**
- API: `doc.beginArtifact(type)` mit type: Pagination, Layout, Page
- API: `doc.endArtifact()`
- Automatische Artifact-Markierung für Hintergrundgrafiken (optional)
- Artifacts dürfen NICHT im Strukturbaum sein

**Technische Details:**
```
/Artifact <</Type /Pagination>> BDC
  ... decorative content ...
EMC
```

**Abhängigkeiten:** US-2.3
**Story Points:** 8
**Priorität:** Mittel

---

### US-2.5: Lesereihenfolge garantieren
**Als** Screenreader-Nutzer
**muss ich** den Inhalt in der logischen Reihenfolge vorgelesen bekommen
**damit** ich das Dokument verstehen kann.

**Akzeptanzkriterien:**
- Strukturbaum spiegelt logische Lesereihenfolge wider
- MCIDs werden in korrekter Reihenfolge vergeben
- Unterstützung für mehrspaltiges Layout
- Validierung der Reihenfolge

**Technische Details:**
- MCID-Counter pro Seite
- Tracking der Element-Reihenfolge im Strukturbaum
- Optional: API zum expliziten Setzen der Reihenfolge

**Abhängigkeiten:** US-2.3
**Story Points:** 8
**Priorität:** Hoch

---

## Epic 3: Text & Schriften

### US-3.1: Unicode-Mapping für alle Schriften
**Als** PDF/UA-Dokument
**müssen** alle Schriften Unicode-Mapping haben
**damit** Text extrahiert und vorgelesen werden kann.

**Akzeptanzkriterien:**
- Prüfe ToUnicode CMap für alle verwendeten Schriften
- Automatische Erstellung von ToUnicode für Standard-Fonts
- Validierung bei TrueType-Schriften
- Fehler/Warnung bei fehlender Unicode-Zuordnung

**Technische Details:**
- Erweitere Font-Handling in `src/jspdf.js`
- ToUnicode CMap-Generierung
- Bereits teilweise vorhanden in TTF-Support

**Abhängigkeiten:** US-1.1
**Story Points:** 13
**Priorität:** Hoch

---

### US-3.2: Natural Language Tagging
**Als** Screenreader
**muss ich** die Sprache des Dokuments kennen
**damit** ich die korrekte Aussprache verwenden kann.

**Akzeptanzkriterien:**
- Setze `/Lang` im Document Catalog (Hauptsprache)
- API: `doc.setLanguage('de-DE')`
- Optional: `/Lang` auf Strukturelement-Ebene für mehrsprachige Dokumente
- ISO 639 Sprachcodes

**Technische Details:**
- Erweitere `src/modules/setlanguage.js` oder integriere in PDF/UA-Modul
- Catalog-Eintrag: `/Lang (de-DE)`
- BCP 47 Language Tags

**Abhängigkeiten:** US-1.1
**Story Points:** 5
**Priorität:** Mittel

---

### US-3.3: ActualText für Abkürzungen/Sonderzeichen
**Als** Screenreader
**möchte ich** den tatsächlichen Text für Symbole/Abkürzungen kennen
**damit** ich ihn korrekt vorlesen kann.

**Akzeptanzkriterien:**
- API: `doc.setActualText(displayText, actualText)`
- ActualText-Attribut auf Strukturelement-Ebene
- Beispiel: "→" mit ActualText "Pfeil nach rechts"

**Technische Details:**
```javascript
doc.addStructuredText("→", {
  type: 'Span',
  actualText: 'Pfeil nach rechts'
});
```

**Abhängigkeiten:** US-2.2
**Story Points:** 5
**Priorität:** Niedrig

---

## Epic 4: Grafiken & Bilder

### US-4.1: Alternativtexte für Bilder (obligatorisch)
**Als** sehbehinderter Nutzer
**muss ich** Alternativtexte für alle Bilder bekommen
**damit** ich den Inhalt verstehe.

**Akzeptanzkriterien:**
- Erweitere `addImage()` um `alt` Parameter
- Fehler/Warnung wenn Alt-Text fehlt und PDF/UA aktiv
- Alt-Attribut im Figure-Strukturelement
- Leerer Alt-Text für dekorative Bilder erlaubt (dann aber als Artifact)

**Technische Details:**
```javascript
doc.addImage(imageData, 'PNG', 10, 10, 50, 50, undefined, {
  alt: 'Ein Bild von einem Sonnenuntergang'
});
```
- Erweitere `src/modules/addimage.js`
- Figure-Element mit `/Alt` Attribut

**Abhängigkeiten:** US-2.2, US-2.3
**Story Points:** 8
**Priorität:** Hoch

---

### US-4.2: BBox (Bounding Box) für Figures
**Als** Figure-Element
**muss ich** eine BBox haben
**damit** meine Position im Dokument definiert ist.

**Akzeptanzkriterien:**
- Automatische BBox-Berechnung für Bilder
- Format: `/BBox [x1 y1 x2 y2]`
- Koordinaten im User Space

**Technische Details:**
- Bereits Bildkoordinaten in `addImage()` vorhanden
- Konvertierung zu PDF-Koordinaten
- Hinzufügen zum Figure StructElem

**Abhängigkeiten:** US-4.1
**Story Points:** 5
**Priorität:** Mittel

---

## Epic 5: Tabellen

### US-5.1: Tabellen-Struktur mit TH/TD
**Als** tabellarischer Inhalt
**muss ich** korrekt mit Table/TR/TH/TD getaggt sein
**damit** Screenreader die Tabellenstruktur verstehen.

**Akzeptanzkriterien:**
- API für Tabellenerstellung mit Struktur
- Table → TR → TH/TD Hierarchie
- Scope-Attribut für TH (Row/Col/Both)
- Headers-Attribut für komplexe Tabellen

**Technische Details:**
```javascript
doc.beginTable();
  doc.beginTableRow();
    doc.addTableHeader('Name', { scope: 'Col' });
    doc.addTableHeader('Alter', { scope: 'Col' });
  doc.endTableRow();
  doc.beginTableRow();
    doc.addTableData('Max');
    doc.addTableData('30');
  doc.endTableRow();
doc.endTable();
```

**Abhängigkeiten:** US-2.2, US-2.3
**Story Points:** 13
**Priorität:** Mittel

---

### US-5.2: Layout-Tabellen verbieten
**Als** PDF/UA-Validator
**darf ich** keine Tabellen-Tags für Layout-Zwecke finden
**damit** die Semantik korrekt ist.

**Akzeptanzkriterien:**
- Dokumentation: Tabellen nur für tabellarische Daten
- Alternative Layout-Methoden dokumentieren
- Warnung bei verschachtelten Tabellen ohne semantischen Grund

**Abhängigkeiten:** US-5.1
**Story Points:** 2
**Priorität:** Niedrig

---

## Epic 6: Listen & Überschriften

### US-6.1: Listen-Struktur (L, LI, Lbl, LBody)
**Als** Liste
**muss ich** korrekt mit L/LI/Lbl/LBody strukturiert sein
**damit** Screenreader mich als Liste erkennen.

**Akzeptanzkriterien:**
- API: `doc.beginList()`, `doc.addListItem(label, body)`
- Verschachtelte Listen unterstützen
- Nummerierte und unnummerierte Listen

**Technische Details:**
```javascript
doc.beginList();
  doc.addListItem('1.', 'Erster Punkt');
  doc.addListItem('2.', 'Zweiter Punkt');
doc.endList();
```
- Struktur: L → LI → Lbl + LBody

**Abhängigkeiten:** US-2.2, US-2.3
**Story Points:** 8
**Priorität:** Mittel

---

### US-6.2: Überschriften-Hierarchie (H1-H6)
**Als** Dokumentstruktur
**muss ich** eine korrekte Überschriften-Hierarchie haben
**damit** Navigation möglich ist.

**Akzeptanzkriterien:**
- API: `doc.addHeading('Text', level)` mit level 1-6
- Validierung: Keine Ebenen überspringen (H1 → H3 verboten)
- Warnung bei Verstößen gegen Hierarchie

**Technische Details:**
```javascript
doc.addHeading('Hauptüberschrift', 1);
doc.addParagraph('Text...');
doc.addHeading('Unterüberschrift', 2);
```

**Abhängigkeiten:** US-2.2, US-2.3
**Story Points:** 8
**Priorität:** Hoch

---

## Epic 7: Formulare & Annotationen

### US-7.1: Formularfelder im Strukturbaum
**Als** Formularfeld
**muss ich** im Strukturbaum enthalten sein
**damit** ich für Hilfstechnologien zugänglich bin.

**Akzeptanzkriterien:**
- AcroForm-Felder in Strukturbaum integrieren
- `/StructParent` für jedes Formularfeld
- TU (Tooltip/Label) für jedes Feld
- Form-Strukturelement

**Technische Details:**
- Erweitere `src/modules/acroform.js`
- Mapping zwischen Widget-Annotation und StructElem

**Abhängigkeiten:** US-2.1, US-2.3
**Story Points:** 13
**Priorität:** Niedrig

---

### US-7.2: Annotations im Strukturbaum
**Als** Annotation (Link, Note, etc.)
**muss ich** im Strukturbaum sein
**damit** ich zugänglich bin.

**Akzeptanzkriterien:**
- Link-Annotationen mit Strukturelement Link
- Contents oder Alt-Text für Annotationen
- `/StructParent` Eintrag

**Technische Details:**
- Erweitere `src/modules/annotations.js`

**Abhängigkeiten:** US-2.1
**Story Points:** 8
**Priorität:** Niedrig

---

## Epic 8: Validierung & Testing

### US-8.1: Test-Anwendung erstellen
**Als** Entwickler
**möchte ich** eine Test-Anwendung haben
**damit** ich PDF/UA-Features testen kann.

**Akzeptanzkriterien:**
- HTML-Seite mit Beispielen für alle PDF/UA-Features
- Generierung verschiedener PDF/UA-konformer Dokumente
- Test-Dokumente für Validatoren
- Dokumentation der Test-Cases

**Technische Details:**
- Neue Datei: `examples/pdfua-test-app.html`
- Test-Cases:
  - Einfaches Dokument mit Text und Überschriften
  - Dokument mit Bildern und Alt-Texten
  - Dokument mit Tabellen
  - Dokument mit Listen
  - Mehrsprachiges Dokument
  - Dokument mit Formularen
  - Dokument mit Links

**Story Points:** 13
**Priorität:** Hoch

---

### US-8.2: Unit-Tests für PDF/UA-Module
**Als** CI/CD-Pipeline
**möchte ich** automatisierte Tests für PDF/UA haben
**damit** Regressionen verhindert werden.

**Akzeptanzkriterien:**
- Jasmine-Tests für alle PDF/UA-Module
- Prüfung auf Vorhandensein von StructTreeRoot
- Prüfung auf PDF/UA-Metadaten
- Prüfung auf DisplayDocTitle
- Prüfung auf Unicode-Mapping

**Technische Details:**
- Neue Datei: `test/specs/pdfua.spec.js`
- PDF-Parsing für Validierung

**Abhängigkeiten:** Alle Feature-User-Stories
**Story Points:** 21
**Priorität:** Hoch

---

### US-8.3: Validierung mit veraPDF integrieren
**Als** Entwickler
**möchte ich** meine PDFs mit veraPDF validieren
**damit** ich PDF/UA-Konformität sicherstelle.

**Akzeptanzkriterien:**
- Dokumentation zur Nutzung von veraPDF
- Optional: Automatische Validierung in Test-Suite
- CI/CD-Integration

**Technische Details:**
- veraPDF (https://verapdf.org/) ist der Standard-Validator
- Matterhorn Protocol für PDF/UA-Checks
- NPM-Script: `npm run validate-pdfua`

**Abhängigkeiten:** US-8.1
**Story Points:** 8
**Priorität:** Mittel

---

### US-8.4: Accessibility-Checker-Tool erstellen
**Als** Entwickler
**möchte ich** ein Tool zur Überprüfung der PDF/UA-Konformität
**damit** ich Fehler schnell finde.

**Akzeptanzkriterien:**
- API: `doc.validatePDFUA()` gibt Warnings/Errors zurück
- Checks:
  - Sind alle Inhalte getaggt?
  - Haben alle Bilder Alt-Texte?
  - Ist die Überschriften-Hierarchie korrekt?
  - Ist DisplayDocTitle gesetzt?
  - Sind PDF/UA-Metadaten vorhanden?
- Ausgabe als strukturiertes Objekt

**Technische Details:**
```javascript
const issues = doc.validatePDFUA();
// issues: {
//   errors: ['Image at page 2 missing alt text'],
//   warnings: ['Heading hierarchy skips from H1 to H3']
// }
```

**Abhängigkeiten:** Alle Feature-User-Stories
**Story Points:** 13
**Priorität:** Mittel

---

## Epic 9: Dokumentation & Beispiele

### US-9.1: API-Dokumentation für PDF/UA
**Als** Entwickler
**möchte ich** vollständige API-Dokumentation für PDF/UA
**damit** ich die Features nutzen kann.

**Akzeptanzkriterien:**
- JSDoc-Kommentare für alle neuen APIs
- Markdown-Guide: `docs/pdfua-guide.md`
- Migration-Guide für bestehende Anwendungen
- Best Practices

**Story Points:** 8
**Priorität:** Hoch

---

### US-9.2: Beispiel-Code für häufige Use-Cases
**Als** Entwickler
**möchte ich** Beispiele für typische PDF/UA-Szenarien
**damit** ich schnell starten kann.

**Akzeptanzkriterien:**
- Beispiel: Geschäftsbrief mit Briefkopf (Artifact)
- Beispiel: Bericht mit Überschriften, Listen, Tabellen
- Beispiel: Formular
- Beispiel: Mehrsprachiges Dokument
- Beispiele in `examples/pdfua/`

**Story Points:** 13
**Priorität:** Mittel

---

### US-9.3: README-Sektion für PDF/UA
**Als** GitHub-Besucher
**möchte ich** im README über PDF/UA-Support informiert werden
**damit** ich weiß, dass jsPDF barrierefrei ist.

**Akzeptanzkriterien:**
- Sektion in README.md über PDF/UA
- Badge für PDF/UA-Unterstützung
- Link zur Dokumentation

**Story Points:** 2
**Priorität:** Niedrig

---

## Epic 10: Optimierungen & Edge Cases

### US-10.1: Automatische Struktur-Inferenz
**Als** Entwickler mit bestehendem Code
**möchte ich** dass jsPDF automatisch eine Grundstruktur erstellt
**damit** ich nicht alles manuell taggen muss.

**Akzeptanzkriterien:**
- Bei `pdfUA: true` automatisch Document-Root erstellen
- Automatisch P-Tags für `text()` wenn kein explizites Tag gesetzt
- Automatisch Figure für `addImage()` wenn kein explizites Tag gesetzt
- Opt-out möglich für volle Kontrolle

**Technische Details:**
- Modus: `pdfUA: { mode: 'auto' | 'manual' }`
- Auto-Modus für einfache Dokumente

**Abhängigkeiten:** US-2.1, US-2.2, US-2.3
**Story Points:** 21
**Priorität:** Niedrig

---

### US-10.2: Mehrspaltiges Layout
**Als** Dokument mit mehreren Spalten
**muss ich** die korrekte Lesereihenfolge haben
**damit** Screenreader Spalte 1, dann Spalte 2 lesen.

**Akzeptanzkriterien:**
- API zum Definieren von Spalten-Regionen
- Korrekte MCID-Vergabe über Spalten hinweg

**Abhängigkeiten:** US-2.5
**Story Points:** 13
**Priorität:** Niedrig

---

### US-10.3: PDF/UA mit PDF/A kombinieren
**Als** Archiv
**möchte ich** PDFs die sowohl PDF/UA als auch PDF/A sind
**damit** sie langzeitarchivierbar und barrierefrei sind.

**Akzeptanzkriterien:**
- Gleichzeitige Aktivierung von PDF/UA und PDF/A möglich
- Keine Konflikte zwischen beiden Standards
- Gemeinsame Metadaten

**Technische Details:**
- PDF/A-3a ist kompatibel mit PDF/UA
- XMP-Metadaten für beide Standards

**Story Points:** 13
**Priorität:** Niedrig

---

## Priorisierung & Roadmap

### Phase 1: Minimum Viable Product (MVP)
**Ziel:** Einfache PDF/UA-konforme Dokumente erstellen
**Stories:** US-1.1, US-1.2, US-1.3, US-2.1, US-2.2, US-2.3, US-3.1, US-4.1, US-8.1, US-9.1
**Story Points:** ~117
**Dauer:** ~6-8 Sprints (12-16 Wochen)

### Phase 2: Erweiterte Features
**Ziel:** Tabellen, Listen, Überschriften, vollständige Validierung
**Stories:** US-2.4, US-2.5, US-3.2, US-4.2, US-5.1, US-6.1, US-6.2, US-8.2, US-8.3, US-8.4, US-9.2
**Story Points:** ~107
**Dauer:** ~5-7 Sprints (10-14 Wochen)

### Phase 3: Formulare & Optimierungen
**Ziel:** Vollständige PDF/UA-1 Konformität
**Stories:** US-3.3, US-5.2, US-7.1, US-7.2, US-9.3, US-10.1
**Story Points:** ~46
**Dauer:** ~2-3 Sprints (4-6 Wochen)

### Phase 4: Edge Cases & Kombinationen
**Ziel:** Erweiterte Szenarien
**Stories:** US-10.2, US-10.3
**Story Points:** ~26
**Dauer:** ~1-2 Sprints (2-4 Wochen)

---

## Technische Schulden & Risiken

### Risiken:
1. **PDF-Spec-Komplexität:** PDF 1.7 Spec ist sehr umfangreich
2. **Rückwärtskompatibilität:** Neue Features dürfen bestehenden Code nicht brechen
3. **Performance:** Strukturbaum kann bei großen Dokumenten Performance beeinträchtigen
4. **Browser-Limitierungen:** Einige Features evtl. nur in Node.js möglich

### Technische Schulden:
1. jsPDF implementiert derzeit PDF 1.3, PDF/UA basiert auf 1.7
2. Kein strukturiertes Content-Marking in aktueller Version
3. Font-Unicode-Mapping teilweise unvollständig

---

## Definition of Done (DoD)

Eine User Story gilt als "Done" wenn:
- [ ] Code implementiert und in Feature-Branch committed
- [ ] Unit-Tests geschrieben und bestehen
- [ ] Integration-Test mit veraPDF erfolgreich
- [ ] JSDoc-Dokumentation vorhanden
- [ ] Code-Review durchgeführt
- [ ] Beispiel-Code in Test-App integriert
- [ ] Keine Regressions-Fehler in bestehenden Tests

---

## Metriken & Erfolgskriterien

### Erfolgskriterien Phase 1 (MVP):
- [ ] Mindestens 1 Beispiel-PDF besteht veraPDF-Validierung
- [ ] Test-App generiert PDF/UA-Dokument mit Text, Überschrift, Bild
- [ ] Keine Breaking Changes für nicht-PDF/UA-Code

### Erfolgskriterien Gesamt:
- [ ] 100% veraPDF-Validierung für Test-Dokumente
- [ ] Performance-Overhead < 20% für PDF/UA-Dokumente
- [ ] Test-Coverage > 80% für PDF/UA-Module
- [ ] Positive Rückmeldung von Accessibility-Community

---

## Ressourcen & Referenzen

- **PDF 1.7 Specification:** https://opensource.adobe.com/dc-acrobat-sdk-docs/pdfstandards/PDF32000_2008.pdf
- **ISO 14289-1 (PDF/UA-1):** https://pdfa.org/resource/iso-14289-pdfua/
- **veraPDF Validator:** https://verapdf.org/
- **Matterhorn Protocol:** https://www.pdfa.org/publication/the-matterhorn-protocol-1-02/
- **Tagged PDF Best Practices:** https://pdfa.org/resource/tagged-pdf-best-practice-guide-syntax/
- **PDF Association:** https://pdfa.org/
