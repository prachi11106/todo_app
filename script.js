const input = document.getElementById("taskInput");
const addBtn = document.getElementById("addBtn");
const taskList = document.getElementById("taskList");
const themeToggle = document.getElementById("themeToggle");
const html = document.documentElement;

// ── Dark mode toggle ──
const savedTheme = localStorage.getItem("theme") || "light";
html.setAttribute("data-theme", savedTheme);

themeToggle.addEventListener("click", () => {
  const current = html.getAttribute("data-theme");
  const next = current === "light" ? "dark" : "light";
  html.setAttribute("data-theme", next);
  localStorage.setItem("theme", next);
});

// ── Add Task ──
addBtn.addEventListener("click", addTask);
input.addEventListener("keypress", (e) => { if (e.key === "Enter") addTask(); });

function addTask() {
  const taskText = input.value.trim();
  if (taskText === "") return;

  const li = document.createElement("li");
  li.classList.add("task-item");

  // ── Top row: chevron + text + delete ──
  const topRow = document.createElement("div");
  topRow.className = "task-top-row";

  const chevron = document.createElement("button");
  chevron.className = "chevron-btn";
  chevron.setAttribute("aria-label", "Toggle subtasks");
  chevron.innerHTML = `<svg class="chevron-icon" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 6l4 4 4-4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;

  const span = document.createElement("span");
  span.className = "task-label";
  span.textContent = taskText;

  // Toggle done on label click
  span.addEventListener("click", () => {
    li.classList.toggle("done");
  });

  const delBtn = document.createElement("button");
  delBtn.className = "delete-btn";
  delBtn.textContent = "❌";
  delBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    li.remove();
  });

  topRow.appendChild(chevron);
  topRow.appendChild(span);
  topRow.appendChild(delBtn);

  // ── Subtask section ──
  const subtaskSection = document.createElement("div");
  subtaskSection.className = "subtask-section";

  const subtaskList = document.createElement("ul");
  subtaskList.className = "subtask-list";

  const subtaskInputRow = document.createElement("div");
  subtaskInputRow.className = "subtask-input-row";

  const subtaskInput = document.createElement("input");
  subtaskInput.className = "subtask-input";
  subtaskInput.placeholder = "Add a subtask...";
  subtaskInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") addSubtask(subtaskInput, subtaskList, li);
  });

  const subtaskAddBtn = document.createElement("button");
  subtaskAddBtn.className = "subtask-add-btn";
  subtaskAddBtn.textContent = "+";
  subtaskAddBtn.addEventListener("click", () => addSubtask(subtaskInput, subtaskList, li));

  subtaskInputRow.appendChild(subtaskInput);
  subtaskInputRow.appendChild(subtaskAddBtn);

  subtaskSection.appendChild(subtaskList);
  subtaskSection.appendChild(subtaskInputRow);

  // ── Chevron toggle ──
  let expanded = false;
  chevron.addEventListener("click", (e) => {
    e.stopPropagation();
    expanded = !expanded;
    subtaskSection.classList.toggle("open", expanded);
    chevron.classList.toggle("rotated", expanded);
    if (expanded) subtaskInput.focus();
  });

  // ── Progress bar ──
  const progressTrack = document.createElement("div");
  progressTrack.className = "progress-track";
  const progressFill = document.createElement("div");
  progressFill.className = "progress-bar-fill";
  progressTrack.appendChild(progressFill);

  const progressLabel = document.createElement("div");
  progressLabel.className = "progress-label";

  li.appendChild(topRow);
  li.appendChild(progressTrack);
  li.appendChild(progressLabel);
  li.appendChild(subtaskSection);
  taskList.appendChild(li);

  input.value = "";
  input.focus();
}

function addSubtask(subtaskInput, subtaskList, parentLi) {
  const text = subtaskInput.value.trim();
  if (text === "") return;

  const subLi = document.createElement("li");
  subLi.className = "subtask-item";

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.className = "subtask-checkbox";
  checkbox.addEventListener("change", () => {
    subLi.classList.toggle("subtask-done", checkbox.checked);
    updateParentProgress(subtaskList, parentLi);
  });

  const subLabel = document.createElement("span");
  subLabel.className = "subtask-label";
  subLabel.textContent = text;

  const subDel = document.createElement("button");
  subDel.className = "subtask-delete-btn";
  subDel.textContent = "✕";
  subDel.addEventListener("click", (e) => {
    e.stopPropagation();
    subLi.remove();
    updateParentProgress(subtaskList, parentLi);
  });

  subLi.appendChild(checkbox);
  subLi.appendChild(subLabel);
  subLi.appendChild(subDel);
  subtaskList.appendChild(subLi);

  subtaskInput.value = "";
  subtaskInput.focus();
  updateParentProgress(subtaskList, parentLi);
}

function updateParentProgress(subtaskList, parentLi) {
  const all = subtaskList.querySelectorAll(".subtask-item");
  const done = subtaskList.querySelectorAll(".subtask-done");
  const progressBar = parentLi.querySelector(".progress-bar-fill");
  const progressLabel = parentLi.querySelector(".progress-label");

  if (!progressBar) return;

  if (all.length === 0) {
    progressBar.style.width = "0%";
    progressLabel.textContent = "";
    return;
  }

  const pct = Math.round((done.length / all.length) * 100);
  progressBar.style.width = pct + "%";
  progressLabel.textContent = `${done.length}/${all.length}`;

  // Auto-complete parent if all subtasks done
  if (pct === 100) {
    parentLi.classList.add("done");
  } else {
    parentLi.classList.remove("done");
  }
}