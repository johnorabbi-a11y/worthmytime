/*
  UK employment tax estimator for the 2026/27 tax year.

  Official figures checked against GOV.UK:
  - Personal Allowance: GBP 12,570, reduced by GBP 1 for every GBP 2 of
    adjusted net income above GBP 100,000, and fully removed at GBP 125,140.
  - England, Wales and Northern Ireland non-savings, non-dividend Income Tax:
    20% on taxable income up to GBP 37,700, 40% from GBP 37,701 to GBP 125,140,
    45% above GBP 125,140.
  - Class 1 employee National Insurance category A: 8% between the Primary
    Threshold (GBP 12,570 yearly) and Upper Earnings Limit (GBP 50,270 yearly),
    then 2% above the UEL.
  - Student loans from 6 April 2026: Plan 1 GBP 26,900, Plan 2 GBP 29,385,
    Plan 4 GBP 33,795, Plan 5 GBP 25,000 at 9%; Postgraduate Loan GBP 21,000
    at 6%.

  This module deliberately uses annualised calculations for a static consumer
  estimator. Payroll systems calculate some deductions by pay period and may
  round differently.
*/

(function (global) {
  "use strict";

  const TAX_YEAR = "2026/27";

  const ASSUMPTIONS = {
    taxYear: TAX_YEAR,
    region: "England, Wales and Northern Ireland",
    personalAllowance: 12570,
    personalAllowanceTaperStarts: 100000,
    personalAllowanceTaperEnds: 125140,
    incomeTaxBands: [
      { label: "Basic rate", limit: 37700, rate: 0.2 },
      { label: "Higher rate", limit: 125140, rate: 0.4 },
      { label: "Additional rate", limit: Infinity, rate: 0.45 }
    ],
    niPrimaryThreshold: 12570,
    niUpperEarningsLimit: 50270,
    niMainRate: 0.08,
    niAdditionalRate: 0.02,
    studentLoans: {
      plan1: { label: "Plan 1", threshold: 26900, rate: 0.09 },
      plan2: { label: "Plan 2", threshold: 29385, rate: 0.09 },
      plan4: { label: "Plan 4", threshold: 33795, rate: 0.09 },
      plan5: { label: "Plan 5", threshold: 25000, rate: 0.09 },
      postgraduate: { label: "Postgraduate Loan", threshold: 21000, rate: 0.06 }
    }
  };

  function roundMoney(value) {
    return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
  }

  function positive(value) {
    return Math.max(0, Number(value) || 0);
  }

  function calculatePersonalAllowance(adjustedNetIncome) {
    const income = positive(adjustedNetIncome);
    if (income <= ASSUMPTIONS.personalAllowanceTaperStarts) {
      return ASSUMPTIONS.personalAllowance;
    }

    const reduction = (income - ASSUMPTIONS.personalAllowanceTaperStarts) / 2;
    return Math.max(0, ASSUMPTIONS.personalAllowance - reduction);
  }

  function calculateIncomeTax(taxableIncomeAfterAllowance) {
    let remaining = positive(taxableIncomeAfterAllowance);
    let previousLimit = 0;
    let total = 0;
    const bandBreakdown = [];

    ASSUMPTIONS.incomeTaxBands.forEach((band) => {
      const width = band.limit === Infinity ? Infinity : band.limit - previousLimit;
      const amount = Math.min(remaining, width);
      const tax = amount * band.rate;

      bandBreakdown.push({
        label: band.label,
        amount: roundMoney(amount),
        rate: band.rate,
        tax: roundMoney(tax)
      });

      total += tax;
      remaining -= amount;
      previousLimit = band.limit;
    });

    return {
      total: roundMoney(total),
      bands: bandBreakdown
    };
  }

  function calculateNationalInsurance(niIncome) {
    const income = positive(niIncome);
    const mainBandIncome = Math.min(
      Math.max(0, income - ASSUMPTIONS.niPrimaryThreshold),
      ASSUMPTIONS.niUpperEarningsLimit - ASSUMPTIONS.niPrimaryThreshold
    );
    const additionalBandIncome = Math.max(0, income - ASSUMPTIONS.niUpperEarningsLimit);

    return roundMoney(
      mainBandIncome * ASSUMPTIONS.niMainRate +
      additionalBandIncome * ASSUMPTIONS.niAdditionalRate
    );
  }

  function calculateLoanForPlan(income, planKey) {
    const plan = ASSUMPTIONS.studentLoans[planKey];
    if (!plan) {
      return 0;
    }
    return roundMoney(Math.max(0, positive(income) - plan.threshold) * plan.rate);
  }

  function estimateEmploymentDeductions(input) {
    const grossSalary = positive(input.grossSalary);
    const bonus = positive(input.bonus);
    const grossEmploymentIncome = grossSalary + bonus;
    const pensionPercent = positive(input.employeePensionPercent) / 100;
    const pensionMethod = input.pensionMethod || "none";
    const undergraduateLoanPlan = input.undergraduateLoanPlan || "none";
    const hasPostgraduateLoan = Boolean(input.hasPostgraduateLoan);

    const grossEmployeePension = pensionMethod === "none"
      ? 0
      : grossEmploymentIncome * pensionPercent;

    const salarySacrificePension = pensionMethod === "salary-sacrifice"
      ? grossEmployeePension
      : 0;

    const reliefAtSourceGrossPension = pensionMethod === "relief-at-source"
      ? grossEmployeePension
      : 0;

    const reliefAtSourceNetPaid = pensionMethod === "relief-at-source"
      ? grossEmployeePension * 0.8
      : 0;

    const taxableEmploymentIncome = Math.max(0, grossEmploymentIncome - salarySacrificePension);
    const adjustedNetIncome = Math.max(
      0,
      taxableEmploymentIncome - reliefAtSourceGrossPension
    );
    const personalAllowance = calculatePersonalAllowance(adjustedNetIncome);
    const incomeTaxableAfterAllowance = Math.max(0, taxableEmploymentIncome - personalAllowance);
    const incomeTax = calculateIncomeTax(incomeTaxableAfterAllowance);
    const nationalInsurance = calculateNationalInsurance(taxableEmploymentIncome);

    const studentLoanIncome = taxableEmploymentIncome;
    const undergraduateLoan = undergraduateLoanPlan === "none"
      ? 0
      : calculateLoanForPlan(studentLoanIncome, undergraduateLoanPlan);
    const postgraduateLoan = hasPostgraduateLoan
      ? calculateLoanForPlan(studentLoanIncome, "postgraduate")
      : 0;
    const studentLoan = roundMoney(undergraduateLoan + postgraduateLoan);

    const annualTakeHome = roundMoney(
      grossEmploymentIncome -
      salarySacrificePension -
      reliefAtSourceNetPaid -
      incomeTax.total -
      nationalInsurance -
      studentLoan
    );

    return {
      taxYear: TAX_YEAR,
      grossSalary: roundMoney(grossSalary),
      bonus: roundMoney(bonus),
      grossEmploymentIncome: roundMoney(grossEmploymentIncome),
      taxableEmploymentIncome: roundMoney(taxableEmploymentIncome),
      adjustedNetIncome: roundMoney(adjustedNetIncome),
      personalAllowance: roundMoney(personalAllowance),
      incomeTax: incomeTax.total,
      incomeTaxBands: incomeTax.bands,
      nationalInsurance,
      studentLoan,
      undergraduateLoan,
      postgraduateLoan,
      grossEmployeePension: roundMoney(grossEmployeePension),
      reliefAtSourceNetPaid: roundMoney(reliefAtSourceNetPaid),
      salarySacrificePension: roundMoney(salarySacrificePension),
      annualTakeHome,
      monthlyTakeHome: roundMoney(annualTakeHome / 12)
    };
  }

  global.WorthMyTimeTax2026 = {
    ASSUMPTIONS,
    calculatePersonalAllowance,
    calculateIncomeTax,
    calculateNationalInsurance,
    calculateLoanForPlan,
    estimateEmploymentDeductions
  };
})(window);
