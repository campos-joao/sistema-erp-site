import { signOut } from "@/auth";

// Usado pelo DAL quando o JWT é válido mas o usuário não existe mais.
export async function GET() {
  await signOut({ redirectTo: "/login" });
}
