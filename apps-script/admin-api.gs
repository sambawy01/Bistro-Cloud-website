/**
 * Bistro Cloud CRM + Admin API — Google Apps Script
 *
 * EXISTING: Handles form submissions from bistro-cloud.com
 *           Processes catering inquiries, orders, and contact forms
 *           Sends confirmation emails to customers
 *
 * NEW:      Admin panel CRUD via JSONP for menu/products/orders management
 *           Password-protected admin actions
 *
 * Deploy as: Web App → Execute as: Me → Access: Anyone
 */

// ============ CONFIGURATION ============
const SPREADSHEET_ID = '1bEt7BVbWfQzlt8t1qh92FxX0e7M-R-_EPvMdU8wJv5M';
const PEOPLE_SHEET = 'People';
const OPPORTUNITIES_SHEET = 'Opportunities';
const NOTIFICATION_EMAIL = 'bistrocloud3@gmail.com';
// Role-based passwords
function getRole(pw) {
  if (pw === 'Bistro001') return 'admin';
  if (pw === 'Bistro2026!') return 'chef';
  if (pw === 'BC2026!') return 'accounting';
  return null;
}
// ========================================

function doPost(e) {
  try {
    let payload;

    // Handle form-encoded data (from hidden form submission)
    if (e.parameter && e.parameter.payload) {
      payload = JSON.parse(e.parameter.payload);
    }
    // Handle text/plain body (legacy fetch approach)
    else if (e.postData && e.postData.contents) {
      payload = JSON.parse(e.postData.contents);
    }
    else {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        error: 'No data received'
      })).setMimeType(ContentService.MimeType.JSON);
    }

    const formType = payload.formType;
    const data = payload.data;
    const timestamp = payload.timestamp || new Date().toISOString();

    if (formType === 'catering_inquiry') {
      addCateringInquiry(data, timestamp);
      sendCateringConfirmationEmail(data);
      sendInternalNotification(data, formType);
    } else if (formType === 'contact') {
      addContactSubmission(data, timestamp);
      sendInternalNotification(data, formType);
    } else if (formType === 'order') {
      addOrderSubmission(data, timestamp);
      sendInternalNotification(data, formType);
    }

    return ContentService.createTextOutput(JSON.stringify({
      success: true
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    Logger.log('Error in doPost: ' + error.toString());
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  var params = e.parameter || {};
  var callback = params.callback || '';
  var action = params.action || '';
  var password = params.password || '';
  var sheetName = params.sheet || 'Menu';

  // ── Legacy CRM: no action param, just a payload → process form submission ──
  if (!action && params.payload) {
    return doPost(e);
  }

  // ── Health check (no action, no payload) ──
  if (!action) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'ok',
      message: 'Bistro Cloud CRM + Admin API is running'
    })).setMimeType(ContentService.MimeType.JSON);
  }

  // ── Admin actions: all require valid role password ──
  var role = getRole(password);
  if (!role) {
    return jsonpResponse(callback, { success: false, error: 'Unauthorized' });
  }

  try {
    switch (action) {
      // ── Read actions ──
      case 'verify':
        return jsonpResponse(callback, { success: true, role: role });
      case 'getMenu':
        return jsonpResponse(callback, adminGetMenu());
      case 'getPantry':
        return jsonpResponse(callback, adminGetPantry());
      case 'getOrders':
        return jsonpResponse(callback, adminGetOrders());
      // ── Write actions (all via GET to avoid 302 redirect issues with POST) ──
      case 'addItem':
        return jsonpResponse(callback, adminAddItem(params.item));
      case 'editItem':
        return jsonpResponse(callback, adminEditItem(parseInt(params.rowIndex), params.item));
      case 'deleteItem':
        return jsonpResponse(callback, adminDeleteItem(parseInt(params.rowIndex)));
      case 'toggleVisibility':
        return jsonpResponse(callback, adminToggleVisibility(parseInt(params.rowIndex), params.status));
      case 'addPantryItem':
        return jsonpResponse(callback, adminAddPantryItem(params.item));
      case 'editPantryItem':
        return jsonpResponse(callback, adminEditPantryItem(parseInt(params.rowIndex), params.item));
      case 'deletePantryItem':
        return jsonpResponse(callback, adminDeletePantryItem(parseInt(params.rowIndex)));
      case 'togglePantryVisibility':
        return jsonpResponse(callback, adminTogglePantryVisibility(parseInt(params.rowIndex), params.status));
      case 'archiveOrder':
        return jsonpResponse(callback, adminArchiveOrder(parseInt(params.rowIndex)));
      // ── Inventory (Stock) CRUD ──
      case 'getStock':
        return jsonpResponse(callback, inventoryGetAll());
      case 'addStockItem':
        return jsonpResponse(callback, inventoryAdd(params.item));
      case 'editStockItem':
        return jsonpResponse(callback, inventoryEdit(parseInt(params.rowIndex), params.item));
      case 'deleteStockItem':
        return jsonpResponse(callback, inventoryDelete(parseInt(params.rowIndex)));
      // ── Recipe CRUD ──
      case 'getRecipes':
        return jsonpResponse(callback, recipeGetAll());
      case 'addRecipe':
        return jsonpResponse(callback, recipeAdd(params.item));
      case 'editRecipe':
        return jsonpResponse(callback, recipeEdit(parseInt(params.rowIndex), params.item));
      case 'deleteRecipe':
        return jsonpResponse(callback, recipeDelete(parseInt(params.rowIndex)));
      // ── Requisitions ──
      case 'getRequisitions':
        return jsonpResponse(callback, requisitionGetAll());
      case 'addRequisition':
        return jsonpResponse(callback, requisitionAdd(params.item));
      case 'editRequisition':
        return jsonpResponse(callback, requisitionEdit(parseInt(params.rowIndex), params.item));
      case 'deleteRequisition':
        return jsonpResponse(callback, requisitionDelete(parseInt(params.rowIndex)));
      case 'approveRequisition':
        return jsonpResponse(callback, requisitionApprove(parseInt(params.rowIndex)));
      case 'rejectRequisition':
        return jsonpResponse(callback, requisitionReject(parseInt(params.rowIndex)));
      case 'outOfStockRequisition':
        return jsonpResponse(callback, requisitionOutOfStock(parseInt(params.rowIndex)));
      default:
        return jsonpResponse(callback, { success: false, error: 'Unknown action: ' + action });
    }
  } catch (err) {
    return jsonpResponse(callback, { success: false, error: err.message });
  }
}

// ============ JSONP HELPER ============

function jsonpResponse(callback, data) {
  var json = JSON.stringify(data);
  if (callback) {
    return ContentService.createTextOutput(callback + '(' + json + ')')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService.createTextOutput(json)
    .setMimeType(ContentService.MimeType.JSON);
}

// ============ ADMIN CRUD ============
// Menu sheet ID (separate from CRM sheet)
const MENU_SHEET_ID = '1kCS-s-Iq0d8xHd7xm0yC59l8ZDt8_gOnHgNEx0oWVcE';
const PANTRY_SHEET_ID = '1mgee-wfP0v8CRD-8c3B9JUQyFAWdkovLjxkxW_Nl0QQ';

function adminGetMenuSheet() {
  var ss = SpreadsheetApp.openById(MENU_SHEET_ID);
  var sheet = ss.getSheetByName('Menu');
  if (!sheet) sheet = ss.getSheets()[0]; // fallback to first sheet
  return sheet;
}

function adminGetHeaders(sheet) {
  var lastCol = sheet.getLastColumn();
  if (lastCol === 0) return [];
  return sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(function(h) {
    return String(h).toLowerCase().trim();
  });
}

function adminGetMenu() {
  var sheet = adminGetMenuSheet();
  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  if (lastRow < 2 || lastCol === 0) return { success: true, items: [] };

  var headers = adminGetHeaders(sheet);
  var dataRange = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
  var items = [];

  for (var i = 0; i < dataRange.length; i++) {
    var row = dataRange[i];
    if (row.every(function(cell) { return String(cell).trim() === ''; })) continue;

    var item = { _rowIndex: i + 2 };
    for (var j = 0; j < headers.length; j++) {
      var val = row[j];
      // Keep numbers as numbers for id and price
      if (headers[j] === 'id' || headers[j] === 'price') {
        item[headers[j]] = val === '' ? '' : (isNaN(Number(val)) ? val : Number(val));
      } else {
        item[headers[j]] = val !== undefined ? String(val) : '';
      }
    }
    items.push(item);
  }

  return { success: true, items: items };
}

function adminGetOrders() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName(PEOPLE_SHEET);
  if (!sheet) return { success: true, orders: [] };

  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  if (lastRow < 2 || lastCol === 0) return { success: true, orders: [] };

  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  var dataRange = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
  var orders = [];

  for (var i = 0; i < dataRange.length; i++) {
    var row = dataRange[i];
    if (row.every(function(cell) { return String(cell).trim() === ''; })) continue;

    var order = { _rowIndex: i + 2 };
    for (var j = 0; j < headers.length; j++) {
      order[String(headers[j])] = row[j] !== undefined ? String(row[j]) : '';
    }
    orders.push(order);
  }

  return { success: true, orders: orders };
}

function adminAddItem(itemStr) {
  var sheet = adminGetMenuSheet();
  var headers = adminGetHeaders(sheet);
  var item = JSON.parse(itemStr);

  if (!item.id) {
    item.id = Date.now();
  }

  var newRow = headers.map(function(h) {
    return item[h] !== undefined ? item[h] : '';
  });

  sheet.appendRow(newRow);
  return { success: true };
}

function adminEditItem(rowIndex, itemStr) {
  var sheet = adminGetMenuSheet();
  var headers = adminGetHeaders(sheet);
  var item = JSON.parse(itemStr);

  if (rowIndex < 2 || rowIndex > sheet.getLastRow()) {
    throw new Error('Invalid row: ' + rowIndex);
  }

  for (var j = 0; j < headers.length; j++) {
    var h = headers[j];
    if (h === 'id') continue; // don't overwrite ID
    if (item.hasOwnProperty(h)) {
      sheet.getRange(rowIndex, j + 1).setValue(item[h]);
    }
  }

  return { success: true };
}

function adminDeleteItem(rowIndex) {
  var sheet = adminGetMenuSheet();

  if (rowIndex < 2 || rowIndex > sheet.getLastRow()) {
    throw new Error('Invalid row: ' + rowIndex);
  }

  sheet.deleteRow(rowIndex);
  return { success: true };
}

function adminToggleVisibility(rowIndex, newStatus) {
  var sheet = adminGetMenuSheet();
  var headers = adminGetHeaders(sheet);
  var statusCol = headers.indexOf('status');

  if (statusCol < 0) throw new Error('Status column not found');
  if (rowIndex < 2 || rowIndex > sheet.getLastRow()) {
    throw new Error('Invalid row: ' + rowIndex);
  }

  sheet.getRange(rowIndex, statusCol + 1).setValue(newStatus);
  return { success: true };
}

function adminArchiveOrder(rowIndex) {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sourceSheet = ss.getSheetByName(PEOPLE_SHEET);
  if (!sourceSheet) throw new Error('People sheet not found');

  var archiveSheet = ss.getSheetByName('Archive');
  if (!archiveSheet) {
    archiveSheet = ss.insertSheet('Archive');
    var headers = sourceSheet.getRange(1, 1, 1, sourceSheet.getLastColumn()).getValues();
    archiveSheet.getRange(1, 1, 1, headers[0].length).setValues(headers);
  }

  if (rowIndex < 2 || rowIndex > sourceSheet.getLastRow()) {
    throw new Error('Invalid row: ' + rowIndex);
  }

  var rowData = sourceSheet.getRange(rowIndex, 1, 1, sourceSheet.getLastColumn()).getValues();
  archiveSheet.appendRow(rowData[0]);
  sourceSheet.deleteRow(rowIndex);

  return { success: true };
}

// ============ PANTRY CRUD ============

function adminGetPantrySheet() {
  var ss = SpreadsheetApp.openById(PANTRY_SHEET_ID);
  var sheet = ss.getSheetByName('Products') || ss.getSheets()[0];
  return sheet;
}

function adminGetPantry() {
  var sheet = adminGetPantrySheet();
  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  if (lastRow < 2 || lastCol === 0) return { success: true, items: [] };

  var headers = adminGetHeaders(sheet);
  var dataRange = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
  var items = [];

  for (var i = 0; i < dataRange.length; i++) {
    var row = dataRange[i];
    if (row.every(function(cell) { return String(cell).trim() === ''; })) continue;

    var item = { _rowIndex: i + 2 };
    for (var j = 0; j < headers.length; j++) {
      var val = row[j];
      if (headers[j] === 'id' || headers[j] === 'price') {
        item[headers[j]] = val === '' ? '' : (isNaN(Number(val)) ? val : Number(val));
      } else {
        item[headers[j]] = val !== undefined ? String(val) : '';
      }
    }
    items.push(item);
  }

  return { success: true, items: items };
}

function adminAddPantryItem(itemStr) {
  var sheet = adminGetPantrySheet();
  var headers = adminGetHeaders(sheet);
  var item = JSON.parse(itemStr);
  if (!item.id) item.id = Date.now();
  var newRow = headers.map(function(h) { return item[h] !== undefined ? item[h] : ''; });
  sheet.appendRow(newRow);
  return { success: true };
}

function adminEditPantryItem(rowIndex, itemStr) {
  var sheet = adminGetPantrySheet();
  var headers = adminGetHeaders(sheet);
  var item = JSON.parse(itemStr);
  if (rowIndex < 2 || rowIndex > sheet.getLastRow()) throw new Error('Invalid row: ' + rowIndex);
  for (var j = 0; j < headers.length; j++) {
    var h = headers[j];
    if (h === 'id') continue;
    if (item.hasOwnProperty(h)) sheet.getRange(rowIndex, j + 1).setValue(item[h]);
  }
  return { success: true };
}

function adminDeletePantryItem(rowIndex) {
  var sheet = adminGetPantrySheet();
  if (rowIndex < 2 || rowIndex > sheet.getLastRow()) throw new Error('Invalid row: ' + rowIndex);
  sheet.deleteRow(rowIndex);
  return { success: true };
}

function adminTogglePantryVisibility(rowIndex, newStatus) {
  var sheet = adminGetPantrySheet();
  var headers = adminGetHeaders(sheet);
  var statusCol = headers.indexOf('status');
  if (statusCol < 0) throw new Error('Status column not found');
  if (rowIndex < 2 || rowIndex > sheet.getLastRow()) throw new Error('Invalid row: ' + rowIndex);
  sheet.getRange(rowIndex, statusCol + 1).setValue(newStatus);
  return { success: true };
}

// ============ CRM DATA STORAGE ============

function addCateringInquiry(data, timestamp) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(PEOPLE_SHEET);
  if (!sheet) { Logger.log('People sheet not found'); return; }

  const notes = [
    'Event: ' + (data.eventType || ''),
    'Guests: ' + (data.guestCount || ''),
    'Date: ' + (data.eventDate || ''),
    'Location: ' + (data.location || ''),
    'Menu: ' + (data.menuPreferences || ''),
    'Submitted: ' + timestamp
  ].join(' | ');

  sheet.appendRow([
    'inquiry',
    data.name || '',
    data.company || '',
    data.phone || '',
    data.email || '',
    'Catering Inquiry',
    'B2B Catering Client',
    data.phone || '',
    data.location || '',
    '',
    notes
  ]);

  var oppSheet = ss.getSheetByName(OPPORTUNITIES_SHEET);
  if (!oppSheet) {
    Logger.log('Opportunities sheet not found!');
    return;
  }

  var dealName = (data.eventType || 'Catering') + ' - ' + (data.name || 'Unknown');

  oppSheet.appendRow([
    'catering',
    dealName,
    data.company || '',
    'Inquiry',
    '',
    data.eventDate || '',
    data.guestCount || '',
    'Open',
    data.location || '',
    data.name || '',
    data.email || '',
    notes
  ]);
}

function addContactSubmission(data, timestamp) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(PEOPLE_SHEET);
  if (!sheet) return;

  sheet.appendRow([
    'contact',
    data.name || '',
    '',
    data.phone || '',
    data.email || '',
    'Website Contact',
    'B2C Customer',
    data.phone || '',
    '',
    '',
    'Message: ' + (data.message || '') + ' | Submitted: ' + timestamp
  ]);
}

function addOrderSubmission(data, timestamp) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(PEOPLE_SHEET);
  if (!sheet) return;

  sheet.appendRow([
    'order',
    data.name || '',
    '',
    data.phone || '',
    '',
    'Online Order',
    'B2C Customer',
    data.phone || '',
    data.deliveryArea || '',
    data.address || '',
    'Order Total: ' + (data.orderTotal || '') + ' | ' + (data.orderSummary || '') + ' | Submitted: ' + timestamp
  ]);

  var oppSheet = ss.getSheetByName(OPPORTUNITIES_SHEET);
  if (oppSheet) {
    oppSheet.appendRow([
      'order',
      'Order - ' + (data.name || 'Unknown'),
      '',
      'Won',
      data.orderTotal || '',
      new Date().toISOString().split('T')[0],
      '1',
      'Completed',
      data.deliveryArea || data.address || '',
      data.name || '',
      '',
      'Order: ' + (data.orderSummary || '') + ' | Submitted: ' + timestamp
    ]);
  }
}

// ============ EMAIL NOTIFICATIONS ============

function sendCateringConfirmationEmail(data) {
  try {
    if (!data.email) return;

    const subject = 'Bistro Cloud - We received your catering request!';

    const htmlBody = '<div style="font-family: Helvetica Neue, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #F9F5F0; padding: 0;">' +
      '<div style="background: #2C3E50; padding: 30px; text-align: center;">' +
        '<h1 style="color: white; margin: 0; font-size: 24px;">Bistro Cloud</h1>' +
        '<p style="color: #bdc3c7; margin: 5px 0 0; font-size: 14px;">Fresh. Natural. Delivered Daily.</p>' +
      '</div>' +
      '<div style="padding: 30px; background: white;">' +
        '<h2 style="color: #2C3E50; margin-top: 0;">Thank you, ' + (data.name || 'there') + '!</h2>' +
        '<p style="color: #555; line-height: 1.6;">We have received your catering inquiry and our team is already working on crafting the perfect menu for your event. We will get back to you within <strong>24 hours</strong> with a detailed proposal.</p>' +
        '<div style="background: #F9F5F0; border-radius: 12px; padding: 20px; margin: 20px 0;">' +
          '<h3 style="color: #2C3E50; margin-top: 0; font-size: 16px;">Your Request Details:</h3>' +
          '<table style="width: 100%; border-collapse: collapse; font-size: 14px;">' +
            '<tr><td style="padding: 8px 0; color: #888; width: 140px;">Event Type</td><td style="padding: 8px 0; color: #333; font-weight: 500;">' + (data.eventType || '-') + '</td></tr>' +
            '<tr><td style="padding: 8px 0; color: #888;">Guests</td><td style="padding: 8px 0; color: #333; font-weight: 500;">' + (data.guestCount || '-') + '</td></tr>' +
            '<tr><td style="padding: 8px 0; color: #888;">Event Date</td><td style="padding: 8px 0; color: #333; font-weight: 500;">' + (data.eventDate || '-') + '</td></tr>' +
            '<tr><td style="padding: 8px 0; color: #888;">Location</td><td style="padding: 8px 0; color: #333; font-weight: 500;">' + (data.location || '-') + '</td></tr>' +
            (data.company ? '<tr><td style="padding: 8px 0; color: #888;">Company</td><td style="padding: 8px 0; color: #333; font-weight: 500;">' + data.company + '</td></tr>' : '') +
            (data.menuPreferences ? '<tr><td style="padding: 8px 0; color: #888;">Preferences</td><td style="padding: 8px 0; color: #333; font-weight: 500;">' + data.menuPreferences + '</td></tr>' : '') +
          '</table>' +
        '</div>' +
        '<p style="color: #555; line-height: 1.6;">In the meantime, feel free to reach out to us directly:</p>' +
        '<div style="text-align: center; margin: 25px 0;">' +
          '<a href="https://wa.me/201221288839" style="display: inline-block; background: #D94E28; color: white; padding: 12px 30px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 15px;">Chat on WhatsApp</a>' +
        '</div>' +
      '</div>' +
      '<div style="padding: 20px 30px; text-align: center; border-top: 1px solid #eee;">' +
        '<p style="color: #999; font-size: 12px; margin: 0;">Bistro Cloud El Gouna - 100% Natural Ingredients - Free Delivery<br>' +
          '<a href="https://bistro-cloud.com" style="color: #D94E28; text-decoration: none;">bistro-cloud.com</a> - ' +
          '<a href="tel:+201221288839" style="color: #D94E28; text-decoration: none;">+20 122 128 8839</a>' +
        '</p>' +
      '</div>' +
    '</div>';

    MailApp.sendEmail({
      to: data.email,
      subject: subject,
      htmlBody: htmlBody,
      name: 'Bistro Cloud El Gouna',
      replyTo: 'bistrocloud3@gmail.com'
    });

    Logger.log('Confirmation email sent to: ' + data.email);
  } catch (error) {
    Logger.log('Error sending confirmation email: ' + error.toString());
  }
}

function sendInternalNotification(data, formType) {
  try {
    const typeLabel = {
      'catering_inquiry': 'New Catering Inquiry',
      'contact': 'New Contact Form Submission',
      'order': 'New Online Order'
    }[formType] || 'New Form Submission';

    const subject = typeLabel + ' - ' + (data.name || 'Unknown');

    var details = '';
    for (var key in data) {
      if (data[key]) {
        details += '<tr><td style="padding: 5px 10px; color: #888; font-size: 13px;">' + key + '</td><td style="padding: 5px 10px; color: #333; font-size: 13px;">' + data[key] + '</td></tr>';
      }
    }

    const htmlBody = '<div style="font-family: Arial, sans-serif; max-width: 500px;">' +
      '<h2 style="color: #D94E28; margin-bottom: 5px;">' + typeLabel + '</h2>' +
      '<p style="color: #888; margin-top: 0;">From bistro-cloud.com at ' + new Date().toLocaleString('en-EG', { timeZone: 'Africa/Cairo' }) + '</p>' +
      '<table style="width: 100%; border-collapse: collapse; background: #f9f9f9; border-radius: 8px;">' + details + '</table>' +
      '<p style="margin-top: 15px;"><a href="https://docs.google.com/spreadsheets/d/' + SPREADSHEET_ID + '" style="color: #D94E28;">Open CRM Sheet</a></p>' +
    '</div>';

    MailApp.sendEmail({
      to: NOTIFICATION_EMAIL,
      subject: subject,
      htmlBody: htmlBody,
      name: 'Bistro Cloud Website'
    });
  } catch (error) {
    Logger.log('Error sending internal notification: ' + error.toString());
  }
}

// ============ INVENTORY SYSTEM ============
// Sheet ID — user creates a Google Sheet called "Bistro Inventory"
// with tabs: Stock, Recipes, Requisitions and pastes this ID below.
var INVENTORY_SHEET_ID = '1PCTv4q_Gex7a6H9TQAShEN9JnJmJpypuAWatPGemhVA';

function invGetSheet(tabName) {
  var ss = SpreadsheetApp.openById(INVENTORY_SHEET_ID);
  var sheet = ss.getSheetByName(tabName);
  if (!sheet) throw new Error('Tab "' + tabName + '" not found in Bistro Inventory sheet');
  return sheet;
}

function invReadRows(tabName) {
  var sheet = invGetSheet(tabName);
  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  if (lastRow < 2 || lastCol === 0) return { sheet: sheet, headers: [], rows: [] };
  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(function(h) {
    return String(h).trim().toLowerCase().replace(/ /g, '_');
  });
  var data = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
  var items = [];
  for (var i = 0; i < data.length; i++) {
    var row = data[i];
    if (row.every(function(c) { return String(c).trim() === ''; })) continue;
    var item = { _rowIndex: i + 2 };
    for (var j = 0; j < headers.length; j++) {
      var val = row[j];
      var h = headers[j];
      if (h === 'id' || h === 'qty_on_hand' || h === 'min_level' || h === 'cost_per_unit' || h === 'qty_needed' || h === 'quantity') {
        item[h] = val === '' ? 0 : (isNaN(Number(val)) ? val : Number(val));
      } else {
        item[h] = val !== undefined ? String(val) : '';
      }
    }
    items.push(item);
  }
  return { sheet: sheet, headers: headers, rows: items };
}

// ── Inventory CRUD ──

function inventoryGetAll() {
  var result = invReadRows('Stock');
  return { success: true, items: result.rows };
}

function inventoryAdd(itemStr) {
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var sheet = invGetSheet('Stock');
    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(function(h) {
      return String(h).trim().toLowerCase().replace(/ /g, '_');
    });
    var item = JSON.parse(itemStr);
    if (!item.id) item.id = Date.now();
    item.last_restocked = new Date().toISOString().split('T')[0];
    var newRow = headers.map(function(h) { return item[h] !== undefined ? item[h] : ''; });
    sheet.appendRow(newRow);
    return { success: true };
  } finally {
    lock.releaseLock();
  }
}

function inventoryEdit(rowIndex, itemStr) {
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var sheet = invGetSheet('Stock');
    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(function(h) {
      return String(h).trim().toLowerCase().replace(/ /g, '_');
    });
    var item = JSON.parse(itemStr);
    if (rowIndex < 2 || rowIndex > sheet.getLastRow()) throw new Error('Invalid row: ' + rowIndex);
    for (var j = 0; j < headers.length; j++) {
      var h = headers[j];
      if (h === 'id') continue;
      if (item.hasOwnProperty(h)) sheet.getRange(rowIndex, j + 1).setValue(item[h]);
    }
    return { success: true };
  } finally {
    lock.releaseLock();
  }
}

function inventoryDelete(rowIndex) {
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var sheet = invGetSheet('Stock');
    if (rowIndex < 2 || rowIndex > sheet.getLastRow()) throw new Error('Invalid row: ' + rowIndex);
    sheet.deleteRow(rowIndex);
    return { success: true };
  } finally {
    lock.releaseLock();
  }
}

// ── Recipe CRUD ──

function recipeGetAll() {
  var result = invReadRows('Recipes');
  return { success: true, items: result.rows };
}

function recipeAdd(itemStr) {
  var sheet = invGetSheet('Recipes');
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(function(h) {
    return String(h).trim().toLowerCase().replace(/ /g, '_');
  });
  var item = JSON.parse(itemStr);
  if (!item.id) item.id = Date.now();
  var newRow = headers.map(function(h) { return item[h] !== undefined ? item[h] : ''; });
  sheet.appendRow(newRow);
  return { success: true };
}

function recipeEdit(rowIndex, itemStr) {
  var sheet = invGetSheet('Recipes');
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(function(h) {
    return String(h).trim().toLowerCase().replace(/ /g, '_');
  });
  var item = JSON.parse(itemStr);
  if (rowIndex < 2 || rowIndex > sheet.getLastRow()) throw new Error('Invalid row: ' + rowIndex);
  for (var j = 0; j < headers.length; j++) {
    var h = headers[j];
    if (h === 'id') continue;
    if (item.hasOwnProperty(h)) sheet.getRange(rowIndex, j + 1).setValue(item[h]);
  }
  return { success: true };
}

function recipeDelete(rowIndex) {
  var sheet = invGetSheet('Recipes');
  if (rowIndex < 2 || rowIndex > sheet.getLastRow()) throw new Error('Invalid row: ' + rowIndex);
  sheet.deleteRow(rowIndex);
  return { success: true };
}

// ── Requisitions CRUD ──

function requisitionGetAll() {
  var result = invReadRows('Requisitions');
  // Return newest first
  result.rows.reverse();
  return { success: true, items: result.rows };
}

function requisitionAdd(itemStr) {
  var sheet = invGetSheet('Requisitions');
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(function(h) {
    return String(h).trim().toLowerCase().replace(/ /g, '_');
  });
  var item = JSON.parse(itemStr);
  var newRow = headers.map(function(h) { return item[h] !== undefined ? item[h] : ''; });
  sheet.appendRow(newRow);
  return { success: true };
}

function requisitionEdit(rowIndex, itemStr) {
  var sheet = invGetSheet('Requisitions');
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(function(h) {
    return String(h).trim().toLowerCase().replace(/ /g, '_');
  });
  var item = JSON.parse(itemStr);
  if (rowIndex < 2 || rowIndex > sheet.getLastRow()) throw new Error('Invalid row: ' + rowIndex);
  for (var j = 0; j < headers.length; j++) {
    var h = headers[j];
    if (item.hasOwnProperty(h)) sheet.getRange(rowIndex, j + 1).setValue(item[h]);
  }
  return { success: true };
}

function requisitionDelete(rowIndex) {
  var sheet = invGetSheet('Requisitions');
  if (rowIndex < 2 || rowIndex > sheet.getLastRow()) throw new Error('Invalid row: ' + rowIndex);
  sheet.deleteRow(rowIndex);
  return { success: true };
}

/**
 * Approve a pending requisition: deduct from stock + set status to Approved.
 */
function requisitionApprove(rowIndex) {
  var lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    var reqSheet = invGetSheet('Requisitions');
    var reqHeaders = reqSheet.getRange(1, 1, 1, reqSheet.getLastColumn()).getValues()[0].map(function(h) {
      return String(h).trim().toLowerCase().replace(/ /g, '_');
    });
    if (rowIndex < 2 || rowIndex > reqSheet.getLastRow()) throw new Error('Invalid row: ' + rowIndex);

    var statusCol = reqHeaders.indexOf('status');
    var itemNameCol = reqHeaders.indexOf('item_name');
    var qtyCol = reqHeaders.indexOf('quantity');
    var dirCol = reqHeaders.indexOf('direction');
    if (statusCol < 0 || itemNameCol < 0 || qtyCol < 0) throw new Error('Required columns not found in Requisitions tab');

    // Check it's still pending
    var currentStatus = String(reqSheet.getRange(rowIndex, statusCol + 1).getValue()).trim();
    if (currentStatus !== 'Pending') throw new Error('Requisition is not Pending (status: ' + currentStatus + ')');

    var itemName = String(reqSheet.getRange(rowIndex, itemNameCol + 1).getValue());
    var quantity = Number(reqSheet.getRange(rowIndex, qtyCol + 1).getValue()) || 0;
    var direction = String(reqSheet.getRange(rowIndex, dirCol + 1).getValue()).trim();

    // Deduct from stock (only for OUT direction)
    if (direction === 'OUT' && quantity > 0) {
      var stockSheet = invGetSheet('Stock');
      var stockHeaders = stockSheet.getRange(1, 1, 1, stockSheet.getLastColumn()).getValues()[0].map(function(h) {
        return String(h).trim().toLowerCase().replace(/ /g, '_');
      });
      var stockNameCol = stockHeaders.indexOf('name');
      var stockQtyCol = stockHeaders.indexOf('qty_on_hand');
      if (stockNameCol < 0 || stockQtyCol < 0) throw new Error('Required columns not found in Stock tab');

      var found = false;
      var lastRow = stockSheet.getLastRow();
      for (var r = 2; r <= lastRow; r++) {
        var stockName = String(stockSheet.getRange(r, stockNameCol + 1).getValue());
        if (stockName.toLowerCase() === itemName.toLowerCase()) {
          var currentQty = Number(stockSheet.getRange(r, stockQtyCol + 1).getValue()) || 0;
          var newQty = Math.max(0, currentQty - quantity);
          stockSheet.getRange(r, stockQtyCol + 1).setValue(newQty);
          found = true;
          break;
        }
      }
      if (!found) {
        // Still approve but note the item wasn't found
        reqSheet.getRange(rowIndex, statusCol + 1).setValue('Approved');
        return { success: true, warning: 'Stock item "' + itemName + '" not found — approved without deduction' };
      }
    }

    reqSheet.getRange(rowIndex, statusCol + 1).setValue('Approved');
    return { success: true };
  } finally {
    lock.releaseLock();
  }
}

/**
 * Reject a pending requisition: set status to Rejected, no stock change.
 */
function requisitionReject(rowIndex) {
  var reqSheet = invGetSheet('Requisitions');
  var reqHeaders = reqSheet.getRange(1, 1, 1, reqSheet.getLastColumn()).getValues()[0].map(function(h) {
    return String(h).trim().toLowerCase().replace(/ /g, '_');
  });
  if (rowIndex < 2 || rowIndex > reqSheet.getLastRow()) throw new Error('Invalid row: ' + rowIndex);

  var statusCol = reqHeaders.indexOf('status');
  if (statusCol < 0) throw new Error('Status column not found');

  reqSheet.getRange(rowIndex, statusCol + 1).setValue('Rejected');
  return { success: true };
}

function requisitionOutOfStock(rowIndex) {
  var reqSheet = invGetSheet('Requisitions');
  var reqHeaders = reqSheet.getRange(1, 1, 1, reqSheet.getLastColumn()).getValues()[0].map(function(h) {
    return String(h).trim().toLowerCase().replace(/ /g, '_');
  });
  if (rowIndex < 2 || rowIndex > reqSheet.getLastRow()) throw new Error('Invalid row: ' + rowIndex);

  var statusCol = reqHeaders.indexOf('status');
  if (statusCol < 0) throw new Error('Status column not found');

  reqSheet.getRange(rowIndex, statusCol + 1).setValue('Out of Stock');
  return { success: true };
}

// ============ TEST FUNCTION ============
function testWrite() {
  addCateringInquiry({
    name: 'Apps Script Test',
    company: 'Test Co',
    email: 'test@test.com',
    phone: '+20123456789',
    eventType: 'Wedding',
    guestCount: '50',
    eventDate: '2026-05-01',
    location: 'El Gouna Marina',
    menuPreferences: 'Mediterranean seafood'
  }, new Date().toISOString());
  Logger.log('Test row added to People sheet');
}
