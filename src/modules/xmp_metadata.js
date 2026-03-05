/** ====================================================================
 * @license
 * jsPDF XMP metadata plugin
 * Copyright (c) 2016 Jussi Utunen, u-jussi@suomi24.fi
 *
 * Permission is hereby granted, free of charge, to any person obtaining
 * a copy of this software and associated documentation files (the
 * "Software"), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to
 * the following conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
 * LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 * OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
 * WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 * ====================================================================
 */

import { jsPDF } from "../jspdf.js";

var jsPDFAPI = jsPDF.API;

function postPutResources() {
  var meta = this.internal.__metadata__;

  var content;
  if (meta.rawXml) {
    // Raw XML mode (upstream feature) - use metadata as-is
    content = unescape(encodeURIComponent(meta.metadata));
  } else if (meta.pdfUA) {
    // PDF/UA mode - build structured XMP with all required fields
    content = buildPdfUaXmp(meta);
  } else if (meta.metadata) {
    // Legacy mode - wrap custom metadata in XMP structure
    var utf8Metadata = unescape(encodeURIComponent(meta.metadata));
    var xmpmetaBeginning = '<x:xmpmeta xmlns:x="adobe:ns:meta/">';
    var rdfBeginning =
      '<rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"><rdf:Description rdf:about="" xmlns:jspdf="' +
      meta.namespaceUri +
      '"><jspdf:metadata>';
    var rdfEnding = "</jspdf:metadata></rdf:Description></rdf:RDF>";
    var xmpmetaEnding = "</x:xmpmeta>";

    content =
      xmpmetaBeginning +
      rdfBeginning +
      escapeXml(utf8Metadata) +
      rdfEnding +
      xmpmetaEnding;
  } else {
    return;
  }

  meta.metadataObjectNumber = this.internal.newObject();
  this.internal.write(
    "<< /Type /Metadata /Subtype /XML /Length " + content.length + " >>"
  );
  this.internal.write("stream");
  this.internal.write(content);
  this.internal.write("endstream");
  this.internal.write("endobj");
}

function buildPdfUaXmp(meta) {
  var xmpmeta_beginning = '<x:xmpmeta xmlns:x="adobe:ns:meta/">';
  var xmpmeta_ending = "</x:xmpmeta>";

  var rdf_content =
    '<rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">';

  // Main Description element with all namespaces
  var namespaces = 'xmlns:dc="http://purl.org/dc/elements/1.1/"';
  namespaces += ' xmlns:pdfuaid="http://www.aiim.org/pdfua/ns/id/"';

  if (meta.customMetadata) {
    namespaces +=
      ' xmlns:jspdf="' +
      (meta.namespaceUri || "http://jspdf.default.namespaceuri/") +
      '"';
  }

  rdf_content += '<rdf:Description rdf:about="" ' + namespaces + ">";

  // Add dc:title - required for PDF/UA (ISO 14289-1, clause 7.1, test 9)
  var title = meta.title;
  if (!title) {
    title = "Untitled Document"; // Fallback for PDF/UA compliance
  }
  rdf_content +=
    '<dc:title><rdf:Alt><rdf:li xml:lang="x-default">' +
    escapeXml(title) +
    "</rdf:li></rdf:Alt></dc:title>";

  // Add PDF/UA identification
  rdf_content += "<pdfuaid:part>1</pdfuaid:part>";
  rdf_content += "<pdfuaid:conformance>A</pdfuaid:conformance>";

  // Add custom metadata if provided (legacy support)
  if (meta.customMetadata) {
    rdf_content +=
      "<jspdf:metadata>" +
      escapeXml(meta.customMetadata) +
      "</jspdf:metadata>";
  }

  rdf_content += "</rdf:Description></rdf:RDF>";

  var xmp_packet = xmpmeta_beginning + rdf_content + xmpmeta_ending;
  return unescape(encodeURIComponent(xmp_packet));
}

function putCatalog() {
  if (this.internal.__metadata__.metadataObjectNumber) {
    this.internal.write(
      "/Metadata " + this.internal.__metadata__.metadataObjectNumber + " 0 R"
    );
  }
}

function escapeXml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Initialize metadata structure
 * @private
 */
function initMetadata(doc) {
  if (typeof doc.internal.__metadata__ === "undefined") {
    doc.internal.__metadata__ = {
      namespaceUri: "http://jspdf.default.namespaceuri/"
    };
    doc.internal.events.subscribe("putCatalog", putCatalog);
    doc.internal.events.subscribe("postPutResources", postPutResources);
  }
}

/**
 * Adds XMP formatted metadata to PDF.
 *
 * WARNING: Passing raw XML is potentially insecure! Always sanitize user input before passing it to this function!
 * @name addMetadata
 * @function
 * @param {string} metadata The actual metadata to be added. The interpretation of this parameter depends on the
 *   second parameter.
 * @param {boolean|string|undefined} rawXmlOrNamespaceUri If a string is passed it sets the namespace URI for the
 *   metadata and the metadata shall be stored as XMP simple value. The last character should be a slash or hash.
 *
 *   If this argument is omitted, a string is passed, or `false` is passed, the `metadata` argument will be
 *   XML-escaped before including it in the PDF.
 *
 *   If `true` is passed, the `metadata` argument will be interpreted as raw XMP and will be included verbatim
 *   in the PDF. The passed metadata must be complete (including surrounding `xmpmeta` and `RDF` tags).
 * @returns {jsPDF} jsPDF-instance
 */
jsPDFAPI.addMetadata = function(metadata, rawXmlOrNamespaceUri) {
  initMetadata(this);
  this.internal.__metadata__.metadata = metadata;
  this.internal.__metadata__.namespaceUri =
    rawXmlOrNamespaceUri ?? "http://jspdf.default.namespaceuri/";
  this.internal.__metadata__.rawXml =
    typeof rawXmlOrNamespaceUri === "boolean" ? rawXmlOrNamespaceUri : false;
  return this;
};

/**
 * Set document title (will be used in XMP dc:title and for DisplayDocTitle)
 *
 * @name setDocumentTitle
 * @function
 * @param {String} title The document title
 * @returns {jsPDF} jsPDF-instance
 */
jsPDFAPI.setDocumentTitle = function(title) {
  initMetadata(this);
  this.internal.__metadata__.title = title;

  // Also set in document properties for consistency
  this.setProperties({ title: title });

  return this;
};

// Automatically initialize XMP metadata for PDF/UA documents
jsPDFAPI.events.push([
  "initialized",
  function() {
    if (this.isPDFUAEnabled && this.isPDFUAEnabled()) {
      initMetadata(this);
      this.internal.__metadata__.pdfUA = true;

      // Get title from properties if set
      if (this.internal.title) {
        this.internal.__metadata__.title = this.internal.title;
      }
    }
  }
]);
