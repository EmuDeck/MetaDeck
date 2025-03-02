import os


async def read_file(path: str) -> str:
	with open(path, "r") as f:
		return f.read()

async def file_size(path: str) -> int:
	if os.path.exists(path):
		return os.path.getsize(path)
	else:
		return 0

async def file_date(path: str) -> int:
	if os.path.exists(path):
		return int(os.path.getctime(path))
	else:
		return 0

async def directory_size(path: str) -> int:
	total_size = 0
	if os.path.exists(path):
		for dirpath, dirnames, filenames in os.walk(path):
			for f in filenames:
				fp = os.path.join(dirpath, f)
				# Skip if it is symbolic link
				if not os.path.islink(fp):
					total_size += os.path.getsize(fp)
	return total_size