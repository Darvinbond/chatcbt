import { NextResponse } from 'next/server'

export class ApiResponseBuilder {
  static success<T>(data: T, meta?: any): NextResponse {
    return NextResponse.json({
      success: true,
      data,
      meta,
    })
  }
  
  static error(code: string, message: string, status = 400): NextResponse {
    return NextResponse.json({
      success: false,
      error: { code, message },
    }, { status })
  }
  
  static unauthorized(): NextResponse {
    return this.error('UNAUTHORIZED', 'Authentication required', 401)
  }
  
  static notFound(resource: string): NextResponse {
    return this.error('NOT_FOUND', `${resource} not found`, 404)
  }
}
