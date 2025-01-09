/**
 * Format a Firestore Timestamp object into a human-readable string.
 *
 * @param {Object} timestamp - Firestore Timestamp object with `seconds` and `nanoseconds`.
 * @returns {string} - Formatted date string or "No timestamp available".
 */
export const formatFirestoreTimestamp = (timestamp) => {
    if (!timestamp) {
      return "No timestamp available";
    }
  
    return new Intl.DateTimeFormat(undefined, {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
      hour12: true,
    }).format(new Date(timestamp * 1000)); // Convert seconds to milliseconds
  };
  