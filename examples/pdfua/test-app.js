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
    name: 'Baseline (Current State)',
    description: 'Aktueller Stand von jsPDF ohne PDF/UA-Features',
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
      'Natural language nicht definiert (Lang)',
      'Keine Metadata (XMP)',
      'Font nicht eingebettet',
      'Marked=true fehlt',
      'DisplayDocTitle fehlt',
      'StructTreeRoot fehlt',
      'Content nicht getaggt'
    ],

    generate: function() {
      try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        doc.setProperties({ title: 'Test Document' });
        doc.text('Hello World!', 10, 10);
        doc.text('This is a test PDF.', 10, 20);

        return doc;
      } catch (error) {
        console.error('Error generating PDF:', error);
        throw error;
      }
    }
  },

  // Weitere Test-Cases werden in späteren Sprints hinzugefügt
  // sprint1: { ... }
  // sprint2: { ... }
  // etc.
};

/**
 * Show test case details
 */
function showTest(testName) {
  const test = testCases[testName];
  if (!test) {
    console.error('Test not found:', testName);
    return;
  }

  currentTest = test;
  currentPDF = null;

  // Update code display
  const codeDisplay = document.getElementById('code-display');
  codeDisplay.textContent = test.code;

  // Enable generate button
  document.getElementById('btn-generate').disabled = false;
  document.getElementById('btn-download').disabled = true;

  // Hide previous results
  document.getElementById('error-display').style.display = 'none';
  document.getElementById('success-display').style.display = 'none';

  // Show expected errors if available
  if (test.expectedErrors && test.expectedErrors.length > 0) {
    const validationResults = document.getElementById('validation-results');
    validationResults.innerHTML = `
      <div class="card">
        <div class="card-header bg-warning text-dark">
          <h5>⚠️ Erwartete veraPDF-Fehler (${test.expectedErrors.length})</h5>
        </div>
        <div class="card-body">
          <ul>
            ${test.expectedErrors.map(err => `<li>${err}</li>`).join('')}
          </ul>
          <p class="mb-0"><small>Diese Fehler werden in den kommenden Sprints behoben.</small></p>
        </div>
      </div>
    `;
  } else {
    document.getElementById('validation-results').innerHTML = '';
  }
}

/**
 * Generate PDF from current test
 */
function generatePDF() {
  if (!currentTest) {
    alert('Bitte wähle zuerst einen Test-Case aus.');
    return;
  }

  try {
    // Hide previous messages
    document.getElementById('error-display').style.display = 'none';
    document.getElementById('success-display').style.display = 'none';

    // Generate PDF
    console.log('Generating PDF for test:', currentTest.name);
    currentPDF = currentTest.generate();

    // Show success message
    document.getElementById('success-display').style.display = 'block';
    document.getElementById('btn-download').disabled = false;

    console.log('PDF generated successfully');
  } catch (error) {
    console.error('Error generating PDF:', error);

    // Show error message
    const errorDisplay = document.getElementById('error-display');
    const errorText = document.getElementById('error-text');
    errorText.textContent = error.message + '\n\n' + error.stack;
    errorDisplay.style.display = 'block';
  }
}

/**
 * Download generated PDF
 */
function downloadPDF() {
  if (!currentPDF) {
    alert('Bitte generiere zuerst ein PDF.');
    return;
  }

  try {
    const filename = currentTest.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '.pdf';
    currentPDF.save(filename);
    console.log('PDF downloaded:', filename);
  } catch (error) {
    console.error('Error downloading PDF:', error);
    alert('Fehler beim Download: ' + error.message);
  }
}

/**
 * Initialize application
 */
document.addEventListener('DOMContentLoaded', function() {
  console.log('jsPDF PDF/UA Test Application initialized');
  console.log('Available test cases:', Object.keys(testCases));

  // Check if jsPDF is loaded
  if (typeof window.jspdf === 'undefined') {
    alert('Fehler: jsPDF nicht geladen. Bitte lade die Seite neu.');
    return;
  }

  console.log('jsPDF version:', window.jspdf.jsPDF.version);

  // Automatically select baseline test
  showTest('baseline');
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
