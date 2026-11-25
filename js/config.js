// App configuration. Change these values to connect real services.

/**
 * URL of a backend that recognises ingredients in a photo.
 *
 * - null  → demo mode: the app returns sample items so you can test the flow.
 * - a URL → the app sends POST multipart/form-data with fields
 *             image: the photo file
 *             mode:  "fridge" | "receipt"
 *           and expects JSON like:
 *             { "items": [ { "name": "Eggs", "qty": 6, "unit": "pcs", "expiresInDays": 14 } ] }
 *
 * See README.md → "Connecting real image recognition".
 */
export const RECOGNITION_ENDPOINT = null;

/** Key used to save everything in the browser (localStorage). */
export const STORAGE_KEY = 'foodai:data:v1';

/** Points earned per finished recipe = POINTS_PER_LEVEL × recipe level. */
export const POINTS_PER_LEVEL = 30;
