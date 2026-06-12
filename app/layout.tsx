import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "../components/nav/Sidebar";
import { fetchOData } from "../lib/ado-client";
import { ADOIteration } from "../lib/types";
import { supabase } from "../lib/supabase";

export const metadata: Metadata = {
  title: process.env.NEXT_PUBLIC_APP_TITLE || "eComm IT Reporting Portal",
  description: "Executive reporting dashboard for ADO sprint analytics",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let sprints: ADOIteration[] = [];
  try {
    const rawSprints = await fetchOData<ADOIteration>("Iterations?$orderby=StartDate asc");
    
    // Filter to last 6 months and next 6 months
    const now = new Date();
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(now.getMonth() - 6);
    const sixMonthsFuture = new Date();
    sixMonthsFuture.setMonth(now.getMonth() + 6);
    
    const timeFiltered = rawSprints.filter(s => {
      if (!s.StartDate) return false;
      const start = new Date(s.StartDate);
      return start >= sixMonthsAgo && start <= sixMonthsFuture;
    });

    // Sort by StartDate asc
    timeFiltered.sort((a, b) => {
      if (!a.StartDate) return 1;
      if (!b.StartDate) return -1;
      return new Date(a.StartDate).getTime() - new Date(b.StartDate).getTime();
    });
    
    sprints = timeFiltered;
  } catch (err) {
    console.error("Failed to fetch sprints:", err);
  }

  // Fetch the last sync time
  let lastSyncTime: string | null = null;
  try {
    const { data: syncData, error } = await supabase
      .from('ado_work_items')
      .select('last_synced_at')
      .limit(1)
      .order('last_synced_at', { ascending: false });
      
    if (syncData && syncData.length > 0) {
      lastSyncTime = syncData[0].last_synced_at;
    }
  } catch (err) {
    console.error("Failed to fetch last sync time:", err);
  }

  return (
    <html lang="en" className="h-full">
      <body className="h-full bg-[#FFFFFF] text-[#172B4D] antialiased flex">
        {/* Sidebar navigation is fixed on the left */}
        <Sidebar sprints={sprints} lastSyncTime={lastSyncTime} appTitle={process.env.NEXT_PUBLIC_APP_TITLE} />
        
        {/* Main Content Area */}
        <main className="flex-1 min-h-screen pl-64 print:pl-0 flex flex-col bg-[#FFFFFF] print:bg-white">
          <div className="flex-1 flex flex-col max-w-[1600px] w-full mx-auto p-8">
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}
