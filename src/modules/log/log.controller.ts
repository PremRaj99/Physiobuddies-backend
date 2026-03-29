import ejs from 'ejs';
import path from 'path';
import { getLogs } from './log.service';
import { Request, Response } from 'express';
import fs from 'fs';
import { NODE_ENV } from '@/core/constants';

export const getAllLogs = async (req: Request, res: Response) => {
  if (NODE_ENV !== 'development') {
    return res.status(403).send('Forbidden');
  }
  const filePath = path.join(__dirname, './log.ejs');
  const template = fs.readFileSync(filePath, 'utf-8');

  // Get query parameters with defaults
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 50;
  const search = (req.query.search as string) || '';

  // Get all logs and reverse for chronological order
  let allLogs = getLogs().reverse();

  // 1. Apply Search Filter (Server-side)
  if (search) {
    const lowerSearch = search.toLowerCase();
    allLogs = allLogs.filter((log) => JSON.stringify(log).toLowerCase().includes(lowerSearch));
  }

  // 2. Calculate Pagination
  const totalLogs = allLogs.length;
  const totalPages = Math.ceil(totalLogs / limit) || 1;

  // Ensure page doesn't exceed bounds
  const currentPage = Math.min(Math.max(page, 1), totalPages);

  const startIndex = (currentPage - 1) * limit;
  const endIndex = startIndex + limit;

  // 3. Slice the array for the current page
  const paginatedLogs = allLogs.slice(startIndex, endIndex);

  // 4. Render template with pagination metadata
  const html = await ejs.render(template, {
    logs: paginatedLogs,
    currentPage,
    totalPages,
    totalLogs,
    limit,
    search,
  });

  res.send(html);
};
