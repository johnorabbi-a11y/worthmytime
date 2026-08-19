(function (global) {
  "use strict";

  const formatters = {
    gbp: new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
      maximumFractionDigits: 0
    }),
    gbpRate: new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }),
    number: new Intl.NumberFormat("en-GB", {
      maximumFractionDigits: 1
    })
  };

  function getNumber(form, name) {
    const field = form.elements[name];
    return field ? Number(field.value) || 0 : 0;
  }

  function getValue(form, name) {
    const field = form.elements[name];
    return field ? field.value : "";
  }

  function getChecked(form, name) {
    const field = form.elements[name];
    return Boolean(field && field.checked);
  }

  function setResultText(key, value, root) {
    const scope = root || document;
    scope.querySelectorAll(`[data-result="${key}"]`).forEach((node) => {
      node.textContent = value;
    });
  }

  function setManyResults(results, root) {
    Object.entries(results).forEach(([key, value]) => {
      setResultText(key, value, root);
    });
  }

  function showValidation(validationBox, errors) {
    if (!validationBox) {
      return;
    }

    if (!errors.length) {
      validationBox.hidden = true;
      validationBox.innerHTML = "";
      return;
    }

    validationBox.hidden = false;
    validationBox.innerHTML = `<strong>Check these inputs:</strong><ul>${errors
      .map((error) => `<li>${error}</li>`)
      .join("")}</ul>`;
  }

  function setPanelsHidden(panels, hidden) {
    panels.forEach((panel) => {
      panel.hidden = hidden;
    });
  }

  function safeRate(numerator, denominator) {
    if (denominator <= 0) {
      return 0;
    }
    return numerator / denominator;
  }

  global.WorthMyTimeCalculator = {
    formatters,
    getNumber,
    getValue,
    getChecked,
    setResultText,
    setManyResults,
    showValidation,
    setPanelsHidden,
    safeRate
  };
})(window);
