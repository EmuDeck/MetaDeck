//
// Created by witherking25 on 1/10/23.
//

#include <cstddef>
#include <string>

#pragma once

namespace util
{
	std::filesystem::path unzip(const std::string &zipPath);
	std::filesystem::path extract(const std::string &zipPath);
} // util