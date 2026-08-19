(function () {
  "use strict";

  const form = document.querySelector("[data-overtime-form]");
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
      grossSalary: utils.getNumber(form, "grossSalary"),
      bonus: utils.getNumber(form, "bonus"),
      employeePensionPercent: utils.getNumber(form, "employeePensionPercent"),
      pensionMethod: utils.getValue(form, "pensionMethod"),
      undergraduateLoanPlan: utils.getValue(form, "undergraduateLoanPlan"),
      hasPostgraduateLoan: utils.getChecked(form, "hasPostgraduateLoan"),
      actualHours: utils.getNumber(form, "actualHours"),
      weeksWorked: utils.getNumber(form, "weeksWorked"),
      overtimeHours: utils.getNumber(form, "overtimeHours"),
      overtimeRate: utils.getNumber(form, "overtimeRate"),
      extraCommuteMinutes: utils.getNumber(form, "extraCommuteMinutes"),
      extraCosts: utils.getNumber(form, "extraCosts")
    };
  }

  function validate(input) {
    const errors = [];

    if (input.grossSalary <= 0) {
      errors.push("Annual gross salary must be more than zero.");
    }
    if (input.actualHours <= 0 || input.actualHours > 120) {
      errors.push("Usual actual hours per week must be between 0 and 120.");
    }
    if (input.weeksWorked <= 0 || input.weeksWorked > 52) {
      errors.push("Weeks worked per year must be between 1 and 52.");
    }
    if (input.overtimeHours <= 0 || input.overtimeHours > 80) {
      errors.push("Overtime hours per week must be more than zero and no more than 80.");
    }
    if (input.overtimeRate <= 0 || input.overtimeRate > 500) {
      errors.push("Overtime pay rate must be more than zero and no more than GBP 500 per hour.");
    }
    if (input.bonus < 0 || input.employeePensionPercent < 0 || input.extraCommuteMinutes < 0 || input.extraCosts < 0) {
      errors.push("Money amounts, percentages and extra commute time cannot be negative.");
    }
    if (input.employeePensionPercent > 80) {
      errors.push("Employee pension percentage must be 80% or less for this estimator.");
    }

    return errors;
  }

  function estimateTax(input, overtimeGross) {
    return taxEngine.estimateEmploymentDeductions({
      grossSalary: input.grossSalary,
      bonus: input.bonus + overtimeGross,
      employeePensionPercent: input.employeePensionPercent,
      pensionMethod: input.pensionMethod,
      undergraduateLoanPlan: input.undergraduateLoanPlan,
      hasPostgraduateLoan: input.hasPostgraduateLoan
    });
  }

  function render(input) {
    const annualOvertimeHours = input.overtimeHours * input.weeksWorked;
    const annualOvertimeGross = input.overtimeRate * annualOvertimeHours;
    const annualExtraCommuteHours = input.extraCommuteMinutes * input.weeksWorked / 60;
    const annualExtraCosts = input.extraCosts * input.weeksWorked;
    const baseTax = estimateTax(input, 0);
    const withOvertimeTax = estimateTax(input, annualOvertimeGross);

    const extraTakeHome = withOvertimeTax.annualTakeHome - baseTax.annualTakeHome;
    const extraTax = withOvertimeTax.incomeTax - baseTax.incomeTax;
    const extraNi = withOvertimeTax.nationalInsurance - baseTax.nationalInsurance;
    const extraLoan = withOvertimeTax.studentLoan - baseTax.studentLoan;
    const extraPension = withOvertimeTax.grossEmployeePension - baseTax.grossEmployeePension;
    const committedHours = annualOvertimeHours + annualExtraCommuteHours;
    const spendableExtra = extraTakeHome - annualExtraCosts;
    const deductions = annualOvertimeGross - extraTakeHome;
    const deductionShare = annualOvertimeGross > 0 ? deductions / annualOvertimeGross * 100 : 0;
    const { gbp, gbpRate, number } = utils.formatters;

    utils.setManyResults({
      grossOvertime: gbp.format(annualOvertimeGross),
      extraTakeHome: gbp.format(extraTakeHome),
      monthlyExtraTakeHome: gbp.format(extraTakeHome / 12),
      netOvertimeRate: gbpRate.format(utils.safeRate(extraTakeHome, annualOvertimeHours)),
      timeCommittedRate: gbpRate.format(utils.safeRate(extraTakeHome, committedHours)),
      spendableOvertimeRate: gbpRate.format(utils.safeRate(spendableExtra, committedHours)),
      deductionShare: `${number.format(deductionShare)}%`,
      annualOvertimeHours: `${number.format(annualOvertimeHours)} hours`,
      extraCommuteHours: `${number.format(annualExtraCommuteHours)} hours`,
      extraCostsAnnual: gbp.format(annualExtraCosts),
      extraTax: gbp.format(extraTax),
      extraNi: gbp.format(extraNi),
      extraStudentLoan: gbp.format(extraLoan),
      extraPension: gbp.format(extraPension),
      baseTakeHome: gbp.format(baseTax.annualTakeHome),
      withOvertimeTakeHome: gbp.format(withOvertimeTax.annualTakeHome)
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
