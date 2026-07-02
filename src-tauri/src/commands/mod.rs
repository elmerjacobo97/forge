pub mod hash_file;
pub mod read_file;
pub mod tray_menu;
pub mod git_status;
pub mod git_diff;
pub mod git_commit;
pub mod git_add;
pub mod git_unstage;

#[cfg(target_os = "macos")]
pub mod color;
