(function () {
  "use strict";

  const form = document.querySelector("[data-reduced-hours-form]");
  const resultsPanel = document.querySelector("[data-results-panel]");
  const resultPanels = document.querySelectorAll("[data-results-panel]");
  const validationBox = document.querySelector("[data-validation]");
  const utils = window.WorthMyTimeCalculator;
  const taxEngine = window.WorthMyTimeTax2026;

  if (!form || !resultsPanel || !utils || !taxEngine) return;

  function collectInput() {
    return {
      currentSalary: utils.getNumber(form, "currentSalary"),
      proposedSalary: utils.getNumber(form, "proposedSalary"),
      currentBonus: utils.getNumber(form, "currentBonus"),
      proposedBonus: utils.getNumber(form, "proposedBonus"),
      currentHours: utils.getNumber(form, "currentHours"),
      proposedHours: utils.getNumber(form, "proposedHours"),
      weeksWorked: utils.getNumber(form, "weeksWorked"),
      currentCommuteMinutes: utils.getNumber(form, "currentCommuteMinutes"),
      proposedCommuteMinutes: utils.getNumber(form, "proposedCommuteMinutes"),
      currentCosts: utils.getNumber(form, "currentCosts"),
      proposedCosts: utils.getNumber(form, "proposedCosts"),
      employeePensionPercent: utils.getNumber(form, "employeePensionPercent"),
      pensionMethod: utils.getValue(form, "pensionMethod"),
      undergraduateLoanPlan: utils.getValue(form, "undergraduateLoanPlan"),
      hasPostgraduateLoan: utils.getChecked(form, "hasPostgraduateLoan")
    };
  }

  function validate(input) {
    const errors = [];
    if (input.currentSalary <= 0 || input.proposedSalary <= 0) errors.push("Current and proposed annual salary must be more than zero.");
    if (input.proposedSalary + input.proposedBonus >= input.currentSalary + input.currentBonus) errors.push("Proposed salary plus bonus should be lower than current salary plus bonus for this reduced-hours calculator.");
    if (input.currentHours <= 0 || input.currentHours > 120 || input.proposedHours <= 0 || input.proposedHours > 120) errors.push("Weekly hours must be between 0 and 120.");
    if (input.proposedHours >= input.currentHours) errors.push("Proposed weekly hours must be lower than current weekly hours.");
    if (input.weeksWorked <= 0 || input.weeksWorked > 52) errors.push("Weeks worked per year must be between 1 and 52.");
    if (input.currentBonus < 0 || input.proposedBonus < 0 || input.currentCommuteMinutes < 0 || input.proposedCommuteMinutes < 0 || input.currentCosts < 0 || input.proposedCosts < 0 || input.employeePensionPercent < 0) errors.push("Bonuses, costs, commute time and pension percentage cannot be negative.");
    if (input.employeePensionPercent > 80) errors.push("Employee pension percentage must be 80% or less for this estimator.");
    return errors;
  }

  function estimate(salary, bonus, input) {
    return taxEngine.estimateEmploymentDeductions({
      grossSalary: salary,
      bonus,
      employeePensionPercent: input.employeePensionPercent,
      pensionMethod: input.pensionMethod,
      undergraduateLoanPlan: input.undergraduateLoanPlan,
      hasPostgraduateLoan: input.hasPostgraduateLoan
    });
  }

  function render(input) {
    const currentTax = estimate(input.currentSalary, input.currentBonus, input);
    const proposedTax = estimate(input.proposedSalary, input.proposedBonus, input);
    const currentGross = input.currentSalary + input.currentBonus;
    const proposedGross = input.proposedSalary + input.proposedBonus;
    const grossGivenUp = currentGross - proposedGross;
    const takeHomeGivenUp = currentTax.annualTakeHome - proposedTax.annualTakeHome;
    const monthlyTakeHomeGivenUp = takeHomeGivenUp / 12;
    const currentWorkHours = input.currentHours * input.weeksWorked;
    const proposedWorkHours = input.proposedHours * input.weeksWorked;
    const workHoursGained = currentWorkHours - proposedWorkHours;
    const currentCommuteHours = input.currentCommuteMinutes * input.weeksWorked / 60;
    const proposedCommuteHours = input.proposedCommuteMinutes * input.weeksWorked / 60;
    const commuteHoursGained = currentCommuteHours - proposedCommuteHours;
    const totalHoursGained = workHoursGained + commuteHoursGained;
    const currentAnnualCosts = input.currentCosts * input.weeksWorked;
    const proposedAnnualCosts = input.proposedCosts * input.weeksWorked;
    const annualCostSaving = currentAnnualCosts - proposedAnnualCosts;
    const spendableGivenUp = takeHomeGivenUp - annualCostSaving;
    const costPerHourGained = utils.safeRate(spendableGivenUp, totalHoursGained);
    const currentNetRate = utils.safeRate(currentTax.annualTakeHome, currentWorkHours);
    const proposedNetRate = utils.safeRate(proposedTax.annualTakeHome, proposedWorkHours);
    const currentCommittedRate = utils.safeRate(currentTax.annualTakeHome - currentAnnualCosts, currentWorkHours + currentCommuteHours);
    const proposedCommittedRate = utils.safeRate(proposedTax.annualTakeHome - proposedAnnualCosts, proposedWorkHours + proposedCommuteHours);
    const deductionCushion = grossGivenUp > 0 ? (1 - takeHomeGivenUp / grossGivenUp) * 100 : 0;
    const { gbp, gbpRate, number } = utils.formatters;

    utils.setManyResults({
      takeHomeGivenUp: gbp.format(takeHomeGivenUp),
      monthlyTakeHomeGivenUp: gbp.format(monthlyTakeHomeGivenUp),
      totalHoursGained: `${number.format(totalHoursGained)} hours`,
      weeklyHoursGained: `${number.format(input.currentHours - input.proposedHours)} hours`,
      costPerHourGained: gbpRate.format(costPerHourGained),
      spendableGivenUp: gbp.format(spendableGivenUp),
      grossGivenUp: gbp.format(grossGivenUp),
      currentTakeHome: gbp.format(currentTax.annualTakeHome),
      proposedTakeHome: gbp.format(proposedTax.annualTakeHome),
      annualCostSaving: gbp.format(annualCostSaving),
      currentNetRate: gbpRate.format(currentNetRate),
      proposedNetRate: gbpRate.format(proposedNetRate),
      currentCommittedRate: gbpRate.format(currentCommittedRate),
      proposedCommittedRate: gbpRate.format(proposedCommittedRate),
      workHoursGained: `${number.format(workHoursGained)} hours`,
      commuteHoursGained: `${number.format(commuteHoursGained)} hours`,
      deductionCushion: `${number.format(deductionCushion)}%`,
      taxSaving: gbp.format(currentTax.incomeTax - proposedTax.incomeTax),
      niSaving: gbp.format(currentTax.nationalInsurance - proposedTax.nationalInsurance),
      loanSaving: gbp.format(currentTax.studentLoan - proposedTax.studentLoan),
      pensionReduction: gbp.format(currentTax.grossEmployeePension - proposedTax.grossEmployeePension)
    });

    utils.setPanelsHidden(resultPanels, false);
    resultsPanel.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const input = collectInput();
    const errors = validate(input);
    utils.showValidation(validationBox, errors);
    if (errors.length) {
      utils.setPanelsHidden(resultPanels, true);
      return;
    }
    render(input);
  });

  form.addEventListener("reset", () => {
    window.setTimeout(() => {
      utils.showValidation(validationBox, []);
      utils.setPanelsHidden(resultPanels, true);
    }, 0);
  });
})();
