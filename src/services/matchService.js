/**
 * Compatibility score 0-100, aligned with Flutter MockDataService.computeCompatibility
 * @param {Object} prefs - tenant_preferences row
 * @param {Object} property - properties row
 */
function computeCompatibility(prefs, property) {
  let score = 50;
  if (prefs.budget_max != null && property.rent <= prefs.budget_max) score += 15;
  if (prefs.budget_min != null && property.rent >= prefs.budget_min) score += 5;
  if (prefs.occupancy && property.occupancy && prefs.occupancy === property.occupancy) score += 10;
  if (prefs.property_type && property.property_type && prefs.property_type === property.property_type) score += 10;
  if (prefs.furnishing_type && property.furnishing_type && prefs.furnishing_type === property.furnishing_type) score += 5;
  if (prefs.location && property.locality && property.locality.toLowerCase().includes(prefs.location.toLowerCase())) score += 5;
  return Math.min(100, Math.max(0, score));
}

module.exports = { computeCompatibility };
