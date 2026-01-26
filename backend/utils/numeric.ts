// Numeric utility functions to handle MNT currency without floating point errors
// All amounts are stored as NUMERIC in PostgreSQL and handled as strings in TypeScript

class MNT {
    /**
     * Add two MNT amounts
     */
    static add(a: string, b: string): string {
        const aNum = parseFloat(a);
        const bNum = parseFloat(b);
        return (aNum + bNum).toFixed(2);
    }

    /**
     * Subtract two MNT amounts
     */
    static subtract(a: string, b: string): string {
        const aNum = parseFloat(a);
        const bNum = parseFloat(b);
        return (aNum - bNum).toFixed(2);
    }

    /**
     * Multiply MNT amount by a number
     */
    static multiply(amount: string, multiplier: number | string): string {
        const amountNum = parseFloat(amount);
        const multiplierNum = typeof multiplier === 'string' ? parseFloat(multiplier) : multiplier;
        return (amountNum * multiplierNum).toFixed(2);
    }

    /**
     * Divide MNT amount by a number
     */
    static divide(amount: string, divisor: number | string): string {
        const amountNum = parseFloat(amount);
        const divisorNum = typeof divisor === 'string' ? parseFloat(divisor) : divisor;
        if (divisorNum === 0) {
            throw new Error('Division by zero');
        }
        return (amountNum / divisorNum).toFixed(2);
    }

    /**
     * Compare two MNT amounts
     */
    static compare(a: string, b: string): number {
        const aNum = parseFloat(a);
        const bNum = parseFloat(b);
        if (aNum > bNum) return 1;
        if (aNum < bNum) return -1;
        return 0;
    }

    /**
     * Check if amount is greater than or equal to another
     */
    static gte(a: string, b: string): boolean {
        return MNT.compare(a, b) >= 0;
    }

    /**
     * Check if amount is less than another
     */
    static lt(a: string, b: string): boolean {
        return MNT.compare(a, b) < 0;
    }

    /**
     * Check if amount is greater than another
     */
    static gt(a: string, b: string): boolean {
        return MNT.compare(a, b) > 0;
    }

    /**
     * Format MNT amount for display
     */
    static format(amount: string): string {
        const num = parseFloat(amount);
        return num.toLocaleString('mn-MN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }) + ' ₮';
    }

    /**
     * Calculate percentage
     */
    static percentage(amount: string, total: string): string {
        if (parseFloat(total) === 0) {
            return '0.00';
        }
        const result = (parseFloat(amount) / parseFloat(total)) * 100;
        return result.toFixed(2);
    }

    /**
     * Validate MNT amount
     */
    static isValid(amount: string): boolean {
        const num = parseFloat(amount);
        return !isNaN(num) && isFinite(num) && num >= 0;
    }

    /**
     * Parse string to MNT amount
     */
    static parse(amount: string | number): string {
        const num = typeof amount === 'string' ? parseFloat(amount) : amount;
        if (isNaN(num) || !isFinite(num)) {
            throw new Error('Invalid amount');
        }
        return num.toFixed(2);
    }
}

export { MNT };
