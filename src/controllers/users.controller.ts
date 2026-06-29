import { Request, Response, NextFunction } from 'express';
import * as usersService from '../services/users.service';

export async function getMe(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await usersService.getMe(req.user!.id));
  } catch (err) { next(err); }
}

export async function updateMe(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await usersService.updateMe(req.user!.id, req.body));
  } catch (err) { next(err); }
}

export async function getUserById(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await usersService.getUserById(req.params.id, req.user!.id));
  } catch (err: any) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'User not found' });
    next(err);
  }
}

export async function toggleFollow(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await usersService.toggleFollow(req.user!.id, req.params.id));
  } catch (err: any) {
    if (err.message === 'Cannot follow yourself') return res.status(400).json({ error: err.message });
    next(err);
  }
}

export async function getMyPlans(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await usersService.getMyPlans(req.user!.id));
  } catch (err) { next(err); }
}

export async function getJoinedPlans(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await usersService.getJoinedPlans(req.user!.id));
  } catch (err) { next(err); }
}

export async function saveFcmToken(req: Request, res: Response, next: NextFunction) {
  try {
    const { fcmToken } = req.body;
    if (!fcmToken || typeof fcmToken !== 'string') {
      return res.status(400).json({ error: 'fcmToken is required' });
    }
    await usersService.saveFcmToken(req.user!.id, fcmToken);
    res.json({ success: true });
  } catch (err) { next(err); }
}
