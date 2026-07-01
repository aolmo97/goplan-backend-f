import { Request, Response, NextFunction } from 'express';
import * as chatsService from '../services/chats.service';
import { getChatMembers, getOrCreateDirectChat } from '../services/chats.service';

export async function getChats(req: Request, res: Response, next: NextFunction) {
  try {
    const chats = await chatsService.getChats(req.user!.id);
    res.json(chats);
  } catch (err) { next(err); }
}

export async function getChatMessages(req: Request, res: Response, next: NextFunction) {
  try {
    const { page, limit } = req.query;
    const messages = await chatsService.getChatMessages(
      req.params.id,
      req.user!.id,
      page ? Number(page) : 1,
      limit ? Number(limit) : 50
    );
    res.json(messages);
  } catch (err: any) {
    if (err.message === 'Not a member of this chat') return res.status(403).json({ error: err.message });
    next(err);
  }
}

export async function sendMessage(req: Request, res: Response, next: NextFunction) {
  try {
    const { content } = req.body;
    if (!content?.trim()) return res.status(400).json({ error: 'content required' });
    const message = await chatsService.sendMessage(req.params.id, req.user!.id, content);
    res.status(201).json(message);
  } catch (err: any) {
    if (err.message === 'Not a member of this chat') return res.status(403).json({ error: err.message });
    next(err);
  }
}

export async function markRead(req: Request, res: Response, next: NextFunction) {
  try {
    await chatsService.markRead(req.params.id, req.user!.id);
    res.status(204).send();
  } catch (err) { next(err); }
}

export const getChatMembersHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const members = await getChatMembers(req.params.id, req.user!.id);
    res.json(members);
  } catch (e) { next(e); }
};

export const getOrCreateDirectChatHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await getOrCreateDirectChat(req.user!.id, req.body.targetUserId);
    res.json(result);
  } catch (e) { next(e); }
};
