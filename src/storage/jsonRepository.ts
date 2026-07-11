import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

export class JsonRepository<T> {
  readonly #filePath: string;

  constructor(filePath: string) {
    this.#filePath = filePath;
  }

  async read(): Promise<T[]> {
    const contents = await readFile(this.#filePath, "utf8");
    const parsed: unknown = JSON.parse(contents);
    if (!Array.isArray(parsed))
      throw new Error(`${this.#filePath} ne contient pas un tableau JSON.`);
    return parsed as T[];
  }

  async save(records: readonly T[]): Promise<void> {
    await this.saveValue(records);
  }

  async saveValue(value: unknown): Promise<void> {
    await mkdir(dirname(this.#filePath), { recursive: true });
    const temporaryPath = `${this.#filePath}.tmp`;
    await writeFile(temporaryPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
    await rename(temporaryPath, this.#filePath);
  }
}
