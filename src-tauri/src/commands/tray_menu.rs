use tauri::AppHandle;

#[tauri::command]
pub fn update_tray_menu(
    app: AppHandle,
    categories: Vec<crate::tray::CategoryMenuEntry>,
) -> Result<(), String> {
    crate::tray::rebuild_menu(&app, categories).map_err(|e| e.to_string())
}
