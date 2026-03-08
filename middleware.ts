import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
    const path = request.nextUrl.pathname;

    // Hanya lindungi endpoint API admin dari akses luar
    if (path.startsWith('/api/admin')) {
        const token = request.cookies.get('admin_token')?.value;
        if (token !== 'authenticated') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/api/admin/:path*'],
}
