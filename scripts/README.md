# Student simulation

`simulate-students.mjs` creates a virtual classroom for a real moderated session. It joins uniquely named fake students, leaves them visible in the lobby, then has them submit randomly selected answers after the facilitator starts the session.

It is intended for a local or POC environment only. It creates genuine in-memory participants in the session, so use a disposable test session.

## Use it

1. Start the API and create a live moderated session in the teacher app.
2. Copy the session's six-digit PIN.
3. In Bash, from the repository root, run:

```bash
npm run simulate:student -- 123456
```

It creates 25 students by default. Use a deployed API or change the class size with environment variables:

```bash
API_URL=https://YOUR-API-URL.run.app STUDENTS=30 npm run simulate:student -- 123456
```

The script reports when everyone has joined. Open the facilitator or projector view, verify the lobby roster, and start the test normally. Stop the script with `Ctrl+C` when finished.

Optional settings:

- `POLL_MS` — student refresh interval; default `2000`.
- `MIN_ANSWER_DELAY_MS` and `MAX_ANSWER_DELAY_MS` — randomized answer delay; defaults `800` and `4500`.

Matching-pair questions are completed pair by pair, and matching-mode breaks are advanced automatically. Coin-catch games receive a random score. Other normal questions receive a random option, so results look naturally mixed. The other game types advance when their configured timer expires, just as they do in the live player; give those game items a timer when testing an entire run.
