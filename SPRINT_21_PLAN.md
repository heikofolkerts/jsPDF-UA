# Sprint 21: Accessible Form Fields (AcroForm + PDF/UA)

## Ziel
Implementierung barrierefreier Formularfelder gemäß PDF/UA (BITi 02.4.2).

## Wichtigkeit für Nutzer

Formulare sind für Screenreader-Nutzer oft die einzige Möglichkeit, selbstständig Anträge auszufüllen.
Fehlerhafte oder nicht barrierefreie Formulare führen zu:
- Unmöglichkeit, Felder zu identifizieren
- Falsche Lesereihenfolge
- Fehlende Beschriftungen
- Keine Möglichkeit, Pflichtfelder zu erkennen

## PDF/UA Anforderungen für Formulare

### 1. Strukturbaum-Integration (kritisch)
Jedes Formularfeld MUSS im Strukturbaum enthalten sein:
```
Document
└── Form (Structure Element)
    └── OBJR (Object Reference → Widget Annotation)
```

### 2. TU-Attribut (Tooltip/Alternative Description)
- **TU** (Text String): Kurzbeschreibung für Screenreader
- MUSS gesetzt sein, wenn kein sichtbares Label vorhanden
- Format: `/TU (Vorname (Pflichtfeld))`

### 3. StructParent
- Jede Widget-Annotation MUSS `/StructParent n` haben
- Verknüpft Annotation mit ParentTree im Strukturbaum

### 4. OBJR-Referenz
- Formular-Strukturelement muss OBJR-Kind haben
- Format: `<< /Type /OBJR /Obj <annotation-objId> 0 R >>`

## Aktuelle Situation in jsPDF

### Vorhanden:
- AcroForm-Modul mit allen Feldtypen (TextField, CheckBox, RadioButton, ComboBox, etc.)
- Widget-Annotationen werden korrekt erstellt
- Appearance Streams
- Felder werden in /AcroForm Dictionary registriert

### Fehlt für PDF/UA:
- ❌ Keine Form-Strukturelemente
- ❌ Kein TU-Attribut (Tooltip)
- ❌ Kein StructParent in Widget-Annotationen
- ❌ Keine OBJR-Verbindung zum Strukturbaum
- ❌ Keine Validierung für fehlende Labels

## Implementierungsplan

### Phase 1: TU-Attribut (Tooltip) hinzufügen
**Datei:** `src/modules/acroform.js`

Erweiterung von `AcroFormField`:
```javascript
// Neues Property für Tooltip (TU = Text User)
var _TU = null;
Object.defineProperty(this, "TU", {
  enumerable: true,
  configurable: false,
  get: function() {
    return _TU ? toPdfString(_TU, this.objId, this.scope) : null;
  },
  set: function(value) {
    _TU = value;
  }
});

// Alias für bessere API
Object.defineProperty(this, "tooltip", {
  enumerable: true,
  configurable: true,
  get: function() { return _TU; },
  set: function(value) { _TU = value; }
});
```

### Phase 2: StructParent für Widget-Annotationen
**Datei:** `src/modules/acroform.js`

In `createFieldCallback`:
```javascript
// Bei PDF/UA: StructParent hinzufügen
if (scope.internal.pdfUA && scope.internal.pdfUA.enabled) {
  var structParentIndex = getNextStructParentIndex(scope);
  keyValueList.push({ key: 'StructParent', value: structParentIndex });

  // Für spätere OBJR-Erstellung speichern
  fieldObject._structParentIndex = structParentIndex;
  fieldObject._pdfuaObjId = fieldObject.objId;
}
```

### Phase 3: Form-Strukturelement
**Datei:** `src/modules/structure_tree.js`

```javascript
/**
 * Begin a Form structure element for accessible form fields
 * @param {Object} options - Options for the form element
 * @param {string} [options.tooltip] - Alternative text for screen readers
 */
jsPDFAPI.beginFormField = function(options) {
  options = options || {};
  return this.beginStructureElement('Form', {
    alt: options.tooltip
  });
};

jsPDFAPI.endFormField = function() {
  return this.endStructureElement();
};

/**
 * Add form field annotation reference (OBJR)
 * Similar to addLinkAnnotationRef but for form fields
 */
jsPDFAPI.addFormFieldRef = function(fieldInternalId) {
  // ... ähnlich wie addLinkAnnotationRef
};
```

### Phase 4: Integration in AcroForm-API
**Datei:** `src/modules/acroform.js`

Neue High-Level API:
```javascript
/**
 * Add accessible text field
 * @param {Object} options
 * @param {number} options.x - X position
 * @param {number} options.y - Y position
 * @param {number} options.width - Field width
 * @param {number} options.height - Field height
 * @param {string} options.name - Field name (internal)
 * @param {string} options.tooltip - Screen reader text (REQUIRED for PDF/UA)
 * @param {string} [options.value] - Default value
 * @param {boolean} [options.required] - Mark as required
 */
jsPDFAPI.addAccessibleTextField = function(options) {
  // Validierung
  if (this.internal.pdfUA && this.internal.pdfUA.enabled) {
    if (!options.tooltip) {
      throw new Error('PDF/UA: tooltip is required for form fields');
    }
  }

  // Strukturelement beginnen
  this.beginFormField({ tooltip: options.tooltip });

  // AcroForm-Feld erstellen
  var field = new AcroFormTextField();
  field.x = options.x;
  field.y = options.y;
  field.width = options.width;
  field.height = options.height;
  field.fieldName = options.name;
  field.TU = options.tooltip;
  field.V = options.value || '';

  if (options.required) {
    field.required = true;
    // Tooltip erweitern
    field.TU = options.tooltip + ' (Pflichtfeld)';
  }

  this.addField(field);

  // OBJR-Referenz hinzufügen
  this.addFormFieldRef(field._internalId);

  // Strukturelement beenden
  this.endFormField();

  return this;
};
```

### Phase 5: Validierung für PDF/UA
**Datei:** `src/modules/acroform.js`

```javascript
// In putForm oder createFieldCallback
if (scope.internal.pdfUA && scope.internal.pdfUA.enabled) {
  // Warnung/Fehler wenn TU fehlt
  if (!formObject.TU) {
    console.warn('PDF/UA: Form field "' + formObject.T + '" has no tooltip (TU). ' +
                 'Screen readers may not be able to identify this field.');
  }
}
```

## API-Design für Benutzerfreundlichkeit

### Option A: Erweiterte bestehende API
```javascript
var field = new jsPDF.AcroForm.TextField();
field.x = 10;
field.y = 50;
field.width = 100;
field.height = 20;
field.fieldName = "vorname";
field.tooltip = "Geben Sie Ihren Vornamen ein"; // NEU
doc.addField(field);
```

### Option B: Neue High-Level API (empfohlen für PDF/UA)
```javascript
// Einfache, sichere API für barrierefreie Formulare
doc.addAccessibleTextField({
  x: 10, y: 50, width: 100, height: 20,
  name: "vorname",
  tooltip: "Vorname eingeben",
  required: true
});

doc.addAccessibleCheckBox({
  x: 10, y: 80, width: 15, height: 15,
  name: "agb",
  tooltip: "Ich akzeptiere die AGB",
  required: true
});

doc.addAccessibleRadioGroup({
  name: "geschlecht",
  tooltip: "Geschlecht auswählen",
  options: [
    { x: 10, y: 100, label: "Männlich", value: "m" },
    { x: 10, y: 120, label: "Weiblich", value: "w" },
    { x: 10, y: 140, label: "Divers", value: "d" }
  ]
});
```

## Test-Szenarien

1. **Einfaches Textfeld**
   - TextField mit tooltip
   - Prüfung: TU vorhanden, Form-Element im Strukturbaum

2. **Pflichtfeld**
   - TextField mit required=true
   - Prüfung: Tooltip enthält "Pflichtfeld"

3. **Checkbox**
   - CheckBox mit tooltip
   - Prüfung: Korrekte OBJR-Verbindung

4. **RadioButton-Gruppe**
   - Mehrere RadioButtons in einer Gruppe
   - Prüfung: Jeder Button hat Form-Element

5. **ComboBox/Dropdown**
   - Auswahlliste mit Optionen
   - Prüfung: Tooltip beschreibt Auswahlmöglichkeiten

6. **Komplexes Formular**
   - Kombination aller Feldtypen
   - Prüfung: Korrekte Lesereihenfolge

## Entscheidungen (2025-12-11)

1. **API-Design**: **Option B (High-Level API)**
   - Einfacher für Anwender
   - Sicherer durch eingebaute Validierung
   - `doc.addAccessibleTextField({...})` statt manuelle Feld-Konfiguration

2. **Sichtbare Labels**: **JA**
   - Alle Felder bekommen sichtbare Text-Labels
   - Unterstützt Nutzer mit hohem Zoom-Faktor
   - Label wird als P-Element vor dem Form-Element platziert

3. **Validierung**: **STRIKT (Fehler)**
   - Fehlende Tooltips werfen einen Error
   - Warnungen werden zu leicht ignoriert
   - Verhindert nicht-barrierefreie Formulare

## Implementierung (ABGESCHLOSSEN 2025-12-11)

### Implementierte Features:

1. **TU-Attribut (Tooltip)**
   - ✅ `AcroFormField.TU` Property für Tooltip-Text
   - ✅ `AcroFormField.tooltip` Alias für bessere API
   - ✅ Automatisch in PDF-Output geschrieben

2. **Form-Strukturelement**
   - ✅ `beginFormField()` / `endFormField()` in structure_tree.js
   - ✅ `addFormFieldRef(fieldInternalId)` für OBJR-Verbindung
   - ✅ OBJR im K-Array des Form-Elements

3. **StructParent für Widget-Annotationen**
   - ✅ Automatische StructParent-Zuweisung ab Index 1000
   - ✅ `_pdfuaInternalId` für Feldverfolgung
   - ✅ `pdfuaFormFieldIdMap` für OBJR-Auflösung

4. **High-Level API**
   - ✅ `addAccessibleTextField(options)` - Textfelder
   - ✅ `addAccessibleCheckBox(options)` - Kontrollkästchen
   - ✅ `addAccessibleComboBox(options)` - Dropdown-Listen
   - ✅ `addAccessibleListBox(options)` - Auswahllisten
   - ✅ `addAccessibleRadioGroup(options)` - Radiobutton-Gruppen

5. **Strikte Validierung**
   - ✅ Fehler bei fehlendem `tooltip` in PDF/UA-Modus
   - ✅ Automatisches Suffix "(Pflichtfeld)" für required-Felder

### Test-Suite:
- `tests/pdfua/test-forms.js` - 7 Test-Szenarien
- Alle Tests bestanden

### Generierte Test-PDFs:
- `test-form-1-textfield.pdf` - Einfaches Textfeld
- `test-form-2-required.pdf` - Pflichtfeld mit Markierung
- `test-form-3-checkbox.pdf` - Kontrollkästchen
- `test-form-4-combobox.pdf` - Dropdown-Liste
- `test-form-5-complete.pdf` - Komplettes Kontaktformular
- `test-form-7-lowlevel.pdf` - Low-Level API Test

## Screenreader-Tests (VERIFIZIERT 2025-12-11)

### NVDA + Adobe Acrobat - Ergebnisse:
- ✅ TextField: Eingabe und Lesen funktioniert
- ✅ CheckBox: Aktivierung und Status erkennbar
- ✅ ComboBox: Wert ändern und lesen funktioniert
  - ⚠️ Bekanntes Verhalten: Wert wird mehrfach vorgelesen (auch in Referenz-PDF)
- ✅ Komplettes Formular: Alle Felder funktionieren

### Kritische Fixes während der Verifizierung:
1. **ParentTree-Einträge für Formularfelder**
   - Problem: StructParent 1000+ war nicht im ParentTree
   - Lösung: `writeParentTree()` erweitert für Form-Feld-Einträge

2. **OBJR mit Page-Referenz**
   - Problem: OBJR hatte kein `/Pg` Attribut
   - Lösung: `/Pg <page-objId> 0 R` in OBJR hinzugefügt

3. **Default Appearance (DA) für alle Feldtypen**
   - Problem: ComboBox verwendete `/F1` statt `/Helv`
   - Lösung: DA wird für PDF/UA auf `/Helv 12 Tf 0 g` gesetzt

### Referenz-Dokument:
- `examples/temp/reference-pdfua-form.pdf` (PDF Association)
- Verwendet für Struktur-Vergleich und Verifizierung

### Technische Verifikation
- [ ] veraPDF-Validierung
- [ ] PAC 2021 Check

## Referenzen

- [PDF/UA Widget Annotation Guide](https://theaccessibilityguy.com/widget-annotation-not-nested-inside-a-form-structure-element-pac-2021-error-pdf-ua-compliance/)
- [W3C WCAG PDF Techniques](https://www.w3.org/TR/WCAG20-TECHS/pdf)
- [Tagged PDF Best Practice Guide](https://pdfa.org/wp-content/uploads/2019/06/TaggedPDFBestPracticeGuideSyntax.pdf)
- BITi 02.4.2: Darstellende Elemente / Formulare
