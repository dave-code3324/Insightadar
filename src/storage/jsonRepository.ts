import { mkdir, rename, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

export class JsonRepository<T> {
  readonly #filePath: string;

  constructor(filePath: string) {
    this.#filePath = filePath;
  }

  async save(records: readonly T[]): Promise<void> {
    await mkdir(dirname(this.#filePath), { recursive: true });
    const temporaryPath = `${this.#filePath}.tmp`;
    await writeFile(temporaryPath, `${JSON.stringify(records, null, 2)}\n`, "utf8");
    await rename(temporaryPath, this.#filePath);
  }
}
