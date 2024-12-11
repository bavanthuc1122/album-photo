import { NextResponse } from 'next/server';

export function middleware(request) {
  // Kiểm tra nếu đang truy cập trang albums
  if (request.nextUrl.pathname.startsWith('/albums')) {
    // Kiểm tra token và user từ localStorage
    const token = request.cookies.get('token');
    const user = request.cookies.get('user');
    
    if (!token || !user) {
      // Nếu chưa đăng nhập, chuyển về trang login
      return NextResponse.redirect(new URL('/login', request.url));
    }

    try {
      // Parse user data để kiểm tra username
      const userData = JSON.parse(user.value);
      if (!userData.username) {
        return NextResponse.redirect(new URL('/login', request.url));
      }
    } catch (error) {
      console.error('Invalid user data:', error);
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/api/albums/:path*',
    '/albums/:path*'
  ]
};