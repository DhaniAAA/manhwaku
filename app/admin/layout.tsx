import { cookies } from "next/headers";
import AdminClientLayout from "./AdminClientLayout";
import LoginForm from "./LoginForm";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
    const cookieStore = await cookies();
    const token = cookieStore.get("admin_token")?.value;

    // Server-side check: super secure
    // Jika tidak ada token yang valid, maka render LoginForm dan jangan kirimkan `children` ke client.
    if (token !== "authenticated") {
        return <LoginForm />;
    }

    return <AdminClientLayout>{children}</AdminClientLayout>;
}

