import { NextFunction, Request, Response } from 'express';
import { ZodType } from 'zod';

/**
 * Express middleware factory that validates `req.body` against a Zod
 * schema. Responds 400 with a list of what's wrong on failure; on success,
 * replaces `req.body` with the parsed value (stripped of unknown keys) and
 * calls `next()`.
 * @param schema - the Zod schema `req.body` must satisfy.
 * @returns an Express middleware function.
 */
export function validate(schema: ZodType) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({
        error: 'Validation failed',
        details: result.error.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
        })),
      });
      return;
    }
    req.body = result.data;
    next();
  };
}
