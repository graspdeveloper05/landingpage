# Seri Negara Dialogue 2026 — User Manual

**For the organising team.** No technical knowledge assumed.

This manual explains what the website is, what every part of it does, and how
to run it yourself — editing content, managing registrations and reading your
visitor numbers — without calling a developer.

- **Public website:** https://serinegaradialogue.org
- **Admin panel:** https://serinegaradialogue.org/admin

---

## Contents

1. [What you have](#1-what-you-have)
2. [The public website, page by page](#2-the-public-website-page-by-page)
3. [Signing in to the admin panel](#3-signing-in-to-the-admin-panel)
4. [Event — date, venue, capacity, opening and closing registration](#4-event)
5. [Speakers — adding, editing, reordering, portraits](#5-speakers)
6. [Programme — the running order](#6-programme)
7. [Registrations — the attendee list and CSV export](#7-registrations)
8. [Analytics — who is visiting](#8-analytics)
9. [The four languages](#9-the-four-languages)
10. [Privacy and attendee data (PDPA)](#10-privacy-and-attendee-data-pdpa)
11. [Everyday questions and problems](#11-everyday-questions-and-problems)
12. [Before the site is announced](#12-before-the-site-is-announced)
13. [What belongs to you](#13-what-belongs-to-you)

---

## 1. What you have

Two things, on one web address:

| | |
|---|---|
| **The public website** | What visitors see. Five pages, four languages, with a registration form. |
| **The admin panel** | A private area at `/admin` where your team edits the site. Only people you give a login to can reach it. |

Everything on the public site — the date, the venue, the speakers, the
programme — is read from a database that the admin panel edits. **When you save
a change in the admin panel, the website shows it immediately.** There is no
publishing step and no developer involved.

Registrations from the public form arrive in the admin panel the moment someone
submits them, and each person is sent a confirmation email automatically.

---

## 2. The public website, page by page

| Page | Address | What it shows |
|---|---|---|
| **Home** | `/` | The hero banner, the event's date and venue, the concept, a speaker preview and the seats-remaining counter. |
| **About** | `/about` | The dialogue's purpose, the three pillars and the chairman's message. |
| **Speakers** | `/speakers` | Every speaker you have entered — portrait, name, designation, organisation, biography and their official link. |
| **Programme** | `/programme` | The running order, in time order. |
| **Register** | `/rsvp` | The registration form, the seats-remaining meter and the PDPA notice. |

Shared by every page: the top navigation, the language switcher, the footer with
your contact and social links, and — on phones — a permanent **Register** bar at
the bottom of the screen.

**The registration form asks for:** full name, email, mobile number,
organisation, designation, and dietary requirements (the only optional one).
Nothing more is collected, by design.

**After someone registers** they see a confirmation with a reference number and
receive the same reference by email. That reference is how you find them later
in the admin panel.

---

## 3. Signing in to the admin panel

1. Go to **https://serinegaradialogue.org/admin**
2. Enter your email address and password.
3. Press **Sign in**.

The eye icon beside the password box shows what you have typed, if you want to
check it before pressing enter.

Once in, you will see five sections down the left: **Event, Speakers,
Programme, Registrations, Analytics**. On a phone or tablet, tap the menu
button at the top left to open the same list.

**Signing out:** use the sign-out control in the panel. You are also signed out
automatically after **two hours** of inactivity — this is deliberate, because
the panel shows attendee personal data.

### Logins for your team

There is no "forgot password" email. Passwords are issued and reset by whoever
administers the server, using a single command. Ask your developer contact to:

- **add a login** for a new team member, or
- **reset a password** for someone who has lost theirs.

Every login has full access — there are no restricted roles. Only give a login
to people who should be able to see the full attendee list.

> ⚠️ **Important.** The site ships with a default login (`admin@serineg.com`).
> It is publicly documented and must be replaced with real accounts *before*
> the website is announced. See the checklist in section 12.

---

## 4. Event

**What this section controls:** the date, time, venue and capacity shown
everywhere on the site — and whether the registration form is open.

### The fields

| Field | What it does |
|---|---|
| **Date** | The real calendar date. Used by search engines and calendar apps. |
| **Start time** | The real clock time, picked from a time control. |
| **Date, as written** | What visitors actually read — for example *8 October 2026*. |
| **Time, as written** | What visitors actually read — for example *2.30 PM onwards*. |
| **Venue** | The venue's name. |
| **Address** | The full postal address. |
| **Google Maps link** | Where the "Open in Google Maps" button sends people. |
| **Google Maps embed link** | The map shown on the page itself. This one must end in `&output=embed`. |

There are two date fields and two time fields on purpose: one pair is the
machine-readable truth, the other is the wording you want visitors to see.
**Keep them in agreement.**

### Registration: open or closed

At the top of the Registration box, a coloured panel tells you in plain words
what the website is telling visitors *right now*:

| It says | It means |
|---|---|
| **Open** | The form is accepting registrations. |
| **Full** | Every seat is taken. The site closed the form on its own. |
| **Closed** | Someone on your team closed it by hand. |
| **Past** | The event date has gone by. |

**To close registration early** — before a catering or security deadline, say —
untick **Accept registrations** and save. Visitors see a closed notice instead
of the form. Tick it again to reopen.

A **past** event cannot be reopened with the tickbox, because it is the *date*
that makes it past. Change the date if the event has moved.

### Capacity

**Seats** is the total number of places. Below it the panel tells you how many
people have registered so far.

- Registration **closes on its own** when the seats are gone — you do not need
  to watch it.
- You **cannot set capacity below the number already registered**. The system
  refuses, rather than quietly creating an overbooking.
- Raising the number reopens a full event immediately.

### Saving

The save bar sits at the bottom of the screen and follows you as you scroll, so
you never have to hunt for it. A message confirms the save at the foot of the
screen.

---

## 5. Speakers

**What this section controls:** the Speakers page, and the speaker preview on
the home page.

### Adding a speaker

1. Press **Add speaker**.
2. Fill in the fields below.
3. Press **Save**.

| Field | Notes |
|---|---|
| **Full name** | As it should be printed. |
| **Organisation** | Their institution or company. |
| **Id** | A short code such as `sp-09`. Set once when you create the speaker; it cannot be changed afterwards. If you are unsure, continue the numbering from the last speaker. |
| **Designation** | Their title. **Needed in all four languages.** |
| **Short biography** | A paragraph. **Needed in all four languages.** |
| **Link — Label** | What the link is called, e.g. *Profile at Universiti Malaya*. |
| **Link — Address** | The web address, starting with `https://`. |
| **Portrait** | See below. |

### Portraits

Press the portrait box and choose an image file. It uploads straight away and
you will see it appear in place.

- **Accepted formats:** JPEG, PNG or WebP.
- **Shape:** portrait, 5:6 — **700 × 840 pixels** is the target. A square or
  landscape photo will be cropped and will not look right.
- Use the best-quality original you have; the site optimises it for you.

### Reordering

Use the **Move up** and **Move down** arrows on each row. The order in the
admin panel is exactly the order visitors see.

### Removing a speaker

Press **Remove** on the speaker's row and confirm. This takes them off the
public site immediately and **cannot be undone** — so if a speaker is only
*possibly* dropping out, wait for confirmation before removing them.

---

## 6. Programme

**What this section controls:** the Programme page.

### Adding a session

1. Press **Add session**.
2. Fill in:

| Field | Notes |
|---|---|
| **Start time** | Picked from a time control. Visitors see it formatted for their own language. |
| **Id** | A short code such as `pr-09`, lowercase. Fixed once saved. |
| **Session title** | **Needed in all four languages.** |
| **Subtitle** | Optional — tick **Add a subtitle** to reveal it. A panel's topic, for example. If you use it, it is **needed in all four languages, or none**. |

3. Press **Save**.

### Reordering

**Move up** and **Move down**, as with speakers. Sessions display in the order
you set here — so keep them in time order.

### Removing a session

Press **Remove** on its row and confirm.

---

## 7. Registrations

**What this section shows:** everyone who has registered.

The table lists, for each person: **reference, name and designation, email and
mobile, organisation, dietary requirements, and when they registered.**

### Finding someone

Type into the **Search** box. It matches name, email, organisation or
reference number. Results narrow as you type.

If there are many registrations, the list is paged — use the page controls
beneath the table.

### The red **!** beside a reference

It means **the confirmation email did not reach that person.** Their
registration is safely recorded — only the email failed. Contact them directly
(their email address is in the row) to confirm their place.

### Downloading the list

Press **Download CSV**. You get a spreadsheet file containing every
registration, which opens in Excel, Numbers or Google Sheets. Use it for name
badges, catering numbers, seating and the door list.

> 🔒 That file contains names, emails and mobile numbers — personal data under
> the PDPA. Do not email it around or leave it in a shared folder. See
> section 10.

---

## 8. Analytics

**What this section shows:** how many people are visiting the site, and from
where.

Choose a period at the top — **7, 30 or 90 days**. The panel then shows:

| Figure | Meaning |
|---|---|
| **Visitors** | People who came, counted once per day each. |
| **Page views** | Pages opened in total. One visitor may open several. |
| **Registrations** | How many registered in that period. |
| **Registered %** | The share of visitors who went on to register. |

Below the figures: a **bar chart of page views per day**, and breakdowns by
**page** (which pages are read), **referrer** (which sites send people to you)
and **language** (which of the four languages visitors choose).

### What this tells you in practice

- A jump on the day of a press release or a social post tells you it worked.
- A high visitor count with a low **Registered %** suggests the registration
  page or the form is the obstacle, not the publicity.
- The **language** breakdown tells you which translations are actually being
  read — useful when deciding where to spend on printed material.

### Why there is no Google Analytics

The site counts its own visitors. **No cookies are set, nothing is sent to any
outside company, and no cookie-consent banner is needed** — that is a direct
consequence of the choice, not an oversight. No IP addresses are stored, and
nothing identifies an individual. It costs nothing and there is no
subscription to renew.

The honest limit of this approach: you get daily unique visitor counts, not a
history of any individual's visits. If Google Analytics is ever required,
please raise it first — it would mean third-party cookies, attendee browsing
data leaving the country, and a consent banner to design and translate into
four languages.

---

## 9. The four languages

The site is published in **English, Bahasa Malaysia, 中文 and தமிழ்**. Visitors
switch with the control in the header, and their choice is remembered.

**What this means when you edit:** any field marked as needing all four
languages — speaker designations and biographies, session titles and subtitles
— must be filled in for all four, or the save will be refused. This is
deliberate: it is what stops one language quietly falling out of step with the
others.

If you do not yet have a translation, put the English in temporarily and
replace it — an untranslated field is visible, a missing one is broken.

The site's *fixed* wording — headings, buttons, form labels, the PDPA notice —
is not edited in the admin panel. Changes to that wording go through your
developer contact.

> Note: the 中文 and தமிழ் versions of the fixed wording are currently
> machine-translated and **still need a native speaker's review** before launch.

---

## 10. Privacy and attendee data (PDPA)

The registration list is personal data. Please treat it accordingly.

**What the system does for you:**

- The registration form collects only what is genuinely needed — six fields,
  one of them optional.
- Attendee data is reachable only behind an admin login.
- The application's passwords and database credentials sit outside the public
  area of the server and cannot be downloaded.
- The form is rate-limited, so a script cannot work through a list of addresses.
- Analytics stores nothing identifying — no IP addresses, no visitor histories.
- "Do Not Track" browser settings are honoured.

**What is your responsibility:**

- Keep the number of people with admin logins small.
- Treat the CSV export as confidential once it leaves the panel.
- Have the **PDPA notice on the registration page signed off** by whoever is
  accountable for the data, before the site is announced.
- Delete the registration data once it is no longer needed after the event.
- Clear analytics rows older than a year once the 2026 edition is closed out
  (ask your developer contact — it is one command).

---

## 11. Everyday questions and problems

**"I saved, but the website has not changed."**
Refresh the page in your browser (Ctrl+R, or Cmd+R on a Mac). If it still looks
old, try a private/incognito window — what you are seeing is your own browser's
cached copy.

**"It says my change could not be saved."**
The panel tells you which field is wrong, beside that field. The usual causes:
a language left blank in a four-language field, a link that does not start with
`https://`, or a capacity set below the number already registered.

**"It says it cannot reach the server."**
The website is temporarily unreachable. Press **Try again**. If it persists for
more than a few minutes, contact your developer.

**"Someone says they registered but got no email."**
Look them up in Registrations. If a red **!** shows beside their reference,
their registration is recorded and only the email failed — reply to them
directly with their reference number.

**"We need to cancel or postpone."**
Untick **Accept registrations** in Event to close the form at once, then change
the date. Use the CSV export to email everyone already registered.

**"The seats counter looks wrong."**
It is the capacity minus the number registered, live. If it reads zero, the
event is full and the form has closed itself — raise **Seats** to reopen it.

**"I have forgotten my password."**
There is no reset email. Contact your developer, who can issue a new one.

---

## 12. Before the site is announced

**Your team must supply:**

- [ ] 8 speaker portraits and the chairman's photo — 700 × 840 pixels
- [ ] Confirmed speaker names and their official profile links
- [ ] 3 social media links and a contact email address
- [ ] A transparent version of the logo, and the real Seri Negara crest
- [ ] Legal sign-off on the PDPA wording
- [ ] A native speaker's review of the 中文 and தமிழ் translations
- [ ] Written confirmation before any organisation is described on the site as a
      partner, supporter or sponsor

**Your developer must complete:**

- [ ] Replace the default admin login with real accounts
- [ ] Remove the search-engine block once real content is in place
- [ ] Confirm the confirmation email sends from the correct address

---

## 13. What belongs to you

On handover, the following transfer to Chevening Alumni Malaysia:

- The domain name **serinegaradialogue.org**
- The hosting account
- The source code repository
- The database, including every registration
- Every admin login

There are no plugin licences, paid subscriptions or third-party services to
renew — the site was built so that running it costs the hosting and the domain,
and nothing else.

### Adding the 2027 edition

The site was built to be reused. A second edition does not need a new website —
the year's content is a self-contained set that your developer copies forward.
Ask for it when the time comes; it is a short job, not a rebuild.

---

*Seri Negara Dialogue 2026 · Chevening Alumni Malaysia*
