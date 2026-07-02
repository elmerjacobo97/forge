use std::process::Command;

#[tauri::command]
pub async fn git_diff(
    repo_path: String,
    file_path: Option<String>,
    staged: bool,
) -> Result<String, String> {
    let mut args = vec!["-C", &repo_path, "diff"];

    if staged {
        args.push("--cached");
    }

    // Add some context and color-safe output
    args.push("--unified=5");

    let file_path_ref: Option<&str> = file_path.as_deref();

    let output = if let Some(fp) = file_path_ref {
        Command::new("git")
            .args(&args)
            .arg("--")
            .arg(fp)
            .output()
            .map_err(|e| format!("Failed to run git: {e}"))?
    } else {
        Command::new("git")
            .args(&args)
            .output()
            .map_err(|e| format!("Failed to run git: {e}"))?
    };

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("git diff failed: {stderr}"));
    }

    Ok(String::from_utf8_lossy(&output.stdout).into_owned())
}
