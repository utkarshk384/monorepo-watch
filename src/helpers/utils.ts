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
	private value: T
	public valueChangedCallback: ((val: T) => void) | null
	constructor(value: T) {
		this.value = value
		this.valueChangedCallback = null
	}

	public setValue(value: T): void {
		if (this.value != value) {
			this.value = value
			this.raiseChangedEvent(value)
		}
	}

	public getValue(): T {
		return this.value
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
