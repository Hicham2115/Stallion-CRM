import { redirect } from "next/navigation";

import { loginConfig } from "@/config/login";

/**
 * The CRM has no public marketing page — the root simply hands off to auth.
 *
 * Once a dashboard exists, this is where you check for a session and send
 * signed-in users to loginConfig.routes.afterSignIn instead.
 */
export default function Home() {
  redirect(loginConfig.routes.login);
}

