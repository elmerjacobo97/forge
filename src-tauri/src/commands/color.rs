#[tauri::command]
pub async fn pick_color(app: tauri::AppHandle) -> Result<String, String> {
    use std::cell::Cell;
    use block2::RcBlock;
    use objc2_app_kit::{NSColor, NSColorSampler, NSColorSpace};

    let (tx, rx) = tokio::sync::oneshot::channel::<Result<String, String>>();
    let tx = Cell::new(Some(tx));

    app.run_on_main_thread(move || {
        let sampler = NSColorSampler::new();
        let block = RcBlock::new(move |color: *mut NSColor| {
            let tx = match tx.take() {
                Some(t) => t,
                None => return,
            };
            if color.is_null() {
                let _ = tx.send(Err("cancelled".to_string()));
                return;
            }
            let color = unsafe { &*color };
            let srgb = match color.colorUsingColorSpace(&NSColorSpace::sRGBColorSpace()) {
                Some(c) => c,
                None => {
                    let _ = tx.send(Err("color space conversion failed".to_string()));
                    return;
                }
            };
            let r = (srgb.redComponent() * 255.0).round().clamp(0.0, 255.0) as u8;
            let g = (srgb.greenComponent() * 255.0).round().clamp(0.0, 255.0) as u8;
            let b = (srgb.blueComponent() * 255.0).round().clamp(0.0, 255.0) as u8;
            let _ = tx.send(Ok(format!("#{:02X}{:02X}{:02X}", r, g, b)));
        });
        unsafe { sampler.showSamplerWithSelectionHandler(&block) };
    })
    .map_err(|e| e.to_string())?;

    rx.await
        .map_err(|_| "sampler dropped".to_string())?
}
