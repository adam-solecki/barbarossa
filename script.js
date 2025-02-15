function calculateFIRE() {
  // Get input values
  const currentAge = parseFloat(document.getElementById("currentAge").value);
  const retireAge = parseFloat(document.getElementById("retireAge").value);
  const annualBudget = parseFloat(document.getElementById("annualBudget").value);
  const annualReturn = parseFloat(document.getElementById("annualReturn").value) / 100;

  if (isNaN(currentAge) || isNaN(retireAge) || isNaN(annualBudget) || isNaN(annualReturn)) {
    alert("Please enter valid numbers in all fields.");
    return;
  }

  // Calculate years to retirement
  const yearsToRetire = retireAge - currentAge;
  if (yearsToRetire <= 0) {
    alert("Retirement age must be greater than your current age.");
    return;
  }

  // Using the 4% rule: required portfolio = annual budget / 0.04 = annualBudget * 25
  const requiredPortfolio = annualBudget * 25;

  // Function to compute periodic savings using the annuity formula:
  // FV = P * ((1+r)^n - 1)/r  =>  P = FV * r / ((1+r)^n - 1)
  function calculatePeriodicSavings(ratePerPeriod, periods) {
    return requiredPortfolio * ratePerPeriod / (Math.pow(1 + ratePerPeriod, periods) - 1);
  }

  // Calculate savings requirements for different frequencies
  const months = yearsToRetire * 12;
  const fortnights = yearsToRetire * 26;
  const weeks = yearsToRetire * 52;
  const years = yearsToRetire;

  const monthlyRate = annualReturn / 12;
  const fortnightlyRate = annualReturn / 26;
  const weeklyRate = annualReturn / 52;
  const yearlyRate = annualReturn;

  const savingPerMonth = calculatePeriodicSavings(monthlyRate, months);
  const savingPerFortnight = calculatePeriodicSavings(fortnightlyRate, fortnights);
  const savingPerWeek = calculatePeriodicSavings(weeklyRate, weeks);
  const savingPerYear = calculatePeriodicSavings(yearlyRate, years);

  // Format the numbers as currency
  function formatCurrency(num) {
    return num.toLocaleString(undefined, { style: 'currency', currency: 'USD', minimumFractionDigits: 2 });
  }

  // Generate a random result title
  const resultTitles = [
    "Well, would you look at that...",
    "The numbers are in!",
    "You're on the path to riches!",
    "Your future self is thanking you!",
    "Holy smokes!",
    "Let your money do the work!",
    "Small steps today, big results tomorrow",
    "Here's how your wealth stacks up",
    "Your investments are working hard",
    "Your future is shaping up nicely",
    "Patience pays off - here's the proof"
  ];
  const randomTitle = resultTitles[Math.floor(Math.random() * resultTitles.length)];
  document.getElementById("resultTitle").innerText = randomTitle;

  // Display the result message with the future value highlighted
  const resultMessage = `In ${yearsToRetire} years, your investment will be worth: <span class="highlight">${formatCurrency(requiredPortfolio)}</span>.<br><br>Let's see how your money works for you over time.`;
  document.getElementById("resultMessage").innerHTML = resultMessage;

  // Populate the savings breakdown
  document.getElementById("perMonth").innerText = formatCurrency(savingPerMonth) + " per month";
  document.getElementById("perFortnight").innerText = formatCurrency(savingPerFortnight) + " per fortnight";
  document.getElementById("perWeek").innerText = formatCurrency(savingPerWeek) + " per week";
  document.getElementById("perYear").innerText = formatCurrency(savingPerYear) + " per year";

  // Show the result section
  document.getElementById("resultSection").style.display = "block";
}
