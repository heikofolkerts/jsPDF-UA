/**
 * @license
 * Copyright (c) 2025 Heiko Folkerts and contributors
 * Licensed under the MIT License.
 * https://github.com/parallax/jsPDF
 *
 * Structure Tree Module for PDF/UA
 *
 * This module implements the PDF structure tree (StructTreeRoot and StructElems)
 * which is required for PDF/UA compliance. The structure tree provides the logical
 * document structure that assistive technologies use to navigate the document.
 */

import { jsPDF } from "../jspdf.js";

(function(jsPDFAPI) {
  "use strict";

  /**
   * StructElement class - represents a structure element in the PDF structure tree
   */
  function StructElement(type, parent, api) {
    this.type = type;           // e.g. 'Document', 'P', 'H1', 'H2', etc.
    this.parent = parent;       // Parent structure element
    this.children = [];         // Child structure elements
    this.attributes = {};       // Element attributes
    this.mcids = [];            // Marked Content IDs (references to page content)
    this.objectNumber = null;   // PDF object number (assigned during output)
    this.id = null;             // Unique ID within the document
    this.api = api;             // Reference to jsPDF API
  }

  /**
   * Add a marked content ID to this structure element
   */
  StructElement.prototype.addMCID = function(pageNumber, mcid) {
    this.mcids.push({
      page: pageNumber,
      mcid: mcid
    });
  };

  /**
   * Add a child structure element
   */
  StructElement.prototype.addChild = function(child) {
    this.children.push(child);
    child.parent = this;
  };

  /**
   * Initialize the structure tree
   * This is called automatically when PDF/UA mode is enabled
   */
  var initStructureTree = function() {
    if (!this.internal.structureTree) {
      this.internal.structureTree = {
        root: null,              // StructTreeRoot
        currentParent: null,     // Current parent for new elements
        elements: [],            // All structure elements
        mcidCounter: {},         // MCID counter per page
        nextStructId: 0,         // Next unique structure ID
        stack: []                // Stack for nested elements
      };

      // Create root if PDF/UA is enabled
      if (this.isPDFUAEnabled && this.isPDFUAEnabled()) {
        createStructTreeRoot.call(this);
      }
    }
  };

  /**
   * Create the StructTreeRoot object
   * This is the top-level structure element that contains all other structure elements
   */
  var createStructTreeRoot = function() {
    if (this.internal.structureTree.root) {
      return this.internal.structureTree.root;
    }

    var root = {
      type: 'StructTreeRoot',
      id: this.internal.structureTree.nextStructId++,
      children: [],
      objectNumber: null,  // Will be assigned later
      api: this
    };

    this.internal.structureTree.root = root;
    this.internal.structureTree.currentParent = root;

    return root;
  };

  /**
   * Begin a structure element
   * @param {string} type - Structure element type (e.g. 'Document', 'P', 'H1')
   * @param {object} attributes - Optional attributes for the element
   * @returns {jsPDF} - Returns jsPDF instance for method chaining
   */
  jsPDFAPI.beginStructureElement = function(type, attributes) {
    initStructureTree.call(this);

    var parent = this.internal.structureTree.currentParent;
    if (!parent) {
      parent = this.internal.structureTree.root;
    }

    var element = new StructElement(type, parent, this);
    element.attributes = attributes || {};
    element.id = this.internal.structureTree.nextStructId++;
    // Object number will be assigned later in reserveStructObjectNumbers

    if (parent && parent.children) {
      parent.children.push(element);
    } else if (parent && parent.addChild) {
      parent.addChild(element);
    }

    // Push current parent to stack and set new parent
    this.internal.structureTree.stack.push(parent);
    this.internal.structureTree.currentParent = element;
    this.internal.structureTree.elements.push(element);

    return this;
  };

  /**
   * End the current structure element
   * @returns {jsPDF} - Returns jsPDF instance for method chaining
   */
  jsPDFAPI.endStructureElement = function() {
    if (!this.internal.structureTree || this.internal.structureTree.stack.length === 0) {
      return this;
    }

    // Pop parent from stack
    this.internal.structureTree.currentParent = this.internal.structureTree.stack.pop();

    return this;
  };

  /**
   * Get the current structure element
   * @returns {StructElement|null} - Current structure element or null
   */
  jsPDFAPI.getCurrentStructureElement = function() {
    if (!this.internal.structureTree) {
      return null;
    }
    return this.internal.structureTree.currentParent;
  };

  /**
   * Get next MCID for current page
   * @returns {number} - Next MCID for the current page
   */
  jsPDFAPI.getNextMCID = function() {
    initStructureTree.call(this);
    var pageNumber = this.internal.getCurrentPageInfo().pageNumber;
    if (!this.internal.structureTree.mcidCounter[pageNumber]) {
      this.internal.structureTree.mcidCounter[pageNumber] = 0;
    }
    return this.internal.structureTree.mcidCounter[pageNumber]++;
  };

  /**
   * Add MCID to current structure element
   * @param {number} mcid - Marked Content ID
   * @param {number} pageNumber - Page number
   */
  jsPDFAPI.addMCIDToCurrentStructure = function(mcid, pageNumber) {
    if (!this.internal.structureTree || !this.internal.structureTree.currentParent) {
      return;
    }
    var currentElem = this.internal.structureTree.currentParent;
    if (currentElem.type !== 'StructTreeRoot') {
      currentElem.addMCID(pageNumber, mcid);
    }
  };

  /**
   * Write ParentTree - maps page MCIDs to structure elements
   */
  var writeParentTree = function() {
    if (!this.internal.structureTree || !this.internal.structureTree.root) {
      return;
    }

    // Build mapping: page -> mcid -> structElement
    var parentTree = {};
    var elements = this.internal.structureTree.elements;

    for (var i = 0; i < elements.length; i++) {
      var elem = elements[i];
      if (elem.mcids && elem.mcids.length > 0) {
        for (var j = 0; j < elem.mcids.length; j++) {
          var mcidInfo = elem.mcids[j];
          var pageKey = mcidInfo.page - 1; // Pages are 0-indexed in ParentTree

          if (!parentTree[pageKey]) {
            parentTree[pageKey] = [];
          }

          if (!parentTree[pageKey][mcidInfo.mcid]) {
            parentTree[pageKey][mcidInfo.mcid] = elem.objectNumber;
          }
        }
      }
    }

    // First, create indirect array objects for each page
    var pageKeys = Object.keys(parentTree).sort(function(a, b) { return a - b; });
    var pageArrayObjects = {};

    for (var k = 0; k < pageKeys.length; k++) {
      var pageNum = pageKeys[k];
      var mcidMap = parentTree[pageNum];

      // Build the array for this page
      var pageArray = [];
      var maxMcid = 0;

      for (var mcid in mcidMap) {
        if (parseInt(mcid) > maxMcid) maxMcid = parseInt(mcid);
      }

      for (var m = 0; m <= maxMcid; m++) {
        if (mcidMap[m]) {
          pageArray.push(mcidMap[m] + ' 0 R');
        } else {
          pageArray.push('null');
        }
      }

      // Create an indirect object for this array
      var arrayObjNum = this.internal.newObject();
      this.internal.write('[' + pageArray.join(' ') + ']');
      this.internal.write('endobj');

      pageArrayObjects[pageNum] = arrayObjNum;
    }

    // Now write ParentTree as NumberTree with references to the array objects
    var parentTreeObj = this.internal.newObject();
    this.internal.write('<< /Nums [');

    for (var k = 0; k < pageKeys.length; k++) {
      var pageNum = pageKeys[k];
      this.internal.write(pageNum + ' ' + pageArrayObjects[pageNum] + ' 0 R');
    }

    this.internal.write(']');
    this.internal.write('>>');
    this.internal.write('endobj');

    // Store reference for StructTreeRoot
    this.internal.structureTree.parentTreeObj = parentTreeObj;
  };

  /**
   * Write the structure tree to the PDF
   * This is called during PDF generation after all content is written
   */
  /**
   * Reserve object numbers for structure tree
   * Called at the right time to avoid collisions with page/resource objects
   */
  var reserveStructObjectNumbers = function() {
    if (!this.internal.structureTree || !this.internal.structureTree.root) {
      return;
    }

    var root = this.internal.structureTree.root;
    var elements = this.internal.structureTree.elements;

    // Reserve root object number if not already done
    if (!root.objectNumber) {
      root.objectNumber = this.internal.newObjectDeferred();
    }

    // Reserve object numbers for all elements
    for (var i = 0; i < elements.length; i++) {
      if (!elements[i].objectNumber) {
        elements[i].objectNumber = this.internal.newObjectDeferred();
      }
    }
  };

  var writeStructTree = function() {
    if (!this.internal.structureTree || !this.internal.structureTree.root) {
      return;
    }

    // CRITICAL FIX: Only write structure tree if there are actual structure elements
    // If we write an empty StructTreeRoot with Marked=true, Acrobat treats all content as artifacts
    if (this.internal.structureTree.root.children.length === 0) {
      return;
    }

    // Make sure object numbers are reserved before writing
    reserveStructObjectNumbers.call(this);

    var root = this.internal.structureTree.root;
    var elements = this.internal.structureTree.elements;

    // Now write all structure elements with correct references
    for (var i = 0; i < elements.length; i++) {
      var elem = elements[i];
      this.internal.newObjectDeferredBegin(elem.objectNumber, true);
      this.internal.write('<< /Type /StructElem');
      this.internal.write('/S /' + elem.type);

      // Parent reference
      if (elem.parent && elem.parent.objectNumber) {
        this.internal.write('/P ' + elem.parent.objectNumber + ' 0 R');
      }

      // Alternative text (for images, required for PDF/UA)
      if (elem.alt) {
        // Escape special characters in alt text
        var escapedAlt = elem.alt.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
        this.internal.write('/Alt (' + escapedAlt + ')');
      }

      // Attribute dictionary (for table headers and other elements)
      if (elem.attributes && elem.attributes.scope) {
        // Scope must be in an attribute dictionary with /O /Table owner
        this.internal.write('/A << /O /Table /Scope /' + elem.attributes.scope + ' >>');
      }

      // Page reference (required when element has MCIDs)
      if (elem.mcids.length > 0) {
        var pageNum = elem.mcids[0].page;
        // CRITICAL FIX: Use getPageInfo to get the correct page object ID
        // The old calculation (2 + pageNum) assumed page objects start at obj 3,
        // but this is incorrect when fonts and other objects are added before pages.
        var pageInfo = this.getPageInfo(pageNum);
        this.internal.write('/Pg ' + pageInfo.objId + ' 0 R');
      }

      // Children (K entry)
      // An element can have MCIDs, child elements, OBJR references, or combinations
      var hasAnnotationRefs = elem.annotationInternalIds && elem.annotationInternalIds.length > 0;
      var hasContent = elem.children.length > 0 || elem.mcids.length > 0 || hasAnnotationRefs;

      if (hasContent) {
        var kArray = [];
        var self = this;

        // Add MCIDs first
        elem.mcids.forEach(function(m) {
          kArray.push(m.mcid);
        });

        // Add OBJR references for link annotations (PDF/UA requirement)
        // Format: << /Type /OBJR /Obj <annotation-objId> 0 R >>
        if (hasAnnotationRefs) {
          elem.annotationInternalIds.forEach(function(internalId) {
            // Resolve internal ID to actual object ID using the mapping
            var objId = self.internal.pdfuaLinkIdMap && self.internal.pdfuaLinkIdMap[internalId];
            if (objId) {
              kArray.push('<< /Type /OBJR /Obj ' + objId + ' 0 R >>');
            }
          });
        }

        // Add child structure elements
        elem.children.forEach(function(c) {
          kArray.push(c.objectNumber + ' 0 R');
        });

        this.internal.write('/K [' + kArray.join(' ') + ']');
      }

      this.internal.write('>>');
      this.internal.write('endobj');
    }

    // Write ParentTree
    writeParentTree.call(this);

    // Write RoleMap (empty but required for PDF/UA)
    var roleMapObj = this.internal.newObject();
    this.internal.write('<< >>');
    this.internal.write('endobj');

    // Write StructTreeRoot (objectNumber was reserved earlier)
    // CRITICAL FIX: Use newObjectDeferredBegin instead of out() for deferred objects
    this.internal.newObjectDeferredBegin(root.objectNumber, true);
    this.internal.write('<< /Type /StructTreeRoot');

    if (root.children.length > 0) {
      var rootKids = root.children.map(function(c) {
        return c.objectNumber + ' 0 R';
      }).join(' ');
      this.internal.write('/K [' + rootKids + ']');
    }

    // Add ParentTree reference
    if (this.internal.structureTree.parentTreeObj) {
      this.internal.write('/ParentTree ' + this.internal.structureTree.parentTreeObj + ' 0 R');
    }

    // Add RoleMap reference
    this.internal.write('/RoleMap ' + roleMapObj + ' 0 R');

    this.internal.write('>>');
    this.internal.write('endobj');
  };

  /**
   * Add StructTreeRoot reference to Catalog
   */
  var putCatalog = function() {
    if (this.internal.structureTree && this.internal.structureTree.root) {
      var root = this.internal.structureTree.root;
      if (root.objectNumber) {
        this.internal.write('/StructTreeRoot ' + root.objectNumber + ' 0 R');
      }
    }
  };

  /**
   * Write MarkInfo dictionary to PDF
   * MarkInfo is required for PDF/UA and contains the Marked flag
   */
  var writeMarkInfo = function() {
    if (!this.isPDFUAEnabled || !this.isPDFUAEnabled()) {
      return;
    }

    // CRITICAL FIX: Only write MarkInfo if there are actual structure elements
    // Marked=true without tagged content causes Acrobat to treat everything as artifacts
    if (!this.internal.structureTree || !this.internal.structureTree.root ||
        this.internal.structureTree.root.children.length === 0) {
      return;
    }

    if (!this.internal.markInfo) {
      this.internal.markInfo = {};
    }

    // Create MarkInfo dictionary
    var markInfoObjId = this.internal.newObject();
    this.internal.write('<< /Marked true');
    this.internal.write('>>');
    this.internal.write('endobj');

    // Store reference for Catalog
    this.internal.markInfo.objectNumber = markInfoObjId;
  };

  /**
   * Add MarkInfo reference to Catalog for PDF/UA
   */
  var putCatalogMarkInfo = function() {
    if (this.isPDFUAEnabled && this.isPDFUAEnabled()) {
      if (this.internal.markInfo && this.internal.markInfo.objectNumber) {
        this.internal.write('/MarkInfo ' + this.internal.markInfo.objectNumber + ' 0 R');
      }
    }
  };

  /**
   * Initialize structure tree when PDF/UA is enabled
   */
  jsPDFAPI.events.push([
    "initialized",
    function() {
      if (this.isPDFUAEnabled && this.isPDFUAEnabled()) {
        initStructureTree.call(this);
        createStructTreeRoot.call(this);
      }
    }
  ]);

  /**
   * Write MarkInfo dictionary before structure tree
   */
  jsPDFAPI.events.push([
    "postPutResources",
    writeMarkInfo
  ]);

  /**
   * Write structure tree before finalizing PDF
   */
  jsPDFAPI.events.push([
    "postPutResources",
    writeStructTree
  ]);

  /**
   * Add MarkInfo reference to Catalog
   */
  jsPDFAPI.events.push([
    "putCatalog",
    putCatalogMarkInfo
  ]);

  /**
   * Add StructTreeRoot to Catalog
   */
  jsPDFAPI.events.push([
    "putCatalog",
    putCatalog
  ]);

  /**
   * Set document language for PDF/UA
   * @param {string} lang - Language code (e.g., 'en-US', 'de-DE')
   * @returns {jsPDF}
   */
  jsPDFAPI.setLanguage = function(lang) {
    if (!this.internal.pdfUA) {
      this.internal.pdfUA = {};
    }
    this.internal.pdfUA.language = lang;
    return this;
  };

  /**
   * Get document language for PDF/UA
   * @returns {string} - Language code (default: 'en-US')
   */
  jsPDFAPI.getLanguage = function() {
    if (this.internal.pdfUA && this.internal.pdfUA.language) {
      return this.internal.pdfUA.language;
    }
    return 'en-US'; // Default language
  };

  /**
   * Add /Lang to Catalog for document language
   */
  var putCatalogLang = function() {
    if (this.isPDFUAEnabled && this.isPDFUAEnabled()) {
      var lang = this.getLanguage();
      this.internal.write('/Lang (' + lang + ')');
    }
  };

  jsPDFAPI.events.push([
    "putCatalog",
    putCatalogLang
  ]);

  /**
   * Add StructParents to each page
   * @param {object} putPageData - Event data containing pageNumber and pageContext
   */
  var putStructParentsInPage = function(putPageData) {
    if (!this.isPDFUAEnabled || !this.isPDFUAEnabled()) {
      return;
    }

    // CRITICAL FIX: Only add page structure properties if there are actual structure elements
    // These properties signal to Acrobat that content should be tagged
    if (!this.internal.structureTree || !this.internal.structureTree.root ||
        this.internal.structureTree.root.children.length === 0) {
      return;
    }

    // CRITICAL FIX: Use pageNumber from event data, not getCurrentPageInfo()
    // When putPage is called during PDF generation, currentPage may not match
    // the page actually being written. The event data contains the correct page number.
    var pageNumber = putPageData.pageNumber;
    this.internal.write('/StructParents ' + (pageNumber - 1));

    // Add Tabs entry for proper reading order
    this.internal.write('/Tabs /S');

    // Add transparency group for proper color space handling
    this.internal.write('/Group << /Type /Group /S /Transparency /CS /DeviceRGB >>');
  };

  jsPDFAPI.events.push(["putPage", putStructParentsInPage]);

  /**
   * Begin a table header section
   * @returns {jsPDF} - Returns jsPDF instance for method chaining
   */
  jsPDFAPI.beginTableHead = function() {
    return this.beginStructureElement('THead');
  };

  /**
   * Begin a table body section
   * @returns {jsPDF} - Returns jsPDF instance for method chaining
   */
  jsPDFAPI.beginTableBody = function() {
    return this.beginStructureElement('TBody');
  };

  /**
   * Begin a table footer section
   * @returns {jsPDF} - Returns jsPDF instance for method chaining
   */
  jsPDFAPI.beginTableFoot = function() {
    return this.beginStructureElement('TFoot');
  };

  /**
   * End table head section
   * Convenience method for doc.endStructureElement()
   * @returns {jsPDF} - Returns jsPDF instance for method chaining
   */
  jsPDFAPI.endTableHead = function() {
    return this.endStructureElement();
  };

  /**
   * End table body section
   * Convenience method for doc.endStructureElement()
   * @returns {jsPDF} - Returns jsPDF instance for method chaining
   */
  jsPDFAPI.endTableBody = function() {
    return this.endStructureElement();
  };

  /**
   * End table footer section
   * Convenience method for doc.endStructureElement()
   * @returns {jsPDF} - Returns jsPDF instance for method chaining
   */
  jsPDFAPI.endTableFoot = function() {
    return this.endStructureElement();
  };

  /**
   * Begin a table row structure element
   * Convenience method for doc.beginStructureElement('TR')
   * @returns {jsPDF} - Returns jsPDF instance for method chaining
   */
  jsPDFAPI.beginTableRow = function() {
    return this.beginStructureElement('TR');
  };

  /**
   * Begin a table header cell with scope
   * @param {string} scope - 'Row', 'Column', or 'Both'
   * @returns {jsPDF} - Returns jsPDF instance for method chaining
   */
  jsPDFAPI.beginTableHeaderCell = function(scope) {
    if (!scope || !['Row', 'Column', 'Both'].includes(scope)) {
      throw new Error('Table header scope must be "Row", "Column", or "Both"');
    }

    // Begin TH element with scope attribute
    this.beginStructureElement('TH', { scope: scope });

    return this;
  };

  /**
   * Begin a table data cell
   * Convenience method for doc.beginStructureElement('TD')
   * @returns {jsPDF} - Returns jsPDF instance for method chaining
   */
  jsPDFAPI.beginTableDataCell = function() {
    return this.beginStructureElement('TD');
  };

  /**
   * Begin a list structure element
   * @param {boolean} numbered - Optional: true for ordered list (ol), false for unordered (ul)
   * @returns {jsPDF} - Returns jsPDF instance for method chaining
   */
  jsPDFAPI.beginList = function(numbered) {
    return this.beginStructureElement('L', { numbered: numbered || false });
  };

  /**
   * Begin a numbered list (ordered list / ol)
   * Convenience method for doc.beginList(true)
   * @returns {jsPDF} - Returns jsPDF instance for method chaining
   */
  jsPDFAPI.beginListNumbered = function() {
    return this.beginList(true);
  };

  /**
   * Begin a list item structure element
   * Convenience method for doc.beginStructureElement('LI')
   * @returns {jsPDF} - Returns jsPDF instance for method chaining
   */
  jsPDFAPI.beginListItem = function() {
    return this.beginStructureElement('LI');
  };

  /**
   * Add a list label (bullet point or number)
   * Automatically wraps the label in an Lbl structure element
   * @param {string} label - The label text (e.g., "•", "1.", "a)")
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @returns {jsPDF} - Returns jsPDF instance for method chaining
   */
  jsPDFAPI.addListLabel = function(label, x, y) {
    this.beginStructureElement('Lbl');
    this.text(label, x, y);
    this.endStructureElement();
    return this;
  };

  /**
   * Begin list body (content of list item)
   * Convenience method for doc.beginStructureElement('LBody')
   * @returns {jsPDF} - Returns jsPDF instance for method chaining
   */
  jsPDFAPI.beginListBody = function() {
    return this.beginStructureElement('LBody');
  };

  /**
   * End list body
   * Convenience method for doc.endStructureElement()
   * @returns {jsPDF} - Returns jsPDF instance for method chaining
   */
  jsPDFAPI.endListBody = function() {
    return this.endStructureElement();
  };

  /**
   * End list
   * Convenience method for doc.endStructureElement()
   * @returns {jsPDF} - Returns jsPDF instance for method chaining
   */
  jsPDFAPI.endList = function() {
    return this.endStructureElement();
  };

  /**
   * Begin a link structure element
   * Links must be wrapped in Link elements for PDF/UA accessibility
   * @returns {jsPDF} - Returns jsPDF instance for method chaining
   */
  jsPDFAPI.beginLink = function() {
    return this.beginStructureElement('Link');
  };

  /**
   * End a link structure element
   * Convenience method for doc.endStructureElement()
   * @returns {jsPDF} - Returns jsPDF instance for method chaining
   */
  jsPDFAPI.endLink = function() {
    return this.endStructureElement();
  };

  /**
   * Begin a Strong (important) text section
   * For text that has semantic importance (not just visual bold)
   * Screen readers may announce this text with emphasis or different intonation
   * @returns {jsPDF} - Returns jsPDF instance for method chaining
   */
  jsPDFAPI.beginStrong = function() {
    return this.beginStructureElement('Strong');
  };

  /**
   * End a Strong text section
   * Convenience method for doc.endStructureElement()
   * @returns {jsPDF} - Returns jsPDF instance for method chaining
   */
  jsPDFAPI.endStrong = function() {
    return this.endStructureElement();
  };

  /**
   * Begin an Em (emphasis) text section
   * For text that has semantic emphasis (not just visual italic)
   * Screen readers may announce this text with changed intonation
   * @returns {jsPDF} - Returns jsPDF instance for method chaining
   */
  jsPDFAPI.beginEmphasis = function() {
    return this.beginStructureElement('Em');
  };

  /**
   * End an Em text section
   * Convenience method for doc.endStructureElement()
   * @returns {jsPDF} - Returns jsPDF instance for method chaining
   */
  jsPDFAPI.endEmphasis = function() {
    return this.endStructureElement();
  };

  /**
   * Begin a Span (generic inline container) element
   * Used for formatting changes without semantic meaning,
   * or for language changes within a paragraph.
   *
   * Unlike Strong/Em, Span has no inherent semantic significance.
   * Use it for:
   * - Visual formatting (color, size changes)
   * - Language changes within text
   * - Grouping inline content
   *
   * @param {Object} [options] - Optional attributes
   * @param {string} [options.lang] - Language code (e.g., 'en-US', 'de-DE') for text within span
   * @returns {jsPDF} - Returns jsPDF instance for method chaining
   */
  jsPDFAPI.beginSpan = function(options) {
    options = options || {};
    var attributes = {};

    // If language is specified, store it for BDC operator
    if (options.lang) {
      attributes.lang = options.lang;
    }

    return this.beginStructureElement('Span', attributes);
  };

  /**
   * End a Span element
   * Convenience method for doc.endStructureElement()
   * @returns {jsPDF} - Returns jsPDF instance for method chaining
   */
  jsPDFAPI.endSpan = function() {
    return this.endStructureElement();
  };

  /**
   * Begin a Quote (inline quotation) element
   * For short quotes within a paragraph, attributed to another author.
   * Corresponds to HTML <q> element.
   *
   * Use Quote for:
   * - Short quotations within flowing text
   * - Inline citations
   *
   * @param {Object} [options] - Optional attributes
   * @param {string} [options.lang] - Language code (e.g., 'en-US', 'de-DE') for quoted text
   * @returns {jsPDF} - Returns jsPDF instance for method chaining
   */
  jsPDFAPI.beginQuote = function(options) {
    options = options || {};
    var attributes = {};

    // If language is specified, store it for BDC operator
    if (options.lang) {
      attributes.lang = options.lang;
    }

    return this.beginStructureElement('Quote', attributes);
  };

  /**
   * End a Quote element
   * Convenience method for doc.endStructureElement()
   * @returns {jsPDF} - Returns jsPDF instance for method chaining
   */
  jsPDFAPI.endQuote = function() {
    return this.endStructureElement();
  };

  /**
   * Begin a BlockQuote (block-level quotation) element
   * For longer quotes that stand as separate paragraphs.
   * Corresponds to HTML <blockquote> element.
   *
   * Use BlockQuote for:
   * - Longer quotations that are visually set apart
   * - Multi-paragraph quotes
   * - Block-level citations
   *
   * BlockQuote can contain P, L (lists), and other block-level elements.
   *
   * @param {Object} [options] - Optional attributes
   * @param {string} [options.lang] - Language code (e.g., 'en-US', 'de-DE') for quoted text
   * @returns {jsPDF} - Returns jsPDF instance for method chaining
   */
  jsPDFAPI.beginBlockQuote = function(options) {
    options = options || {};
    var attributes = {};

    // If language is specified, store it for BDC operator
    if (options.lang) {
      attributes.lang = options.lang;
    }

    return this.beginStructureElement('BlockQuote', attributes);
  };

  /**
   * End a BlockQuote element
   * Convenience method for doc.endStructureElement()
   * @returns {jsPDF} - Returns jsPDF instance for method chaining
   */
  jsPDFAPI.endBlockQuote = function() {
    return this.endStructureElement();
  };

  /**
   * Add a link annotation reference (OBJR) to the current Link structure element
   * This connects the Link structure element to the actual Link annotation
   * Required for PDF/UA accessibility
   * @param {number} annotationInternalId - Internal ID of the link annotation (from link())
   * @returns {jsPDF} - Returns jsPDF instance for method chaining
   */
  jsPDFAPI.addLinkAnnotationRef = function(annotationInternalId) {
    if (!this.internal.structureTree || !this.internal.structureTree.currentParent) {
      return this;
    }

    var currentElem = this.internal.structureTree.currentParent;

    // Only add to Link elements
    if (currentElem.type !== 'Link') {
      console.warn('addLinkAnnotationRef called outside of Link element');
      return this;
    }

    // Store the internal ID - the actual object ID will be resolved later
    // during writeStructTree when pdfuaLinkIdMap is available
    if (!currentElem.annotationInternalIds) {
      currentElem.annotationInternalIds = [];
    }
    currentElem.annotationInternalIds.push(annotationInternalId);

    return this;
  };

})(jsPDF.API);

export default jsPDF;
