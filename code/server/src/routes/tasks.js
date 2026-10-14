import express from 'express';
import { createClient } from '@supabase/supabase-js';
import { supabase } from '../supabaseClient.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * Returns a user-scoped Supabase client so PostgREST RLS (auth.uid() = user_id) is enforced.
 */
const getScopedClient = (req) => {
  const token = req.cookies?.access_token || req.headers?.authorization?.replace('Bearer ', '');
  if (token) {
    return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });
  }
  return supabase;
};

/**
 * Maps database row (snake_case) to client WorkflowTask model (camelCase).
 */
const mapRowToTask = (row) => ({
  id: row.id,
  title: row.title,
  status: row.status,
  priority: row.priority,
  category: row.category,
  dueDate: row.due_date || 'Scheduled',
  deadline: row.deadline,
  timelineStage: row.timeline_stage,
  notes: row.notes || '',
  reminderAlert: row.reminder_alert ?? true,
  createdAt: row.created_at,
  completedAt: row.completed_at || undefined,
});

/**
 * Maps client WorkflowTask (camelCase) to database row (snake_case).
 */
const mapTaskToRow = (task, userId) => ({
  id: task.id,
  user_id: userId,
  title: task.title,
  status: task.status || 'in_progress',
  priority: task.priority || 'high',
  category: task.category || 'General',
  due_date: task.dueDate || 'Scheduled',
  deadline: task.deadline,
  timeline_stage: task.timelineStage || 'in_progress',
  notes: task.notes || '',
  reminder_alert: task.reminderAlert ?? true,
  completed_at: task.completedAt || null,
  updated_at: new Date().toISOString(),
});

/**
 * GET /api/tasks
 * Fetches all workflow tasks for the authenticated user, ordered chronologically.
 */
router.get('/', requireAuth, async (req, res) => {
  try {
    const client = getScopedClient(req);
    const { data, error } = await client
      .from('skillos_tasks')
      .select('*')
      .eq('user_id', req.user.id)
      .order('deadline', { ascending: true });

    if (error) {
      // Table might not exist yet if DDL hasn't run
      if (error.code === 'PGRST205' || error.message?.includes('schema cache')) {
        return res.status(200).json({
          tasks: [],
          tableNotCreated: true,
          message: 'Table public.skillos_tasks not found in Supabase. Please execute schema.sql.',
        });
      }
      return res.status(500).json({ error: error.message });
    }

    const tasks = (data || []).map(mapRowToTask);
    return res.json({ tasks });
  } catch (err) {
    console.error('[TasksAPI] Error fetching tasks:', err);
    return res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

/**
 * POST /api/tasks
 * Creates a new task in Supabase PostgreSQL for the authenticated user.
 */
router.post('/', requireAuth, async (req, res) => {
  try {
    const taskData = req.body;
    if (!taskData.title || !taskData.deadline) {
      return res.status(400).json({ error: 'Task title and deadline are required' });
    }

    const taskId = taskData.id || `task-${Date.now()}`;
    const row = mapTaskToRow({ ...taskData, id: taskId }, req.user.id);
    row.created_at = taskData.createdAt || new Date().toISOString();

    const client = getScopedClient(req);
    const { data, error } = await client
      .from('skillos_tasks')
      .insert([row])
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(201).json({ task: mapRowToTask(data) });
  } catch (err) {
    console.error('[TasksAPI] Error creating task:', err);
    return res.status(500).json({ error: 'Failed to create task' });
  }
});

/**
 * PUT /api/tasks/:id
 * Updates an existing task for the authenticated user.
 */
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const rowUpdates = {
      updated_at: new Date().toISOString(),
    };

    if (updates.title !== undefined) rowUpdates.title = updates.title;
    if (updates.status !== undefined) rowUpdates.status = updates.status;
    if (updates.priority !== undefined) rowUpdates.priority = updates.priority;
    if (updates.category !== undefined) rowUpdates.category = updates.category;
    if (updates.dueDate !== undefined) rowUpdates.due_date = updates.dueDate;
    if (updates.deadline !== undefined) rowUpdates.deadline = updates.deadline;
    if (updates.timelineStage !== undefined) rowUpdates.timeline_stage = updates.timelineStage;
    if (updates.notes !== undefined) rowUpdates.notes = updates.notes;
    if (updates.reminderAlert !== undefined) rowUpdates.reminder_alert = updates.reminderAlert;
    if (updates.completedAt !== undefined) rowUpdates.completed_at = updates.completedAt;

    const client = getScopedClient(req);
    const { data, error } = await client
      .from('skillos_tasks')
      .update(rowUpdates)
      .eq('id', id)
      .eq('user_id', req.user.id)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.json({ task: mapRowToTask(data) });
  } catch (err) {
    console.error('[TasksAPI] Error updating task:', err);
    return res.status(500).json({ error: 'Failed to update task' });
  }
});

/**
 * DELETE /api/tasks/cleanup/completed
 * Bulk deletes all completed tasks for the authenticated user.
 */
router.delete('/cleanup/completed', requireAuth, async (req, res) => {
  try {
    const client = getScopedClient(req);
    const { error, count } = await client
      .from('skillos_tasks')
      .delete({ count: 'exact' })
      .eq('user_id', req.user.id)
      .eq('status', 'completed');

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.json({ success: true, count: count || 0 });
  } catch (err) {
    console.error('[TasksAPI] Error cleaning up completed tasks:', err);
    return res.status(500).json({ error: 'Failed to clean up completed tasks' });
  }
});

/**
 * DELETE /api/tasks/:id
 * Deletes an individual task for the authenticated user.
 */
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const client = getScopedClient(req);
    const { error } = await client
      .from('skillos_tasks')
      .delete()
      .eq('id', id)
      .eq('user_id', req.user.id);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.json({ success: true, id });
  } catch (err) {
    console.error('[TasksAPI] Error deleting task:', err);
    return res.status(500).json({ error: 'Failed to delete task' });
  }
});

export default router;
