const input        = document.getElementById("taskInput");
const addBtn       = document.getElementById("addBtn");
const taskList     = document.getElementById("taskList");
const themeToggle  = document.getElementById("themeToggle");
const html         = document.documentElement;

// ── Dark mode ──
const savedTheme = localStorage.getItem("theme") || "light";
html.setAttribute("data-theme", savedTheme);
themeToggle.addEventListener("click", () => {
  const next = html.getAttribute("data-theme") === "light" ? "dark" : "light";
  html.setAttribute("data-theme", next);
  localStorage.setItem("theme", next);
});

// ── Search bar (injected above task list) ──
const searchBar = document.createElement("input");
searchBar.className = "search-bar";
searchBar.placeholder = "Search tasks...";
searchBar.setAttribute("aria-label", "Search tasks");
taskList.parentElement.insertBefore(searchBar, taskList);
searchBar.addEventListener("input", filterTasks);

function filterTasks() {
  const q = searchBar.value.trim().toLowerCase();
  document.querySelectorAll(".task-item").forEach(li => {
    const label = li.querySelector(".task-label")?.textContent.toLowerCase() || "";
    li.classList.toggle("hidden", q !== "" && !label.includes(q));
  });
}

// ── Persistence helpers ──
function saveTasks() {
  const tasks = [];
  document.querySelectorAll(".task-item").forEach(li => {
    const subtasks = [];
    li.querySelectorAll(".subtask-item").forEach(sub => {
      subtasks.push({
        text:    sub.querySelector(".subtask-label").textContent,
        checked: sub.querySelector(".subtask-checkbox").checked
      });
    });
    tasks.push({
      text:     li.querySelector(".task-label").textContent,
      done:     li.classList.contains("done"),
      priority: li.dataset.priority || "none",
      due:      li.querySelector(".due-date-input")?.value || "",
      subtasks
    });
  });
  localStorage.setItem("todos", JSON.stringify(tasks));
}

function loadTasks() {
  const saved = localStorage.getItem("todos");
  if (!saved) return;
  JSON.parse(saved).forEach(t => {
    addTask(t.text, t.done, t.priority, t.due);
    const li      = taskList.lastElementChild;
    const subList = li.querySelector(".subtask-list");
    t.subtasks.forEach(s => {
      addSubtask({ value: s.text }, subList, li, s.checked);
    });
  });
}

// ── Add Task ──
addBtn.addEventListener("click", () => addTask());
input.addEventListener("keypress", e => { if (e.key === "Enter") addTask(); });

const PRIORITIES = ["none", "high", "medium", "low"];
const PRIORITY_LABELS = { none: "Priority", high: "High", medium: "Medium", low: "Low" };

function addTask(taskText, isDone = false, priority = "none", dueVal = "") {
  taskText = taskText ?? input.value.trim();
  if (taskText === "") return;

  const li = document.createElement("li");
  li.classList.add("task-item");
  if (isDone) li.classList.add("done");
  li.dataset.priority = priority;

  // ── Drag handle ──
  const dragHandle = document.createElement("span");
  dragHandle.className = "drag-handle";
  dragHandle.textContent = "⠿";
  dragHandle.setAttribute("title", "Drag to reorder");
  setupDrag(li, dragHandle);

  // ── Top row ──
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
  span.addEventListener("click", () => {
    li.classList.toggle("done");
    saveTasks();
  });

  // ── Priority badge ──
  const badge = document.createElement("span");
  badge.className = `priority-badge priority-${priority}`;
  badge.textContent = PRIORITY_LABELS[priority];
  badge.addEventListener("click", e => {
    e.stopPropagation();
    const idx  = PRIORITIES.indexOf(li.dataset.priority);
    const next = PRIORITIES[(idx + 1) % PRIORITIES.length];
    li.dataset.priority    = next;
    badge.className        = `priority-badge priority-${next}`;
    badge.textContent      = PRIORITY_LABELS[next];
    saveTasks();
  });

  // ── Due date ──
  const dueInput = document.createElement("input");
  dueInput.type      = "date";
  dueInput.className = "due-date-input";
  dueInput.value     = dueVal;
  checkOverdue(dueInput);
  dueInput.addEventListener("change", () => { checkOverdue(dueInput); saveTasks(); }); 
  // ── Edit button ──
const editBtn = document.createElement("button");
editBtn.className = "edit-btn";
editBtn.textContent = "✏️";

editBtn.addEventListener("click", e => {
  e.stopPropagation();

  const currentText = span.textContent;

  const inputField = document.createElement("input");
  inputField.type = "text";
  inputField.value = currentText;
  inputField.className = "edit-input";

  // Replace text with input
  topRow.replaceChild(inputField, span);
  inputField.focus();

  function saveEdit() {
    const newText = inputField.value.trim();
    if (newText !== "") {
      span.textContent = newText;
    }
    topRow.replaceChild(span, inputField);
    saveTasks();
  }

  // Save on Enter
  inputField.addEventListener("keypress", e => {
    if (e.key === "Enter") saveEdit();
  });

  // Save on blur
  inputField.addEventListener("blur", saveEdit);
});


  // ── Delete ──
  const delBtn = document.createElement("button");
  delBtn.className   = "delete-btn";
  delBtn.textContent = "❌";
  delBtn.addEventListener("click", e => { e.stopPropagation(); li.remove(); saveTasks(); });

  topRow.appendChild(dragHandle);
  topRow.appendChild(chevron);
  topRow.appendChild(span);
  topRow.appendChild(badge);
  topRow.appendChild(dueInput);
  topRow.appendChild(editBtn);
  topRow.appendChild(delBtn);

  // ── Subtask section ──
  const subtaskSection  = document.createElement("div");
  subtaskSection.className = "subtask-section";
  const subtaskList     = document.createElement("ul");
  subtaskList.className = "subtask-list";
  const subtaskInputRow = document.createElement("div");
  subtaskInputRow.className = "subtask-input-row";
  const subtaskInput    = document.createElement("input");
  subtaskInput.className   = "subtask-input";
  subtaskInput.placeholder = "Add a subtask...";
  subtaskInput.addEventListener("keypress", e => {
    if (e.key === "Enter") addSubtask(subtaskInput, subtaskList, li);
  });
  const subtaskAddBtn   = document.createElement("button");
  subtaskAddBtn.className   = "subtask-add-btn";
  subtaskAddBtn.textContent = "+";
  subtaskAddBtn.addEventListener("click", () => addSubtask(subtaskInput, subtaskList, li));

  subtaskInputRow.appendChild(subtaskInput);
  subtaskInputRow.appendChild(subtaskAddBtn);
  subtaskSection.appendChild(subtaskList);
  subtaskSection.appendChild(subtaskInputRow);

  // ── Chevron toggle ──
  let expanded = false;
  chevron.addEventListener("click", e => {
    e.stopPropagation();
    expanded = !expanded;
    subtaskSection.classList.toggle("open", expanded);
    chevron.classList.toggle("rotated", expanded);
    if (expanded) subtaskInput.focus();
  });

  // ── Progress bar ──
  const progressTrack = document.createElement("div");
  progressTrack.className = "progress-track";
  const progressFill  = document.createElement("div");
  progressFill.className = "progress-bar-fill";
  progressTrack.appendChild(progressFill);
  const progressLabel = document.createElement("div");
  progressLabel.className = "progress-label";

  li.appendChild(topRow);
  li.appendChild(progressTrack);
  li.appendChild(progressLabel);
  li.appendChild(subtaskSection);
  taskList.appendChild(li);

  if (!taskText.startsWith("__load")) {
    input.value = "";
    input.focus();
  }
  saveTasks();
}

function checkOverdue(dueInput) {
  if (!dueInput.value) return;
  const today = new Date().toISOString().split("T")[0];
  dueInput.classList.toggle("due-overdue", dueInput.value < today);
}

// ── Add Subtask ──
function addSubtask(subtaskInput, subtaskList, parentLi, checked = false) {
  const text = typeof subtaskInput === "string"
    ? subtaskInput : subtaskInput.value.trim();
  if (text === "") return;

  const subLi     = document.createElement("li");
  subLi.className = "subtask-item";

  const checkbox     = document.createElement("input");
  checkbox.type      = "checkbox";
  checkbox.className = "subtask-checkbox";
  checkbox.checked   = checked;
  if (checked) subLi.classList.add("subtask-done");
  checkbox.addEventListener("change", () => {
    subLi.classList.toggle("subtask-done", checkbox.checked);
    updateParentProgress(subtaskList, parentLi);
    saveTasks();
  });

  const subLabel     = document.createElement("span");
  subLabel.className = "subtask-label";
  subLabel.textContent = text;

  const subDel     = document.createElement("button");
  subDel.className = "subtask-delete-btn";
  subDel.textContent = "✕";
  subDel.addEventListener("click", e => {
    e.stopPropagation();
    subLi.remove();
    updateParentProgress(subtaskList, parentLi);
    saveTasks();
  });

  subLi.appendChild(checkbox);
  subLi.appendChild(subLabel);
  subLi.appendChild(subDel);
  subtaskList.appendChild(subLi);

  if (typeof subtaskInput !== "string") {
    subtaskInput.value = "";
    subtaskInput.focus();
  }
  updateParentProgress(subtaskList, parentLi);
  saveTasks();
}

// ── Progress ──
function updateParentProgress(subtaskList, parentLi) {
  const all  = subtaskList.querySelectorAll(".subtask-item");
  const done = subtaskList.querySelectorAll(".subtask-done");
  const bar  = parentLi.querySelector(".progress-bar-fill");
  const lbl  = parentLi.querySelector(".progress-label");
  if (!bar) return;
  if (all.length === 0) { bar.style.width = "0%"; lbl.textContent = ""; return; }
  const pct = Math.round((done.length / all.length) * 100);
  bar.style.width   = pct + "%";
  lbl.textContent   = `${done.length}/${all.length}`;
  parentLi.classList.toggle("done", pct === 100);
}

// ── Drag & Drop ──
let dragSrc = null;
function setupDrag(li, handle) {
  handle.addEventListener("mousedown", () => { li.draggable = true; });
  handle.addEventListener("mouseup",   () => { li.draggable = false; });

  li.addEventListener("dragstart", e => {
    dragSrc = li;
    li.classList.add("dragging");
    e.dataTransfer.effectAllowed = "move";
  });
  li.addEventListener("dragend", () => {
    li.draggable = false;
    li.classList.remove("dragging");
    document.querySelectorAll(".task-item").forEach(t => t.classList.remove("drag-over"));
    saveTasks();
  });
  li.addEventListener("dragover", e => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (li !== dragSrc) {
      document.querySelectorAll(".task-item").forEach(t => t.classList.remove("drag-over"));
      li.classList.add("drag-over");
    }
  });
  li.addEventListener("drop", e => {
    e.preventDefault();
    if (dragSrc && dragSrc !== li) {
      const items   = [...taskList.querySelectorAll(".task-item")];
      const srcIdx  = items.indexOf(dragSrc);
      const dstIdx  = items.indexOf(li);
      if (srcIdx < dstIdx) li.after(dragSrc);
      else                  li.before(dragSrc);
    }
  });
}

// ── Boot ──
loadTasks();