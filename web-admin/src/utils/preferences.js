/**
 * Get user preferences from localStorage
 */
export function getPreferences() {
  try {
    const prefs = localStorage.getItem('preferences');
    return prefs ? JSON.parse(prefs) : {
      dateFormat: 'MM/DD/YYYY',
      currencyDisplay: 'symbol',
      weekStartsOn: 'sunday'
    };
  } catch {
    return {
      dateFormat: 'MM/DD/YYYY',
      currencyDisplay: 'symbol',
      weekStartsOn: 'sunday'
    };
  }
}
