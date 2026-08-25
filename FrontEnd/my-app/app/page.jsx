import { redirect } from "next/navigation";
import { loginConfig } from "@/config/login";

export default function Home() {
  redirect(loginConfig.routes.login);
}
