const vehicles = [];

class Vehicle {
  constructor(make, model, year, type = "car") {
    if (!make || !model || !Number.isInteger(year)) {
      throw new Error("Invalid input. Provide make, model, and a year.");
    }

    this.id = Date.now();
    this.make = String(make).trim();
    this.model = String(model).trim();
    this.year = year;
    this.type = normalizeType(type);
    this.maintenance = [];
    this.upcomingDues = [];
    this.loanPlan = null;
  }
}

function normalizeType(type) {
  const value = String(type ?? "car")
    .trim()
    .toLowerCase();
  const supportedTypes = ["car", "motorcycle", "truck", "van", "boat", "other"];

  return supportedTypes.includes(value) ? value : "other";
}

function createVehicle(
  makeOrType,
  modelOrMake,
  yearOrModel,
  typeOrYear = "car",
) {
  let make = makeOrType;
  let model = modelOrMake;
  let year = yearOrModel;
  let type = typeOrYear;

  if (
    typeof makeOrType === "string" &&
    typeof modelOrMake === "string" &&
    typeof yearOrModel === "string" &&
    Number.isInteger(typeOrYear)
  ) {
    type = makeOrType;
    make = modelOrMake;
    model = yearOrModel;
    year = typeOrYear;
  }

  return new Vehicle(make, model, year, type);
}

function addVehicle(make, model, year, type = "car") {
  const vehicle = createVehicle(make, model, year, type);
  vehicles.push(vehicle);
  return vehicle;
}

function editVehicle(id, updates) {
  const vehicle = vehicles.find((item) => item.id === id);

  if (!vehicle) {
    throw new Error("Vehicle not found.");
  }

  if (updates.make !== undefined) {
    vehicle.make = String(updates.make).trim();
  }

  if (updates.model !== undefined) {
    vehicle.model = String(updates.model).trim();
  }

  if (updates.year !== undefined) {
    if (!Number.isInteger(updates.year)) {
      throw new Error("Year must be an integer.");
    }
    vehicle.year = updates.year;
  }

  if (updates.type !== undefined) {
    vehicle.type = normalizeType(updates.type);
  }

  if (Array.isArray(updates.maintenance)) {
    vehicle.maintenance = updates.maintenance;
  }

  if (Array.isArray(updates.upcomingDues)) {
    vehicle.upcomingDues = updates.upcomingDues;
  }

  return vehicle;
}

function logMaintenance(
  id,
  title,
  notes = "",
  date = new Date().toISOString(),
) {
  const vehicle = vehicles.find((item) => item.id === id);

  if (!vehicle) {
    throw new Error("Vehicle not found.");
  }

  if (!title || !String(title).trim()) {
    throw new Error("Maintenance title is required.");
  }

  if (!Array.isArray(vehicle.maintenance)) {
    vehicle.maintenance = [];
  }

  const entry = {
    id: Date.now(),
    title: String(title).trim(),
    notes: String(notes).trim(),
    date,
  };

  vehicle.maintenance.push(entry);
  return entry;
}

function removeMaintenance(id, entryId) {
  const vehicle = vehicles.find((item) => item.id === id);

  if (!vehicle) {
    throw new Error("Vehicle not found.");
  }

  if (!Array.isArray(vehicle.maintenance)) {
    vehicle.maintenance = [];
  }

  const index = vehicle.maintenance.findIndex((entry) => entry.id === entryId);

  if (index === -1) {
    throw new Error("Maintenance entry not found.");
  }

  const [removedEntry] = vehicle.maintenance.splice(index, 1);
  return removedEntry;
}

function logUpcomingDue(id, title, cost = 0, dueDate = "", notes = "") {
  const vehicle = vehicles.find((item) => item.id === id);

  if (!vehicle) {
    throw new Error("Vehicle not found.");
  }

  if (!title || !String(title).trim()) {
    throw new Error("Upcoming due title is required.");
  }

  const numericCost = Number(cost);
  if (!Number.isFinite(numericCost) || numericCost < 0) {
    throw new Error("Cost must be a non-negative number.");
  }

  if (!Array.isArray(vehicle.upcomingDues)) {
    vehicle.upcomingDues = [];
  }

  const entry = {
    id: Date.now(),
    title: String(title).trim(),
    cost: numericCost,
    dueDate: String(dueDate ?? "").trim(),
    notes: String(notes ?? "").trim(),
    date: new Date().toISOString(),
  };

  vehicle.upcomingDues.push(entry);
  return entry;
}

function removeUpcomingDue(id, entryId) {
  const vehicle = vehicles.find((item) => item.id === id);

  if (!vehicle) {
    throw new Error("Vehicle not found.");
  }

  if (!Array.isArray(vehicle.upcomingDues)) {
    vehicle.upcomingDues = [];
  }

  const index = vehicle.upcomingDues.findIndex((entry) => entry.id === entryId);

  if (index === -1) {
    throw new Error("Upcoming due entry not found.");
  }

  const [removedEntry] = vehicle.upcomingDues.splice(index, 1);
  return removedEntry;
}

function createLoanPlan(id, loanAmount, annualInterestRate, termMonths) {
  const vehicle = vehicles.find((item) => item.id === id);

  if (!vehicle) {
    throw new Error("Vehicle not found.");
  }

  const numericLoanAmount = Number(loanAmount);
  const numericAnnualInterestRate = Number(annualInterestRate);
  const numericTermMonths = Number(termMonths);

  if (!Number.isFinite(numericLoanAmount) || numericLoanAmount <= 0) {
    throw new Error("Loan amount must be greater than zero.");
  }

  if (
    !Number.isFinite(numericAnnualInterestRate) ||
    numericAnnualInterestRate < 0
  ) {
    throw new Error("Annual interest rate must be non-negative.");
  }

  if (!Number.isInteger(numericTermMonths) || numericTermMonths <= 0) {
    throw new Error("Term months must be a positive integer.");
  }

  const monthlyRate = numericAnnualInterestRate / 12 / 100;
  const monthlyPayment =
    monthlyRate === 0
      ? numericLoanAmount / numericTermMonths
      : (numericLoanAmount * monthlyRate) /
        (1 - Math.pow(1 + monthlyRate, -numericTermMonths));

  vehicle.loanPlan = {
    id: Date.now(),
    loanAmount: numericLoanAmount,
    annualInterestRate: numericAnnualInterestRate,
    termMonths: numericTermMonths,
    monthlyPayment: Number(monthlyPayment.toFixed(2)),
    balance: numericLoanAmount,
    payments: [],
    createdAt: new Date().toISOString(),
  };

  return vehicle.loanPlan;
}

function recordLoanPayment(id, paymentAmount) {
  const vehicle = vehicles.find((item) => item.id === id);

  if (!vehicle || !vehicle.loanPlan) {
    throw new Error("Loan plan not found.");
  }

  const numericPaymentAmount = Number(paymentAmount);
  if (!Number.isFinite(numericPaymentAmount) || numericPaymentAmount <= 0) {
    throw new Error("Payment amount must be greater than zero.");
  }

  const interestPortion =
    vehicle.loanPlan.balance * (vehicle.loanPlan.annualInterestRate / 12 / 100);
  const principalPortion = numericPaymentAmount - interestPortion;
  const balanceAfterPayment = Math.max(
    vehicle.loanPlan.balance - principalPortion,
    0,
  );

  const paymentRecord = {
    id: Date.now(),
    paymentAmount: Number(numericPaymentAmount.toFixed(2)),
    interestPortion: Number(interestPortion.toFixed(2)),
    principalPortion: Number(principalPortion.toFixed(2)),
    balanceAfterPayment: Number(balanceAfterPayment.toFixed(2)),
    paidAt: new Date().toISOString(),
  };

  vehicle.loanPlan.payments.push(paymentRecord);
  vehicle.loanPlan.balance = paymentRecord.balanceAfterPayment;

  return paymentRecord;
}

function getRecentMaintenance(id, limit = 3) {
  const vehicle = vehicles.find((item) => item.id === id);

  if (!vehicle) {
    throw new Error("Vehicle not found.");
  }

  const maintenance = Array.isArray(vehicle.maintenance)
    ? vehicle.maintenance
    : [];
  return maintenance.slice(-limit).reverse();
}

function deleteVehicle(id) {
  const index = vehicles.findIndex((item) => item.id === id);

  if (index === -1) {
    throw new Error("Vehicle not found.");
  }

  const [removedVehicle] = vehicles.splice(index, 1);
  return removedVehicle;
}

function vehicleDetails(id) {
  const vehicle = vehicles.find((item) => item.id === id);
  if (!vehicle) {
    throw new Error("Vehicle not found.");
  }
  return vehicle;
}
class MaintenanceEntry {
  constructor(title, notes = "", date = new Date().toISOString()) {
    if (!title || !String(title).trim()) {
      throw new Error("Maintenance title is required.");
    }

    this.id = Date.now();
    this.title = String(title).trim();
    this.notes = String(notes).trim();
    this.date = date;
    this.cost = 0;
  }
}

class seeMoreDetails {
  constructor(vehicleId) {
    this.vehicleId = vehicleId;
  }

  getVehicle() {
    return vehicleDetails(this.vehicleId);
  }
}
class UpcomingDues {
  constructor(vehicleId) {
    this.vehicleId = vehicleId;
  }

  getVehicle() {
    return vehicleDetails(this.vehicleId);
  }
}

module.exports = {
  vehicles,
  Vehicle,
  normalizeType,
  createVehicle,
  addVehicle,
  editVehicle,
  logMaintenance,
  removeMaintenance,
  logUpcomingDue,
  removeUpcomingDue,
  createLoanPlan,
  recordLoanPayment,
  getRecentMaintenance,
  deleteVehicle,
  vehicleDetails,
};
