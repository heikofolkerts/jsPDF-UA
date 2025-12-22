/**
 * jsPDF PDF/UA Test Application
 * Sprint 0 - Initial Setup
 */

// Global state
let currentTest = null;
let currentPDF = null;

// Test case definitions
const testCases = {
  baseline: {
    name: "Baseline (Current State)",
    description: "Aktueller Stand von jsPDF ohne PDF/UA-Features",
    code: `// Baseline: jsPDF ohne PDF/UA
const { jsPDF } = window.jspdf;
const doc = new jsPDF();

// Dokumenttitel setzen
doc.setProperties({ title: 'Test Document' });

// Einfacher Text
doc.text('Hello World!', 10, 10);
doc.text('This is a test PDF.', 10, 20);

// Speichern
doc.save('baseline-test.pdf');`,

    expectedErrors: [
      "Natural language nicht definiert (Lang)",
      "Keine Metadata (XMP)",
      "Font nicht eingebettet",
      "Marked=true fehlt",
      "DisplayDocTitle fehlt",
      "StructTreeRoot fehlt",
      "Content nicht getaggt"
    ],

    generate: function() {
      try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        doc.setProperties({ title: "Test Document" });
        doc.text("Hello World!", 10, 10);
        doc.text("This is a test PDF.", 10, 20);

        return doc;
      } catch (error) {
        console.error("Error generating PDF:", error);
        throw error;
      }
    }
  },

  sprint1: {
    name: "Sprint 1: Basic PDF/UA",
    description: "PDF/UA-Modus, XMP-Metadaten und DisplayDocTitle",
    code: `// Sprint 1: Basic PDF/UA Infrastructure
const { jsPDF } = window.jspdf;

// Create PDF with PDF/UA mode enabled
const doc = new jsPDF({ pdfUA: true });

// Set document title (required for PDF/UA)
doc.setDocumentTitle('Sprint 1 Test Document');

// Add some text
doc.text('Hello PDF/UA World!', 10, 10);
doc.text('This document has:', 10, 20);
doc.text('  - PDF/UA mode enabled', 10, 30);
doc.text('  - XMP metadata with PDF/UA identification', 10, 40);
doc.text('  - DisplayDocTitle set to true', 10, 50);

// Save the PDF
doc.save('sprint1-test.pdf');`,

    expectedErrors: [
      "Font nicht eingebettet (Sprint 5)",
      "Content nicht getaggt (Sprint 3)",
      "Language fehlt (Sprint 5)",
      "StructTreeRoot fehlt (Sprint 2)",
      "Marked=true fehlt (Sprint 2)"
    ],

    generate: function() {
      try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ pdfUA: true });

        // Set document title
        doc.setDocumentTitle("Sprint 1 Test Document");

        // Add content
        doc.text("Hello PDF/UA World!", 10, 10);
        doc.text("This document has:", 10, 20);
        doc.text("  - PDF/UA mode enabled", 10, 30);
        doc.text("  - XMP metadata with PDF/UA identification", 10, 40);
        doc.text("  - DisplayDocTitle set to true", 10, 50);

        return doc;
      } catch (error) {
        console.error("Error generating PDF:", error);
        throw error;
      }
    }
  },

  sprint2: {
    name: "Sprint 2: Structure Tree",
    description:
      "StructTreeRoot, MarkInfo und Strukturelemente (Document, P, H1)",
    code: `// Sprint 2: Structure Tree
const { jsPDF } = window.jspdf;

// Create PDF with PDF/UA mode enabled
const doc = new jsPDF({ pdfUA: true });

// Set document title (required for PDF/UA)
doc.setDocumentTitle('Sprint 2 Test Document');

// Create document structure
doc.beginStructureElement('Document');

  // Add a heading
  doc.beginStructureElement('H1');
  doc.text('Hello PDF/UA World!', 10, 10);
  doc.endStructureElement();

  // Add paragraphs
  doc.beginStructureElement('P');
  doc.text('This document has:', 10, 20);
  doc.endStructureElement();

  doc.beginStructureElement('P');
  doc.text('  - StructTreeRoot with structure elements', 10, 30);
  doc.text('  - MarkInfo dictionary with Marked=true', 10, 40);
  doc.text('  - Nested Document/H1/P structure', 10, 50);
  doc.endStructureElement();

doc.endStructureElement();

// Save the PDF
doc.save('sprint2-test.pdf');`,

    expectedErrors: [
      "Content nicht getaggt (Sprint 3)",
      "Language fehlt (Sprint 5)",
      "Font nicht eingebettet (Sprint 5)"
    ],

    generate: function() {
      try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ pdfUA: true });

        // Set document title
        doc.setDocumentTitle("Sprint 2 Test Document");

        // Create document structure
        doc.beginStructureElement("Document");

        // Add a heading
        doc.beginStructureElement("H1");
        doc.text("Hello PDF/UA World!", 10, 10);
        doc.endStructureElement();

        // Add paragraphs
        doc.beginStructureElement("P");
        doc.text("This document has:", 10, 20);
        doc.endStructureElement();

        doc.beginStructureElement("P");
        doc.text("  - StructTreeRoot with structure elements", 10, 30);
        doc.text("  - MarkInfo dictionary with Marked=true", 10, 40);
        doc.text("  - Nested Document/H1/P structure", 10, 50);
        doc.endStructureElement();

        doc.endStructureElement();

        return doc;
      } catch (error) {
        console.error("Error generating PDF:", error);
        throw error;
      }
    }
  },

  sprint3: {
    name: "Sprint 3: Marked Content (Auto)",
    description:
      "Content wird automatisch getaggt - keine manuellen BDC/EMC Calls nötig!",
    code: `// Sprint 3: Marked Content - AUTOMATIC!
const { jsPDF } = window.jspdf;

// Create PDF with PDF/UA mode enabled
const doc = new jsPDF({ pdfUA: true });

// Set document title (required for PDF/UA)
doc.setDocumentTitle('Sprint 3 Test Document');

// Create document structure
doc.beginStructureElement('Document');

  // Add a heading - text() automatically adds MCIDs!
  doc.beginStructureElement('H1');
  doc.text('Hello PDF/UA World!', 10, 10);
  doc.endStructureElement();

  // Add paragraphs - automatically tagged
  doc.beginStructureElement('P');
  doc.text('This document has:', 10, 20);
  doc.endStructureElement();

  doc.beginStructureElement('P');
  doc.text('  - Automatic content tagging with MCIDs', 10, 30);
  doc.text('  - BDC/EMC operators around each text()', 10, 40);
  doc.text('  - ParentTree mapping MCIDs to structure', 10, 50);
  doc.text('  - StructParents in page objects', 10, 60);
  doc.endStructureElement();

doc.endStructureElement();

// Save the PDF
doc.save('sprint3-test.pdf');`,

    expectedErrors: [
      "Language fehlt (Sprint 5)",
      "Font nicht eingebettet (Sprint 5)"
    ],

    generate: function() {
      try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ pdfUA: true });

        // Set document title
        doc.setDocumentTitle("Sprint 3 Test Document");

        // Create document structure
        doc.beginStructureElement("Document");

        // Add a heading - automatically tagged
        doc.beginStructureElement("H1");
        doc.text("Hello PDF/UA World!", 10, 10);
        doc.endStructureElement();

        // Add paragraphs - automatically tagged
        doc.beginStructureElement("P");
        doc.text("This document has:", 10, 20);
        doc.endStructureElement();

        doc.beginStructureElement("P");
        doc.text("  - Automatic content tagging with MCIDs", 10, 30);
        doc.text("  - BDC/EMC operators around each text()", 10, 40);
        doc.text("  - ParentTree mapping MCIDs to structure", 10, 50);
        doc.text("  - StructParents in page objects", 10, 60);
        doc.endStructureElement();

        doc.endStructureElement();

        return doc;
      } catch (error) {
        console.error("Error generating PDF:", error);
        throw error;
      }
    }
  }

  // Weitere Test-Cases werden in späteren Sprints hinzugefügt
  // sprint3: { ... }
  // etc.
};

/**
 * Show test case details
 */
function showTest(testName) {
  const test = testCases[testName];
  if (!test) {
    console.error("Test not found:", testName);
    return;
  }

  currentTest = test;
  currentPDF = null;

  // Update code display
  const codeDisplay = document.getElementById("code-display");
  codeDisplay.textContent = test.code;

  // Enable generate button
  document.getElementById("btn-generate").disabled = false;
  document.getElementById("btn-download").disabled = true;

  // Hide previous results
  document.getElementById("error-display").style.display = "none";
  document.getElementById("success-display").style.display = "none";

  // Show expected errors if available
  if (test.expectedErrors && test.expectedErrors.length > 0) {
    const validationResults = document.getElementById("validation-results");
    validationResults.innerHTML = `
      <div class="card">
        <div class="card-header bg-warning text-dark">
          <h5>⚠️ Erwartete veraPDF-Fehler (${test.expectedErrors.length})</h5>
        </div>
        <div class="card-body">
          <ul>
            ${test.expectedErrors.map(err => `<li>${err}</li>`).join("")}
          </ul>
          <p class="mb-0"><small>Diese Fehler werden in den kommenden Sprints behoben.</small></p>
        </div>
      </div>
    `;
  } else {
    document.getElementById("validation-results").innerHTML = "";
  }
}

/**
 * Generate PDF from current test
 */
function generatePDF() {
  if (!currentTest) {
    alert("Bitte wähle zuerst einen Test-Case aus.");
    return;
  }

  try {
    // Hide previous messages
    document.getElementById("error-display").style.display = "none";
    document.getElementById("success-display").style.display = "none";

    // Generate PDF
    console.log("Generating PDF for test:", currentTest.name);
    currentPDF = currentTest.generate();

    // Show success message
    document.getElementById("success-display").style.display = "block";
    document.getElementById("btn-download").disabled = false;

    console.log("PDF generated successfully");
  } catch (error) {
    console.error("Error generating PDF:", error);

    // Show error message
    const errorDisplay = document.getElementById("error-display");
    const errorText = document.getElementById("error-text");
    errorText.textContent = error.message + "\n\n" + error.stack;
    errorDisplay.style.display = "block";
  }
}

/**
 * Download generated PDF
 */
function downloadPDF() {
  if (!currentPDF) {
    alert("Bitte generiere zuerst ein PDF.");
    return;
  }

  try {
    const filename =
      currentTest.name.toLowerCase().replace(/[^a-z0-9]+/g, "-") + ".pdf";
    currentPDF.save(filename);
    console.log("PDF downloaded:", filename);
  } catch (error) {
    console.error("Error downloading PDF:", error);
    alert("Fehler beim Download: " + error.message);
  }
}

/**
 * Initialize application
 */
document.addEventListener("DOMContentLoaded", function() {
  console.log("jsPDF PDF/UA Test Application initialized");
  console.log("Available test cases:", Object.keys(testCases));

  // Check if jsPDF is loaded
  if (typeof window.jspdf === "undefined") {
    alert("Fehler: jsPDF nicht geladen. Bitte lade die Seite neu.");
    return;
  }

  console.log("jsPDF version:", window.jspdf.jsPDF.version);

  // Automatically select baseline test
  showTest("baseline");
});

// Export for debugging
window.testApp = {
  testCases,
  currentTest,
  currentPDF,
  showTest,
  generatePDF,
  downloadPDF
};
