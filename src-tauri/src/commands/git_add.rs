use std::process::Command;

#[tauri::command]
pub async fn git_add(repo_path: String, files: Vec<String>) -> Result<(), String> {
    if files.is_empty() {
        return Ok(());
    }

    let status = Command::new("git")
        .args(["-C", &repo_path, "add", "--"])
        .args(&files)
        .status()
        .map_err(|e| format!("Failed to run git add: {e}"))?;

    if !status.success() {
        return Err("git add failed. Check file paths.".to_string());
    }

    Ok(())
}
