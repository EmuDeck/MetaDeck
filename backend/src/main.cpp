#include <iostream>
#include <filesystem>
#include <map>

#include "HashCHD.h"
#include "rc_hash.h"
#include "util.h"

bool has_extension(const std::filesystem::path &path, const std::string &findExt)
{
	std::string ext = path.extension();
	for (auto &c: ext)
	{
		c = tolower(c);
	}

	return ext.find(findExt) != std::string::npos;
}

std::string hash_file(const std::filesystem::path &path)
{
	char *buf = new char[33];

	auto *iterator = new rc_hash_iterator();

	if (has_extension(path, "chd"))
	{
		rc_hash_init_chd_cdreader();
	} else
	{
		rc_hash_init_default_cdreader();
	}

	rc_hash_initialize_iterator(iterator, path.c_str(), nullptr, 0);

	rc_hash_iterate(buf, iterator);

	rc_hash_destroy_iterator(iterator);
	std::string hash(buf);
	delete[] buf;
	delete iterator;
	return hash;
}

std::string hash(const std::filesystem::path &path)
{
	std::string hash;
	// Archive Type - Extract
	if (has_extension(path, "zip") || has_extension(path, "7z"))
	{
		auto extracted = util::extract(path.string());
		if (std::filesystem::is_regular_file(extracted))
		{
			hash = hash_file(extracted);
			std::filesystem::remove_all(extracted.parent_path());
		} else
		{
			hash = hash_file(path);
			std::filesystem::remove_all(extracted);
		}
		return hash;	
	}
	// Other - Just Hash The File (Includes .iso, etc.)
	else
	{
		hash = hash_file(path);
		return hash;
	}
}

int main(int argc, char **argv)
{
	if (argc != 2)
	{
		return 1;
	}

	std::filesystem::path path(argv[1]);
	std::cout << hash(path) << std::endl;
	return 0;
}