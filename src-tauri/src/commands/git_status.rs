use serde::Serialize;
use std::process::Command;

#[derive(Debug, Serialize, Clone)]
pub struct GitFile {
    pub path: String,
    /// Two-letter porcelain status: index char + worktree char (e.g. " M", "A ", "??")
    pub status: String,
    pub staged: bool,
    pub unstaged: bool,
}

#[tauri::command]
pub async fn git_status(repo_path: String) -> Result<Vec<GitFile>, String> {
    let output = Command::new("git")
        .args(["-C", &repo_path, "status", "--porcelain", "-u"])
        .output()
        .map_err(|e| format!("Failed to run git: {e}"))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("git status failed: {stderr}"));
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    let files = stdout
        .lines()
        .filter(|line| line.len() >= 3)
        .map(|line| {
            let index_char = line.chars().next().unwrap_or(' ');
            let worktree_char = line.chars().nth(1).unwrap_or(' ');
            let path = line[3..].to_string();
            // Handle renames: "old -> new" — take just the new path
            let path = if let Some(arrow) = path.find(" -> ") {
                path[arrow + 4..].to_string()
            } else {
                path
            };
            let status = format!("{}{}", index_char, worktree_char);
            let staged = index_char != ' ' && index_char != '?';
            let unstaged = worktree_char != ' ';
            GitFile {
                path,
                status,
                staged,
                unstaged,
            }
        })
        .collect();

    Ok(files)
}
