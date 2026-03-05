# Sprint 33: Named Destinations + sprachabhängige Link-Texte

## Ziel

Unterstützung von Named Destinations (Link-Ziele per ID) als Alternative zu Seitennummern.
Integration in Fußnoten, Index und allgemeine Links.
Sprachabhängige `contentsText`-Texte für Fußnoten-Links.

## Änderungen

### 1. Zentrales Named Destination Registry (`annotations.js`)
- `addNamedDestination(name, options)` — Ziel registrieren
- Named Destinations als PDF-Objekte schreiben (postPutResources)
- `/Names << /Dests ... >>` im Catalog

### 2. Link-API erweitern (`annotations.js`)
- `link()` — `destinationName`-Option unterstützen
- `textWithLink()` — `destinationName` durchreichen
- Annotation-Generierung: `/Dest (name)` Syntax
- `contentsText` sprachabhängig für `destinationName`-Links

### 3. beginLink erweitern (`structure_tree.js`)
- `beginLink({ destinationName: "..." })` unterstützen

### 4. Fußnoten mit Named Destinations (`structure_tree.js`)
- `beginNote()` registriert automatisch Named Destination
- `createFootnoteLinks()` nutzt `destinationName`
- Sprachabhängige `contentsText`-Texte ("Zur Fußnote"/"Go to footnote"/...)

### 5. Index mit klickbaren Links (`structure_tree.js`)
- `addIndexEntry()` akzeptiert Link-Array mit `destinationName`

### 6. Outline/Bookmarks (`outline.js`)
- `outline.add()` unterstützt `destinationName`

## Abwärtskompatibilität

Alle Änderungen sind additiv. `pageNumber` funktioniert weiterhin.

---

**Erstellt:** 2026-03-05
**Status:** In Arbeit
