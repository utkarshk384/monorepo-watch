export function convertPath(root: string, absPath: string): string {
	const fullPath = absPath.replace(root, "")
	return fullPath
}

export function isAsync(fn?: unknown): boolean {
	const AsyncFunction = (async () => {
		return
	}).constructor

	return fn instanceof AsyncFunction
}

export class Observable<T> {
	public readonly value: T
	public valueChangedCallback: ((val: T) => void) | null
	constructor(value: T) {
		this.value = value
		this.valueChangedCallback = null
	}

	public setValue(value: ((val: T) => T) | T): void {
		let val: T

		if (typeof value === "boolean") val = value
		else val = (value as (val: T) => T)(this.value)

		if (this.value != val) {
			;(this.value as T) = val
			this.raiseChangedEvent(val)
		}
	}

	public onChange(callback: (value: T) => void): void {
		this.valueChangedCallback = callback
	}

	public raiseChangedEvent(value: T): void {
		if (this.valueChangedCallback) {
			this.valueChangedCallback(value)
		}
	}
}
