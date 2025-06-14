/**
 * Mock authentication utility for development and testing
 * Simulates authenticated user without real JWT tokens
 */

export interface MockUser {
  id: string;
  email: string;
  role: 'user' | 'admin';
  created_at: string;
}

/**
 * Default mock user for testing
 */
const DEFAULT_MOCK_USER: MockUser = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  email: 'test@example.com',
  role: 'user',
  created_at: new Date().toISOString()
};

/**
 * Mock AI models data for testing
 * Converted from ai-models.config.ts to AIModelDTO format
 */
const MOCK_AI_MODELS = [
  // Free Models
  {
    id: "meta-llama/llama-3.1-8b-instruct:free",
    name: "Llama 3.1 8B (Free)",
    provider: "openrouter",
    cost_per_1k_tokens: 0.0,
    max_tokens: 4096,
    average_response_time_ms: 2000,
    quality_score: 0.88,
    recommended_for: ["general", "reasoning", "free"],
    is_default: true, // First free model as default
    is_available: true,
    requires_api_key: false
  },
  {
    id: "meta-llama/llama-3.3-70b-instruct:free",
    name: "Llama 3.3 70B (Free)",
    provider: "openrouter",
    cost_per_1k_tokens: 0.0,
    max_tokens: 4096,
    average_response_time_ms: 3500,
    quality_score: 0.92,
    recommended_for: ["complex", "reasoning", "quality"],
    is_default: false,
    is_available: true,
    requires_api_key: false
  },
  {
    id: "qwen/qwen3-30b-a3b:free",
    name: "Qwen3 30B A3B (Free)",
    provider: "openrouter",
    cost_per_1k_tokens: 0.0,
    max_tokens: 40960,
    average_response_time_ms: 2800,
    quality_score: 0.90,
    recommended_for: ["reasoning", "multilingual", "long-context"],
    is_default: false,
    is_available: true,
    requires_api_key: false
  },
  {
    id: "mistralai/mistral-7b-instruct:free",
    name: "Mistral 7B (Free)",
    provider: "openrouter",
    cost_per_1k_tokens: 0.0,
    max_tokens: 4096,
    average_response_time_ms: 1800,
    quality_score: 0.85,
    recommended_for: ["speed", "general", "multilingual"],
    is_default: false,
    is_available: true,
    requires_api_key: false
  },
  {
    id: "google/gemma-2-9b-it:free",
    name: "Gemma 2 9B (Free)",
    provider: "openrouter",
    cost_per_1k_tokens: 0.0,
    max_tokens: 4096,
    average_response_time_ms: 2200,
    quality_score: 0.83,
    recommended_for: ["general", "instruction-following", "google"],
    is_default: false,
    is_available: true,
    requires_api_key: false
  },
  {
    id: "deepseek/deepseek-r1:free",
    name: "DeepSeek R1 (Free)",
    provider: "openrouter",
    cost_per_1k_tokens: 0.0,
    max_tokens: 4096,
    average_response_time_ms: 3000,
    quality_score: 0.89,
    recommended_for: ["reasoning", "thinking", "complex"],
    is_default: false,
    is_available: true,
    requires_api_key: false
  },
  // Paid Models - marked as unavailable due to missing API keys
  {
    id: "openai/gpt-4o-mini",
    name: "GPT-4o Mini",
    provider: "openrouter",
    cost_per_1k_tokens: 0.00015,
    max_tokens: 4096,
    average_response_time_ms: 1200,
    quality_score: 0.92,
    recommended_for: ["general", "academic", "quality"],
    is_default: false,
    is_available: false,
    requires_api_key: true,
    unavailable_reason: "API key not configured"
  },
  {
    id: "openai/gpt-4o",
    name: "GPT-4o",
    provider: "openrouter",
    cost_per_1k_tokens: 0.005,
    max_tokens: 4096,
    average_response_time_ms: 2000,
    quality_score: 0.95,
    recommended_for: ["complex", "research", "premium"],
    is_default: false,
    is_available: false,
    requires_api_key: true,
    unavailable_reason: "API key not configured"
  },
  {
    id: "anthropic/claude-3.5-sonnet",
    name: "Claude 3.5 Sonnet",
    provider: "openrouter",
    cost_per_1k_tokens: 0.003,
    max_tokens: 4096,
    average_response_time_ms: 2200,
    quality_score: 0.93,
    recommended_for: ["analysis", "writing", "complex"],
    is_default: false,
    is_available: false,
    requires_api_key: true,
    unavailable_reason: "API key not configured"
  }
];

/**
 * Mock source texts for AI generation testing
 */
const MOCK_SOURCE_TEXTS = [
  {
    id: 'mock-source-1',
    user_id: '550e8400-e29b-41d4-a716-446655440000',
    content: 'TypeScript to statycznie typowany superset JavaScript. Dodaje typy do JavaScript, co pomaga w wykrywaniu błędów podczas kompilacji.',
    created_at: '2024-01-13T14:45:00Z'
  },
  {
    id: 'mock-source-2',
    user_id: '550e8400-e29b-41d4-a716-446655440000',
    content: 'React to biblioteka JavaScript do budowania interfejsów użytkownika. Używa komponentów i wirtualnego DOM.',
    created_at: '2024-01-12T10:30:00Z'
  }
];

/**
 * Gets mock user based on environment settings
 * @param userId - Optional specific user ID to mock
 * @returns MockUser object
 */
export function getMockUser(userId?: string): MockUser {
  if (userId) {
    return {
      ...DEFAULT_MOCK_USER,
      id: userId,
      email: `test-${userId}@example.com`
    };
  }
  
  return DEFAULT_MOCK_USER;
}

/**
 * Checks if mock auth is enabled via environment variable
 */
export function isMockAuthEnabled(): boolean {
  return import.meta.env.MOCK_AUTH === 'true' || 
         import.meta.env.DEV === true;
}

/**
 * Mock Supabase auth response structure
 */
export function createMockAuthResponse(user: MockUser) {
  return {
    data: { user },
    error: null
  };
}

/**
 * Mock flashcard data for testing GET endpoints
 */
const MOCK_FLASHCARDS = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    user_id: '550e8400-e29b-41d4-a716-446655440000',
    front: 'Co to jest TypeScript?',
    back: 'TypeScript to statycznie typowany superset JavaScript, który dodaje typy do kodu co pomaga w wykrywaniu błędów podczas kompilacji.',
    creation_type: 'manual',
    status: 'draft',
    source_text_id: null,
    created_at: '2024-01-15T10:30:00Z',
    updated_at: '2024-01-15T10:30:00Z',
    flashcard_categories: [
      { categories: { id: 'cat-1', name: 'Frontend' } }
    ],
    flashcard_groups: [
      { groups: { id: 'group-1', name: 'Podstawy' } }
    ]
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    user_id: '550e8400-e29b-41d4-a716-446655440000',
    front: 'Jak działa React?',
    back: 'React to biblioteka JavaScript do budowania interfejsów użytkownika. Używa komponentów i wirtualnego DOM do efektywnego renderowania.',
    creation_type: 'manual',
    status: 'published',
    source_text_id: null,
    created_at: '2024-01-14T09:15:00Z',
    updated_at: '2024-01-14T09:15:00Z',
    flashcard_categories: [
      { categories: { id: 'cat-1', name: 'Frontend' } },
      { categories: { id: 'cat-2', name: 'React' } }
    ],
    flashcard_groups: []
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    user_id: '550e8400-e29b-41d4-a716-446655440000',
    front: 'Co to jest Node.js?',
    back: 'Node.js to środowisko uruchomieniowe JavaScript po stronie serwera, które pozwala uruchamiać kod JavaScript poza przeglądarką.',
    creation_type: 'llm',
    status: 'published',
    source_text_id: 'mock-source-1',
    created_at: '2024-01-13T14:45:00Z',
    updated_at: '2024-01-13T14:45:00Z',
    flashcard_categories: [
      { categories: { id: 'cat-3', name: 'Backend' } }
    ],
    flashcard_groups: [
      { groups: { id: 'group-1', name: 'Podstawy' } }
    ]
  },
  {
    id: '44444444-4444-4444-4444-444444444444',
    user_id: '550e8400-e29b-41d4-a716-446655440000',
    front: 'Czym różni się CSS Grid od Flexbox?',
    back: 'CSS Grid jest dwuwymiarowy (wiersze i kolumny), podczas gdy Flexbox jest jednowymiarowy (jeden kierunek). Grid lepiej nadaje się do layoutów, Flexbox do wyrównywania elementów.',
    creation_type: 'llm',
    status: 'draft',
    source_text_id: 'mock-source-2',
    created_at: '2024-01-12T16:20:00Z',
    updated_at: '2024-01-12T16:20:00Z',
    flashcard_categories: [
      { categories: { id: 'cat-1', name: 'Frontend' } },
      { categories: { id: 'cat-4', name: 'CSS' } }
    ],
    flashcard_groups: [
      { groups: { id: 'group-2', name: 'Styling' } }
    ]
  },
  {
    id: '55555555-5555-5555-5555-555555555555',
    user_id: '550e8400-e29b-41d4-a716-446655440000',
    front: 'Co to jest REST API?',
    back: 'REST API to architektura interfejsu programistycznego oparta na protokole HTTP, używająca standardowych metod (GET, POST, PUT, DELETE) do manipulacji zasobami.',
    creation_type: 'manual',
    status: 'published',
    source_text_id: null,
    created_at: '2024-01-11T11:45:00Z',
    updated_at: '2024-01-11T11:45:00Z',
    flashcard_categories: [
      { categories: { id: 'cat-3', name: 'Backend' } },
      { categories: { id: 'cat-5', name: 'API' } }
    ],
    flashcard_groups: [
      { groups: { id: 'group-1', name: 'Podstawy' } }
    ]
  },
  {
    id: '66666666-6666-6666-6666-666666666666',
    user_id: '550e8400-e29b-41d4-a716-446655440000',
    front: 'Jak działa useState w React?',
    back: 'useState to React Hook, który pozwala dodać stan do komponentów funkcyjnych. Zwraca tablicę z wartością stanu i funkcją do jego aktualizacji.',
    creation_type: 'llm',
    status: 'archived',
    source_text_id: 'mock-source-1',
    created_at: '2024-01-10T14:30:00Z',
    updated_at: '2024-01-15T09:00:00Z',
    flashcard_categories: [
      { categories: { id: 'cat-2', name: 'React' } }
    ],
    flashcard_groups: [
      { groups: { id: 'group-3', name: 'Hooks' } }
    ]
  },
  {
    id: '77777777-7777-7777-7777-777777777777',
    user_id: '550e8400-e29b-41d4-a716-446655440000',
    front: 'Co to jest SQL?',
    back: 'SQL (Structured Query Language) to język programowania służący do zarządzania bazami danych relacyjnych. Pozwala na tworzenie, odczytywanie, aktualizowanie i usuwanie danych.',
    creation_type: 'manual',
    status: 'draft',
    source_text_id: null,
    created_at: '2024-01-09T13:15:00Z',
    updated_at: '2024-01-09T13:15:00Z',
    flashcard_categories: [
      { categories: { id: 'cat-6', name: 'Database' } }
    ],
    flashcard_groups: [
      { groups: { id: 'group-1', name: 'Podstawy' } }
    ]
  },
  {
    id: '88888888-8888-8888-8888-888888888888',
    user_id: '550e8400-e29b-41d4-a716-446655440000',
    front: 'Czym jest GraphQL?',
    back: 'GraphQL to język zapytań i środowisko uruchomieniowe dla API, które pozwala klientom żądać dokładnie tych danych, których potrzebują.',
    creation_type: 'llm',
    status: 'published',
    source_text_id: 'mock-source-2',
    created_at: '2024-01-08T10:00:00Z',
    updated_at: '2024-01-08T10:00:00Z',
    flashcard_categories: [
      { categories: { id: 'cat-5', name: 'API' } },
      { categories: { id: 'cat-3', name: 'Backend' } }
    ],
    flashcard_groups: [
      { groups: { id: 'group-4', name: 'Zaawansowane' } }
    ]
  }
];

/**
 * Creates a mock Supabase client with auth methods
 * Now supports both POST (create) and GET (read) operations
 */
export function createMockSupabaseClient() {
  const mockUser = getMockUser();
  
  return {
    auth: {
      getUser: async () => createMockAuthResponse(mockUser)
    },
    from: (table: string) => ({
      insert: (data: any) => ({
        select: (fields: string) => ({
          single: async () => {
            console.log(`🔧 Mock INSERT into ${table}:`, data);
            // Generate mock response based on table
            if (table === 'flashcards') {
              return {
                data: {
                  id: crypto.randomUUID(),
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                  ...data
                },
                error: null
              };
            }
            
            if (table === 'source_texts') {
              const newSourceText = {
                id: crypto.randomUUID(),
                created_at: new Date().toISOString(),
                ...data
              };
              // Add to mock data for future queries
              MOCK_SOURCE_TEXTS.push(newSourceText);
              return {
                data: newSourceText,
                error: null
              };
            }
            
            if (table === 'flashcard_categories' || table === 'flashcard_groups') {
              return {
                data: data,
                error: null
              };
            }
            
            return { data: null, error: new Error('Mock: Table not implemented') };
          }
        }),
        // For relationship tables without select
        then: async (resolve: (result: any) => void) => {
          console.log(`🔧 Mock INSERT (batch) into ${table}:`, data);
          resolve({ data: data, error: null });
        }
      }),
      select: (fields: string) => {
        console.log(`🔧 Mock SELECT from ${table}:`, fields);
        
        // Create a query builder that can be chained
        const mockQuery: any = {
          data: table === 'ai_models' ? [...MOCK_AI_MODELS] : 
                table === 'source_texts' ? [...MOCK_SOURCE_TEXTS] : 
                [...MOCK_FLASHCARDS], // Default to flashcards
          filters: {} as Record<string, any>,
          sorts: {} as { column?: string, ascending?: boolean },
          pagination: { offset: 0, limit: null as number | null }
        };
        
        // Function to execute the query with current state
        const executeQuery = () => {
          let filteredData = mockQuery.data;
          
          if (table === 'flashcards') {
            Object.entries(mockQuery.filters).forEach(([column, value]) => {
              filteredData = filteredData.filter((item: any) => item[column] === value);
            });
            
            // Apply sorting
            if (mockQuery.sorts.column) {
              filteredData.sort((a: any, b: any) => {
                const aVal = a[mockQuery.sorts.column];
                const bVal = b[mockQuery.sorts.column];
                const comparison = aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
                return mockQuery.sorts.ascending ? comparison : -comparison;
              });
            }
            
            // Apply pagination
            if (mockQuery.pagination.limit !== null) {
              filteredData = filteredData.slice(
                mockQuery.pagination.offset,
                mockQuery.pagination.offset + mockQuery.pagination.limit
              );
            }
          } else if (table === 'ai_models') {
            // Return mock AI models
            filteredData = [...MOCK_AI_MODELS];
          } else if (table === 'source_texts') {
            // Return mock source texts, filter by user_id if specified
            filteredData = [...MOCK_SOURCE_TEXTS];
            Object.entries(mockQuery.filters).forEach(([column, value]) => {
              filteredData = filteredData.filter((item: any) => item[column] === value);
            });
          }
          
          return { data: filteredData, error: null };
        };
        
        // Create the query builder interface that returns itself for chaining
        const buildQueryMethods = (): any => {
          const methods = {
            eq: (column: string, value: any) => {
              console.log(`🔧 Mock WHERE ${column} = ${value}`);
              mockQuery.filters[column] = value;
              return buildQueryMethods(); // Return full interface for chaining
            },
            order: (column: string, options: { ascending?: boolean } = {}) => {
              console.log(`🔧 Mock ORDER BY ${column} ${options.ascending ? 'ASC' : 'DESC'}`);
              mockQuery.sorts = { column, ascending: options.ascending || false };
              return buildQueryMethods(); // Return full interface for chaining
            },
            range: (from: number, to: number) => {
              console.log(`🔧 Mock LIMIT ${to - from + 1} OFFSET ${from}`);
              mockQuery.pagination = { offset: from, limit: to - from + 1 };
              return buildQueryMethods(); // Return full interface for chaining
            },
            then: (resolve?: (result: any) => void, reject?: (error: any) => void) => {
              const result = executeQuery();
              if (resolve) resolve(result);
              return Promise.resolve(result);
            },
            single: async () => {
              console.log(`🔧 Mock SELECT single from ${table}`);
              
              if (table === 'flashcards') {
                let filteredData = [...MOCK_FLASHCARDS];
                
                // Apply filters to find specific flashcard
                Object.entries(mockQuery.filters).forEach(([column, value]) => {
                  filteredData = filteredData.filter((item: any) => item[column] === value);
                });
                
                if (filteredData.length === 0) {
                  return { data: null, error: new Error('Flashcard not found') };
                }
                
                return { data: filteredData[0], error: null };
              }
              
              if (table === 'source_texts') {
                let filteredData = [...MOCK_SOURCE_TEXTS];
                
                // Apply filters to find specific source text
                Object.entries(mockQuery.filters).forEach(([column, value]) => {
                  filteredData = filteredData.filter((item: any) => item[column] === value);
                });
                
                if (filteredData.length === 0) {
                  return { data: null, error: new Error('Source text not found') };
                }
                
                return { data: filteredData[0], error: null };
              }
              
              return { data: null, error: new Error('Mock: Single select not implemented for this table') };
            },
            in: (column: string, values: string[]) => {
              console.log(`🔧 Mock SELECT from ${table} WHERE ${column} IN`, values);
              
              // Update query filters for IN operation
              mockQuery.filters[`${column}_in`] = values;
              
              // Return query builder with support for further chaining
              return {
                eq: (column2: string, value2: any) => {
                  console.log(`🔧 Mock AND WHERE ${column2} = ${value2}`);
                  mockQuery.filters[column2] = value2;
                  return buildQueryMethods();
                },
                then: async (resolve: (result: any) => void) => {
                  // Mock categories/groups validation - always return valid data
                  if (table === 'categories' || table === 'groups') {
                    const mockData = values.map(id => ({
                      id,
                      name: `Mock ${table.slice(0, -1)} ${id.slice(0, 8)}`
                    }));
                    resolve({ data: mockData, error: null });
                  } else if (table === 'flashcards') {
                    // Handle flashcards IN query with additional filters
                    let filteredData = MOCK_FLASHCARDS.filter((flashcard: any) => 
                      values.includes(flashcard[column])
                    );
                    
                    // Apply additional filters
                    Object.entries(mockQuery.filters).forEach(([filterCol, filterVal]) => {
                      if (!filterCol.endsWith('_in')) {
                        filteredData = filteredData.filter((item: any) => item[filterCol] === filterVal);
                      }
                    });
                    
                    resolve({ data: filteredData, error: null });
                  } else {
                    resolve({ data: [], error: null });
                  }
                }
              };
            }
          };
          
          return methods;
        };
        
        return buildQueryMethods();
      },
      update: (data: any) => ({
        eq: (column: string, value: any) => ({
          select: (fields: string) => ({
            single: async () => {
              console.log(`🔧 Mock UPDATE ${table} SET`, data, `WHERE ${column} = ${value}`);
              
              if (table === 'flashcards') {
                // Find the flashcard in mock data
                const flashcard = MOCK_FLASHCARDS.find((f: any) => f[column] === value);
                if (!flashcard) {
                  return { data: null, error: new Error('Flashcard not found') };
                }
                
                // Update the flashcard data
                const updatedFlashcard = {
                  ...flashcard,
                  ...data,
                  updated_at: new Date().toISOString()
                };
                
                return { data: updatedFlashcard, error: null };
              }
              
              return { data: null, error: new Error('Mock: Update not implemented for this table') };
            }
          }),
          then: async (resolve: (result: any) => void) => {
            console.log(`🔧 Mock UPDATE ${table} SET`, data, `WHERE ${column} = ${value}`);
            resolve({ data: null, error: null });
          }
        }),
        in: (column: string, values: string[]) => ({
          eq: (column2: string, value2: any) => ({
            then: async (resolve: (result: any) => void) => {
              console.log(`🔧 Mock UPDATE ${table} SET`, data, `WHERE ${column} IN`, values, `AND ${column2} = ${value2}`);
              
              if (table === 'flashcards') {
                // Find flashcards matching the criteria
                const matchingFlashcards = MOCK_FLASHCARDS.filter((flashcard: any) => 
                  values.includes(flashcard[column]) && flashcard[column2] === value2
                );
                
                console.log(`🔧 Found ${matchingFlashcards.length} flashcards to update`);
                resolve({ data: null, error: null });
              } else {
                resolve({ data: null, error: null });
              }
            }
          }),
          then: async (resolve: (result: any) => void) => {
            console.log(`🔧 Mock UPDATE ${table} SET`, data, `WHERE ${column} IN`, values);
            resolve({ data: null, error: null });
          }
        })
      }),
      delete: () => ({
        eq: (column: string, value: any) => ({
          then: async (resolve: (result: any) => void) => {
            console.log(`🔧 Mock DELETE from ${table} WHERE ${column} = ${value}`);
            
            if (table === 'flashcards') {
              // Check if flashcard exists
              const flashcard = MOCK_FLASHCARDS.find((f: any) => f[column] === value);
              if (!flashcard) {
                resolve({ data: null, error: new Error('Flashcard not found') });
                return;
              }
            }
            
            resolve({ data: null, error: null });
          }
        }),
        in: (column: string, values: string[]) => ({
          eq: (column2: string, value2: any) => ({
            then: async (resolve: (result: any) => void) => {
              console.log(`🔧 Mock DELETE from ${table} WHERE ${column} IN`, values, `AND ${column2} = ${value2}`);
              
              if (table === 'flashcards') {
                // Find flashcards matching the criteria
                const matchingFlashcards = MOCK_FLASHCARDS.filter((flashcard: any) => 
                  values.includes(flashcard[column]) && flashcard[column2] === value2
                );
                
                console.log(`🔧 Found ${matchingFlashcards.length} flashcards to delete`);
                resolve({ data: null, error: null });
              } else {
                resolve({ data: null, error: null });
              }
            }
          }),
          then: async (resolve: (result: any) => void) => {
            console.log(`🔧 Mock DELETE from ${table} WHERE ${column} IN`, values);
            resolve({ data: null, error: null });
          }
        })
      })
    })
  };
} 