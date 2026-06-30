import { Request, Response, NextFunction } from 'express';
import * as matchesService from '../services/matches.service';

export async function swipe(req: Request, res: Response, next: NextFunction) {
  try {
    const { planId, action } = req.body;
    if (!planId || !['join', 'skip'].includes(action)) {
      return res.status(400).json({ error: 'planId and action (join|skip) required' });
    }
    const result = await matchesService.swipe(req.user!.id, planId, action);
    res.json(result);
  } catch (err: any) {
    if (err.message === 'Plan is full') return res.status(409).json({ error: err.message });
    if (err.message === 'Already swiped on this plan') return res.status(409).json({ error: err.message });
    next(err);
  }
}

export async function getMatches(req: Request, res: Response, next: NextFunction) {
  try {
    const matches = await matchesService.getMatches(req.user!.id);
    res.json(matches);
  } catch (err) { next(err); }
}

export async function leavePlan(req: Request, res: Response, next: NextFunction) {
  try {
    await matchesService.leavePlan(req.user!.id, req.params.planId);
    res.status(204).send();
  } catch (err: any) {
    if (err.message === 'Match not found') return res.status(404).json({ error: err.message });
    if (err.message === 'Creator cannot leave their own plan') return res.status(400).json({ error: err.message });
    next(err);
  }
}

export async function getPendingRequests(req: Request, res: Response, next: NextFunction) {
  try {
    const requests = await matchesService.getPendingRequests(req.user!.id);
    res.json({ requests });
  } catch (err) { next(err); }
}

export async function updateMatch(req: Request, res: Response, next: NextFunction) {
  try {
    const { status } = req.body;
    if (!['ACCEPTED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ error: 'status must be ACCEPTED or REJECTED' });
    }
    const match = await matchesService.updateMatch(req.params.id, req.user!.id, status);
    res.json(match);
  } catch (err: any) {
    if (err.message.includes('creator')) return res.status(403).json({ error: err.message });
    if (err.message === 'Plan is full') return res.status(409).json({ error: err.message });
    next(err);
  }
}
