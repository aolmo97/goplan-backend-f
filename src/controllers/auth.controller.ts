import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import * as authService from '../services/auth.service';

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { username, email, password, city } = req.body;
    const result = await authService.register(username, email, password, city);
    res.status(201).json(result);
  } catch (err: any) {
    if (err.message === 'User already exists') return res.status(409).json({ error: err.message });
    next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    res.json(result);
  } catch (err: any) {
    if (err.message === 'Invalid credentials') return res.status(401).json({ error: err.message });
    next(err);
  }
}

export async function googleAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const { idToken } = req.body;
    if (!idToken) return res.status(400).json({ error: 'idToken required' });
    const result = await authService.googleAuth(idToken);
    res.json(result);
  } catch (err: any) {
    if (err.message === 'Invalid Google token') return res.status(401).json({ error: err.message });
    next(err);
  }
}

export async function getMe(req: Request, res: Response, next: NextFunction) {
  try {
    const profile = await authService.getMe(req.user!.id);
    res.json(profile);
  } catch (err) {
    next(err);
  }
}
