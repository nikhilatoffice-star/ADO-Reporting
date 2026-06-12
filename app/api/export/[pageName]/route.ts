export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';

export async function GET(request: Request, { params }: { params: { pageName: string } }) {
  // In a full production environment, you would use Puppeteer or react-pdf here.
  // We return 501 Not Implemented to gracefully trigger the browser print fallback.
  return NextResponse.json(
    { error: "Puppeteer export not configured. Falling back to native browser print." },
    { status: 501 }
  );
}
