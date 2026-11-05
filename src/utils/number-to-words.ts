/**
 * Utility to convert numeric Indian Rupee amounts into words.
 * Compliant with Indian numbering system (Lakhs, Crores).
 * Example: 1299 -> "One Thousand Two Hundred Ninety-Nine Rupees Only"
 */

const ones = [
  "",
  "One",
  "Two",
  "Three",
  "Four",
  "Five",
  "Six",
  "Seven",
  "Eight",
  "Nine",
  "Ten",
  "Eleven",
  "Twelve",
  "Thirteen",
  "Fourteen",
  "Fifteen",
  "Sixteen",
  "Seventeen",
  "Eighteen",
  "Nineteen",
];

const tens = [
  "",
  "",
  "Twenty",
  "Thirty",
  "Forty",
  "Fifty",
  "Sixty",
  "Seventy",
  "Eighty",
  "Ninety",
];

function convertUnderThousand(n: number): string {
  let str = "";
  if (n >= 100) {
    str += ones[Math.floor(n / 100)] + " Hundred ";
    n %= 100;
  }
  if (n >= 20) {
    str += tens[Math.floor(n / 10)] + (n % 10 !== 0 ? "-" + ones[n % 10] : "") + " ";
  } else if (n > 0) {
    str += ones[n] + " ";
  }
  return str.trim();
}

export function amountToWordsINR(amount: number): string {
  const rounded = Math.round(Number(amount) || 0);
  if (rounded === 0) return "Zero Rupees Only";
  if (rounded < 0) return "Negative " + amountToWordsINR(-rounded);

  let remaining = rounded;
  let result = "";

  const crore = Math.floor(remaining / 10000000);
  remaining %= 10000000;
  if (crore > 0) {
    result += convertUnderThousand(crore) + " Crore ";
  }

  const lakh = Math.floor(remaining / 100000);
  remaining %= 100000;
  if (lakh > 0) {
    result += convertUnderThousand(lakh) + " Lakh ";
  }

  const thousand = Math.floor(remaining / 1000);
  remaining %= 1000;
  if (thousand > 0) {
    result += convertUnderThousand(thousand) + " Thousand ";
  }

  if (remaining > 0) {
    result += convertUnderThousand(remaining) + " ";
  }

  return result.trim() + " Rupees Only";
}

