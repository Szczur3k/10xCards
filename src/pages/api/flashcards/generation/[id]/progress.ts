import type { APIContext, APIRoute } from "astro";
import type { ErrorResponseDTO } from "../../../../../types";

export const prerender = false;

/**
 * GET /api/flashcards/generation/[id]/progress
 * Returns real-time generation progress using Server-Sent Events
 */
export async function GET(context: APIContext): Promise<Response> {
  try {
    // Auth validation from middleware
    const { user, isAuthenticated, supabase } = context.locals;

    if (!isAuthenticated || !user) {
      return new Response(
        JSON.stringify({
          error: "UNAUTHORIZED",
          message: "Wymagane jest zalogowanie",
        } as ErrorResponseDTO),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Get source text ID from params
    const sourceTextId = context.params.id;
    if (!sourceTextId) {
      return new Response(
        JSON.stringify({
          error: "INVALID_PARAMETER",
          message: "ID tekstu źródłowego jest wymagane",
        } as ErrorResponseDTO),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Check if request wants SSE
    const acceptHeader = context.request.headers.get("accept");
    const wantsSSE = acceptHeader?.includes("text/event-stream");

    if (wantsSSE) {
      // Return SSE stream for real-time updates
      const stream = new ReadableStream({
        start(controller) {
          // Check generation session status every 500ms
          const pollProgress = async () => {
            try {
              const { data: session } = await supabase
                .from("generation_sessions")
                .select("*")
                .eq("source_text_id", sourceTextId)
                .eq("user_id", user.id)
                .single();

              if (session) {
                const progress = {
                  status: session.status,
                  current: session.current_flashcards,
                  total: session.total_flashcards,
                  progress: Math.round((session.current_flashcards / session.total_flashcards) * 100),
                  estimated_time_remaining:
                    session.status === "generating"
                      ? Math.max(0, (session.total_flashcards - session.current_flashcards) * 2000)
                      : 0,
                  started_at: session.created_at,
                  completed_at: session.completed_at,
                  model_used: session.model_used,
                };

                controller.enqueue(`event: message\ndata: ${JSON.stringify(progress)}\n\n`);

                if (session.status === "completed" || session.status === "error") {
                  controller.close();
                  return;
                }
              }

              // Continue polling
              setTimeout(pollProgress, 500);
            } catch (error) {
              console.error("Progress polling error:", error);
              controller.error(error);
            }
          };

          pollProgress();
        },
      });

      return new Response(stream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers": "Cache-Control",
        },
      });
    }

    // Regular JSON response for single progress check
    const { data: session } = await supabase
      .from("generation_sessions")
      .select("*")
      .eq("source_text_id", sourceTextId)
      .eq("user_id", user.id)
      .single();

    if (!session) {
      return new Response(
        JSON.stringify({
          error: "NOT_FOUND",
          message: "Sesja generowania nie została znaleziona",
        } as ErrorResponseDTO),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const progress = {
      source_text_id: sourceTextId,
      status: session.status,
      current: session.current_flashcards,
      total: session.total_flashcards,
      progress: Math.round((session.current_flashcards / session.total_flashcards) * 100),
      estimated_time_remaining:
        session.status === "generating"
          ? Math.max(0, (session.total_flashcards - session.current_flashcards) * 2000)
          : 0,
      started_at: session.created_at,
      completed_at: session.completed_at,
      model_used: session.model_used,
    };

    return new Response(JSON.stringify(progress), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("GET /api/flashcards/generation/[id]/progress error:", error);

    const errorResponse: ErrorResponseDTO = {
      error: "INTERNAL_SERVER_ERROR",
      message: "Wystąpił nieoczekiwany błąd podczas pobierania postępu",
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

// Only allow GET method for SSE
export const POST: APIRoute = async () => {
  const errorResponse: ErrorResponseDTO = {
    error: "METHOD_NOT_ALLOWED",
    message: "Metoda POST nie jest obsługiwana dla tego endpointu",
  };
  return new Response(JSON.stringify(errorResponse), {
    status: 405,
    headers: { "Content-Type": "application/json" },
  });
};
