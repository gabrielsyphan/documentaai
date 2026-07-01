fn main() {
    if cfg!(target_os = "macos") {
        println!("cargo:rustc-link-lib=framework=AVFoundation");
        println!("cargo:rustc-link-lib=framework=Speech");
    }
    tauri_build::build()
}
