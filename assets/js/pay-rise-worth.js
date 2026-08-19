(function () {
  "use strict";

  const form = document.querySelector("[data-pay-rise-form]");
  const resultsPanel = document.querySelector("[data-results-panel]");
  const resultPanels = document.querySelectorAll("[data-results-panel]");
  const validationBox = document.querySelector("[data-validation]");
  const utils = window.WorthMyTimeCalculator;
  const taxEngine = window.WorthMyTimeTax2026;

  if (!form || !resultsPanel || !utils || !taxEngine) {
    return;
  }

  function collectInput() {
    return {
      currentSalary: utils.getNumber(form, "currentSalary"),
      proposedSalary: utils.getNumber(form, "proposedSalary"),
      currentBonus: utils.getNumber(form, "currentBonus"),
      proposedBonus: utils.getNumber(form, "proposedBonus"),
      employeePensionPercent: utils.getNumber(form, "employeePensionPercent"),
      pensionMethod: utils.getValue(form, "pensionMethod"),
      undergraduateLoanPlan: utils.getValue(form, "undergraduateLoanPlan"),
      hasPostgraduateLoan: utils.getChecked(form, "hasPostgraduateLoan"),
      currentHours: utils.getNumber(form, "currentHours"),
      proposedHours: utils.getNumber(form, "proposedHours"),
      weeksWorked: utils.getNumber(form, "weeksWorked"),
      extraWeeklyCosts: utils.getNumber(form, "extraWeeklyCosts")
    };
  }

  function validate(input) {
    const errors = [];

    if (input.currentSalary <= 0) {
      errors.push("Current annual salary must be more than zero.");
    }
    if (input.proposedSalary <= 0) {
      errors.push("Proposed annual salary must be more than zero.");
    }
    if (input.proposedSalary + input.proposedBonus <= input.currentSalary + input.currentBonus) {
      errors.push("Proposed salary plus bonus must be higher than current salary plus bonus for this pay-rise calculator.");
    }
    if (input.currentHours <= 0 || input.currentHours > 120 || input.proposedHours <= 0 || input.proposedHours > 120) {
      errors.push("Weekly hours must be between 0 and 120.");
    }
    if (input.weeksWorked <= 0 || input.weeksWorked > 52) {
      errors.push("Weeks worked per year must be between 1 and 52.");
    }
    if (input.currentBonus < 0 || input.proposedBonus < 0 || input.employeePensionPercent < 0 || input.extraWeeklyCosts < 0) {
      errors.push("Bonuses, pension percentage and extra work costs cannot be negative.");
    }
    if (input.employeePensionPercent > 80) {
      errors.push("Employee pension percentage must be 80% or less for this estimator.");
    }

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
    const grossIncrease = proposedGross - currentGross;
    const extraTakeHome = proposedTax.annualTakeHome - currentTax.annualTakeHome;
    const extraTax = proposedTax.incomeTax - currentTax.incomeTax;
    const extraNi = proposedTax.nationalInsurance - currentTax.nationalInsurance;
    const extraLoan = proposedTax.studentLoan - currentTax.studentLoan;
    const extraPension = proposedTax.grossEmployeePension - currentTax.grossEmployeePension;
    const annualExtraCosts = input.extraWeeklyCosts * input.weeksWorked;
    const spendableIncrease = extraTakeHome - annualExtraCosts;
    const currentAnnualHours = input.currentHours * input.weeksWorked;
    const proposedAnnualHours = input.proposedHours * input.weeksWorked;
    const currentNetRate = utils.safeRate(currentTax.annualTakeHome, currentAnnualHours);
    const proposedNetRate = utils.safeRate(proposedTax.annualTakeHome, proposedAnnualHours);
    const netRateChange = proposedNetRate - currentNetRate;
    const marginalDeductionShare = grossIncrease > 0 ? (grossIncrease - extraTakeHome) / grossIncrease * 100 : 0;
    const { gbp, gbpRate, number } = utils.formatters;

    utils.setManyResults({
      grossIncrease: gbp.format(grossIncrease),
      extraTakeHome: gbp.format(extraTakeHome),
      monthlyExtraTakeHome: gbp.format(extraTakeHome / 12),
      spendableIncrease: gbp.format(spendableIncrease),
      monthlySpendableIncrease: gbp.format(spendableIncrease / 12),
      marginalDeductionShare: `${number.format(marginalDeductionShare)}%`,
      currentTakeHome: gbp.format(currentTax.annualTakeHome),
      proposedTakeHome: gbp.format(proposedTax.annualTakeHome),
      currentNetRate: gbpRate.format(currentNetRate),
      proposedNetRate: gbpRate.format(proposedNetRate),
      netRateChange: gbpRate.format(netRateChange),
      currentAnnualHours: `${number.format(currentAnnualHours)} hours`,
      proposedAnnualHours: `${number.format(proposedAnnualHours)} hours`,
      extraTax: gbp.format(extraTax),
      extraNi: gbp.format(extraNi),
      extraStudentLoan: gbp.format(extraLoan),
      extraPension: gbp.format(extraPension),
      annualExtraCosts: gbp.format(annualExtraCosts)
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
