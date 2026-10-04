# Debrief

Paste a Zoom, Google Meet, Teams, or other meeting link. Debrief listens to the session and writes a PDF with:

- the **purpose** of the meeting (read this first, in 30 seconds),
- **every topic explained** in plain language,
- decisions, action items, and who spoke,
- **screenshots** of the shared screen,
- every **link** mentioned out loud,
- the **full transcript**.

Everything runs on your own computer. Sessions are stored in your browser only.

---

## Run it on your computer

You need **Node.js 20.19 or newer** (https://nodejs.org, choose LTS) and **Google Chrome or Edge**.

1. Unzip the folder and open a terminal inside it.
2. Install the packages (one time):

   ```
   npm install
   ```

3. Create your key file. Copy `.env.example` to a new file named `.env`, then put your key in it:

   ```
   GEMINI_API_KEY=your-key-here
   ```

   A free Gemini key: https://aistudio.google.com/apikey
   (An xAI/Grok key also works: use `XAI_API_KEY=` instead.)

4. Start it:

   ```
   npm run dev
   ```

5. Open **http://localhost:8080** in Chrome or Edge.

If you change `.env`, stop the server (Ctrl+C) and run `npm run dev` again.

## How to use it

1. Paste the meeting link (or a whole invite; the link is pulled out).
2. Join the call as you normally do. No bot enters the room.
3. Click **Share meeting tab**, pick the tab with the meeting, and tick **Share tab audio**.
   - Meeting on a phone or another app? Use **Listen from microphone** instead.
4. When the call ends, click **Stop and write PDF**.
5. Read the purpose first. If it matters, download the full PDF.

You can also drop an audio or video recording, or paste a transcript, instead of listening live.

## Good to know

- Debrief cannot join a meeting by itself. The browser listens to the tab you share, so you must be in the call.
- Tab audio works in Chrome and Edge on Windows, Linux and ChromeOS. On macOS, tab audio works in Chrome/Edge; sharing a whole screen or window gives no audio.
- The briefing is written in English, even for meetings in other languages.
- The PDF can only draw Latin letters. Hindi, Arabic, Chinese, emoji and similar text appear as `?` in the PDF. The full original text stays on the briefing page, and **Markdown export** keeps it too.
- No key, or the AI service is down? Debrief still saves the transcript and builds a simpler PDF without the explained topics.
- Long meetings are transcribed in 90-second pieces, so a 1-hour meeting makes about 40 AI calls. The free Gemini tier has daily limits.

## Useful commands

```
npm run dev        start (http://localhost:8080)
npm run build      production build
npm run typecheck  check the code
npm test           run the tests
```
