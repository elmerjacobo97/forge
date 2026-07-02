use std::process::Command;

#[tauri::command]
pub async fn git_unstage(repo_path: String, files: Vec<String>) -> Result<(), String> {
    if files.is_empty() {
        return Ok(());
    }

    let restore = Command::new("git")
        .args(["-C", &repo_path, "restore", "--staged", "--"])
        .args(&files)
        .output()
        .map_err(|e| format!("Failed to run git restore: {e}"))?;

    if restore.status.success() {
        return Ok(());
    }

    let stderr = String::from_utf8_lossy(&restore.stderr).into_owned();

    // Repos with no commits yet have no HEAD to restore from — the file was
    // only ever added to the (still-empty) index, so drop it back out instead.
    if stderr.contains("HEAD") {
        let rm = Command::new("git")
            .args(["-C", &repo_path, "rm", "--cached", "-q", "--"])
            .args(&files)
            .status()
            .map_err(|e| format!("Failed to run git rm --cached: {e}"))?;

        if rm.success() {
            return Ok(());
        }
    }

    Err(format!("git unstage failed: {stderr}"))
}
