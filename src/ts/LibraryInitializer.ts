import {sleep} from "@decky/ui";

export function registerForLoginStateChange(onLogin: (username: string) => void, onLogout: () => void): () => void {
	try {
		let isLoggedIn: boolean | null = null;
		let unregister =  SteamClient.User.RegisterForLoginStateChange((username: string) => {
			if (username === "") {
				if (isLoggedIn !== false) {
					onLogout();
				}
				isLoggedIn = false;
			} else {
				if (isLoggedIn !== true) {
					onLogin(username);
				}
				isLoggedIn = true;
			}
		}).unregister;
		return (() => {
			unregister();
			onLogout();
		})
	} catch (error) {
		console.error(error);
		// eslint-disable-next-line @typescript-eslint/no-empty-function
		return () => { };
	}
}

export async function waitForPredicate(retries: number, delay: number, predicate: () => (boolean | Promise<boolean>)): Promise<boolean> {
	const waitImpl = async (): Promise<boolean> => {
		try {
			let tries = retries + 1;
			while (tries-- !== 0) {
				if (await predicate()) {
					return true;
				}

				if (tries > 0) {
					await sleep(delay);
				}
			}
		} catch (error) {
			console.error(error);
		}

		return false;
	};

	return await waitImpl();
}

/**
 * Waits until the services are initialized.
 */
export async function waitForServicesInitialized(): Promise<boolean> {
	type WindowEx = Window & { App?: { WaitForServicesInitialized?: () => Promise<boolean> } };
	await waitForPredicate(20, 250, () => (window as WindowEx).App?.WaitForServicesInitialized != null);

	return (await (window as WindowEx).App?.WaitForServicesInitialized?.()) ?? false;
}