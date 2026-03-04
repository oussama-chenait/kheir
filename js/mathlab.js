document.addEventListener('DOMContentLoaded', () => {
  const calcBtn = document.getElementById('calculate-btn');
  const inputA = document.getElementById('input-a');
  const inputB = document.getElementById('input-b');
  const inputC = document.getElementById('input-c');
  const stepsOutput = document.getElementById('steps-output');
  
  const step1 = document.getElementById('step-1-math');
  const step2 = document.getElementById('step-2-math');
  const step3 = document.getElementById('step-3-math');
  const finalResult = document.getElementById('final-result');

  calcBtn.addEventListener('click', () => {
    const a = parseFloat(inputA.value);
    const b = parseFloat(inputB.value);
    const c = parseFloat(inputC.value);

    if (isNaN(a) || isNaN(b) || isNaN(c)) {
      alert('الرجاء إدخال أرقام صحيحة');
      return;
    }

    if (a === 0) {
      alert('يجب أن تكون قيمة a لا تساوي الصفر في المعادلة التربيعية');
      return;
    }

    // Calculation
    const delta = (b * b) - (4 * a * c);
    
    // Step 1: Display coefficients
    step1.innerHTML = `المعاملات هي: $a = ${a}, b = ${b}, c = ${c}$`;

    // Step 2: Delta calculation
    let deltaSteps = `$\\Delta = b^2 - 4ac$ <br>`;
    deltaSteps += `$\\Delta = (${b})^2 - 4(${a})(${c})$ <br>`;
    deltaSteps += `$\\Delta = ${b*b} - ${4*a*c}$ <br>`;
    deltaSteps += `$\\Delta = ${delta}$`;
    step2.innerHTML = deltaSteps;

    // Step 3: Solutions
    let solutionSteps = '';
    let resultText = '';

    if (delta > 0) {
      const x1 = (-b + Math.sqrt(delta)) / (2 * a);
      const x2 = (-b - Math.sqrt(delta)) / (2 * a);
      solutionSteps = `بما أن $\\Delta > 0$، فالمعادلة تقبل حلين متمايزين: <br>`;
      solutionSteps += `$x_1 = \\frac{-b + \\sqrt{\\Delta}}{2a} = \\frac{${-b} + ${Math.sqrt(delta).toFixed(2)}}{${2*a}} = ${x1.toFixed(2)}$ <br>`;
      solutionSteps += `$x_2 = \\frac{-b - \\sqrt{\\Delta}}{2a} = \\frac{${-b} - ${Math.sqrt(delta).toFixed(2)}}{${2*a}} = ${x2.toFixed(2)}$`;
      resultText = `الحلول: $x_1 = ${x1.toFixed(2)}, x_2 = ${x2.toFixed(2)}$`;
    } else if (delta === 0) {
      const x = -b / (2 * a);
      solutionSteps = `بما أن $\\Delta = 0$، فالمعادلة تقبل حلاً مضاعفاً: <br>`;
      solutionSteps += `$x = \\frac{-b}{2a} = \\frac{${-b}}{${2*a}} = ${x.toFixed(2)}$`;
      resultText = `الحل المضاعف: $x = ${x.toFixed(2)}$`;
    } else {
      solutionSteps = `بما أن $\\Delta < 0$، فالمعادلة لا تقبل حلولاً حقيقية.`;
      resultText = `لا توجد حلول حقيقية`;
    }

    step3.innerHTML = solutionSteps;
    finalResult.innerHTML = resultText;

    // Show output
    stepsOutput.style.display = 'block';

    // Re-render math
    if (window.renderMathInElement) {
      renderMathInElement(stepsOutput, {
        delimiters: [
          {left: '$$', right: '$$', display: true},
          {left: '$', right: '$', display: false}
        ]
      });
    }
  });
});
