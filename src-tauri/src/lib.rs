mod commands;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_deep_link::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .invoke_handler(tauri::generate_handler![
            commands::hash_file::hash_file,
            commands::read_file::read_file_bytes,
            #[cfg(target_os = "macos")]
            commands::color::pick_color,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
