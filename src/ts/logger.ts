export const log = (name: string) => {
	return console.log.bind(
			window.console,
			`%c MetaDeck %c ${name} %c`,
			'background: #16a085; color: black;',
			'background: #1abc9c; color: black;',
			'background: transparent;',
	);
};

export const debug = (name: string) => {
	if (process.env.NODE_ENV === 'development')
		return console.debug.bind(window.console,
				`%c MetaDeck %c ${name} %c`,
				'background: #16a085; color: black;',
				'background: #1abc9c; color: black;',
				'color: blue;');
	else return function(..._: any[]){}
}

export const error = (name: string) => {
	return console.error.bind(window.console,
			`%c MetaDeck %c ${name} %c`,
			'background: #16a085; color: black;',
			'background: #FF0000;',
			'background: transparent;'
	);
};

class Logger
{
	get log(): any
	{
		return this._log;
	}
	get debug(): any
	{
		return this._debug;
	}
	get error(): any
	{
		return this._error;
	}
	constructor(private readonly name: string)
	{
		this.name = name;
	}

	private _log = log.bind(this)(this.name).bind(this);

	private _debug = debug.bind(this)(this.name).bind(this);

	private _error = error.bind(this)(this.name).bind(this);
}

export default Logger;