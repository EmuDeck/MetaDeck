cmake_minimum_required(VERSION 3.22)
project(hash CXX C)
set(CMAKE_CXX_STANDARD 17)
set(${PROJECT_NAME}_SOURCE
        src/main.cpp
        src/util.cpp
        src/HashCHD.cpp
)

set(RCHEEVOS_SOURCE
        src/rcheevos/src/rc_compat.c
        src/rcheevos/src/rhash/cdreader.c
        src/rcheevos/src/rhash/aes.c
        src/rcheevos/src/rhash/hash.c
        src/rcheevos/src/rhash/md5.c
)


add_subdirectory(${PROJECT_SOURCE_DIR}/src/libchdr)
set(BUILD_SHARED_LIBS OFF CACHE BOOL "disable libarchive shared libs")
set(ENABLE_TAR OFF CACHE BOOL "disable libarchive tar binary")
set(ENABLE_CPIO OFF CACHE BOOL "disable libarchive cpio binary")
set(ENABLE_CAT OFF CACHE BOOL "disable libarchive cat binary")
set(ENABLE_UNZIP OFF CACHE BOOL "disable libarchive unzip binary")
set(ENABLE_TEST OFF CACHE BOOL "disable libarchive unit tests")
add_subdirectory(${PROJECT_SOURCE_DIR}/src/libarchive)

add_executable(${PROJECT_NAME}
        ${${PROJECT_NAME}_SOURCE}
        ${RCHEEVOS_SOURCE}
)

target_link_libraries(${PROJECT_NAME} chdr-static archive_static)

target_include_directories(${PROJECT_NAME}
        PRIVATE
        src/rcheevos/include
)

