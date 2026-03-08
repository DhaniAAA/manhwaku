"use server";
import { cookies } from "next/headers";

export async function verifyAdminPin(pin: string) {
    const correctPin = process.env.NEXT_PRIVATE_ADMIN_PIN;
    if (pin === correctPin) {
        const cookieStore = await cookies();
        cookieStore.set("admin_token", "authenticated", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            path: "/",
            maxAge: 60 * 60 * 24 * 7 // 1 week
        });
        return { success: true };
    }
    return { success: false, error: "Kode akses salah!" };
}

export async function logoutAdmin() {
    const cookieStore = await cookies();
    cookieStore.delete("admin_token");
    return { success: true };
}
