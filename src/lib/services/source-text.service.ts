import type { 
  SourceTextListResponseDTO, 
  SourceTextDetailDTO,
  GetSourceTextsCommand,
  GetSourceTextByIdCommand,
  SourceTextDTO,
  PaginationDTO
} from '../../types';
import { supabaseClient } from '../../db/supabase.client';
import { isMockAuthEnabled, createMockSupabaseClient } from '../auth/mock-auth';

/**
 * Service for managing source texts operations
 * Handles fetching source texts with proper user isolation through RLS
 */
export class SourceTextService {

  /**
   * Gets paginated list of user's source texts
   * @param command - GetSourceTextsCommand with user context and pagination
   * @returns Promise<SourceTextListResponseDTO> - Paginated list of source texts
   */
  async getSourceTexts(command: GetSourceTextsCommand): Promise<SourceTextListResponseDTO> {
    try {
      // Use mock or real Supabase client based on environment
      const supabase = isMockAuthEnabled() ? createMockSupabaseClient() : supabaseClient;

      // Calculate offset for pagination
      const offset = (command.page - 1) * command.limit;

      // Get total count for pagination metadata
      const { count: totalCount, error: countError } = await supabase
        .from('source_texts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', command.user_id);

      if (countError) {
        console.error('SourceTextService.getSourceTexts count error:', countError);
        throw {
          type: 'DATABASE_ERROR',
          message: 'Błąd podczas pobierania liczby tekstów źródłowych',
          statusCode: 500
        };
      }

      // Get paginated source texts with flashcard count
      const { data: sourceTexts, error: fetchError } = await supabase
        .from('source_texts')
        .select(`
          id,
          content,
          created_at,
          flashcards!inner(count)
        `)
        .eq('user_id', command.user_id)
        .order('created_at', { ascending: false })
        .range(offset, offset + command.limit - 1);

      if (fetchError) {
        console.error('SourceTextService.getSourceTexts fetch error:', fetchError);
        throw {
          type: 'DATABASE_ERROR',
          message: 'Błąd podczas pobierania tekstów źródłowych',
          statusCode: 500
        };
      }

      // Transform data to DTOs
      const sourceTextDTOs: SourceTextDTO[] = (sourceTexts || []).map((sourceText: any) => ({
        id: sourceText.id,
        content: sourceText.content,
        flashcard_count: sourceText.flashcards?.length || 0,
        created_at: sourceText.created_at
      }));

      // Calculate pagination metadata
      const total = totalCount || 0;
      const pages = Math.ceil(total / command.limit);
      
      const pagination: PaginationDTO = {
        page: command.page,
        limit: command.limit,
        total,
        pages
      };

      return {
        data: sourceTextDTOs,
        pagination
      };

    } catch (error: any) {
      // Re-throw known errors
      if (error.type) {
        throw error;
      }

      // Handle unexpected errors
      console.error('SourceTextService.getSourceTexts unexpected error:', error);
      throw {
        type: 'INTERNAL_SERVER_ERROR',
        message: 'Wystąpił nieoczekiwany błąd podczas pobierania tekstów źródłowych',
        statusCode: 500
      };
    }
  }

  /**
   * Gets single source text by ID with associated flashcards
   * @param command - GetSourceTextByIdCommand with ID and user context
   * @returns Promise<SourceTextDetailDTO> - Detailed source text with flashcards
   */
  async getSourceTextById(command: GetSourceTextByIdCommand): Promise<SourceTextDetailDTO> {
    try {
      // Use mock or real Supabase client based on environment
      const supabase = isMockAuthEnabled() ? createMockSupabaseClient() : supabaseClient;

      // Get source text with associated flashcards
      const { data: sourceText, error: fetchError } = await supabase
        .from('source_texts')
        .select(`
          id,
          content,
          created_at,
          flashcards(
            id,
            front,
            back,
            status
          )
        `)
        .eq('id', command.id)
        .eq('user_id', command.user_id)
        .single();

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          // No rows returned - source text not found or doesn't belong to user
          throw {
            type: 'NOT_FOUND',
            message: 'Tekst źródłowy nie został znaleziony',
            statusCode: 404
          };
        }

        console.error('SourceTextService.getSourceTextById fetch error:', fetchError);
        throw {
          type: 'DATABASE_ERROR',
          message: 'Błąd podczas pobierania tekstu źródłowego',
          statusCode: 500
        };
      }

      if (!sourceText) {
        throw {
          type: 'NOT_FOUND',
          message: 'Tekst źródłowy nie został znaleziony',
          statusCode: 404
        };
      }

      // Transform to DTO
      const sourceTextDetailDTO: SourceTextDetailDTO = {
        id: sourceText.id,
        content: sourceText.content,
        flashcards: (sourceText.flashcards || []).map((flashcard: any) => ({
          id: flashcard.id,
          front: flashcard.front,
          back: flashcard.back,
          status: flashcard.status
        })),
        created_at: sourceText.created_at
      };

      return sourceTextDetailDTO;

    } catch (error: any) {
      // Re-throw known errors
      if (error.type) {
        throw error;
      }

      // Handle unexpected errors
      console.error('SourceTextService.getSourceTextById unexpected error:', error);
      throw {
        type: 'INTERNAL_SERVER_ERROR',
        message: 'Wystąpił nieoczekiwany błąd podczas pobierania tekstu źródłowego',
        statusCode: 500
      };
    }
  }
} 