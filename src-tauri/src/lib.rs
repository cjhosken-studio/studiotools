use std::process::Command;
use std::path::Path;

#[tauri::command]
fn launch(executable: String, id: String, path: String) {
    let submodules_path = Path::new("./tools").canonicalize().unwrap();
    #[cfg(target_os = "windows")]
    {
        if id == "blender" {
            let load_script = Path::new("./tools/blender_studiotools/load.py").canonicalize().unwrap();
            Command::new("cmd")
                .env("PYTHONPATH", submodules_path)
                .args(&[
                    "/C",
                    &executable,
                    &path.as_str(),
                    "--python-use-system-env",
                    "--python", load_script.to_str().unwrap()
                ])
                .spawn()
                .unwrap();
        } else if id == "usdview" {
            Command::new("cmd")
                .env("PATH","c:/Program Files/Side Effects Software/Houdini 20.5.332/bin" )
                .args(&[
                    "/C",
                    "hython",
                    "c:/Program Files/Side Effects Software/Houdini 20.5.332/bin/usdview",
                    &path
                ])
                .spawn()
                .unwrap();
        } 
        else {
            Command::new("cmd")
                .args(&["/C", &executable, &path])
                .spawn()
                .unwrap();
        }
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![launch])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
