import type { Request, Response } from 'express';
import mongoose from 'mongoose';

export function health(_req: Request, res: Response) {
  const readyState = mongoose.connection.readyState;
  const mongoState =
    readyState === 1
      ? 'connected'
      : readyState === 2
        ? 'connecting'
        : readyState === 3
          ? 'disconnecting'
          : 'disconnected';

  res.json({ ok: true, service: 'citezen-api', mongo: { readyState, state: mongoState } });
}

