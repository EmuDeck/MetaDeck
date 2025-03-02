//
// Created by witherking25 on 1/10/23.
//

#include <filesystem>
#include <archive.h>
#include <archive_entry.h>
#include "util.h"

static int copy_data(struct archive *ar, struct archive *aw) {
    int r;
    const void *buff;
    size_t size;
    off_t offset;

    for (;;) {
        r = archive_read_data_block(ar, &buff, &size, &offset);
        if (r == ARCHIVE_EOF)
            return (ARCHIVE_OK);
        if (r < ARCHIVE_OK)
            return (r);
        r = archive_write_data_block(aw, buff, size, offset);
        if (r < ARCHIVE_OK) {
            fprintf(stderr, "%s\n", archive_error_string(aw));
            return (r);
        }
    }
}

std::filesystem::path util::extract(const std::string &archivePath) {
    char template_path[] = "/tmp/tmpdir.XXXXXX";
    std::string unzippedPath = std::string(mkdtemp(template_path)) + "/";
    struct archive *a;
    struct archive *ext;
    struct archive_entry *entry;
    int flags;
    int r;
    bool failed = false;
    std::filesystem::path *default_file = nullptr;

    /* Select which attributes we want to restore. */
    flags = ARCHIVE_EXTRACT_TIME;
    flags |= ARCHIVE_EXTRACT_PERM;
    flags |= ARCHIVE_EXTRACT_ACL;
    flags |= ARCHIVE_EXTRACT_FFLAGS;

    a = archive_read_new();
	archive_read_support_filter_all(a);
	archive_read_support_format_all(a);
    ext = archive_write_disk_new();
    archive_write_disk_set_options(ext, flags);
    archive_write_disk_set_standard_lookup(ext);
    if ((archive_read_open_filename(a, archivePath.c_str(), 10240)))
        failed = true;
    if (!failed)
        for (;;) {
            r = archive_read_next_header(a, &entry);
            if (r == ARCHIVE_EOF)
                break;
            if (r < ARCHIVE_OK)
                fprintf(stderr, "%s\n", archive_error_string(a));
            if (r < ARCHIVE_WARN) {
                failed = true;
                break;
            }
            std::filesystem::path path = unzippedPath +
                    archive_entry_pathname(entry);
            if (default_file == nullptr)
                default_file = new std::filesystem::path(path);
            archive_entry_set_pathname(entry, path.c_str());
            r = archive_write_header(ext, entry);
            if (r < ARCHIVE_OK)
                fprintf(stderr, "%s\n", archive_error_string(ext));
            else if (archive_entry_size(entry) > 0) {
                r = copy_data(a, ext);
                if (r < ARCHIVE_OK)
                    fprintf(stderr, "%s\n", archive_error_string(a));
                if (r < ARCHIVE_WARN) {
                    failed = true;
                    break;
                }

            }
            r = archive_write_finish_entry(ext);
            if (r < ARCHIVE_OK)
                fprintf(stderr, "%s\n", archive_error_string(ext));
            if (r < ARCHIVE_WARN) {
                failed = true;
                break;
            }
        }
    archive_read_close(a);
    archive_read_free(a);
    archive_write_close(ext);
    archive_write_free(ext);
    if (failed) return unzippedPath;
    if (default_file != nullptr) return {default_file->c_str()};
    return {unzippedPath.c_str()};
}
