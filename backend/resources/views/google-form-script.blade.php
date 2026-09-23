{{-- The Apps Script the organising team pastes into their Google Form. Served
     by the panel with the address and key already filled in, so nobody has to
     edit it. Keep it plain: the person pasting it is not a developer. --}}
/**
 * Connects this form to the Seri Negara Dialogue website, both ways:
 *   - registrations made on the website are added to its responses sheet, and
 *   - this form's responses are sent to the website's admin panel.
 *
 * Set up once:
 *   1. In this editor, click Save (the disk icon).
 *   2. Choose "setup" in the function list above, then click Run.
 *   3. Google asks for permission: Review permissions -> your account ->
 *      Advanced -> Go to ... (unsafe) -> Allow. It says "unsafe" only
 *      because the script is your own and not published by Google.
 *   4. The log says "Ready". Every response so far has been sent to the
 *      website, and each new one follows as it arrives.
 *   5. Choose "authorise" in the function list and click Run, allowing access
 *      to the responses sheet.
 *   6. Click Deploy -> New deployment -> the gear icon -> Web app.
 *      Execute as: Me. Who has access: Anyone. Click Deploy, allow again if
 *      asked, and copy the "Web app URL" it shows.
 *   7. Paste that URL into the website's admin: Registrations -> Google
 *      Form -> "Web app link", and click Save. From then on, registrations
 *      made on the website appear in this form's responses sheet.
 *
 * Updating this script later: paste, Save, run "authorise", then Deploy ->
 * Manage deployments -> the pencil -> Version: New version -> Deploy. The
 * web app keeps its link, so nothing changes on the website.
 *
 * If a response ever fails to send, Google emails the form's owner. Once the
 * cause is fixed, run "sendAll" to send everything again -- responses the
 * website already has are updated, never duplicated.
 *
 * The script reads this form's responses and sends them to the website, and
 * adds the website's registrations to the responses sheet. It changes nothing
 * on the form -- no questions, no settings.
 */

var WEBSITE = '{{ $endpoint }}';
var KEY = '{{ $key }}';
var BATCH = 100;

function setup() {
  var form = FormApp.getActiveForm();

  ScriptApp.getProjectTriggers()
    .filter(function (t) { return t.getHandlerFunction() === 'onResponse'; })
    .forEach(function (t) { ScriptApp.deleteTrigger(t); });
  ScriptApp.newTrigger('onResponse').forForm(form).onFormSubmit().create();

  var sent = sendAll();
  Logger.log('Ready. Sent %s responses. New ones will be sent as they arrive.', sent);
}

function onResponse(e) {
  // A registration the website handed over is already on the website.
  if (PropertiesService.getScriptProperties().getProperty('site:' + e.response.getId())) return;
  post([toPayload(e.response)]);
}

/**
 * The website hands each registration made there to this, and it is written
 * into this form's responses sheet, each answer under its question's column.
 *
 * Into the sheet rather than the form: Google refuses a response submitted by
 * a script to a form that collects email addresses ("Invalid data updating
 * form"). The sheet is the list the team works from, and it takes the email
 * too. These rows are in the sheet, not in the form's own Responses summary.
 * Answers an id for the row, so the website knows it arrived.
 */
function doPost(e) {
  var body = JSON.parse(e.postData.contents);
  if (body.key !== KEY) {
    return reply({ error: 'Not authorised.' });
  }

  var r = body.registration;
  var sheet = responsesSheet();
  if (!sheet) {
    return reply({ error: 'This form has no responses sheet. In the form: Responses -> Link to Sheets.' });
  }

  // The sheet's own headings are the form's questions, as worded on the form.
  var lastColumn = sheet.getLastColumn();
  var headings = sheet.getRange(1, 1, 1, lastColumn).getValues()[0];
  var wanted = [
    [/^timestamp$/i, new Date()],
    [/\be-?mail\b/i, r.email],
    [/\bname\b/i, r.fullName],
    [/\b(mobile|phone|contact)\b/i, r.mobile],
    [/\b(affiliation|organi[sz]ation|company|employer)\b/i, r.organisation],
    [/\b(position|designation|job title)\b/i, r.designation],
    [/\bdiet/i, r.dietary || 'Not provided'],
    [/\bare you a chevening\b/i, r.cheveningScholar],
    [/\bcohort\b/i, r.cheveningCohort],
    [/\buniversity\b/i, r.cheveningUniversity],
    [/\bcam\b/i, r.camMember],
  ];
  var used = {};

  var row = headings.map(function (heading) {
    var title = String(heading);
    for (var i = 0; i < wanted.length; i++) {
      if (used[i] || !wanted[i][0].test(title)) continue;
      used[i] = true;
      return asCell(wanted[i][1]);
    }
    return '';
  });

  // One at a time, so two registrations arriving together do not land on
  // the same row.
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    // Directly under the last response. appendRow goes past the empty rows a
    // Sheets table keeps at its foot, which left a gap and put the row
    // outside the table.
    var next = lastFilledRow(sheet) + 1;
    sheet.getRange(next, 1, 1, row.length).setValues([row]);
  } finally {
    lock.releaseLock();
  }

  return reply({ id: 'sheet:' + (r.reference || new Date().getTime()) });
}

/**
 * A value as the sheet should show it. Text starting with + = - or @ is
 * read by Sheets as a formula -- "+60 12 345 6789" became #ERROR! -- so it
 * is marked as text with a leading apostrophe, which Sheets does not show.
 */
function asCell(value) {
  if (value == null) return '';
  if (value instanceof Date) return value;
  var text = String(value);
  return /^[=+\-@]/.test(text) ? "'" + text : text;
}

/** The last row with a timestamp in it: the foot of the responses. */
function lastFilledRow(sheet) {
  var column = sheet.getRange(1, 1, sheet.getMaxRows(), 1).getValues();
  for (var i = column.length - 1; i >= 0; i--) {
    if (column[i][0] !== '' && column[i][0] !== null) return i + 1;
  }
  return 1;
}

/** The tab the form writes its responses to. */
function responsesSheet() {
  var id = FormApp.getActiveForm().getDestinationId();
  if (!id) return null;
  var sheets = SpreadsheetApp.openById(id).getSheets();
  for (var i = 0; i < sheets.length; i++) {
    if (sheets[i].getFormUrl()) return sheets[i];
  }
  return null;
}

/**
 * Run once after pasting a new version, to grant the permission to write to
 * the responses sheet. Reads the headings and changes nothing.
 */
function authorise() {
  var sheet = responsesSheet();
  Logger.log(sheet ? 'Ready. Writing to "' + sheet.getName() + '".' : 'This form has no responses sheet.');
}

function reply(value) {
  return ContentService.createTextOutput(JSON.stringify(value))
    .setMimeType(ContentService.MimeType.JSON);
}

function sendAll() {
  var responses = FormApp.getActiveForm().getResponses();
  for (var i = 0; i < responses.length; i += BATCH) {
    post(responses.slice(i, i + BATCH).map(toPayload));
  }
  return responses.length;
}

function toPayload(response) {
  return {
    id: response.getId(),
    submittedAt: response.getTimestamp().toISOString(),
    email: response.getRespondentEmail() || null,
    items: response.getItemResponses().map(function (item) {
      return { question: item.getItem().getTitle(), answer: asText(item.getResponse()) };
    }),
  };
}

/** Tick-box and grid answers arrive as lists; the website stores text. */
function asText(value) {
  if (Array.isArray(value)) {
    return value.map(asText).filter(String).join(', ');
  }
  return value == null ? '' : String(value);
}

function post(responses) {
  var result = UrlFetchApp.fetch(WEBSITE, {
    method: 'post',
    contentType: 'application/json',
    headers: { 'X-Form-Key': KEY, Accept: 'application/json' },
    payload: JSON.stringify({ responses: responses }),
    muteHttpExceptions: true,
  });

  if (result.getResponseCode() !== 200) {
    // Thrown rather than logged, so Google emails the owner when a response
    // does not get through. A sync that fails quietly is worse than one that
    // fails loudly.
    throw new Error('The website refused the responses (' + result.getResponseCode() + '): ' +
      result.getContentText().slice(0, 300));
  }
  Logger.log(result.getContentText());
}
