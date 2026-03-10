export class ApiError extends Error {
  public statusCode: number;
  public success: boolean;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
    this.success = false;
  }
}

export class ValidationError extends ApiError {
  constructor(message = 'bad request') {
    super(400, message);
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message = 'Unauthorized') {
    super(401, message);
  }
}

export class NotFoundError extends ApiError {
  constructor(message = 'not found') {
    super(404, message);
  }
}

export class ForbiddenError extends ApiError {
  constructor(message = 'forbidden') {
    super(403, message);
  }
}

export class TooManyRequestError extends ApiError {
  constructor(message = 'too many request') {
    super(429, message);
  }
}

export class DatabaseError extends ApiError {
  constructor(message = 'database failed to do task') {
    super(502, message);
  }
}
