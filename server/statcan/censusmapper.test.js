import { describe, it, expect } from 'vitest';
import { parseCsv, numeric, toDauid } from './censusmapper.js';

describe('parseCsv', () => {
  it('parses simple rows', () => {
    expect(parseCsv('a,b,c\n1,2,3\n')).toEqual([
      ['a', 'b', 'c'],
      ['1', '2', '3'],
    ]);
  });

  it('handles quoted fields with embedded commas', () => {
    expect(parseCsv('name,note\n1,"hello, world"\n')).toEqual([
      ['name', 'note'],
      ['1', 'hello, world'],
    ]);
  });

  it('unescapes doubled quotes inside quoted fields', () => {
    expect(parseCsv('x,y\n"she said ""hi""",2\n')).toEqual([
      ['x', 'y'],
      ['she said "hi"', '2'],
    ]);
  });

  it('tolerates CRLF line endings', () => {
    expect(parseCsv('a,b\r\n1,2\r\n')).toEqual([
      ['a', 'b'],
      ['1', '2'],
    ]);
  });

  it('does not emit a phantom trailing row when input lacks a final newline', () => {
    expect(parseCsv('a,b\n1,2')).toEqual([
      ['a', 'b'],
      ['1', '2'],
    ]);
  });

  it('drops single-column rows (a known quirk of the parser filter)', () => {
    expect(parseCsv('only\n1\n')).toEqual([]);
  });
});

describe('numeric', () => {
  it('parses numbers, stripping $ , and quotes', () => {
    expect(numeric('1,234')).toBe(1234);
    expect(numeric('$95,000')).toBe(95000);
    expect(numeric('"42"')).toBe(42);
  });

  it('treats StatCan suppression markers and blanks as 0', () => {
    expect(numeric('x')).toBe(0);
    expect(numeric('F')).toBe(0);
    expect(numeric('')).toBe(0);
    expect(numeric(null)).toBe(0);
    expect(numeric('abc')).toBe(0);
  });
});

describe('toDauid', () => {
  it('extracts the trailing 8 digits of a DGUID', () => {
    expect(toDauid('2021S051235180319')).toBe('35180319');
  });

  it('returns null for non-strings or malformed input', () => {
    expect(toDauid(12345678)).toBeNull();
    expect(toDauid('short')).toBeNull();
    expect(toDauid(null)).toBeNull();
  });
});
