/**
 * מידלוור שעוטף בקרים אסינכרוניים ב-try-catch
 * מונע את הצורך לכתוב try-catch בכל פונקציה אסינכרונית
 */
const asyncHandler = fn => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler; 