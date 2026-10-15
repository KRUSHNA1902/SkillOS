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
 * Maps database row (snake_case) to client Tag model (camelCase).
 */
const mapRowToTag = (row) => ({
  id: row.id,
  name: row.name,
  color: row.color || 'blue',
  description: row.description || '',
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

/**
 * Maps client Tag (camelCase) to database row (snake_case).
 */
const mapTagToRow = (tag, userId) => ({
  id: tag.id,
  user_id: userId,
  name: tag.name.trim(),
  color: tag.color || 'blue',
  description: tag.description || '',
  updated_at: new Date().toISOString(),
});

// All tag routes require authentication
router.use(requireAuth);

/**
 * GET /api/tags
 * Fetches all tags for the authenticated user
 */
router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;

    // Local dev bypass fallback
    if (userId === 'dev-user-001') {
      return res.json({ tags: [], source: 'dev_bypass' });
    }

    const client = getScopedClient(req);
    const { data, error } = await client
      .from('skillos_tags')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (error) {
      if (error.code === '42P01') {
        // Table not created yet in Supabase
        return res.json({ tags: [], tableNotCreated: true });
      }
      console.warn('[Tags API] Supabase query error:', error.message);
      return res.status(500).json({ error: 'Failed to fetch tags', details: error.message });
    }

    return res.json({ tags: (data || []).map(mapRowToTag) });
  } catch (err) {
    console.error('[Tags API] Unhandled GET error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/tags
 * Creates or upserts a tag for the authenticated user
 */
router.post('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const tag = req.body;

    if (!tag.id || !tag.name) {
      return res.status(400).json({ error: 'Missing required tag id or name' });
    }

    if (userId === 'dev-user-001') {
      return res.json({ tag, source: 'dev_bypass' });
    }

    const client = getScopedClient(req);
    const row = mapTagToRow(tag, userId);

    const { data, error } = await client
      .from('skillos_tags')
      .upsert(row, { onConflict: 'id' })
      .select()
      .single();

    if (error) {
      if (error.code === '42P01') {
        return res.json({ tag, cachedOffline: true });
      }
      console.warn('[Tags API] Upsert error:', error.message);
      return res.status(500).json({ error: 'Failed to save tag', details: error.message });
    }

    return res.status(201).json({ tag: mapRowToTag(data) });
  } catch (err) {
    console.error('[Tags API] Unhandled POST error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PUT /api/tags/:id
 * Updates an existing tag
 */
router.put('/:id', async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const updates = req.body;

    if (userId === 'dev-user-001') {
      return res.json({ id, ...updates, source: 'dev_bypass' });
    }

    const rowUpdates = {
      ...(updates.name ? { name: updates.name.trim() } : {}),
      ...(updates.color ? { color: updates.color } : {}),
      ...(updates.description !== undefined ? { description: updates.description } : {}),
      updated_at: new Date().toISOString(),
    };

    const client = getScopedClient(req);
    const { data, error } = await client
      .from('skillos_tags')
      .update(rowUpdates)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      if (error.code === '42P01') {
        return res.json({ id, ...updates, cachedOffline: true });
      }
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Tag not found or unauthorized' });
      }
      return res.status(500).json({ error: 'Failed to update tag', details: error.message });
    }

    return res.json({ tag: mapRowToTag(data) });
  } catch (err) {
    console.error('[Tags API] Unhandled PUT error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * DELETE /api/tags/:id
 * Deletes a tag
 */
router.delete('/:id', async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    if (userId === 'dev-user-001') {
      return res.json({ success: true, source: 'dev_bypass' });
    }

    const client = getScopedClient(req);
    const { error } = await client
      .from('skillos_tags')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      if (error.code === '42P01') {
        return res.json({ success: true, cachedOffline: true });
      }
      return res.status(500).json({ error: 'Failed to delete tag', details: error.message });
    }

    return res.json({ success: true });
  } catch (err) {
    console.error('[Tags API] Unhandled DELETE error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
