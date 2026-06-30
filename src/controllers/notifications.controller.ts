import { Request, Response, NextFunction } from 'express';
import { getNotifications as getNotificationsService } from '../services/notifications-feed.service';

export async function getNotifications(req: Request, res: Response, next: NextFunction) {
  try {
    const notifications = await getNotificationsService(req.user!.id);
    res.json({ notifications });
  } catch (err) { next(err); }
}
