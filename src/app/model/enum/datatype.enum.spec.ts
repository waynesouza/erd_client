import { DataType } from './datatype.enum';

/*
 * Every other file in src/app/model declares only interfaces, which TypeScript
 * erases at compile time - they emit no JavaScript and are correctly invisible
 * to Istanbul, exactly as JaCoCo does not report a Java interface.
 *
 * This enum is the one exception: it compiles to an IIFE and so it IS measured.
 * The IIFE runs on import, which is what covers the file.
 */
describe('DataType', () => {
  it('should expose every supported SQL type', () => {
    expect(Object.keys(DataType).length).toBe(12);
  });

  it('should map each member to its own name', () => {
    Object.entries(DataType).forEach(([key, value]) => expect(value).toBe(key));
  });

  it('should expose the numeric types used by the validation rules', () => {
    expect(DataType.INTEGER).toBe('INTEGER' as DataType);
    expect(DataType.BIGINT).toBe('BIGINT' as DataType);
    expect(DataType.DECIMAL).toBe('DECIMAL' as DataType);
    expect(DataType.NUMERIC).toBe('NUMERIC' as DataType);
  });
});
