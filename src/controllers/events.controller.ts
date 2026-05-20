import { Request, Response, NextFunction } from 'express';
import * as eventsService from '../services/events.service';

export async function getEvents(req: Request, res: Response, next: NextFunction) {
  try {
    const { page, limit } = req.query;
    res.json(await eventsService.getEvents(req.user!.id, {
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 10
    }));
  } catch (err) { next(err); }
}

export async function getEventById(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await eventsService.getEventById(req.params.id, req.user!.id));
  } catch (err: any) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Event not found' });
    next(err);
  }
}

export async function createEvent(req: Request, res: Response, next: NextFunction) {
  try {
    res.status(201).json(await eventsService.createEvent(req.user!.id, req.body));
  } catch (err) { next(err); }
}

export async function attendEvent(req: Request, res: Response, next: NextFunction) {
  try {
    const { status } = req.body;
    if (!['interested', 'going', 'none'].includes(status)) {
      return res.status(400).json({ error: 'status must be interested, going, or none' });
    }
    res.json(await eventsService.attendEvent(req.params.id, req.user!.id, status));
  } catch (err) { next(err); }
}
