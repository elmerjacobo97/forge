mod commands;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            commands::hash_file::hash_file,
            #[cfg(target_os = "macos")]
            commands::color::pick_color,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
