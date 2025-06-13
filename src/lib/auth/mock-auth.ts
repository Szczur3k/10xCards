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
    id: 'mock-flashcard-1',
    user_id: '550e8400-e29b-41d4-a716-446655440000',
    front: 'Co to jest TypeScript?',
    back: 'TypeScript to statycznie typowany superset JavaScript',
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
    id: 'mock-flashcard-2',
    user_id: '550e8400-e29b-41d4-a716-446655440000',
    front: 'Jak działa React?',
    back: 'React to biblioteka JavaScript do budowania interfejsów użytkownika',
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
    id: 'mock-flashcard-3',
    user_id: '550e8400-e29b-41d4-a716-446655440000',
    front: 'Co to jest Node.js?',
    back: 'Node.js to środowisko uruchomieniowe JavaScript po stronie serwera',
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
          data: [...MOCK_FLASHCARDS], // Copy the mock data
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
              
              return { data: null, error: new Error('Mock: Single select not implemented for this table') };
            },
            in: (column: string, values: string[]) => {
              console.log(`🔧 Mock SELECT from ${table} WHERE ${column} IN`, values);
              
              return {
                then: async (resolve: (result: any) => void) => {
                  // Mock categories/groups validation - always return valid data
                  if (table === 'categories' || table === 'groups') {
                    const mockData = values.map(id => ({
                      id,
                      name: `Mock ${table.slice(0, -1)} ${id.slice(0, 8)}`
                    }));
                    resolve({ data: mockData, error: null });
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
          })
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
        })
      })
    })
  };
} 