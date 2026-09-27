const subjectsContainer = document.querySelector("#subjects");
const form = document.querySelector("#planner-form");
const addButton = document.querySelector("#add-subject");
const submitButton = form.querySelector("button[type='submit']");
const errorBox = document.querySelector("#form-error");
const emptyState = document.querySelector("#empty-state");
const loadingState = document.querySelector("#loading-state");
const result = document.querySelector("#plan-result");

function addSubject(values = {}) {
  if (subjectsContainer.children.length >= 8) return;

  const row = document.createElement("div");
  row.className = "subject-row";
  row.innerHTML = `
    <label>Subject
      <input class="subject-name" maxlength="60" placeholder="e.g. Calculus" required>
    </label>
    <label>Deadline
      <input class="subject-deadline" type="date">
    </label>
    <label>Confidence
      <select class="subject-confidence">
        <option value="1">1 — Low</option>
        <option value="2">2</option>
        <option value="3" selected>3 — Okay</option>
        <option value="4">4</option>
        <option value="5">5 — High</option>
      </select>
    </label>
    <button class="remove-subject" type="button" aria-label="Remove subject">×</button>
  `;

  row.querySelector(".subject-name").value = values.name || "";
  row.querySelector(".subject-deadline").value = values.deadline || "";
  row.querySelector(".subject-confidence").value = values.confidence || "3";
  row.querySelector(".remove-subject").addEventListener("click", () => {
    if (subjectsContainer.children.length > 1) row.remove();
  });
  subjectsContainer.appendChild(row);
}

function getPayload() {
  const subjects = [...document.querySelectorAll(".subject-row")].map(row => ({
    name: row.querySelector(".subject-name").value.trim(),
    deadline: row.querySelector(".subject-deadline").value,
    confidence: Number(row.querySelector(".subject-confidence").value)
  }));

  return {
    subjects,
    available_minutes: Number(document.querySelector("#available-minutes").value),
    session_minutes: Number(document.querySelector("#session-minutes").value),
    break_minutes: Number(document.querySelector("#break-minutes").value)
  };
}

function validate(payload) {
  if (payload.subjects.some(subject => !subject.name)) return "Give every subject a name.";
  if (!payload.available_minutes || payload.available_minutes < 20 || payload.available_minutes > 480) return "Available time must be between 20 and 480 minutes.";
  if (!payload.session_minutes || payload.session_minutes < 10 || payload.session_minutes > 120) return "Study blocks must be between 10 and 120 minutes.";
  if (!payload.break_minutes || payload.break_minutes < 1 || payload.break_minutes > 30) return "Breaks must be between 1 and 30 minutes.";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (payload.subjects.some(subject => subject.deadline && new Date(`${subject.deadline}T00:00:00`) < today)) return "Deadlines cannot be in the past.";
  return null;
}

function setLoading(isLoading) {
  submitButton.disabled = isLoading;
  submitButton.classList.toggle("loading", isLoading);
  emptyState.hidden = isLoading || !result.hidden;
  loadingState.hidden = !isLoading;
  if (isLoading) result.hidden = true;
}

function showError(message) {
  errorBox.textContent = message;
  errorBox.hidden = false;
}

function subjectIcon(subject, type) {
  if (type.toLowerCase() === "break") return "☕";
  const name = subject.toLowerCase();
  if (/math|calculus|algebra|geometry|statistics/.test(name)) return "✦";
  if (/science|biology|chemistry|physics|lab/.test(name)) return "⚗";
  if (/history|government|politic|social/.test(name)) return "⌛";
  if (/english|writing|literature|essay/.test(name)) return "✎";
  if (/language|spanish|french|chinese|japanese/.test(name)) return "あ";
  if (/computer|coding|programming|code/.test(name)) return "⌘";
  if (/art|design|music|theater/.test(name)) return "♫";
  return "♡";
}

function renderPlan(plan) {
  document.querySelector("#plan-title").textContent = plan.title;
  document.querySelector("#plan-summary").textContent = plan.summary;
  document.querySelector("#plan-tip").textContent = plan.tip;

  const list = document.querySelector("#session-list");
  list.replaceChildren();
  let studyIndex = 0;
  plan.sessions.forEach(session => {
    const card = document.createElement("article");
    const isBreak = session.type.toLowerCase() === "break";
    card.className = isBreak ? "session break" : `session subject-tone-${studyIndex++ % 5}`;

    const badge = document.createElement("div");
    badge.className = "session-badge";
    const icon = document.createElement("span");
    icon.className = "session-icon";
    icon.textContent = subjectIcon(session.subject, session.type);
    const minutes = document.createElement("span");
    minutes.className = "session-time";
    minutes.textContent = `${session.minutes}m`;
    badge.append(icon, minutes);

    const content = document.createElement("div");
    const heading = document.createElement("h3");
    heading.textContent = session.subject;
    const task = document.createElement("p");
    task.textContent = session.task;
    const reason = document.createElement("small");
    reason.textContent = session.reason;
    content.append(heading, task, reason);
    card.append(badge, content);
    list.appendChild(card);
  });

  loadingState.hidden = true;
  emptyState.hidden = true;
  result.hidden = false;
}

addButton.addEventListener("click", () => addSubject());
document.querySelector("#start-over").addEventListener("click", () => {
  result.hidden = true;
  emptyState.hidden = false;
  document.querySelector("#planner").scrollIntoView({ behavior: "smooth" });
});

form.addEventListener("submit", async event => {
  event.preventDefault();
  errorBox.hidden = true;
  const payload = getPayload();
  const validationError = validate(payload);
  if (validationError) {
    showError(validationError);
    return;
  }

  setLoading(true);
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000);
    const response = await fetch(`${window.APP_CONFIG.API_BASE_URL}/generate-plan`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal
    });
    clearTimeout(timeout);
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || "The server could not create a plan.");
    renderPlan(data);
  } catch (error) {
    const message = error.name === "AbortError"
      ? "The server is taking too long to respond. It may be waking up—please try again."
      : error.message || "Could not reach the planner. Check your connection and try again.";
    showError(message);
    loadingState.hidden = true;
    emptyState.hidden = false;
  } finally {
    submitButton.disabled = false;
    submitButton.classList.remove("loading");
  }
});

addSubject();
