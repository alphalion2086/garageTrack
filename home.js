// Create vehicle/item entry
//Add items to my garage
// Add Maintence to items in my garage
// Add upcoming dues for vehicles
// Manage vehicle details including previous maintenance

const STORAGE_KEY = "vehicle-app-fleet";

const state = {
  vehicles: loadVehicles(),
  editingId: null,
  detailsId: null,
  expandedMaintenanceId: null,
  query: "",
};

const refs = {
  form: document.getElementById("vehicleForm"),
  formTitle: document.getElementById("formTitle"),
  saveButton: document.getElementById("saveButton"),
  cancelEdit: document.getElementById("cancelEdit"),
  message: document.getElementById("message"),
  make: document.getElementById("make"),
  model: document.getElementById("model"),
  year: document.getElementById("year"),
  type: document.getElementById("type"),
  list: document.getElementById("vehicleList"),
  emptyState: document.getElementById("emptyState"),
  totalVehicles: document.getElementById("totalVehicles"),
  latestYear: document.getElementById("latestYear"),
  search: document.getElementById("search"),
};

refs.form.addEventListener("submit", onSubmit);
refs.cancelEdit.addEventListener("click", resetForm);
refs.search.addEventListener("input", onSearch);
refs.list.addEventListener("click", onListClick);

render();

function onSubmit(event) {
  event.preventDefault();

  const make = refs.make.value.trim();
  const model = refs.model.value.trim();
  const year = Number(refs.year.value);
  const type = normalizeVehicleType(refs.type.value);

  if (!make || !model || !Number.isInteger(year)) {
    setMessage("Please enter a valid make, model, and year.", true);
    return;
  }

  if (state.editingId === null) {
    state.vehicles.push({
      id: createId(),
      make,
      model,
      year,
      type,
      maintenance: [],
    });
    setMessage("Vehicle added.");

    // Reset filtering so the newly saved vehicle is immediately visible.
    state.query = "";
    refs.search.value = "";
  } else {
    const vehicle = state.vehicles.find((item) => item.id === state.editingId);
    if (!vehicle) {
      setMessage("Vehicle not found.", true);
      return;
    }

    vehicle.make = make;
    vehicle.model = model;
    vehicle.year = year;
    vehicle.type = type;
    setMessage("Vehicle updated.");
  }

  persistVehicles();
  resetForm(false);
  render();
}

function onSearch(event) {
  state.query = event.target.value.trim().toLowerCase();
  render();
}

function onListClick(event) {
  const target = event.target;
  if (!(target instanceof HTMLButtonElement)) {
    return;
  }

  const id = Number(target.dataset.id);
  if (!Number.isInteger(id)) {
    return;
  }

  if (target.dataset.action === "edit") {
    startEdit(id);
    return;
  }

  if (target.dataset.action === "delete") {
    removeVehicle(id);
    return;
  }

  if (target.dataset.action === "details") {
    toggleDetails(id);
    return;
  }

  if (target.dataset.action === "show-more-maintenance") {
    toggleMaintenanceView(id);
    return;
  }

  if (target.dataset.action === "maintenance-save") {
    saveMaintenance(id, target);
    return;
  }

  if (target.dataset.action === "maintenance-remove") {
    removeMaintenanceEntry(id, Number(target.dataset.entryId));
    return;
  }

  if (target.dataset.action === "upcoming-due-save") {
    saveUpcomingDue(id, target);
    return;
  }

  if (target.dataset.action === "upcoming-due-remove") {
    removeUpcomingDueEntry(id, Number(target.dataset.entryId));
    return;
  }

  if (target.dataset.action === "upcoming-dues") {
    toggleUpcomingDues(id);
    return;
  }

  if (target.dataset.action === "loan-plan-save") {
    saveLoanPlan(id, target);
    return;
  }

  if (target.dataset.action === "loan-payment-save") {
    saveLoanPayment(id, target);
    return;
  }
}

function startEdit(id) {
  const vehicle = state.vehicles.find((item) => item.id === id);
  if (!vehicle) {
    setMessage("Vehicle not found.", true);
    return;
  }

  state.editingId = id;
  refs.formTitle.textContent = "Edit Vehicle";
  refs.saveButton.textContent = "Update Vehicle";
  refs.cancelEdit.hidden = false;
  refs.make.value = vehicle.make;
  refs.model.value = vehicle.model;
  refs.year.value = String(vehicle.year);
  refs.type.value = normalizeVehicleType(vehicle.type);
  refs.make.focus();
}

function removeVehicle(id) {
  const initialCount = state.vehicles.length;
  state.vehicles = state.vehicles.filter((item) => item.id !== id);

  if (state.vehicles.length === initialCount) {
    setMessage("Vehicle not found.", true);
    return;
  }

  if (state.editingId === id) {
    resetForm(false);
  }

  persistVehicles();
  setMessage("Vehicle removed.");
  render();
}

function toggleDetails(id) {
  state.detailsId = state.detailsId === id ? null : id;
  state.expandedMaintenanceId = null;
  render();
}

function toggleMaintenanceView(id) {
  state.detailsId = id;
  state.expandedMaintenanceId = state.expandedMaintenanceId === id ? null : id;
  render();
}

function toggleUpcomingDues(id) {
  state.detailsId = id;
  render();
}

function saveUpcomingDue(id, button) {
  const vehicle = state.vehicles.find((item) => item.id === id);
  if (!vehicle) {
    setMessage("Vehicle not found.", true);
    return;
  }

  const item = button.closest(".vehicle-item");
  if (!item) {
    return;
  }

  const titleField = item.querySelector('[data-field="upcoming-due-title"]');
  const costField = item.querySelector('[data-field="upcoming-due-cost"]');
  const dueDateField = item.querySelector('[data-field="upcoming-due-date"]');
  const notesField = item.querySelector('[data-field="upcoming-due-notes"]');

  const title =
    titleField instanceof HTMLInputElement ? titleField.value.trim() : "";
  const cost =
    costField instanceof HTMLInputElement ? Number(costField.value) : NaN;
  const dueDate =
    dueDateField instanceof HTMLInputElement ? dueDateField.value.trim() : "";
  const notes =
    notesField instanceof HTMLTextAreaElement ? notesField.value.trim() : "";

  if (!title) {
    setMessage("Enter an upcoming due title first.", true);
    return;
  }

  if (!Number.isFinite(cost) || cost < 0) {
    setMessage("Enter a valid non-negative cost.", true);
    return;
  }

  if (!Array.isArray(vehicle.upcomingDues)) {
    vehicle.upcomingDues = [];
  }

  vehicle.upcomingDues.push({
    id: createId(),
    title,
    cost,
    dueDate,
    notes,
    date: new Date().toLocaleDateString(),
  });

  if (titleField instanceof HTMLInputElement) {
    titleField.value = "";
  }
  if (costField instanceof HTMLInputElement) {
    costField.value = "";
  }
  if (dueDateField instanceof HTMLInputElement) {
    dueDateField.value = "";
  }
  if (notesField instanceof HTMLTextAreaElement) {
    notesField.value = "";
  }

  state.detailsId = id;
  persistVehicles();
  setMessage("Upcoming due saved.");
  render();
}

function removeUpcomingDueEntry(id, entryId) {
  const vehicle = state.vehicles.find((item) => item.id === id);
  if (!vehicle) {
    setMessage("Vehicle not found.", true);
    return;
  }

  if (!Array.isArray(vehicle.upcomingDues)) {
    vehicle.upcomingDues = [];
  }

  const initialLength = vehicle.upcomingDues.length;
  vehicle.upcomingDues = vehicle.upcomingDues.filter(
    (entry) => entry.id !== entryId,
  );

  if (vehicle.upcomingDues.length === initialLength) {
    setMessage("Upcoming due entry not found.", true);
    return;
  }

  persistVehicles();
  setMessage("Upcoming due removed.");
  render();
}

function removeMaintenanceEntry(id, entryId) {
  const vehicle = state.vehicles.find((item) => item.id === id);
  if (!vehicle) {
    setMessage("Vehicle not found.", true);
    return;
  }

  if (!Array.isArray(vehicle.maintenance)) {
    vehicle.maintenance = [];
  }

  const initialLength = vehicle.maintenance.length;
  vehicle.maintenance = vehicle.maintenance.filter(
    (entry) => entry.id !== entryId,
  );

  if (vehicle.maintenance.length === initialLength) {
    setMessage("Maintenance entry not found.", true);
    return;
  }

  persistVehicles();
  setMessage("Maintenance removed.");
  render();
}

function saveLoanPlan(id, button) {
  const vehicle = state.vehicles.find((item) => item.id === id);
  if (!vehicle) {
    setMessage("Vehicle not found.", true);
    return;
  }

  const item = button.closest(".vehicle-item");
  if (!item) {
    return;
  }

  const amountField = item.querySelector('[data-field="loan-amount"]');
  const rateField = item.querySelector('[data-field="loan-rate"]');
  const termField = item.querySelector('[data-field="loan-term"]');

  const amount =
    amountField instanceof HTMLInputElement ? Number(amountField.value) : NaN;
  const rate =
    rateField instanceof HTMLInputElement ? Number(rateField.value) : NaN;
  const term =
    termField instanceof HTMLInputElement ? Number(termField.value) : NaN;

  if (!Number.isFinite(amount) || amount <= 0) {
    setMessage("Enter a valid loan amount.", true);
    return;
  }

  if (!Number.isFinite(rate) || rate < 0) {
    setMessage("Enter a valid interest rate.", true);
    return;
  }

  if (!Number.isInteger(term) || term <= 0) {
    setMessage("Enter a valid number of months.", true);
    return;
  }

  vehicle.loanPlan = {
    id: createId(),
    loanAmount: Number(amount.toFixed(2)),
    annualInterestRate: Number(rate.toFixed(2)),
    termMonths: Number(term),
    monthlyPayment: Number(
      (
        (amount * (rate / 100 / 12)) /
        (1 - Math.pow(1 + rate / 100 / 12, -term))
      ).toFixed(2),
    ),
    balance: Number(amount.toFixed(2)),
    payments: [],
    createdAt: new Date().toLocaleDateString(),
  };

  if (amountField instanceof HTMLInputElement) amountField.value = "";
  if (rateField instanceof HTMLInputElement) rateField.value = "";
  if (termField instanceof HTMLInputElement) termField.value = "";

  state.detailsId = id;
  persistVehicles();
  setMessage("Loan plan saved.");
  render();
}

function saveLoanPayment(id, button) {
  const vehicle = state.vehicles.find((item) => item.id === id);
  if (!vehicle) {
    setMessage("Vehicle not found.", true);
    return;
  }

  const item = button.closest(".vehicle-item");
  if (!item) {
    return;
  }

  const amountField = item.querySelector('[data-field="loan-payment-amount"]');
  const paymentAmount =
    amountField instanceof HTMLInputElement ? Number(amountField.value) : NaN;

  if (!vehicle.loanPlan) {
    setMessage("Create a loan plan first.", true);
    return;
  }

  if (!Number.isFinite(paymentAmount) || paymentAmount <= 0) {
    setMessage("Enter a valid payment amount.", true);
    return;
  }

  const interestPortion =
    vehicle.loanPlan.balance * (vehicle.loanPlan.annualInterestRate / 12 / 100);
  const principalPortion = paymentAmount - interestPortion;
  const balanceAfterPayment = Math.max(
    vehicle.loanPlan.balance - principalPortion,
    0,
  );

  const paymentEntry = {
    id: createId(),
    paymentAmount: Number(paymentAmount.toFixed(2)),
    interestPortion: Number(interestPortion.toFixed(2)),
    principalPortion: Number(principalPortion.toFixed(2)),
    balanceAfterPayment: Number(balanceAfterPayment.toFixed(2)),
    paidAt: new Date().toLocaleDateString(),
  };

  vehicle.loanPlan.payments.push(paymentEntry);
  vehicle.loanPlan.balance = paymentEntry.balanceAfterPayment;

  if (amountField instanceof HTMLInputElement) amountField.value = "";

  state.detailsId = id;
  persistVehicles();
  setMessage("Loan payment recorded.");
  render();
}

function saveMaintenance(id, button) {
  const vehicle = state.vehicles.find((item) => item.id === id);
  if (!vehicle) {
    setMessage("Vehicle not found.", true);
    return;
  }

  const item = button.closest(".vehicle-item");
  if (!item) {
    return;
  }

  const titleField = item.querySelector('[data-field="maintenance-title"]');
  const notesField = item.querySelector('[data-field="maintenance-notes"]');
  const title =
    titleField instanceof HTMLInputElement ? titleField.value.trim() : "";
  const notes =
    notesField instanceof HTMLTextAreaElement ? notesField.value.trim() : "";

  if (!title) {
    setMessage("Enter a maintenance title first.", true);
    return;
  }

  if (!Array.isArray(vehicle.maintenance)) {
    vehicle.maintenance = [];
  }

  vehicle.maintenance.push({
    id: createId(),
    title,
    notes,
    date: new Date().toLocaleDateString(),
  });

  if (titleField instanceof HTMLInputElement) {
    titleField.value = "";
  }

  if (notesField instanceof HTMLTextAreaElement) {
    notesField.value = "";
  }

  state.detailsId = id;
  persistVehicles();
  setMessage("Maintenance saved.");
  render();
}

function resetForm(clearMessage = true) {
  refs.form.reset();
  state.editingId = null;
  refs.formTitle.textContent = "Add Vehicle";
  refs.saveButton.textContent = "Save Vehicle";
  refs.cancelEdit.hidden = true;

  if (clearMessage) {
    setMessage("");
  }
}

function render() {
  const filtered = state.vehicles.filter((item) => {
    const combined =
      `${item.make} ${item.model} ${getVehicleTypeLabel(item.type)}`.toLowerCase();
    return combined.includes(state.query);
  });

  refs.list.innerHTML = filtered
    .map(
      (item) => `
                <li class="vehicle-item">
                    <div class="vehicle-meta">
                        <strong class="vehicle-title">${escapeHtml(item.make)} ${escapeHtml(item.model)}</strong>
                        <p class="vehicle-subtitle">${escapeHtml(getVehicleTypeLabel(item.type))} • Year: ${item.year}</p>
                    </div>
                    <div class="item-actions">
            <button class="icon-btn" data-action="details" data-id="${item.id}" type="button">Details</button>
                        <button class="icon-btn" data-action="edit" data-id="${item.id}" type="button">Edit</button>
                        <button class="icon-btn delete" data-action="delete" data-id="${item.id}" type="button">Delete</button>
                    </div>
          ${renderMaintenanceDetails(item)}
                </li>
            `,
    )
    .join("");

  refs.emptyState.hidden = filtered.length > 0;
  refs.totalVehicles.textContent = String(state.vehicles.length);

  if (state.vehicles.length === 0) {
    refs.latestYear.textContent = "--";
  } else {
    const latest = Math.max(...state.vehicles.map((item) => item.year));
    refs.latestYear.textContent = String(latest);
  }
}

function persistVehicles() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.vehicles));
}

function loadVehicles() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .filter(
        (item) =>
          item &&
          Number.isInteger(item.id) &&
          typeof item.make === "string" &&
          typeof item.model === "string" &&
          Number.isInteger(item.year),
      )
      .map((item) => ({
        ...item,
        type: normalizeVehicleType(item.type),
        maintenance: Array.isArray(item.maintenance)
          ? item.maintenance.filter(
              (entry) =>
                entry &&
                typeof entry.title === "string" &&
                typeof entry.date === "string",
            )
          : [],
      }));
  } catch {
    return [];
  }
}

function createId() {
  return Math.floor(Date.now() + Math.random() * 1000);
}

function setMessage(message, isError = false) {
  refs.message.textContent = message;
  refs.message.style.color = isError ? "#b23824" : "#0f6b5f";
}

function normalizeVehicleType(type) {
  const value = String(type ?? "car")
    .trim()
    .toLowerCase();
  const supportedTypes = ["car", "motorcycle", "truck", "van", "boat", "other"];

  return supportedTypes.includes(value) ? value : "other";
}

function getVehicleTypeLabel(type) {
  switch (normalizeVehicleType(type)) {
    case "motorcycle":
      return "Motorcycle";
    case "truck":
      return "Truck";
    case "van":
      return "Van";
    case "boat":
      return "Boat";
    case "other":
      return "Other";
    default:
      return "Car";
  }
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderMaintenanceDetails(vehicle) {
  const isOpen = state.detailsId === vehicle.id;
  const maintenanceEntries = Array.isArray(vehicle.maintenance)
    ? vehicle.maintenance
    : [];
  const duesEntries = Array.isArray(vehicle.upcomingDues)
    ? vehicle.upcomingDues
    : [];
  const loanPlan = vehicle.loanPlan;
  const loanPayments =
    loanPlan && Array.isArray(loanPlan.payments) ? loanPlan.payments : [];
  const showAll = state.expandedMaintenanceId === vehicle.id;
  const visibleEntries = showAll
    ? maintenanceEntries.slice().reverse()
    : maintenanceEntries.slice(-3).reverse();

  return `
    <div class="vehicle-details" ${isOpen ? "" : "hidden"}>
      <h3>Loan Tracker</h3>
      <div class="maintenance-compose">
        <input data-field="loan-amount" type="number" min="0" step="0.01" placeholder="Loan amount" aria-label="Loan amount" />
        <input data-field="loan-rate" type="number" min="0" step="0.01" placeholder="Annual interest rate (%)" aria-label="Annual interest rate" />
        <input data-field="loan-term" type="number" min="1" step="1" placeholder="Term in months" aria-label="Loan term in months" />
        <ul class="carDetailInfo">
          <button class="btn btn-primary maintenance-save" data-action="loan-plan-save" data-id="${vehicle.id}" type="button">Save Loan Plan</button>
        </ul>
      </div>
      <div class="maintenance-compose">
        <input data-field="loan-payment-amount" type="number" min="0" step="0.01" placeholder="Monthly payment amount" aria-label="Monthly payment amount" />
        <ul class="carDetailInfo">
          <button class="btn btn-primary maintenance-save" data-action="loan-payment-save" data-id="${vehicle.id}" type="button">Record Payment</button>
        </ul>
      </div>
      ${
        loanPlan
          ? `
        <div class="loan-summary">
          <p><strong>Principal:</strong> $${escapeHtml(String(loanPlan.loanAmount))}</p>
          <p><strong>Interest Rate:</strong> ${escapeHtml(String(loanPlan.annualInterestRate))}%</p>
          <p><strong>Monthly Payment:</strong> $${escapeHtml(String(loanPlan.monthlyPayment))}</p>
          <p><strong>Remaining Balance:</strong> $${escapeHtml(String(loanPlan.balance))}</p>
        </div>
      `
          : `<p class="vehicle-subtitle">No loan plan created yet.</p>`
      }
      ${
        loanPayments.length > 0
          ? `
        <h3>Payment History</h3>
        <ul class="maintenance-list">
          ${loanPayments
            .map(
              (entry) => `
                <li>
                  <div class="maintenance-entry-header">
                    <div>
                      <strong>Payment $${escapeHtml(String(entry.paymentAmount))}</strong>
                      <span>${escapeHtml(entry.paidAt || "Recent")}</span>
                      <p>Principal: $${escapeHtml(String(entry.principalPortion))}</p>
                      <p>Interest: $${escapeHtml(String(entry.interestPortion))}</p>
                      <p>Balance: $${escapeHtml(String(entry.balanceAfterPayment))}</p>
                    </div>
                  </div>
                </li>
              `,
            )
            .join("")}
        </ul>
      `
          : ""
      }
      <h3>Maintenance</h3>
      <div class="maintenance-compose">
        <input data-field="maintenance-title" type="text" placeholder="Maintenance title" aria-label="Maintenance title" />
        <textarea data-field="maintenance-notes" rows="2" placeholder="Notes" aria-label="Maintenance notes"></textarea>
        <ul class = "carDetailInfo">
        <button class="btn btn-primary maintenance-save" data-action="maintenance-save" data-id="${vehicle.id}" type="button">Save Maintenance</button>
        <button class="btn btn-primary maintenance-save" data-action="upcoming-dues" data-id="${vehicle.id}" type="button">Upcoming Dues</button>
        </ul>
      </div>
      ${
        visibleEntries.length > 0
          ? `
          <ul class="maintenance-list">
            ${visibleEntries
              .map(
                (entry) => `
                  <li>
                    <div class="maintenance-entry-header">
                      <div>
                        <strong>${escapeHtml(entry.title)}</strong>
                        <span>${escapeHtml(entry.date || "Recent")}</span>
                        ${entry.notes ? `<p>${escapeHtml(entry.notes)}</p>` : ""}
                      </div>
                      <button class="icon-btn delete" data-action="maintenance-remove" data-entry-id="${entry.id}" data-id="${vehicle.id}" type="button">Remove</button>
                    </div>
                  </li>
                `,
              )
              .join("")} 
          </ul>
        `
          : `<p class="vehicle-subtitle">${showAll ? "No maintenance recorded yet." : "No recent maintenance recorded yet."}</p>`
      }
      <h3>Upcoming Dues</h3>
      <div class="maintenance-compose">
        <input data-field="upcoming-due-title" type="text" placeholder="Due title" aria-label="Upcoming due title" />
        <input data-field="upcoming-due-cost" type="number" min="0" step="0.01" placeholder="Cost" aria-label="Upcoming due cost" />
        <input data-field="upcoming-due-date" type="date" aria-label="Renewal date" />
        <textarea data-field="upcoming-due-notes" rows="2" placeholder="Notes" aria-label="Upcoming due notes"></textarea>
        <ul class = "carDetailInfo">
          <button class="btn btn-primary maintenance-save" data-action="upcoming-due-save" data-id="${vehicle.id}" type="button">Save Due</button>
        </ul>
      </div>
      ${
        duesEntries.length > 0
          ? `
          <ul class="maintenance-list">
            ${duesEntries
              .map(
                (entry) => `
                  <li>
                    <div class="maintenance-entry-header">
                      <div>
                        <strong>${escapeHtml(entry.title)}</strong>
                        <span>${escapeHtml(entry.date || "Recent")}</span>
                        ${entry.dueDate ? `<p>Renewal: ${escapeHtml(entry.dueDate)}</p>` : ""}
                        ${entry.cost !== undefined && entry.cost !== null ? `<p>Cost: $${escapeHtml(String(entry.cost))}</p>` : ""}
                        ${entry.notes ? `<p>${escapeHtml(entry.notes)}</p>` : ""}
                      </div>
                      <button class="icon-btn delete" data-action="upcoming-due-remove" data-entry-id="${entry.id}" data-id="${vehicle.id}" type="button">Remove</button>
                    </div>
                  </li>
                `,
              )
              .join("")} 
          </ul>
        `
          : `<p class="vehicle-subtitle">No upcoming dues recorded yet.</p>`
      }
    </div>
  `;
}
