/**
 * מחלקה מותאמת לשגיאות API
 * מרחיבה את המחלקה הסטנדרטית Error עם קוד מצב HTTP
 */
class ErrorResponse extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    
    // קורא לstack trace כדי לאפשר מעקב טוב יותר אחרי שגיאות
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = ErrorResponse; 