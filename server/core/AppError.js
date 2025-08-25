class AppError extends Error {
  constructor(message, status = 400, cause) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.cause = cause;
  }
}
module.exports = { AppError };
