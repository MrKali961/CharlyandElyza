import type { Metadata } from "next";
import { WeddingGuestTracker } from "@/components/WeddingGuestTracker";

export const metadata: Metadata = {
    title: "Charly&Elyza x The Elites",
    description: "Wedding Guest Dashboard for Charly and Elyza",
    icons: "/Logo.png",
};

export default function DashboardPage() {
    return (
        <div className="bg-black min-h-screen">
            <WeddingGuestTracker />
        </div>
    );
}