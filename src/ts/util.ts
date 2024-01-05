import {runInAction} from "mobx";

export function stateTransaction(block: () => void) {
	const prev: boolean = window["__mobxGlobals"].allowStateChanges
	window["__mobxGlobals"].allowStateChanges = true
	runInAction(block)
	window["__mobxGlobals"].allowStateChanges = prev
}