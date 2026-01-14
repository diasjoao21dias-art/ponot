import { z } from 'zod';
import { insertUserSchema, insertTimeEntrySchema, users, timeEntries } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
  }),
  unauthorized: z.object({
    message: z.string(),
  }),
  serverError: z.object({
    message: z.string(),
  }),
};

export const api = {
  auth: {
    login: {
      method: 'POST' as const,
      path: '/api/login',
      input: z.object({
        username: z.string(),
        password: z.string(),
      }),
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        401: errorSchemas.unauthorized,
      },
    },
    logout: {
      method: 'POST' as const,
      path: '/api/logout',
      responses: {
        200: z.object({ message: z.string() }),
      },
    },
    me: {
      method: 'GET' as const,
      path: '/api/user',
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        401: errorSchemas.unauthorized,
      },
    },
  },
  users: {
    list: {
      method: 'GET' as const,
      path: '/api/users',
      responses: {
        200: z.array(z.custom<typeof users.$inferSelect>()),
        403: errorSchemas.unauthorized,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/users',
      input: insertUserSchema,
      responses: {
        201: z.custom<typeof users.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/users/:id',
      input: insertUserSchema.partial(),
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/users/:id',
      responses: {
        200: z.object({ message: z.string() }),
      },
    },
  },
  points: {
    clockIn: {
      method: 'POST' as const,
      path: '/api/points',
      input: z.object({ type: z.enum(['entrada', 'saida']) }),
      responses: {
        201: z.custom<typeof timeEntries.$inferSelect>(),
      },
    },
    list: {
      method: 'GET' as const,
      path: '/api/points',
      input: z.object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        userId: z.string().optional(),
      }).optional(),
      responses: {
        200: z.array(z.custom<typeof timeEntries.$inferSelect & { user: typeof users.$inferSelect }>()),
      },
    },
    exportAfd: {
      method: 'GET' as const,
      path: '/api/points/export/afd',
      input: z.object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      }).optional(),
      responses: {
        200: z.any(), // Arquivo blob/text
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
