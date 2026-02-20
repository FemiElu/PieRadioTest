import { NextResponse } from 'next/server';

/**
 * Production Health Check Endpoint
 * Used for automated monitoring and Uptime checks.
 */
export const dynamic = 'force-dynamic';

export async function GET() {
    return NextResponse.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV
    });
}
