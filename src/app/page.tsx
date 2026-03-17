'use client';

import { useState, useEffect, useCallback } from 'react';

interface CalculationRecord {
  id: number;
  expression: string;
  result: string;
  createdAt: string;
}

export default function Home() {
  const [display, setDisplay] = useState('0');
  const [expression, setExpression] = useState('');
  const [prevValue, setPrevValue] = useState<string | null>(null);
  const [operator, setOperator] = useState<string | null>(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);
  const [history, setHistory] = useState<CalculationRecord[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [justCalculated, setJustCalculated] = useState(false);

  const fetchHistory = useCallback(async () => {
    try {
      const res = await fetch('/api/calculations');
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
      }
    } catch (e) {
      console.error('Failed to fetch history', e);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const saveCalculation = useCallback(async (expr: string, result: string) => {
    try {
      await fetch('/api/calculations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ expression: expr, result }),
      });
      fetchHistory();
    } catch (e) {
      console.error('Failed to save calculation', e);
    }
  }, [fetchHistory]);

  const clearHistory = async () => {
    setHistoryLoading(true);
    try {
      await fetch('/api/calculations', { method: 'DELETE' });
      setHistory([]);
    } catch (e) {
      console.error('Failed to clear history', e);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleClear = useCallback(() => {
    setDisplay('0');
    setExpression('');
    setPrevValue(null);
    setOperator(null);
    setWaitingForOperand(false);
    setJustCalculated(false);
  }, []);

  const handleDigit = useCallback((digit: string) => {
    if (waitingForOperand) {
      setDisplay(digit);
      setWaitingForOperand(false);
    } else {
      if (justCalculated) {
        setDisplay(digit);
        setExpression('');
        setPrevValue(null);
        setOperator(null);
        setJustCalculated(false);
      } else {
        setDisplay(display === '0' ? digit : display + digit);
      }
    }
  }, [display, waitingForOperand, justCalculated]);

  const handleDecimal = useCallback(() => {
    if (waitingForOperand) {
      setDisplay('0.');
      setWaitingForOperand(false);
      return;
    }
    if (justCalculated) {
      setDisplay('0.');
      setExpression('');
      setPrevValue(null);
      setOperator(null);
      setJustCalculated(false);
      return;
    }
    if (!display.includes('.')) {
      setDisplay(display + '.');
    }
  }, [display, waitingForOperand, justCalculated]);

  const handleOperator = useCallback((op: string) => {
    setJustCalculated(false);
    const current = parseFloat(display);

    if (prevValue !== null && operator && !waitingForOperand) {
      const prev = parseFloat(prevValue);
      let result: number;
      switch (operator) {
        case '+': result = prev + current; break;
        case '-': result = prev - current; break;
        case '*': result = prev * current; break;
        case '/':
          if (current === 0) {
            setDisplay('Error');
            setExpression('');
            setPrevValue(null);
            setOperator(null);
            setWaitingForOperand(false);
            return;
          }
          result = prev / current;
          break;
        default: result = current;
      }
      const resultStr = formatNumber(result);
      setDisplay(resultStr);
      setPrevValue(resultStr);
      setExpression(`${resultStr} ${getOpSymbol(op)}`);
    } else {
      setPrevValue(display);
      setExpression(`${display} ${getOpSymbol(op)}`);
    }

    setOperator(op);
    setWaitingForOperand(true);
  }, [display, prevValue, operator, waitingForOperand]);

  const handleEquals = useCallback(() => {
    if (prevValue === null || operator === null) return;

    const prev = parseFloat(prevValue);
    const current = parseFloat(display);
    let result: number;

    switch (operator) {
      case '+': result = prev + current; break;
      case '-': result = prev - current; break;
      case '*': result = prev * current; break;
      case '/':
        if (current === 0) {
          const expr = `${prevValue} ${getOpSymbol(operator)} ${display}`;
          setDisplay('Error');
          setExpression(expr + ' =');
          setPrevValue(null);
          setOperator(null);
          setWaitingForOperand(false);
          setJustCalculated(true);
          return;
        }
        result = prev / current;
        break;
      default: result = current;
    }

    const resultStr = formatNumber(result);
    const expr = `${prevValue} ${getOpSymbol(operator)} ${display}`;
    setDisplay(resultStr);
    setExpression(`${expr} =`);
    setPrevValue(null);
    setOperator(null);
    setWaitingForOperand(false);
    setJustCalculated(true);

    saveCalculation(expr, resultStr);
  }, [prevValue, operator, display, saveCalculation]);

  const handlePercentage = useCallback(() => {
    const current = parseFloat(display);
    if (isNaN(current)) return;
    const result = current / 100;
    setDisplay(formatNumber(result));
    setJustCalculated(false);
  }, [display]);

  const handleToggleSign = useCallback(() => {
    if (display === 'Error') return;
    const current = parseFloat(display);
    if (isNaN(current)) return;
    setDisplay(formatNumber(-current));
    setJustCalculated(false);
  }, [display]);

  const handleBackspace = useCallback(() => {
    if (display === 'Error') {
      handleClear();
      return;
    }
    if (waitingForOperand || justCalculated) return;
    if (display.length === 1 || (display.length === 2 && display.startsWith('-'))) {
      setDisplay('0');
    } else {
      setDisplay(display.slice(0, -1));
    }
  }, [display, waitingForOperand, justCalculated, handleClear]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') handleDigit(e.key);
      else if (e.key === '.') handleDecimal();
      else if (e.key === '+') handleOperator('+');
      else if (e.key === '-') handleOperator('-');
      else if (e.key === '*') handleOperator('*');
      else if (e.key === '/') { e.preventDefault(); handleOperator('/'); }
      else if (e.key === 'Enter' || e.key === '=') handleEquals();
      else if (e.key === 'Escape') handleClear();
      else if (e.key === 'Backspace') handleBackspace();
      else if (e.key === '%') handlePercentage();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleDigit, handleDecimal, handleOperator, handleEquals, handleClear, handleBackspace, handlePercentage]);

  function formatNumber(num: number): string {
    if (!isFinite(num)) return 'Error';
    const str = num.toPrecision(12);
    const parsed = parseFloat(str);
    if (Math.abs(parsed) >= 1e12 || (Math.abs(parsed) < 1e-7 && parsed !== 0)) {
      return parsed.toExponential(6);
    }
    return String(parsed);
  }

  function getOpSymbol(op: string): string {
    switch (op) {
      case '+': return '+';
      case '-': return '−';
      case '*': return '×';
      case '/': return '÷';
      default: return op;
    }
  }

  const displayFontSize = display.length > 12 ? 'text-2xl' : display.length > 8 ? 'text-3xl' : 'text-4xl';

  return (
    <main className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="flex flex-col lg:flex-row gap-6 w-full max-w-3xl">
        {/* Calculator */}
        <div className="bg-gray-900 rounded-3xl shadow-2xl p-5 w-full max-w-sm mx-auto lg:mx-0">
          {/* Display */}
          <div className="bg-gray-800 rounded-2xl p-4 mb-4 min-h-[100px] flex flex-col justify-end items-end overflow-hidden">
            <div className="text-gray-400 text-sm h-5 truncate w-full text-right mb-1">
              {expression || '\u00a0'}
            </div>
            <div className={`text-white font-light ${displayFontSize} truncate w-full text-right`}>
              {display}
            </div>
          </div>

          {/* Buttons */}
          <div className="grid grid-cols-4 gap-3">
            {/* Row 1 */}
            <CalcButton label="C" onClick={handleClear} variant="function" />
            <CalcButton label="+/−" onClick={handleToggleSign} variant="function" />
            <CalcButton label="%" onClick={handlePercentage} variant="function" />
            <CalcButton label="÷" onClick={() => handleOperator('/')} variant="operator" active={operator === '/' && waitingForOperand} />

            {/* Row 2 */}
            <CalcButton label="7" onClick={() => handleDigit('7')} />
            <CalcButton label="8" onClick={() => handleDigit('8')} />
            <CalcButton label="9" onClick={() => handleDigit('9')} />
            <CalcButton label="×" onClick={() => handleOperator('*')} variant="operator" active={operator === '*' && waitingForOperand} />

            {/* Row 3 */}
            <CalcButton label="4" onClick={() => handleDigit('4')} />
            <CalcButton label="5" onClick={() => handleDigit('5')} />
            <CalcButton label="6" onClick={() => handleDigit('6')} />
            <CalcButton label="−" onClick={() => handleOperator('-')} variant="operator" active={operator === '-' && waitingForOperand} />

            {/* Row 4 */}
            <CalcButton label="1" onClick={() => handleDigit('1')} />
            <CalcButton label="2" onClick={() => handleDigit('2')} />
            <CalcButton label="3" onClick={() => handleDigit('3')} />
            <CalcButton label="+" onClick={() => handleOperator('+')} variant="operator" active={operator === '+' && waitingForOperand} />

            {/* Row 5 */}
            <CalcButton label="⌫" onClick={handleBackspace} />
            <CalcButton label="0" onClick={() => handleDigit('0')} />
            <CalcButton label="." onClick={handleDecimal} />
            <CalcButton label="=" onClick={handleEquals} variant="equals" />
          </div>
        </div>

        {/* History Panel */}
        <div className="bg-gray-900 rounded-3xl shadow-2xl p-5 w-full lg:w-72 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white text-lg font-semibold">History</h2>
            {history.length > 0 && (
              <button
                onClick={clearHistory}
                disabled={historyLoading}
                className="text-xs text-red-400 hover:text-red-300 transition-colors disabled:opacity-50"
              >
                Clear All
              </button>
            )}
          </div>
          <div className="flex-1 overflow-y-auto space-y-2 max-h-96 lg:max-h-none">
            {history.length === 0 ? (
              <div className="text-gray-500 text-sm text-center mt-8">
                No calculations yet.
              </div>
            ) : (
              history.map((calc) => (
                <div
                  key={calc.id}
                  className="bg-gray-800 rounded-xl p-3 cursor-pointer hover:bg-gray-700 transition-colors"
                  onClick={() => {
                    setDisplay(calc.result);
                    setExpression(calc.expression + ' =');
                    setPrevValue(null);
                    setOperator(null);
                    setWaitingForOperand(false);
                    setJustCalculated(true);
                  }}
                >
                  <div className="text-gray-400 text-xs truncate">{calc.expression}</div>
                  <div className="text-white text-base font-medium">{calc.result}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

interface CalcButtonProps {
  label: string;
  onClick: () => void;
  variant?: 'default' | 'function' | 'operator' | 'equals';
  active?: boolean;
}

function CalcButton({ label, onClick, variant = 'default', active = false }: CalcButtonProps) {
  const base = 'flex items-center justify-center rounded-2xl text-xl font-medium h-14 w-full select-none cursor-pointer transition-all duration-100 active:scale-95';

  const variants: Record<string, string> = {
    default: 'bg-gray-700 text-white hover:bg-gray-600 active:bg-gray-500',
    function: 'bg-gray-600 text-white hover:bg-gray-500 active:bg-gray-400',
    operator: active
      ? 'bg-white text-orange-500 hover:bg-gray-100'
      : 'bg-orange-500 text-white hover:bg-orange-400 active:bg-orange-300',
    equals: 'bg-orange-500 text-white hover:bg-orange-400 active:bg-orange-300',
  };

  return (
    <button
      className={`${base} ${variants[variant]}`}
      onClick={onClick}
    >
      {label}
    </button>
  );
}
