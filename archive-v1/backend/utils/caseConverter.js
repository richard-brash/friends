// Utility to convert database snake_case to frontend camelCase
export function toCamelCase(str) {
  return str.replace(/_([a-z])/g, (match, letter) => letter.toUpperCase());
}

export function convertKeys(obj) {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) return obj.map(convertKeys);
  if (typeof obj !== 'object') return obj;
  
  const converted = {};
  for (const [key, value] of Object.entries(obj)) {
    const camelKey = toCamelCase(key);
    converted[camelKey] = convertKeys(value);
    // Keep original key as well for backward compatibility
    if (camelKey !== key) {
      converted[key] = convertKeys(value);
    }
  }
  return converted;
}

export function convertQueryResults(queryResult) {
  if (!queryResult || !queryResult.rows) return queryResult;
  return {
    ...queryResult,
    rows: queryResult.rows.map(convertKeys)
  };
}