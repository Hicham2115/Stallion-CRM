import axios from "axios";

/** Talks to this Next.js app's own route handlers (relative URLs) — those
 * routes are what proxy through to the Laravel backend. */
export const api = axios.create({
  timeout: 15000,
});
