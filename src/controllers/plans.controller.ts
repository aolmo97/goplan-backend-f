import { Request, Response, NextFunction } from 'express';
import * as plansService from '../services/plans.service';

export async function getFeed(req: Request, res: Response, next: NextFunction) {
  try {
    const { category, search, page, limit } = req.query;
    const result = await plansService.getFeed(req.user!.id, {
      category: category as string | undefined,
      search: search as string | undefined,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 10
    });
    res.json(result);
  } catch (err) { next(err); }
}

export async function getSwipeFeed(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await plansService.getSwipeFeed(req.user!.id);
    res.json(result);
  } catch (err) { next(err); }
}

export async function getPlanById(req: Request, res: Response, next: NextFunction) {
  try {
    const plan = await plansService.getPlanById(req.params.id, req.user!.id);
    res.json(plan);
  } catch (err: any) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Plan not found' });
    next(err);
  }
}

export async function createPlan(req: Request, res: Response, next: NextFunction) {
  try {
    const plan = await plansService.createPlan(req.user!.id, req.body);
    res.status(201).json(plan);
  } catch (err) { next(err); }
}

export async function updatePlan(req: Request, res: Response, next: NextFunction) {
  try {
    const plan = await plansService.updatePlan(req.params.id, req.user!.id, req.body);
    res.json(plan);
  } catch (err: any) {
    if (err.message === 'Unauthorized' || err.message === 'Forbidden') return res.status(403).json({ error: err.message });
    next(err);
  }
}

export async function deletePlan(req: Request, res: Response, next: NextFunction) {
  try {
    await plansService.deletePlan(req.params.id, req.user!.id);
    res.status(204).send();
  } catch (err: any) {
    if (err.message === 'Forbidden') return res.status(403).json({ error: err.message });
    next(err);
  }
}

export async function getComments(req: Request, res: Response, next: NextFunction) {
  try {
    const comments = await plansService.getComments(req.params.id);
    res.json(comments);
  } catch (err) { next(err); }
}

export async function addComment(req: Request, res: Response, next: NextFunction) {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'text is required' });
    }
    const comment = await plansService.addComment(req.params.id, req.user!.id, text);
    res.status(201).json(comment);
  } catch (err) { next(err); }
}

export async function getPlanRequests(req: Request, res: Response, next: NextFunction) {
  try {
    const requests = await plansService.getPlanRequests(req.params.id, req.user!.id);
    res.json(requests);
  } catch (err: any) {
    if (err.message === 'Forbidden') return res.status(403).json({ error: err.message });
    next(err);
  }
}

export async function deleteComment(req: Request, res: Response, next: NextFunction) {
  try {
    await plansService.deleteComment(req.params.commentId, req.user!.id);
    res.status(204).send();
  } catch (err: any) {
    if (err.message === 'Unauthorized') return res.status(403).json({ error: err.message });
    if (err.message === 'NotFound') return res.status(404).json({ error: 'Comment not found' });
    next(err);
  }
}
