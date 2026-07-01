use tauri::menu::{IsMenuItem, Menu, MenuItem, PredefinedMenuItem, Submenu};
use tauri::tray::TrayIconBuilder;
use tauri::{AppHandle, Emitter};

pub const TRAY_ID: &str = "main-tray";

#[derive(serde::Deserialize)]
pub struct ToolMenuEntry {
    pub path: String,
    pub name: String,
}

#[derive(serde::Deserialize)]
pub struct CategoryMenuEntry {
    pub name: String,
    pub tools: Vec<ToolMenuEntry>,
}

pub fn build_tray(app: &AppHandle) -> tauri::Result<()> {
    let show_item = MenuItem::with_id(app, "show", "Show Forge", true, None::<&str>)?;
    let quit_item = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
    let menu = Menu::with_items(app, &[&show_item, &quit_item])?;

    // Click (any button) always opens the menu — never jumps straight to the
    // window. The menu itself carries "Show Forge" as an entry, same as apps
    // like Wispr Flow/Notion's tray icons.
    TrayIconBuilder::with_id(TRAY_ID)
        .icon(app.default_window_icon().unwrap().clone())
        .tooltip("Forge")
        .menu(&menu)
        .show_menu_on_left_click(true)
        .on_menu_event(|app, event| match event.id.as_ref() {
            "show" => crate::window::show_and_focus_main(app),
            "quit" => app.exit(0),
            // Anything else is a tool path (see rebuild_menu) — jump straight to it.
            path => {
                crate::window::show_and_focus_main(app);
                let _ = app.emit("navigate", path);
            }
        })
        .build(app)?;
    Ok(())
}

/// Replaces the tray menu with: Show Forge, a submenu per tool category,
/// then Quit. Called from the frontend on startup with the live `tools.ts`
/// list so the tray never drifts out of sync with the tools registry.
pub fn rebuild_menu(app: &AppHandle, categories: Vec<CategoryMenuEntry>) -> tauri::Result<()> {
    let mut submenus: Vec<Submenu<tauri::Wry>> = Vec::new();
    for category in &categories {
        let mut items: Vec<MenuItem<tauri::Wry>> = Vec::new();
        for tool in &category.tools {
            items.push(MenuItem::with_id(
                app,
                tool.path.as_str(),
                tool.name.as_str(),
                true,
                None::<&str>,
            )?);
        }
        let item_refs: Vec<&dyn IsMenuItem<tauri::Wry>> =
            items.iter().map(|i| i as &dyn IsMenuItem<tauri::Wry>).collect();
        submenus.push(Submenu::with_items(
            app,
            category.name.as_str(),
            true,
            &item_refs,
        )?);
    }

    let show_item = MenuItem::with_id(app, "show", "Show Forge", true, None::<&str>)?;
    let quit_item = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
    let top_separator = PredefinedMenuItem::separator(app)?;
    let bottom_separator = PredefinedMenuItem::separator(app)?;

    let mut menu_items: Vec<&dyn IsMenuItem<tauri::Wry>> = vec![&show_item, &top_separator];
    for submenu in &submenus {
        menu_items.push(submenu);
    }
    menu_items.push(&bottom_separator);
    menu_items.push(&quit_item);

    let menu = Menu::with_items(app, &menu_items)?;

    if let Some(tray) = app.tray_by_id(TRAY_ID) {
        tray.set_menu(Some(menu))?;
    }
    Ok(())
}
