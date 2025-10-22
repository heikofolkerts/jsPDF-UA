# PDF/UA-1 Anforderungen - Quick Reference

Basierend auf ISO 14289-1:2014 (PDF/UA-1)

## Überblick

PDF/UA (Universal Accessibility) ist der ISO-Standard für barrierefreie PDF-Dokumente.
Er basiert auf PDF 1.7 (ISO 32000-1:2008) und definiert zusätzliche Anforderungen.

## Kern-Anforderungen (für jsPDF)

### 1. PDF/UA-Kennzeichnung ✓ Maschinell prüfbar

**XMP-Metadaten:**
```xml
<pdfuaid:part>1</pdfuaid:part>
<pdfuaid:conformance>A</pdfuaid:conformance>
```

**Namespace:**
```xml
xmlns:pdfuaid="http://www.aiim.org/pdfua/ns/id/"
```

**veraPDF Check:** 7.1-9

---

### 2. Dokumenttitel ✓ Maschinell prüfbar

**XMP dc:title:**
```xml
<dc:title>
  <rdf:Alt>
    <rdf:li xml:lang="x-default">Dokumenttitel</rdf:li>
  </rdf:Alt>
</dc:title>
```

**ViewerPreferences:**
```
/ViewerPreferences << /DisplayDocTitle true >>
```

**veraPDF Checks:**
- 6.2-1: DisplayDocTitle muss true sein
- 7.1-10: dc:title muss vorhanden sein

---

### 3. Dokumentsprache ✓ Maschinell prüfbar

**Catalog-Eintrag:**
```
/Lang (de-DE)
```

**Format:** BCP 47 Language Tags (z.B. en-US, de-DE, fr-FR)

**veraPDF Check:** 7.2-34

**Optional:** Sprache auf Strukturelement-Ebene für mehrsprachige Dokumente

---

### 4. Tagged PDF mit Strukturbaum ✓ Maschinell prüfbar

**MarkInfo im Catalog:**
```
/MarkInfo << /Marked true >>
```

**StructTreeRoot im Catalog:**
```
/StructTreeRoot <reference to structure tree root>
```

**veraPDF Checks:**
- 6.2-1: Marked muss true sein
- 7.1-11: StructTreeRoot muss vorhanden sein

---

### 5. Alle Inhalte getaggt oder als Artifact markiert ✓ Maschinell prüfbar

**Echter Inhalt (tagged):**
```
/P <</MCID 0>> BDC
  (Hello World) Tj
EMC
```

**Dekorativer Inhalt (artifact):**
```
/Artifact <</Type /Pagination>> BDC
  (Seite 1) Tj
EMC
```

**veraPDF Check:** 7.1-3

---

### 6. Standard-Strukturelemente verwenden ✓ Maschinell prüfbar

**Strukturelement-Typen (Auswahl):**

| Tag | Bedeutung | Verwendung |
|-----|-----------|-----------|
| Document | Dokumentwurzel | Oberste Ebene |
| Part | Dokumentteil | Kapitel, Abschnitte |
| Sect | Sektion | Unterabschnitte |
| Div | Division | Generischer Container |
| P | Paragraph | Textabsatz |
| H1-H6 | Heading | Überschriften (hierarchisch) |
| L | List | Liste |
| LI | List Item | Listenelement |
| Lbl | Label | Aufzählungszeichen/Nummer |
| LBody | List Body | Listentext |
| Table | Tabelle | Tabellenstruktur |
| TR | Table Row | Tabellenzeile |
| TH | Table Header | Tabellenkopf-Zelle |
| TD | Table Data | Tabellendaten-Zelle |
| Figure | Abbildung | Bild, Grafik |
| Formula | Formel | Mathematische Formel |
| Caption | Bildunterschrift | Beschriftung |
| Span | Span | Inline-Text |
| Quote | Zitat | Zitatblock |
| Note | Notiz | Fußnote, Endnote |
| Link | Link | Hyperlink |

**Custom Tags:** Müssen via RoleMap auf Standard-Tags gemapped werden

**veraPDF Check:** 9.4 (verschiedene Regeln)

---

### 7. Überschriften-Hierarchie ⚠ Teilweise maschinell prüfbar

**Anforderung:**
- Überschriften müssen hierarchisch sein
- Keine Ebenen überspringen (H1 → H3 verboten, H1 → H2 erlaubt)
- H1 als oberste Ebene

**Beispiel:**
```
Document
├─ H1: Hauptüberschrift
│  ├─ P: Text
│  ├─ H2: Unterüberschrift
│  │  ├─ P: Text
│  │  └─ H3: Unter-Unterüberschrift
│  └─ H2: Weitere Unterüberschrift
└─ H1: Zweites Kapitel
```

**veraPDF Check:** 28.5 (teilweise)

---

### 8. Alternativtexte für Bilder ✓ Maschinell prüfbar

**Figure-Element mit Alt-Attribut:**
```
<< /Type /StructElem
   /S /Figure
   /Alt (Beschreibung des Bildes)
   /P <parent reference>
   /K <MCID>
>>
```

**Anforderung:**
- Jedes Figure-Element MUSS Alt oder ActualText haben
- Alt-Text beschreibt Inhalt/Funktion des Bildes
- Dekorative Bilder: als Artifact markieren (kein Figure)

**veraPDF Check:** 7.18-1

---

### 9. BoundingBox für Figures ✓ Maschinell prüfbar

**BBox-Attribut:**
```
<< /Type /StructElem
   /S /Figure
   /BBox [x1 y1 x2 y2]
   ...
>>
```

**Koordinaten:** In User Space Units (typisch 1/72 inch)

**veraPDF Check:** 7.18-6

---

### 10. Tabellen-Struktur ✓ Maschinell prüfbar

**Grundstruktur:**
```
Table
├─ TR (Table Row)
│  ├─ TH (Header Cell)
│  └─ TH (Header Cell)
├─ TR
│  ├─ TD (Data Cell)
│  └─ TD (Data Cell)
```

**TH-Attribute:**
- Scope: Row, Column, Both

**TD-Attribute (bei komplexen Tabellen):**
- Headers: Referenzen zu zugehörigen TH-Elementen

**Wichtig:** Tabellen NUR für tabellarische Daten, NICHT für Layout!

**veraPDF Checks:** 7.5, 7.6

---

### 11. Listen-Struktur ✓ Maschinell prüfbar

**Struktur:**
```
L (List)
├─ LI (List Item)
│  ├─ Lbl (Label, z.B. "1." oder "•")
│  └─ LBody (Body, der eigentliche Text)
├─ LI
   └─ ...
```

**veraPDF Checks:** 7.4

---

### 12. Schriften einbetten und Unicode-Mapping ✓ Maschinell prüfbar

**Anforderungen:**
- Alle Schriften MÜSSEN eingebettet sein (außer Standard 14 bei Type 1)
- ToUnicode CMap für Character-zu-Unicode-Mapping
- Ausnahme: Type 3 Fonts, rendering mode 3

**veraPDF Checks:**
- 7.21.4.1-1: Font-Programm eingebettet
- 7.21.3.2-1: Unicode-Mapping vorhanden

---

### 13. Lesereihenfolge ⚠ Manuell zu prüfen

**Anforderung:**
- Strukturbaum reflektiert logische Lesereihenfolge
- MCIDs in korrekter Reihenfolge
- Bei mehrspaltigen Layouts: Spalten-Reihenfolge beachten

**Prüfung:**
- Nicht vollständig maschinell prüfbar
- Manuelle Prüfung mit Screenreader
- veraPDF prüft nur Vorhandensein, nicht Korrektheit

---

### 14. Annotations und Formularfelder ✓ Maschinell prüfbar

**Anforderungen:**
- Annotations MÜSSEN im Strukturbaum sein
- /StructParent-Eintrag für Verknüpfung
- Formularfelder: TU (Tooltip/Label) erforderlich

**veraPDF Checks:** 7.18.1, 7.18.2

---

### 15. ParentTree ✓ Maschinell prüfbar

**Zweck:**
- Mapping von Content (MCID) zu Strukturelementen
- Number Tree in StructTreeRoot

**Struktur:**
```
/ParentTree << /Nums [
  0 [<StructElem Refs for page 0>]
  1 [<StructElem Refs for page 1>]
  ...
] >>
```

**veraPDF Check:** Implizit in 7.1-3

---

### 16. StructParent in Pages ✓ Maschinell prüfbar

**Anforderung:**
- Jede Seite mit Content braucht /StructParents-Eintrag
- Integer-Wert als Key für ParentTree

```
<< /Type /Page
   /StructParents 0
   ...
>>
```

---

### 17. Metadata Stream ✓ Maschinell prüfbar

**Catalog-Eintrag:**
```
/Metadata <reference to metadata stream>
```

**Metadata Stream:**
```
<< /Type /Metadata
   /Subtype /XML
   /Length <length>
>>
stream
<?xml version="1.0"?>
<x:xmpmeta xmlns:x="adobe:ns:meta/">
  <rdf:RDF ...>
    ...
  </rdf:RDF>
</x:xmpmeta>
endstream
```

**veraPDF Check:** 7.1-8

---

## Matterhorn Protocol Checkpoints

Die wichtigsten maschinell prüfbaren Checkpoints:

| Checkpoint | Beschreibung | Kategorie |
|------------|-------------|-----------|
| 06-001 | ViewerPreferences fehlt | Syntax |
| 06-002 | DisplayDocTitle nicht true | Syntax |
| 07-001 | Content nicht getaggt | Structure |
| 07-002 | Marked nicht true | Structure |
| 09-004 | Struktur-Mapping fehlt | Structure |
| 13-004 | Figure ohne Alt | Alternative Text |
| 28-005 | Überschriften-Hierarchie verletzt | Semantics |

Vollständige Liste: 136 Checkpoints
Quelle: https://www.pdfa.org/publication/the-matterhorn-protocol-1-02/

---

## Implementierungs-Reihenfolge für jsPDF

### Phase 1: Minimale Konformität
1. PDF/UA-Kennzeichnung (XMP)
2. DisplayDocTitle + dc:title
3. Sprache (Lang)
4. StructTreeRoot + Marked=true
5. Basis-Tags (Document, P)
6. Content Marking (MCID)
7. Font-Embedding & Unicode

### Phase 2: Strukturelemente
8. Überschriften (H1-H6)
9. Bilder mit Alt (Figure)
10. Listen (L, LI, Lbl, LBody)
11. Tabellen (Table, TR, TH, TD)

### Phase 3: Erweitert
12. Formulare & Annotations
13. Komplexe Strukturen
14. Optimierungen

---

## Validierung

### veraPDF
```bash
# Vollständige Validierung
verapdf --flavour ua1 document.pdf

# Mit detailliertem Report
verapdf --flavour ua1 --verbose document.pdf

# HTML-Report
verapdf --flavour ua1 --format html document.pdf > report.html
```

### Manuelle Prüfung
- Screenreader-Test (NVDA, JAWS, VoiceOver)
- Lesereihenfolge prüfen
- Alt-Text-Qualität prüfen
- Tabellennavigation testen

---

## Ressourcen

- **ISO 14289-1:2014:** https://www.iso.org/standard/64599.html
- **PDF 1.7 Specification:** https://opensource.adobe.com/dc-acrobat-sdk-docs/pdfstandards/PDF32000_2008.pdf
- **PDF Association:** https://pdfa.org/
- **Matterhorn Protocol:** https://www.pdfa.org/publication/the-matterhorn-protocol-1-02/
- **Tagged PDF Best Practices:** https://pdfa.org/resource/tagged-pdf-best-practice-guide-syntax/
- **veraPDF:** https://verapdf.org/
- **W3C WCAG:** https://www.w3.org/WAI/WCAG21/quickref/ (für Content-Qualität)

---

## Legende

- ✓ **Maschinell prüfbar:** veraPDF kann dies automatisch validieren
- ⚠ **Teilweise maschinell:** veraPDF prüft Struktur, nicht Semantik
- ✗ **Manuell:** Nur durch menschliche Prüfung validierbar

---

**Hinweis:** Dieses Dokument fokussiert auf technische Anforderungen für die jsPDF-Implementierung.
Für vollständige PDF/UA-Konformität ist auch die inhaltliche Qualität wichtig (z.B. sinnvolle Alt-Texte,
korrekte Überschriften-Semantik), die nicht maschinell prüfbar ist.
