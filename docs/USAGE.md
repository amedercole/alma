# How to use Alma

> **▶ To use the app, go to: <https://alma-production-2def.up.railway.app>**

Alma has two user types:

- **Prospect** — a member of the public who submits a lead (no account).
- **Attorney** — an internal user who reviews leads and marks them reached out.

This app is deployed as a **demo**, so it opens on a start screen where you
enter an email and are instantly signed in as an attorney with that address.
(There is a real session behind this — see [DESIGN.md](../DESIGN.md).)

## Quick start (the demo gate)

1. Open the app. On the **"Demo project"** start screen, enter an email and click
   **Enter demo**. You're now signed in as an attorney using that email.
2. The bottom-right corner shows **"Signed in as &lt;email&gt;"** so you always
   know who you are.
3. **Refreshing the page starts over** and returns you to the start screen.
4. **Restart** (top-right) does the same on demand.

> 📩 **Check your spam folder.** The attorney notification email can land in
> spam/junk the first time — mark it "not spam" and future ones arrive normally.

## As a prospect — submit a lead

1. Click **Submit a lead** (`/leads/new`).
2. Enter your first name, last name, email, and upload a resume/CV
   (PDF, DOC, or DOCX, max 5 MB).
3. Click **Submit application**. You'll see a confirmation page, and two emails go
   out:
   - a **confirmation** to the email you entered as the prospect, and
   - a **notification** to the attorney (the email you started the demo with).

Validation errors (missing fields, wrong file type, too large) are shown inline.

## As an attorney — manage leads

1. Click **Dashboard** (`/dashboard`).
2. You'll see every lead with: name, email, **resume (Download)**, submitted date,
   and state.
3. Use the **All / Pending / Reached out** filters to narrow the list.
4. On a **Pending** lead, click **Mark reached out** — it moves to
   `REACHED_OUT` and records who reached out and when. This is one-way: a lead
   can't go back to pending (the API returns `409` if you try).

## Good to know

- Leads always start **PENDING** and transition only to **REACHED_OUT**.
- The dashboard is protected by a real signed session; the demo start screen is
  what provisions it (it just skips a password prompt).
- Email delivery uses **Resend** in the hosted demo (Railway blocks SMTP);
  locally you can use SMTP/Gmail instead. See the README's "Email" section.
