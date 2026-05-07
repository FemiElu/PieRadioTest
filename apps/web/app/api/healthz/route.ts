import { NextResponse } from 'next/server';

/**
 * Production Health Check Endpoint
 * Used for automated monitoring and Uptime checks.
 */
// Short CDN cache — uptime monitors won't trigger a fresh invocation every ping.
// The function still runs fresh; only repeat requests within 10s are served from cache.
export const revalidate = 10;

export async function GET() {
    return NextResponse.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV
    });
}
