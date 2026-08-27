/**
 * FileReader double for DdlService.readSqlFile.
 *
 * `window.FileReader` is swapped manually rather than with `spyOn`, so it
 * MUST be restored in an afterEach - Jasmine only auto-restores its own spies.
 */
export class FakeFileReader {
  static last: FakeFileReader | null = null;

  onload: ((event: ProgressEvent<FileReader>) => void) | null = null;
  onerror: ((event: ProgressEvent<FileReader>) => void) | null = null;
  readAsTextCalledWith: Blob | null = null;

  readAsText(file: Blob): void {
    this.readAsTextCalledWith = file;
    FakeFileReader.last = this;
  }

  /** Fire the success arm with the given result (pass `undefined` for a null target). */
  fireLoad(result: string | undefined): void {
    const event = (result === undefined ? {} : { target: { result } }) as ProgressEvent<FileReader>;
    this.onload?.(event);
  }

  fireError(error: unknown): void {
    this.onerror?.(error as ProgressEvent<FileReader>);
  }
}

let originalFileReader: typeof FileReader | null = null;

export function installFakeFileReader(): void {
  originalFileReader = window.FileReader;
  FakeFileReader.last = null;
  (window as unknown as { FileReader: unknown }).FileReader = FakeFileReader;
}

export function restoreFileReader(): void {
  if (originalFileReader) {
    (window as unknown as { FileReader: unknown }).FileReader = originalFileReader;
    originalFileReader = null;
  }
}

/** The instance created by the most recent `new FileReader()`. */
export function lastFileReader(): FakeFileReader {
  if (!FakeFileReader.last) {
    throw new Error('No FakeFileReader was created - was readAsText called?');
  }
  return FakeFileReader.last;
}
