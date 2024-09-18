import {runInAction} from "mobx";

export function stateTransaction(block: () => void) {
	// @ts-ignore
	const prev: boolean = window["__mobxGlobals"].allowStateChanges
	// @ts-ignore
	window["__mobxGlobals"].allowStateChanges = true
	runInAction(block)
	// @ts-ignore
	window["__mobxGlobals"].allowStateChanges = prev
}