import type { NextFunction, Request, RequestHandler, Response } from 'express'
import { serializeApiResponse } from './serialize.js'

export function sendJson(res: Response, statusCode: number, payload: unknown): void {
  res.status(statusCode).json(serializeApiResponse(payload))
}

export function sendOk(res: Response, payload: unknown): void {
  sendJson(res, 200, payload)
}

export function asyncHandler(
  handler: (req: Request, res: Response, next: NextFunction) => Promise<void>
): RequestHandler {
  return (req, res, next) => {
    void handler(req, res, next).catch(next)
  }
}
