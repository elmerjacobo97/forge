use std::process::Command;

#[tauri::command]
pub async fn git_commit(
    repo_path: String,
    files: Vec<String>,
    message: String,
) -> Result<String, String> {
    // Stage selected files
    if files.is_empty() {
        return Err("No files selected to commit.".to_string());
    }

    let add_status = Command::new("git")
        .args(["-C", &repo_path, "add", "--"])
        .args(&files)
        .status()
        .map_err(|e| format!("Failed to run git add: {e}"))?;

    if !add_status.success() {
        return Err("git add failed. Check file paths.".to_string());
    }

    // Commit with the provided message
    let commit_output = Command::new("git")
        .args(["-C", &repo_path, "commit", "-m", &message])
        .output()
        .map_err(|e| format!("Failed to run git commit: {e}"))?;

    if !commit_output.status.success() {
        let stderr = String::from_utf8_lossy(&commit_output.stderr);
        return Err(format!("git commit failed: {stderr}"));
    }

    // Return the short commit hash
    let hash_output = Command::new("git")
        .args(["-C", &repo_path, "rev-parse", "--short", "HEAD"])
        .output()
        .map_err(|e| format!("Failed to read commit hash: {e}"))?;

    let hash = String::from_utf8_lossy(&hash_output.stdout)
        .trim()
        .to_string();

    Ok(hash)
}
