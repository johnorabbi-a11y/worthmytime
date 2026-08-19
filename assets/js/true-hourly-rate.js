(function () {
  "use strict";

  const form = document.querySelector("[data-true-hourly-form]");
  const resultsPanel = document.querySelector("[data-results-panel]");
  const resultPanels = document.querySelectorAll("[data-results-panel]");
  const validationBox = document.querySelector("[data-validation]");
  const utils = window.WorthMyTimeCalculator;

  if (!form || !resultsPanel || !window.WorthMyTimeTax2026 || !utils) {
    return;
  }

  function validate(input) {
    const errors = [];

    if (input.grossSalary <= 0) {
      errors.push("Annual gross salary must be more than zero.");
    }
    if (input.contractedHours <= 0 || input.contractedHours > 120) {
      errors.push("Contracted hours per week must be between 0 and 120.");
    }
    if (input.actualHours <= 0 || input.actualHours > 120) {
      errors.push("Actual hours worked per week must be between 0 and 120.");
    }
    if (input.workingDays <= 0 || input.workingDays > 7) {
      errors.push("Working days per week must be between 1 and 7.");
    }
    if (input.weeksWorked <= 0 || input.weeksWorked > 52) {
      errors.push("Weeks worked per year must be between 1 and 52.");
    }
    if (input.commuteDays < 0 || input.commuteDays > 7) {
      errors.push("Commuting days per week must be between 0 and 7.");
    }
    if (input.commuteDays > input.workingDays) {
      errors.push("Commuting days cannot be higher than working days.");
    }
    if (input.commuteMinutesEachWay < 0 || input.commuteMinutesEachWay > 300) {
      errors.push("Commute time each way must be between 0 and 300 minutes.");
    }
    if (input.bonus < 0 || input.employerPensionPercent < 0 || input.employeePensionPercent < 0 || input.commuteCost < 0 || input.otherWorkCosts < 0) {
      errors.push("Money amounts and percentages cannot be negative.");
    }
    if (input.employeePensionPercent > 80 || input.employerPensionPercent > 80) {
      errors.push("Pension percentages must be 80% or less for this estimator.");
    }

    return errors;
  }

  function collectInput() {
    return {
      grossSalary: utils.getNumber(form, "grossSalary"),
      bonus: utils.getNumber(form, "bonus"),
      employerPensionPercent: utils.getNumber(form, "employerPensionPercent"),
      employeePensionPercent: utils.getNumber(form, "employeePensionPercent"),
      pensionMethod: utils.getValue(form, "pensionMethod"),
      undergraduateLoanPlan: utils.getValue(form, "undergraduateLoanPlan"),
      hasPostgraduateLoan: utils.getChecked(form, "hasPostgraduateLoan"),
      contractedHours: utils.getNumber(form, "contractedHours"),
      actualHours: utils.getNumber(form, "actualHours"),
      workingDays: utils.getNumber(form, "workingDays"),
      weeksWorked: utils.getNumber(form, "weeksWorked"),
      commuteMinutesEachWay: utils.getNumber(form, "commuteMinutesEachWay"),
      commuteDays: utils.getNumber(form, "commuteDays"),
      commuteCost: utils.getNumber(form, "commuteCost"),
      otherWorkCosts: utils.getNumber(form, "otherWorkCosts")
    };
  }

  function render(input, tax) {
    const actualAnnualHours = input.actualHours * input.weeksWorked;
    const contractedAnnualHours = input.contractedHours * input.weeksWorked;
    const annualCommuteHours = (input.commuteMinutesEachWay * 2 * input.commuteDays * input.weeksWorked) / 60;
    const totalCommittedHours = actualAnnualHours + annualCommuteHours;
    const annualCommuteCost = input.commuteCost * input.weeksWorked;
    const annualOtherWorkCosts = input.otherWorkCosts * input.weeksWorked;
    const employerPension = (input.grossSalary + input.bonus) * (input.employerPensionPercent / 100);
    const totalCompensation = input.grossSalary + input.bonus + employerPension;
    const spendablePay = tax.annualTakeHome - annualCommuteCost - annualOtherWorkCosts;

    const headlineHourly = utils.safeRate(input.grossSalary, contractedAnnualHours);
    const netWorkRate = utils.safeRate(tax.annualTakeHome, actualAnnualHours);
    const timeCommittedRate = utils.safeRate(tax.annualTakeHome, totalCommittedHours);
    const spendableWorkRate = utils.safeRate(spendablePay, totalCommittedHours);
    const totalCompensationRate = utils.safeRate(totalCompensation, actualAnnualHours);
    const { gbp, gbpRate, number } = utils.formatters;

    utils.setManyResults({
      headlineHourly: gbpRate.format(headlineHourly),
      netWorkRate: gbpRate.format(netWorkRate),
      timeCommittedRate: gbpRate.format(timeCommittedRate),
      spendableWorkRate: gbpRate.format(spendableWorkRate),
      totalCompensationRate: gbpRate.format(totalCompensationRate),
      grossSalary: gbp.format(input.grossSalary),
      bonus: gbp.format(input.bonus),
      grossIncome: gbp.format(input.grossSalary + input.bonus),
      annualTakeHome: gbp.format(tax.annualTakeHome),
      monthlyTakeHome: gbp.format(tax.monthlyTakeHome),
      employeePension: gbp.format(tax.grossEmployeePension),
      incomeTax: gbp.format(tax.incomeTax),
      nationalInsurance: gbp.format(tax.nationalInsurance),
      studentLoan: gbp.format(tax.studentLoan),
      commuteCostAnnual: gbp.format(annualCommuteCost),
      otherWorkCostsAnnual: gbp.format(annualOtherWorkCosts),
      actualAnnualHours: `${number.format(actualAnnualHours)} hours`,
      annualCommuteHours: `${number.format(annualCommuteHours)} hours`,
      totalCommittedHours: `${number.format(totalCommittedHours)} hours`,
      employerPension: gbp.format(employerPension),
      totalCompensation: gbp.format(totalCompensation),
      personalAllowance: gbp.format(tax.personalAllowance),
      taxableEmploymentIncome: gbp.format(tax.taxableEmploymentIncome)
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

    const tax = window.WorthMyTimeTax2026.estimateEmploymentDeductions(input);
    render(input, tax);
  });

  form.addEventListener("reset", () => {
    window.setTimeout(() => {
      utils.showValidation(validationBox, []);
      utils.setPanelsHidden(resultPanels, true);
    }, 0);
  });
})();
