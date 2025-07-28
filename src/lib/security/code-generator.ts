import { customAlphabet } from 'nanoid'

// Alphanumeric without ambiguous characters (0, O, I, l)
const generateCode = customAlphabet('123456789ABCDEFGHJKLMNPQRSTUVWXYZ', 8)

export class CodeGenerator {
  static generate(): string {
    return generateCode()
  }
  
  static generateBatch(count: number): string[] {
    const codes = new Set<string>()
    
    while (codes.size < count) {
      codes.add(this.generate())
    }
    
    return Array.from(codes)
  }
  
  static validate(code: string): boolean {
    const pattern = /^[123456789ABCDEFGHJKLMNPQRSTUVWXYZ]{8}$/
    return pattern.test(code)
  }
}
