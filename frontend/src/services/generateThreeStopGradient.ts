/**
 * Generates a 3-stop gradient based on a central color.
 * @param {string} hexColor - The central color in hex format (e.g., '#ffcc00').
 * @param {number} lightenFactor - Factor to lighten the color (default: 1.2).
 * @param {number} darkenFactor - Factor to darken the color (default: 0.8).
 * @returns {string[]} - An array of 3 colors: [lighter, central, darker].
 */
export const  generateThreeStopGradient = (hexColor: string, lightenFactor: number = 1.4, darkenFactor: number = 0.8): string[] => {
	// Helper to convert hex to RGB
	const hexToRgb = (hex: string) => {
		const bigint = parseInt(hex.slice(1), 16);
		return {
			r: (bigint >> 16) & 255,
			g: (bigint >> 8) & 255,
			b: bigint & 255,
		};
	};

	// Helper to convert RGB to hex
	const rgbToHex = (r: number, g: number, b: number) =>
		`#${[r, g, b]
			.map((x) => Math.max(0, Math.min(255, Math.round(x))).toString(16).padStart(2, "0"))
			.join("")}`;

	// Helper to scale RGB values
	const scaleColor = (rgb: {r: number, b: number, g: number}, factor: number) => ({
		r: rgb.r * factor,
		g: rgb.g * factor,
		b: rgb.b * factor,
	});

	// Compute lighter, central, and darker colors
	const centralRgb = hexToRgb(hexColor);
	const lighterRgb = scaleColor(centralRgb, lightenFactor);
	const darkerRgb = scaleColor(centralRgb, darkenFactor);

	return [
		rgbToHex(lighterRgb.r, lighterRgb.g, lighterRgb.b), // Lighter color
		hexColor,                                          // Central color
		rgbToHex(darkerRgb.r, darkerRgb.g, darkerRgb.b),   // Darker color
	];
}

// // Example usage:
// const centralColor = "#ffcc00"; // Bright yellow
// const gradientColors = generateThreeStopGradient(centralColor);
//
// console.log(gradientColors); // Example output: ['#ffe680', '#ffcc00', '#cc9900']
