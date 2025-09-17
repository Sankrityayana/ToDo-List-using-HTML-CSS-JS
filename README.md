# To‑Do List (HTML • CSS • JS)

A clean, responsive To‑Do List web app with full CRUD, inline editing, and localStorage persistence — no frameworks.

### Features
- Add tasks with input and button
- Inline edit (Enter to save, Esc to cancel; blur saves)
- Mark complete with a checkbox; active and completed lists are separated
- Delete with confirmation modal
- Clear all completed tasks (with confirmation)
- Smooth hover states, subtle animations
- Responsive layout (mobile and desktop)
- Theme toggle (auto/light) — auto respects system preference
- Persists tasks in `localStorage`

### Project Structure
- `index.html` — semantic HTML structure and modal
- `styles.css` — modern, minimal styles, transitions, and responsive layout
- `script.js` — DOM logic, CRUD, rendering, localStorage, accessibility

### Run locally (Windows PowerShell)
Open the `index.html` file directly in your browser or start a simple server:

```powershell
Start-Process msedge.exe .\index.html
```

Or with Python (if installed):

```powershell
python -m http.server 8080 ; Start-Process http://localhost:8080/index.html
```

### Notes
- All data is stored in your browser's `localStorage` under key `todo.tasks.v1`.
- No external dependencies or frameworks.

### Screenshots
Add your screenshots here.
