use std::path::Path;
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
    use std::path::{Path, PathBuf};
    use std::process::Command;

    let is_windows = cfg!(target_os = "windows");
    let shell = if is_windows { "cmd" } else { "sh" };
    let shell_flag = if is_windows { "/C" } else { "-c" };

    println!("Launching: {} {}", id, executable);

    let parent = Path::new(&executable).parent().unwrap();
    let submodules_path = append_env_var("PYTHONPATH", "./tools");

    //
    // 👉 Helper to run commands cross-platform
    //
    let mut run = |cmd: Vec<String>, envs: Vec<(&str, String)>| {
        let joined = cmd.join(" ");
        let mut command = Command::new(shell);
        command.arg(shell_flag).arg(joined);

        for (k, v) in envs {
            command.env(k, v);
        }

        command.spawn().expect("Failed to launch process");
    };

    //
    // 1 — BLENDER
    //
    if id == "blender" {
        let load_script = Path::new("./tools/blender_studiotools/load.py")
            .canonicalize()
            .unwrap();
            
        let python_requirements = Path::new("./tools/blender_studiotools/requirements.txt")
            .canonicalize()
            .unwrap();

        //
        // Blender internal Python
        //
        if is_windows {

        } else {
        //
        // Linux: Blender bundles Python under:
        // <blender>/VERSION/python/bin/python3.X
        //
        println!("TEST");

            let blender_python_path = {
                // Find folder beginning with a digit, e.g. "5.0", "4.2", etc.
                let version_dir = std::fs::read_dir(parent)
                    .unwrap()
                    .filter_map(|e| e.ok())
                    .find(|entry| {
                        let binding = entry.file_name();
                        let name = binding.to_string_lossy();
                        name.chars().next().map(|c| c.is_ascii_digit()).unwrap_or(false)
                            && entry.path().join("python/bin").exists()
                    });

                if let Some(dir) = version_dir {
                    let bin = dir.path().join("python/bin");

                    let candidates = ["python3.11", "python3.10", "python3.9", "python3"];

                    let found = candidates
                        .iter()
                        .map(|c| bin.join(c))
                        .find(|p| p.exists());

                    found.unwrap_or_else(|| PathBuf::from("python3"))
                } else {
                    PathBuf::from("python3")
                }
            };

            println!("TEST");

            // Blender's Python often ships WITHOUT pip. Must run ensurepip first.
            run(
                vec![
                    blender_python_path.to_string_lossy().to_string(),
                    "-m".into(),
                    "ensurepip".into(),
                ],
                vec![],
            );

            // Now install your tools
            run(
                vec![
                    blender_python_path.to_string_lossy().to_string(),
                    "-m".into(),
                    "pip".into(),
                    "install".into(),
                    "-r".into(),
                    python_requirements.to_string_lossy().to_string(),
                ],
                vec![],
            );

        }

        run( 
            vec![ 
                executable.clone(), 
                path.clone(), 
                "--python-use-system-env".into(),
                 "--python".into(), 
                 load_script.to_string_lossy().to_string(), 
            ], 
            vec![
        ("PYTHONPATH", submodules_path.to_string()),
        ("INPIPE", "true".to_string()),  // or any value you want
    ],         );       
    }

    //
    // 3 — USDView
    //
    else if id == "usdview" {
        let usdview_cmd = if is_windows {
            vec![
                "hython".into(),
                "c:/Program Files/Side Effects Software/Houdini 20.5.332/bin/usdview".into(),
                path.clone(),
            ]
        } else {
            vec!["usdview".into(), path.clone()]
        };

        run(
            usdview_cmd,
            if is_windows {
                vec![(
                    "PATH",
                    "c:/Program Files/Side Effects Software/Houdini 20.5.332/bin".into(),
                )]
            } else {
                vec![]
            },
        );
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
