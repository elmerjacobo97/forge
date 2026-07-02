use std::fs;
use std::path::Path;
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

    let stdout = String::from_utf8_lossy(&output.stdout).into_owned();

    // `git diff` never shows untracked files — git only diffs content already
    // known to it. If the real diff came back empty, check whether this is a
    // brand-new untracked file and synthesize an "all lines added" diff so it
    // still previews instead of showing "No diff available".
    if stdout.is_empty() {
        if let Some(fp) = file_path_ref {
            if is_untracked(&repo_path, fp)? {
                return synth_new_file_diff(&repo_path, fp);
            }
        }
    }

    Ok(stdout)
}

fn is_untracked(repo_path: &str, file_path: &str) -> Result<bool, String> {
    let output = Command::new("git")
        .args(["-C", repo_path, "status", "--porcelain", "--", file_path])
        .output()
        .map_err(|e| format!("Failed to run git: {e}"))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("git status failed: {stderr}"));
    }

    Ok(String::from_utf8_lossy(&output.stdout).starts_with("??"))
}

/// Reads the file directly and formats a unified diff by hand — avoids
/// relying on `/dev/null` (not a real path on Windows) to represent "no
/// previous version" via `git diff --no-index`.
fn synth_new_file_diff(repo_path: &str, file_path: &str) -> Result<String, String> {
    let full_path = Path::new(repo_path).join(file_path);

    let content = match fs::read_to_string(&full_path) {
        Ok(c) => c,
        Err(_) => return Ok(format!("Binary file {file_path} (no diff preview available)\n")),
    };

    let line_count = content.lines().count();
    let mut out = String::new();
    out.push_str(&format!("diff --git a/{file_path} b/{file_path}\n"));
    out.push_str("new file mode 100644\n");
    out.push_str("--- /dev/null\n");
    out.push_str(&format!("+++ b/{file_path}\n"));
    out.push_str(&format!("@@ -0,0 +1,{line_count} @@\n"));
    for line in content.lines() {
        out.push('+');
        out.push_str(line);
        out.push('\n');
    }

    Ok(out)
}
