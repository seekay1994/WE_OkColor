/**
 * OkColor - Oklab and OkLCH Color Space Conversion and Utilities
 * 
 * Color Spaces:
 * - Oklab: Perceptual color space with L (lightness), a (green-red), b (blue-yellow)
 * - OkLCH: Cylindrical representation with L (lightness), C (chroma), H (hue in radians)
 * 
 * @author seekay
 * @version 1.0.0
 */
class OkColor {
	/**
	 * Converts a normalized RGB color to Oklab color space.
	 * @param {Vec3} rgb Normalized RGB color
	 * @param {Number} gamma Gamma correction value (Defaults to 2.2)
	 * @returns {Vec3} Oklab color
	 */
	static rgb2oklab(rgb, gamma = 2.2) {
		const kCONEtoLMS = Float64Array.of(
			0.4122214708, 0.5363325363, 0.0514459929,
			0.2119034982, 0.6806995451, 0.1073969566,
			0.0883024619, 0.2817188376, 0.6299787005
		);
		const kLMStoOKLAB = Float64Array.of(
			0.2104542553, 0.7936177850, -0.0040720468,
			1.9779984951, -2.4285922050, 0.4505937099,
			0.0259040371, 0.7827717662, -0.8086757660
		);

		function mat3MulVec3(m, v) {
			return new Vec3(
				m[0] * v.x + m[1] * v.y + m[2] * v.z,
				m[3] * v.x + m[4] * v.y + m[5] * v.z,
				m[6] * v.x + m[7] * v.y + m[8] * v.z
			);
		}

		function coneResponse(v) {
			return new Vec3(
				Math.pow(Math.max(v.x, 0), 0.3333333),
				Math.pow(Math.max(v.y, 0), 0.3333333),
				Math.pow(Math.max(v.z, 0), 0.3333333)
			);
		}

		const lin = new Vec3(
			Math.pow(rgb.x, gamma),
			Math.pow(rgb.y, gamma),
			Math.pow(rgb.z, gamma)
		);

		const lms = mat3MulVec3(kCONEtoLMS, lin);
		const lms_ = coneResponse(lms);
		return mat3MulVec3(kLMStoOKLAB, lms_);
	}

	/**
	 * Converts an Oklab color to normalized RGB color space.
	 * @param {Vec3} lab Oklab color
	 * @param {Number} gamma Gamma correction value (Defaults to 2.2)
	 * @returns {Vec3} Normalized RGB color
	 */
	static oklab2rgb(lab, gamma = 2.2) {
		const kOKLABtoLMS = Float64Array.of(
			1.0, 0.3963377774, 0.2158037573,
			1.0, -0.1055613458, -0.0638541728,
			1.0, -0.0894841775, -1.2914855480
		);
		const kLMStoCONE = Float64Array.of(
			4.0767416621, -3.3077115913, 0.2309699292,
			-1.2684380046, 2.6097574011, -0.3413193965,
			-0.0041960863, -0.7034186147, 1.7076147010
		);

		const INV_GAMMA = 1 / gamma;

		function mat3MulVec3(m, v) {
			return new Vec3(
				m[0] * v.x + m[1] * v.y + m[2] * v.z,
				m[3] * v.x + m[4] * v.y + m[5] * v.z,
				m[6] * v.x + m[7] * v.y + m[8] * v.z
			);
		}

		const lms_ = mat3MulVec3(kOKLABtoLMS, lab);
		const lms = lms_.multiply(lms_).multiply(lms_);
		const lin = mat3MulVec3(kLMStoCONE, lms);

		return new Vec3(
			Math.pow(Math.max(0, Math.min(1, lin.x)), INV_GAMMA),
			Math.pow(Math.max(0, Math.min(1, lin.y)), INV_GAMMA),
			Math.pow(Math.max(0, Math.min(1, lin.z)), INV_GAMMA)
		);
	}

	/**
	 * Converts a normalized RGB color to OkLCH color space.
	 * @param {Vec3} rgb Normalized RGB color
	 * @returns {Vec3} OkLCH color
	 */
	static rgb2oklch(rgb) {
		const lab = OkColor.rgb2oklab(rgb);
		return OkColor.oklab2oklch(lab);
	}

	/**
	 * Converts an OkLCH color to normalized RGB color space.
	 * @param {Vec3} lch OkLCH color
	 * @returns {Vec3} Normalized RGB color
	 */
	static oklch2rgb(lch) {
		const lab = OkColor.oklch2oklab(lch);
		return OkColor.oklab2rgb(lab);
	}

	/**
	 * Converts an Oklab color to OkLCH color space.
	 * @param {Vec3} lab Oklab color
	 * @returns {Vec3} OkLCH color
	 */
	static oklab2oklch(lab) {
		const L = lab.x;
		const a = lab.y;
		const b = lab.z;

		const C = Math.sqrt(a * a + b * b);
		const H = Math.atan2(b, a);

		return new Vec3(L, C, H);
	}

	/**
	 * Converts an OkLCH color to Oklab color space.
	 * @param {Vec3} lch OkLCH color
	 * @returns {Vec3} Oklab color
	 */
	static oklch2oklab(lch) {
		const L = lch.x;
		const C = lch.y;
		const H = lch.z;

		const a = C * Math.cos(H);
		const b = C * Math.sin(H);

		return new Vec3(L, a, b);
	}

	/**
	 * Mixes two normalized RGB colors in Oklab color space.
	 * @param {Vec3} rgb1 First normalized RGB color
	 * @param {Vec3} rgb2 Second normalized RGB color
	 * @param {Number} t Interpolation factor (0 = rgb1, 1 = rgb2)
	 * @return {Vec3} Normalized RGB color
	 */
	static mix(rgb1, rgb2, t) {
		const kCONEtoLMS = Float64Array.of(
			0.4122214708, 0.5363325363, 0.0514459929,
			0.2119034982, 0.6806995451, 0.1073969566,
			0.0883024619, 0.2817188376, 0.6299787005
		);

		const kLMStoCONE = Float64Array.of(
			4.0767416621, -3.3077115913, 0.2309699292,
			-1.2684380046, 2.6097574011, -0.3413193965,
			-0.0041960863, -0.7034186147, 1.7076147010
		);

		function coneResponse(v) {
			return new Vec3(
				Math.pow(Math.max(v.x, 0), 0.3333333),
				Math.pow(Math.max(v.y, 0), 0.3333333),
				Math.pow(Math.max(v.z, 0), 0.3333333)
			);
		}

		function mat3MulVec3(m, v) {
			return new Vec3(
				m[0] * v.x + m[1] * v.y + m[2] * v.z,
				m[3] * v.x + m[4] * v.y + m[5] * v.z,
				m[6] * v.x + m[7] * v.y + m[8] * v.z
			);
		}

		const lin1 = new Vec3(Math.pow(rgb1.x, 2.2), Math.pow(rgb1.y, 2.2), Math.pow(rgb1.z, 2.2));
		const lin2 = new Vec3(Math.pow(rgb2.x, 2.2), Math.pow(rgb2.y, 2.2), Math.pow(rgb2.z, 2.2));

		const lms1 = coneResponse(mat3MulVec3(kCONEtoLMS, lin1));
		const lms2 = coneResponse(mat3MulVec3(kCONEtoLMS, lin2));

		const lms = lms1.mix(lms2, t);

		const lin = mat3MulVec3(kLMStoCONE, lms.multiply(lms).multiply(lms));

		return new Vec3(Math.pow(lin.x, 0.4545454), Math.pow(lin.y, 0.4545454), Math.pow(lin.z, 0.4545454));
	}

	/**
	 * Sets the hue of a normalized RGB color to a specific value.
	 * @param {Vec3} rgb Normalized RGB color
	 * @param {number} hue Hue value in radians (0-2π)
	 * @returns {Vec3} Normalized RGB color
	 */
	static setHue(rgb, hue) {
		const lch = OkColor.rgb2oklch(rgb);
		let newHue = hue % (Math.PI * 2);
		if (newHue < 0) newHue += Math.PI * 2;
		return OkColor.oklch2rgb(new Vec3(lch.x, lch.y, newHue));
	}

	/**
	 * Shifts the hue of a normalized RGB color.
	 * @param {Vec3} rgb Normalized RGB color
	 * @param {number} factor Hue shift in radians
	 * @returns {Vec3} Normalized RGB color
	 */
	static shiftHue(rgb, factor) {
		const lch = OkColor.rgb2oklch(rgb);
		let newHue = (lch.z + factor) % (Math.PI * 2);
		if (newHue < 0) newHue += Math.PI * 2;
		return OkColor.oklch2rgb(new Vec3(lch.x, lch.y, newHue));
	}

	/**
	 * Sets the chroma of a normalized RGB color to a specific value.
	 * @param {Vec3} rgb Normalized RGB color
	 * @param {number} chroma Chroma value (0-X)
	 * @returns {Vec3} Normalized RGB color
	 */
	static setChroma(rgb, chroma) {
		const lch = OkColor.rgb2oklch(rgb);
		const newLch = new Vec3(lch.x, chroma, lch.z);
		return OkColor.oklch2rgb(newLch);
	}

	/**
	 * Scales the chroma of a normalized RGB color.
	 * @param {Vec3} rgb Normalized RGB color
	 * @param {number} factor Chroma scale factor
	 * @returns {Vec3} Normalized RGB color
	 */
	static scaleChroma(rgb, factor) {
		const lch = OkColor.rgb2oklch(rgb);
		const newLch = new Vec3(lch.x, lch.y * factor, lch.z);
		return OkColor.oklch2rgb(newLch);
	}

	/**
	 * Sets the lightness of a normalized RGB color to a specific value.
	 * @param {Vec3} rgb Normalized RGB color
	 * @param {number} lightness Lightness value (0-1)
	 * @returns {Vec3} Normalized RGB color
	 */
	static setLightness(rgb, lightness) {
		const lch = OkColor.rgb2oklch(rgb);
		const newLch = new Vec3(Math.max(0, Math.min(1, lightness)), lch.y, lch.z);
		return OkColor.oklch2rgb(newLch);
	}

	/**
	 * Shifts the lightness of a normalized RGB color.
	 * @param {Vec3} rgb Normalized RGB color
	 * @param {number} factor Lightness offset
	 * @returns {Vec3} Normalized RGB color
	 */
	static shiftLightness(rgb, factor) {
		const lch = OkColor.rgb2oklch(rgb);
		const newLightness = Math.max(0, Math.min(1, lch.x + factor));
		return OkColor.oklch2rgb(new Vec3(newLightness, lch.y, lch.z));
	}
}