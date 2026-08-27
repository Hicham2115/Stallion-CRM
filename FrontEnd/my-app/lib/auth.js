/**
 * AUTHENTICATION BOUNDARY
 *
 *  The login UI never talks to an auth provider directly — it only calls the
 *  two functions below. That keeps the whole integration in one file: swap the
 *  bodies for NextAuth / Supabase / your own API and the UI keeps working
 *  unchanged, including its loading, error and field-level error states.
 *
 *  Nothing here runs on the server yet, so no secrets belong in this file.
 *  When you wire a real provider, move the network call behind a Route Handler
 *  or a Server Action and have these functions call that instead.
 */
/**
 * Flip to `true` once the TODO blocks below actually call your backend.
 * While it is `false` the form runs its full validation and loading states,
 * then returns an explanatory notice instead of pretending to log anyone in.
 */
const AUTH_BACKEND_CONNECTED = false;
/**
 * Whether sign-in can actually succeed, exposed so the UI can tell the truth
 * about itself.
 *
 * `/login` reads this to decide whether to run in preview mode — see
 * `features.previewFallback` in config/login.ts. Deriving it from the same
 * constant the stubs check means the screen cannot claim to be connected while
 * the functions below are still stubs, and nobody has to remember to flip a
 * second flag on the day the backend lands.
 */
export const authBackendConnected = AUTH_BACKEND_CONNECTED;
/** Small helper so the pending state is visible while the stub is in place. */
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
/**
 * Email + password sign-in.
 *
 * Never throw from here for expected failures (wrong password, locked account,
 * unverified email). Return `{ ok: false, message }` so the user sees a helpful
 * message instead of an error boundary. Reserve throwing for genuine outages.
 */
export async function signInWithPassword(credentials) {
    if (!AUTH_BACKEND_CONNECTED) {
        await delay(700);
        // The developer instruction goes to the console, where its audience is.
        // It used to be the `message` — so the only thing this screen could
        // produce was a file path and a function name, shown to whoever was
        // looking at the product. A user-facing string names what the person can
        // do next; it never names a symbol they cannot open.
        console.warn("[auth] AUTH_BACKEND_CONNECTED is false — implement signInWithPassword() in lib/auth.ts.");
        return {
            ok: false,
            message: "Sign-in is not available in this preview build.",
        };
    }
    // TODO: replace everything below with your real provider call.
    //
    // Example shape with a Route Handler at app/api/auth/login/route.ts:
    //
    //   const response = await fetch("/api/auth/login", {
    //     method: "POST",
    //     headers: { "Content-Type": "application/json" },
    //     body: JSON.stringify(credentials),
    //   });
    //
    //   if (response.status === 401) {
    //     return { ok: false, message: "Incorrect email or password." };
    //   }
    //   if (!response.ok) {
    //     return { ok: false, message: "We could not reach the server." };
    //   }
    //   return { ok: true };
    //
    // Security notes for whoever implements this:
    //   - Return the SAME message for "unknown email" and "wrong password", so
    //     the form cannot be used to discover which addresses have accounts.
    //   - Rate-limit by IP and by email on the server.
    //   - Set the session cookie server-side as httpOnly + secure + sameSite.
    //   - `credentials.remember` should control cookie maxAge, nothing else.
    void credentials;
    return { ok: false, message: "signInWithPassword() is not implemented." };
}
/**
 * Google SSO. Only reachable when `features.googleSignIn` is true in
 * config/login.ts. Typically a redirect, so it does not return a result —
 * the browser leaves the page.
 */
export async function signInWithGoogle() {
    if (!AUTH_BACKEND_CONNECTED) {
        await delay(500);
        // Same rule as signInWithPassword: the instruction is for the developer,
        // the thrown message is for the person looking at the screen.
        console.warn("[auth] AUTH_BACKEND_CONNECTED is false — implement signInWithGoogle() in lib/auth.ts.");
        throw new Error("Google sign-in is not available in this preview build.");
    }
    // TODO: kick off your OAuth flow, e.g.
    //   await signIn("google", { callbackUrl: loginConfig.routes.afterSignIn })
    // or redirect to your provider's authorize endpoint.
}
