use std::fs::File;
use std::io::Read;

#[tauri::command]
pub async fn read_file_bytes(path: String) -> Result<Vec<u8>, String> {
    let mut file = File::open(&path).map_err(|e| format!("Failed to open file: {e}"))?;
    let mut buffer = Vec::new();
    file.read_to_end(&mut buffer).map_err(|e| format!("Read error: {e}"))?;
    Ok(buffer)
}