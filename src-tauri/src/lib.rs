use std::process::Command;
use std::path::Path;
use std::fs;
use std::env;

#[cfg(windows)]
const SEP: &str = ";";
#[cfg(unix)]
const SEP: &str = ":";

fn append_env_var(key: &str, value: &str) -> String {
    let current = env::var(key).unwrap_or_default();
    if current.is_empty() {
        value.to_string()
    } else {
        format!("{}{}{}", current, SEP, value)
    }
}


#[tauri::command]
fn symlink(asset: String, symlink: String) -> Result<(), String> {
    let asset_path = Path::new(&asset);
    let link_path = Path::new(&symlink);
    
    
    #[cfg(target_os = "windows")]
    {
        if let Err(e) = std::os::windows::fs::symlink_dir(asset_path, link_path) {
            return Err(format!("failed to create symlink: {}", e));
        }
    }

    Ok(())
}

#[tauri::command]
fn launch(executable: String, id: String, path: String) {
    let submodules_path = append_env_var("PYTHONPATH", "./tools");
    let parent = Path::new(&executable).parent().unwrap();


    #[cfg(target_os = "windows")]
    {
        if id == "blender" {
            let load_script = Path::new("./tools/blender_studiotools/load.py").canonicalize().unwrap();
            let python_requirements = Path::new("./tools/blender_studiotools/requirements.txt").canonicalize().unwrap();
            
            let version_dir = fs::read_dir(parent).ok()
                .and_then(|entries| {
                    entries.filter_map(|entry| entry.ok())
                        .find(|entry| {
                            entry.file_type().map(|ft| ft.is_dir()).unwrap_or(false)
                                && entry.file_name().to_string_lossy().chars().next().unwrap_or(' ').is_ascii_digit()
                        })
                })
                .expect("Could not find Blender version directory");
            
            let blender_python_path = version_dir.path()
                .join("python")
                .join("bin")
                .join("python.exe");

            Command::new("cmd")
                .args(&[
                    "/C",
                    blender_python_path.to_str().unwrap(),
                    "-m",
                    "pip",
                    "install",
                    "-r", 
                    python_requirements.to_str().unwrap()
                ])
                .spawn()
                .unwrap();

            Command::new("cmd")
                .env("PYTHONPATH", submodules_path.to_string())
                .args(&[
                    "/C",
                    &executable,
                    &path.as_str(),
                    "--python-use-system-env",
                    "--python", load_script.to_str().unwrap()
                ])
                .spawn()
                .unwrap();
        }
        else if id == "houdini" {
            let load_script = Path::new("./tools/houdini_studiotools/load.py").canonicalize().unwrap();
            let toolbar_path = append_env_var("HOUDINI_TOOLBAR_PATH", &format!("./tools/houdini_studiotools/houdini/toolbar{}&", SEP));
            let otlscan_path = append_env_var("HOUDINI_OTLSCAN_PATH", &format!("./tools/houdini_studiotools/houdini/otls{}&", SEP));
            let menu_path = append_env_var("HOUDINI_MENU_PATH", &format!("./tools/houdini_studiotools/houdini{}&", SEP));
            let hython = parent.join("hython.exe");
            

            Command::new("cmd")
                .args(&["/C", hython.to_str().unwrap(), load_script.to_str().unwrap(), &path])
                .spawn()
                .unwrap();

            Command::new("cmd")
                .env("PYTHONPATH", submodules_path.to_string())
                .env("HOUDINI_TOOLBAR_PATH", toolbar_path.to_string())
                .env("HOUDINI_OTLSCAN_PATH", otlscan_path.to_string())
                .env("HOUDINI_MENU_PATH", menu_path.to_string())
                .args(&["/C", &executable, &path])
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
        .invoke_handler(tauri::generate_handler![launch, symlink])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
