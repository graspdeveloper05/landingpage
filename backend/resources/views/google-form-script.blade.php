{{-- The Apps Script the organising team pastes into their Google Form. Served
     by the panel with the address and key already filled in, so nobody has to
     edit it. Keep it plain: the person pasting it is not a developer. --}}
/**
 * Sends this form's responses to the Seri Negara Dialogue website, so the
 * organising team can see every registration in one list.
 *
 * Set up once:
 *   1. In this editor, click Save (the disk icon).
 *   2. Choose "setup" in the function list above, then click Run.
 *   3. Google asks for permission: Review permissions -> your account ->
 *      Advanced -> Go to ... (unsafe) -> Allow. It says "unsafe" only
 *      because the script is your own and not published by Google.
 *   4. The log says "Ready". Every response so far has been sent, and each
 *      new one follows as it arrives.
 *
 * If a response ever fails to send, Google emails the form's owner. Once the
 * cause is fixed, run "sendAll" to send everything again -- responses the
 * website already has are updated, never duplicated.
 *
 * The script only reads this form's responses and sends them to the website.
 * It changes nothing on the form.
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
  post([toPayload(e.response)]);
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
