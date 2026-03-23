import { Response } from 'express';
export class ApiResponse {
  statusCode: number;
  data: object | Array<object> | null;
  message: string;
  success: boolean;

  constructor(statusCode: number, data: object | Array<object> | null, message: string) {
    this.statusCode = statusCode;
    this.data = data;
    this.message = message;
    this.success = statusCode < 400;
  }

  send(res: Response) {
    return res.status(this.statusCode).json({
      success: this.success,
      message: this.message,
      data: this.data,
    });
  }
}

export class CreatedResponse extends ApiResponse {
  constructor(message = 'created') {
    super(201, null, message);
  }
}

export class AcceptedResponse extends ApiResponse {
  constructor(message = 'accepted') {
    super(202, null, message);
  }
}

export class OkResponse extends ApiResponse {
  constructor(data: object | Array<object> | null = null) {
    super(200, data, 'ok');
  }
}
