{{-- The Apps Script the organising team pastes into their Google Form. Served
     by the panel with the address and key already filled in, so nobody has to
     edit it. Keep it plain: the person pasting it is not a developer. --}}
/**
 * Connects this form to the Seri Negara Dialogue website, both ways:
 *   - registrations made on the website are added to this form, and
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
 *   5. Click Deploy -> New deployment -> the gear icon -> Web app.
 *      Execute as: Me. Who has access: Anyone. Click Deploy, allow again if
 *      asked, and copy the "Web app URL" it shows.
 *   6. Paste that URL into the website's admin: Registrations -> Google
 *      Form -> "Web app link", and click Save. From then on, registrations
 *      made on the website appear in this form's responses.
 *
 * If a response ever fails to send, Google emails the form's owner. Once the
 * cause is fixed, run "sendAll" to send everything again -- responses the
 * website already has are updated, never duplicated.
 *
 * The script reads this form's responses and sends them to the website, and
 * adds the website's registrations as responses. It changes nothing else on
 * the form -- no questions, no settings.
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
 * The website hands each registration made there to this, and it is added to
 * the form as a response -- the way Google allows a form in a Workspace to be
 * filled in from outside it. Answers the id of the new response.
 */
function doPost(e) {
  var body = JSON.parse(e.postData.contents);
  if (body.key !== KEY) {
    return reply({ error: 'Not authorised.' });
  }

  var r = body.registration;
  var form = FormApp.getActiveForm();
  var response = form.createResponse();

  // Each answer goes to the question that asks for it, found by its wording,
  // so renaming a question slightly does not break this.
  var wanted = [
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

  form.getItems().forEach(function (item) {
    var title = item.getTitle();
    for (var i = 0; i < wanted.length; i++) {
      if (used[i] || !wanted[i][1] || !wanted[i][0].test(title)) continue;
      var answer = String(wanted[i][1]);
      var type = item.getType();
      if (type === FormApp.ItemType.TEXT) {
        response.withItemResponse(item.asTextItem().createResponse(answer));
      } else if (type === FormApp.ItemType.PARAGRAPH_TEXT) {
        response.withItemResponse(item.asParagraphTextItem().createResponse(answer));
      } else if (type === FormApp.ItemType.MULTIPLE_CHOICE) {
        response.withItemResponse(item.asMultipleChoiceItem().createResponse(answer));
      } else {
        continue;
      }
      used[i] = true;
      break;
    }
  });

  var saved = response.submit();
  // Remembered, so the trigger below does not send it back to the website
  // as if somebody had filled in the form.
  PropertiesService.getScriptProperties().setProperty('site:' + saved.getId(), '1');

  return reply({ id: saved.getId() });
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
