# veraPDF Setup Guide

## Was ist veraPDF?

veraPDF ist der offizielle Open-Source PDF-Validator für PDF/A und PDF/UA Standards.
Website: https://verapdf.org/

## Installation

### Option 1: Docker (Empfohlen für WSL/Linux)

```bash
# Test-PDF validieren
docker run --rm -v $(pwd):/data verapdf/verapdf \
  --flavour ua1 /data/test.pdf

# Als Alias anlegen
echo 'alias verapdf="docker run --rm -v \$(pwd):/data verapdf/verapdf"' >> ~/.bashrc
source ~/.bashrc

# Verwendung
verapdf --flavour ua1 document.pdf
```

### Option 2: Manuelle Installation (GUI + CLI)

1. **Download:**
   ```bash
   wget https://software.verapdf.org/releases/1.26/verapdf-greenfield-1.26.2-installer.zip
   unzip verapdf-greenfield-1.26.2-installer.zip
   cd verapdf-greenfield-1.26.2
   ```

2. **Installation:**
   - **GUI-Installation:** Doppelklick auf `verapdf-install` (Linux/Mac) oder `verapdf-install.bat` (Windows)
   - **Konsolen-Installation:**
     ```bash
     ./verapdf-install
     # Folge den Anweisungen
     ```

3. **PATH setzen:**
   ```bash
   export PATH=$PATH:~/verapdf
   # In ~/.bashrc hinzufügen für permanente Nutzung
   ```

### Option 3: Direkte JAR-Nutzung (ohne Installation)

```bash
# Download
wget https://software.verapdf.org/releases/1.26/verapdf-greenfield-1.26.2-installer.zip
unzip verapdf-greenfield-1.26.2-installer.zip

# Verwendung (im Projektverzeichnis)
java -jar /pfad/zu/verapdf-greenfield-1.26.2/verapdf-izpack-installer-1.26.2.jar
```

## Verwendung

### Basis-Validierung

```bash
# PDF/UA-1 Validierung
verapdf --flavour ua1 document.pdf

# Mit detailliertem Output
verapdf --flavour ua1 --verbose document.pdf

# Output als XML
verapdf --flavour ua1 --format xml document.pdf > report.xml

# Output als HTML
verapdf --flavour ua1 --format html document.pdf > report.html
```

### Batch-Validierung

```bash
# Alle PDFs in einem Ordner
verapdf --flavour ua1 test/output/*.pdf

# Mit Report
verapdf --flavour ua1 --format html test/output/*.pdf > validation-report.html
```

### PDF/UA Flavours

- `ua1` - PDF/UA-1 (basierend auf PDF 1.7)
- Zukünftig: `ua2` - PDF/UA-2 (basierend auf PDF 2.0)

### Beispiel-Output

**Erfolgreich:**
```
PASS document.pdf is a valid PDF/UA-1
```

**Mit Fehlern:**
```
FAIL document.pdf is not a valid PDF/UA-1

Validation Errors:
- Rule 7.1-1: All content shall be marked (Failed at page 1)
- Rule 7.18-1: Figure element requires Alt attribute (Failed at page 2)
```

## Integration in Projekt

### NPM-Script (nach manueller Installation oder mit Docker-Alias)

Füge in `package.json` hinzu:

```json
{
  "scripts": {
    "validate-pdfua": "verapdf --flavour ua1 examples/*.pdf",
    "validate-pdfua-html": "verapdf --flavour ua1 --format html examples/*.pdf > validation-report.html"
  }
}
```

### Verwendung in Tests

```javascript
// In test/specs/pdfua-validation.spec.js
const { execSync } = require('child_process');
const fs = require('fs');

describe('PDF/UA Validation', () => {
  it('should generate valid PDF/UA document', () => {
    // Generate PDF
    const doc = new jsPDF({ pdfUA: true });
    doc.setTitle('Test');
    doc.beginDocument();
    doc.text('Hello', 10, 10);
    doc.endDocument();
    doc.save('test/output/validation-test.pdf');

    // Validate with veraPDF (requires verapdf in PATH or Docker)
    try {
      const result = execSync(
        'verapdf --flavour ua1 test/output/validation-test.pdf',
        { encoding: 'utf-8' }
      );
      expect(result).toContain('PASS');
    } catch (e) {
      // veraPDF returns non-zero exit code on validation failure
      fail('PDF/UA validation failed: ' + e.stdout);
    }
  });
});
```

## Matterhorn Protocol

veraPDF implementiert das Matterhorn Protocol - 136 Checkpoints für PDF/UA.

### Wichtige Checkpoints:

- **06-001**: ViewerPreferences dictionary missing
- **06-002**: DisplayDocTitle not set or set to false
- **07-001**: Content not tagged
- **09-004**: Structure element mapping missing
- **13-004**: Figure without Alt text
- **28-005**: Heading hierarchy violated

Vollständige Liste: https://www.pdfa.org/publication/the-matterhorn-protocol-1-02/

## Troubleshooting

### "No such command: verapdf"

```bash
# Prüfe Installation
which verapdf

# Setze PATH
export PATH=$PATH:~/verapdf

# Oder verwende Docker
docker run --rm -v $(pwd):/data verapdf/verapdf --help
```

### Java-Fehler

veraPDF benötigt Java 8 oder höher:

```bash
java -version
# Sollte mindestens 1.8 zeigen
```

### Permission Denied

```bash
chmod +x ~/verapdf/verapdf
```

## Ressourcen

- **veraPDF Website:** https://verapdf.org/
- **Documentation:** https://docs.verapdf.org/
- **GitHub:** https://github.com/veraPDF/veraPDF-library
- **PDF/UA Standard:** https://pdfa.org/resource/iso-14289-pdfua/
- **Matterhorn Protocol:** https://www.pdfa.org/publication/the-matterhorn-protocol-1-02/
