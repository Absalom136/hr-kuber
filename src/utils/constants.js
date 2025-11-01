// src/utils/constants.js

export const CSRF_TOKEN = document.cookie
  .split('; ')
  .find(row => row.startsWith('csrftoken='))
  ?.split('=')[1] || '';

export const buildUrl = (path) => {
  const base = import.meta.env.VITE_API_BASE_URL || '';
  return `${base}${path}`;
};