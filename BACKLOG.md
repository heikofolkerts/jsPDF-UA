# Backlog

## PDF/A - PDF for Archiving

**Prioritaet:** Hoch
**Status:** Offen
**Erstellt:** 2026-03-05

### Beschreibung

jsPDF soll neben PDF/UA (Universal Accessibility) auch den PDF/A-Standard (ISO 19005) fuer Langzeitarchivierung unterstuetzen. PDF/A stellt sicher, dass Dokumente langfristig reproduzierbar und selbstbeschreibend sind.

### PDF/A-Konformitaetsstufen

| Stufe   | Standard    | Beschreibung                                          |
| ------- | ----------- | ----------------------------------------------------- |
| PDF/A-1b | ISO 19005-1 | Basis-Konformitaet (visuelle Reproduzierbarkeit)     |
| PDF/A-1a | ISO 19005-1 | Volle Konformitaet (strukturiert + tagged)            |
| PDF/A-2b | ISO 19005-2 | Basis, basierend auf PDF 1.7                         |
| PDF/A-2u | ISO 19005-2 | Wie 2b + Unicode-Mapping aller Zeichen               |
| PDF/A-2a | ISO 19005-2 | Volle Konformitaet auf PDF 1.7                       |
| PDF/A-3b | ISO 19005-3 | Wie 2b + eingebettete Dateien beliebigen Formats     |

### Technische Anforderungen

#### Pflicht fuer alle PDF/A-Stufen

- [ ] XMP-Metadaten mit PDF/A-Identifikation (`pdfaid:part`, `pdfaid:conformance`)
- [ ] Alle Schriften vollstaendig eingebettet (bereits teilweise durch PDF/UA vorhanden)
- [ ] Farbprofile: OutputIntent mit ICC-Profil (sRGB als Standard)
- [ ] Keine Transparenz in PDF/A-1 (erlaubt ab PDF/A-2)
- [ ] Keine JavaScript-Aktionen
- [ ] Keine Verschluesselung
- [ ] Keine externen Referenzen (alle Ressourcen eingebettet)
- [ ] Keine LZW-Kompression (Flate ist ok)

#### Zusaetzlich fuer PDF/A-1a / PDF/A-2a

- [ ] Vollstaendig getaggter Inhalt (Synergie mit PDF/UA)
- [ ] Unicode-Mapping fuer alle Zeichen (ToUnicode CMap)
- [ ] Logische Dokumentstruktur

#### Zusaetzlich fuer PDF/A-3

- [ ] Einbettung beliebiger Dateien als Associated Files (AF)
- [ ] Relationship-Typen fuer eingebettete Dateien

### Implementierungsvorschlag

#### Phase 1: PDF/A-1b Basis-Konformitaet

1. **PDF/A-Modus aktivieren**: `new jsPDF({ pdfA: true, pdfALevel: '1b' })`
2. **XMP-Metadaten erweitern**: PDF/A-Identifikation im XMP-Stream
3. **OutputIntent**: sRGB ICC-Profil einbetten
4. **Validierungslogik**: JavaScript, Verschluesselung, externe Referenzen blockieren
5. **Font-Embedding erzwingen**: Keine Standard-14-Fonts ohne Einbettung

#### Phase 2: PDF/A-2b / PDF/A-2u

6. **PDF 1.7 Basis** (bereits in Sprint 30 umgestellt)
7. **Unicode-Mapping sicherstellen** (ToUnicode CMap fuer alle Fonts)
8. **Transparenz-Unterstuetzung** (ab PDF/A-2 erlaubt)

#### Phase 3: PDF/A-2a (Kombination mit PDF/UA)

9. **PDF/UA + PDF/A kombiniert**: Dokumente die beide Standards erfuellen
10. **Gemeinsame Tagging-Infrastruktur** nutzen

#### Phase 4: PDF/A-3

11. **Associated Files (AF)**: Dateien einbetten mit Beziehungstyp
12. **ZUGFeRD/Factur-X**: XML-Rechnungsdaten als PDF/A-3 einbetten

### Synergien mit PDF/UA

Viele PDF/A-Anforderungen sind durch die PDF/UA-Implementierung bereits erfuellt:

- Font-Embedding (Sprint 4/5, 10, 11)
- XMP-Metadaten (Sprint 1)
- Dokumentstruktur / Tagging (Sprint 2/3 ff.)
- Unicode-Unterstuetzung (UTF-8 Modul)
- PDF 1.7 (Sprint 30)

### Validierung

- **veraPDF**: `docker run --rm -v "$(pwd):/data" verapdf/cli --flavour 1b /data/output.pdf`
- **PDF/A-Konformitaetsstufen**: `--flavour 1a`, `1b`, `2a`, `2b`, `2u`, `3a`, `3b`

### Referenzen

- ISO 19005-1:2005 (PDF/A-1)
- ISO 19005-2:2011 (PDF/A-2)
- ISO 19005-3:2012 (PDF/A-3)
- https://www.pdfa.org/
- veraPDF Validation Rules: https://docs.verapdf.org/validation/

---

## TOC mit Blocksatz und Fuehrungspunkten

**Prioritaet:** Mittel
**Status:** Erledigt (2026-03-05)
**Erstellt:** 2026-03-05

### Beschreibung

Das Inhaltsverzeichnis (TOC) soll standardmaessig als Blocksatz formatiert werden:

- Ueberschriften beginnen linksbuendig
- Seitenzahlen stehen rechtsbuendig untereinander
- Der Zwischenraum wird mit Fuehrungspunkten (Dot Leaders) aufgefuellt

### Akzeptanzkriterien

- [ ] TOC-Eintraege zeigen Ueberschrift links und Seitenzahl rechts
- [ ] Fuehrungspunkte fuellen den Platz zwischen Ueberschrift und Seitenzahl
- [ ] Seitenzahlen sind rechtsbuendig ausgerichtet und stehen untereinander
- [ ] Funktioniert mit verschiedenen Schriftgroessen und Einrueckungsstufen (H1-H6)
- [ ] PDF/UA-Tagging (TOC/TOCI) bleibt erhalten

---

## CI/CD: Automatische Showcase-PDF-Erstellung

**Prioritaet:** Mittel
**Status:** Erledigt (2026-03-05)
**Erstellt:** 2026-03-05

### Beschreibung

Die CI/CD-Pipeline soll nach jedem Commit automatisch das Showcase-Dokument erstellen und als Artefakt zum Download anbieten. So kann jemand das Showcase-Skript anpassen, committen und erhaelt das damit erstellte PDF ohne lokale Einrichtung.

### Akzeptanzkriterien

- [ ] GitHub Actions Workflow erstellt nach jedem Push das Showcase-PDF
- [ ] Das PDF wird als Build-Artefakt zum Download angeboten
- [ ] Workflow laeuft auch bei Pull Requests
- [ ] Fehlgeschlagene PDF-Erstellung wird als Build-Fehler gemeldet
- [ ] Optional: veraPDF-Validierung als zusaetzlicher Schritt

---

## Branching-Strategie fuer Fork-Pflege

**Prioritaet:** Hoch
**Status:** Erledigt (2026-03-05)
**Erstellt:** 2026-03-05

### Beschreibung

Da der Pull Request zum Original-jsPDF-Projekt voraussichtlich nicht angenommen wird, brauchen wir eine nachhaltige Branching-Strategie. Ziele:

- Aenderungen aus dem Upstream (MrRio/jsPDF) weiterhin uebernehmen koennen
- Nicht dauerhaft auf einem Feature-Branch leben muessen
- Klare Trennung zwischen Upstream-Code und PDF/UA-Erweiterungen

### Moegliche Strategien

1. **Fork mit eigenem `main`-Branch**: PDF/UA-Code auf `main`, Upstream-Merges regelmaessig einspielen
2. **Rebase-Strategie**: PDF/UA-Commits auf aktuellem Upstream rebasen
3. **Patch-basiert**: PDF/UA als Patch-Serie pflegen, die auf beliebige Upstream-Versionen anwendbar ist

### Akzeptanzkriterien

- [ ] Strategie dokumentiert (CONTRIBUTING.md oder aehnlich)
- [ ] Upstream-Merges koennen ohne groessere Konflikte durchgefuehrt werden
- [ ] `master`-Branch spiegelt Upstream, eigener Hauptbranch fuer PDF/UA
- [ ] Release-Prozess definiert

---

## PDF 2.0 Umstellung

**Prioritaet:** Hoch
**Status:** Offen
**Erstellt:** 2026-03-05

### Beschreibung

Als Vorbereitung fuer PDF/UA-2 muss jsPDF von PDF 1.7 auf PDF 2.0 (ISO 32000-2:2020) umgestellt werden. PDF 2.0 ist Voraussetzung fuer PDF/UA-2.

### Technische Aenderungen

- [ ] PDF-Header auf `%PDF-2.0` aendern
- [ ] Neue/geaenderte Operatoren und Dictionaries gemaess ISO 32000-2
- [ ] Veraltete Features entfernen oder als Legacy markieren
- [ ] Cross-Reference Streams (statt klassischer xref-Tabellen, optional)
- [ ] Neue Struktur-Typen aus PDF 2.0 unterstuetzen
- [ ] Namensraum-Konzept fuer Struktur-Typen
- [ ] Bestehende Tests anpassen / erweitern
- [ ] Abwaertskompatibilitaet: Option `pdfVersion: '1.7'` beibehalten

### Referenzen

- ISO 32000-2:2020
- https://www.pdfa.org/resource/iso-32000-2/

---

## PDF/UA-2 Implementierung

**Prioritaet:** Hoch
**Status:** Offen (abhaengig von PDF 2.0 Umstellung)
**Erstellt:** 2026-03-05

### Beschreibung

Vollstaendige Implementierung von PDF/UA-2 (ISO 14289-2), aufbauend auf der bestehenden PDF/UA-1-Implementierung und der PDF 2.0 Umstellung.

### Wesentliche Unterschiede zu PDF/UA-1

- Basiert auf PDF 2.0 statt PDF 1.7
- Namensraeume fuer Struktur-Typen (Standard Structure Namespace)
- Erweiterte Anforderungen an Alternativtexte und Beschreibungen
- Neue Struktur-Elemente (DocumentFragment, Aside, etc. - teilweise in Sprint 26 vorbereitet)
- Strengere Anforderungen an Artefakte
- MathML-Unterstuetzung fuer Formeln
- Verbesserte Tabellen-Semantik

### Akzeptanzkriterien

- [ ] PDF 2.0 Umstellung abgeschlossen (Voraussetzung)
- [ ] Alle PDF/UA-2-Pflichtanforderungen implementiert
- [ ] Namensraum-Konzept fuer Struktur-Typen
- [ ] Validierung mit PAC 2024 (unterstuetzt PDF/UA-2)
- [ ] Bestehende PDF/UA-1-Tests weiterhin lauffaehig (Rueckwaertskompatibilitaet)
- [ ] Dokumentation und Beispiele aktualisiert

### Referenzen

- ISO 14289-2:2024
- Matterhorn Protocol 2.0
- https://www.pdfa.org/resource/pdfua-2/

---

## Showcase-Skript refaktorieren

**Prioritaet:** Niedrig
**Status:** Offen
**Erstellt:** 2026-03-05

### Beschreibung

Das Skript zur Erstellung des Showcase-Dokuments ist sehr lang und unuebersichtlich geworden. Es soll geprueft werden, ob und wie es refaktoriert werden kann, um die Wartbarkeit zu verbessern.

### Moegliche Massnahmen

- [ ] Aufteilung in logische Abschnitte/Module (z.B. pro Feature-Bereich)
- [ ] Gemeinsame Hilfsfunktionen extrahieren (Seitenumbruch, Ueberschriften, etc.)
- [ ] Konfiguration von Inhalt trennen
- [ ] Eventuell als eigenes npm-Skript mit Import-Struktur

### Akzeptanzkriterien

- [ ] Showcase-Skript ist in uebersichtliche Abschnitte gegliedert
- [ ] Gemeinsame Muster sind in Hilfsfunktionen ausgelagert
- [ ] Das erzeugte PDF ist identisch zum bisherigen
- [ ] veraPDF-Validierung besteht weiterhin
