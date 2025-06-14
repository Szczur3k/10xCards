import type { APIRoute } from 'astro';
import { CategoryService } from '../../lib/services/category.service';
import { supabaseClient } from '../../db/supabase.client';
import type { CreateCategoryRequestDTO } from '../../types';

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
    
    const categoryService = new CategoryService(supabase);
    const result = await categoryService.getCategories(userId);
    
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Categories GET error:', error);
    return new Response(JSON.stringify({ 
      message: 'Błąd podczas pobierania kategorii',
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
    
    const body: CreateCategoryRequestDTO = await request.json();
    
    const categoryService = new CategoryService(supabase);
    const result = await categoryService.createCategory({
      name: body.name,
      description: body.description
    }, userId);
    
    return new Response(JSON.stringify(result), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Categories POST error:', error);
    return new Response(JSON.stringify({ 
      message: 'Błąd podczas tworzenia kategorii',
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}; 