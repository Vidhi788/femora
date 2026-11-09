# Femora Frontend

A warm, motion-rich React interface for the Femora wellness platform.

## Scripts

```bash
npm run dev      # start the dev server on http://localhost:5173
npm run build    # production build into dist/
npm run preview  # preview the production build
npm run lint     # eslint
```

## Backend

The UI talks to the Spring Boot API, which must be running on `http://localhost:8080`.

| Method | Endpoint             | Body                      | Success                       |
| ------ | -------------------- | ------------------------- | ----------------------------- |
| POST   | /api/auth/register   | name, email, password     | 201 { message, userId }       |
| POST   | /api/auth/login      | email, password           | 200 { message, userId, name, email } |
| GET    | /api/dashboard       | -                         | 200 { message, status }       |

Point the UI somewhere else with an env var:

```bash
# .env.local
VITE_API_URL=http://localhost:8080
```

## Structure

```
src/
  api/client.js        typed fetch helpers + friendly error messages
  components/          brand, backdrop, fields, cards, ring, toast, skeleton
  hooks/               count-up and media-query helpers
  pages/               Login, Register, Dashboard
  styles/              design tokens, base layer, page styles
```

## Motion

All animation is CSS driven (keyframes, transitions, `requestAnimationFrame` for
number count-ups) so no extra runtime dependency is needed. Every animation is
disabled under `prefers-reduced-motion: reduce`.
