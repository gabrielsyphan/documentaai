// Prevents additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    // Must run before GTK/GDK initializes (which happens inside tauri::Builder).
    // On Wayland + AppImage, WebKit2GTK's renderer subprocess tries to connect
    // to the Wayland socket, which the AppImage sandbox blocks → entire window
    // goes black. Removing WAYLAND_DISPLAY forces all subprocesses to use
    // X11 (XWayland). Disabling compositing and DMA-BUF prevents GPU renderer
    // failures on common Linux drivers.
    #[cfg(target_os = "linux")]
    {
        std::env::remove_var("WAYLAND_DISPLAY");
        std::env::set_var("GDK_BACKEND", "x11");
        std::env::set_var("WEBKIT_DISABLE_COMPOSITING_MODE", "1");
        std::env::set_var("WEBKIT_DISABLE_DMABUF_RENDERER", "1");
    }

    documentaai_lib::run()
}
