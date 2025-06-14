import type { APIRoute } from 'astro';
import { GroupService } from '../../lib/services/group.service';
import { supabaseClient } from '../../db/supabase.client';
import type { CreateGroupRequestDTO } from '../../types';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  try {
    const supabase = supabaseClient;
    
    // Get user from session/auth
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ message: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Mock user ID for now - in real app get from JWT
    const userId = 'mock-user-id';
    
    const groupService = new GroupService(supabase);
    const result = await groupService.getGroups(userId);
    
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Groups GET error:', error);
    return new Response(JSON.stringify({ 
      message: 'Błąd podczas pobierania grup',
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const supabase = supabaseClient;
    
    // Get user from session/auth
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ message: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Mock user ID for now - in real app get from JWT
    const userId = 'mock-user-id';
    
    const body: CreateGroupRequestDTO = await request.json();
    
    const groupService = new GroupService(supabase);
    const result = await groupService.createGroup({
      name: body.name,
      description: body.description
    }, userId);
    
    return new Response(JSON.stringify(result), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Groups POST error:', error);
    return new Response(JSON.stringify({ 
      message: 'Błąd podczas tworzenia grupy',
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}; 