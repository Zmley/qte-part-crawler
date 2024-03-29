/**
 * Express router paths go here.
 */

export default {
  Base: '/api',
  Users: {
    Base: '/users',
    Get: '/all',
    Add: '/add',
    Update: '/update',
    Delete: '/delete/:id'
  },
  Parts: {
    Base: '/parts',
    Add: '/add'
  }
} as const
