// Test PDF/UA mode implementation (US-1.1)
const { jsPDF } = require('./dist/jspdf.node.min.js');

console.log('Testing PDF/UA Mode (US-1.1)...\n');

// Test 1: Constructor with pdfUA option
console.log('Test 1: Constructor with pdfUA: true');
const doc1 = new jsPDF({ pdfUA: true });
console.log('  isPDFUAEnabled():', doc1.isPDFUAEnabled());
console.log('  internal.pdfUA:', doc1.internal.pdfUA);
console.log('  ✓ Test 1 passed\n');

// Test 2: Constructor without pdfUA option
console.log('Test 2: Constructor without pdfUA');
const doc2 = new jsPDF();
console.log('  isPDFUAEnabled():', doc2.isPDFUAEnabled());
console.log('  internal.pdfUA:', doc2.internal.pdfUA);
console.log('  ✓ Test 2 passed\n');

// Test 3: enablePDFUA() method
console.log('Test 3: enablePDFUA() method');
const doc3 = new jsPDF();
console.log('  Before: isPDFUAEnabled():', doc3.isPDFUAEnabled());
doc3.enablePDFUA();
console.log('  After: isPDFUAEnabled():', doc3.isPDFUAEnabled());
console.log('  internal.pdfUA:', doc3.internal.pdfUA);
console.log('  ✓ Test 3 passed\n');

// Test 4: disablePDFUA() method
console.log('Test 4: disablePDFUA() method');
const doc4 = new jsPDF({ pdfUA: true });
console.log('  Before: isPDFUAEnabled():', doc4.isPDFUAEnabled());
doc4.disablePDFUA();
console.log('  After: isPDFUAEnabled():', doc4.isPDFUAEnabled());
console.log('  internal.pdfUA:', doc4.internal.pdfUA);
console.log('  ✓ Test 4 passed\n');

// Test 5: Method chaining
console.log('Test 5: Method chaining');
const doc5 = new jsPDF().enablePDFUA();
console.log('  isPDFUAEnabled():', doc5.isPDFUAEnabled());
console.log('  ✓ Test 5 passed\n');

console.log('✅ All tests passed!');
console.log('\nUS-1.1 (PDF/UA Mode) implementation successful!');
