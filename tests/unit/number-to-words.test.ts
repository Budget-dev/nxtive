import { describe, it, expect } from "vitest";
import { amountToWordsINR } from "@/utils/number-to-words";

describe("amountToWordsINR", () => {
  it("converts 0 correctly", () => {
    expect(amountToWordsINR(0)).toBe("Zero Rupees Only");
  });

  it("converts numbers under 100", () => {
    expect(amountToWordsINR(45)).toBe("Forty-Five Rupees Only");
    expect(amountToWordsINR(12)).toBe("Twelve Rupees Only");
  });

  it("converts numbers under 1,000", () => {
    expect(amountToWordsINR(149)).toBe("One Hundred Forty-Nine Rupees Only");
    expect(amountToWordsINR(599)).toBe("Five Hundred Ninety-Nine Rupees Only");
  });

  it("converts thousands correctly", () => {
    expect(amountToWordsINR(1299)).toBe("One Thousand Two Hundred Ninety-Nine Rupees Only");
    expect(amountToWordsINR(2499)).toBe("Two Thousand Four Hundred Ninety-Nine Rupees Only");
  });

  it("converts lakhs correctly", () => {
    expect(amountToWordsINR(150000)).toBe("One Lakh Fifty Thousand Rupees Only");
  });
});

