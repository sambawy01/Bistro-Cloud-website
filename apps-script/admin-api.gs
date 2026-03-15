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
const ADMIN_PASSWORD = 'YOUR_PASSWORD_HERE'; // ← Change this!
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

  // ── Admin actions: all require password ──
  if (password !== ADMIN_PASSWORD) {
    return jsonpResponse(callback, { success: false, error: 'Unauthorized' });
  }

  try {
    switch (action) {
      case 'list':
        return jsonpResponse(callback, adminListRows(sheetName));
      case 'add':
        return jsonpResponse(callback, adminAddRow(sheetName, params.payload));
      case 'update':
        return jsonpResponse(callback, adminUpdateRow(sheetName, parseInt(params.row), params.payload));
      case 'delete':
        return jsonpResponse(callback, adminDeleteRow(sheetName, parseInt(params.row), params.id));
      case 'toggle':
        return jsonpResponse(callback, adminToggleField(sheetName, parseInt(params.row), params.field, params.value));
      case 'archive':
        return jsonpResponse(callback, adminArchiveRow(parseInt(params.row)));
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

function adminGetSheet(name) {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName(name);
  if (!sheet) throw new Error('Sheet not found: ' + name);
  return sheet;
}

function adminGetHeaders(sheet) {
  var lastCol = sheet.getLastColumn();
  if (lastCol === 0) return [];
  return sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(function(h) {
    return String(h).toLowerCase().trim();
  });
}

function adminListRows(sheetName) {
  var sheet = adminGetSheet(sheetName);
  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  if (lastRow < 2 || lastCol === 0) return { success: true, data: [] };

  var headers = adminGetHeaders(sheet);
  var dataRange = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
  var items = [];

  for (var i = 0; i < dataRange.length; i++) {
    var row = dataRange[i];
    if (row.every(function(cell) { return String(cell).trim() === ''; })) continue;

    var item = { row: i + 2 };
    for (var j = 0; j < headers.length; j++) {
      item[headers[j]] = row[j] !== undefined ? String(row[j]) : '';
    }
    items.push(item);
  }

  return { success: true, data: items };
}

function adminAddRow(sheetName, payloadStr) {
  var sheet = adminGetSheet(sheetName);
  var headers = adminGetHeaders(sheet);
  var payload = JSON.parse(payloadStr);

  if (!payload.id) {
    payload.id = sheetName.charAt(0).toLowerCase() + Date.now();
  }

  var newRow = headers.map(function(h) {
    return payload[h] || '';
  });

  sheet.appendRow(newRow);
  return { success: true };
}

function adminUpdateRow(sheetName, rowNum, payloadStr) {
  var sheet = adminGetSheet(sheetName);
  var headers = adminGetHeaders(sheet);
  var payload = JSON.parse(payloadStr);

  if (rowNum < 2 || rowNum > sheet.getLastRow()) {
    throw new Error('Invalid row number: ' + rowNum);
  }

  for (var j = 0; j < headers.length; j++) {
    var h = headers[j];
    if (h === 'id') continue;
    if (payload.hasOwnProperty(h)) {
      sheet.getRange(rowNum, j + 1).setValue(payload[h]);
    }
  }

  return { success: true };
}

function adminDeleteRow(sheetName, rowNum, id) {
  var sheet = adminGetSheet(sheetName);

  if (rowNum < 2 || rowNum > sheet.getLastRow()) {
    throw new Error('Invalid row number: ' + rowNum);
  }

  var headers = adminGetHeaders(sheet);
  var idCol = headers.indexOf('id');
  if (idCol >= 0) {
    var actualId = String(sheet.getRange(rowNum, idCol + 1).getValue());
    if (id && actualId !== id) {
      throw new Error('Row ID mismatch. The data may have changed. Please refresh.');
    }
  }

  sheet.deleteRow(rowNum);
  return { success: true };
}

function adminToggleField(sheetName, rowNum, field, value) {
  var sheet = adminGetSheet(sheetName);
  var headers = adminGetHeaders(sheet);
  var colIndex = headers.indexOf(field.toLowerCase());

  if (colIndex < 0) throw new Error('Field not found: ' + field);
  if (rowNum < 2 || rowNum > sheet.getLastRow()) {
    throw new Error('Invalid row number: ' + rowNum);
  }

  sheet.getRange(rowNum, colIndex + 1).setValue(value);
  return { success: true };
}

function adminArchiveRow(rowNum) {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sourceSheet = ss.getSheetByName(OPPORTUNITIES_SHEET);
  if (!sourceSheet) throw new Error('Opportunities sheet not found');

  var archiveSheet = ss.getSheetByName('Archive');
  if (!archiveSheet) {
    archiveSheet = ss.insertSheet('Archive');
    var headers = sourceSheet.getRange(1, 1, 1, sourceSheet.getLastColumn()).getValues();
    archiveSheet.getRange(1, 1, 1, headers[0].length).setValues(headers);
  }

  if (rowNum < 2 || rowNum > sourceSheet.getLastRow()) {
    throw new Error('Invalid row number: ' + rowNum);
  }

  var rowData = sourceSheet.getRange(rowNum, 1, 1, sourceSheet.getLastColumn()).getValues();
  archiveSheet.appendRow(rowData[0]);
  sourceSheet.deleteRow(rowNum);

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
